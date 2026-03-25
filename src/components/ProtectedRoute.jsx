import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Pendant le chargement, afficher un loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Rediriger vers le dashboard approprié selon le rôle
    switch (user?.role) {
      case 'super_admin':
        return <Navigate to="/super-admin/dashboard" replace />;
      case 'admin_etablissement':
        return <Navigate to="/admin/dashboard" replace />;
      case 'agent':
        return <Navigate to="/agent/dashboard" replace />;
      case 'citoyen':
        return <Navigate to="/citoyen/home" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Tout est bon, afficher la page
  return children;
}