
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  MapPin,
  Calendar,
  User,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
  Map,
  Maximize2,
  Play,
  Pause,
  Navigation,
  Users,
  Download,
  TrendingUp,
  Clock,
  Mountain,
  Activity,
  Gauge
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

import CommentSection from "./CommentSection";
import EditSpotDialog from "./EditSpotDialog";
import GpxTrackLayer from "./GpxTrackLayer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import CategoryIcon from "./CategoryIcon";

const markerIcon = new Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%2310b981' stroke='white' stroke-width='2'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3' fill='white'%3E%3C/circle%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function SpotDetails({ spot, user, onClose, onDelete, onUpdate, nearbySpots, onNavigateToSpot }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showMapFullscreen, setShowMapFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsPlaying(false);
  }, [spot.id]);

  useEffect(() => {
    if (isPlaying && spot.photos && spot.photos.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev === spot.photos.length - 1 ? 0 : prev + 1));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, spot.photos]);

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', spot.id],
    queryFn: () => base44.entities.Comment.filter({ spot_id: spot.id }, '-created_date'),
  });

  useEffect(() => {
    refetchComments();
  }, [spot.id, refetchComments]);

  const { data: community } = useQuery({
    queryKey: ['community', spot.community_id],
    queryFn: () => spot.community_id ? base44.entities.Community.filter({ id: spot.community_id }).then(data => data[0]) : null,
    enabled: !!spot.community_id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Spot.delete(spot.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spots'] });
      onDelete();
    },
  });

  const canEdit = user && (user.email === spot.created_by || user.role === 'admin');

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleUpdate = () => {
    setShowEditDialog(false);
    onUpdate();
  };

  const averageRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length).toFixed(1)
    : null;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? spot.photos.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === spot.photos.length - 1 ? 0 : prev + 1));
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    window.open(url, '_blank');
  };

  const handleDownloadGpx = () => {
    if (spot.gpx_file) {
      window.open(spot.gpx_file, '_blank');
    }
  };

  const getCategories = () => {
    if (spot.categories && Array.isArray(spot.categories) && spot.categories.length > 0) {
      return spot.categories;
    } else if (spot.category) {
      return [spot.category];
    }
    return ["lieu_remarquable"];
  };

  const categories = getCategories();
  const isTrek = categories.includes("trek");

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case "Facile": return "bg-green-500 text-white";
      case "Moyen": return "bg-orange-500 text-white";
      case "Difficile": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-[9999] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-10">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold text-gray-900">Détails du spot</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {spot.photos && spot.photos.length > 0 && (
          <div className="relative h-64 bg-gray-100 group">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={spot.photos[currentImageIndex]}
                alt={spot.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            
            <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handleNextImage}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => setShowFullscreen(true)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-white text-sm font-medium">
                  {currentImageIndex + 1} / {spot.photos.length}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <CategoryIcon category={categories[0]} size="lg" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{spot.name}</h1>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowEditDialog(true)}
                    className="border-emerald-200 hover:bg-emerald-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="border-red-200 hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {categories.map(category => (
                <CategoryIcon 
                  key={category}
                  category={category} 
                  size="sm" 
                  showLabel={true}
                />
              ))}
              
              {averageRating && (
                <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  <span className="font-semibold text-emerald-700">{averageRating}</span>
                  <span className="text-xs text-emerald-600">({comments.length})</span>
                </div>
              )}
              
              {community && (
                <div 
                  className="flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{ backgroundColor: community.color + '20' }}
                >
                  <Users 
                    className="w-4 h-4" 
                    style={{ color: community.color }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: community.color }}
                  >
                    {community.name}
                  </span>
                </div>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">
              {spot.description || "Aucune description disponible"}
            </p>
          </div>

          {isTrek && spot.trek_details && (
            <>
              <Separator />
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
                <CardHeader className="pb-3">
                  <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <Mountain className="w-5 h-5" />
                    Informations Trek
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {spot.trek_details.activity_type && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">Type d'activité</p>
                        <p className="text-sm font-bold text-gray-900">{spot.trek_details.activity_type}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {spot.trek_details.distance_km && (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="text-sm font-bold text-gray-900">{spot.trek_details.distance_km} km</p>
                        </div>
                      </div>
                    )}
                    
                    {spot.trek_details.elevation_gain && (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Dénivelé</p>
                          <p className="text-sm font-bold text-gray-900">{spot.trek_details.elevation_gain} m</p>
                        </div>
                      </div>
                    )}
                    
                    {spot.trek_details.duration && (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Durée</p>
                          <p className="text-sm font-bold text-gray-900">{spot.trek_details.duration}</p>
                        </div>
                      </div>
                    )}
                    
                    {spot.trek_details.difficulty && (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Gauge className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Difficulté</p>
                          <Badge className={getDifficultyColor(spot.trek_details.difficulty)}>
                            {spot.trek_details.difficulty}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {spot.gpx_file && (
                    <Button
                      onClick={handleDownloadGpx}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le fichier GPX
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <Separator />

          <div>
            <Button
              onClick={handleNavigate}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Navigation className="w-4 h-4 mr-2" />
              S'y rendre (Google Maps)
            </Button>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-600" />
                {isTrek && spot.gpx_file ? "Parcours" : "Localisation"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapFullscreen(true)}
                className="border-emerald-200 hover:bg-emerald-50"
              >
                <Maximize2 className="w-3 h-3 mr-2" />
                Agrandir
              </Button>
            </div>
            <div className="h-48 rounded-lg overflow-hidden border-2 border-emerald-100 shadow-md">
              <MapContainer
                key={spot.id}
                center={[spot.latitude, spot.longitude]}
                zoom={14}
                className="h-full w-full"
                zoomControl={true}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiamx1YzI1IiwiYSI6ImNtaHc0ZGJ2ODAzZjMya3F3MHk5eGJhNGUifQ.NwNHaPaMFAeYg1ecORv2dA`}
                />
                <Marker position={[spot.latitude, spot.longitude]} icon={markerIcon} />
                {isTrek && spot.gpx_file && (
                  <GpxTrackLayer gpxUrl={spot.gpx_file} />
                )}
              </MapContainer>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            {spot.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">Adresse</p>
                  <p className="text-gray-600">{spot.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">Coordonnées GPS</p>
                <p className="text-gray-600">{spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">Ajouté le</p>
                <p className="text-gray-600">
                  {format(new Date(spot.created_date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">Créé par</p>
                <p className="text-gray-600">{spot.created_by}</p>
              </div>
            </div>
          </div>

          <Separator />

          {(nearbySpots.prev || nearbySpots.next) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Spots à proximité
              </h3>
              <div className="flex gap-2">
                {nearbySpots.prev && (
                  <Button
                    variant="outline"
                    className="flex-1 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => onNavigateToSpot(nearbySpots.prev)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {nearbySpots.prev.name}
                  </Button>
                )}
                {nearbySpots.next && (
                  <Button
                    variant="outline"
                    className="flex-1 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => onNavigateToSpot(nearbySpots.next)}
                  >
                    {nearbySpots.next.name}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              Commentaires ({comments.length})
            </h3>
            <CommentSection spotId={spot.id} user={user} comments={comments} />
          </div>
        </div>
      </motion.div>

      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 bg-black/95 z-[99999]">
          <div className="relative h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={spot.photos?.[currentImageIndex]}
                alt={spot.name}
                className="max-h-full max-w-full object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {spot.photos && spot.photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-12 w-12"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-12 w-12"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/10 hover:bg-white/20 text-white"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <span className="text-white text-lg font-medium">
                  {currentImageIndex + 1} / {spot.photos?.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowFullscreen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {spot.photos && spot.photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
                  {spot.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-white scale-110"
                          : "border-white/30 opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMapFullscreen} onOpenChange={setShowMapFullscreen}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 z-[99999]">
          <div className="relative h-full">
            <MapContainer
              key={`fullscreen-map-${spot.id}`}
              center={[spot.latitude, spot.longitude]}
              zoom={14}
              className="h-full w-full"
              zoomControl={true}
              scrollWheelZoom={true}
            >
              <TileLayer
                url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiamx1YzI1IiwiYSI6ImNtaHc0ZGJ2ODAzZjMya3F3MHk5eGJhNGUifQ.NwNHaPaMFAeYg1ecORv2dA`}
              />
              <Marker position={[spot.latitude, spot.longitude]} icon={markerIcon} />
              {isTrek && spot.gpx_file && (
                <GpxTrackLayer gpxUrl={spot.gpx_file} />
              )}
            </MapContainer>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white shadow-md z-[1000]"
              onClick={() => setShowMapFullscreen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EditSpotDialog
        spot={spot}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSpotUpdated={handleUpdate}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[99999]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce spot ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le spot et tous ses commentaires seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
