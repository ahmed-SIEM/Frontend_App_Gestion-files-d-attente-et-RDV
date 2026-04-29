import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Building2, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/superadmin/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FileZen Super Admin
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link to="/superadmin/dashboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/superadmin/validate">
                <Button variant="ghost" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Valider
                </Button>
              </Link>
              <Link to="/superadmin/establishments">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Gérer
                </Button>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nom_complet || user?.email}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}