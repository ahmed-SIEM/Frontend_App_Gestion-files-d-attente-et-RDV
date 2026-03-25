import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { etablissementsAPI } from '../services/api';
import { 
  Building2, 
  LayoutDashboard, 
  CheckCircle, 
  BarChart3, 
  Settings,
  Loader2,
  Eye,
  Ban,
  Play,
  AlertCircle
} from 'lucide-react';
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

export default function ManageEstablishmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEtab, setSelectedEtab] = useState(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [raison, setRaison] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les établissements (actifs + suspendus)
      const response = await etablissementsAPI.getAll();
      setEstablishments(response.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendre = async () => {
    if (!selectedEtab || !raison.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      await etablissementsAPI.suspendre(selectedEtab._id, raison);
      
      toast.success('Établissement suspendu avec succès');
      setShowSuspendDialog(false);
      setSelectedEtab(null);
      setRaison('');
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suspension');
    }
  };

  const handleActiver = async () => {
    if (!selectedEtab) return;

    try {
      await etablissementsAPI.activer(selectedEtab._id);
      
      toast.success('Établissement activé avec succès');
      setShowActivateDialog(false);
      setSelectedEtab(null);
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'activation');
    }
  };

  const getStatusBadge = (statut) => {
    switch(statut) {
      case 'actif':
        return <Badge className="bg-green-600">ACTIF</Badge>;
      case 'suspendu':
        return <Badge className="bg-orange-600">SUSPENDU</Badge>;
      case 'en_attente':
        return <Badge className="bg-blue-600">EN ATTENTE</Badge>;
      case 'rejete':
        return <Badge className="bg-red-600">REJETÉ</Badge>;
      default:
        return <Badge className="bg-gray-400">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white p-6 hidden lg:block">
        <Link to="/" className="flex items-center space-x-2 mb-10">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="font-bold text-xl">F</span>
          </div>
          <span className="text-xl font-bold">FileZen</span>
        </Link>
        
        <nav className="space-y-2">
          <Link 
            to="/superadmin/dashboard" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Vue d'ensemble</span>
          </Link>
          
          <Link 
            to="/superadmin/validate" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Validation établissements</span>
          </Link>
          
          <Link 
            to="/superadmin/establishments" 
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3"
          >
            <Building2 className="w-5 h-5" />
            <span>Gestion établissements</span>
          </Link>
          
          <Link 
            to="/superadmin/stats" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques globales</span>
          </Link>
          
          <Link 
            to="/superadmin/settings" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Configuration</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Établissements</h1>
            <p className="text-gray-600">{establishments.length} établissements au total</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {establishments.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun établissement
              </h3>
              <p className="text-gray-600">
                Aucun établissement n'est enregistré dans la plateforme
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishments.map((establishment, index) => (
                <motion.div
                  key={establishment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {establishment.nom}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {establishment.adresse?.ville || establishment.gouvernorat}
                        </p>
                      </div>
                      {getStatusBadge(establishment.statut)}
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold capitalize">
                          {establishment.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gouvernorat:</span>
                        <span className="font-semibold">
                          {establishment.gouvernorat}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Téléphone:</span>
                        <span className="font-semibold">
                          {establishment.telephone_etablissement}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/superadmin/establishments/${establishment._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir détails
                      </Button>
                      
                      {establishment.statut === 'actif' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-orange-600 border-orange-600 hover:bg-orange-50"
                          onClick={() => {
                            setSelectedEtab(establishment);
                            setShowSuspendDialog(true);
                          }}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspendre
                        </Button>
                      ) : establishment.statut === 'suspendu' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => {
                            setSelectedEtab(establishment);
                            setShowActivateDialog(true);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Activer
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Dialog Suspendre */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspendre l'établissement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez suspendre "{selectedEtab?.nom}". Veuillez indiquer la raison de la suspension.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Raison de la suspension..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRaison('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspendre}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Suspendre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Activer */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activer l'établissement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez réactiver "{selectedEtab?.nom}". L'établissement pourra à nouveau utiliser la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleActiver}
              className="bg-green-600 hover:bg-green-700"
            >
              Activer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}