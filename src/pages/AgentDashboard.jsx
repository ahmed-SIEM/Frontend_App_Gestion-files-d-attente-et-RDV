import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ticketsAPI, servicesAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Settings, 
  Play, 
  Pause,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
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
} from '../components/ui/alert-dialog';

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [fileAttente, setFileAttente] = useState(null);
  const [ticketEnCours, setTicketEnCours] = useState(null);
  const [ticketsEnAttente, setTicketsEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [showAbsentDialog, setShowAbsentDialog] = useState(false);
  const [showServiDialog, setShowServiDialog] = useState(false);

  // Auto-refresh toutes les 5 secondes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      if (!loading) setLoading(false); // Pas de loader si c'est un refresh

      // Récupérer le service de l'agent
      const serviceResponse = await servicesAPI.getById(user.service);
      setService(serviceResponse.data);

      // Récupérer la file d'attente
      const fileResponse = await ticketsAPI.getByService(user.service);
      setFileAttente(fileResponse.data.file);
      
      // Ticket actuellement appelé (appele)
      const ticketAppele = fileResponse.data.tickets.find(t => t.statut === 'appele');
      setTicketEnCours(ticketAppele);

      // Tickets en attente
      const ticketsAttente = fileResponse.data.tickets.filter(t => t.statut === 'en_attente');
      setTicketsEnAttente(ticketsAttente);

    } catch (error) {
      console.error('Erreur:', error);
      if (loading) toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAppelerSuivant = async () => {
    try {
      setCalling(true);
      
      await ticketsAPI.appelerSuivant(user.service);
      
      toast.success('Ticket appelé !');
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'appel du ticket');
    } finally {
      setCalling(false);
    }
  };

  const handleMarquerServi = async () => {
    if (!ticketEnCours) return;

    try {
      await ticketsAPI.marquerServi(ticketEnCours._id);
      
      toast.success('Ticket marqué comme servi !');
      setShowServiDialog(false);
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const handleMarquerAbsent = async () => {
    if (!ticketEnCours) return;

    try {
      await ticketsAPI.marquerAbsent(ticketEnCours._id);
      
      toast.success('Citoyen marqué comme absent');
      setShowAbsentDialog(false);
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const calculateStats = () => {
    // Stats du jour (à partir de la file d'attente)
    const ticketsServisAujourdhui = fileAttente?.tickets_servis_aujourdhui || 0;
    const ticketsEnAttente = ticketsEnAttente.length;
    
    // Calculer le temps moyen (placeholder - à implémenter)
    const tempsMoyen = '~12min'; // TODO: Calculer depuis les tickets servis
    
    // Calculer les absents (placeholder)
    const absents = 0; // TODO: Compter les tickets absents aujourd'hui
    
    return {
      en_attente: ticketsEnAttente,
      servis_aujourdhui: ticketsServisAujourdhui,
      temps_moyen: tempsMoyen,
      absents
    };
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
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-green-900 to-green-700 text-white p-6 hidden lg:block">
        <div className="mb-10">
          <p className="text-sm text-white/70 mb-1">Agent</p>
          <p className="font-bold">{service?.nom || 'Mon Service'}</p>
          <p className="text-sm text-white/70">Guichet {user?.guichet || '-'}</p>
        </div>
        
        <nav className="space-y-2">
          <Link 
            to="/agent/dashboard" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>File d'attente</span>
          </Link>
          
          <Link 
            to="/agent/appointments" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Rendez-vous</span>
          </Link>
          
          <Link 
            to="/agent/stats" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Mes statistiques</span>
          </Link>
          
          <Link 
            to="/agent/settings" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Paramètres</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                File d'Attente - {service?.nom}
              </h1>
              <p className="text-gray-600">Guichet {user?.guichet || '-'}</p>
            </div>
            <Badge className="bg-green-600 animate-pulse">File Active</Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.en_attente}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Servis aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900">{stats.servis_aujourdhui}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Temps moyen</p>
              <p className="text-3xl font-bold text-gray-900">{stats.temps_moyen}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Absents</p>
              <p className="text-3xl font-bold text-gray-900">{stats.absents}</p>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-[70%_30%] gap-8">
            {/* Left Column */}
            <div>
              {/* Ticket en cours */}
              <Card className="p-8 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-2">TICKET EN COURS</p>
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
                      {ticketEnCours.citoyen?.prenom?.[0]}*** {ticketEnCours.citoyen?.nom?.[0]}***
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setShowServiDialog(true)}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Servi
                      </Button>
                      <Button
                        onClick={() => setShowAbsentDialog(true)}
                        size="lg"
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Absent
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-8xl font-bold text-gray-300 mb-4">—</div>
                    <p className="text-gray-500 mb-6">Aucun ticket en cours</p>
                    <Button
                      onClick={handleAppelerSuivant}
                      disabled={calling || ticketsEnAttente.length === 0}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {calling ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Appel en cours...
                        </>
                      ) : (
                        'Appeler Suivant'
                      )}
                    </Button>
                  </>
                )}
              </Card>

              {/* Tickets en attente */}
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Tickets en attente ({ticketsEnAttente.length})
              </h3>
              
              {ticketsEnAttente.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun ticket en attente</p>
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
                              Citoyen {ticket.citoyen?.prenom?.[0]}*** {ticket.citoyen?.nom?.[0]}***
                            </p>
                            <p className="text-sm text-gray-500">
                              Pris à {new Date(ticket.heure_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {index === 0 && <Badge className="bg-green-600">PROCHAIN</Badge>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Contrôles */}
            <div>
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-6">Contrôles</h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleAppelerSuivant}
                    disabled={calling || ticketsEnAttente.length === 0 || ticketEnCours}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Appeler Suivant
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/agent/appointments')}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Voir RDV
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-semibold text-gray-900 mb-4">Stats personnelles</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tickets traités</span>
                      <span className="font-bold text-gray-900">{stats.servis_aujourdhui}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">En attente</span>
                      <span className="font-bold text-gray-900">{stats.en_attente}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service</span>
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
            <AlertDialogTitle>Marquer comme servi ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le ticket #{ticketEnCours?.numero} sera marqué comme servi. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarquerServi}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Marquer Absent */}
      <AlertDialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme absent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le citoyen sera marqué comme absent et le prochain ticket sera appelé automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarquerAbsent}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}