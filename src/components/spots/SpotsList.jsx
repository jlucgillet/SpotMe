
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, User, Image as ImageIcon, Users, Eye, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CategoryIcon from "./CategoryIcon";
import { CATEGORIES } from "./CategorySelect";

export default function SpotsList({ 
  spots, 
  isLoading, 
  onSpotClick,
  selectedCategories,
  setSelectedCategories,
  selectedCommunities,
  setSelectedCommunities,
  userCommunities
}) {
  const { data: allCommunities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list(),
  });

  const getCommunities = (spot) => {
    let spotCommunityIds = [];
    if (spot.community_ids && Array.isArray(spot.community_ids)) {
      spotCommunityIds = spot.community_ids;
    } else if (spot.community_id) {
      spotCommunityIds = [spot.community_id];
    }
    
    return spotCommunityIds.map(id => allCommunities.find(c => c.id === id)).filter(Boolean);
  };

  const handleCategoryToggle = (categoryId) => {
    if (categoryId === "all") {
      setSelectedCategories(["lieu_remarquable", "camping", "van_park", "parapente", "trek"]);
    } else {
      setSelectedCategories(prev => {
        if (prev.includes(categoryId)) {
          const newCategories = prev.filter(id => id !== categoryId);
          return newCategories.length > 0 ? newCategories : prev;
        } else {
          return [...prev, categoryId];
        }
      });
    }
  };

  const handleCommunityToggle = (communityId) => {
    if (communityId === "all") {
      setSelectedCommunities(userCommunities.map(c => c.id));
    } else {
      setSelectedCommunities(prev => {
        if (prev.includes(communityId)) {
          const newCommunities = prev.filter(id => id !== communityId);
          return newCommunities.length > 0 ? newCommunities : prev;
        } else {
          return [...prev, communityId];
        }
      });
    }
  };

  const allCategoriesSelected = selectedCategories.length === 5;
  const allCommunitiesSelected = selectedCommunities.length === userCommunities.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des spots...</p>
        </div>
      </div>
    );
  }

  if (spots.length === 0 && allCategoriesSelected && allCommunitiesSelected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun spot pour le moment
          </h3>
          <p className="text-gray-600">
            Soyez le premier à ajouter un spot et partagez vos découvertes !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tous les spots
        </h2>
        <p className="text-gray-600">
          {spots.length} {spots.length > 1 ? 'lieux découverts' : 'lieu découvert'}
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-6 space-y-4">
        {/* Filtre par catégorie */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrer par catégorie</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={allCategoriesSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryToggle("all")}
              className={allCategoriesSelected ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Toutes
            </Button>
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(category.id)}
                  className={isSelected ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isSelected ? "text-white" : category.color}`} />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Filtre par communauté */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrer par communauté</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={allCommunitiesSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleCommunityToggle("all")}
              className={allCommunitiesSelected ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Toutes
            </Button>
            {userCommunities.map((community) => {
              const isSelected = selectedCommunities.includes(community.id);
              return (
                <Button
                  key={community.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCommunityToggle(community.id)}
                  className={isSelected ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: community.color }}
                  />
                  {community.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {spots.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun spot trouvé
            </h3>
            <p className="text-gray-600 text-sm">
              Essayez d'autres filtres pour voir plus de spots
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spots.map((spot, index) => {
            const spotCommunities = getCommunities(spot);
            const categories = spot.categories && Array.isArray(spot.categories) 
              ? spot.categories 
              : (spot.category ? [spot.category] : ["lieu_remarquable"]);
            
            return (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-emerald-100">
                  <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden group">
                    {spot.photos?.[0] ? (
                      <img
                        src={spot.photos[0]}
                        alt={spot.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-emerald-300" />
                      </div>
                    )}
                    
                    {/* Category Icons - Top Left */}
                    <div className="absolute top-3 left-3 flex gap-1">
                      {categories.slice(0, 2).map(category => (
                        <CategoryIcon key={category} category={category} size="md" />
                      ))}
                      {categories.length > 2 && (
                        <Badge className="bg-black/60 text-white border-0 text-xs">
                          +{categories.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    {spot.photos && spot.photos.length > 1 && (
                      <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0">
                        +{spot.photos.length - 1} photos
                      </Badge>
                    )}
                    {spotCommunities.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                        {spotCommunities.slice(0, 2).map(community => (
                          <Badge 
                            key={community.id}
                            className="border-0"
                            style={{ 
                              backgroundColor: community.color,
                              color: 'white'
                            }}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {community.name}
                          </Badge>
                        ))}
                        {spotCommunities.length > 2 && (
                          <Badge className="bg-black/60 text-white border-0">
                            +{spotCommunities.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {spot.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {spot.description || "Aucune description disponible"}
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      {spot.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span className="line-clamp-1">{spot.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Ajouté le {format(new Date(spot.created_date), "d MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>Par {spot.created_by}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => onSpotClick(spot)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
