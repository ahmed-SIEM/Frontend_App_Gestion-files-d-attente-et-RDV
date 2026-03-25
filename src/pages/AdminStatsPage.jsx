import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, etablissementsAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  Ticket,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminStatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [establishment, setEstablishment] = useState(null);
  const [stats, setStats] = useState(null);
  const [periode, setPeriode] = useState('7jours');
  const [loading, setLoading] = useState(true);

  const periodeOptions = [
    { value: '7jours', label: '7 derniers jours' },
    { value: '30jours', label: '30 derniers jours' },
    { value: 'mois', label: 'Ce mois' },
    { value: 'annee', label: 'Cette année' }
  ];

  useEffect(() => {
    fetchData();
  }, [periode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const estResponse = await etablissementsAPI.getById(user.etablissement);
      setEstablishment(estResponse.data);
      
      // Calculer les dates selon la période
      const dateFin = new Date();
      let dateDebut = new Date();
      
      switch(periode) {
        case '7jours':
          dateDebut.setDate(dateFin.getDate() - 7);
          break;
        case '30jours':
          dateDebut.setDate(dateFin.getDate() - 30);
          break;
        case 'mois':
          dateDebut.setDate(1);
          break;
        case 'annee':
          dateDebut.setMonth(0);
          dateDebut.setDate(1);
          break;
      }
      
      // Récupérer les stats détaillées
      const statsResponse = await statsAPI.getDetailed(
        user.etablissement, 
        dateDebut.toISOString(), 
        dateFin.toISOString()
      );
      
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Export en cours... (fonctionnalité à venir)');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // Mock data pour les graphiques (à remplacer par vraies données backend)
  const mockStats = {
    tickets_total: 1847,
    tickets_variation: '+12%',
    rdv_total: 423,
    rdv_variation: '+8%',
    taux_presence: 87,
    taux_presence_variation: '+3%',
    satisfaction: 94,
    satisfaction_variation: '+2%',
    tickets_par_jour: [
      { jour: 'Lun', tickets: 45, rdv: 12 },
      { jour: 'Mar', tickets: 52, rdv: 15 },
      { jour: 'Mer', tickets: 38, rdv: 10 },
      { jour: 'Jeu', tickets: 61, rdv: 18 },
      { jour: 'Ven', tickets: 55, rdv: 14 },
      { jour: 'Sam', tickets: 28, rdv: 8 },
      { jour: 'Dim', tickets: 15, rdv: 5 }
    ],
    services_populaires: [
      { nom: 'Consultation Générale', tickets: 567, pourcentage: 31 },
      { nom: 'Radiologie', tickets: 423, pourcentage: 23 },
      { nom: 'Analyses', tickets: 389, pourcentage: 21 },
      { nom: 'Vaccination', tickets: 278, pourcentage: 15 },
      { nom: 'Autres', tickets: 190, pourcentage: 10 }
    ],
    heures_pic: [
      { heure: '08:00', affluence: 45 },
      { heure: '09:00', affluence: 78 },
      { heure: '10:00', affluence: 92 },
      { heure: '11:00', affluence: 85 },
      { heure: '12:00', affluence: 35 },
      { heure: '13:00', affluence: 20 },
      { heure: '14:00', affluence: 65 },
      { heure: '15:00', affluence: 88 },
      { heure: '16:00', affluence: 95 },
      { heure: '17:00', affluence: 60 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-900 to-purple-700 text-white p-6 hidden lg:block">
        <div className="mb-10">
          <p className="text-sm text-white/70 mb-1">Établissement</p>
          <p className="font-bold">{establishment?.nom || 'Mon Établissement'}</p>
        </div>
        
        <nav className="space-y-2">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Vue d'ensemble</span>
          </Link>
          
          <Link 
            to="/admin/services" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Wrench className="w-5 h-5" />
            <span>Gestion Services</span>
          </Link>
          
          <Link 
            to="/admin/agents" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Gestion Agents</span>
          </Link>
          
          <Link 
            to="/admin/hours" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>Horaires & Pauses</span>
          </Link>
          
          <Link 
            to="/admin/appointments-config" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Configuration RDV</span>
          </Link>
          
          <Link 
            to="/admin/stats" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques Détaillées</h1>
              <p className="text-gray-600">Analysez les performances de votre établissement</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Sélecteur de période */}
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {periodeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Tickets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {mockStats.tickets_variation}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">Tickets total</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.tickets_total}</p>
              </Card>
            </motion.div>

            {/* RDV */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {mockStats.rdv_variation}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">Rendez-vous</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.rdv_total}</p>
              </Card>
            </motion.div>

            {/* Taux présence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {mockStats.taux_presence_variation}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">Taux de présence</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.taux_presence}%</p>
              </Card>
            </motion.div>

            {/* Satisfaction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    {mockStats.satisfaction_variation}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">Satisfaction</p>
                <p className="text-3xl font-bold text-gray-900">{mockStats.satisfaction}%</p>
              </Card>
            </motion.div>
          </div>

          {/* Graphiques */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Tickets par jour */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Tickets & RDV par jour
                </h3>
                <div className="space-y-4">
                  {mockStats.tickets_par_jour.map((jour, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{jour.jour}</span>
                        <span className="text-gray-600">{jour.tickets + jour.rdv} total</span>
                      </div>
                      <div className="flex space-x-2">
                        <div 
                          className="h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded"
                          style={{ width: `${(jour.tickets / 70) * 100}%` }}
                          title={`${jour.tickets} tickets`}
                        />
                        <div 
                          className="h-8 bg-gradient-to-r from-purple-600 to-purple-400 rounded"
                          style={{ width: `${(jour.rdv / 70) * 100}%` }}
                          title={`${jour.rdv} RDV`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded mr-2" />
                    <span className="text-sm text-gray-600">Tickets</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded mr-2" />
                    <span className="text-sm text-gray-600">RDV</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Services populaires */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Services les plus demandés
                </h3>
                <div className="space-y-4">
                  {mockStats.services_populaires.map((service, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{service.nom}</span>
                        <span className="text-gray-600">{service.tickets} tickets</span>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded flex items-center justify-end pr-2"
                          style={{ width: `${service.pourcentage}%` }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {service.pourcentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Heures de pic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Heures d'affluence
              </h3>
              <div className="flex items-end justify-between space-x-2 h-64">
                {mockStats.heures_pic.map((heure, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t relative group cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ height: `${(heure.affluence / 100) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {heure.affluence} visites
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">{heure.heure}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}