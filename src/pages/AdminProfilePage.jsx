import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Loader2,
  Camera,
  CheckCircle2,
  LayoutDashboard,
  Clock,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Infos personnelles
  const [infos, setInfos] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: ''
  });

  // Changement mot de passe
  const [passwords, setPasswords] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmer_mot_de_passe: ''
  });

  useEffect(() => {
    if (user) {
      setInfos({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || ''
      });
    }
  }, [user]);

  const handleUpdateInfos = async (e) => {
    e.preventDefault();

    if (!infos.prenom.trim() || !infos.nom.trim() || !infos.email.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSavingInfo(true);
      const response = await authAPI.updateProfile(infos);
      updateUser(response.data);
      toast.success('Informations mises à jour avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwords.ancien_mot_de_passe || !passwords.nouveau_mot_de_passe) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (passwords.nouveau_mot_de_passe !== passwords.confirmer_mot_de_passe) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwords.nouveau_mot_de_passe.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setSavingPassword(true);
      await authAPI.changePassword({
        ancien_mot_de_passe: passwords.ancien_mot_de_passe,
        nouveau_mot_de_passe: passwords.nouveau_mot_de_passe
      });
      toast.success('Mot de passe modifié avec succès !');
      setPasswords({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmer_mot_de_passe: ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white p-6 hidden lg:block relative">
        <Link to="/" className="flex items-center space-x-2 mb-10">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="font-bold text-xl">F</span>
          </div>
          <span className="text-xl font-bold">FileZen</span>
        </Link>

        <nav className="space-y-2">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/admin/hours" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>Horaires & Pauses</span>
          </Link>

          <Link 
            to="/admin/services" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Briefcase className="w-5 h-5" />
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
            to="/admin/appointments-config" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Configuration RDV</span>
          </Link>

          <Link 
            to="/admin/stats" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques</span>
          </Link>

          <div className="border-t border-white/20 my-4" />

          <Link 
            to="/admin/profile" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <User className="w-5 h-5" />
            <span>Mon profil</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-gray-600">Gérez vos informations personnelles</p>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Sidebar - Avatar et infos de base */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 text-center">
                  {/* Avatar */}
                  <div className="relative inline-block mb-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {user?.prenom?.[0]}{user?.nom?.[0]}
                    </div>
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-gray-200">
                      <Camera className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {user?.prenom} {user?.nom}
                  </h2>
                  <Badge className="bg-blue-600 mb-4">Administrateur</Badge>

                  <div className="pt-4 border-t space-y-3 text-sm text-left">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    {user?.telephone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{user.telephone}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations personnelles */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Informations personnelles
                    </h3>

                    <form onSubmit={handleUpdateInfos} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            value={infos.prenom}
                            onChange={(e) => setInfos({ ...infos, prenom: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom *
                          </label>
                          <input
                            type="text"
                            value={infos.nom}
                            onChange={(e) => setInfos({ ...infos, nom: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={infos.email}
                          onChange={(e) => setInfos({ ...infos, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={infos.telephone}
                          onChange={(e) => setInfos({ ...infos, telephone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+216 XX XXX XXX"
                        />
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          disabled={savingInfo}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {savingInfo ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Enregistrer les modifications
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>

                {/* Changer mot de passe */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-blue-600" />
                      Changer le mot de passe
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe actuel *
                        </label>
                        <input
                          type="password"
                          value={passwords.ancien_mot_de_passe}
                          onChange={(e) => setPasswords({ ...passwords, ancien_mot_de_passe: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nouveau mot de passe *
                        </label>
                        <input
                          type="password"
                          value={passwords.nouveau_mot_de_passe}
                          onChange={(e) => setPasswords({ ...passwords, nouveau_mot_de_passe: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          minLength={6}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum 6 caractères
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le nouveau mot de passe *
                        </label>
                        <input
                          type="password"
                          value={passwords.confirmer_mot_de_passe}
                          onChange={(e) => setPasswords({ ...passwords, confirmer_mot_de_passe: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          disabled={savingPassword}
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          {savingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Modification...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Changer le mot de passe
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}