import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { etablissementsAPI, servicesAPI, statsAPI } from '../services/api';
import {
  Building2, MapPin, Phone, Mail, Calendar, ArrowLeft,
  Loader2, Users, Ticket, Clock, Star, FileText,
  CheckCircle, XCircle, AlertCircle, Layers, Eye,
  Ban, Play, TrendingUp, Activity, Globe, Hash
} from 'lucide-react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

// ─── Stat card mini ───────────────────────────────────────────────────────────
function StatMini({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-5 relative overflow-hidden">
        <div className={`absolute inset-0 opacity-[0.04] ${color}`} />
        <div className="relative flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ statut }) {
  const map = {
    actif:      { cls: 'bg-green-100 text-green-800 border-green-200',   icon: CheckCircle, label: 'Actif' },
    suspendu:   { cls: 'bg-orange-100 text-orange-800 border-orange-200', icon: Ban,         label: 'Suspendu' },
    en_attente: { cls: 'bg-blue-100 text-blue-800 border-blue-200',      icon: Clock,       label: 'En attente' },
    rejete:     { cls: 'bg-red-100 text-red-800 border-red-200',         icon: XCircle,     label: 'Rejeté' },
  };
  const cfg = map[statut] || { cls: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, label: statut };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cfg.cls}`}>
      <Icon className="w-4 h-4" />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdminEstablishmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [etab, setEtab]       = useState(null);
  const [services, setServices] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [raison, setRaison]     = useState('');
  const [showSuspend, setShowSuspend]   = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch all data ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [etabRes, servicesRes] = await Promise.all([
        etablissementsAPI.getById(id),
        servicesAPI.getByEtablissement(id),
      ]);
      setEtab(etabRes.data || etabRes);
      setServices(servicesRes.data || []);

      // Stats peuvent echouer si etablissement suspendu / pas encore de donnees
      try {
        const statsRes = await statsAPI.getDashboardEtablissement(id);
        setStats(statsRes.data || statsRes);
      } catch {
        // Stats non disponibles — pas bloquant
      }
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleSuspendre = async () => {
    if (!raison.trim()) { toast.error('Veuillez indiquer une raison'); return; }
    setActionLoading(true);
    try {
      await etablissementsAPI.suspendre(id, raison);
      toast.success('Établissement suspendu');
      setShowSuspend(false);
      setRaison('');
      fetchAll();
    } catch {
      toast.error('Erreur lors de la suspension');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActiver = async () => {
    setActionLoading(true);
    try {
      await etablissementsAPI.activer(id);
      toast.success('Établissement activé');
      setShowActivate(false);
      fetchAll();
    } catch {
      toast.error('Erreur lors de l\'activation');
    } finally {
      setActionLoading(false);
    }
  };

  const openDocument = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Chargement des données…</p>
        </div>
      </div>
    );
  }

  if (!etab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Établissement introuvable</h3>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour
          </Button>
        </Card>
      </div>
    );
  }

  const adresseComplete = [
    etab.adresse?.rue,
    etab.adresse?.ville,
    etab.adresse?.code_postal,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-px h-6 bg-gray-200" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{etab.nom}</h1>
                <p className="text-sm text-gray-500 capitalize">{etab.type} · {etab.gouvernorat}</p>
              </div>
            </div>
            <StatusBadge statut={etab.statut} />
          </div>
        </header>

        <main className="p-8 space-y-8">

          {/* ── Hero banner ────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{etab.nom}</h2>
                  <p className="text-blue-200 capitalize mt-1">{etab.type}</p>
                  {etab.description && (
                    <p className="text-blue-100 text-sm mt-2 max-w-lg">{etab.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right hidden md:block">
                <p className="text-blue-200 text-sm">Inscrit le</p>
                <p className="text-white font-semibold">
                  {etab.createdAt
                    ? new Date(etab.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Stats ──────────────────────────────────────────────────────────── */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Activité du jour
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatMini
                label="Tickets aujourd'hui"
                value={stats?.tickets_aujourdhui ?? 0}
                icon={Ticket}
                color="bg-blue-600"
                delay={0.05}
              />
              <StatMini
                label="RDV aujourd'hui"
                value={stats?.rdv_aujourdhui ?? 0}
                icon={Calendar}
                color="bg-purple-600"
                delay={0.1}
              />
              <StatMini
                label="Services actifs"
                value={stats?.services_actifs ?? services.filter(s => s.actif).length}
                icon={Layers}
                color="bg-green-600"
                delay={0.15}
              />
              <StatMini
                label="Agents actifs"
                value={stats?.agents_actifs ?? 0}
                icon={Users}
                color="bg-orange-600"
                delay={0.2}
              />
            </div>

            {/* Temps d'attente + satisfaction si dispo */}
            {stats && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <StatMini
                  label="Temps d'attente moyen"
                  value={stats.temps_attente_moyen ? `${stats.temps_attente_moyen} min` : '—'}
                  icon={Clock}
                  color="bg-teal-600"
                  delay={0.25}
                />
                <StatMini
                  label="Satisfaction"
                  value={stats.satisfaction ? `${stats.satisfaction} / 5` : '—'}
                  icon={Star}
                  color="bg-yellow-500"
                  delay={0.3}
                />
              </div>
            )}
          </div>

          {/* ── Info + Services ────────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Informations */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Informations générales
                </h3>
                <div>
                  <InfoRow icon={Hash}     label="Identifiant"     value={etab._id} />
                  <InfoRow icon={Globe}    label="Type"            value={etab.type?.charAt(0).toUpperCase() + etab.type?.slice(1)} />
                  <InfoRow icon={MapPin}   label="Gouvernorat"     value={etab.gouvernorat} />
                  {adresseComplete && (
                    <InfoRow icon={MapPin} label="Adresse"         value={adresseComplete} />
                  )}
                  <InfoRow icon={Phone}    label="Téléphone"       value={etab.telephone_etablissement} />
                  <InfoRow icon={Mail}     label="Email"           value={etab.email_etablissement} />
                  <InfoRow icon={Calendar} label="Date inscription" value={
                    etab.createdAt
                      ? new Date(etab.createdAt).toLocaleDateString('fr-FR')
                      : undefined
                  } />
                </div>

                {/* Signalements */}
                {etab.signalements?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {etab.signalements.length} signalement{etab.signalements.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Services */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Services ({services.length})
                </h3>

                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun service enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {services.map((service, i) => (
                      <motion.div
                        key={service._id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{service.nom}</p>
                          {service.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{service.description}</p>
                          )}
                        </div>
                        <Badge className={service.actif ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                          {service.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* ── Documents ──────────────────────────────────────────────────────── */}
          {etab.documents?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Documents fournis ({etab.documents.length})
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {etab.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.type || `Document ${i + 1}`}</p>
                          <p className="text-xs text-gray-400">{doc.nom || 'Fichier'}</p>
                        </div>
                      </div>
                      {doc.url ? (
                        <Button size="sm" variant="outline" onClick={() => openDocument(doc.url)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Actions ────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions administratives</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la liste
                </Button>

                {etab.statut === 'actif' && (
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={() => setShowSuspend(true)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspendre l'établissement
                  </Button>
                )}

                {etab.statut === 'suspendu' && (
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-300 hover:bg-green-50"
                    onClick={() => setShowActivate(true)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Réactiver l'établissement
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

        </main>
      </div>

      {/* ── Dialog Suspension ────────────────────────────────────────────────── */}
      <AlertDialog open={showSuspend} onOpenChange={setShowSuspend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspendre l'établissement</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action bloquera l'accès à la plateforme pour cet établissement.
              Veuillez indiquer la raison.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Raison de la suspension…"
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRaison('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSuspendre}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer la suspension'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog Activation ────────────────────────────────────────────────── */}
      <AlertDialog open={showActivate} onOpenChange={setShowActivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réactiver l'établissement</AlertDialogTitle>
            <AlertDialogDescription>
              L'établissement retrouvera un accès complet à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleActiver}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer la réactivation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
