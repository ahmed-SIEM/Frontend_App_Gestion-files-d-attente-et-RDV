import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { etablissementsAPI, servicesAPI } from '../services/api';
import { useServiceStats } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Clock, Users, Phone, Calendar, ArrowLeft, Building2, Loader2, Wifi, Flag, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const RAISONS_SIGNALEMENT = [
  'service_mediocre',
  'attente_excessive',
  'comportement_irrespectueux',
  'informations_incorrectes',
  'ferme_sans_prevenir',
  'autre',
];

export default function EstablishmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [establishment, setEstablishment] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesStats, setServicesStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [liveServiceId, setLiveServiceId] = useState(null);

  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalRaison, setSignalRaison] = useState('');
  const [signalCommentaire, setSignalCommentaire] = useState('');
  const [submittingSignal, setSubmittingSignal] = useState(false);
  const [dejaSignale, setDejaSignale] = useState(false);

  const locale = i18n.language === 'ar' ? 'ar-TN' : 'fr-FR';

  useServiceStats(liveServiceId, useCallback((stats) => {
    if (liveServiceId) {
      setServicesStats(prev => ({ ...prev, [liveServiceId]: { ...prev[liveServiceId], ...stats } }));
    }
  }, [liveServiceId]));

  useEffect(() => {
    fetchEstablishmentData();
  }, [id]);

  const fetchEstablishmentData = async () => {
    try {
      setLoading(true);

      const estResponse = await etablissementsAPI.getById(id);
      setEstablishment(estResponse.data);

      const servicesResponse = await servicesAPI.getByEtablissement(id);
      const servicesData = servicesResponse.data || [];
      setServices(servicesData);

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

      const firstFileService = servicesData.find(s => s.file_activee);
      if (firstFileService) setLiveServiceId(firstFileService._id);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignaler = async () => {
    if (!signalRaison) return toast.error(t('estab_detail.report_no_reason'));
    setSubmittingSignal(true);
    try {
      await etablissementsAPI.signaler(id, signalRaison, signalCommentaire);
      setDejaSignale(true);
      setShowSignalModal(false);
      setSignalRaison('');
      setSignalCommentaire('');
      toast.success(t('estab_detail.report_success'));
    } catch (error) {
      const msg = error.response?.data?.message || t('errors.server');
      if (msg.includes('déjà signalé')) setDejaSignale(true);
      toast.error(msg);
    } finally {
      setSubmittingSignal(false);
    }
  };

  const getTodaySchedule = () => {
    if (!establishment?.horaires) return null;
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const aujourdHui = jours[new Date().getDay()];
    return establishment.horaires[aujourdHui];
  };

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
            {t('estab_detail.not_found')}
          </p>
          <Link to="/citoyen/home">
            <Button>{t('estab_detail.back_search')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const isOpen = isCurrentlyOpen();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/citoyen/home"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 me-2" />
            {t('estab_detail.back_search')}
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
            <div className="flex items-center gap-4 mb-4">
              {establishment.photo && (
                <img
                  src={establishment.photo}
                  alt={establishment.nom}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white/30 shadow-lg"
                />
              )}
              <Badge className="bg-white/20 text-white capitalize">{establishment.type}</Badge>
            </div>
            <h1 className="text-5xl font-bold mb-4">{establishment.nom}</h1>
            <p className="text-xl flex items-center mb-4">
              <MapPin className="w-5 h-5 me-2" />
              {establishment.adresse}, {establishment.ville}
            </p>

            {todaySchedule && (
              <Badge className={isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                {isOpen
                  ? t('estab_detail.open_suffix', { time: todaySchedule.fermeture })
                  : todaySchedule.ouvert
                    ? t('common.closed')
                    : t('estab_detail.closed_today')}
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
              {t('estab_detail.services_available', { count: services.length })}
            </h2>

            {services.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('estab_detail.no_services')}
                </h3>
                <p className="text-gray-600">
                  {t('estab_detail.no_services_sub')}
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
                            {hasFile && hasRdv ? 'FILE & RDV' : hasRdv ? 'RDV' : 'FILE'}
                          </Badge>
                        </div>

                        {/* Section File */}
                        {hasFile && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-blue-800">{t('estab_detail.queue_section')}</span>
                              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <Wifi className="w-3 h-3" /> Live
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-blue-700 mb-1">{t('estab_detail.waiting')}</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.nombre_en_attente ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 mb-1">{t('estab_detail.est_time')}</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.temps_attente_estime
                                    ? `~${Math.floor(stats.temps_attente_estime / 60)}h${stats.temps_attente_estime % 60}min`
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 mb-1">{t('estab_detail.current_ticket')}</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.ticket_actuel ? `#${stats.ticket_actuel}` : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-700 mb-1">{t('estab_detail.active_counters')}</p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {stats?.guichets_actifs ?? '—'} / {stats?.total_guichets ?? '—'}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => navigate(`/citoyen/take-ticket/${establishment._id}/${service._id}`)}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
                            >
                              {t('estab_detail.take_ticket_btn')}
                            </Button>
                          </div>
                        )}

                        {/* Section RDV */}
                        {hasRdv && (
                          <div className="bg-pink-50 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-pink-700 mb-1">{t('estab_detail.slots_available')}</p>
                                <p className="text-2xl font-bold text-pink-900">
                                  {stats?.rdv?.creneaux_disponibles ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-pink-700 mb-1">{t('estab_detail.next_slot')}</p>
                                <p className="text-sm font-bold text-pink-900">
                                  {stats?.rdv?.prochain_creneau
                                    ? `${new Date(stats.rdv.prochain_creneau.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${stats.rdv.prochain_creneau.heure_debut}`
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-pink-700 mb-1">{t('estab_detail.duration')}</p>
                                <p className="text-2xl font-bold text-pink-900">
                                  {stats?.rdv?.duree_rdv || service.temps_traitement_moyen || 30} min
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => navigate(`/citoyen/appointment/${establishment._id}/${service._id}`)}
                              disabled={stats?.rdv?.creneaux_disponibles === 0}
                              className="w-full bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-700 hover:to-pink-500 disabled:opacity-50"
                            >
                              {stats?.rdv?.creneaux_disponibles === 0
                                ? t('estab_detail.no_slots')
                                : t('estab_detail.book_rdv_btn')}
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
                {t('estab_detail.practical_info')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{t('common.phone')}</p>
                    <p className="font-semibold">{establishment.telephone_etablissement}</p>
                  </div>
                </div>

                {todaySchedule && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">{t('estab_detail.hours_today')}</p>
                      <p className="font-semibold">
                        {todaySchedule.ouvert
                          ? `${todaySchedule.ouverture} - ${todaySchedule.fermeture}`
                          : t('common.closed')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{t('common.address')}</p>
                    <p className="font-semibold">{establishment.adresse}</p>
                    <p className="text-sm text-gray-500">
                      {establishment.ville}, {establishment.gouvernorat}
                    </p>
                  </div>
                </div>

                {todaySchedule && (
                  <div className={`p-4 rounded-lg ${isOpen ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm font-semibold ${isOpen ? 'text-green-900' : 'text-red-900'}`}>
                      {isOpen
                        ? t('estab_detail.open_until', { time: todaySchedule.fermeture })
                        : todaySchedule.ouvert
                          ? t('estab_detail.currently_closed')
                          : t('estab_detail.closed_today')}
                    </p>
                  </div>
                )}

                {user?.role === 'citoyen' && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setShowSignalModal(true)}
                      disabled={dejaSignale}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Flag className="w-4 h-4" />
                      {dejaSignale ? t('estab_detail.already_reported') : t('estab_detail.report_btn')}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Signalement */}
      <AnimatePresence>
        {showSignalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowSignalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">{t('estab_detail.report_title')}</h2>
                </div>
                <button onClick={() => setShowSignalModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {t('estab_detail.report_hint')}
              </p>

              <div className="space-y-2 mb-4">
                {RAISONS_SIGNALEMENT.map((value) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      signalRaison === value
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="raison"
                      value={value}
                      checked={signalRaison === value}
                      onChange={() => setSignalRaison(value)}
                      className="accent-orange-500"
                    />
                    <span className="text-sm">{t(`estab_detail.report_reasons.${value}`)}</span>
                  </label>
                ))}
              </div>

              <textarea
                placeholder={t('estab_detail.comment_placeholder')}
                value={signalCommentaire}
                onChange={(e) => setSignalCommentaire(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSignalModal(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleSignaler}
                  disabled={!signalRaison || submittingSignal}
                >
                  {submittingSignal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('estab_detail.report_submit')
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
