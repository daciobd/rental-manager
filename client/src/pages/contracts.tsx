import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractStatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, formatDocument } from "@/lib/utils";
import { Plus, Pencil, Trash2, FileText, Calendar, User, Mail, Phone, MapPin } from "lucide-react";
import type { Contract, ContractWithProperty, Property, InsertContract } from "@shared/schema";

const contractFormSchema = z.object({
  propertyId: z.string().min(1, "Selecione um imóvel"),
  tenant: z.string().min(3, "Nome do inquilino é obrigatório"),
  tenantDocument: z.string().min(11, "CPF/CNPJ inválido"),
  tenantEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  tenantPhone: z.string().optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
  rentValue: z.string().min(1, "Valor do aluguel é obrigatório"),
  dueDay: z.string().min(1, "Dia de vencimento é obrigatório"),
  status: z.enum(["active", "expired", "cancelled"]).default("active"),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

function ContractCard({
  contract,
  onEdit,
  onDelete,
}: {
  contract: ContractWithProperty;
  onEdit: (contract: ContractWithProperty) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="overflow-visible hover-elevate transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="text-lg truncate" data-testid={`contract-tenant-${contract.id}`}>
            {contract.tenant}
          </CardTitle>
          <ContractStatusBadge status={contract.status as any} />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(contract)}
            data-testid={`button-edit-contract-${contract.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(contract.id)}
            data-testid={`button-delete-contract-${contract.id}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {contract.property && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{contract.property.address}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{formatDocument(contract.tenantDocument)}</span>
          </div>
          {contract.tenantPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{contract.tenantPhone}</span>
            </div>
          )}
        </div>
        {contract.tenantEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{contract.tenantEmail}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>
            {formatDate(contract.startDate)} até {formatDate(contract.endDate)}
          </span>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Vencimento: dia {contract.dueDay}
            </span>
            <span className="font-bold text-lg" data-testid={`contract-rent-${contract.id}`}>
              {formatCurrency(contract.rentValue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractForm({
  contract,
  properties,
  onSuccess,
  onCancel,
}: {
  contract?: ContractWithProperty;
  properties: Property[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!contract;

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      propertyId: contract?.propertyId || "",
      tenant: contract?.tenant || "",
      tenantDocument: contract?.tenantDocument || "",
      tenantEmail: contract?.tenantEmail || "",
      tenantPhone: contract?.tenantPhone || "",
      startDate: contract?.startDate || "",
      endDate: contract?.endDate || "",
      rentValue: contract?.rentValue?.toString() || "",
      dueDay: contract?.dueDay?.toString() || "5",
      status: (contract?.status as any) || "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContract) => apiRequest("POST", "/api/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contrato cadastrado com sucesso!" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar contrato", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertContract) =>
      apiRequest("PUT", `/api/contracts/${contract?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contrato atualizado com sucesso!" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar contrato", variant: "destructive" });
    },
  });

  function onSubmit(data: ContractFormData) {
    const payload: InsertContract = {
      ...data,
      tenantEmail: data.tenantEmail || null,
      tenantPhone: data.tenantPhone || null,
      dueDay: parseInt(data.dueDay),
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imóvel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-contract-property">
                    <SelectValue placeholder="Selecione um imóvel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.address}
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
            name="tenant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inquilino</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome completo"
                    {...field}
                    data-testid="input-contract-tenant"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenantDocument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    {...field}
                    data-testid="input-contract-document"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tenantEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    {...field}
                    data-testid="input-contract-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenantPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(00) 00000-0000"
                    {...field}
                    data-testid="input-contract-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-contract-start" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Término</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-contract-end" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="rentValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Aluguel</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...field}
                    data-testid="input-contract-rent"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de Vencimento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-contract-due-day">
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-contract-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-contract">
            {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Contracts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractWithProperty | undefined>();
  const { toast } = useToast();

  const { data: contracts, isLoading: contractsLoading } = useQuery<ContractWithProperty[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Contrato excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir contrato", variant: "destructive" });
    },
  });

  const handleEdit = (contract: ContractWithProperty) => {
    setEditingContract(contract);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contrato?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingContract(undefined);
  };

  const hasContracts = contracts && contracts.length > 0;
  const hasProperties = properties && properties.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie os contratos de aluguel
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!hasProperties} data-testid="button-add-contract">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContract ? "Editar Contrato" : "Novo Contrato"}
              </DialogTitle>
            </DialogHeader>
            <ContractForm
              contract={editingContract}
              properties={properties || []}
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!hasProperties && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-md">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Cadastre pelo menos um imóvel antes de criar contratos.
            </p>
          </CardContent>
        </Card>
      )}

      {contractsLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasContracts ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">Nenhum contrato cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {hasProperties
                ? "Comece adicionando seu primeiro contrato de aluguel."
                : "Primeiro cadastre um imóvel, depois crie contratos."}
            </p>
            {hasProperties && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-contract">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Contrato
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
