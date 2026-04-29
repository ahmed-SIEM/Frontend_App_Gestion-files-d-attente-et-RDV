import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { etablissementsAPI } from '../services/api';
import {
  Loader2,
  Save,
  CheckCircle2
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ConfigureHoursPage() {
  const { user } = useAuth();

  const [horaires, setHoraires] = useState({
    lundi: { ouvert: true, ouverture: '08:00', fermeture: '17:00' },
    mardi: { ouvert: true, ouverture: '08:00', fermeture: '17:00' },
    mercredi: { ouvert: true, ouverture: '08:00', fermeture: '17:00' },
    jeudi: { ouvert: true, ouverture: '08:00', fermeture: '17:00' },
    vendredi: { ouvert: true, ouverture: '08:00', fermeture: '17:00' },
    samedi: { ouvert: true, ouverture: '08:00', fermeture: '13:00' },
    dimanche: { ouvert: false, ouverture: '08:00', fermeture: '17:00' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const jours = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await etablissementsAPI.getById(user.etablissement_id);

      // Si l'établissement a déjà des horaires, les charger
      if (response.data.horaires) {
        setHoraires(response.data.horaires);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOuvert = (jour) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        ouvert: !prev[jour].ouvert
      }
    }));
  };

  const handleChangeHeure = (jour, type, value) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        [type]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await etablissementsAPI.update({ horaires });
      
      toast.success('Horaires enregistrés avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Configuration Horaires</h1>
            <p className="text-gray-600">Définissez vos horaires d'ouverture pour chaque jour</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <Card className="p-6 max-w-4xl">
            <div className="space-y-6">
              {jours.map((jour, index) => (
                <motion.div
                  key={jour.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                >
                  {/* Jour */}
                  <div className="flex items-center space-x-4 w-32">
                    <span className="font-semibold text-gray-900">{jour.label}</span>
                  </div>

                  {/* Toggle Ouvert/Fermé */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleOuvert(jour.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        horaires[jour.key].ouvert
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          horaires[jour.key].ouvert ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${
                      horaires[jour.key].ouvert ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {horaires[jour.key].ouvert ? 'Ouvert' : 'Fermé'}
                    </span>
                  </div>

                  {/* Heures */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Ouverture</label>
                      <input
                        type="time"
                        value={horaires[jour.key].ouverture}
                        onChange={(e) => handleChangeHeure(jour.key, 'ouverture', e.target.value)}
                        disabled={!horaires[jour.key].ouvert}
                        className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          horaires[jour.key].ouvert
                            ? 'bg-white border-gray-300'
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <span className="text-gray-400">→</span>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Fermeture</label>
                      <input
                        type="time"
                        value={horaires[jour.key].fermeture}
                        onChange={(e) => handleChangeHeure(jour.key, 'fermeture', e.target.value)}
                        disabled={!horaires[jour.key].ouvert}
                        className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          horaires[jour.key].ouvert
                            ? 'bg-white border-gray-300'
                            : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bouton Enregistrer */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Enregistrer les horaires
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 mt-6 max-w-4xl bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">À propos des horaires</h3>
                <p className="text-sm text-gray-600">
                  Ces horaires déterminent quand les citoyens peuvent prendre des tickets. 
                  Les tickets ne peuvent être pris que pendant les heures d'ouverture, 
                  et le système calcule automatiquement si un citoyen peut être servi avant la fermeture.
                </p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}