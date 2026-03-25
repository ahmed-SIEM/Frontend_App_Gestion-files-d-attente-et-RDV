import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, etablissementsAPI } from '../services/api';
import { 
  Building2, 
  Users, 
  Ticket, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  LogOut, 
  LayoutDashboard, 
  CheckCircle, 
  BarChart3, 
  Settings,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [establishments, setEstablishments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupérer les stats globales de la plateforme
      const statsResponse = await statsAPI.getDashboardPlateforme();
      setStats(statsResponse.data);

      // Récupérer tous les établissements pour les stats
      const etablissementsResponse = await etablissementsAPI.getAll();
      setEstablishments(etablissementsResponse.data);

      // Compter les établissements en attente
      const pending = etablissementsResponse.data.filter(e => e.statut === 'en_attente').length;
      setPendingCount(pending);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const statsCards = [
    { 
      label: 'Total établissements', 
      value: establishments.length, 
      icon: Building2, 
      color: 'blue' 
    },
    { 
      label: 'Établissements actifs', 
      value: establishments.filter(e => e.statut === 'actif').length, 
      icon: CheckCircle, 
      color: 'green' 
    },
    { 
      label: 'Total citoyens inscrits', 
      value: stats?.citoyens_inscrits || 0, 
      icon: Users, 
      color: 'purple' 
    },
    { 
      label: 'Tickets aujourd\'hui', 
      value: stats?.tickets_total || 0, 
      icon: Ticket, 
      color: 'pink' 
    },
    { 
      label: 'RDV aujourd\'hui', 
      value: stats?.rdv_total || 0, 
      icon: Calendar, 
      color: 'indigo' 
    },
    { 
      label: 'Demandes en attente', 
      value: pendingCount, 
      icon: AlertCircle, 
      color: 'orange' 
    },
    { 
      label: 'Établissements suspendus', 
      value: establishments.filter(e => e.statut === 'suspendu').length, 
      icon: Building2, 
      color: 'red' 
    },
    { 
      label: 'Taux utilisation global', 
      value: stats?.taux_utilisation ? `${stats.taux_utilisation}%` : '—', 
      icon: TrendingUp, 
      color: 'emerald' 
    },
  ];

  // Activités récentes (basées sur les derniers établissements)
  const recentActivities = establishments
    .sort((a, b) => new Date(b.date_inscription) - new Date(a.date_inscription))
    .slice(0, 5)
    .map(etab => {
      let action = '';
      let type = 'info';

      switch(etab.statut) {
        case 'actif':
          action = `Établissement "${etab.nom}" validé`;
          type = 'success';
          break;
        case 'en_attente':
          action = `Établissement "${etab.nom}" soumis`;
          type = 'info';
          break;
        case 'suspendu':
          action = `Établissement "${etab.nom}" suspendu`;
          type = 'warning';
          break;
        case 'rejete':
          action = `Établissement "${etab.nom}" rejeté`;
          type = 'warning';
          break;
        default:
          action = `Établissement "${etab.nom}" mis à jour`;
          type = 'info';
      }

      return {
        action,
        time: getRelativeTime(new Date(etab.date_inscription)),
        type
      };
    });

  // Fonction pour calculer le temps relatif
  function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white p-6 hidden lg:block relative">
        <Link to="/" className="flex items-center space-x-2 mb-10">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="font-bold text-xl">F</span>
          </div>
          <span className="text-xl font-bold">FileZen</span>
        </Link>

        <nav className="space-y-2">
          <Link 
            to="/superadmin/dashboard" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Vue d'ensemble</span>
          </Link>
          
          <Link 
            to="/superadmin/validate" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors relative"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Validation établissements</span>
            {pendingCount > 0 && (
              <Badge className="absolute right-3 bg-orange-500">{pendingCount}</Badge>
            )}
          </Link>
          
          <Link 
            to="/superadmin/establishments" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Building2 className="w-5 h-5" />
            <span>Gestion établissements</span>
          </Link>
          
          <Link 
            to="/superadmin/stats" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques globales</span>
          </Link>
          
          <Link 
            to="/superadmin/settings" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Configuration</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm font-semibold mb-1">Super Admin</p>
            <p className="text-xs text-white/70">{user?.email || 'admin@filezen.tn'}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Super-Admin</h1>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Map Section (Placeholder) */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Répartition géographique des établissements
            </h2>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-700 font-semibold">Carte interactive de la Tunisie</p>
                <p className="text-gray-600 text-sm">
                  Visualisation des établissements par gouvernorat
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {establishments.length} établissements répartis à travers le pays
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Activité récente</h2>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}