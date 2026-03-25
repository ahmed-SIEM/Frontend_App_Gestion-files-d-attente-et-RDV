import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { rdvAPI, etablissementsAPI, servicesAPI } from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AppointmentCalendarPage() {
  const { etablissementId, serviceId } = useParams();
  const navigate = useNavigate();

  const [establishment, setEstablishment] = useState(null);
  const [service, setService] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [etablissementId, serviceId]);

  useEffect(() => {
    if (selectedDate) {
      fetchCreneaux();
    }
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [estResponse, serviceResponse] = await Promise.all([
        etablissementsAPI.getById(etablissementId),
        servicesAPI.getById(serviceId)
      ]);
      
      setEstablishment(estResponse.data);
      setService(serviceResponse.data);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreneaux = async () => {
    try {
      setLoadingCreneaux(true);
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await rdvAPI.getCreneaux(serviceId, dateStr);
      
      setCreneaux(response.data || []);
      setSelectedCreneau(null);
      
    } catch (error) {
      console.error('Erreur créneaux:', error);
      toast.error('Erreur lors du chargement des créneaux');
      setCreneaux([]);
    } finally {
      setLoadingCreneaux(false);
    }
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setCreneaux([]);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setCreneaux([]);
  };

  const handleBookAppointment = async () => {
    if (!selectedCreneau) return;

    try {
      setSubmitting(true);
      
      const response = await rdvAPI.create({
        creneauxIds: [selectedCreneau._id],
        serviceId: serviceId,
        motif: ''
      });
      
      toast.success('Rendez-vous réservé !');
      navigate(`/citoyen/appointment-confirmation/${response.data._id}`);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!establishment || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900 mb-2">
            Service non trouvé
          </p>
          <Link to="/citoyen/home">
            <Button>Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    );
  }

  const days = generateCalendar();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/citoyen/establishment/${etablissementId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réserver un rendez-vous</h1>
          <p className="text-gray-600">{service.nom} - {establishment.nom}</p>
        </div>

        <div className="grid lg:grid-cols-[60%_40%] gap-6">
          {/* Calendrier */}
          <Card className="p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 pb-2">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }

                const isToday = day.toDateString() === new Date().toDateString();
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const isSelected = selectedDate?.toDateString() === day.toDateString();
                const hasSlots = !isPast;

                return (
                  <motion.button
                    key={day.toISOString()}
                    whileHover={{ scale: hasSlots ? 1.05 : 1 }}
                    whileTap={{ scale: hasSlots ? 0.95 : 1 }}
                    onClick={() => hasSlots && setSelectedDate(day)}
                    disabled={isPast}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                        : hasSlots
                        ? 'bg-green-50 text-green-900 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } ${isToday && !isSelected ? 'ring-2 ring-blue-600' : ''}`}
                  >
                    {day.getDate()}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span className="text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span className="text-gray-600">Indisponible</span>
              </div>
            </div>
          </Card>

          {/* Créneaux */}
          <div>
            <Card className="p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {selectedDate
                  ? `Créneaux - ${selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  : 'Sélectionnez une date'}
              </h3>

              {selectedDate ? (
                loadingCreneaux ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : creneaux.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {creneaux.map((creneau) => {
                      const isLibre = creneau.statut === 'libre';
                      const isOccupe = creneau.statut === 'occupe';
                      const isBloque = creneau.statut === 'bloque';
                      
                      return (
                        <motion.button
                          key={creneau._id}
                          whileHover={{ scale: isLibre ? 1.02 : 1 }}
                          whileTap={{ scale: isLibre ? 0.98 : 1 }}
                          onClick={() => isLibre && setSelectedCreneau(creneau)}
                          disabled={!isLibre}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedCreneau?._id === creneau._id
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : isLibre
                              ? 'bg-green-50 hover:bg-green-100 text-green-900'
                              : isOccupe
                              ? 'bg-purple-50 text-purple-900 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">
                              {creneau.heure_debut} - {creneau.heure_fin}
                            </span>
                            <Badge 
                              className={
                                selectedCreneau?._id === creneau._id
                                  ? 'bg-white text-blue-600'
                                  : isLibre 
                                  ? 'bg-green-600 text-white' 
                                  : isOccupe
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-400 text-white'
                              }
                            >
                              {isLibre ? 'Disponible' : isOccupe ? 'Occupé' : 'Bloqué'}
                            </Badge>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucun créneau disponible pour cette date</p>
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Sélectionnez une date pour voir les créneaux disponibles</p>
                </div>
              )}
            </Card>

            {selectedDate && selectedCreneau && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Button
                  onClick={handleBookAppointment}
                  disabled={submitting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Réservation...
                    </>
                  ) : (
                    'Réserver ce créneau'
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}