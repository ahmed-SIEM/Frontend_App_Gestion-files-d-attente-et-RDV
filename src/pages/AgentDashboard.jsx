import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ticketsAPI, servicesAPI } from '../services/api';
import {
  Calendar,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import AgentSidebar from '../components/AgentSidebar';
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
} from '../components/ui/alert-dialog';

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [service, setService] = useState(null);
  const [fileAttente, setFileAttente] = useState(null);
  const [ticketEnCours, setTicketEnCours] = useState(null);
  const [ticketsEnAttente, setTicketsEnAttente] = useState([]);
  const [agentStats, setAgentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [showAbsentDialog, setShowAbsentDialog] = useState(false);
  const [showServiDialog, setShowServiDialog] = useState(false);

  const locale = i18n.language === 'ar' ? 'ar-TN' : 'fr-FR';

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [serviceResponse, fileResponse, statsResponse] = await Promise.all([
        servicesAPI.getById(user.service_id),
        ticketsAPI.getByService(user.service_id),
        ticketsAPI.getStatsAgent().catch(() => ({ data: null })),
      ]);

      setService(serviceResponse.data);
      setFileAttente(fileResponse.data.file);
      if (statsResponse.data) setAgentStats(statsResponse.data);

      const ticketAppele = fileResponse.data.tickets.find(t => t.statut === 'appele');
      setTicketEnCours(ticketAppele);

      const ticketsAttente = fileResponse.data.tickets.filter(t => t.statut === 'en_attente');
      setTicketsEnAttente(ticketsAttente);

    } catch (error) {
      console.error('Erreur:', error);
      if (loading) toast.error(t('errors.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleAppelerSuivant = async () => {
    try {
      setCalling(true);
      await ticketsAPI.appelerSuivant(user.service_id);
      toast.success(t('agent.ticket_called'));
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || t('agent.error_call'));
    } finally {
      setCalling(false);
    }
  };

  const handleMarquerServi = async () => {
    if (!ticketEnCours) return;
    try {
      await ticketsAPI.marquerServi(ticketEnCours._id);
      toast.success(t('agent.success_served'));
      setShowServiDialog(false);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('agent.error_mark'));
    }
  };

  const handleMarquerAbsent = async () => {
    if (!ticketEnCours) return;
    try {
      await ticketsAPI.marquerAbsent(ticketEnCours._id);
      toast.success(t('agent.success_absent'));
      setShowAbsentDialog(false);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('agent.error_mark'));
    }
  };

  const calculateStats = () => {
    const servis_aujourdhui = agentStats?.tickets_traites ?? fileAttente?.tickets_servis_aujourdhui ?? 0;
    const en_attente = ticketsEnAttente.length;
    const absents = agentStats?.tickets_no_show ?? 0;
    const temps_moyen = agentStats?.temps_moyen_minutes
      ? `~${agentStats.temps_moyen_minutes}min`
      : servis_aujourdhui > 0 ? `~${service?.temps_traitement_moyen || 15}min` : '—';

    return { en_attente, servis_aujourdhui, temps_moyen, absents };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar serviceName={service?.nom} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('agent.queue_title')} — {service?.nom}
              </h1>
              <p className="text-gray-600">{t('agent.guichet', { num: user?.numero_guichet || '-' })}</p>
            </div>
            <Badge className="bg-green-600 animate-pulse">{t('agent.active_queue')}</Badge>
          </div>
        </header>

        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">{t('agent.waiting_count')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.en_attente}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">{t('agent.served_today')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.servis_aujourdhui}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">{t('agent.avg_time')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.temps_moyen}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">{t('agent.absent_today')}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.absents}</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-[70%_30%] gap-8">
            {/* Left Column */}
            <div>
              {/* Ticket en cours */}
              <Card className="p-8 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-2">{t('agent.current_ticket_label')}</p>
                {ticketEnCours ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
                    >
                      #{ticketEnCours.numero}
                    </motion.div>
                    <p className="text-gray-700 mb-6">
                      {t('agent.citizen')} {ticketEnCours.citoyen?.prenom?.[0]}*** {ticketEnCours.citoyen?.nom?.[0]}***
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setShowServiDialog(true)}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      >
                        <CheckCircle2 className="w-5 h-5 me-2" />
                        {t('agent.served_btn')}
                      </Button>
                      <Button
                        onClick={() => setShowAbsentDialog(true)}
                        size="lg"
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-5 h-5 me-2" />
                        {t('agent.absent_btn')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-8xl font-bold text-gray-300 mb-4">—</div>
                    <p className="text-gray-500 mb-6">{t('agent.no_current')}</p>
                    <Button
                      onClick={handleAppelerSuivant}
                      disabled={calling || ticketsEnAttente.length === 0}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {calling ? (
                        <>
                          <Loader2 className="w-5 h-5 me-2 animate-spin" />
                          {t('agent.calling')}
                        </>
                      ) : (
                        t('agent.call_next')
                      )}
                    </Button>
                  </>
                )}
              </Card>

              {/* Tickets en attente */}
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t('agent.waiting_list_count', { count: ticketsEnAttente.length })}
              </h3>

              {ticketsEnAttente.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">{t('agent.empty_queue_short')}</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {ticketsEnAttente.map((ticket, index) => (
                    <Card
                      key={ticket._id}
                      className={`p-4 ${index === 0 ? 'border-2 border-green-500' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            #{ticket.numero}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {t('agent.citizen')} {ticket.citoyen?.prenom?.[0]}*** {ticket.citoyen?.nom?.[0]}***
                            </p>
                            <p className="text-sm text-gray-500">
                              {t('agent.taken_at', {
                                time: new Date(ticket.heure_creation).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                              })}
                            </p>
                          </div>
                        </div>
                        {index === 0 && <Badge className="bg-green-600">{t('agent.next_badge')}</Badge>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Contrôles */}
            <div>
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-6">{t('agent.controls')}</h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleAppelerSuivant}
                    disabled={calling || ticketsEnAttente.length === 0 || ticketEnCours}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Play className="w-5 h-5 me-2" />
                    {t('agent.call_next')}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/agent/appointments')}
                  >
                    <Calendar className="w-5 h-5 me-2" />
                    {t('agent.see_rdv')}
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-semibold text-gray-900 mb-4">{t('agent.personal_stats')}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('agent.tickets_processed')}</span>
                      <span className="font-bold text-gray-900">{stats.servis_aujourdhui}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('agent.waiting_count')}</span>
                      <span className="font-bold text-gray-900">{stats.en_attente}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('common.service')}</span>
                      <span className="font-bold text-gray-900">{service?.nom}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Marquer Servi */}
      <AlertDialog open={showServiDialog} onOpenChange={setShowServiDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agent.confirm_served_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agent.confirm_served_desc', { num: ticketEnCours?.numero })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarquerServi}
              className="bg-green-600 hover:bg-green-700"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Marquer Absent */}
      <AlertDialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agent.confirm_absent_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agent.confirm_absent_msg')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarquerAbsent}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
