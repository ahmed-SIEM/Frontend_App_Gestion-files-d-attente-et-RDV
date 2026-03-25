import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { agentsAPI, servicesAPI, etablissementsAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Mail,
  Phone,
  UserPlus,
  X
} from 'lucide-react';
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

export default function ManageAgentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [establishment, setEstablishment] = useState(null);
  const [agents, setAgents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    service: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [estResponse, agentsResponse, servicesResponse] = await Promise.all([
        etablissementsAPI.getById(user.etablissement),
        agentsAPI.getByEtablissement(user.etablissement),
        servicesAPI.getByEtablissement(user.etablissement)
      ]);
      
      setEstablishment(estResponse.data);
      setAgents(agentsResponse.data);
      setServices(servicesResponse.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        prenom: agent.prenom,
        nom: agent.nom,
        email: agent.email,
        telephone: agent.telephone,
        mot_de_passe: '',
        service: agent.service?._id || ''
      });
    } else {
      setEditingAgent(null);
      setFormData({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        mot_de_passe: '',
        service: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.prenom.trim() || !formData.nom.trim() || !formData.email.trim()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (!editingAgent && !formData.mot_de_passe) {
      toast.error('Le mot de passe est requis pour créer un agent');
      return;
    }

    try {
      setSubmitting(true);

      const dataToSend = {
        ...formData,
        etablissement: user.etablissement,
        role: 'agent'
      };

      // Si on modifie et qu'il n'y a pas de nouveau mot de passe, ne pas l'envoyer
      if (editingAgent && !formData.mot_de_passe) {
        delete dataToSend.mot_de_passe;
      }

      if (editingAgent) {
        // Modifier
        await agentsAPI.update(editingAgent._id, dataToSend);
        toast.success('Agent modifié avec succès !');
      } else {
        // Créer
        await agentsAPI.create(dataToSend);
        toast.success('Agent créé avec succès ! Un email a été envoyé avec les identifiants.');
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

  const handleDelete = async (agentId) => {
    try {
      await agentsAPI.delete(agentId);
      toast.success('Agent supprimé avec succès !');
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAssignService = async (agentId, serviceId) => {
    try {
      await agentsAPI.assignerService(agentId, serviceId);
      toast.success('Service assigné avec succès !');
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'assignation');
    }
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
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-900 to-purple-700 text-white p-6 hidden lg:block">
        <div className="mb-10">
          <p className="text-sm text-white/70 mb-1">Établissement</p>
          <p className="font-bold">{establishment?.nom || 'Mon Établissement'}</p>
        </div>
        
        <nav className="space-y-2">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Vue d'ensemble</span>
          </Link>
          
          <Link 
            to="/admin/services" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Wrench className="w-5 h-5" />
            <span>Gestion Services</span>
          </Link>
          
          <Link 
            to="/admin/agents" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <Users className="w-5 h-5" />
            <span>Gestion Agents</span>
          </Link>
          
          <Link 
            to="/admin/hours" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>Horaires & Pauses</span>
          </Link>
          
          <Link 
            to="/admin/appointments-config" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Configuration RDV</span>
          </Link>
          
          <Link 
            to="/admin/stats" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Agents</h1>
              <p className="text-gray-600">Invitez et gérez les agents de votre établissement</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Inviter un Agent
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {agents.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun agent
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par inviter votre premier agent
              </p>
              <Button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Inviter un agent
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {agent.prenom?.[0]}{agent.nom?.[0]}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {agent.prenom} {agent.nom}
                            </h3>
                            <Badge 
                              className={agent.statut === 'actif' ? 'bg-green-600' : 'bg-gray-400'}
                            >
                              {agent.statut === 'actif' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {agent.email}
                            </div>
                            {agent.telephone && (
                              <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                {agent.telephone}
                              </div>
                            )}
                            {agent.service ? (
                              <div className="flex items-center">
                                <Wrench className="w-4 h-4 mr-2 text-purple-600" />
                                <span className="font-medium text-purple-600">
                                  {agent.service.nom}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <Wrench className="w-4 h-4 mr-2" />
                                <span className="italic">Aucun service assigné</span>
                              </div>
                            )}
                          </div>

                          {/* Assigner service */}
                          {!agent.service && services.length > 0 && (
                            <div className="mt-4">
                              <select
                                onChange={(e) => handleAssignService(agent._id, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                defaultValue=""
                              >
                                <option value="" disabled>Assigner à un service</option>
                                {services.map(service => (
                                  <option key={service._id} value={service._id}>
                                    {service.nom}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => handleOpenModal(agent)}
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
                              <AlertDialogTitle>Supprimer l'agent ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer {agent.prenom} {agent.nom} ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(agent._id)}
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
                {editingAgent ? 'Modifier l\'agent' : 'Inviter un agent'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Prénom & Nom */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: Ahmed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: Ben Ali"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="agent@exemple.com"
                  required
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="+216 XX XXX XXX"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe {!editingAgent && '*'}
                </label>
                <input
                  type="password"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={editingAgent ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                  required={!editingAgent}
                />
                {editingAgent && (
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide si vous ne voulez pas changer le mot de passe
                  </p>
                )}
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service assigné
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Aucun service</option>
                  {services.map(service => (
                    <option key={service._id} value={service._id}>
                      {service.nom}
                    </option>
                  ))}
                </select>
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
                    editingAgent ? 'Modifier' : 'Inviter'
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