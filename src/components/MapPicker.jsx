import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Fix pour l'icône Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onLocationSelect }) {
  const [showWarning, setShowWarning] = useState(false);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return showWarning ? (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, marginTop: '10px', marginRight: '10px' }}>
      <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">Cette adresse n'est pas en Tunisie !</span>
      </div>
    </div>
  ) : null;
}

export default function MapPicker({ onAddressSelect, onClose }) {
  const [position, setPosition] = useState([36.8065, 10.1815]); // Centre de Tunis
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = async (lat, lng) => {
    setPosition([lat, lng]);
    setLoading(true);

    try {
      // Géocodage inverse avec Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        // VÉRIFICATION CRITIQUE : C'est en Tunisie ?
        const country = data.address.country;
        const countryCode = data.address.country_code;
        
        console.log('Pays détecté:', country, countryCode);
        
        // Vérifier si c'est la Tunisie
        if (countryCode !== 'tn' && country !== 'Tunisia' && country !== 'Tunisie') {
          toast.error('⚠️ Cette adresse n\'est pas en Tunisie. Veuillez sélectionner une position en Tunisie.', {
            duration: 4000,
          });
          setLoading(false);
          return; // STOP ! Ne pas accepter cette adresse
        }
        
        // C'est bon, c'est en Tunisie !
        const address = data.display_name;
        onAddressSelect(address);
        toast.success('✅ Adresse sélectionnée !');
      } else {
        toast.error('Impossible de récupérer l\'adresse. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur géocodage:', error);
      toast.error('Erreur lors de la récupération de l\'adresse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Sélectionner votre adresse
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Cliquez sur la carte <span className="font-semibold text-blue-600">en Tunisie</span> pour choisir votre position
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative" style={{ minHeight: '500px' }}>
          <MapContainer
            center={position}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <Marker position={position} />
          </MapContainer>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[10000]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-700 font-medium">
                  Vérification de l'adresse...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-t flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Comment ça marche ?
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Cliquez n'importe où sur la carte de la Tunisie. Le système vérifiera automatiquement 
                que vous êtes bien en Tunisie avant d'accepter l'adresse. L'adresse sera ensuite 
                automatiquement remplie dans le formulaire.
              </p>
            </div>
          </div>
        </div>

        {/* Warning pour pays invalide */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Important :</span> Seules les adresses en Tunisie sont acceptées. 
              Si vous cliquez dans la mer ou hors Tunisie, l'adresse sera refusée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}