import React, { useState } from "react";
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
import { Users, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PRESET_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", 
  "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"
];

export default function CreateCommunityDialog({ open, onOpenChange, onCommunityCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#10b981",
    member_emails: [],
    admin_emails: []
  });
  const [emailInput, setEmailInput] = useState("");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const community = await base44.entities.Community.create(data);
      
      // Créer une notification pour l'admin
      await base44.entities.Notification.create({
        type: "community",
        message: `${user?.email || 'Un utilisateur'} a créé la communauté "${data.name}"`,
        related_id: community.id,
        related_name: data.name
      });
      
      return community;
    },
    onSuccess: () => {
      toast.success("Communauté créée avec succès !");
      setFormData({ name: "", description: "", color: "#10b981", member_emails: [], admin_emails: [] });
      setEmailInput("");
      onCommunityCreated();
    },
    onError: () => {
      toast.error("Erreur lors de la création de la communauté");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Veuillez saisir un nom");
      return;
    }
    
    // Ajouter le créateur comme administrateur
    const dataToSubmit = {
      ...formData,
      admin_emails: [user.email, ...formData.admin_emails]
    };
    
    createMutation.mutate(dataToSubmit);
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email invalide");
      return;
    }

    if (formData.member_emails.includes(email)) {
      toast.error("Cet email est déjà ajouté");
      return;
    }

    setFormData(prev => ({
      ...prev,
      member_emails: [...prev.member_emails, email]
    }));
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setFormData(prev => ({
      ...prev,
      member_emails: prev.member_emails.filter(e => e !== email)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Créer une communauté
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nom de la communauté *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Famille Gillet, Copains, Collègues..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez cette communauté..."
              className="mt-1 h-20"
            />
          </div>

          <div>
            <Label>Couleur</Label>
            <div className="flex gap-2 mt-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Membres</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                placeholder="email@example.com"
              />
              <Button
                type="button"
                onClick={handleAddEmail}
                variant="outline"
              >
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vous serez automatiquement administrateur de cette communauté
            </p>
            {formData.member_emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.member_emails.map(email => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
              disabled={createMutation.isPending}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}