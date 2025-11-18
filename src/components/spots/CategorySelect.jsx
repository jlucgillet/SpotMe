import React from "react";
import { Label } from "@/components/ui/label";
import { Star, Tent, Truck, Bird, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const CATEGORIES = [
  { id: "lieu_remarquable", label: "Lieu remarquable", icon: Star, color: "text-amber-500" },
  { id: "camping", label: "Camping", icon: Tent, color: "text-emerald-500" },
  { id: "van_park", label: "Van Park", icon: Truck, color: "text-blue-500" },
  { id: "parapente", label: "Parapente", icon: Bird, color: "text-sky-500" },
  { id: "trek", label: "Trek", icon: User, color: "text-purple-500" }
];

export default function CategorySelect({ value = [], onChange }) {
  const handleToggle = (categoryId) => {
    const currentValues = Array.isArray(value) ? value : [value];
    if (currentValues.includes(categoryId)) {
      onChange(currentValues.filter(id => id !== categoryId));
    } else {
      onChange([...currentValues, categoryId]);
    }
  };

  return (
    <div>
      <Label>Catégories *</Label>
      <div className="mt-2 space-y-2 border rounded-md p-3">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = Array.isArray(value) ? value.includes(category.id) : value === category.id;
          return (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={isSelected}
                onCheckedChange={() => handleToggle(category.id)}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Icon className={`w-4 h-4 ${category.color}`} />
                {category.label}
              </label>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Sélectionnez une ou plusieurs catégories
      </p>
    </div>
  );
}