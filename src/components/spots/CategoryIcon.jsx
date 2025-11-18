import React from "react";
import { Star, Tent, Truck, Wind, User } from "lucide-react";

const CATEGORY_CONFIG = {
  lieu_remarquable: {
    icon: Star,
    label: "Lieu remarquable",
    color: "text-amber-600",
    bg: "bg-gradient-to-br from-amber-400 to-orange-500"
  },
  camping: {
    icon: Tent,
    label: "Camping",
    color: "text-emerald-600",
    bg: "bg-gradient-to-br from-emerald-400 to-teal-500"
  },
  van_park: {
    icon: Truck,
    label: "Van Park",
    color: "text-blue-600",
    bg: "bg-gradient-to-br from-blue-400 to-indigo-500"
  },
  parapente: {
    icon: Wind,
    label: "Parapente",
    color: "text-sky-600",
    bg: "bg-gradient-to-br from-sky-400 to-cyan-500"
  },
  trek: {
    icon: User,
    label: "Trek",
    color: "text-purple-600",
    bg: "bg-gradient-to-br from-purple-400 to-violet-500"
  }
};

export default function CategoryIcon({ category, size = "md", showLabel = false }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.lieu_remarquable;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${config.bg} rounded-full flex items-center justify-center shadow-md`}>
        <Icon className={`${iconSizes[size]} text-white`} />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}