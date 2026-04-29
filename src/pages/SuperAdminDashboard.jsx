import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, etablissementsAPI } from '../services/api';
import {
  Building2, Users, Ticket, Calendar,
  AlertCircle, TrendingUp, CheckCircle,
  Loader2, Clock, XCircle, ArrowRight
} from 'lucide-react';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

function StatCard({ label, value, icon: Icon, gradient, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-6 hover:shadow-lg transition-shadow overflow-hidden relative">
        <div className={`absolute inset-0 opacity-5 ${gradient}`} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function BarChart({ data, colorClass }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 truncate text-right">{item.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04 }}
              className={`h-full rounded-full ${colorClass}`}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-6">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function DonutRing({ actif, en_attente, suspendu, rejete }) {
  const total = actif + en_attente + suspendu + rejete || 1;
  const segments = [
    { value: actif,      color: '#22c55e', label: 'Actifs' },
    { value: en_attente, color: '#3b82f6', label: 'En attente' },
    { value: suspendu,   color: '#f97316', label: 'Suspendus' },
    { value: rejete,     color: '#ef4444', label: 'Rejetés' },
  ];

  let cumulative = 0;
  const r = 60, cx = 80, cy = 80, stroke = 22;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const offset = circumference - cumulative * circumference;
          cumulative += pct;
          return (
            <motion.circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15 }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-sm" fill="#111827" fontSize="20" fontWeight="bold">
          {actif + en_attente + suspendu + rejete}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize="10">
          total
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-semibold text-gray-900 ml-auto">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRelativeTime(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `Il y a ${d}j`;
  if (h > 0) return `Il y a ${h}h`;
  if (m > 0) return `Il y a ${m}min`;
  return 'À l\'instant';
}

const GOUVERNORATS = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja',
  'Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia','Sfax',
  'Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine','Tataouine','Gafsa','Tozeur','Kébili'
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, etablRes] = await Promise.all([
        statsAPI.getDashboardPlateforme(),
        etablissementsAPI.getAllAdmin(),
      ]);
      setStats(statsRes.data);
      setEstablishments(etablRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const actif     = establishments.filter(e => e.statut === 'actif').length;
  const enAttente = establishments.filter(e => e.statut === 'en_attente').length;
  const suspendu  = establishments.filter(e => e.statut === 'suspendu').length;
  const rejete    = establishments.filter(e => e.statut === 'rejete').length;

  // Répartition par gouvernorat
  const parGouv = GOUVERNORATS
    .map(g => ({
      label: g,
      value: establishments.filter(e => e.gouvernorat === g).length,
    }))
    .filter(g => g.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Répartition par type
  const typeCounts = {};
  establishments.forEach(e => {
    if (e.type) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  });
  const parType = Object.entries(typeCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Activité récente
  const recentActivities = [...establishments]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 6);

  const activityConfig = {
    actif:      { color: 'bg-green-500', label: 'validé', icon: CheckCircle },
    en_attente: { color: 'bg-blue-500',  label: 'soumis', icon: Clock },
    suspendu:   { color: 'bg-orange-500',label: 'suspendu', icon: AlertCircle },
    rejete:     { color: 'bg-red-500',   label: 'rejeté', icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Super-Admin</h1>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}Bonjour, {user?.prenom || 'Admin'}
            </p>
          </div>
        </header>

        <main className="p-8 space-y-8 max-w-7xl">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Établissements actifs"  value={actif}                                   icon={CheckCircle}  gradient="bg-gradient-to-br from-green-500 to-emerald-600"  delay={0} />
            <StatCard label="En attente validation"  value={enAttente}                               icon={Clock}        gradient="bg-gradient-to-br from-blue-500 to-blue-600"       delay={0.05} />
            <StatCard label="Citoyens inscrits"      value={stats?.citoyens_inscrits || 0}           icon={Users}        gradient="bg-gradient-to-br from-purple-500 to-violet-600"   delay={0.1} />
            <StatCard label="Tickets aujourd'hui"    value={stats?.tickets_aujourd_hui || 0}         icon={Ticket}       gradient="bg-gradient-to-br from-pink-500 to-rose-600"        delay={0.15} />
            <StatCard label="RDV aujourd'hui"        value={stats?.rdv_aujourd_hui || 0}             icon={Calendar}     gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"    delay={0.2} />
            <StatCard label="Total établissements"   value={establishments.length}                   icon={Building2}    gradient="bg-gradient-to-br from-cyan-500 to-sky-600"         delay={0.25} />
            <StatCard label="Suspendus"              value={suspendu}                                icon={AlertCircle}  gradient="bg-gradient-to-br from-orange-500 to-amber-600"     delay={0.3} />
            <StatCard label="Taux d'activation"      value={establishments.length > 0 ? `${Math.round((actif/establishments.length)*100)}%` : '—'} icon={TrendingUp} gradient="bg-gradient-to-br from-teal-500 to-teal-600" delay={0.35} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Donut statuts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Répartition par statut</h2>
                  <Link to="/superadmin/establishments">
                    <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                      Voir tout <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                <DonutRing actif={actif} en_attente={enAttente} suspendu={suspendu} rejete={rejete} />
              </Card>
            </motion.div>

            {/* Bar répartition par type */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="p-6 h-full">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Répartition par type</h2>
                {parType.length > 0 ? (
                  <BarChart data={parType} colorClass="bg-gradient-to-r from-blue-500 to-indigo-500" />
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Répartition géographique */}
          {parGouv.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Répartition géographique — Top gouvernorats
                </h2>
                <BarChart data={parGouv} colorClass="bg-gradient-to-r from-purple-500 to-pink-500" />
              </Card>
            </motion.div>
          )}

          {/* Activité récente + Demandes en attente */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Activité récente</h2>
                {recentActivities.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Aucune activité</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((etab, i) => {
                      const cfg = activityConfig[etab.statut] || activityConfig.en_attente;
                      const Icon = cfg.icon;
                      return (
                        <div key={etab._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.color} bg-opacity-15`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{etab.nom}</p>
                            <p className="text-xs text-gray-400">{etab.gouvernorat} · {cfg.label}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {getRelativeTime(etab.updatedAt || etab.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Demandes en attente
                    {enAttente > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 ml-1">{enAttente}</Badge>
                    )}
                  </h2>
                  <Link to="/superadmin/validate">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                      Valider <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                {establishments.filter(e => e.statut === 'en_attente').length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucune demande en attente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {establishments
                      .filter(e => e.statut === 'en_attente')
                      .slice(0, 5)
                      .map(etab => (
                        <div key={etab._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{etab.nom}</p>
                            <p className="text-xs text-gray-400">{etab.gouvernorat} · {etab.type}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                            {getRelativeTime(etab.createdAt)}
                          </Badge>
                        </div>
                      ))}
                    {enAttente > 5 && (
                      <Link to="/superadmin/validate" className="block text-center text-sm text-blue-600 hover:underline pt-2">
                        +{enAttente - 5} autres demandes
                      </Link>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
