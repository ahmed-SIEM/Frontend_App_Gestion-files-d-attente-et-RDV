import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { etablissementsAPI, servicesAPI, ticketsAPI } from '../services/api';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TakeTicketPage() {
  const { etablissementId, serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [establishment, setEstablishment] = useState(null);
  const [service, setService] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [etablissementId, serviceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer établissement
      const estResponse = await etablissementsAPI.getById(etablissementId);
      setEstablishment(estResponse.data);
      
      // Récupérer service
      const serviceResponse = await servicesAPI.getById(serviceId);
      setService(serviceResponse.data);
      
      // Récupérer stats
      const statsResponse = await servicesAPI.getStats(serviceId);
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedule = () => {
    if (!establishment?.horaires) return null;
    
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const aujourdHui = jours[new Date().getDay()];
    
    return establishment.horaires[aujourdHui];
  };

  const canBeServedToday = () => {
    const schedule = getTodaySchedule();
    if (!schedule || !schedule.ouvert || !stats) return false;
    
    const now = new Date();
    // Temps avant fermeture (en minutes)
    const [closingHour, closingMin] = schedule.fermeture.split(':');
    const closingTime = new Date();
    closingTime.setHours(parseInt(closingHour), parseInt(closingMin), 0);
    const timeUntilClosing = (closingTime - now) / 60000;
    
    // Temps d'attente estimé
    const waitTime = stats.temps_attente_estime || 0;
    
    return waitTime < timeUntilClosing;
  };

  const handleTakeTicket = async () => {
    try {
      setSubmitting(true);
      
      const response = await ticketsAPI.create({
        serviceId: serviceId
      });
      
      toast.success(t('take_ticket.success'));
      navigate(`/citoyen/ticket-confirmation/${response.data._id}`);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || t('take_ticket.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!establishment || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            {t('take_ticket.not_found')}
          </p>
          <Link to="/citoyen/home">
            <Button>{t('take_ticket.back_search')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const willBeServed = canBeServedToday();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Link 
          to={`/citoyen/establishment/${etablissementId}`} 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 me-2" />
          {t('common.back')}
        </Link>

        <Card className="p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse">
              {t('take_ticket.queue_active')}
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.nom}</h1>
            <p className="text-gray-600">{establishment.nom}</p>
          </div>

          {/* Stats en temps réel */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('take_ticket.realtime_title')}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">{t('take_ticket.current_ticket')}</p>
                <p className="text-4xl font-bold text-blue-900">
                  {stats?.ticket_actuel ? `#${stats.ticket_actuel}` : '—'}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700 mb-2">{t('take_ticket.waiting')}</p>
                <p className="text-4xl font-bold text-purple-900">
                  {stats?.nombre_en_attente ?? '—'}
                </p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-pink-700 mb-2">{t('take_ticket.est_time')}</p>
                <p className="text-4xl font-bold text-pink-900">
                  {stats?.temps_attente_estime
                    ? `~${Math.floor(stats.temps_attente_estime / 60)}h${stats.temps_attente_estime % 60 > 0 ? stats.temps_attente_estime % 60 + 'min' : ''}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Infos horaires */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">{t('take_ticket.hours_title')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {todaySchedule ? (
                <>
                  <div className="flex justify-between">
                    <span>{t('take_ticket.opening')} :</span>
                    <span className="font-semibold">
                      {todaySchedule.ouvert
                        ? `${todaySchedule.ouverture} - ${todaySchedule.fermeture}`
                        : t('common.closed')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('take_ticket.active_counters')} :</span>
                    <span className="font-semibold">
                      {stats?.guichets_actifs ?? 0} {t('common.of')} {stats?.total_guichets ?? 0}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">{t('take_ticket.no_hours')}</p>
              )}
            </div>
          </Card>

          {/* Alerte service avant fermeture */}
          {todaySchedule && todaySchedule.ouvert && (
            willBeServed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    {t('take_ticket.will_be_served')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    {t('take_ticket.might_not_be_served')}
                  </p>
                </div>
              </div>
            )
          )}

          {/* Bouton */}
          <Button
            onClick={handleTakeTicket}
            disabled={submitting || !service.file_activee || service.statut !== 'actif'}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 me-2 animate-spin" />
                {t('take_ticket.taking')}
              </>
            ) : (
              t('take_ticket.cta')
            )}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}