import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error(t('forgot_password.error_empty')); return; }
    try {
      setLoading(true);
      const response = await authAPI.forgotPassword(email);
      if (response.success) { setEmailSent(true); toast.success(t('forgot_password.success')); }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || t('errors.server'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          {/* Header */}
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('forgot_password.title')}</h1>
            <p className="text-gray-600">{t('forgot_password.subtitle')}</p>
          </div>

          {emailSent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('forgot_password.sent_title')}</h3>
              <p className="text-gray-600 mb-2">{t('forgot_password.sent_msg')} <strong>{email}</strong></p>
              <p className="text-sm text-gray-500 mb-6">{t('forgot_password.check_spam')}</p>
              <Link to="/login">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t('forgot_password.back_login')}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('forgot_password.email_label')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('forgot_password.email_placeholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t('forgot_password.loading')}</>
                  ) : (
                    <><Mail className="w-4 h-4 me-2" />{t('forgot_password.submit')}</>
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 me-1" />
                  {t('forgot_password.back_login')}
                </Link>
              </div>
            </>
          )}
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('forgot_password.no_account')}{' '}
          <Link to="/account-type" className="text-blue-600 hover:text-blue-700 font-medium">
            {t('forgot_password.signup')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
