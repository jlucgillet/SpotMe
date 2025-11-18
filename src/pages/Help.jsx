import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Camera, Filter, Star, MessageCircle, Bell, Info, Edit, Plus, Trash2 } from "lucide-react";
import EditHelpDialog from "../components/help/EditHelpDialog";
import { toast } from "sonner";
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

const ICONS = {
  MapPin, Users, Camera, Filter, Star, MessageCircle, Bell, Info
};

export default function HelpPage() {
  const [editingSection, setEditingSection] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingSection, setDeletingSection] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['helpSections'],
    queryFn: () => base44.entities.HelpSection.list('order'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HelpSection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpSections'] });
      toast.success("Section supprimée");
      setDeletingSection(null);
    },
  });

  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16 md:mt-0">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 mt-16 md:mt-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-900">Guide d'utilisation</h1>
            </div>
            <p className="text-gray-600">
              Découvrez comment utiliser SpotMe pour partager et découvrir des lieux avec vos communautés
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingSection({ title: "", icon: "Info", content: "", order: sections.length });
                setShowEditDialog(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>

        {sections.length === 0 ? (
          <div className="text-center p-12">
            <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune section d'aide
            </h3>
            <p className="text-gray-600">
              {isAdmin ? "Ajoutez des sections pour créer le guide d'utilisation" : "Le guide sera bientôt disponible"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => {
              const IconComponent = ICONS[section.icon] || Info;
              return (
                <Card key={section.id} className="border-emerald-100 relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-emerald-600">
                        <IconComponent className="w-5 h-5" />
                        {section.title}
                      </CardTitle>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSection(section);
                              setShowEditDialog(true);
                            }}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSection(section)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
          <p className="text-center text-gray-700">
            <strong>Besoin d'aide supplémentaire ?</strong>
          </p>
          <p className="text-center text-gray-600 text-sm mt-2">
            N'hésitez pas à explorer l'application et à découvrir toutes ses fonctionnalités !
          </p>
        </div>
      </div>

      {/* Edit Dialog */}
      {showEditDialog && (
        <EditHelpDialog
          section={editingSection}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingSection} onOpenChange={() => setDeletingSection(null)}>
        <AlertDialogContent className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette section ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La section sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSection && deleteMutation.mutate(deletingSection.id)}
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