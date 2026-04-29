import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⭐ NOUVEAU - Redirection automatique si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirection selon le rôle
      if (user.role === 'super_admin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (user.role === 'admin_etablissement') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'agent') {
        navigate('/agent/dashboard', { replace: true });
      } else if (user.role === 'citoyen') {
        navigate('/citoyen/home', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password, rememberMe); // ⭐ Passe rememberMe
      
      if (result.success) {
        toast.success(t('login.success'));
        
        // Redirection selon le rôle
        const role = result.user.role;
        
        if (role === 'super_admin') {
          navigate('/superadmin/dashboard');
        } else if (role === 'admin_etablissement') {
          navigate('/admin/dashboard');
        } else if (role === 'agent') {
          navigate('/agent/dashboard');
        } else if (role === 'citoyen') {
          navigate('/citoyen/home');
        }
      } else if (result.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(result.message);
        navigate(`/verify-email?userId=${result.userId}&email=${encodeURIComponent(email)}`);
      } else {
        toast.error(result.message || t('login.error'));
      }
    } catch (error) {
      toast.error(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex">
      {/* Left Side - Image/Info */}
      <div className="hidden lg:block w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-2 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold">FileZen</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-6">{t('login.welcome_back')}</h1>
            <p className="text-xl text-white/80 mb-12">{t('login.welcome_sub')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16"
          >
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800"
              alt="FileZen"
              className="rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 shadow-xl">
            <div className="flex items-center space-x-2 mb-8 lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FileZen
              </span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t('login.title')}</h2>
              <LanguageSwitcher />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.email_placeholder')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked)}
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                    {t('login.remember_me')}
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  {t('login.forgot_password')}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? t('login.loading') : t('login.submit')}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('login.or')}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                {t('login.no_account')}{' '}
                <Link to="/account-type" className="text-blue-600 hover:underline font-semibold">
                  {t('login.create_account')}
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}