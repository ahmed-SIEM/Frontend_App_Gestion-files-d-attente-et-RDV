import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/';
    if (user?.role === 'super_admin') return '/superadmin/dashboard';
    if (user?.role === 'admin_etablissement') return '/admin/dashboard';
    if (user?.role === 'agent') return '/agent/dashboard';
    return '/citoyen/home';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <Link to="/" className="inline-flex items-center space-x-2 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FileZen
          </span>
        </Link>

        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <div className="text-[120px] font-black leading-none bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent select-none">
            404
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-6"
        >
          🔍
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('not_found.title')}</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">{t('not_found.subtitle')}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 me-2" />
            {t('not_found.previous')}
          </Button>
          <Link to={getDashboardLink()} className="w-full sm:w-auto">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Home className="w-4 h-4 me-2" />
              {isAuthenticated ? t('not_found.dashboard') : t('not_found.home')}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
