
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Edit, Trash2, Shield, Mail } from "lucide-react";
import { motion } from "framer-motion";
import CreateCommunityDialog from "../components/communities/CreateCommunityDialog";
import EditCommunityDialog from "../components/communities/EditCommunityDialog";
import SendEmailDialog from "../components/communities/SendEmailDialog";
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
import { toast } from "sonner";

const SITE_ADMIN_EMAIL = "jluc.gillet@gmail.com";

export default function CommunitiesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [deletingCommunity, setDeletingCommunity] = useState(null);
  const [emailingCommunity, setEmailingCommunity] = useState(null);
  const queryClient = useQueryClient();

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Community.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success("Communauté supprimée");
      setDeletingCommunity(null);
    },
  });

  const isAdmin = (community) => {
    if (!user?.email) return false;
    // L'admin du site peut administrer toutes les communautés
    if (user.email === SITE_ADMIN_EMAIL) return true;
    // Sinon, seul le créateur de la communauté peut l'administrer
    return community.created_by === user.email;
  };

  const handleCreateClick = () => {
    if (!user) {
      if (window.confirm("Vous devez être connecté pour créer une communauté. Voulez-vous vous connecter maintenant ?")) {
        base44.auth.redirectToLogin();
      }
    } else {
      setShowCreateDialog(true);
    }
  };

  // Filtrer les communautés - admin du site voit tout, autres voient leurs communautés
  const displayedCommunities = user?.email === SITE_ADMIN_EMAIL
    ? communities 
    : communities.filter(community => {
        if (!user?.email) return false;
        const isCreator = community.created_by === user.email;
        const isMember = community.member_emails && community.member_emails.includes(user.email);
        const isAdminUser = community.admin_emails && community.admin_emails.includes(user.email);
        return isCreator || isMember || isAdminUser;
      });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des communautés...</p>
        </div>
      </div>
    );
  }

  const isSiteAdmin = user?.email === SITE_ADMIN_EMAIL;

  return (
    <div className="min-h-screen p-4 md:p-8 mt-16 md:mt-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-600" />
              {isSiteAdmin ? 'Toutes les Communautés' : 'Mes Communautés'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSiteAdmin
                ? 'Gestion de toutes les communautés de la plateforme'
                : 'Créez et gérez vos groupes de partage de spots'}
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle communauté
          </Button>
        </div>

        {displayedCommunities.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune communauté pour le moment
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre première communauté pour commencer à partager des spots avec vos proches
            </p>
            <Button
              onClick={handleCreateClick}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer une communauté
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCommunities.map((community, index) => {
              const userIsAdmin = isAdmin(community);
              const memberCount = (community.member_emails?.length || 0) + (community.admin_emails?.length || 0);
              
              return (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2" style={{ borderColor: community.color + '40' }}>
                    <CardHeader 
                      className="pb-4"
                      style={{ 
                        background: `linear-gradient(135deg, ${community.color}15 0%, ${community.color}05 100%)`
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: community.color }}
                            />
                            {community.name}
                          </CardTitle>
                          {userIsAdmin && (
                            <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                              <Shield className="w-3 h-3 mr-1" />
                              {community.created_by === user?.email ? 'Créateur' : 'Administrateur'}
                            </Badge>
                          )}
                        </div>
                        {userIsAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEmailingCommunity(community)}
                              className="hover:bg-emerald-50"
                              title="Envoyer un email"
                            >
                              <Mail className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCommunity(community)}
                              className="hover:bg-white/50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingCommunity(community)}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {community.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {community.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>
                          {memberCount} {memberCount > 1 ? 'membres' : 'membre'}
                        </span>
                        {community.admin_emails && community.admin_emails.length > 0 && (
                          <>
                            <span>•</span>
                            <Shield className="w-4 h-4" />
                            <span>
                              {community.admin_emails.length} {community.admin_emails.length > 1 ? 'admins' : 'admin'}
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {user && (
        <CreateCommunityDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCommunityCreated={() => setShowCreateDialog(false)}
        />
      )}

      {editingCommunity && (
        <EditCommunityDialog
          community={editingCommunity}
          open={!!editingCommunity}
          onOpenChange={() => setEditingCommunity(null)}
          onCommunityUpdated={() => setEditingCommunity(null)}
        />
      )}

      {emailingCommunity && (
        <SendEmailDialog
          community={emailingCommunity}
          open={!!emailingCommunity}
          onOpenChange={() => setEmailingCommunity(null)}
        />
      )}

      <AlertDialog 
        open={!!deletingCommunity} 
        onOpenChange={() => setDeletingCommunity(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette communauté ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les spots associés à cette communauté resteront visibles mais ne seront plus liés à aucune communauté.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCommunity && deleteMutation.mutate(deletingCommunity.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
