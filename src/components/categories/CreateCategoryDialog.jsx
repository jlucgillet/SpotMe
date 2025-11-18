import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, MapPin, Star, Tent, Mountain, Waves, Plane, Camera, Coffee, UtensilsCrossed, Hotel, Church, Trees, Compass, Wind, Palmtree, Flag, Landmark, Building, Castle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ICON_MAP = {
  MapPin, Star, Tent, Mountain, Waves, Plane, Camera, Coffee, UtensilsCrossed, 
  Hotel, Church, Trees, Compass, Wind, Palmtree, Flag, Landmark, Building, Castle
};

const COMMON_ICONS = Object.keys(ICON_MAP);

const PRESET_COLORS = [
  { from: "#f59e0b", to: "#ea580c", color: "text-orange-500", name: "Orange" },
  { from: "#10b981", to: "#059669", color: "text-emerald-500", name: "Vert" },
  { from: "#3b82f6", to: "#2563eb", color: "text-blue-500", name: "Bleu" },
  { from: "#0ea5e9", to: "#0284c7", color: "text-sky-500", name: "Cyan" },
  { from: "#8b5cf6", to: "#7c3aed", color: "text-violet-500", name: "Violet" },
  { from: "#ec4899", to: "#db2777", color: "text-pink-500", name: "Rose" },
  { from: "#ef4444", to: "#dc2626", color: "text-red-500", name: "Rouge" },
  { from: "#84cc16", to: "#65a30d", color: "text-lime-500", name: "Lime" },
];

export default function CreateCategoryDialog({ open, onOpenChange, onCategoryCreated }) {
  const [formData, setFormData] = useState({
    id_key: "",
    label: "",
    icon: "MapPin",
    color: "text-orange-500",
    gradient_from: "#f59e0b",
    gradient_to: "#ea580c",
    is_active: true
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      toast.success("Catégorie créée avec succès");
      setFormData({
        id_key: "",
        label: "",
        icon: "MapPin",
        color: "text-orange-500",
        gradient_from: "#f59e0b",
        gradient_to: "#ea580c",
        is_active: true
      });
      onCategoryCreated();
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.id_key || !formData.label) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleColorSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      color: preset.color,
      gradient_from: preset.from,
      gradient_to: preset.to
    }));
  };

  const SelectedIcon = ICON_MAP[formData.icon] || MapPin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Créer une nouvelle catégorie</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_key">Identifiant unique *</Label>
              <Input
                id="id_key"
                value={formData.id_key}
                onChange={(e) => setFormData(prev => ({ ...prev, id_key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="ex: camping_sauvage"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sera généré automatiquement en minuscules avec underscores
              </p>
            </div>

            <div>
              <Label htmlFor="label">Nom affiché *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="ex: Camping sauvage"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Icône</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COMMON_ICONS.map((iconName) => {
                  const IconComponent = ICON_MAP[iconName];
                  return (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {iconName}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4" />
              Couleur et gradient
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleColorSelect(preset)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.gradient_from === preset.from
                      ? "border-gray-900 scale-105"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div
                    className="w-full h-12 rounded-md mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`
                    }}
                  />
                  <p className="text-xs font-medium text-gray-700 text-center">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Aperçu</Label>
            <div className="mt-2 p-6 bg-gray-50 rounded-lg flex items-center justify-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${formData.gradient_from}, ${formData.gradient_to})`
                }}
              >
                <SelectedIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">{formData.label || "Nom de la catégorie"}</p>
                <p className="text-sm text-gray-500">{formData.id_key || "identifiant"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Catégorie active (visible dans l'application)
            </label>
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
                "Créer la catégorie"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}