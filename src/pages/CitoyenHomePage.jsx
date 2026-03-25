import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { etablissementsAPI } from '../services/api';
import { Search, MapPin, Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CitoyenHomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstablishments();
  }, [selectedType]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (selectedType === 'all') {
        response = await etablissementsAPI.getAll();
      } else {
        response = await etablissementsAPI.filterByType(selectedType);
      }
      
      setEstablishments(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des établissements');
    } finally {
      setLoading(false);
    }
  };

  const filteredEstablishments = establishments.filter((est) => {
    const matchesSearch =
      est.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      est.ville?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && est.statut === 'actif';
  });

  const types = [
    { value: 'all', label: 'Tous' },
    { value: 'mairie', label: 'Mairies' },
    { value: 'hopital', label: 'Hôpitaux' },
    { value: 'poste', label: 'Postes' },
    { value: 'cnam', label: 'CNAM' },
    { value: 'banque', label: 'Banques' },
  ];

  return (
    <>
      {/* Search Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-6">
              Rechercher un établissement
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-6 rounded-xl text-lg border-0"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {types.map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                onClick={() => setSelectedType(type.value)}
                className={
                  selectedType === type.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0'
                    : ''
                }
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredEstablishments.length}</span>{' '}
              établissements trouvés
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEstablishments.map((establishment) => (
                <motion.div
                  key={establishment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-all cursor-pointer h-full border border-gray-200 bg-white">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          {establishment.nom}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {establishment.ville}, {establishment.gouvernorat}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Badge variant="default" className="capitalize">
                        {establishment.type}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {establishment.description}
                    </p>

                    <Button
                      onClick={() =>
                        navigate(`/citoyen/establishment/${establishment._id}`)
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    >
                      Voir les Services
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredEstablishments.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun établissement trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}