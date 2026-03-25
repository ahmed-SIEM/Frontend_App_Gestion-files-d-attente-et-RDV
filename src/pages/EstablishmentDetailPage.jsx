import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { etablissementsAPI, servicesAPI } from '../services/api';
import { MapPin, Clock, Users, Phone, Calendar, ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function EstablishmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [establishment, setEstablishment] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesStats, setServicesStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstablishmentData();
  }, [id]);

  const fetchEstablishmentData = async () => {
    try {
      setLoading(true);
      
      // 1. Récupérer l'établissement
      const estResponse = await etablissementsAPI.getById(id);
      setEstablishment(estResponse.data);
      
      // 2. Récupérer les services
      const servicesResponse = await servicesAPI.getByEtablissement(id);
      const servicesData = servicesResponse.data || [];
      setServices(servicesData);
      
      // 3. Récupérer les stats pour chaque service
      const statsPromises = servicesData.map(service => 
        servicesAPI.getStats(service._id)
          .then(res => ({ serviceId: service._id, stats: res.data }))
          .catch(() => ({ serviceId: service._id, stats: null }))
      );
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach(({ serviceId, stats }) => {
        statsMap[serviceId] = stats;
      });
      setServicesStats(statsMap);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir les horaires d'aujourd'hui
  const getTodaySchedule = () => {
    if (!establishment?.horaires) return null;
    
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const aujourdHui = jours[new Date().getDay()];
    
    return establishment.horaires[aujourdHui];
  };

  // Fonction pour vérifier si c'est ouvert maintenant
  const isCurrentlyOpen = () => {
    const schedule = getTodaySchedule();
    if (!schedule || !schedule.ouvert) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= schedule.ouverture && currentTime < schedule.fermeture;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Établissement non trouvé
          </p>
          <Link to="/citoyen/home">
            <Button>Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const isOpen = isCurrentlyOpen();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec Retour - SÉPARÉ du Hero */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/citoyen/home" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à la recherche
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-white/20 text-white capitalize">
              {establishment.type}
            </Badge>
            <h1 className="text-5xl font-bold mb-4">{establishment.nom}</h1>
            <p className="text-xl flex items-center mb-4">
              <MapPin className="w-5 h-5 mr-2" />
              {establishment.adresse}, {establishment.ville}
            </p>
            
            {/* Badge Ouvert/Fermé depuis le backend */}
            {todaySchedule && (
              <Badge className={isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                {isOpen 
                  ? `Ouvert • Fermeture à ${todaySchedule.fermeture}` 
                  : todaySchedule.ouvert 
                    ? 'Fermé' 
                    : 'Fermé aujourd\'hui'}
              </Badge>
            )}
            
            {establishment.description && (
              <p className="text-lg text-white/90 mt-4">
                {establishment.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Services disponibles ({services.length})
            </h2>
            
            {services.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun service disponible
                </h3>
                <p className="text-gray-600">
                  Cet établissement n'a pas encore configuré de services.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {services.map((service) => {
                  const stats = servicesStats[service._id];
                  const hasFile = service.file_activee;
                  const hasRdv = service.rdv_active;
                  
                  return (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              {hasRdv ? (
                                <Calendar className="w-6 h-6 text-white" />
                              ) : (
                                <Users className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-900">
                                {service.nom}
                              </h3>
                              {service.description && (
                                <p className="text-gray-600 mt-1">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={
                              hasFile && hasRdv
                                ? 'bg-purple-600 text-white'
                                : hasRdv
                                ? 'bg-pink-600 text-white'
                                : 'bg-blue-600 text-white'
                            }
                          >
                            {hasFile && hasRdv
                              ? 'FILE & RDV'
                              : hasRdv
                              ? 'RDV UNIQUEMENT'
                              : 'FILE D\'ATTENTE'}
                          </Badge>
                        </div>

                        {/* Section File */}
                        {hasFile && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-blue-700 mb-1">En attente</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.nombre_en_attente ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 mb-1">Temps estimé</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.temps_attente_estime
                                    ? `~${Math.floor(stats.temps_attente_estime / 60)}h${stats.temps_attente_estime % 60}min`
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 mb-1">Ticket actuel</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.ticket_actuel ? `#${stats.ticket_actuel}` : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 mb-1">Guichets actifs</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.guichets_actifs ?? '—'} / {stats?.total_guichets ?? '—'}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => navigate(`/citoyen/take-ticket/${establishment._id}/${service._id}`)}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
                            >
                              Prendre un Ticket
                            </Button>
                          </div>
                        )}

                        {/* Section RDV */}
                        {hasRdv && (
                          <div className="bg-pink-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-pink-700 mb-1">Créneaux disponibles</p>
                                <p className="text-lg font-bold text-pink-900">✓ Oui</p>
                              </div>
                              <div>
                                <p className="text-sm text-pink-700 mb-1">Durée</p>
                                <p className="text-lg font-bold text-pink-900">
                                  {service.temps_traitement_moyen || 15} minutes
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => navigate(`/citoyen/appointment/${establishment._id}/${service._id}`)}
                              className="w-full bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-700 hover:to-pink-500"
                            >
                              Réserver un RDV
                            </Button>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Informations pratiques
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-semibold">{establishment.telephone_etablissement}</p>
                  </div>
                </div>
                
                {/* Horaires aujourd'hui depuis le backend */}
                {todaySchedule && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Horaires aujourd'hui</p>
                      <p className="font-semibold">
                        {todaySchedule.ouvert 
                          ? `${todaySchedule.ouverture} - ${todaySchedule.fermeture}` 
                          : 'Fermé'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-semibold">{establishment.adresse}</p>
                    <p className="text-sm text-gray-500">
                      {establishment.ville}, {establishment.gouvernorat}
                    </p>
                  </div>
                </div>
                
                {/* Badge Ouvert/Fermé depuis le backend */}
                {todaySchedule && (
                  <div className={`p-4 rounded-lg ${isOpen ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm font-semibold ${isOpen ? 'text-green-900' : 'text-red-900'}`}>
                      {isOpen 
                        ? `Ouvert jusqu'à ${todaySchedule.fermeture}` 
                        : todaySchedule.ouvert 
                          ? 'Actuellement fermé' 
                          : 'Fermé aujourd\'hui'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}