import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ICONS = [
  "MapPin", "Users", "Camera", "Filter", "Star", "MessageCircle", "Bell", "Info"
];

export default function EditHelpDialog({ section, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    title: "",
    icon: "Info",
    content: "",
    order: 0
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || "",
        icon: section.icon || "Info",
        content: section.content || "",
        order: section.order || 0
      });
    }
  }, [section]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.HelpSection.update(section.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpSections'] });
      toast.success("Section mise à jour !");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[10000]">
        <DialogHeader>
          <DialogTitle>Modifier la section</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Créer un spot"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="icon">Icône</Label>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map(icon => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="order">Ordre</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="content">Contenu * (HTML supporté)</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Écrivez le contenu de la section..."
              className="mt-1 h-64 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous pouvez utiliser du HTML basique : &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
            </p>
          </div>

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
              disabled={updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}