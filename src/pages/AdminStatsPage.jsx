import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI } from '../services/api';
import {
  TrendingUp, Download, Loader2, ArrowUp,
  Calendar as CalendarIcon, Ticket, CheckCircle2,
  BarChart3, Users, Clock
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const PERIODES = [
  { value: '7jours',  label: '7 jours',   jours: 7  },
  { value: '30jours', label: '30 jours',  jours: 30 },
  { value: 'mois',    label: 'Ce mois',   jours: null },
  { value: 'annee',   label: 'Cette année', jours: null },
];

function getDateRange(periode) {
  const fin = new Date();
  let debut = new Date();
  if (periode === '7jours')  { debut.setDate(fin.getDate() - 7); }
  else if (periode === '30jours') { debut.setDate(fin.getDate() - 30); }
  else if (periode === 'mois')  { debut.setDate(1); }
  else { debut.setMonth(0); debut.setDate(1); }
  return { debut, fin };
}

function BarChart({ data, maxVal, color = 'blue' }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>;
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  const colors = { blue: 'from-blue-500 to-blue-400', purple: 'from-purple-500 to-purple-400', green: 'from-green-500 to-green-400' };
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative flex items-end" style={{ height: 100 }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
              className={`w-full rounded-t-sm bg-gradient-to-t ${colors[color]}`}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-xs text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [periode, setPeriode] = useState('7jours');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef(null);

  useEffect(() => { fetchData(); }, [periode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { debut, fin } = getDateRange(periode);
      const res = await statsAPI.getDetailed(user.etablissement_id, debut.toISOString(), fin.toISOString());
      setStats(res.data);
    } catch (err) {
      toast.error('Erreur chargement statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const { debut, fin } = getDateRange(periode);
      const periodeLabel = PERIODES.find(p => p.value === periode)?.label || periode;

      // En-tête
      doc.setFillColor(88, 28, 135);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('FileZen — Rapport Statistiques', 14, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Période : ${periodeLabel}  |  ${debut.toLocaleDateString('fr-FR')} – ${fin.toLocaleDateString('fr-FR')}`, 14, 25);
      doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 31);

      // KPIs
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs clés', 14, 50);

      const kpis = [
        ['Tickets total', stats?.tickets_total ?? 0],
        ['Tickets servis', stats?.tickets_servis ?? 0],
        ['RDV total', stats?.rdv_total ?? 0],
        ['RDV terminés', stats?.rdv_termines ?? 0],
        ['Temps d\'attente moyen', `${stats?.temps_attente_moyen ?? 0} min`],
        ['Taux de présence', `${stats?.taux_presence ?? 0}%`],
      ];

      autoTable(doc, {
        startY: 55,
        head: [['Indicateur', 'Valeur']],
        body: kpis,
        headStyles: { fillColor: [88, 28, 135], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        styles: { fontSize: 11 },
        margin: { left: 14 }
      });

      // Services populaires
      if (stats?.services_populaires?.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Services les plus utilisés', 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Service', 'Tickets', '% du total']],
          body: stats.services_populaires.map(s => [s.nom, s.tickets, `${s.pourcentage}%`]),
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          alternateRowStyles: { fillColor: [239, 246, 255] },
          styles: { fontSize: 10 },
          margin: { left: 14 }
        });
      }

      // Évolution par jour
      if (stats?.par_jour?.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Évolution quotidienne', 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Date', 'Tickets', 'RDV']],
          body: stats.par_jour.map(j => [
            new Date(j.date + 'T00:00:00').toLocaleDateString('fr-FR'),
            j.tickets,
            j.rdv
          ]),
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          alternateRowStyles: { fillColor: [236, 253, 245] },
          styles: { fontSize: 9 },
          margin: { left: 14 }
        });
      }

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`FileZen — Page ${i}/${pageCount}`, 105, 292, { align: 'center' });
      }

      doc.save(`stats-filezen-${periode}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exporté avec succès !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur export PDF');
    } finally {
      setExporting(false);
    }
  };

  // Préparer données graphique par jour
  const parJourData = (stats?.par_jour || []).map(j => ({
    label: new Date(j.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    value: j.tickets
  }));
  const rdvParJourData = (stats?.par_jour || []).map(j => ({
    label: new Date(j.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    value: j.rdv
  }));
  const maxTickets = Math.max(...(stats?.par_jour || []).map(j => j.tickets), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" ref={printRef}>
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques Détaillées</h1>
              <p className="text-gray-600">Analysez les performances de votre établissement</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {PERIODES.map(p => (
                  <button key={p.value} onClick={() => setPeriode(p.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      periode === p.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Button onClick={handleExport} disabled={exporting}
                variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                {exporting
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Download className="w-4 h-4 mr-2" />}
                Exporter PDF
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Tickets total', value: stats?.tickets_total ?? 0, icon: Ticket, color: 'blue' },
              { label: 'Tickets servis', value: stats?.tickets_servis ?? 0, icon: CheckCircle2, color: 'green' },
              { label: 'RDV total', value: stats?.rdv_total ?? 0, icon: CalendarIcon, color: 'purple' },
              { label: 'RDV terminés', value: stats?.rdv_termines ?? 0, icon: CheckCircle2, color: 'emerald' },
              { label: 'Attente moy.', value: `${stats?.temps_attente_moyen ?? 0}min`, icon: Clock, color: 'orange' },
              { label: 'Taux présence', value: `${stats?.taux_presence ?? 0}%`, icon: TrendingUp, color: 'pink' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              const colorMap = {
                blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600', emerald: 'bg-emerald-100 text-emerald-600',
                orange: 'bg-orange-100 text-orange-600', pink: 'bg-pink-100 text-pink-600'
              };
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[kpi.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Graphique tickets par jour */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Tickets par jour
                  </h3>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">{stats?.tickets_total ?? 0} total</Badge>
                </div>
                {parJourData.length > 0
                  ? <BarChart data={parJourData} maxVal={maxTickets} color="blue" />
                  : <p className="text-center text-gray-400 py-10">Aucune donnée sur cette période</p>
                }
              </Card>
            </motion.div>

            {/* Graphique RDV par jour */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-purple-600" />
                    RDV par jour
                  </h3>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">{stats?.rdv_total ?? 0} total</Badge>
                </div>
                {rdvParJourData.length > 0
                  ? <BarChart data={rdvParJourData} color="purple" />
                  : <p className="text-center text-gray-400 py-10">Aucune donnée sur cette période</p>
                }
              </Card>
            </motion.div>
          </div>

          {/* Services populaires */}
          {stats?.services_populaires?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Services les plus utilisés
                </h3>
                <div className="space-y-4">
                  {stats.services_populaires.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-800 truncate flex-1">{s.nom}</span>
                        <span className="text-gray-500 ml-3">{s.tickets} tickets ({s.pourcentage}%)</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pourcentage}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tableau détail par jour */}
          {stats?.par_jour?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Détail par jour
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                        <th className="text-center py-2 px-3 text-gray-500 font-medium">Tickets</th>
                        <th className="text-center py-2 px-3 text-gray-500 font-medium">RDV</th>
                        <th className="text-center py-2 px-3 text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.par_jour.map((j, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 text-gray-700">
                            {new Date(j.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge className="bg-blue-100 text-blue-700">{j.tickets}</Badge>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge className="bg-purple-100 text-purple-700">{j.rdv}</Badge>
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-gray-800">{j.tickets + j.rdv}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {(!stats?.par_jour?.length && !loading) && (
            <Card className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune donnée sur cette période</h3>
              <p className="text-gray-400">Les statistiques apparaîtront une fois que des tickets ou RDV seront créés.</p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
