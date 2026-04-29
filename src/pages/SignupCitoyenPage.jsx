import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { gouvernorats } from '../data/constants';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MapPicker from '../components/MapPicker';

export default function SignupCitoyenPage() {
  const navigate = useNavigate();
  const { signupCitoyen } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    cin: '',
    gouvernorat: '',
    email: '',
    telephone: '',
    adresse: '',
    mot_de_passe: '',
    confirmPassword: '',
  });

  const [passwordStrength, setPasswordStrength] = useState('weak');

  // Validation CIN tunisien (8 chiffres)
  const validateCIN = (cin) => {
    const cinRegex = /^[0-9]{8}$/;
    return cinRegex.test(cin);
  };

  // Validation téléphone tunisien
  const validatePhone = (phone) => {
    // Enlever les espaces et le +
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
    
    // Format 1: 98765432 (8 chiffres commençant par 2,4,5,7,9)
    const format1 = /^[24579][0-9]{7}$/;
    
    // Format 2: 21698765432 (216 + 8 chiffres)
    const format2 = /^216[24579][0-9]{7}$/;
    
    return format1.test(cleanPhone) || format2.test(cleanPhone);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'mot_de_passe') {
      // Simple password strength logic
      if (value.length < 6) setPasswordStrength('weak');
      else if (value.length < 10) setPasswordStrength('medium');
      else setPasswordStrength('strong');
    }
  };

  const handleNext = () => {
    // Validation Step 1
    if (step === 1) {
      if (!formData.prenom || !formData.nom || !formData.cin || !formData.gouvernorat) {
        toast.error(t('signup_citizen.errors.required_fields'));
        return;
      }

      if (!validateCIN(formData.cin)) {
        toast.error(t('signup_citizen.errors.cin_invalid'));
        return;
      }
    }
    
    // Validation Step 2
    if (step === 2) {
      if (!formData.email || !formData.telephone || !formData.adresse) {
        toast.error(t('signup_citizen.errors.required_fields')); return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error(t('signup_citizen.errors.email_invalid')); return;
      }
      if (!validatePhone(formData.telephone)) {
        toast.error(t('signup_citizen.errors.phone_invalid')); return;
      }
      if (formData.adresse.length < 10) {
        toast.error(t('signup_citizen.errors.address_short')); return;
      }
    }
    
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validation finale
    if (!formData.mot_de_passe || formData.mot_de_passe.length < 6) {
      toast.error(t('signup_citizen.errors.password_short')); return;
    }
    if (formData.mot_de_passe !== formData.confirmPassword) {
      toast.error(t('signup_citizen.errors.passwords_mismatch')); return;
    }

    setLoading(true);

    try {
      // Préparer les données pour l'API
      const userData = {
        email: formData.email,
        telephone: formData.telephone,
        mot_de_passe: formData.mot_de_passe,
        cin: formData.cin,
        prenom: formData.prenom,
        nom: formData.nom,
        adresse: formData.adresse,
        gouvernorat: formData.gouvernorat,
      };

      const result = await signupCitoyen(userData);

      if (result.success) {
        toast.success(t('signup_citizen.success'));
        navigate(`/verify-email?userId=${result.userId}&email=${encodeURIComponent(result.email)}`);
      } else {
        toast.error(result.message || t('signup_citizen.errors.create_error'));
      }
    } catch (error) {
      toast.error(t('signup_citizen.errors.create_error'));
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = [
    { number: 1, label: t('signup_citizen.steps.info') },
    { number: 2, label: t('signup_citizen.steps.contact') },
    { number: 3, label: t('signup_citizen.steps.security') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex">
      {/* Left Side - Progress */}
      <div className="hidden lg:block w-2/5 bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-white">
        <Link to="/" className="flex items-center space-x-2 mb-16">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="text-2xl font-bold">FileZen</span>
        </Link>

        <div className="space-y-8">
          {progressSteps.map((s, index) => (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center space-x-4 relative"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= s.number
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white'
                }`}
              >
                {step > s.number ? <Check className="w-6 h-6" /> : s.number}
              </div>
              <div>
                <div className="font-semibold text-lg">{s.label}</div>
                <div className="text-sm text-white/70">
                  {step === s.number ? t('signup_citizen.step_status.current') : step > s.number ? t('signup_citizen.step_status.done') : t('signup_citizen.step_status.upcoming')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-4">
            {step === 1 && t('signup_citizen.side.title1')}
            {step === 2 && t('signup_citizen.side.title2')}
            {step === 3 && t('signup_citizen.side.title3')}
          </h2>
          <p className="text-white/80">
            {step === 1 && t('signup_citizen.side.desc1')}
            {step === 2 && t('signup_citizen.side.desc2')}
            {step === 3 && t('signup_citizen.side.desc3')}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 shadow-xl">
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6 lg:hidden">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FileZen
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t('signup_citizen.step_label', { step, label: progressSteps[step - 1].label })}
              </h2>
            </div>

            {/* Step 1 - Informations */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prenom">{t('signup_citizen.firstname')} *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => updateField('prenom', e.target.value)}
                    placeholder="Mohamed"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nom">{t('signup_citizen.lastname')} *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    placeholder="Benali"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cin">{t('signup_citizen.cin')} *</Label>
                  <Input
                    id="cin"
                    value={formData.cin}
                    onChange={(e) => {
                      // Accepter uniquement les chiffres
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 8) {
                        updateField('cin', value);
                      }
                    }}
                    placeholder="12345678"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('signup_citizen.cin_hint')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="gouvernorat">{t('signup_citizen.governorate')} *</Label>
                  <Select onValueChange={(value) => updateField('gouvernorat', value)} value={formData.gouvernorat}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('signup_citizen.governorate_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {gouvernorats.map((g) => (
                        <SelectItem key={g.id} value={g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2 - Contact */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('signup_citizen.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="mohamed.benali@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">{t('signup_citizen.phone')} *</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => updateField('telephone', e.target.value)}
                    placeholder="98765432"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('signup_citizen.phone_hint')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="adresse">{t('signup_citizen.address')} *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) => updateField('adresse', e.target.value)}
                      placeholder={t('signup_citizen.address_placeholder')}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-4"
                      title={t('signup_citizen.map_title')}
                    >
                      <MapPin className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('signup_citizen.address_hint')}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3 - Sécurité */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mot_de_passe">{t('signup_citizen.password')} *</Label>
                  <Input
                    id="mot_de_passe"
                    type="password"
                    value={formData.mot_de_passe}
                    onChange={(e) => updateField('mot_de_passe', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === 'weak'
                            ? 'w-1/3 bg-red-500'
                            : passwordStrength === 'medium'
                            ? 'w-2/3 bg-yellow-500'
                            : 'w-full bg-green-500'
                        }`}
                      ></div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        passwordStrength === 'weak'
                          ? 'text-red-500'
                          : passwordStrength === 'medium'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`}
                    >
                      {passwordStrength === 'weak' && t('signup_citizen.strength.weak')}
                      {passwordStrength === 'medium' && t('signup_citizen.strength.medium')}
                      {passwordStrength === 'strong' && t('signup_citizen.strength.strong')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('signup_citizen.password_hint')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{t('signup_citizen.confirm_password')} *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t('signup_citizen.previous')}
                </Button>
              ) : (
                <div></div>
              )}
              {step < 3 ? (
                <Button onClick={handleNext} className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {t('signup_citizen.next')}
                  <ArrowRight className="w-4 h-4 ms-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? t('signup_citizen.submitting') : t('signup_citizen.submit')}
                </Button>
              )}
            </div>

            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {t('signup_citizen.terms')}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('signup_citizen.already_account')}{' '}
                  <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                    {t('signup_citizen.login_link')}
                  </Link>
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Map Picker Modal */}
      {showMap && (
        <MapPicker
          onAddressSelect={(address) => {
            updateField('adresse', address);
            setShowMap(false);
          }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}