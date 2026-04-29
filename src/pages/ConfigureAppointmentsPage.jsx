import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { servicesAPI, rdvAPI } from '../services/api';
import {
  Wrench, Clock, Calendar as CalendarIcon, Settings,
  Loader2, Save, AlertCircle, CheckCircle2, Eye,
  RefreshCw, Plus, Trash2, AlertTriangle, Sun,
  Zap, ChevronRight
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const formatDuree = (min) => {
  const m = Number(min);
  if (!m || m <= 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
};

const JOURS_OPTIONS = [
  { value: 'lundi', label: 'Lun' },
  { value: 'mardi', label: 'Mar' },
  { value: 'mercredi', label: 'Mer' },
  { value: 'jeudi', label: 'Jeu' },
  { value: 'vendredi', label: 'Ven' },
  { value: 'samedi', label: 'Sam' },
  { value: 'dimanche', label: 'Dim' },
];

export default function ConfigureAppointmentsPage() {
  useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creneauxResume, setCreneauxResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  // Exception form
  const [exceptionDateDebut, setExceptionDateDebut] = useState('');
  const [exceptionDateFin, setExceptionDateFin] = useState('');
  const [exceptionType, setExceptionType] = useState('ferme');
  const [exceptionHeureDebut, setExceptionHeureDebut] = useState('');
  const [exceptionHeureFin, setExceptionHeureFin] = useState('');
  const [exceptionRaison, setExceptionRaison] = useState('');
  const [addingException, setAddingException] = useState(false);

  const [config, setConfig] = useState({
    duree_creneau: 30,
    jours: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
    heure_debut: '08:00',
    heure_fin: '17:00',
    pause_debut: '12:00',
    pause_fin: '13:00',
  });

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedService) {
      if (selectedService.config_rdv) {
        setConfig({
          duree_creneau: selectedService.config_rdv.duree_creneau || 30,
          jours: selectedService.config_rdv.jours || ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
          heure_debut: selectedService.config_rdv.heure_debut || '08:00',
          heure_fin: selectedService.config_rdv.heure_fin || '17:00',
          pause_debut: selectedService.config_rdv.pause_debut || '12:00',
          pause_fin: selectedService.config_rdv.pause_fin || '13:00',
        });
      }
      fetchCreneauxResume();
    }
  }, [selectedService?._id]);

  useEffect(() => {
    if (activeTab === 'apercu' && selectedService) fetchCreneauxResume();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await servicesAPI.getMesServices();
      const avecRdv = res.data.filter(s => s.rdv_active);
      setServices(avecRdv);
      if (avecRdv.length > 0) setSelectedService(avecRdv[0]);
    } catch {
      toast.error('Erreur chargement services');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreneauxResume = async () => {
    if (!selectedService) return;
    try {
      setLoadingResume(true);
      const today = new Date().toISOString().split('T')[0];
      const in14 = new Date(); in14.setDate(in14.getDate() + 14);
      const res = await rdvAPI.creneauxService(selectedService._id, today, in14.toISOString().split('T')[0]);
      setCreneauxResume(res.data);
    } catch {
      setCreneauxResume(null);
    } finally {
      setLoadingResume(false);
    }
  };

  const toggleJour = (jour) => {
    setConfig(prev => ({
      ...prev,
      jours: prev.jours.includes(jour)
        ? prev.jours.filter(j => j !== jour)
        : [...prev.jours, jour]
    }));
  };

  const calculateCreneaux = () => {
    const [hdH, hdM] = config.heure_debut.split(':').map(Number);
    const [hfH, hfM] = config.heure_fin.split(':').map(Number);
    const finMin = hfH * 60 + hfM;
    const debutMin = hdH * 60 + hdM;
    let pauseMin = 0;
    if (config.pause_debut && config.pause_fin) {
      const [pdH, pdM] = config.pause_debut.split(':').map(Number);
      const [pfH, pfM] = config.pause_fin.split(':').map(Number);
      pauseMin = Math.max(0, (pfH * 60 + pfM) - (pdH * 60 + pdM));
    }
    return Math.max(0, Math.floor((finMin - debutMin - pauseMin) / config.duree_creneau));
  };

  const handleSave = async () => {
    if (!selectedService) return toast.error('Sélectionnez un service');
    if (config.jours.length === 0) return toast.error('Sélectionnez au moins un jour');
    try {
      setSaving(true);
      await rdvAPI.configurerRDV(selectedService._id, config);
      toast.success('✅ Configuration enregistrée ! Les créneaux se génèrent automatiquement.');
      await fetchData();
      fetchCreneauxResume();
    } catch (e) {
      toast.error(e.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!exceptionDateDebut) return toast.error('Sélectionnez une date de début');
    if (exceptionDateFin && exceptionDateFin < exceptionDateDebut) return toast.error('La date de fin doit être après la date de début');
    try {
      setAddingException(true);
      await rdvAPI.ajouterException(selectedService._id, {
        date: exceptionDateDebut,
        date_fin: exceptionDateFin || undefined,
        type: exceptionType,
        heure_debut_exceptionnelle: exceptionType === 'horaire_modifie' && exceptionHeureDebut ? exceptionHeureDebut : undefined,
        heure_fin_exceptionnelle: exceptionType === 'horaire_modifie' && exceptionHeureFin ? exceptionHeureFin : undefined,
        raison: exceptionRaison || undefined
      });
      toast.success('Exception ajoutée !');
      setExceptionDateDebut('');
      setExceptionDateFin('');
      setExceptionHeureDebut('');
      setExceptionHeureFin('');
      setExceptionRaison('');
      fetchData();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setAddingException(false);
    }
  };

  const handleRemoveException = async (date) => {
    try {
      await rdvAPI.supprimerException(selectedService._id, date);
      toast.success('Exception supprimée');
      fetchData();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    }
  };

  const exceptions = selectedService?.config_rdv?.exceptions || [];

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

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Configuration Rendez-vous</h1>
            <p className="text-gray-500 text-sm">Planning récurrent automatique — configurez une fois, ça tourne tout seul</p>
          </div>
        </header>

        <main className="p-8">
          {services.length === 0 ? (
            <Card className="p-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun service avec RDV activé</h3>
              <p className="text-gray-500 mb-6">Activez d'abord les rendez-vous sur un service depuis la gestion des services.</p>
              <Button onClick={() => navigate('/admin/services')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Wrench className="w-4 h-4 mr-2" /> Gérer les services
              </Button>
            </Card>
          ) : (
            <div className="max-w-5xl space-y-6">

              {/* Sélecteur de service */}
              <Card className="p-6">
                <p className="text-sm font-medium text-gray-500 mb-3">Service à configurer</p>
                <div className="flex flex-wrap gap-3">
                  {services.map(s => (
                    <button key={s._id} onClick={() => setSelectedService(s)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedService?._id === s._id
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-gray-200 hover:border-purple-300 text-gray-700 bg-white'
                      }`}
                    >
                      {s.nom}
                      {s.config_rdv ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3" /> Auto
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">À config.</span>
                      )}
                    </button>
                  ))}
                </div>
              </Card>

              {selectedService && (
                <motion.div key={selectedService._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                  {/* Tabs */}
                  <div className="flex gap-1 bg-white border rounded-xl p-1 shadow-sm w-fit">
                    {[
                      { id: 'config', label: 'Planning récurrent', icon: Settings },
                      { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, badge: exceptions.length },
                      { id: 'apercu', label: 'Aperçu créneaux', icon: Eye },
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                          {tab.badge > 0 && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">

                    {/* ===== TAB : Configuration ===== */}
                    {activeTab === 'config' && (
                      <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

                        {/* Statut auto-génération */}
                        <Card className={`p-4 border-2 ${selectedService.config_rdv ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${selectedService.config_rdv ? 'bg-green-100' : 'bg-amber-100'}`}>
                              {selectedService.config_rdv
                                ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                                : <AlertCircle className="w-6 h-6 text-amber-600" />
                              }
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${selectedService.config_rdv ? 'text-green-800' : 'text-amber-800'}`}>
                                {selectedService.config_rdv ? 'Auto-génération active' : 'Aucune configuration'}
                              </p>
                              <p className={`text-sm mt-0.5 ${selectedService.config_rdv ? 'text-green-600' : 'text-amber-600'}`}>
                                {selectedService.config_rdv
                                  ? `Créneaux de ${selectedService.config_rdv.duree_creneau} min — ${selectedService.config_rdv.jours?.join(', ')} — ${selectedService.config_rdv.heure_debut} → ${selectedService.config_rdv.heure_fin}`
                                  : 'Définissez le planning ci-dessous pour activer l\'auto-génération'
                                }
                              </p>
                            </div>
                            {selectedService.config_rdv && (
                              <ChevronRight className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                        </Card>

                        {/* Durée */}
                        <Card className="p-6">
                          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            Durée par rendez-vous
                          </h3>
                          <p className="text-xs text-gray-400 mb-4">
                            Pour des durées variables, choisissez le créneau le plus court — le patient peut réserver plusieurs créneaux consécutifs.
                          </p>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              min="5"
                              max="480"
                              step="5"
                              value={config.duree_creneau}
                              onChange={e => setConfig({ ...config, duree_creneau: Math.max(5, Math.min(480, Number(e.target.value) || 5)) })}
                              className="w-28 px-3 py-2.5 border-2 border-purple-300 rounded-xl text-center text-lg font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <div>
                              <p className="text-2xl font-bold text-purple-600">{formatDuree(config.duree_creneau)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">par créneau (en minutes)</p>
                            </div>
                          </div>
                        </Card>

                        {/* Jours + Horaires */}
                        <div className="grid md:grid-cols-2 gap-5">
                          <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <CalendarIcon className="w-5 h-5 text-purple-600" />
                              Jours ouvrés
                            </h3>
                            <div className="flex gap-2">
                              {JOURS_OPTIONS.map(j => (
                                <button key={j.value} onClick={() => toggleJour(j.value)}
                                  className={`flex-1 h-11 rounded-xl text-xs font-semibold border-2 transition-all ${
                                    config.jours.includes(j.value)
                                      ? 'border-purple-600 bg-purple-600 text-white'
                                      : 'border-gray-200 text-gray-500 hover:border-purple-300'
                                  }`}
                                >
                                  {j.label}
                                </button>
                              ))}
                            </div>
                          </Card>

                          <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Settings className="w-5 h-5 text-purple-600" />
                              Horaires & pause
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { label: 'Ouverture', key: 'heure_debut' },
                                { label: 'Fermeture', key: 'heure_fin' },
                                { label: 'Début pause', key: 'pause_debut' },
                                { label: 'Fin pause', key: 'pause_fin' },
                              ].map(({ label, key }) => (
                                <div key={key}>
                                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                                  <input type="time" value={config[key]}
                                    onChange={e => setConfig({ ...config, [key]: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>

                        {/* Récapitulatif */}
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-purple-100">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-600" />
                            Résumé du planning
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: 'Créneaux / jour', value: `~${calculateCreneaux()}`, color: 'text-purple-600' },
                              { label: 'Jours / semaine', value: config.jours.length, color: 'text-blue-600' },
                              { label: 'RDV / semaine', value: `~${calculateCreneaux() * config.jours.length}`, color: 'text-green-600' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                                <p className="text-xs text-gray-400 mb-1">{label}</p>
                                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <div className="flex justify-end">
                          <Button onClick={handleSave} disabled={saving} size="lg"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Enregistrer la configuration
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* ===== TAB : Exceptions ===== */}
                    {activeTab === 'exceptions' && (
                      <motion.div key="exceptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

                        {/* Formulaire ajout exception */}
                        <Card className="p-6">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-500" />
                            Ajouter une exception
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">

                            {/* Dates */}
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date début *</label>
                              <input type="date" value={exceptionDateDebut}
                                onChange={e => setExceptionDateDebut(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                                Date fin <span className="text-gray-300">(optionnel — pour une plage)</span>
                              </label>
                              <input type="date" value={exceptionDateFin}
                                onChange={e => setExceptionDateFin(e.target.value)}
                                min={exceptionDateDebut || new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                            </div>

                            {/* Type */}
                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type d'exception</label>
                              <div className="flex gap-2">
                                <button onClick={() => setExceptionType('ferme')}
                                  className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                    exceptionType === 'ferme'
                                      ? 'border-red-500 bg-red-50 text-red-700'
                                      : 'border-gray-200 text-gray-500 hover:border-red-200'
                                  }`}
                                >
                                  🔒 Fermé toute la journée
                                </button>
                                <button onClick={() => setExceptionType('horaire_modifie')}
                                  className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                    exceptionType === 'horaire_modifie'
                                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                                      : 'border-gray-200 text-gray-500 hover:border-orange-200'
                                  }`}
                                >
                                  ⏰ Horaires modifiés
                                </button>
                              </div>
                            </div>

                            {/* Horaires modifiés */}
                            {exceptionType === 'horaire_modifie' && (
                              <>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                                    Ouverture tardive à <span className="text-gray-300">(optionnel)</span>
                                  </label>
                                  <input type="time" value={exceptionHeureDebut}
                                    onChange={e => setExceptionHeureDebut(e.target.value)}
                                    placeholder="laisser vide = heure normale"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                                    Fermeture anticipée à <span className="text-gray-300">(optionnel)</span>
                                  </label>
                                  <input type="time" value={exceptionHeureFin}
                                    onChange={e => setExceptionHeureFin(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                </div>
                              </>
                            )}

                            {/* Raison */}
                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Raison (optionnel)</label>
                              <input type="text" value={exceptionRaison}
                                onChange={e => setExceptionRaison(e.target.value)}
                                placeholder="Ex : Jour férié, Congrès, Formation, Réunion..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                            </div>
                          </div>
                          <div className="mt-5 flex justify-end">
                            <Button onClick={handleAddException}
                              disabled={addingException || !exceptionDateDebut}
                              className="bg-orange-600 hover:bg-orange-700">
                              {addingException ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                              Ajouter
                            </Button>
                          </div>
                        </Card>

                        {/* Liste exceptions */}
                        <Card className="p-6">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Exceptions programmées
                            {exceptions.length > 0 && (
                              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{exceptions.length}</span>
                            )}
                          </h3>
                          {exceptions.length === 0 ? (
                            <div className="text-center py-10">
                              <Sun className="w-14 h-14 mx-auto mb-3 text-yellow-300" />
                              <p className="text-gray-400">Aucune exception — planning normal toute l'année</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {[...exceptions]
                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                .map((exc, i) => (
                                  <motion.div key={i} layout
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                                      exc.type === 'ferme'
                                        ? 'bg-red-50 border-red-100'
                                        : 'bg-orange-50 border-orange-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                                        exc.type === 'ferme' ? 'bg-red-100' : 'bg-orange-100'
                                      }`}>
                                        {exc.type === 'ferme' ? '🔒' : '⏰'}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900 text-sm">
                                          {exc.date_fin
                                            ? `${new Date(exc.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} → ${new Date(exc.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            : new Date(exc.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                          }
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {exc.type === 'ferme'
                                            ? 'Fermé toute la journée'
                                            : [
                                                exc.heure_debut_exceptionnelle && `Ouverture à ${exc.heure_debut_exceptionnelle}`,
                                                exc.heure_fin_exceptionnelle && `Fermeture à ${exc.heure_fin_exceptionnelle}`,
                                              ].filter(Boolean).join(' · ') || 'Horaires modifiés'
                                          }
                                          {exc.raison && ` — ${exc.raison}`}
                                        </p>
                                      </div>
                                    </div>
                                    <button onClick={() => handleRemoveException(exc.date)}
                                      className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </motion.div>
                                ))}
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    )}

                    {/* ===== TAB : Aperçu ===== */}
                    {activeTab === 'apercu' && (
                      <motion.div key="apercu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card className="p-6">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Eye className="w-5 h-5 text-blue-600" />
                              Créneaux existants (14 prochains jours)
                            </h3>
                            <button onClick={fetchCreneauxResume}
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                              <RefreshCw className={`w-3.5 h-3.5 ${loadingResume ? 'animate-spin' : ''}`} />
                              Actualiser
                            </button>
                          </div>
                          {loadingResume ? (
                            <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Chargement...</span>
                            </div>
                          ) : creneauxResume?.total > 0 ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-bold text-gray-900 text-lg">{creneauxResume.total}</span>
                                <span className="text-gray-400">créneaux trouvés</span>
                                {selectedService.config_rdv && (
                                  <span className="flex items-center gap-1 text-green-600 bg-green-100 px-2.5 py-1 rounded-full text-xs font-medium">
                                    <Zap className="w-3 h-3" /> Auto-génération active
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {Object.entries(creneauxResume.resume).slice(0, 14).map(([date, stats]) => {
                                  const d = new Date(date + 'T00:00:00');
                                  const tauxOccupation = stats.total > 0 ? Math.round((stats.occupe / stats.total) * 100) : 0;
                                  return (
                                    <div key={date} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center hover:border-purple-200 transition-colors">
                                      <p className="font-semibold text-gray-500 text-xs uppercase">
                                        {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                      </p>
                                      <p className="text-gray-800 text-sm font-bold">
                                        {d.toLocaleDateString('fr-FR', { day: 'numeric' })}
                                      </p>
                                      <p className="text-gray-400 text-xs">
                                        {d.toLocaleDateString('fr-FR', { month: 'short' })}
                                      </p>
                                      <div className="mt-2 space-y-0.5">
                                        {stats.libre > 0 && <p className="text-green-600 text-xs font-medium">{stats.libre} libres</p>}
                                        {stats.occupe > 0 && <p className="text-blue-600 text-xs font-medium">{stats.occupe} réservés</p>}
                                        {stats.bloque > 0 && <p className="text-red-500 text-xs">{stats.bloque} bloqués</p>}
                                      </div>
                                      {tauxOccupation > 0 && (
                                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${tauxOccupation}%` }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <CalendarIcon className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                              <p className="text-gray-400 font-medium">Aucun créneau généré</p>
                              <p className="text-sm text-gray-300 mt-1">
                                {selectedService.config_rdv
                                  ? 'Les créneaux apparaîtront automatiquement quand un patient consultera le planning'
                                  : 'Configurez d\'abord le planning récurrent'}
                              </p>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
