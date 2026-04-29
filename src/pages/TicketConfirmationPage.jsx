import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ticketsAPI } from '../services/api';
import { CheckCircle2, Share2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TicketConfirmationPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getById(ticketId);
      setTicket(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const message = `${t('ticket_confirmation.share_text')} #${ticket.numero}\n${t('common.service')}: ${ticket.service?.nom}\n${t('common.establishment')}: ${ticket.etablissement?.nom}`;

    if (navigator.share) {
      navigator.share({ title: 'Mon Ticket FileZen', text: message })
        .catch(err => console.log('Erreur partage:', err));
    } else {
      navigator.clipboard.writeText(message);
      toast.success(t('ticket_confirmation.copy_success'));
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

  const locale = i18n.language === 'ar' ? 'ar-TN' : 'fr-FR';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Icône de succès */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-center text-gray-900 mb-2"
        >
          {t('ticket_confirmation.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 mb-8"
        >
          {t('ticket_confirmation.subtitle')}
        </motion.p>

        <Card className="p-8 shadow-2xl mb-6 border-t-4 border-blue-600">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">{t('ticket_confirmation.your_ticket')}</p>
            <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              #{ticket.numero}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">{t('ticket_confirmation.position')}</p>
              <p className="text-2xl font-bold text-blue-900">{ticket.position}ème</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">{t('take_ticket.est_time')}</p>
              <p className="text-2xl font-bold text-purple-900">
                {ticket.temps_estime_minutes
                  ? `~${Math.floor(ticket.temps_estime_minutes / 60)}h${ticket.temps_estime_minutes % 60 > 0 ? ticket.temps_estime_minutes % 60 + 'min' : ''}`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('common.establishment')}</span>
              <span className="font-semibold text-gray-900">{ticket.etablissement?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('common.service')}</span>
              <span className="font-semibold text-gray-900">{ticket.service?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('ticket_confirmation.taken_at')}</span>
              <span className="font-semibold text-gray-900">
                {new Date(ticket.heure_creation).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate(`/citoyen/track-ticket/${ticket._id}`)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {t('ticket_confirmation.track_btn')}
            <ArrowRight className="w-5 h-5 ms-2" />
          </Button>
          <Button onClick={handleShare} size="lg" variant="outline">
            <Share2 className="w-5 h-5 me-2" />
            {t('ticket_confirmation.share_btn')}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('ticket_confirmation.hint')}
        </p>
      </motion.div>
    </div>
  );
}
