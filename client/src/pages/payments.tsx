import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, formatMonthYear, getPaymentStatus } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  Receipt,
  Search,
} from "lucide-react";
import type { Payment, PaymentWithContract, ContractWithProperty, InsertPayment } from "@shared/schema";

const paymentFormSchema = z.object({
  contractId: z.string().min(1, "Selecione um contrato"),
  referenceMonth: z.string().min(1, "Mês de referência é obrigatório"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  paymentDate: z.string().optional(),
  value: z.string().min(1, "Valor é obrigatório"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

function PaymentCard({
  payment,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  payment: PaymentWithContract;
  onEdit: (payment: PaymentWithContract) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (payment: PaymentWithContract) => void;
}) {
  const status = getPaymentStatus(payment.dueDate, payment.paymentDate);
  const isPaid = status === "paid";

  return (
    <Card className="overflow-visible hover-elevate transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-lg" data-testid={`payment-month-${payment.id}`}>
            {formatMonthYear(payment.referenceMonth)}
          </CardTitle>
          <StatusBadge status={status} />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!isPaid && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkPaid(payment)}
              title="Marcar como pago"
              data-testid={`button-mark-paid-${payment.id}`}
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(payment)}
            data-testid={`button-edit-payment-${payment.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(payment.id)}
            data-testid={`button-delete-payment-${payment.id}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {payment.contract && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{payment.contract.tenant}</span>
          </div>
        )}
        {payment.property && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{payment.property.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>Vence: {formatDate(payment.dueDate)}</span>
        </div>
        {payment.paymentDate && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>Pago em: {formatDate(payment.paymentDate)}</span>
          </div>
        )}
        {payment.paymentMethod && (
          <div className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="capitalize">{payment.paymentMethod}</span>
          </div>
        )}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Valor</span>
            <span className="font-bold text-lg" data-testid={`payment-value-${payment.id}`}>
              {formatCurrency(payment.value)}
            </span>
          </div>
        </div>
        {payment.notes && (
          <p className="text-sm text-muted-foreground pt-2 border-t line-clamp-2">
            {payment.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentForm({
  payment,
  contracts,
  onSuccess,
  onCancel,
}: {
  payment?: PaymentWithContract;
  contracts: ContractWithProperty[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!payment;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      contractId: payment?.contractId || "",
      referenceMonth: payment?.referenceMonth || "",
      dueDate: payment?.dueDate || "",
      paymentDate: payment?.paymentDate || "",
      value: payment?.value?.toString() || "",
      paymentMethod: payment?.paymentMethod || "",
      notes: payment?.notes || "",
    },
  });

  const selectedContractId = form.watch("contractId");
  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const createMutation = useMutation({
    mutationFn: (data: InsertPayment) => apiRequest("POST", "/api/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Recebimento cadastrado com sucesso!" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar recebimento", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertPayment) =>
      apiRequest("PUT", `/api/payments/${payment?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Recebimento atualizado com sucesso!" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar recebimento", variant: "destructive" });
    },
  });

  function onSubmit(data: PaymentFormData) {
    const payload: InsertPayment = {
      ...data,
      paymentDate: data.paymentDate || null,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
      status: data.paymentDate ? "paid" : "pending",
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  const handleContractChange = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      form.setValue("value", contract.rentValue.toString());
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contractId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrato</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleContractChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-payment-contract">
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.tenant} - {contract.property?.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="referenceMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês de Referência</FormLabel>
                <FormControl>
                  <Input type="month" {...field} data-testid="input-payment-month" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-payment-due-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Pagamento (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-payment-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...field}
                    data-testid="input-payment-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anotações sobre o pagamento"
                  className="resize-none"
                  {...field}
                  data-testid="input-payment-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-payment">
            {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Payments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithContract | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [paymentToMarkPaid, setPaymentToMarkPaid] = useState<PaymentWithContract | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: payments, isLoading: paymentsLoading } = useQuery<PaymentWithContract[]>({
    queryKey: ["/api/payments"],
  });

  const { data: contracts } = useQuery<ContractWithProperty[]>({
    queryKey: ["/api/contracts"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Recebimento excluído com sucesso!" });
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir recebimento", variant: "destructive" });
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (payment: PaymentWithContract) =>
      apiRequest("PUT", `/api/payments/${payment.id}`, {
        ...payment,
        paymentDate: new Date().toISOString().split("T")[0],
        status: "paid",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Pagamento confirmado!" });
      setMarkPaidDialogOpen(false);
      setPaymentToMarkPaid(null);
    },
    onError: () => {
      toast({ title: "Erro ao confirmar pagamento", variant: "destructive" });
      setMarkPaidDialogOpen(false);
      setPaymentToMarkPaid(null);
    },
  });

  const handleEdit = (payment: PaymentWithContract) => {
    setEditingPayment(payment);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      deleteMutation.mutate(paymentToDelete);
    }
  };

  const handleMarkPaid = (payment: PaymentWithContract) => {
    setPaymentToMarkPaid(payment);
    setMarkPaidDialogOpen(true);
  };

  const confirmMarkPaid = () => {
    if (paymentToMarkPaid) {
      markPaidMutation.mutate(paymentToMarkPaid);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPayment(undefined);
  };

  const filteredPayments = payments?.filter(payment =>
    payment.contract?.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.property?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.referenceMonth.includes(searchTerm)
  );

  const hasPayments = filteredPayments && filteredPayments.length > 0;
  const activeContracts = contracts?.filter((c) => c.status === "active") || [];
  const hasActiveContracts = activeContracts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Recebimentos</h1>
          <p className="text-muted-foreground">
            Controle os pagamentos de aluguel
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!hasActiveContracts} data-testid="button-add-payment">
              <Plus className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Editar Recebimento" : "Novo Recebimento"}
              </DialogTitle>
            </DialogHeader>
            <PaymentForm
              payment={editingPayment}
              contracts={activeContracts}
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!hasActiveContracts && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-md">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Cadastre pelo menos um contrato ativo para registrar recebimentos.
            </p>
          </CardContent>
        </Card>
      )}

      {payments && payments.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por inquilino, endereço ou mês..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-payments"
          />
        </div>
      )}

      {paymentsLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasPayments ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkPaid={handleMarkPaid}
            />
          ))}
        </div>
      ) : payments && payments.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Tente buscar com outros termos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">Nenhum recebimento cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {hasActiveContracts
                ? "Comece registrando os pagamentos dos seus aluguéis."
                : "Primeiro cadastre contratos ativos para registrar recebimentos."}
            </p>
            {hasActiveContracts && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-payment">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Recebimento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-payment">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-payment"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar que este pagamento foi recebido? A data de pagamento será registrada como hoje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-mark-paid">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMarkPaid}
              className="bg-green-600 text-white hover:bg-green-700"
              data-testid="button-confirm-mark-paid"
            >
              {markPaidMutation.isPending ? "Confirmando..." : "Confirmar Pagamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
