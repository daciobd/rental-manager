import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
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
import { Building2, FileText, DollarSign, AlertCircle, Calendar, Download, TrendingUp, Database, Bell, BellRing, Save } from "lucide-react";
import { formatCurrency, formatDate, getPaymentStatus } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

type ChartData = { month: string; received: number; pending: number };

function NotificationBanner({ payments }: { payments: PaymentWithContract[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  // Helper to parse date as local (avoid timezone issues with YYYY-MM-DD format)
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  const getTodayLocal = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  
  const overduePayments = payments.filter(p => {
    if (dismissed.includes(p.id)) return false;
    if (p.paymentDate) return false;
    const dueDate = parseLocalDate(p.dueDate);
    const today = getTodayLocal();
    return dueDate < today;
  });
  
  const dueSoonPayments = payments.filter(p => {
    if (dismissed.includes(p.id)) return false;
    if (p.paymentDate) return false;
    const dueDate = parseLocalDate(p.dueDate);
    const today = getTodayLocal();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return dueDate >= today && dueDate <= threeDaysLater;
  });
  
  if (overduePayments.length === 0 && dueSoonPayments.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {overduePayments.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">
                  {overduePayments.length} pagamento{overduePayments.length > 1 ? 's' : ''} em atraso!
                </p>
                <p className="text-sm text-muted-foreground">
                  {overduePayments.map(p => p.contract?.tenant).join(", ")}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(prev => [...prev, ...overduePayments.map(p => p.id)])}
              >
                Dispensar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {dueSoonPayments.length > 0 && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-600 dark:text-amber-500">
                  {dueSoonPayments.length} pagamento{dueSoonPayments.length > 1 ? 's' : ''} vence{dueSoonPayments.length > 1 ? 'm' : ''} em breve
                </p>
                <p className="text-sm text-muted-foreground">
                  {dueSoonPayments.map(p => `${p.contract?.tenant} (${formatDate(p.dueDate)})`).join(", ")}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(prev => [...prev, ...dueSoonPayments.map(p => p.id)])}
              >
                Dispensar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard"],
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData[]>({
    queryKey: ["/api/charts/monthly-revenue"],
  });

  const demoDataMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/demo-data"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/charts/monthly-revenue"] });
      toast({
        title: "Dados carregados",
        description: "Dados de demonstração foram adicionados com sucesso!",
      });
      setShowDemoDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de demonstração.",
        variant: "destructive",
      });
    }
  });

  const hasUpcomingPayments = metrics?.upcomingPayments && metrics.upcomingPayments.length > 0;
  const hasChartData = chartData && chartData.some(d => d.received > 0 || d.pending > 0);
  const hasNoData = !isLoading && metrics?.totalProperties === 0;

  const handleExportPayments = () => {
    window.open("/api/export/payments", "_blank");
  };

  const handleExportBackup = () => {
    window.open("/api/export/backup", "_blank");
    toast({
      title: "Backup iniciado",
      description: "O arquivo de backup está sendo baixado.",
    });
  };

  // Auto-save reminder - shows toast every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (metrics && metrics.totalProperties > 0) {
        toast({
          title: "Lembrete de backup",
          description: "Recomendamos fazer backup dos seus dados regularmente.",
          action: (
            <Button variant="outline" size="sm" onClick={handleExportBackup}>
              <Save className="h-4 w-4 mr-1" />
              Baixar
            </Button>
          ),
        });
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu portfólio de aluguéis
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasNoData && (
            <Button variant="default" onClick={() => setShowDemoDialog(true)} data-testid="button-load-demo">
              <Database className="h-4 w-4 mr-2" />
              Carregar Dados Demo
            </Button>
          )}
          <Button variant="outline" onClick={handleExportBackup} data-testid="button-backup">
            <Save className="h-4 w-4 mr-2" />
            Backup
          </Button>
          <Button variant="outline" onClick={handleExportPayments} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Notification banners */}
      {hasUpcomingPayments && metrics?.upcomingPayments && (
        <NotificationBanner payments={metrics.upcomingPayments} />
      )}

      {/* Demo data confirmation dialog */}
      <AlertDialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Carregar dados de demonstração?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá adicionar 3 imóveis, 3 contratos e 9 pagamentos de exemplo ao sistema.
              Você pode excluir esses dados depois se desejar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => demoDataMutation.mutate()}
              disabled={demoDataMutation.isPending}
            >
              {demoDataMutation.isPending ? "Carregando..." : "Carregar Dados"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          title="Recebido (Bruto)"
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

      {metrics && (metrics.netReceivedThisMonth !== undefined || metrics.adminFeesThisMonth !== undefined) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Taxa Administração"
            value={formatCurrency(metrics?.adminFeesThisMonth ?? 0)}
            icon={FileText}
            loading={isLoading}
          />
          <MetricCard
            title="Recebido (Líquido)"
            value={formatCurrency(metrics?.netReceivedThisMonth ?? 0)}
            icon={TrendingUp}
            loading={isLoading}
            variant="success"
          />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Receitas Mensais
        </h2>
        <Card>
          <CardContent className="p-4">
            {chartLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : hasChartData ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="received" name="Recebido" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pendente" fill="hsl(47.9 95.8% 53.1%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Sem dados para exibir</h3>
                <p className="text-muted-foreground">
                  Adicione pagamentos para visualizar o gráfico.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
