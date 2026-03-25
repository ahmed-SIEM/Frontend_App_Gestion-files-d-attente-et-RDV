import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, etablissementsAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Ticket, 
  TrendingUp,
  Loader2,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [establishment, setEstablishment] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupérer l'établissement de l'admin
      const etablissementResponse = await etablissementsAPI.getById(user.etablissement);
      setEstablishment(etablissementResponse.data);

      // Récupérer les stats du dashboard
      const statsResponse = await statsAPI.getDashboardEtablissement(user.etablissement);
      setStats(statsResponse.data);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const statsCards = [
    { 
      label: 'Tickets aujourd\'hui', 
      value: stats?.tickets_aujourdhui || 0, 
      icon: Ticket, 
      color: 'blue' 
    },
    { 
      label: 'RDV aujourd\'hui', 
      value: stats?.rdv_aujourdhui || 0, 
      icon: CalendarIcon, 
      color: 'pink' 
    },
    { 
      label: 'Services actifs', 
      value: stats?.services_actifs || 0, 
      icon: Wrench, 
      color: 'purple' 
    },
    { 
      label: 'Agents actifs', 
      value: stats?.agents_actifs || 0, 
      icon: Users, 
      color: 'green' 
    },
    { 
      label: 'Temps attente moyen', 
      value: stats?.temps_attente_moyen ? `~${stats.temps_attente_moyen}min` : '—', 
      icon: Clock, 
      color: 'orange' 
    },
    { 
      label: 'Satisfaction', 
      value: stats?.satisfaction ? `${stats.satisfaction}%` : '—', 
      icon: TrendingUp, 
      color: 'emerald' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-900 to-purple-700 text-white p-6 hidden lg:block">
        <div className="mb-10">
          <p className="text-sm text-white/70 mb-1">Établissement</p>
          <p className="font-bold">{establishment?.nom || 'Mon Établissement'}</p>
        </div>
        
        <nav className="space-y-2">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Vue d'ensemble</span>
          </Link>
          
          <Link 
            to="/admin/services" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Wrench className="w-5 h-5" />
            <span>Gestion Services</span>
          </Link>
          
          <Link 
            to="/admin/agents" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Gestion Agents</span>
          </Link>
          
          <Link 
            to="/admin/hours" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>Horaires & Pauses</span>
          </Link>
          
          <Link 
            to="/admin/appointments-config" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Configuration RDV</span>
          </Link>
          
          <Link 
            to="/admin/stats" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques</span>
          </Link>
        </nav>

        {/* Logout button */}
        <div className="mt-auto pt-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenue, {user?.prenom} {user?.nom}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => navigate('/admin/services')}
            >
              <Wrench className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Créer un service</h3>
              <p className="text-gray-600">Ajoutez un nouveau service</p>
            </Card>
            
            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => navigate('/admin/agents')}
            >
              <Users className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Inviter un agent</h3>
              <p className="text-gray-600">Gérez votre équipe</p>
            </Card>
            
            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => navigate('/admin/hours')}
            >
              <Clock className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Configurer horaires</h3>
              <p className="text-gray-600">Définissez vos horaires</p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}