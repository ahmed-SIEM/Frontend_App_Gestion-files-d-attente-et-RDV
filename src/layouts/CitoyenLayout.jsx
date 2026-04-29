import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import NotificationBell from '../components/NotificationBell';

export default function CitoyenLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/citoyen/home" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                FileZen
              </span>
            </Link>

            {/* Navigation & User Menu */}
            <div className="flex items-center space-x-4">
              {/* Mes Activités Button */}
              <Link to="/citoyen/activities">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Mes activités
                </Button>
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* User Dropdown Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {user?.photo_profil ? (
                      <img src={user.photo_profil} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user?.prenom?.[0]}{user?.nom?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-gray-900">
                      {user?.prenom} {user?.nom}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Overlay pour fermer le menu */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <Link
                        to="/citoyen/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Mon profil</span>
                      </Link>
                      
                      <div className="border-t border-gray-200 my-2" />
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}