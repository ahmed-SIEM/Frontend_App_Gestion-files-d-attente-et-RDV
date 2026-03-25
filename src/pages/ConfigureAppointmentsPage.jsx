import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { servicesAPI, rdvAPI, etablissementsAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  BarChart3,
  Settings,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ConfigureAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [establishment, setEstablishment] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    duree_rdv_defaut: 30,
    creneaux_par_jour: 16,
    heure_debut: '08:00',
    heure_fin: '17:00',
    pause_debut: '12:00',
    pause_fin: '13:00'
  });

  const dureeOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 heure' },
    { value: 90, label: '1h 30min' },
    { value: 120, label: '2 heures' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [estResponse, servicesResponse] = await Promise.all([
        etablissementsAPI.getById(user.etablissement),
        servicesAPI.getByEtablissement(user.etablissement)
      ]);
      
      setEstablishment(estResponse.data);
      
      // Filtrer uniquement les services avec RDV activé
      const servicesAvecRDV = servicesResponse.data.filter(s => s.rdv_active);
      setServices(servicesAvecRDV);
      
      if (servicesAvecRDV.length > 0) {
        setSelectedService(servicesAvecRDV[0]);
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedService) {
      toast.error('Veuillez sélectionner un service');
      return;
    }

    try {
      setSaving(true);
      
      // Configurer les horaires du service
      await rdvAPI.configurerHoraires(selectedService._id, config);
      
      toast.success('Configuration enregistrée avec succès !');
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const calculateCreneaux = () => {
    const debut = new Date(`2000-01-01T${config.heure_debut}`);
    const fin = new Date(`2000-01-01T${config.heure_fin}`);
    const pauseDebut = new Date(`2000-01-01T${config.pause_debut}`);
    const pauseFin = new Date(`2000-01-01T${config.pause_fin}`);
    
    const dureeMs = config.duree_rdv_defaut * 60 * 1000;
    const totalMs = fin - debut;
    const pauseMs = pauseFin - pauseDebut;
    const travailMs = totalMs - pauseMs;
    
    return Math.floor(travailMs / dureeMs);
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
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
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
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
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
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Configuration Rendez-vous</h1>
            <p className="text-gray-600">Configurez les paramètres des rendez-vous par service</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {services.length === 0 ? (
            <Card className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun service avec RDV
              </h3>
              <p className="text-gray-600 mb-6">
                Activez d'abord les rendez-vous sur au moins un service
              </p>
              <Button
                onClick={() => navigate('/admin/services')}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Wrench className="w-5 h-5 mr-2" />
                Gérer les services
              </Button>
            </Card>
          ) : (
            <div className="max-w-4xl space-y-6">
              {/* Sélection du service */}
              <Card className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service à configurer
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {services.map(service => (
                    <button
                      key={service._id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedService?._id === service._id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{service.nom}</span>
                        {selectedService?._id === service._id && (
                          <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {selectedService && (
                <>
                  {/* Configuration durée */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-purple-600" />
                        Durée des rendez-vous
                      </h3>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        {dureeOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => setConfig({ ...config, duree_rdv_defaut: option.value })}
                            className={`p-4 rounded-lg border-2 text-center transition-all ${
                              config.duree_rdv_defaut === option.value
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {option.value}min
                            </div>
                            <div className="text-sm text-gray-600">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                  {/* Configuration horaires */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-purple-600" />
                        Horaires de consultation
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Début des consultations
                            </label>
                            <input
                              type="time"
                              value={config.heure_debut}
                              onChange={(e) => setConfig({ ...config, heure_debut: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fin des consultations
                            </label>
                            <input
                              type="time"
                              value={config.heure_fin}
                              onChange={(e) => setConfig({ ...config, heure_fin: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Pause déjeuner</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Début de la pause
                              </label>
                              <input
                                type="time"
                                value={config.pause_debut}
                                onChange={(e) => setConfig({ ...config, pause_debut: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fin de la pause
                              </label>
                              <input
                                type="time"
                                value={config.pause_fin}
                                onChange={(e) => setConfig({ ...config, pause_fin: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Récapitulatif */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-purple-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-purple-600" />
                        Récapitulatif
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Durée par RDV :</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {config.duree_rdv_defaut} minutes
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Créneaux par jour :</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            ~{calculateCreneaux()} créneaux
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Horaires :</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {config.heure_debut} - {config.heure_fin}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pause :</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {config.pause_debut} - {config.pause_fin}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-100 rounded-lg flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          Les créneaux seront automatiquement générés selon cette configuration. 
                          Les citoyens pourront réserver des rendez-vous pendant les horaires définis.
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Bouton Enregistrer */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Enregistrer la configuration
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}