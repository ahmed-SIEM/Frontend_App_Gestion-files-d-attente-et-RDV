import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ticketsAPI } from '../services/api';
import { CheckCircle2, Share2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TicketConfirmationPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getById(ticketId);
      setTicket(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const message = `Mon ticket FileZen #${ticket.numero}\nPosition: ${ticket.position}\nService: ${ticket.service?.nom}\nÉtablissement: ${ticket.etablissement?.nom}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mon Ticket FileZen',
        text: message,
      }).catch(err => console.log('Erreur partage:', err));
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Informations copiées dans le presse-papier !');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Icône de succès */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        {/* Titre */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold text-center text-gray-900 mb-2"
        >
          Ticket réservé !
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 mb-8"
        >
          Votre place dans la file d'attente est confirmée
        </motion.p>

        {/* Card principale */}
        <Card className="p-8 shadow-2xl mb-6 border-t-4 border-blue-600">
          {/* Numéro du ticket */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">VOTRE TICKET</p>
            <div className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              #{ticket.numero}
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Position</p>
              <p className="text-2xl font-bold text-blue-900">{ticket.position}ème</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">Temps estimé</p>
              <p className="text-2xl font-bold text-purple-900">
                {ticket.temps_estime_minutes
                  ? `~${Math.floor(ticket.temps_estime_minutes / 60)}h${ticket.temps_estime_minutes % 60 > 0 ? ticket.temps_estime_minutes % 60 + 'min' : ''}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Détails */}
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Établissement</span>
              <span className="font-semibold text-gray-900">{ticket.etablissement?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service</span>
              <span className="font-semibold text-gray-900">{ticket.service?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heure de prise</span>
              <span className="font-semibold text-gray-900">
                {new Date(ticket.heure_creation).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Boutons d'action */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate(`/citoyen/track-ticket/${ticket._id}`)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Suivre mon ticket
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={handleShare}
            size="lg"
            variant="outline"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Partager par SMS
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Vous pouvez suivre votre ticket en temps réel depuis "Mes activités"
        </p>
      </motion.div>
    </div>
  );
}