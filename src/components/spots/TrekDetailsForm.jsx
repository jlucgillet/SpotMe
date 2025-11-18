import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

const ACTIVITY_TYPES = [
  "Randonnée", "Course", "Trail", "Ski", "Ski rando", "Ski de fond", 
  "Raquette", "Vélo", "VTT", "Marche et Vol", "Parapente", "Autre"
];

const DIFFICULTY_LEVELS = ["Facile", "Moyen", "Difficile"];

export default function TrekDetailsForm({ trekDetails, onTrekDetailsChange, gpxFile, onGpxFileChange }) {
  const [uploading, setUploading] = React.useState(false);

  const handleChange = (field, value) => {
    onTrekDetailsChange({
      ...trekDetails,
      [field]: value
    });
  };

  const handleGpxUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gpx')) {
      toast.error("Le fichier doit être au format GPX");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onGpxFileChange(file_url);
      toast.success("Fichier GPX uploadé avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'upload du fichier GPX");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-purple-50/50">
      <h3 className="font-semibold text-purple-900 flex items-center gap-2">
        <span>📊</span> Détails du Trek
      </h3>

      <div>
        <Label htmlFor="activity_type">Type d'activité</Label>
        <Select
          value={trekDetails?.activity_type || ""}
          onValueChange={(value) => handleChange("activity_type", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Sélectionnez un type d'activité" />
          </SelectTrigger>
          <SelectContent className="z-[10001]">
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="distance_km">Distance (km)</Label>
          <Input
            id="distance_km"
            type="number"
            step="0.1"
            value={trekDetails?.distance_km || ""}
            onChange={(e) => handleChange("distance_km", parseFloat(e.target.value))}
            placeholder="Ex: 12.5"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="elevation_gain">Dénivelé (m)</Label>
          <Input
            id="elevation_gain"
            type="number"
            value={trekDetails?.elevation_gain || ""}
            onChange={(e) => handleChange("elevation_gain", parseInt(e.target.value))}
            placeholder="Ex: 450"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Durée</Label>
          <Input
            id="duration"
            type="text"
            value={trekDetails?.duration || ""}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="Ex: 3h30"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulté</Label>
          <Select
            value={trekDetails?.difficulty || ""}
            onValueChange={(value) => handleChange("difficulty", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent className="z-[10001]">
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Parcours GPX</Label>
        <div className="mt-2">
          {gpxFile ? (
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200">
              <span className="text-sm flex-1 truncate">📁 Fichier GPX chargé</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onGpxFileChange(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-2 border-purple-300"
              onClick={() => document.getElementById('gpx-upload').click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Upload en cours..." : "Importer un fichier GPX"}
            </Button>
          )}
          <input
            id="gpx-upload"
            type="file"
            accept=".gpx"
            className="hidden"
            onChange={handleGpxUpload}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Importez un fichier GPX pour afficher le parcours sur la carte
        </p>
      </div>
    </div>
  );
}