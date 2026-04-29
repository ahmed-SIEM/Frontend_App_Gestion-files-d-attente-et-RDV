import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ticketsAPI } from '../services/api';
import { useTicketTracking } from '../hooks/useSocket';
import { MapPin, X, TrendingDown, Loader2, AlertCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { toast } from 'sonner';

export default function TrackTicketPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialPosition, setInitialPosition] = useState(null);
  const [calledAlert, setCalledAlert] = useState(null);

  // Socket.io : notif quand ticket appelé
  useTicketTracking(ticketId, {
    onCalled: useCallback((data) => {
      setCalledAlert(data);
      setTicket(prev => prev ? { ...prev, statut: 'appele', guichet: data.guichet } : prev);
      // Notification browser si supporté
      if (Notification.permission === 'granted') {
        new Notification(t('track_ticket.notif_title'), { body: data.message, icon: '/favicon.ico' });
      }
    }, []),
  });

  useEffect(() => {
    // Demander permission notifications
    if (Notification.permission === 'default') Notification.requestPermission();

    fetchTicket();
    const interval = setInterval(fetchTicket, 15000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await ticketsAPI.getById(ticketId);
      const ticketData = response.data;
      
      // Sauvegarder la position initiale
      if (initialPosition === null) {
        setInitialPosition(ticketData.tickets_avant || ticketData.position);
      }
      
      setTicket(ticketData);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.load_data'));
      setLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    try {
      await ticketsAPI.cancel(ticketId);
      toast.success(t('track_ticket.cancelled'));
      navigate('/citoyen/activities');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('track_ticket.cancel_error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            {t('track_ticket.not_found')}
          </p>
          <Link to="/citoyen/activities">
            <Button>{t('track_ticket.see_activities')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const position = ticket.tickets_avant || 0;
  const progressPercentage = initialPosition > 0 
    ? Math.max(0, 100 - (position / initialPosition) * 100)
    : 0;
  const estimatedWait = ticket.temps_estime_minutes || 0;
  const hasAdvanced = initialPosition !== null && position < initialPosition;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Header avec logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FileZen
            </span>
          </div>
          <Link to="/citoyen/activities">
            <Button variant="outline">{t('track_ticket.see_activities')}</Button>
          </Link>
        </div>

        {/* Alerte "Votre tour !" */}
        <AnimatePresence>
          {calledAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-green-500 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg"
            >
              <Bell className="w-6 h-6 animate-bounce flex-shrink-0" />
              <div>
                <p className="font-bold text-lg">{t('track_ticket.your_turn')}</p>
                <p className="text-sm opacity-90">{calledAlert.message}</p>
              </div>
              <button onClick={() => setCalledAlert(null)} className="ml-auto text-white/80 hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card principale */}
        <Card className="p-8 shadow-2xl">
          {/* Badge + Numéro de ticket */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {ticket.statut === 'en_attente' ? t('track_ticket.status_waiting') :
                 ticket.statut === 'appele' ? t('track_ticket.status_called') :
                 t('track_ticket.status_other') + ticket.statut}
              </Badge>
            </motion.div>
            <div className="mb-6">
              <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                #{ticket.numero}
              </div>
            </div>
          </div>

          {/* Stats principales */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Avant vous */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <p className="text-sm text-blue-700 mb-2">{t('track_ticket.before_you')}</p>
              <motion.p
                key={position}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-5xl font-bold text-blue-900"
              >
                {position}
              </motion.p>
              {hasAdvanced && (
                <div className="flex items-center justify-center mt-2 text-green-600">
                  <TrendingDown className="w-4 h-4 me-1" />
                  <span className="text-sm">{t('track_ticket.moving_fast')}</span>
                </div>
              )}
            </div>

            {/* Temps estimé */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <p className="text-sm text-purple-700 mb-2">{t('track_ticket.est_time')}</p>
              <p className="text-5xl font-bold text-purple-900">
                {estimatedWait > 0 
                  ? `~${Math.floor(estimatedWait / 60)}h${estimatedWait % 60 > 0 ? estimatedWait % 60 + 'min' : ''}`
                  : '—'}
              </p>
              <p className="text-xs text-purple-600 mt-2">{t('track_ticket.realtime_update')}</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('track_ticket.progress')}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Ticket en cours */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">{t('track_ticket.current_ticket')}</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                #{ticket.service?.ticket_actuel || '—'}
              </span>
            </div>
          </Card>

          {/* Boutons d'action */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(ticket.etablissement?.adresse)}`, '_blank')}
            >
              <MapPin className="w-5 h-5 me-2" />
              {t('track_ticket.locate')}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={ticket.statut !== 'en_attente' && ticket.statut !== 'appele'}
                >
                  <X className="w-5 h-5 me-2" />
                  {t('track_ticket.cancel_btn')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('track_ticket.cancel_confirm_title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('track_ticket.cancel_confirm_desc', { numero: ticket.numero })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('track_ticket.keep')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelTicket}>
                    {t('track_ticket.confirm_cancel')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        {/* Infos établissement */}
        <Card className="p-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('track_ticket.estab_info')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 shrink-0">{t('common.establishment')}</span>
              <span className="font-semibold text-right ms-4">{ticket.etablissement?.nom}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 shrink-0">{t('common.service')}</span>
              <span className="font-semibold text-right ms-4">{ticket.service?.nom}</span>
            </div>
            <div className="flex flex-col gap-1 pt-1 border-t border-gray-100">
              <span className="text-gray-600">{t('common.address')}</span>
              <span className="font-semibold text-gray-900 leading-snug">{ticket.etablissement?.adresse}</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}