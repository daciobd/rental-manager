import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatMonthYear, formatDocument } from "@/lib/utils";
import { 
  Printer, 
  FileText, 
  Download, 
  Receipt, 
  BarChart3, 
  Building2, 
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  Users
} from "lucide-react";
import type { PaymentWithContract, Property, ContractWithProperty } from "@shared/schema";

function ReceiptPreview({ payment }: { payment: PaymentWithContract }) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Aluguel</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px;
              line-height: 1.6;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #333;
              padding: 40px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 { font-size: 2em; margin-bottom: 10px; }
            .body { font-size: 1.1em; }
            .body p { margin-bottom: 15px; }
            .highlight { 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .footer { 
              margin-top: 50px; 
              padding-top: 20px; 
              border-top: 1px solid #333;
            }
            .signature {
              margin-top: 60px;
              text-align: center;
              border-top: 1px solid #333;
              padding-top: 10px;
              max-width: 300px;
              margin-left: auto;
              margin-right: auto;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: none; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const rentValueFormatted = formatCurrency(payment.value);
  const rentValueWritten = numberToWords(parseFloat(payment.value.toString()));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handlePrint} data-testid="button-print-receipt">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Recibo
        </Button>
      </div>

      <div 
        ref={receiptRef}
        className="bg-white dark:bg-gray-900 p-8 border-2 border-foreground rounded-lg max-w-3xl mx-auto text-foreground"
      >
        <div className="text-center border-b-2 border-foreground pb-6 mb-8">
          <h1 className="text-3xl font-bold mb-2">RECIBO DE ALUGUEL</h1>
          <p className="text-lg">
            Referente a: {formatMonthYear(payment.referenceMonth)}
          </p>
        </div>

        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            Recebi de <strong>{payment.contract?.tenant}</strong>, 
            CPF/CNPJ: <strong>{formatDocument(payment.contract?.tenantDocument || "")}</strong>, 
            a importância de <strong>{rentValueFormatted}</strong> ({rentValueWritten}), 
            referente ao aluguel do imóvel situado à{" "}
            <strong>{payment.property?.address}</strong>, 
            com vencimento em <strong>{formatDate(payment.dueDate)}</strong>.
          </p>

          {payment.paymentDate && (
            <div className="bg-muted p-4 rounded-lg">
              <p>
                <strong>Data do Pagamento:</strong> {formatDate(payment.paymentDate)}
              </p>
              {payment.paymentMethod && (
                <p>
                  <strong>Forma de Pagamento:</strong>{" "}
                  <span className="capitalize">{payment.paymentMethod}</span>
                </p>
              )}
            </div>
          )}

          {payment.notes && (
            <p>
              <strong>Observações:</strong> {payment.notes}
            </p>
          )}

          <div className="pt-6 border-t">
            <p className="text-right">
              {payment.property?.owner && (
                <>Local: ___________________, {today}</>
              )}
            </p>
          </div>

          <div className="mt-16 text-center border-t pt-4 max-w-sm mx-auto">
            <p className="font-semibold">{payment.property?.owner}</p>
            <p className="text-sm text-muted-foreground">
              CPF/CNPJ: {formatDocument(payment.property?.ownerDocument || "")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Proprietário</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function numberToWords(num: number): string {
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  if (num === 0) return "zero reais";

  const intPart = Math.floor(num);
  const centsPart = Math.round((num - intPart) * 100);

  function convertHundreds(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    
    let result = "";
    
    if (n >= 100) {
      result += hundreds[Math.floor(n / 100)];
      n %= 100;
      if (n > 0) result += " e ";
    }
    
    if (n >= 10 && n < 20) {
      result += teens[n - 10];
    } else if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      if (n % 10 > 0) result += " e " + units[n % 10];
    } else if (n > 0) {
      result += units[n];
    }
    
    return result;
  }

  function convertThousands(n: number): string {
    if (n === 0) return "";
    if (n === 1000) return "mil";
    
    let result = "";
    
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands === 1) {
        result += "mil";
      } else {
        result += convertHundreds(thousands) + " mil";
      }
      n %= 1000;
      if (n > 0) {
        if (n < 100) result += " e ";
        else result += " ";
      }
    }
    
    result += convertHundreds(n);
    
    return result;
  }

  let result = "";
  
  if (intPart > 0) {
    result = convertThousands(intPart);
    result += intPart === 1 ? " real" : " reais";
  }

  if (centsPart > 0) {
    if (intPart > 0) result += " e ";
    result += convertHundreds(centsPart);
    result += centsPart === 1 ? " centavo" : " centavos";
  }

  return result;
}

function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
}

function getMonthName(month: number): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[month - 1] || "";
}

interface FinancialSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalAdminFees: number;
  netReceived: number;
  paymentCount: number;
  overdueCount: number;
  pendingCount: number;
}

function calculateFinancialSummary(
  payments: PaymentWithContract[],
  contracts: ContractWithProperty[],
  year: string,
  month: string,
  propertyId: string
): FinancialSummary {
  let filtered = payments;

  if (year && year !== "all") {
    filtered = filtered.filter(p => p.referenceMonth.startsWith(year));
  }

  if (month && month !== "all") {
    const monthStr = month.padStart(2, "0");
    filtered = filtered.filter(p => {
      const refMonth = p.referenceMonth.split("-")[1];
      return refMonth === monthStr;
    });
  }

  if (propertyId && propertyId !== "all") {
    filtered = filtered.filter(p => p.contract?.propertyId === propertyId);
  }

  const paidPayments = filtered.filter(p => p.status === "paid");
  const pendingPayments = filtered.filter(p => p.status === "pending");
  const overduePayments = filtered.filter(p => p.status === "overdue");

  const totalReceived = paidPayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
  const totalOverdue = overduePayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);

  let totalAdminFees = 0;
  paidPayments.forEach(payment => {
    const contract = contracts.find(c => c.id === payment.contractId);
    if (contract?.adminFeePercent) {
      const feePercent = parseFloat(contract.adminFeePercent);
      const paymentValue = parseFloat(payment.value.toString());
      totalAdminFees += (paymentValue * feePercent) / 100;
    }
  });

  return {
    totalReceived,
    totalPending,
    totalOverdue,
    totalAdminFees,
    netReceived: totalReceived - totalAdminFees,
    paymentCount: paidPayments.length,
    overdueCount: overduePayments.length,
    pendingCount: pendingPayments.length,
  };
}

interface PropertyReport {
  property: Property;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  adminFees: number;
  netReceived: number;
  occupancyRate: number;
  activeContracts: number;
}

function calculatePropertyReports(
  properties: Property[],
  contracts: ContractWithProperty[],
  payments: PaymentWithContract[],
  year: string
): PropertyReport[] {
  return properties.map(property => {
    const propertyContracts = contracts.filter(c => c.propertyId === property.id);
    const activeContracts = propertyContracts.filter(c => c.status === "active").length;

    let propertyPayments = payments.filter(p => p.contract?.propertyId === property.id);
    if (year && year !== "all") {
      propertyPayments = propertyPayments.filter(p => p.referenceMonth.startsWith(year));
    }

    const paidPayments = propertyPayments.filter(p => p.status === "paid");
    const pendingPayments = propertyPayments.filter(p => p.status === "pending");
    const overduePayments = propertyPayments.filter(p => p.status === "overdue");

    const totalReceived = paidPayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);

    let adminFees = 0;
    paidPayments.forEach(payment => {
      const contract = contracts.find(c => c.id === payment.contractId);
      if (contract?.adminFeePercent) {
        const feePercent = parseFloat(contract.adminFeePercent);
        const paymentValue = parseFloat(payment.value.toString());
        adminFees += (paymentValue * feePercent) / 100;
      }
    });

    const totalMonths = year && year !== "all" ? 12 : 36;
    const occupiedMonths = propertyPayments.length;
    const occupancyRate = totalMonths > 0 ? (occupiedMonths / totalMonths) * 100 : 0;

    return {
      property,
      totalReceived,
      totalPending,
      totalOverdue,
      adminFees,
      netReceived: totalReceived - adminFees,
      occupancyRate: Math.min(occupancyRate, 100),
      activeContracts,
    };
  });
}

function FinancialReportCard({ summary }: { summary: FinancialSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-received">
                {formatCurrency(summary.totalReceived)}
              </p>
              <p className="text-xs text-muted-foreground">{summary.paymentCount} pagamento(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-total-pending">
                {formatCurrency(summary.totalPending)}
              </p>
              <p className="text-xs text-muted-foreground">{summary.pendingCount} pagamento(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Atraso</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-overdue">
                {formatCurrency(summary.totalOverdue)}
              </p>
              <p className="text-xs text-muted-foreground">{summary.overdueCount} pagamento(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Percent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Líquido (após taxas)</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-net-received">
                {formatCurrency(summary.netReceived)}
              </p>
              <p className="text-xs text-muted-foreground">
                Taxa admin: {formatCurrency(summary.totalAdminFees)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PropertyReportTable({ reports }: { reports: PropertyReport[] }) {
  const sortedReports = [...reports].sort((a, b) => b.totalReceived - a.totalReceived);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium">Imóvel</th>
            <th className="text-right py-3 px-2 font-medium">Recebido</th>
            <th className="text-right py-3 px-2 font-medium">Taxa Admin</th>
            <th className="text-right py-3 px-2 font-medium">Líquido</th>
            <th className="text-right py-3 px-2 font-medium">Pendente</th>
            <th className="text-right py-3 px-2 font-medium">Atraso</th>
            <th className="text-center py-3 px-2 font-medium">Contratos</th>
          </tr>
        </thead>
        <tbody>
          {sortedReports.map((report) => (
            <tr key={report.property.id} className="border-b hover-elevate" data-testid={`row-property-${report.property.id}`}>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{report.property.address}</p>
                    <p className="text-xs text-muted-foreground">{report.property.owner}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-right">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {formatCurrency(report.totalReceived)}
                </span>
              </td>
              <td className="py-3 px-2 text-right text-muted-foreground">
                {formatCurrency(report.adminFees)}
              </td>
              <td className="py-3 px-2 text-right">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {formatCurrency(report.netReceived)}
                </span>
              </td>
              <td className="py-3 px-2 text-right">
                {report.totalPending > 0 ? (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(report.totalPending)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-3 px-2 text-right">
                {report.totalOverdue > 0 ? (
                  <span className="text-red-600 dark:text-red-400">
                    {formatCurrency(report.totalOverdue)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-3 px-2 text-center">
                {report.activeContracts > 0 ? (
                  <Badge variant="secondary">{report.activeContracts} ativo(s)</Badge>
                ) : (
                  <Badge variant="outline">Vago</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 font-medium">
            <td className="py-3 px-2">Total</td>
            <td className="py-3 px-2 text-right text-green-600 dark:text-green-400">
              {formatCurrency(sortedReports.reduce((sum, r) => sum + r.totalReceived, 0))}
            </td>
            <td className="py-3 px-2 text-right text-muted-foreground">
              {formatCurrency(sortedReports.reduce((sum, r) => sum + r.adminFees, 0))}
            </td>
            <td className="py-3 px-2 text-right text-blue-600 dark:text-blue-400">
              {formatCurrency(sortedReports.reduce((sum, r) => sum + r.netReceived, 0))}
            </td>
            <td className="py-3 px-2 text-right text-yellow-600 dark:text-yellow-400">
              {formatCurrency(sortedReports.reduce((sum, r) => sum + r.totalPending, 0))}
            </td>
            <td className="py-3 px-2 text-right text-red-600 dark:text-red-400">
              {formatCurrency(sortedReports.reduce((sum, r) => sum + r.totalOverdue, 0))}
            </td>
            <td className="py-3 px-2 text-center">
              {sortedReports.reduce((sum, r) => sum + r.activeContracts, 0)} total
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MonthlyBreakdown({ 
  payments, 
  contracts,
  year 
}: { 
  payments: PaymentWithContract[];
  contracts: ContractWithProperty[];
  year: string;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearPayments = year && year !== "all" 
    ? payments.filter(p => p.referenceMonth.startsWith(year))
    : payments;

  const monthlyData = months.map(month => {
    const monthStr = month.toString().padStart(2, "0");
    const monthPayments = yearPayments.filter(p => {
      const refMonth = p.referenceMonth.split("-")[1];
      return refMonth === monthStr;
    });

    const paidPayments = monthPayments.filter(p => p.status === "paid");
    const totalReceived = paidPayments.reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
    
    let adminFees = 0;
    paidPayments.forEach(payment => {
      const contract = contracts.find(c => c.id === payment.contractId);
      if (contract?.adminFeePercent) {
        const feePercent = parseFloat(contract.adminFeePercent);
        const paymentValue = parseFloat(payment.value.toString());
        adminFees += (paymentValue * feePercent) / 100;
      }
    });

    return {
      month,
      monthName: getMonthName(month),
      totalReceived,
      adminFees,
      netReceived: totalReceived - adminFees,
      paymentCount: paidPayments.length,
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-medium">Mês</th>
            <th className="text-right py-3 px-2 font-medium">Recebido</th>
            <th className="text-right py-3 px-2 font-medium">Taxa Admin</th>
            <th className="text-right py-3 px-2 font-medium">Líquido</th>
            <th className="text-center py-3 px-2 font-medium">Pagamentos</th>
          </tr>
        </thead>
        <tbody>
          {monthlyData.map((data) => (
            <tr key={data.month} className="border-b" data-testid={`row-month-${data.month}`}>
              <td className="py-3 px-2 font-medium">{data.monthName}</td>
              <td className="py-3 px-2 text-right">
                {data.totalReceived > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {formatCurrency(data.totalReceived)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-3 px-2 text-right text-muted-foreground">
                {data.adminFees > 0 ? formatCurrency(data.adminFees) : "-"}
              </td>
              <td className="py-3 px-2 text-right">
                {data.netReceived > 0 ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.netReceived)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="py-3 px-2 text-center">
                {data.paymentCount > 0 ? (
                  <Badge variant="secondary">{data.paymentCount}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 font-medium">
            <td className="py-3 px-2">Total Anual</td>
            <td className="py-3 px-2 text-right text-green-600 dark:text-green-400">
              {formatCurrency(monthlyData.reduce((sum, d) => sum + d.totalReceived, 0))}
            </td>
            <td className="py-3 px-2 text-right text-muted-foreground">
              {formatCurrency(monthlyData.reduce((sum, d) => sum + d.adminFees, 0))}
            </td>
            <td className="py-3 px-2 text-right text-blue-600 dark:text-blue-400">
              {formatCurrency(monthlyData.reduce((sum, d) => sum + d.netReceived, 0))}
            </td>
            <td className="py-3 px-2 text-center">
              {monthlyData.reduce((sum, d) => sum + d.paymentCount, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function Reports() {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterPropertyId, setFilterPropertyId] = useState<string>("all");

  const { data: payments, isLoading: paymentsLoading } = useQuery<PaymentWithContract[]>({
    queryKey: ["/api/payments"],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<ContractWithProperty[]>({
    queryKey: ["/api/contracts"],
  });

  const isLoading = paymentsLoading || propertiesLoading || contractsLoading;

  const paidPayments = payments?.filter((p) => p.paymentDate) || [];
  const selectedPayment = paidPayments.find((p) => p.id === selectedPaymentId);

  const availableYears = getAvailableYears();

  const financialSummary = payments && contracts
    ? calculateFinancialSummary(payments, contracts, filterYear, filterMonth, filterPropertyId)
    : null;

  const propertyReports = properties && contracts && payments
    ? calculatePropertyReports(properties, contracts, payments, filterYear)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Relatórios</h1>
        <p className="text-muted-foreground">
          Análise financeira, relatórios por imóvel e geração de recibos
        </p>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financial" data-testid="tab-financial">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumo Financeiro
          </TabsTrigger>
          <TabsTrigger value="properties" data-testid="tab-properties">
            <Building2 className="h-4 w-4 mr-2" />
            Por Imóvel
          </TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">
            <Calendar className="h-4 w-4 mr-2" />
            Mensal
          </TabsTrigger>
          <TabsTrigger value="receipts" data-testid="tab-receipts">
            <Receipt className="h-4 w-4 mr-2" />
            Recibos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
              <CardDescription>
                Visão geral das receitas e despesas do período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[120px]" data-testid="select-filter-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[140px]" data-testid="select-filter-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Imóvel</Label>
                  <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                    <SelectTrigger className="w-[200px]" data-testid="select-filter-property">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os imóveis</SelectItem>
                      {properties?.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address.substring(0, 30)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : financialSummary ? (
                <FinancialReportCard summary={financialSummary} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Relatório por Imóvel
              </CardTitle>
              <CardDescription>
                Análise detalhada de receitas e taxas por imóvel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[120px]" data-testid="select-property-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-64" />
              ) : propertyReports.length > 0 ? (
                <PropertyReportTable reports={propertyReports} />
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhum imóvel cadastrado</h3>
                  <p className="text-muted-foreground">
                    Cadastre imóveis para visualizar os relatórios.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Relatório Mensal
              </CardTitle>
              <CardDescription>
                Evolução mês a mês das receitas e taxas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[120px]" data-testid="select-monthly-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-64" />
              ) : payments && contracts ? (
                <MonthlyBreakdown 
                  payments={payments} 
                  contracts={contracts}
                  year={filterYear}
                />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Gerador de Recibos
              </CardTitle>
              <CardDescription>
                Gere e imprima recibos de pagamentos confirmados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : paidPayments.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Selecione um pagamento para gerar o recibo</Label>
                    <Select 
                      value={selectedPaymentId} 
                      onValueChange={setSelectedPaymentId}
                    >
                      <SelectTrigger data-testid="select-receipt-payment">
                        <SelectValue placeholder="Escolha um pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {paidPayments.map((payment) => (
                          <SelectItem key={payment.id} value={payment.id}>
                            {payment.contract?.tenant} - {formatMonthYear(payment.referenceMonth)} - {formatCurrency(payment.value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPayment && (
                    <ReceiptPreview payment={selectedPayment} />
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhum pagamento confirmado</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Para gerar recibos, primeiro registre e confirme os pagamentos 
                    na seção de Recebimentos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
