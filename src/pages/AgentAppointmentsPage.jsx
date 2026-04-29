import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { rdvAPI, servicesAPI } from '../services/api';
import {
  CheckCircle, X, Loader2, AlertCircle, Phone,
  Plus, ChevronLeft, ChevronRight, Calendar,
  Clock, User, Lock, Unlock, Check, UserCheck,
  CalendarDays, ClipboardList, CalendarClock
} from 'lucide-react';
import AgentSidebar from '../components/AgentSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Format date → YYYY-MM-DD
const toDateStr = (d) => d.toISOString().split('T')[0];

// Format date → affichage
const formatDate = (d) => d.toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

const isToday = (d) => toDateStr(d) === toDateStr(new Date());

export default function AgentAppointmentsPage() {
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [activeTab, setActiveTab] = useState('planning');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Planning tab
  const [rendezvous, setRendezvous] = useState([]);

  // Créneaux tab
  const [creneaux, setCreneaux] = useState([]);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);

  // Modal "Ajouter RDV manuel"
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    date: toDateStr(new Date()),
    heure_debut: '09:00',
    heure_fin: '09:30',
    nom_patient: '',
    telephone_patient: '',
    motif: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Dialog confirmations
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, rdv }

  // Modal reprogrammation
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleRdv, setRescheduleRdv] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', heure_debut: '', heure_fin: '' });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Auto-refresh toutes les 30s
  useEffect(() => {
    fetchService();
  }, []);

  useEffect(() => {
    if (service) {
      fetchPlanning();
      if (activeTab === 'creneaux') fetchCreneaux();
    }
  }, [currentDate, service]);

  useEffect(() => {
    if (service && activeTab === 'creneaux') fetchCreneaux();
  }, [activeTab]);

  const fetchService = async () => {
    try {
      if (user.service_id) {
        const res = await servicesAPI.getById(user.service_id);
        setService(res.data);
      }
    } catch {
      // service optionnel
    }
  };

  const fetchPlanning = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rdvAPI.getMesRDVJour(toDateStr(currentDate));
      setRendezvous(res.data || []);
    } catch (e) {
      toast.error('Erreur chargement planning');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const fetchCreneaux = useCallback(async () => {
    try {
      setLoadingCreneaux(true);
      const res = await rdvAPI.getCreneauxJour(toDateStr(currentDate));
      setCreneaux(res.data || []);
    } catch {
      setCreneaux([]);
    } finally {
      setLoadingCreneaux(false);
    }
  }, [currentDate]);

  const handleAction = async (rdvId, action) => {
    try {
      if (action === 'present') await rdvAPI.marquerPresent(rdvId);
      else if (action === 'termine') await rdvAPI.marquerComplete(rdvId);
      else if (action === 'noshow') await rdvAPI.marquerAbsent(rdvId);
      toast.success(action === 'present' ? 'Patient marqué présent' : action === 'termine' ? 'RDV terminé' : 'Patient absent');
      setConfirmDialog(null);
      fetchPlanning();
      if (activeTab === 'creneaux') fetchCreneaux();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    }
  };

  // Charger les créneaux libres quand la date change dans le modal reprog.
  const fetchAvailableSlots = async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await rdvAPI.getCreneauxJour(date);
      setAvailableSlots((res.data || []).filter(c => c.statut === 'libre'));
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const openRescheduleModal = (rdv) => {
    setRescheduleRdv(rdv);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const initDate = toDateStr(tomorrow);
    setRescheduleForm({ date: initDate, heure_debut: '', heure_fin: '' });
    fetchAvailableSlots(initDate);
    setShowRescheduleModal(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleForm.date || !rescheduleForm.heure_debut || !rescheduleForm.heure_fin) {
      return toast.error('Date, heure début et heure fin requis');
    }
    try {
      setSubmittingReschedule(true);
      await rdvAPI.reprogrammerRDVAgent(rescheduleRdv._id, rescheduleForm);
      toast.success('RDV reprogrammé avec succès !');
      setShowRescheduleModal(false);
      setRescheduleRdv(null);
      fetchPlanning();
      if (activeTab === 'creneaux') fetchCreneaux();
    } catch (e) {
      toast.error(e.message || 'Erreur reprogrammation');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleBloquerCreneau = async (creneauId) => {
    try {
      await rdvAPI.bloquerCreneau(creneauId);
      toast.success('Créneau bloqué');
      fetchCreneaux();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    }
  };

  const handleDebloquerCreneau = async (creneauId) => {
    try {
      await rdvAPI.debloquerCreneau(creneauId);
      toast.success('Créneau débloqué');
      fetchCreneaux();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    }
  };

  const handleAddRDV = async () => {
    if (!addForm.nom_patient.trim()) return toast.error('Nom du patient requis');
    if (!addForm.heure_debut || !addForm.heure_fin) return toast.error('Heures requises');
    try {
      setSubmittingAdd(true);
      await rdvAPI.creerRDVManuel(addForm);
      toast.success(`RDV créé pour ${addForm.nom_patient} !`);
      setShowAddModal(false);
      setAddForm({ date: toDateStr(currentDate), heure_debut: '09:00', heure_fin: '09:30', nom_patient: '', telephone_patient: '', motif: '' });
      fetchPlanning();
      if (activeTab === 'creneaux') fetchCreneaux();
    } catch (e) {
      toast.error(e.message || 'Erreur création RDV');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const prevDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); };
  const nextDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); };
  const goToday = () => setCurrentDate(new Date());

  const stats = {
    total: rendezvous.length,
    confirme: rendezvous.filter(r => r.statut === 'confirme').length,
    en_cours: rendezvous.filter(r => r.statut === 'en_cours').length,
    termine: rendezvous.filter(r => r.statut === 'termine').length,
    no_show: rendezvous.filter(r => r.statut === 'no_show').length,
  };

  const getStatusBadge = (statut) => {
    const map = {
      confirme: <Badge className="bg-blue-100 text-blue-700 border-blue-200">Confirmé</Badge>,
      en_cours: <Badge className="bg-orange-100 text-orange-700 border-orange-200 animate-pulse">En cours</Badge>,
      termine: <Badge className="bg-green-100 text-green-700 border-green-200">Terminé</Badge>,
      no_show: <Badge className="bg-red-100 text-red-700 border-red-200">Absent</Badge>,
    };
    return map[statut] || <Badge className="bg-gray-100 text-gray-600">{statut}</Badge>;
  };

  const getPatientName = (rdv) => {
    if (rdv.citoyen) return `${rdv.citoyen.prenom || ''} ${rdv.citoyen.nom || ''}`.trim();
    return rdv.nom_patient || 'Patient inconnu';
  };

  const getPatientPhone = (rdv) => rdv.citoyen?.telephone || rdv.telephone_patient || null;

  const isManual = (rdv) => !rdv.citoyen && rdv.cree_par_agent;

  if (loading && rendezvous.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar serviceName={service?.nom} />

      <div className="flex-1 overflow-auto">
        {/* Header avec navigation de date */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
              <p className="text-sm text-gray-500">{service?.nom || 'Mon service'}</p>
            </div>

            {/* Navigation date */}
            <div className="flex items-center gap-3">
              <button onClick={prevDay}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="text-center min-w-[200px]">
                <p className="font-semibold text-gray-900 capitalize">
                  {formatDate(currentDate)}
                </p>
                {isToday(currentDate) && (
                  <span className="text-xs text-green-600 font-medium">Aujourd'hui</span>
                )}
              </div>
              <button onClick={nextDay}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              {!isToday(currentDate) && (
                <button onClick={goToday}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  Aujourd'hui
                </button>
              )}
            </div>

            {/* Bouton ajouter RDV */}
            <Button onClick={() => {
              setAddForm(prev => ({ ...prev, date: toDateStr(currentDate) }));
              setShowAddModal(true);
            }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter RDV
            </Button>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'À venir', value: stats.confirme, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'En cours', value: stats.en_cours, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Terminés', value: stats.termine, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'No-show', value: stats.no_show, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(({ label, value, color, bg }) => (
              <Card key={label} className={`p-4 text-center border-0 shadow-sm ${bg}`}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border rounded-xl p-1 shadow-sm w-fit">
            {[
              { id: 'planning', label: 'Planning du jour', icon: ClipboardList },
              { id: 'creneaux', label: 'Gérer les créneaux', icon: CalendarDays },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ===== TAB : Planning du jour ===== */}
            {activeTab === 'planning' && (
              <motion.div key="planning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : rendezvous.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun rendez-vous</h3>
                    <p className="text-gray-400 text-sm mb-6">Pas de RDV programmé pour ce jour</p>
                    <Button onClick={() => {
                      setAddForm(prev => ({ ...prev, date: toDateStr(currentDate) }));
                      setShowAddModal(true);
                    }}
                      variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter un RDV
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {rendezvous.map((rdv, index) => {
                      const heureDebut = rdv.creneaux?.[0]?.heure_debut || '—';
                      const heureFin = rdv.creneaux?.[rdv.creneaux.length - 1]?.heure_fin || '—';
                      const nom = getPatientName(rdv);
                      const phone = getPatientPhone(rdv);
                      const manual = isManual(rdv);

                      return (
                        <motion.div key={rdv._id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                        >
                          <Card className={`p-5 border-l-4 ${
                            rdv.statut === 'en_cours' ? 'border-l-orange-500 bg-orange-50/30' :
                            rdv.statut === 'termine' ? 'border-l-green-500 bg-green-50/20 opacity-70' :
                            rdv.statut === 'no_show' ? 'border-l-red-400 bg-red-50/20 opacity-60' :
                            'border-l-blue-500'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* Heure */}
                                <div className="flex-shrink-0 text-center bg-gray-100 rounded-xl px-3 py-2 min-w-[80px]">
                                  <p className="text-base font-bold text-gray-900">{heureDebut}</p>
                                  <p className="text-xs text-gray-400">{heureFin}</p>
                                </div>

                                {/* Avatar patient */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  manual ? 'bg-purple-100' : 'bg-blue-100'
                                }`}>
                                  {manual
                                    ? <Phone className="w-5 h-5 text-purple-600" />
                                    : <User className="w-5 h-5 text-blue-600" />
                                  }
                                </div>

                                {/* Infos */}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-gray-900">{nom}</p>
                                    {manual && (
                                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> Tél.
                                      </span>
                                    )}
                                    {getStatusBadge(rdv.statut)}
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    {phone && (
                                      <p className="text-sm text-gray-400 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {phone}
                                      </p>
                                    )}
                                    {rdv.motif && (
                                      <p className="text-sm text-gray-400">• {rdv.motif}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {rdv.statut === 'confirme' && (
                                  <>
                                    <Button size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => setConfirmDialog({ type: 'present', rdv })}>
                                      <UserCheck className="w-4 h-4 mr-1" /> Présent
                                    </Button>
                                    <Button size="sm" variant="outline"
                                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                      onClick={() => openRescheduleModal(rdv)}>
                                      <CalendarClock className="w-4 h-4 mr-1" /> Reprogrammer
                                    </Button>
                                    <Button size="sm" variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                      onClick={() => setConfirmDialog({ type: 'noshow', rdv })}>
                                      <X className="w-4 h-4 mr-1" /> Absent
                                    </Button>
                                  </>
                                )}
                                {rdv.statut === 'en_cours' && (
                                  <Button size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setConfirmDialog({ type: 'termine', rdv })}>
                                    <Check className="w-4 h-4 mr-1" /> Terminer
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== TAB : Gérer créneaux ===== */}
            {activeTab === 'creneaux' && (
              <motion.div key="creneaux" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {loadingCreneaux ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : creneaux.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Clock className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">Aucun créneau pour ce jour</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Les créneaux s'afficheront ici quand la configuration RDV sera active
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {creneaux.map((c, i) => {
                      const rdv = c.rdv;
                      const nom = rdv ? getPatientName(rdv) : null;
                      const phone = rdv ? getPatientPhone(rdv) : null;
                      const manual = rdv ? isManual(rdv) : false;

                      return (
                        <motion.div key={c._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <div className={`rounded-xl border-2 p-4 text-center transition-all ${
                            c.statut === 'libre' ? 'border-green-200 bg-green-50 hover:border-green-400' :
                            c.statut === 'occupe' ? 'border-blue-200 bg-blue-50' :
                            'border-red-200 bg-red-50 opacity-70'
                          }`}>
                            {/* Heure */}
                            <p className="font-bold text-gray-900 text-sm">
                              {c.heure_debut} — {c.heure_fin}
                            </p>
                            <p className="text-xs text-gray-400 mb-3">{c.duree_minutes} min</p>

                            {/* Contenu selon statut */}
                            {c.statut === 'libre' && (
                              <div className="space-y-1.5">
                                <span className="inline-block text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                                  Disponible
                                </span>
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => {
                                      setAddForm(prev => ({
                                        ...prev,
                                        date: toDateStr(currentDate),
                                        heure_debut: c.heure_debut,
                                        heure_fin: c.heure_fin
                                      }));
                                      setShowAddModal(true);
                                    }}
                                    className="w-full text-xs py-1 px-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> RDV
                                  </button>
                                  <button
                                    onClick={() => handleBloquerCreneau(c._id)}
                                    className="w-full text-xs py-1 px-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Lock className="w-3 h-3" /> Bloquer
                                  </button>
                                </div>
                              </div>
                            )}

                            {c.statut === 'occupe' && rdv && (
                              <div className="space-y-1">
                                <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                  manual ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {manual ? <Phone className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {manual ? 'Tél.' : 'En ligne'}
                                </div>
                                <p className="text-xs font-semibold text-gray-800 truncate">{nom}</p>
                                {phone && <p className="text-xs text-gray-400 truncate">{phone}</p>}
                                <div className="mt-2">
                                  {rdv.statut === 'confirme' && (
                                    <button onClick={() => setConfirmDialog({ type: 'present', rdv })}
                                      className="w-full text-xs py-1 px-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                                      <UserCheck className="w-3 h-3" /> Présent
                                    </button>
                                  )}
                                  {rdv.statut === 'en_cours' && (
                                    <button onClick={() => setConfirmDialog({ type: 'termine', rdv })}
                                      className="w-full text-xs py-1 px-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                                      <Check className="w-3 h-3" /> Terminer
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {c.statut === 'bloque' && (
                              <div className="space-y-1.5">
                                <span className="inline-block text-xs text-red-500 font-medium bg-red-100 px-2 py-0.5 rounded-full">
                                  Bloqué
                                </span>
                                <button
                                  onClick={() => handleDebloquerCreneau(c._id)}
                                  className="w-full text-xs py-1 px-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-1 mt-1"
                                >
                                  <Unlock className="w-3 h-3" /> Débloquer
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ===== Modal : Ajouter RDV Manuel ===== */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Header modal */}
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Ajouter un RDV</h2>
                    <p className="text-xs text-gray-400">Réservation par téléphone</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Body modal */}
              <div className="p-6 space-y-4">
                {/* Date */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </label>
                  <input type="date" value={addForm.date}
                    onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>

                {/* Heures */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Début
                    </label>
                    <input type="time" value={addForm.heure_debut}
                      onChange={e => setAddForm({ ...addForm, heure_debut: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Fin
                    </label>
                    <input type="time" value={addForm.heure_fin}
                      onChange={e => setAddForm({ ...addForm, heure_fin: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                </div>

                {/* Patient */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Nom du patient *
                  </label>
                  <input type="text" value={addForm.nom_patient}
                    onChange={e => setAddForm({ ...addForm, nom_patient: e.target.value })}
                    placeholder="Prénom Nom"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Téléphone
                  </label>
                  <input type="tel" value={addForm.telephone_patient}
                    onChange={e => setAddForm({ ...addForm, telephone_patient: e.target.value })}
                    placeholder="Ex: 55 123 456"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Motif (optionnel)</label>
                  <input type="text" value={addForm.motif}
                    onChange={e => setAddForm({ ...addForm, motif: e.target.value })}
                    placeholder="Ex: Consultation, Suivi, Urgence..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>

              {/* Footer modal */}
              <div className="p-6 pt-0 flex gap-3">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleAddRDV} disabled={submittingAdd}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  {submittingAdd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Créer le RDV
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Modal : Reprogrammer RDV ===== */}
      <AnimatePresence>
        {showRescheduleModal && rescheduleRdv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowRescheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Header */}
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Reprogrammer le RDV</h2>
                    <p className="text-xs text-gray-400">{getPatientName(rescheduleRdv)}</p>
                  </div>
                </div>
                <button onClick={() => setShowRescheduleModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* RDV actuel */}
              <div className="mx-6 mt-5 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-gray-400">Actuel : </span>
                  <span className="font-medium text-gray-700">
                    {rescheduleRdv.creneaux?.[0]?.heure_debut} — {rescheduleRdv.creneaux?.[rescheduleRdv.creneaux.length - 1]?.heure_fin}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Nouvelle date */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Nouvelle date
                  </label>
                  <input type="date" value={rescheduleForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      setRescheduleForm(prev => ({ ...prev, date: e.target.value, heure_debut: '', heure_fin: '' }));
                      fetchAvailableSlots(e.target.value);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                {/* Créneaux disponibles */}
                {rescheduleForm.date && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Créneau disponible
                    </label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des créneaux...
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {availableSlots.map(c => (
                          <button key={c._id}
                            onClick={() => setRescheduleForm(prev => ({
                              ...prev,
                              heure_debut: c.heure_debut,
                              heure_fin: c.heure_fin
                            }))}
                            className={`py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all text-center ${
                              rescheduleForm.heure_debut === c.heure_debut
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                          >
                            {c.heure_debut}<br />
                            <span className="text-gray-400">{c.heure_fin}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 py-1">Aucun créneau auto-disponible — entrez l'heure manuellement</p>
                    )}
                  </div>
                )}

                {/* Heure manuelle si pas de créneau sélectionné */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Début</label>
                    <input type="time" value={rescheduleForm.heure_debut}
                      onChange={e => setRescheduleForm(prev => ({ ...prev, heure_debut: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Fin</label>
                    <input type="time" value={rescheduleForm.heure_fin}
                      onChange={e => setRescheduleForm(prev => ({ ...prev, heure_fin: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <Button variant="outline" onClick={() => setShowRescheduleModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleReschedule} disabled={submittingReschedule || !rescheduleForm.date || !rescheduleForm.heure_debut}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  {submittingReschedule
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <CalendarClock className="w-4 h-4 mr-2" />
                  }
                  Reprogrammer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Dialog Confirmation ===== */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="text-center mb-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  confirmDialog.type === 'present' ? 'bg-green-100' :
                  confirmDialog.type === 'termine' ? 'bg-blue-100' :
                  'bg-red-100'
                }`}>
                  {confirmDialog.type === 'present' ? <UserCheck className="w-7 h-7 text-green-600" /> :
                   confirmDialog.type === 'termine' ? <CheckCircle className="w-7 h-7 text-blue-600" /> :
                   <X className="w-7 h-7 text-red-600" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmDialog.type === 'present' ? 'Marquer présent ?' :
                   confirmDialog.type === 'termine' ? 'Terminer le RDV ?' :
                   'Marquer absent ?'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">{getPatientName(confirmDialog.rdv)}</span>
                  {confirmDialog.type === 'noshow' && ' sera marqué no-show et le créneau sera libéré.'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDialog(null)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={() => handleAction(confirmDialog.rdv._id, confirmDialog.type)}
                  className={`flex-1 ${
                    confirmDialog.type === 'present' ? 'bg-green-600 hover:bg-green-700' :
                    confirmDialog.type === 'termine' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirmer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
