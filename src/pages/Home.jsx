
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MapPin, List, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SpotMap from "../components/spots/SpotMap";
import SpotsList from "../components/spots/SpotsList";
import SpotDetails from "../components/spots/SpotDetails";
import CreateSpotDialog from "../components/spots/CreateSpotDialog";

const SITE_ADMIN_EMAIL = "jluc.gillet@gmail.com";

export default function Home() {
  const [viewMode, setViewMode] = useState("map");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialCoordinates, setInitialCoordinates] = useState(null);
  
  // Filtres partagés
  const [selectedCategories, setSelectedCategories] = useState(["lieu_remarquable", "camping", "van_park", "parapente", "trek"]);
  const [selectedCommunities, setSelectedCommunities] = useState([]);

  const { data: spots = [], isLoading, refetch } = useQuery({
    queryKey: ['spots'],
    queryFn: () => base44.entities.Spot.list('-updated_date'),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-created_date'),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (error) {
        console.log("User not authenticated");
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  // Filtrer les communautés de l'utilisateur
  const userCommunities = communities.filter(community => {
    if (!user?.email) return false;
    if (user.email === SITE_ADMIN_EMAIL) return true;
    
    const isCreator = community.created_by === user.email;
    const isMember = community.member_emails && community.member_emails.includes(user.email);
    const isAdmin = community.admin_emails && community.admin_emails.includes(user.email);
    
    return isCreator || isMember || isAdmin;
  });

  // Initialiser les communautés sélectionnées
  useEffect(() => {
    if (userCommunities.length > 0 && selectedCommunities.length === 0) {
      setSelectedCommunities(userCommunities.map(c => c.id));
    }
  }, [userCommunities, selectedCommunities]);

  // Check URL parameters for spotId
  useEffect(() => {
    if (spots.length > 0 && !selectedSpot) {
      const urlParams = new URLSearchParams(window.location.search);
      const spotId = urlParams.get('spotId');
      if (spotId) {
        const spot = spots.find(s => s.id === spotId);
        if (spot) {
          setSelectedSpot(spot);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [spots, selectedSpot]);

  // Filtrer les spots selon les communautés de l'utilisateur
  const accessibleSpots = spots.filter(spot => {
    if (user?.email === SITE_ADMIN_EMAIL) return true;
    
    let spotCommunityIds = [];
    if (spot.community_ids && Array.isArray(spot.community_ids)) {
      spotCommunityIds = spot.community_ids;
    } else if (spot.community_id) {
      spotCommunityIds = [spot.community_id];
    }
    
    if (spotCommunityIds.length === 0) return false;
    if (!user?.email) return false;
    
    return spotCommunityIds.some(communityId => {
      const community = communities.find(c => c.id === communityId);
      if (!community) return false;
      
      const isCreator = community.created_by === user.email;
      const isMember = community.member_emails && community.member_emails.includes(user.email);
      const isAdmin = community.admin_emails && community.admin_emails.includes(user.email);
      
      return isCreator || isMember || isAdmin;
    });
  });

  // Appliquer les filtres (catégories et communautés)
  const filteredSpots = accessibleSpots.filter(spot => {
    // Filtre par catégorie
    const categories = spot.categories && Array.isArray(spot.categories) 
      ? spot.categories 
      : (spot.category ? [spot.category] : ["lieu_remarquable"]);
    const categoryMatch = categories.some(cat => selectedCategories.includes(cat));
    
    // Filtre par communauté
    let spotCommunityIds = [];
    if (spot.community_ids && Array.isArray(spot.community_ids)) {
      spotCommunityIds = spot.community_ids;
    } else if (spot.community_id) {
      spotCommunityIds = [spot.community_id];
    }
    const communityMatch = spotCommunityIds.some(id => selectedCommunities.includes(id));
    
    return categoryMatch && communityMatch;
  });

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
  };

  const handleCloseDetails = () => {
    setSelectedSpot(null);
  };

  const handleSpotCreated = () => {
    setShowCreateDialog(false);
    setInitialCoordinates(null);
    refetch();
  };

  const handleSpotDeleted = () => {
    setSelectedSpot(null);
    refetch();
  };

  const handleSpotUpdated = async () => {
    await refetch();
    if (selectedSpot) {
      const updatedSpot = spots.find(s => s.id === selectedSpot.id);
      if (updatedSpot) {
        setSelectedSpot(updatedSpot);
      }
    }
  };

  const handleCreateSpot = (coordinates = null) => {
    if (!user) {
      if (window.confirm("Vous devez être connecté pour créer un spot. Voulez-vous vous connecter maintenant ?")) {
        base44.auth.redirectToLogin();
      }
    } else {
      setInitialCoordinates(coordinates);
      setShowCreateDialog(true);
    }
  };

  const handleMapClick = (coordinates) => {
    if (user) {
      handleCreateSpot(coordinates);
    }
  };

  const findNearbySpots = (currentSpot) => {
    if (!currentSpot) return { prev: null, next: null };
    
    const distances = filteredSpots.map(spot => ({
      spot,
      distance: Math.sqrt(
        Math.pow(spot.latitude - currentSpot.latitude, 2) + 
        Math.pow(spot.longitude - currentSpot.longitude, 2)
      )
    }))
    .filter(item => item.spot.id !== currentSpot.id)
    .sort((a, b) => a.distance - b.distance);

    return {
      prev: distances[0]?.spot || null,
      next: distances[1]?.spot || null
    };
  };

  const navigateToSpot = (spot) => {
    setSelectedSpot(spot);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-full flex flex-col bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50 overflow-x-hidden">
      {/* Header with View Toggle */}
      {!isFullscreen && (
        <header className="bg-white/70 backdrop-blur-md border-b border-emerald-100/50 shadow-sm z-[9999] w-full max-w-full relative">
          <div className="w-full max-w-full px-3 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-shrink min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  SpotMe
                </h1>
              </div>
              
              {/* View Toggle */}
              <div className="ml-2">
                <div className="inline-flex bg-white/80 rounded-full p-0.5 shadow-sm border border-emerald-100">
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className={`h-7 text-xs px-2 ${viewMode === "map" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : ""}`}
                  >
                    <MapPin className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Carte</span>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`h-7 text-xs px-2 ${viewMode === "list" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : ""}`}
                  >
                    <List className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Liste</span>
                  </Button>
                </div>
              </div>
              
              {/* Bouton Ajouter */}
              <Button
                size="sm"
                onClick={() => handleCreateSpot()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md h-8 px-2 sm:px-4 ml-2"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden w-full">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <SpotMap
                spots={filteredSpots}
                isLoading={isLoading}
                onSpotClick={handleSpotClick}
                selectedSpot={selectedSpot}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                onCreateSpot={() => handleCreateSpot()}
                onMapClick={handleMapClick}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedCommunities={selectedCommunities}
                setSelectedCommunities={setSelectedCommunities}
                userCommunities={userCommunities}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-auto w-full"
            >
              <SpotsList
                spots={filteredSpots}
                isLoading={isLoading}
                onSpotClick={handleSpotClick}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedCommunities={selectedCommunities}
                setSelectedCommunities={setSelectedCommunities}
                userCommunities={userCommunities}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spot Details Sidebar */}
        <AnimatePresence>
          {selectedSpot && (
            <SpotDetails
              spot={selectedSpot}
              user={user}
              onClose={handleCloseDetails}
              onDelete={handleSpotDeleted}
              onUpdate={handleSpotUpdated}
              nearbySpots={findNearbySpots(selectedSpot)}
              onNavigateToSpot={navigateToSpot}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Create Spot Dialog */}
      {user && (
        <CreateSpotDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSpotCreated={handleSpotCreated}
          initialCoordinates={initialCoordinates}
        />
      )}
    </div>
  );
}
