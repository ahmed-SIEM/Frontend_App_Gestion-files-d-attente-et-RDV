import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ticketsAPI } from '../services/api';
import { MapPin, X, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

export default function TrackTicketPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialPosition, setInitialPosition] = useState(null);

  useEffect(() => {
    fetchTicket();
    
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(() => {
      fetchTicket();
    }, 10000);

    return () => clearInterval(interval);
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await ticketsAPI.getById(ticketId);
      const ticketData = response.data;
      
      // Sauvegarder la position initiale
      if (initialPosition === null) {
        setInitialPosition(ticketData.tickets_avant || ticketData.position);
      }
      
      setTicket(ticketData);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du ticket');
      setLoading(false);
    }
  };

  const handleCancelTicket = async () => {
    try {
      await ticketsAPI.cancel(ticketId);
      toast.success('Ticket annulé avec succès');
      navigate('/citoyen/activities');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation du ticket');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Ticket non trouvé
          </p>
          <Link to="/citoyen/activities">
            <Button>Voir mes activités</Button>
          </Link>
        </div>
      </div>
    );
  }

  const position = ticket.tickets_avant || 0;
  const progressPercentage = initialPosition > 0 
    ? Math.max(0, 100 - (position / initialPosition) * 100)
    : 0;
  const estimatedWait = ticket.temps_estime_minutes || 0;
  const hasAdvanced = initialPosition !== null && position < initialPosition;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Header avec logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FileZen
            </span>
          </div>
          <Link to="/citoyen/activities">
            <Button variant="outline">Mes activités</Button>
          </Link>
        </div>

        {/* Card principale */}
        <Card className="p-8 shadow-2xl">
          {/* Badge + Numéro de ticket */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {ticket.statut === 'en_attente' ? 'En attente - File active' : 
                 ticket.statut === 'appele' ? 'Appelé - Présentez-vous !' :
                 'Statut: ' + ticket.statut}
              </Badge>
            </motion.div>
            <div className="mb-6">
              <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                #{ticket.numero}
              </div>
            </div>
          </div>

          {/* Stats principales */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Avant vous */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <p className="text-sm text-blue-700 mb-2">Avant vous</p>
              <motion.p
                key={position}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-5xl font-bold text-blue-900"
              >
                {position}
              </motion.p>
              {hasAdvanced && (
                <div className="flex items-center justify-center mt-2 text-green-600">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span className="text-sm">Avance rapide</span>
                </div>
              )}
            </div>

            {/* Temps estimé */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <p className="text-sm text-purple-700 mb-2">Temps estimé</p>
              <p className="text-5xl font-bold text-purple-900">
                {estimatedWait > 0 
                  ? `~${Math.floor(estimatedWait / 60)}h${estimatedWait % 60 > 0 ? estimatedWait % 60 + 'min' : ''}`
                  : '—'}
              </p>
              <p className="text-xs text-purple-600 mt-2">Mise à jour temps réel</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Ticket en cours */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Ticket en cours</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                #{ticket.service?.ticket_actuel || '—'}
              </span>
            </div>
          </Card>

          {/* Boutons d'action */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(ticket.etablissement?.adresse)}`, '_blank')}
            >
              <MapPin className="w-5 h-5 mr-2" />
              Localiser établissement
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={ticket.statut !== 'en_attente' && ticket.statut !== 'appele'}
                >
                  <X className="w-5 h-5 mr-2" />
                  Annuler mon ticket
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler le ticket ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir annuler votre ticket #{ticket.numero} ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Non, garder</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelTicket}>
                    Oui, annuler
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        {/* Infos établissement */}
        <Card className="p-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-4">Informations établissement</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Établissement</span>
              <span className="font-semibold">{ticket.etablissement?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service</span>
              <span className="font-semibold">{ticket.service?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Adresse</span>
              <span className="font-semibold">{ticket.etablissement?.adresse}</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}