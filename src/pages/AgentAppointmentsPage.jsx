import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { rdvAPI, servicesAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Settings, 
  CheckCircle, 
  X,
  Loader2,
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

export default function AgentAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showAbsentDialog, setShowAbsentDialog] = useState(false);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      if (!loading) setLoading(false);

      // Récupérer le service de l'agent
      const serviceResponse = await servicesAPI.getById(user.service);
      setService(serviceResponse.data);

      // Date d'aujourd'hui
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Récupérer les RDV d'aujourd'hui
      const rdvResponse = await rdvAPI.getByService(user.service, dateStr);
      setRendezvous(rdvResponse.data);

    } catch (error) {
      console.error('Erreur:', error);
      if (loading) toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleMarquerComplete = async () => {
    if (!selectedRdv) return;

    try {
      await rdvAPI.marquerComplete(selectedRdv._id);
      
      toast.success('Rendez-vous marqué comme complété !');
      setShowCompleteDialog(false);
      setSelectedRdv(null);
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const handleMarquerAbsent = async () => {
    if (!selectedRdv) return;

    try {
      await rdvAPI.marquerAbsent(selectedRdv._id);
      
      toast.success('Rendez-vous marqué comme absent');
      setShowAbsentDialog(false);
      setSelectedRdv(null);
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  const calculateStats = () => {
    const total = rendezvous.length;
    const completes = rendezvous.filter(r => r.statut === 'complete').length;
    const aVenir = rendezvous.filter(r => r.statut === 'confirme').length;
    const absents = rendezvous.filter(r => r.statut === 'absent').length;

    return {
      total,
      completes,
      a_venir: aVenir,
      no_show: absents
    };
  };

  const getStatusBadge = (statut) => {
    switch(statut) {
      case 'confirme':
        return <Badge className="bg-blue-600">À venir</Badge>;
      case 'complete':
        return <Badge className="bg-green-600">Complété</Badge>;
      case 'absent':
        return <Badge className="bg-red-600">Absent</Badge>;
      case 'en_cours':
        return <Badge className="bg-orange-600 animate-pulse">En cours</Badge>;
      default:
        return <Badge className="bg-gray-400">{statut}</Badge>;
    }
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
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>File d'attente</span>
          </Link>
          
          <Link 
            to="/agent/appointments" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
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
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Rendez-vous - {service?.nom}
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">RDV aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Complétés</p>
              <p className="text-3xl font-bold text-green-600">{stats.completes}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">À venir</p>
              <p className="text-3xl font-bold text-blue-600">{stats.a_venir}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">No-show</p>
              <p className="text-3xl font-bold text-red-600">{stats.no_show}</p>
            </Card>
          </div>

          {/* Planning du jour */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Planning du jour ({rendezvous.length} rendez-vous)
          </h2>
          
          {rendezvous.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun rendez-vous aujourd'hui
              </h3>
              <p className="text-gray-600">
                Vous n'avez pas de rendez-vous programmés pour aujourd'hui
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {rendezvous.map((rdv, index) => {
                // Récupérer le premier créneau pour l'heure
                const creneauDebut = rdv.creneaux?.[0];
                const creneauFin = rdv.creneaux?.[rdv.creneaux.length - 1];
                
                const heureDebut = creneauDebut?.heure_debut || '—';
                const heureFin = creneauFin?.heure_fin || '—';

                return (
                  <motion.div
                    key={rdv._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <p className="text-xl font-bold text-gray-900">
                              {heureDebut} - {heureFin}
                            </p>
                            {getStatusBadge(rdv.statut)}
                          </div>
                          <p className="text-gray-600">
                            {rdv.citoyen?.prenom} {rdv.citoyen?.nom}
                          </p>
                          {rdv.motif && (
                            <p className="text-sm text-gray-500 mt-1">
                              Motif: {rdv.motif}
                            </p>
                          )}
                        </div>
                        
                        {rdv.statut === 'confirme' && (
                          <div className="flex items-center space-x-3">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedRdv(rdv);
                                setShowCompleteDialog(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Marquer présent
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedRdv(rdv);
                                setShowAbsentDialog(true);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Absent
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Dialog Marquer Complété */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme complété ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le rendez-vous de {selectedRdv?.citoyen?.prenom} {selectedRdv?.citoyen?.nom} sera marqué comme complété. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarquerComplete}
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
              {selectedRdv?.citoyen?.prenom} {selectedRdv?.citoyen?.nom} sera marqué comme absent (no-show).
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