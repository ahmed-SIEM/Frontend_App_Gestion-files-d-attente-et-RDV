import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { ticketsAPI, rdvAPI, servicesAPI } from '../services/api';
import {
  Ticket, CheckCircle2, XCircle, Clock, Calendar,
  TrendingUp, Loader2, BarChart3, User
} from 'lucide-react';
import AgentSidebar from '../components/AgentSidebar';
import { motion } from 'framer-motion';

function MiniBar({ value, max, color = 'blue' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const colors = {
    blue: 'from-blue-500 to-blue-400',
    green: 'from-green-500 to-green-400',
    red: 'from-red-400 to-red-300',
    purple: 'from-purple-500 to-purple-400',
  };
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7 }}
        className={`h-full rounded-full bg-gradient-to-r ${colors[color]}`}
      />
    </div>
  );
}

export default function AgentStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [service, setService] = useState(null);
  const [rdvJour, setRdvJour] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [statsRes, rdvRes] = await Promise.all([
        ticketsAPI.getStatsAgent(),
        rdvAPI.getMesRDVJour(),
      ]);

      setStats(statsRes.data);
      setRdvJour(rdvRes.data || []);

      if (user.service_id) {
        const svcRes = await servicesAPI.getById(user.service_id);
        setService(svcRes.data);
      }
    } catch (e) {
      console.error('Erreur stats agent:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  const total = (stats?.tickets_servis || 0) + (stats?.tickets_absents || 0);
  const tauxService = total > 0 ? Math.round(((stats?.tickets_servis || 0) / total) * 100) : 0;

  const rdvTermines = rdvJour.filter(r => r.statut === 'termine').length;
  const rdvNoShow = rdvJour.filter(r => r.statut === 'no_show').length;
  const rdvAVenir = rdvJour.filter(r => r.statut === 'confirme').length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar serviceName={service?.nom} />

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Mes Statistiques</h1>
            <p className="text-gray-600">
              Guichet {user?.numero_guichet || '—'} • {service?.nom || 'Service'}
            </p>
          </div>
        </header>

        <main className="p-8 max-w-5xl">

          {/* KPIs file d'attente */}
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-green-600" /> File d'attente — aujourd'hui
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tickets servis', value: stats?.tickets_servis || 0, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
              { label: 'Absents', value: stats?.tickets_absents || 0, icon: XCircle, color: 'bg-red-100 text-red-500' },
              { label: 'En attente', value: stats?.tickets_en_attente || 0, icon: Clock, color: 'bg-blue-100 text-blue-600' },
              { label: 'Temps moy.', value: stats?.temps_moyen ? `${stats.temps_moyen}min` : '—', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Card className="p-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Taux de service */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Taux de service
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Tickets servis</span>
                    <span className="font-semibold text-green-700">{stats?.tickets_servis || 0} ({tauxService}%)</span>
                  </div>
                  <MiniBar value={stats?.tickets_servis || 0} max={total} color="green" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Absents / No-show</span>
                    <span className="font-semibold text-red-500">{stats?.tickets_absents || 0} ({100 - tauxService}%)</span>
                  </div>
                  <MiniBar value={stats?.tickets_absents || 0} max={total} color="red" />
                </div>
              </div>
              {total === 0 && (
                <p className="text-center text-gray-400 text-sm mt-4">Aucun ticket traité aujourd'hui</p>
              )}
            </Card>
          </motion.div>

          {/* RDV aujourd'hui */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Rendez-vous — aujourd'hui
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'À venir', value: rdvAVenir, color: 'bg-blue-100 text-blue-700' },
                { label: 'Terminés', value: rdvTermines, color: 'bg-green-100 text-green-700' },
                { label: 'No-show', value: rdvNoShow, color: 'bg-red-100 text-red-600' },
              ].map((k, i) => (
                <Card key={k.label} className="p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-1">{k.value}</p>
                  <Badge className={k.color}>{k.label}</Badge>
                </Card>
              ))}
            </div>

            {rdvJour.length > 0 ? (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Liste des RDV</h3>
                <div className="space-y-2">
                  {rdvJour.map(rdv => (
                    <div key={rdv._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {rdv.citoyen?.prenom} {rdv.citoyen?.nom}
                          </p>
                          <p className="text-xs text-gray-500">{rdv.heure_debut}</p>
                        </div>
                      </div>
                      <Badge className={
                        rdv.statut === 'termine' ? 'bg-green-100 text-green-700' :
                        rdv.statut === 'no_show' ? 'bg-red-100 text-red-600' :
                        rdv.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }>
                        {rdv.statut === 'termine' ? 'Terminé' :
                         rdv.statut === 'no_show' ? 'Absent' :
                         rdv.statut === 'en_cours' ? 'En cours' : 'À venir'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun rendez-vous aujourd'hui</p>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
