import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Building2, FileText, DollarSign, AlertCircle, Calendar } from "lucide-react";
import { formatCurrency, formatDate, getPaymentStatus } from "@/lib/utils";
import type { DashboardMetrics, PaymentWithContract } from "@shared/schema";

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  variant = "default"
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  loading: boolean;
  variant?: "default" | "success" | "warning";
}) {
  const bgVariants = {
    default: "bg-primary",
    success: "bg-green-600 dark:bg-green-700",
    warning: "bg-amber-500 dark:bg-amber-600",
  };

  return (
    <Card className="overflow-visible">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-md ${bgVariants[variant]}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingPaymentCard({ payment }: { payment: PaymentWithContract }) {
  const status = getPaymentStatus(payment.dueDate, payment.paymentDate);
  
  return (
    <Card className="overflow-visible hover-elevate active-elevate-2 cursor-pointer transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-semibold truncate" data-testid={`payment-tenant-${payment.id}`}>
              {payment.contract?.tenant || "Inquilino"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {payment.property?.address || "Endereço do imóvel"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="font-bold text-lg" data-testid={`payment-value-${payment.id}`}>
              {formatCurrency(payment.value)}
            </span>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Vence: {formatDate(payment.dueDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard"],
  });

  const hasUpcomingPayments = metrics?.upcomingPayments && metrics.upcomingPayments.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu portfólio de aluguéis
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Imóveis"
          value={metrics?.totalProperties ?? 0}
          icon={Building2}
          loading={isLoading}
        />
        <MetricCard
          title="Contratos Ativos"
          value={metrics?.activeContracts ?? 0}
          icon={FileText}
          loading={isLoading}
        />
        <MetricCard
          title="Recebido no Mês"
          value={formatCurrency(metrics?.receivedThisMonth ?? 0)}
          icon={DollarSign}
          loading={isLoading}
          variant="success"
        />
        <MetricCard
          title="Pendente no Mês"
          value={formatCurrency(metrics?.pendingThisMonth ?? 0)}
          icon={AlertCircle}
          loading={isLoading}
          variant="warning"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Próximos Vencimentos</h2>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasUpcomingPayments ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {metrics.upcomingPayments.map((payment) => (
              <UpcomingPaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhum vencimento próximo</h3>
              <p className="text-muted-foreground">
                Não há pagamentos pendentes nos próximos dias.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
