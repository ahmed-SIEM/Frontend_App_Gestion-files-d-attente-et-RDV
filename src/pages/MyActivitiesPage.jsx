import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ticketsAPI, rdvAPI } from '../services/api';
import { Clock, MapPin, Calendar, X, Edit, Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function MyActivitiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTickets, setActiveTickets] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Récupérer les tickets
      const ticketsResponse = await ticketsAPI.getMesTickets();
      const tickets = ticketsResponse.data || [];
      setActiveTickets(tickets.filter(t => t.statut === 'en_attente' || t.statut === 'appele'));

      // Récupérer les RDV
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
      toast.error('Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    try {
      await ticketsAPI.cancel(ticketId);
      toast.success('Ticket annulé');
      fetchActivities(); // Recharger
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation du ticket');
    }
  };

  const handleCancelAppointment = async (rdvId) => {
    try {
      await rdvAPI.cancel(rdvId);
      toast.success('Rendez-vous annulé');
      fetchActivities(); // Recharger
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const canReschedule = (rdvDate) => {
    const now = new Date();
    const appointmentDate = new Date(rdvDate);
    const diffHours = (appointmentDate - now) / (1000 * 60 * 60);
    return diffHours > 24; // Plus de 24h avant
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mes Activités</h1>

        {/* Active Tickets Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tickets en cours</h2>
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
                          {ticket.etablissement?.nom || 'Établissement'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ticket.service?.nom || 'Service'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {ticket.etablissement?.ville || 'Ville'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        #{ticket.numero}
                      </div>
                      <Badge className="mt-1">
                        Position: {ticket.position_file || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Temps estimé</span>
                      <span className="font-bold text-blue-900">
                        {ticket.temps_attente_estime
                          ? `~${Math.floor(ticket.temps_attente_estime / 60)}h${ticket.temps_attente_estime % 60}min`
                          : 'Calcul en cours...'}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => navigate(`/citoyen/track-ticket/${ticket._id}`)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      Suivre
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelTicket(ticket._id)}
                    >
                      Annuler
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun ticket actif
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas de tickets en cours
              </p>
              <Link to="/citoyen/home">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Prendre un ticket
                </Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Upcoming Appointments Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Rendez-vous à venir
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
                              {rdv.etablissement?.nom || 'Établissement'}
                            </h3>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                {rdvDate.toLocaleDateString('fr-FR', {
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
                            {rdv.service?.nom || 'Service'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {rdv.etablissement?.adresse || 'Adresse'}
                          </p>
                          {!canRescheduleThis && (
                            <Badge variant="secondary" className="mt-2">
                              Reprogrammation impossible (moins de 24h)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      {canRescheduleThis && (
                        <Button variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Reprogrammer
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleCancelAppointment(rdv._id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annuler
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
                Aucun rendez-vous à venir
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas de rendez-vous programmés
              </p>
              <Link to="/citoyen/home">
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600">
                  Réserver un rendez-vous
                </Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Past Appointments Section */}
        {pastAppointments.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Historique Rendez-vous
            </h2>
            <div className="space-y-4">
              {pastAppointments.map((rdv) => {
                const rdvDate = new Date(rdv.date);
                return (
                  <Card key={rdv._id} className="p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {rdv.etablissement?.nom || 'Établissement'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {rdv.service?.nom || 'Service'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rdvDate.toLocaleDateString('fr-FR')} • {rdv.heure_debut}
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
                        {rdv.statut === 'complete' && 'Complété'}
                        {rdv.statut === 'absent' && 'Absent'}
                        {rdv.statut === 'annule' && 'Annulé'}
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