import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

type PaymentStatus = "paid" | "pending" | "overdue";

interface StatusBadgeProps {
  status: PaymentStatus;
}

const statusConfig = {
  paid: {
    label: "Pago",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  overdue: {
    label: "Atrasado",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 font-medium ${config.className}`}
      data-testid={`badge-status-${status}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

type ContractStatus = "active" | "expired" | "cancelled";

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const contractStatusConfig = {
  active: {
    label: "Ativo",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  expired: {
    label: "Expirado",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = contractStatusConfig[status] || contractStatusConfig.active;

  return (
    <Badge 
      variant="outline" 
      className={`font-medium ${config.className}`}
      data-testid={`badge-contract-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
