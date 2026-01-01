import { Badge } from "@/components/ui/badge";
import { Building2, Home, Store, MapPin } from "lucide-react";

type PropertyType = "apartamento" | "casa" | "comercial" | "terreno";

interface PropertyTypeBadgeProps {
  type: PropertyType;
}

const typeConfig = {
  apartamento: {
    label: "Apartamento",
    icon: Building2,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  casa: {
    label: "Casa",
    icon: Home,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  comercial: {
    label: "Comercial",
    icon: Store,
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  terreno: {
    label: "Terreno",
    icon: MapPin,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
};

export function PropertyTypeBadge({ type }: PropertyTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.casa;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 font-medium ${config.className}`}
      data-testid={`badge-property-type-${type}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
