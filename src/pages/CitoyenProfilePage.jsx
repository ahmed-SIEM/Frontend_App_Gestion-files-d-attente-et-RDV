import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CitoyenProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const response = await authAPI.uploadPhotoProfil(file);
      updateUser(response.data);
      toast.success(t('citoyen_profile.photo_success'));
    } catch (error) {
      toast.error(error.message || t('errors.server'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [infos, setInfos] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: ''
  });

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
      toast.error(t('citoyen_profile.required_fields'));
      return;
    }
    try {
      setSavingInfo(true);
      const response = await authAPI.updateProfile(infos);
      updateUser(response.data);
      toast.success(t('citoyen_profile.info_success'));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || t('errors.server'));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.ancien_mot_de_passe || !passwords.nouveau_mot_de_passe) {
      toast.error(t('citoyen_profile.all_fields'));
      return;
    }
    if (passwords.nouveau_mot_de_passe !== passwords.confirmer_mot_de_passe) {
      toast.error(t('errors.passwords_not_match'));
      return;
    }
    if (passwords.nouveau_mot_de_passe.length < 6) {
      toast.error(t('errors.password_too_short'));
      return;
    }
    try {
      setSavingPassword(true);
      await authAPI.changePassword({
        ancien_mot_de_passe: passwords.ancien_mot_de_passe,
        nouveau_mot_de_passe: passwords.nouveau_mot_de_passe
      });
      toast.success(t('citoyen_profile.password_success'));
      setPasswords({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmer_mot_de_passe: '' });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || t('errors.server'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('citoyen_profile.title')}</h1>
        <p className="text-gray-600">{t('citoyen_profile.subtitle')}</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Avatar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 text-center">
            <div className="relative inline-block mb-4">
              {user?.photo_profil ? (
                <img src={user.photo_profil} alt={t('citoyen_profile.title')} className="w-32 h-32 rounded-full object-cover" />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-gray-200"
              >
                {uploadingPhoto ? <Loader2 className="w-5 h-5 text-gray-600 animate-spin" /> : <Camera className="w-5 h-5 text-gray-600" />}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user?.prenom} {user?.nom}
            </h2>
            <Badge className="bg-blue-600 mb-4">{t('citoyen_profile.citizen_badge')}</Badge>

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
                <User className="w-5 h-5 me-2 text-blue-600" />
                {t('citoyen_profile.personal_info')}
              </h3>

              <form onSubmit={handleUpdateInfos} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('signup_citizen.firstname')} *
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
                      {t('signup_citizen.lastname')} *
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
                    {t('signup_citizen.email')} *
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
                    {t('signup_citizen.phone')}
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
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {savingInfo ? (
                      <>
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                        {t('citoyen_profile.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 me-2" />
                        {t('citoyen_profile.save_changes')}
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
                <Lock className="w-5 h-5 me-2 text-blue-600" />
                {t('citoyen_profile.change_password_title')}
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.current_password')} *
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
                    {t('profile.new_password')} *
                  </label>
                  <input
                    type="password"
                    value={passwords.nouveau_mot_de_passe}
                    onChange={(e) => setPasswords({ ...passwords, nouveau_mot_de_passe: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('citoyen_profile.password_min')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('citoyen_profile.confirm_new_password')} *
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
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                        {t('citoyen_profile.changing')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 me-2" />
                        {t('citoyen_profile.change_btn')}
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
  );
}
