import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ticketsAPI, rdvAPI } from '../services/api';
import { Clock, MapPin, Calendar, X, Edit, Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function MyActivitiesPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [activeTickets, setActiveTickets] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const locale = i18n.language === 'ar' ? 'ar-TN' : 'fr-FR';

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const ticketsResponse = await ticketsAPI.getMesTickets();
      const tickets = ticketsResponse.data || [];
      setActiveTickets(tickets.filter(t => t.statut === 'en_attente' || t.statut === 'appele'));

      const rdvResponse = await rdvAPI.getMesRDV();
      const rdvs = rdvResponse.data || [];

      const now = new Date();
      const upcoming = rdvs.filter(r => {
        const rdvDate = new Date(r.date);
        return r.statut === 'confirme' && rdvDate >= now;
      });
      const past = rdvs.filter(r => {
        const rdvDate = new Date(r.date);
        return r.statut !== 'confirme' || rdvDate < now;
      }).slice(0, 5);

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    try {
      await ticketsAPI.cancel(ticketId);
      toast.success(t('activities.ticket_cancelled'));
      fetchActivities();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('activities.ticket_cancel_error'));
    }
  };

  const handleCancelAppointment = async (rdvId) => {
    try {
      await rdvAPI.cancel(rdvId);
      toast.success(t('activities.rdv_cancelled'));
      fetchActivities();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('activities.rdv_cancel_error'));
    }
  };

  const canReschedule = (rdvDate) => {
    const now = new Date();
    const appointmentDate = new Date(rdvDate);
    const diffHours = (appointmentDate - now) / (1000 * 60 * 60);
    return diffHours > 24;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('activities.title')}</h1>

        {/* Active Tickets Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('activities.active_tickets')}</h2>
          {activeTickets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {activeTickets.map((ticket) => (
                <Card key={ticket._id} className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {ticket.etablissement?.nom || t('common.establishment')}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ticket.service?.nom || t('common.service')}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="w-3 h-3 me-1" />
                          {ticket.etablissement?.ville}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        #{ticket.numero}
                      </div>
                      <Badge className="mt-1">
                        {t('activities.position_label')}: {ticket.position_file || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {t('activities.est_time')}
                      </span>
                      <span className="font-bold text-blue-900">
                        {ticket.statut === 'appele'
                          ? t('activities.your_turn')
                          : ticket.temps_attente_estime === 0
                          ? t('activities.next_up')
                          : ticket.temps_attente_estime > 0
                          ? `~${ticket.temps_attente_estime} min`
                          : '—'}
                      </span>
                    </div>
                    {ticket.tickets_avant > 0 && ticket.statut === 'en_attente' && (
                      <p className="text-xs text-blue-600 mt-1">
                        {t('activities.people_before', { count: ticket.tickets_avant })}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => navigate(`/citoyen/track-ticket/${ticket._id}`)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      {t('activities.track')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelTicket(ticket._id)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('activities.no_active_ticket')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('activities.no_active_ticket_sub')}
              </p>
              <Link to="/citoyen/home">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  {t('activities.take_ticket')}
                </Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Upcoming Appointments Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('activities.upcoming_rdv')}
          </h2>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((rdv) => {
                const rdvDate = new Date(rdv.date);
                const canRescheduleThis = canReschedule(rdv.date);

                return (
                  <Card key={rdv._id} className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              {rdv.etablissement?.nom || t('common.establishment')}
                            </h3>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                {rdvDate.toLocaleDateString(locale, {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </div>
                              <div className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                                {rdv.heure_debut}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {rdv.service?.nom || t('common.service')}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 me-1" />
                            {rdv.etablissement?.adresse}
                          </p>
                          {!canRescheduleThis && (
                            <Badge variant="secondary" className="mt-2">
                              {t('activities.reschedule_impossible')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      {canRescheduleThis && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/citoyen/appointment/${rdv.etablissement?._id}/${rdv.service?._id}?reschedule=${rdv._id}`)}
                        >
                          <Edit className="w-4 h-4 me-2" />
                          {t('activities.reschedule')}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleCancelAppointment(rdv._id)}
                      >
                        <X className="w-4 h-4 me-2" />
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('activities.no_upcoming_rdv')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('activities.no_upcoming_rdv_sub')}
              </p>
              <Link to="/citoyen/home">
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600">
                  {t('activities.book_rdv')}
                </Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Past Appointments Section */}
        {pastAppointments.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('activities.rdv_history')}
            </h2>
            <div className="space-y-4">
              {pastAppointments.map((rdv) => {
                const rdvDate = new Date(rdv.date);
                return (
                  <Card key={rdv._id} className="p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {rdv.etablissement?.nom || t('common.establishment')}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {rdv.service?.nom || t('common.service')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rdvDate.toLocaleDateString(locale)} • {rdv.heure_debut}
                        </p>
                      </div>
                      <Badge
                        className={
                          rdv.statut === 'complete'
                            ? 'bg-green-600 text-white'
                            : rdv.statut === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }
                      >
                        {rdv.statut === 'complete' && t('activities.completed')}
                        {rdv.statut === 'absent' && t('activities.absent')}
                        {rdv.statut === 'annule' && t('activities.cancelled_label')}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}
