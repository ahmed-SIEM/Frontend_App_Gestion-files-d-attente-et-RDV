import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifierEmail, renvoyerCode } = useAuth();
  const { t } = useTranslation();

  const userId = searchParams.get('userId');
  const email  = searchParams.get('email');
  const type   = searchParams.get('type');

  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => { if (!userId) navigate('/login'); }, [userId, navigate]);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setCode(pasted.split('')); inputRefs.current[5]?.focus(); }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) { toast.error(t('verify_email.error_incomplete')); return; }
    setLoading(true);
    try {
      const result = await verifierEmail(userId, fullCode);
      if (result.success) {
        setVerified(true);
        if (result.autoLogin) {
          toast.success(t('verify_email.welcome_success'));
          setTimeout(() => navigate('/citoyen/home'), 1500);
        } else {
          toast.success(t('verify_email.pending_success'));
        }
      } else {
        toast.error(result.message || t('errors.server'));
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const result = await renvoyerCode(userId);
      if (result.success) {
        toast.success(t('verify_email.resent_success'));
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setCountdown(60);
      } else {
        toast.error(result.message || t('errors.server'));
      }
    } finally {
      setResending(false);
    }
  };

  if (verified && !type) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FileZen</span>
          </Link>
        </div>

        <Card className="p-8 shadow-xl">
          {verified && type === 'etablissement' ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">{t('verify_email.verified_title')}</h2>
              <p className="text-gray-600">{t('verify_email.verified_etab')}</p>
              <Button onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {t('verify_email.go_to_login')}
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('verify_email.title')}</h2>
                <p className="text-gray-600 text-sm">
                  {t('verify_email.subtitle')}{' '}
                  <span className="font-semibold text-gray-800">{email || '...'}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all ${
                      digit ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-900 focus:border-blue-400'
                    }`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <Button onClick={handleVerify} disabled={loading || code.join('').length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-base font-semibold">
                {loading ? t('verify_email.loading') : t('verify_email.submit')}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">{t('verify_email.not_received')}</p>
                <button onClick={handleResend} disabled={resending || countdown > 0}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                  <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                  {countdown > 0
                    ? t('verify_email.resend_in', { seconds: countdown })
                    : resending ? t('verify_email.resending') : t('verify_email.resend')}
                </button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
