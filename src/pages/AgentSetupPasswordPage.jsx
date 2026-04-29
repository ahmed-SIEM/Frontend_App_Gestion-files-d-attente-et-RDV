import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function AgentSetupPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();

  const [agentInfo, setAgentInfo] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await authAPI.checkAgentSetupToken(token);
      setAgentInfo(res.data);
    } catch {
      setTokenInvalid(true);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authAPI.agentSetupPassword(token, password);

      // Auto-login
      const { token: jwt } = res;
      if (jwt) {
        localStorage.setItem('token', jwt);
      }

      setDone(true);
      toast.success('Mot de passe créé ! Bienvenue sur FileZen.');

      setTimeout(() => navigate('/agent/dashboard'), 2000);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création du mot de passe');
    } finally {
      setSubmitting(false);
    }
  };

  const strength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strengthLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'];
  const s = strength();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (tokenInvalid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-gray-500 mb-6">
            Ce lien d'invitation n'est plus valide. Il a peut-être expiré (7 jours) ou déjà été utilisé.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Contactez l'administrateur de votre établissement pour recevoir une nouvelle invitation.
          </p>
          <Link to="/login">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              Retour à la connexion
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte activé !</h1>
          <p className="text-gray-500">Redirection vers votre tableau de bord...</p>
          <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto mt-4" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            FileZen
          </span>
        </Link>

        {/* Bienvenue */}
        <div className="mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue, {agentInfo?.prenom} !
          </h1>
          <p className="text-gray-500 mt-1">
            Créez votre mot de passe pour activer votre compte agent.
          </p>
          <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
            📧 <strong>{agentInfo?.email}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Minimum 6 caractères"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Barre de force */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${i <= s ? strengthColor[s] : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${s <= 2 ? 'text-red-500' : s === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {strengthLabel[s]}
                </p>
              </div>
            )}
          </div>

          {/* Confirmer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 outline-none transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-400 focus:ring-red-400'
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-400 focus:ring-green-400'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder="Répétez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Les mots de passe correspondent
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting || password !== confirmPassword || password.length < 6}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-xl text-base"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Activation en cours...</>
            ) : (
              '🔐 Activer mon compte'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
