import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { etablissementsAPI } from '../services/api';
import { 
  Building2, 
  FileText, 
  CheckCircle, 
  X, 
  Eye, 
  LayoutDashboard, 
  CheckCircle as CheckIcon, 
  BarChart3, 
  Settings,
  Loader2,
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

export default function ValidateEstablishmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les établissements (incluant en_attente)
      const response = await etablissementsAPI.getAll();
      setEstablishments(response.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEstablishment) return;

    try {
      await etablissementsAPI.valider(selectedEstablishment._id);
      
      toast.success('Établissement approuvé avec succès !');
      setShowApproveDialog(false);
      setSelectedEstablishment(null);
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!selectedEstablishment || !rejectionReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      await etablissementsAPI.rejeter(selectedEstablishment._id, rejectionReason);
      
      toast.success('Demande rejetée');
      setShowRejectDialog(false);
      setSelectedEstablishment(null);
      setRejectionReason('');
      fetchData();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'mairie': 'Mairie',
      'hopital': 'Hôpital',
      'clinique': 'Clinique',
      'centre_sante': 'Centre de Santé',
      'administration': 'Administration',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingEstablishments = establishments.filter(e => e.statut === 'en_attente');
  const approvedEstablishments = establishments.filter(e => e.statut === 'actif');
  const rejectedEstablishments = establishments.filter(e => e.statut === 'rejete');

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
            className="flex items-center space-x-3 bg-white/10 rounded-lg p-3 relative"
          >
            <CheckIcon className="w-5 h-5" />
            <span>Validation établissements</span>
            {pendingEstablishments.length > 0 && (
              <Badge className="absolute right-3 bg-orange-500">
                {pendingEstablishments.length}
              </Badge>
            )}
          </Link>
          
          <Link 
            to="/superadmin/establishments" 
            className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-3 transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900">Validation des Établissements</h1>
            <p className="text-gray-600">{pendingEstablishments.length} demande(s) en attente</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending" className="relative">
                En attente
                {pendingEstablishments.length > 0 && (
                  <Badge className="ml-2 bg-orange-500">{pendingEstablishments.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approuvés ({approvedEstablishments.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejetés ({rejectedEstablishments.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending" className="mt-6">
              <div className="space-y-6">
                {pendingEstablishments.map((establishment, index) => (
                  <motion.div
                    key={establishment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-xl transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{establishment.nom}</h3>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge>{getTypeLabel(establishment.type)}</Badge>
                              <span className="text-sm text-gray-500">
                                Soumis le {new Date(establishment.date_inscription).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Informations principales</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Adresse:</span>
                              <span className="font-medium">{establishment.adresse?.rue}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ville:</span>
                              <span className="font-medium">
                                {establishment.adresse?.ville}, {establishment.gouvernorat}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Téléphone:</span>
                              <span className="font-medium">{establishment.telephone_etablissement}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium">{establishment.email_etablissement}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Administrateur</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nom:</span>
                              <span className="font-medium">
                                {establishment.admin_prenom} {establishment.admin_nom}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium">{establishment.admin_email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Téléphone:</span>
                              <span className="font-medium">{establishment.admin_telephone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fonction:</span>
                              <span className="font-medium">{establishment.admin_fonction}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {establishment.documents && establishment.documents.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Documents fournis</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {establishment.documents.map((doc, docIndex) => (
                              <div 
                                key={docIndex} 
                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{doc.nom}</p>
                                    <p className="text-xs text-gray-500">{doc.taille || 'Document'}</p>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Voir
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedEstablishment(establishment);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            setSelectedEstablishment(establishment);
                            setShowRejectDialog(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {pendingEstablishments.length === 0 && (
                  <Card className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Aucune demande en attente
                    </h3>
                    <p className="text-gray-600">Toutes les demandes ont été traitées</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {approvedEstablishments.map((establishment, index) => (
                  <motion.div
                    key={establishment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{establishment.nom}</h3>
                          <p className="text-sm text-gray-600">
                            {establishment.adresse?.ville}, {establishment.gouvernorat}
                          </p>
                        </div>
                        <Badge className="bg-green-600">Approuvé</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Approuvé le {new Date(establishment.date_validation).toLocaleDateString('fr-FR')}
                      </p>
                    </Card>
                  </motion.div>
                ))}

                {approvedEstablishments.length === 0 && (
                  <Card className="p-12 text-center col-span-2">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun établissement approuvé</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Rejected Tab */}
            <TabsContent value="rejected" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {rejectedEstablishments.map((establishment, index) => (
                  <motion.div
                    key={establishment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{establishment.nom}</h3>
                          <p className="text-sm text-gray-600">
                            {establishment.adresse?.ville}, {establishment.gouvernorat}
                          </p>
                        </div>
                        <Badge className="bg-red-600">Rejeté</Badge>
                      </div>
                      {establishment.raison_rejet && (
                        <div className="bg-red-50 rounded-lg p-3 mt-3">
                          <p className="text-sm text-red-900">
                            <strong>Raison:</strong> {establishment.raison_rejet}
                          </p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}

                {rejectedEstablishments.length === 0 && (
                  <Card className="p-12 text-center col-span-2">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun établissement rejeté</p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver cet établissement ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'administrateur recevra un email de confirmation et pourra accéder à son espace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-gray-900 font-semibold">{selectedEstablishment?.nom}</p>
            <p className="text-sm text-gray-600">
              {selectedEstablishment?.adresse?.ville}, {selectedEstablishment?.gouvernorat}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmer l'approbation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cette demande</AlertDialogTitle>
            <AlertDialogDescription>
              L'administrateur sera notifié du rejet avec la raison fournie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du rejet *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason('')}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmer le rejet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}