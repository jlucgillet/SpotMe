
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Image as ImageIcon, Eye, Search, Navigation, Loader2, Maximize, Minimize, Plus, Layers, Users } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import CategoryIcon from "./CategoryIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAP_STYLES = [
  { id: 'outdoors-v12', name: 'Terrain', icon: '🏔️' },
  { id: 'streets-v12', name: 'Rue', icon: '🗺️' },
  { id: 'satellite-v9', name: 'Satellite', icon: '🛰️' },
  { id: 'satellite-streets-v12', name: 'Satellite + Rues', icon: '🌍' },
  { id: 'light-v11', name: 'Clair', icon: '☀️' },
  { id: 'dark-v11', name: 'Sombre', icon: '🌙' },
];

const createCategoryMarkerIcon = (categories, isSelected = false) => {
  const size = isSelected ? 40 : 32;
  const iconSize = isSelected ? 20 : 16;
  
  const primaryCategory = Array.isArray(categories) && categories.length > 0 
    ? categories[0] 
    : (typeof categories === 'string' ? categories : 'lieu_remarquable');
  
  const categoryIcons = {
    lieu_remarquable: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      color: isSelected ? '%23ea580c' : '%23f59e0b'
    },
    camping: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21 14 3l10.5 18H3.5Z"/><path d="M14 3v18"/></svg>`,
      color: isSelected ? '%23059669' : '%2310b981'
    },
    van_park: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v10"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><path d="M15 18H9"/><circle cx="17" cy="18" r="2"/></svg>`,
      color: isSelected ? '%232563eb' : '%233b82f6'
    },
    parapente: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/></svg>`,
      color: isSelected ? '%230284c7' : '%230ea5e9'
    },
    trek: {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      color: isSelected ? '%237c3aed' : '%23a855f7'
    }
  };
  
  const config = categoryIcons[primaryCategory] || categoryIcons.lieu_remarquable;
  
  return new Icon({
    iconUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='${config.color}' stroke='white' stroke-width='2'/%3E%3Cg transform='translate(${16 - iconSize/2}, ${16 - iconSize/2})'%3E${config.svg}%3C/g%3E%3C/svg%3E`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, 0]
  });
};

function MapController({ selectedSpot, searchPosition }) {
  const map = useMap();

  useEffect(() => {
    if (selectedSpot) {
      map.flyTo([selectedSpot.latitude, selectedSpot.longitude], 14, {
        duration: 1.5
      });
    }
  }, [selectedSpot, map]);

  useEffect(() => {
    if (searchPosition) {
      map.flyTo([searchPosition.lat, searchPosition.lng], 13, {
        duration: 1.5
      });
    }
  }, [searchPosition, map]);

  return null;
}

export default function SpotMap({ 
  spots, 
  isLoading, 
  onSpotClick, 
  selectedSpot, 
  isFullscreen, 
  onToggleFullscreen, 
  onCreateSpot, 
  onMapClick,
  selectedCategories,
  setSelectedCategories,
  selectedCommunities,
  setSelectedCommunities,
  userCommunities
}) {
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  const [mapZoom, setMapZoom] = useState(6);
  const [isGeolocating, setIsGeolocating] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchPosition, setSearchPosition] = useState(null);
  const [mapStyle, setMapStyle] = useState('outdoors-v12');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(12);
          setIsGeolocating(false);
        },
        (error) => {
          console.log("Géolocalisation non disponible, utilisation de la position par défaut");
          setIsGeolocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsGeolocating(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Veuillez saisir un lieu");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setSearchPosition({ lat, lng });
        toast.success(`Position trouvée: ${result.display_name}`);
      } else {
        toast.error("Lieu introuvable");
      }
    } catch (error) {
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSearchPosition({ lat, lng });
        setIsSearching(false);
        toast.success("Position détectée !");
      },
      (error) => {
        setIsSearching(false);
        toast.error("Impossible d'obtenir votre position");
      }
    );
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        const newCategories = prev.filter(id => id !== categoryId);
        return newCategories.length > 0 ? newCategories : prev;
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleCommunityToggle = (communityId) => {
    setSelectedCommunities(prev => {
      if (prev.includes(communityId)) {
        const newCommunities = prev.filter(id => id !== communityId);
        return newCommunities.length > 0 ? newCommunities : prev;
      } else {
        return [...prev, communityId];
      }
    });
  };

  if (isLoading || isGeolocating) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isGeolocating ? "Localisation en cours..." : "Chargement de la carte..."}
          </p>
        </div>
      </div>
    );
  }

  const selectedStyle = MAP_STYLES.find(s => s.id === mapStyle) || MAP_STYLES[0];

  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          key={mapStyle}
          url={`https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiamx1YzI1IiwiYSI6ImNtaHc0ZGJ2ODAzZjMya3F3MHk5eGJhNGUifQ.NwNHaPaMFAeYg1ecORv2dA`}
          attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        />
        
        <MapController selectedSpot={selectedSpot} searchPosition={searchPosition} />
        
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {spots.map((spot) => {
          const categories = spot.categories && Array.isArray(spot.categories) 
            ? spot.categories 
            : (spot.category ? [spot.category] : ["lieu_remarquable"]);
          
          return (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={createCategoryMarkerIcon(categories, selectedSpot?.id === spot.id)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {categories.map(category => (
                      <CategoryIcon key={category} category={category} size="sm" showLabel={true} />
                    ))}
                  </div>
                  {spot.photos?.[0] && (
                    <img
                      src={spot.photos[0]}
                      alt={spot.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-lg mb-1">{spot.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {spot.description}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onSpotClick(spot)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir les détails
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {searchPosition && (
          <Marker
            position={[searchPosition.lat, searchPosition.lng]}
            icon={new Icon({
              iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%233b82f6' stroke='white' stroke-width='2'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3' fill='white'%3E%3C/circle%3E%3C/svg%3E",
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })}
          >
            <Popup>Position recherchée</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <Button
          size="sm"
          onClick={onToggleFullscreen}
          className="h-9 w-9 p-0 bg-white/95 hover:bg-white border border-gray-200 shadow-md"
          variant="outline"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4 text-emerald-600" />
          ) : (
            <Maximize className="w-4 h-4 text-emerald-600" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 w-9 p-0 bg-white/95 hover:bg-white border border-gray-200 shadow-md"
              variant="outline"
              title="Type de carte"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 z-[10000]">
            {MAP_STYLES.map((style) => (
              <DropdownMenuItem
                key={style.id}
                onClick={() => setMapStyle(style.id)}
                className={mapStyle === style.id ? "bg-emerald-50 text-emerald-600 font-medium" : ""}
              >
                <span className="mr-2 text-lg">{style.icon}</span>
                {style.name}
                {mapStyle === style.id && (
                  <span className="ml-auto text-emerald-600">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 w-9 p-0 bg-white/95 hover:bg-white border border-gray-200 shadow-md relative"
              variant="outline"
              title="Filtrer par catégorie"
            >
              <CategoryIcon category={selectedCategories[0]} size="sm" />
              {selectedCategories.length < 5 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                  {selectedCategories.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 z-[10000] p-2">
            {[
              { id: "lieu_remarquable", label: "Lieu remarquable" },
              { id: "camping", label: "Camping" },
              { id: "van_park", label: "Van Park" },
              { id: "parapente", label: "Parapente" },
              { id: "trek", label: "Trek" }
            ].map((category) => (
              <div 
                key={category.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleCategoryToggle(category.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => {}}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <CategoryIcon category={category.id} size="sm" showLabel={true} />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 w-9 p-0 bg-white/95 hover:bg-white border border-gray-200 shadow-md relative"
              variant="outline"
              title="Filtrer par communauté"
            >
              <Users className="w-4 h-4 text-emerald-600" />
              {selectedCommunities.length < userCommunities.length && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                  {selectedCommunities.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 z-[10000] p-2 max-h-64 overflow-y-auto">
            {userCommunities.map((community) => (
              <div 
                key={community.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleCommunityToggle(community.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedCommunities.includes(community.id)}
                  onChange={() => {}}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: community.color }}
                />
                <span className="text-sm">{community.name}</span>
              </div>
            ))}
            {userCommunities.length === 0 && (
              <p className="text-sm text-gray-500 p-2">Aucune communauté disponible.</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-48 h-9 text-sm bg-white/95 backdrop-blur-lg border-gray-200 shadow-md"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isSearching}
          className="h-9 w-9 p-0 bg-white/95 hover:bg-white border border-gray-200 shadow-md"
          variant="outline"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-emerald-600" />
          )}
        </Button>
        <Button
          size="sm"
          onClick={handleGeolocate}
          disabled={isSearching}
          className="h-9 w-9 p-0 bg-white/95 hover:bg-white border border-gray-200 shadow-md"
          variant="outline"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
        </Button>
      </div>

      {isFullscreen && onCreateSpot && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Button
            size="sm"
            onClick={onCreateSpot}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md h-9 sm:px-4 px-2"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Ajouter un spot</span>
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
        <Card className="bg-white/90 backdrop-blur-lg border-emerald-100 shadow-lg p-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{spots.length}</p>
              <p className="text-[10px] text-gray-600">spots</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
