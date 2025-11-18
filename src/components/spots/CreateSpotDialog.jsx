
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Upload, X, Loader2, Map, Users, GripVertical, Camera } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Checkbox } from "@/components/ui/checkbox";
import CategorySelect from "./CategorySelect";
import TrekDetailsForm from "./TrekDetailsForm";
import { compressImage } from "./imageCompression";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const markerIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%2310b981' stroke='white' stroke-width='2'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3' fill='white'%3E%3C/circle%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function CreateSpotDialog({ open, onOpenChange, onSpotCreated, initialCoordinates }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categories: ["lieu_remarquable"],
    latitude: "",
    longitude: "",
    address: "",
    community_ids: [],
    photos: [],
    trek_details: {},
    gpx_file: null
  });
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [mapCenter, setMapCenter] = useState([46.603354, 1.888334]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [notifyCommunity, setNotifyCommunity] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: communities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-created_date'),
  });

  // Filtrer les communautés de l'utilisateur
  const userCommunities = communities.filter(community => {
    if (!user?.email) return false;
    const isCreator = community.created_by === user.email;
    const isMember = community.member_emails && community.member_emails.includes(user.email);
    const isAdmin = community.admin_emails && community.admin_emails.includes(user.email);
    return isCreator || isMember || isAdmin;
  });

  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Géolocalisation non disponible");
        }
      );
    }
  }, [open]);

  // Set initial coordinates when provided
  useEffect(() => {
    if (initialCoordinates && open) {
      setFormData(prev => ({
        ...prev,
        latitude: initialCoordinates.lat.toFixed(6),
        longitude: initialCoordinates.lng.toFixed(6)
      }));
      setMarkerPosition([initialCoordinates.lat, initialCoordinates.lng]);
      setMapCenter([initialCoordinates.lat, initialCoordinates.lng]);
    }
  }, [initialCoordinates, open]);

  const isTrekCategory = formData.categories.includes("trek");

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const spotData = { ...data };
      if (!isTrekCategory) {
        delete spotData.trek_details;
        delete spotData.gpx_file;
      }
      const spot = await base44.entities.Spot.create(spotData);
      
      // Créer une notification pour l'admin
      await base44.entities.Notification.create({
        type: "spot",
        message: `${user?.full_name || user?.email || 'Un utilisateur'} a créé le spot "${data.name}"`,
        related_id: spot.id,
        related_name: data.name
      });

      // Si notification activée, envoyer emails HTML aux communautés
      if (notifyCommunity) {
        for (const communityId of data.community_ids) {
          const community = communities.find(c => c.id === communityId);
          if (community) {
            // Créer une notification
            await base44.entities.Notification.create({
              type: "spot",
              message: `Nouveau spot "${data.name}" ajouté à la communauté "${community.name}"`,
              related_id: spot.id,
              related_name: data.name
            });

            // Envoyer un email aux membres
            const recipients = [
              ...(community.member_emails || []),
              ...(community.admin_emails || []),
              community.created_by
            ];
            const uniqueRecipients = [...new Set(recipients)].filter(email => email !== user?.email);

            const emailBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📍 Nouveau spot sur <a href="https://spotme.base44.app/" style="color: #d1fae5; text-decoration: none;">SpotMe</a></h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${user?.full_name || user?.email || 'Un membre'}</strong> a ajouté un nouveau spot à la communauté <strong style="color: #10b981;">"${community.name}"</strong> !
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">📍 ${data.name}</h2>
      ${data.description ? `<p style="margin-bottom: 10px;">${data.description}</p>` : ''}
      ${data.address ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">📫 ${data.address}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://spotme.base44.app/?spotId=${spot.id}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4); border: 2px solid #047857;">
        🚀 Découvrir le spot
      </a>
    </div>
    
    <p style="margin-top: 40px; color: #6b7280; font-size: 14px; text-align: center;">
      À bientôt sur <a href="https://spotme.base44.app/" style="color: #10b981; text-decoration: none;">SpotMe</a>,<br>
      <strong>L'équipe SpotMe</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;"><a href="https://spotme.base44.app/" style="color: #9ca3af; text-decoration: none;">SpotMe</a> - Partagez vos spots avec votre communauté</p>
  </div>
</body>
</html>`;

            await Promise.all(
              uniqueRecipients.map(email =>
                base44.integrations.Core.SendEmail({
                  from_name: `${community.name} (SpotMe)`,
                  to: email,
                  subject: `📍 Nouveau spot : ${data.name}`,
                  body: emailBody,
                  is_html: true
                }).catch(err => console.error(`Failed to send email to ${email}:`, err))
              )
            );
          }
        }
      }
      
      return spot;
    },
    onSuccess: () => {
      toast.success("Spot créé avec succès !");
      setFormData({ name: "", description: "", categories: ["lieu_remarquable"], latitude: "", longitude: "", address: "", community_ids: [], photos: [], trek_details: {}, gpx_file: null });
      setMarkerPosition(null);
      setSearchAddress("");
      setNotifyCommunity(true); // Reset notification checkbox
      onSpotCreated();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du spot");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.community_ids.length === 0) {
      toast.error("Veuillez sélectionner au moins une communauté");
      return;
    }

    createMutation.mutate({
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    });
  };

  const handleCommunityToggle = (communityId) => {
    setFormData(prev => {
      const currentIds = prev.community_ids || [];
      if (currentIds.includes(communityId)) {
        return { ...prev, community_ids: currentIds.filter(id => id !== communityId) };
      } else {
        return { ...prev, community_ids: [...currentIds, communityId] };
      }
    });
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setIsGeolocating(false);
        toast.success("Position détectée !");
      },
      (error) => {
        setIsGeolocating(false);
        toast.error("Impossible d'obtenir votre position");
      }
    );
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) {
      toast.error("Veuillez saisir une adresse");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          address: result.display_name
        }));
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
        toast.success("Adresse trouvée !");
      } else {
        toast.error("Adresse introuvable");
      }
    } catch (error) {
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (latlng) => {
    setMarkerPosition([latlng.lat, latlng.lng]);
    setFormData(prev => ({
      ...prev,
      latitude: latlng.lat.toFixed(6),
      longitude: latlng.lng.toFixed(6)
    }));
  };

  const handleMarkerDrag = (e) => {
    const newPos = e.target.getLatLng();
    setMarkerPosition([newPos.lat, newPos.lng]);
    setFormData(prev => ({
      ...prev,
      latitude: newPos.lat.toFixed(6),
      longitude: newPos.lng.toFixed(6)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        toast.info(`Compression de ${file.name}...`);
        const compressedFile = await compressImage(file, 500);
        const originalSizeKB = (file.size / 1024).toFixed(0);
        const compressedSizeKB = (compressedFile.size / 1024).toFixed(0);
        
        const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
        uploadedUrls.push(file_url);
        toast.success(`${file.name} compressée (${originalSizeKB}KB → ${compressedSizeKB}KB)`);
      } catch (error) {
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...uploadedUrls]
    }));
    setUploadingImages(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.photos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({
      ...prev,
      photos: items
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[10000]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Ajouter un nouveau spot
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du spot *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Lac de montagne paisible"
                className="mt-1"
              />
            </div>

            <CategorySelect
              value={formData.categories}
              onChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
            />

            {isTrekCategory && (
              <TrekDetailsForm
                trekDetails={formData.trek_details}
                onTrekDetailsChange={(details) => setFormData(prev => ({ ...prev, trek_details: details }))}
                gpxFile={formData.gpx_file}
                onGpxFileChange={(file) => setFormData(prev => ({ ...prev, gpx_file: file }))}
              />
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez ce lieu, ses particularités, les activités possibles..."
                className="mt-1 h-24"
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Ex: 123 Rue de la Montagne, 73000 Chambéry"
                className="mt-1"
              />
            </div>

            <div>
              <Label>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  Communautés *
                </div>
              </Label>
              {communitiesLoading ? (
                <div className="text-sm text-gray-500">Chargement des communautés...</div>
              ) : (
                <>
                  <div className={`space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto ${
                    formData.community_ids.length === 0 && userCommunities.length > 0 ? 'border-red-300 bg-red-50/30' : ''
                  }`}>
                    {userCommunities.length === 0 ? (
                      <p className="text-sm text-red-600 font-medium">
                        Vous n'avez aucune communauté. Créez-en une dans la page Communautés pour pouvoir ajouter un spot.
                      </p>
                    ) : (
                      userCommunities.map(community => (
                        <div key={community.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`community-${community.id}`}
                            checked={formData.community_ids.includes(community.id)}
                            onCheckedChange={() => handleCommunityToggle(community.id)}
                          />
                          <label
                            htmlFor={`community-${community.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: community.color }}
                            />
                            {community.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {userCommunities.length > 0 && (
                    <p className={`text-xs mt-1 ${
                      formData.community_ids.length === 0 ? 'text-red-600 font-medium' : 'text-gray-500'
                    }`}>
                      {formData.community_ids.length === 0 
                        ? '⚠️ Veuillez sélectionner au moins une communauté'
                        : `${formData.community_ids.length} communauté(s) sélectionnée(s)`
                      }
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="mb-3 block">Localisation *</Label>
            <Tabs defaultValue="address" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="address">
                  <MapPin className="w-4 h-4 mr-2" />
                  Adresse
                </TabsTrigger>
                <TabsTrigger value="map">
                  <Map className="w-4 h-4 mr-2" />
                  Carte
                </TabsTrigger>
                <TabsTrigger value="gps">
                  <MapPin className="w-4 h-4 mr-2" />
                  GPS
                </TabsTrigger>
                <TabsTrigger value="geo">
                  <Navigation className="w-4 h-4 mr-2" />
                  Géoloc
                </TabsTrigger>
              </TabsList>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Ex: 10 rue de Paris, Lyon"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                  />
                  <Button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isSearching}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      "Rechercher"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Saisissez une adresse complète pour la localiser automatiquement
                </p>
                {formData.latitude && formData.longitude && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-900">Position trouvée</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {formData.latitude}, {formData.longitude}
                    </p>
                    {formData.address && (
                      <p className="text-xs text-emerald-600 mt-1">{formData.address}</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <div className="space-y-3">
                  <div className="h-64 rounded-lg overflow-hidden border border-emerald-200">
                    <MapContainer
                      center={mapCenter}
                      zoom={13}
                      className="h-full w-full"
                      zoomControl={true}
                    >
                      <TileLayer
                        url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiamx1YzI1IiwiYSI6ImNtaHc0ZGJ2ODAzZjMya3F3MHk5eGJhNGUifQ.NwNHaPaMFAeYg1ecORv2dA`}
                      />
                      <MapClickHandler onLocationSelect={handleMapClick} />
                      {markerPosition && (
                        <Marker 
                          position={markerPosition} 
                          icon={markerIcon}
                          draggable={true}
                          eventHandlers={{
                            dragend: handleMarkerDrag
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cliquez sur la carte pour positionner le spot, puis déplacez le marqueur pour ajuster
                  </p>
                  {formData.latitude && formData.longitude && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-sm font-medium text-emerald-900">Position sélectionnée</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        {formData.latitude}, {formData.longitude}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="gps" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, latitude: e.target.value }));
                        if (e.target.value && formData.longitude) {
                          setMarkerPosition([parseFloat(e.target.value), parseFloat(formData.longitude)]);
                        }
                      }}
                      placeholder="46.603354"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, longitude: e.target.value }));
                        if (formData.latitude && e.target.value) {
                          setMarkerPosition([parseFloat(formData.latitude), parseFloat(e.target.value)]);
                        }
                      }}
                      placeholder="1.888334"
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="geo" className="mt-4">
                <Button
                  type="button"
                  onClick={handleGeolocate}
                  disabled={isGeolocating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isGeolocating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Géolocalisation...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Détecter ma position
                    </>
                  )}
                </Button>
                {formData.latitude && formData.longitude && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-900">Position détectée</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {formData.latitude}, {formData.longitude}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Photos */}
          <div>
            <Label>Photos</Label>
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-2"
                  onClick={() => document.getElementById('photo-upload').click()}
                  disabled={uploadingImages}
                >
                  {uploadingImages ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Galerie
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-2"
                  onClick={() => document.getElementById('camera-upload').click()}
                  disabled={uploadingImages}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Appareil photo
                </Button>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <input
                id="camera-upload"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />

              {formData.photos.length > 0 && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="photos" direction="horizontal">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-3 gap-3"
                      >
                        {formData.photos.map((photo, index) => (
                          <Draggable key={photo} draggableId={photo} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group ${
                                  snapshot.isDragging ? 'z-50 rotate-3 scale-105' : ''
                                }`}
                              >
                                <img
                                  src={photo}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <div
                                  {...provided.dragHandleProps}
                                  className="absolute top-1 left-1 bg-emerald-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-3 h-3" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                {index === 0 && (
                                  <div className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded">
                                    Principale
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Notification Option */}
          <div className="flex items-center space-x-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <Checkbox
              id="notify-community"
              checked={notifyCommunity}
              onCheckedChange={setNotifyCommunity}
            />
            <label
              htmlFor="notify-community"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Avertir ma communauté par email (vous ne recevrez pas l'email)
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le spot"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
