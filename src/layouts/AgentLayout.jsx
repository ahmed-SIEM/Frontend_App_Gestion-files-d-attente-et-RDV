import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import { etablissementsAPI } from '../services/api';

export default function AgentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);

  useEffect(() => {
    fetchEstablishment();
  }, []);

  const fetchEstablishment = async () => {
    try {
      const response = await etablissementsAPI.getById(user.etablissement_id);
      setEstablishment(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
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
        <Outlet />
      </div>
    </div>
  );
}