import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { rdvAPI } from '../services/api';
import { CheckCircle2, Calendar, Download, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AppointmentConfirmationPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [rdv, setRdv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRdv();
  }, [appointmentId]);

  const fetchRdv = async () => {
    try {
      setLoading(true);
      const response = await rdvAPI.getById(appointmentId);
      setRdv(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleAddToCalendar = () => {
    if (!rdv || !rdv.creneaux || rdv.creneaux.length === 0) return;

    const creneau = rdv.creneaux[0];
    const date = new Date(creneau.date);
    const [startHour, startMinute] = creneau.heure_debut.split(':');
    const [endHour, endMinute] = creneau.heure_fin.split(':');

    // Format pour Google Calendar
    const startDate = new Date(date);
    startDate.setHours(parseInt(startHour), parseInt(startMinute));
    const endDate = new Date(date);
    endDate.setHours(parseInt(endHour), parseInt(endMinute));

    const formatDateForCalendar = (d) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`RDV - ${rdv.service?.nom}`);
    const details = encodeURIComponent(`Rendez-vous à ${rdv.etablissement?.nom}\nService: ${rdv.service?.nom}`);
    const location = encodeURIComponent(rdv.etablissement?.adresse || '');
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!rdv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Rendez-vous non trouvé
          </p>
          <Link to="/citoyen/activities">
            <Button>Voir mes activités</Button>
          </Link>
        </div>
      </div>
    );
  }

  const creneau = rdv.creneaux?.[0];

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
          Rendez-vous confirmé !
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 mb-8"
        >
          Votre rendez-vous a été enregistré avec succès
        </motion.p>

        {/* Card principale */}
        <Card className="p-8 shadow-2xl mb-6 border-t-4 border-pink-600">
          {/* Date et heure */}
          <div className="text-center mb-8">
            {creneau && (
              <>
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {formatDate(creneau.date)}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {creneau.heure_debut} - {creneau.heure_fin}
                </div>
              </>
            )}
          </div>

          {/* Détails */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Service</span>
              <span className="font-semibold text-gray-900">{rdv.service?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Établissement</span>
              <span className="font-semibold text-gray-900">{rdv.etablissement?.nom}</span>
            </div>
            {creneau && (
              <div className="flex justify-between">
                <span className="text-gray-600">Durée</span>
                <span className="font-semibold text-gray-900">{creneau.duree_minutes} minutes</span>
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Rappels activés : J-1 et H-1 avant le rendez-vous
              </p>
            </div>
          </div>
        </Card>

        {/* Boutons d'action */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleAddToCalendar}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Download className="w-5 h-5 mr-2" />
            Ajouter à mon calendrier
          </Button>
          <Button
            onClick={() => navigate('/citoyen/activities')}
            size="lg"
            variant="outline"
          >
            Mes rendez-vous
          </Button>
        </div>

        {/* Note d'information */}
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <p className="text-sm text-orange-900">
            <strong>À noter :</strong> Vous pouvez annuler ce rendez-vous à tout moment. 
            La reprogrammation est possible jusqu'à 24h avant le rendez-vous.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}