import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { gouvernorats } from '../data/constants';
import { useAuth } from '../contexts/AuthContext';
import { etablissementsAPI } from '../services/api';
import { Upload, X, CheckCircle2, FileText, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import MapPicker from '../components/MapPicker';

export default function SignupEtablissementPage() {
  const navigate = useNavigate();
  const { signupEtablissement } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    type_autre: '',
    description: '',
    adresse: '',
    ville: '',
    gouvernorat: '',
    telephone: '',
    email: '',
    site_web: '',
    prenom_admin: '',
    nom_admin: '',
    email_admin: '',
    telephone_admin: '',
    poste_admin: '',
    mot_de_passe_admin: '',
    confirmPassword: '',
  });

  const [documents, setDocuments] = useState([]);

  // Validation téléphone tunisien
  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
    const format1 = /^[24579][0-9]{7}$/;
    const format2 = /^216[24579][0-9]{7}$/;
    return format1.test(cleanPhone) || format2.test(cleanPhone);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newDocs = Array.from(files).map((file) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        file: file,
      }));
      setDocuments((prev) => [...prev, ...newDocs]);
      toast.success(`${newDocs.length} document(s) ajouté(s)`);
    }
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
    toast.info('Document supprimé');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.nom || !formData.type || !formData.description) {
      toast.error('Veuillez remplir toutes les informations de l\'établissement');
      return;
    }

    if (formData.type === 'autre' && !formData.type_autre) {
      toast.error('Veuillez préciser le type d\'établissement');
      return;
    }

    if (formData.description.length < 20) {
      toast.error('La description doit contenir au moins 20 caractères');
      return;
    }

    if (!formData.adresse || !formData.ville || !formData.gouvernorat) {
      toast.error('Veuillez remplir toutes les informations de localisation');
      return;
    }

    if (formData.adresse.length < 10) {
      toast.error('L\'adresse doit contenir au moins 10 caractères');
      return;
    }

    if (!validatePhone(formData.telephone)) {
      toast.error('Numéro de téléphone établissement invalide');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email établissement invalide');
      return;
    }

    if (!formData.prenom_admin || !formData.nom_admin || !formData.email_admin || !formData.telephone_admin || !formData.poste_admin) {
      toast.error('Veuillez remplir toutes les informations administrateur');
      return;
    }

    if (!validatePhone(formData.telephone_admin)) {
      toast.error('Numéro de téléphone administrateur invalide');
      return;
    }

    if (!emailRegex.test(formData.email_admin)) {
      toast.error('Email administrateur invalide');
      return;
    }

    if (!formData.mot_de_passe_admin || formData.mot_de_passe_admin.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.mot_de_passe_admin !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (documents.length === 0) {
      toast.warning('Aucun document uploadé');
    }

    setLoading(true);

    try {
      // Uploader les fichiers d'abord si présents
      let documentsUploades = [];
      const filesAvecFichier = documents.filter(doc => doc.file);
      if (filesAvecFichier.length > 0) {
        const uploadResult = await etablissementsAPI.uploadDocuments(filesAvecFichier);
        documentsUploades = uploadResult.data || [];
      }

      const etablissementData = {
        nom_etablissement: formData.nom,
        type: formData.type === 'autre' ? formData.type_autre : formData.type,
        description: formData.description,
        adresse: formData.adresse,
        ville: formData.ville,
        code_postal: '',
        gouvernorat: formData.gouvernorat,
        telephone_etablissement: formData.telephone,
        email_etablissement: formData.email,
        site_web: formData.site_web || undefined,
        nom_complet: `${formData.prenom_admin} ${formData.nom_admin}`,
        fonction: formData.poste_admin,
        email_admin: formData.email_admin,
        telephone_admin: formData.telephone_admin,
        mot_de_passe: formData.mot_de_passe_admin,
        documents: documentsUploades,
      };

      const result = await signupEtablissement(etablissementData);

      if (result.success) {
        toast.success('✅ Demande envoyée ! Vérifiez votre email pour confirmer.', { duration: 3000 });
        navigate(`/verify-email?userId=${result.userId}&email=${encodeURIComponent(result.email)}&type=etablissement`);
      } else {
        toast.error(result.message || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const requiredDocuments = [
    'Registre de commerce',
    "Autorisation d'activité",
    'Carte d\'identité du responsable',
    'Justificatif d\'adresse de l\'établissement',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FileZen
            </span>
          </Link>

          <Card className="p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Rejoignez FileZen en tant qu'Établissement
              </h1>
              <p className="text-lg text-gray-600">
                Complétez le formulaire pour être évalué par notre équipe
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1 - Informations Établissement */}
              <div className="border-b pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  Informations Établissement
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nom">Nom de l'établissement *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => updateField('nom', e.target.value)}
                      placeholder="Mairie de Tunis, Hôpital Charles Nicolle..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type d'établissement *</Label>
                    <Select onValueChange={(value) => updateField('type', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mairie">Mairie</SelectItem>
                        <SelectItem value="hopital">Hôpital / Clinique</SelectItem>
                        <SelectItem value="poste">Bureau de poste</SelectItem>
                        <SelectItem value="cnam">CNAM</SelectItem>
                        <SelectItem value="banque">Banque</SelectItem>
                        <SelectItem value="administration">Administration</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.type === 'autre' && (
                    <div>
                      <Label htmlFor="type_autre">Préciser le type *</Label>
                      <Input
                        id="type_autre"
                        value={formData.type_autre}
                        onChange={(e) => updateField('type_autre', e.target.value)}
                        placeholder="Ex: Centre culturel, École..."
                        required
                      />
                    </div>
                  )}
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description de l'établissement *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Décrivez brièvement votre établissement, ses services..."
                      rows={3}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 20 caractères
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2 - Localisation */}
              <div className="border-b pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  Localisation
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="adresse">Adresse complète *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="adresse"
                        value={formData.adresse}
                        onChange={(e) => updateField('adresse', e.target.value)}
                        placeholder="Rue, Avenue, Numéro..."
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-4"
                        title="Choisir sur la carte"
                      >
                        <MapPin className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 10 caractères • Ou cliquez sur 📍 pour choisir sur la carte
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="ville">Ville *</Label>
                    <Input
                      id="ville"
                      value={formData.ville}
                      onChange={(e) => updateField('ville', e.target.value)}
                      placeholder="Tunis, Sfax, Sousse..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gouvernorat">Gouvernorat *</Label>
                    <Select onValueChange={(value) => updateField('gouvernorat', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
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
              </div>

              {/* Section 3 - Contact */}
              <div className="border-b pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  Contact Établissement
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone">Téléphone principal *</Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => updateField('telephone', e.target.value)}
                      placeholder="71234567 ou +216 71234567"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format : 71234567 ou +216 71234567
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email">Email principal *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="contact@etablissement.tn"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="site_web">Site web (optionnel)</Label>
                    <Input
                      id="site_web"
                      value={formData.site_web}
                      onChange={(e) => updateField('site_web', e.target.value)}
                      placeholder="https://www.etablissement.tn"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4 - Documents */}
              <div className="border-b pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">4</span>
                  </div>
                  Documents Justificatifs
                </h2>

                <div className="mb-6">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Cliquez ou glissez vos fichiers ici</span>
                      </p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10 MB chacun)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      onChange={handleFileUpload} 
                      accept=".pdf,.jpg,.jpeg,.png" 
                    />
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.size}</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeDocument(index)} 
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="font-semibold text-blue-900 mb-3">Documents requis :</p>
                  <ul className="space-y-2">
                    {requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-center text-sm text-blue-700">
                        <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Section 5 - Administrateur */}
              <div className="border-b pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">5</span>
                  </div>
                  Administrateur Principal
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom_admin">Prénom de l'admin *</Label>
                    <Input
                      id="prenom_admin"
                      value={formData.prenom_admin}
                      onChange={(e) => updateField('prenom_admin', e.target.value)}
                      placeholder="Ahmed"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom_admin">Nom de l'admin *</Label>
                    <Input
                      id="nom_admin"
                      value={formData.nom_admin}
                      onChange={(e) => updateField('nom_admin', e.target.value)}
                      placeholder="Ben Salem"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_admin">Email de l'admin *</Label>
                    <Input
                      id="email_admin"
                      type="email"
                      value={formData.email_admin}
                      onChange={(e) => updateField('email_admin', e.target.value)}
                      placeholder="admin@etablissement.tn"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone_admin">Téléphone de l'admin *</Label>
                    <Input
                      id="telephone_admin"
                      value={formData.telephone_admin}
                      onChange={(e) => updateField('telephone_admin', e.target.value)}
                      placeholder="98765432"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format : 98765432 ou +216 98765432
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="poste_admin">Fonction / Poste *</Label>
                    <Input
                      id="poste_admin"
                      value={formData.poste_admin}
                      onChange={(e) => updateField('poste_admin', e.target.value)}
                      placeholder="Directeur Général, Responsable..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mot_de_passe_admin">Mot de passe *</Label>
                    <Input
                      id="mot_de_passe_admin"
                      type="password"
                      value={formData.mot_de_passe_admin}
                      onChange={(e) => updateField('mot_de_passe_admin', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 6 caractères
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer mot de passe *</Label>
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
              </div>

              {/* Important Info */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <p className="text-gray-900">
                  <strong>⚠️ Information importante :</strong> Votre demande sera examinée par notre équipe sous 24-48h. 
                  Nous vérifierons vos documents et vous recevrez un email de confirmation une fois votre établissement approuvé. 
                  Vous ne pourrez vous connecter qu'après validation.
                </p>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
              </Button>

              <div className="text-center">
                <p className="text-gray-600">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
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