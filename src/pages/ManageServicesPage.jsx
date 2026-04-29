import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { servicesAPI } from '../services/api';
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export default function ManageServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    file_activee: true,
    rdv_active: false,
    temps_traitement_moyen: 15,
    nombre_guichets: 1
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const servicesResponse = await servicesAPI.getByEtablissement(user.etablissement_id);
      setServices(servicesResponse.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nom: service.nom,
        file_activee: service.file_activee,
        rdv_active: service.rdv_active,
        temps_traitement_moyen: service.temps_traitement_moyen,
        nombre_guichets: service.nombre_guichets
      });
    } else {
      setEditingService(null);
      setFormData({
        nom: '',
        file_activee: true,
        rdv_active: false,
        temps_traitement_moyen: 15,
        nombre_guichets: 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast.error('Le nom du service est requis');
      return;
    }

    try {
      setSubmitting(true);

      if (editingService) {
        // Modifier
        await servicesAPI.update(editingService._id, formData);
        toast.success('Service modifié avec succès !');
      } else {
        // Créer
        await servicesAPI.create({
          ...formData,
          etablissement: user.etablissement_id
        });
        toast.success('Service créé avec succès !');
      }

      handleCloseModal();
      fetchData();

    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      await servicesAPI.delete(serviceId);
      toast.success('Service supprimé avec succès !');
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleActif = async (serviceId) => {
    try {
      await servicesAPI.toggleActif(serviceId);
      toast.success('Statut modifié avec succès !');
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const getServiceTypeBadge = (service) => {
    if (service.file_activee && service.rdv_active) {
      return <Badge className="bg-purple-600">File & RDV</Badge>;
    } else if (service.file_activee) {
      return <Badge className="bg-blue-600">File d'attente</Badge>;
    } else if (service.rdv_active) {
      return <Badge className="bg-pink-600">RDV uniquement</Badge>;
    }
    return <Badge className="bg-gray-400">Inactif</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Services</h1>
              <p className="text-gray-600">Créez et gérez les services de votre établissement</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Service
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {services.length === 0 ? (
            <Card className="p-12 text-center">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun service
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre premier service
              </p>
              <Button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer un service
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {service.nom}
                          </h3>
                          {getServiceTypeBadge(service)}
                          <Badge 
                            className={service.statut === 'actif' ? 'bg-green-600' : 'bg-gray-400'}
                          >
                            {service.statut === 'actif' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Temps moyen :</span>
                            <span className="font-semibold text-gray-900 ml-2">
                              {service.temps_traitement_moyen} min
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Guichets :</span>
                            <span className="font-semibold text-gray-900 ml-2">
                              {service.nombre_guichets}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">File :</span>
                            <span className={`font-semibold ml-2 ${service.file_activee ? 'text-green-600' : 'text-gray-400'}`}>
                              {service.file_activee ? 'Activée' : 'Désactivée'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">RDV :</span>
                            <span className={`font-semibold ml-2 ${service.rdv_active ? 'text-green-600' : 'text-gray-400'}`}>
                              {service.rdv_active ? 'Activé' : 'Désactivé'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => handleToggleActif(service._id)}
                          variant="outline"
                          size="icon"
                        >
                          {service.statut === 'actif' ? (
                            <X className="w-4 h-4 text-orange-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </Button>

                        <Button
                          onClick={() => handleOpenModal(service)}
                          variant="outline"
                          size="icon"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le service ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer "{service.nom}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(service._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal Créer/Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Modifier le service' : 'Nouveau service'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du service *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ex: Consultation Générale"
                  required
                />
              </div>

              {/* Type de service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de service
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.file_activee}
                      onChange={(e) => setFormData({ ...formData, file_activee: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-700">File d'attente</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rdv_active}
                      onChange={(e) => setFormData({ ...formData, rdv_active: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-700">Rendez-vous</span>
                  </label>
                </div>
              </div>

              {/* Temps de traitement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps de traitement moyen (minutes)
                </label>
                <input
                  type="number"
                  value={formData.temps_traitement_moyen}
                  onChange={(e) => setFormData({ ...formData, temps_traitement_moyen: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  min="1"
                  required
                />
              </div>

              {/* Nombre de guichets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de guichets
                </label>
                <input
                  type="number"
                  value={formData.nombre_guichets}
                  onChange={(e) => setFormData({ ...formData, nombre_guichets: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  min="1"
                  required
                />
              </div>

              {/* Boutons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    editingService ? 'Modifier' : 'Créer'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}