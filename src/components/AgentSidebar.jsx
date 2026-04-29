import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Calendar, User, LogOut, BarChart3 } from 'lucide-react';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { to: '/agent/dashboard',    icon: LayoutDashboard, label: 'File d\'attente' },
  { to: '/agent/appointments', icon: Calendar,         label: 'Rendez-vous' },
  { to: '/agent/stats',        icon: BarChart3,        label: 'Mes Statistiques' },
  { to: '/agent/profile',      icon: User,             label: 'Mon Profil' },
];

export default function AgentSidebar({ serviceName }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-green-900 to-green-700 text-white flex flex-col hidden lg:flex">
      {/* Top */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-white/10">
        <Link to="/agent/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">F</span>
          </div>
          <span className="font-bold text-lg">FileZen</span>
        </Link>
        <div className="[&_button]:text-white [&_button:hover]:bg-white/10 [&_svg]:text-white">
          <NotificationBell align="left" />
        </div>
      </div>

      {/* Agent info */}
      <div className="px-6 py-4">
        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Agent</p>
        <p className="font-semibold text-sm truncate">{serviceName || 'Mon Service'}</p>
        <p className="text-xs text-white/60 mt-0.5">Guichet {user?.numero_guichet || '—'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-white/20 font-semibold' : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
