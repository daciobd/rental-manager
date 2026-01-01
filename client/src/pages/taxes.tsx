import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatMonthYear, getCurrentMonth } from "@/lib/utils";
import { Calculator, AlertTriangle, FileText, TrendingUp, Percent } from "lucide-react";
import type { PaymentWithContract } from "@shared/schema";

// IRPF progressive tax table (2024)
const irpfTable = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
];

function calculateIRPF(monthlyIncome: number): { tax: number; effectiveRate: number; bracket: number } {
  let tax = 0;
  let bracket = 0;
  
  for (let i = 0; i < irpfTable.length; i++) {
    if (monthlyIncome <= irpfTable[i].limit) {
      tax = monthlyIncome * irpfTable[i].rate - irpfTable[i].deduction;
      bracket = irpfTable[i].rate * 100;
      break;
    }
  }
  
  tax = Math.max(0, tax);
  const effectiveRate = monthlyIncome > 0 ? (tax / monthlyIncome) * 100 : 0;
  
  return { tax, effectiveRate, bracket };
}

function TaxBracketCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  variant = "default" 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "warning" | "success";
}) {
  const bgVariants = {
    default: "bg-primary",
    warning: "bg-amber-500 dark:bg-amber-600",
    success: "bg-green-600 dark:bg-green-700",
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
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Taxes() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const { data: payments, isLoading } = useQuery<PaymentWithContract[]>({
    queryKey: ["/api/payments"],
  });

  // Filter paid payments for the selected year
  const yearPayments = payments?.filter((p) => {
    const paymentYear = p.referenceMonth?.split("-")[0];
    return p.paymentDate && paymentYear === selectedYear;
  }) || [];

  // Calculate totals by month
  const monthlyTotals = yearPayments.reduce((acc, payment) => {
    const month = payment.referenceMonth;
    if (!acc[month]) acc[month] = 0;
    acc[month] += parseFloat(payment.value.toString());
    return acc;
  }, {} as Record<string, number>);

  // Calculate annual total
  const annualTotal = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
  const averageMonthly = Object.keys(monthlyTotals).length > 0 
    ? annualTotal / Object.keys(monthlyTotals).length 
    : 0;

  // Calculate tax based on average monthly income
  const { tax: monthlyTax, effectiveRate, bracket } = calculateIRPF(averageMonthly);
  const annualTax = monthlyTax * 12;

  // Get months with payments for table
  const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Impostos</h1>
        <p className="text-muted-foreground">
          Cálculo estimado de IRPF sobre rendimentos de aluguéis
        </p>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="flex items-start gap-4 py-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-md flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
              Cálculo Estimativo
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Os valores apresentados são estimativas baseadas na tabela progressiva do IRPF. 
              Consulte um contador para cálculos precisos considerando deduções, outras rendas e situação fiscal específica.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-2">
          <Label>Ano</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" data-testid="select-tax-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <TaxBracketCard
              title="Receita Anual"
              value={formatCurrency(annualTotal)}
              subtitle={`${Object.keys(monthlyTotals).length} meses com receita`}
              icon={TrendingUp}
              variant="success"
            />
            <TaxBracketCard
              title="Média Mensal"
              value={formatCurrency(averageMonthly)}
              subtitle="Base para cálculo do IR"
              icon={Calculator}
            />
            <TaxBracketCard
              title="Faixa de IR"
              value={`${bracket}%`}
              subtitle={`Alíquota efetiva: ${effectiveRate.toFixed(1)}%`}
              icon={Percent}
              variant="warning"
            />
            <TaxBracketCard
              title="IR Estimado Anual"
              value={formatCurrency(annualTax)}
              subtitle={`~${formatCurrency(monthlyTax)}/mês`}
              icon={FileText}
              variant="warning"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabela Progressiva IRPF 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faixa</TableHead>
                      <TableHead className="text-right">Até</TableHead>
                      <TableHead className="text-right">Alíquota</TableHead>
                      <TableHead className="text-right">Dedução</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {irpfTable.map((bracket, index) => (
                      <TableRow 
                        key={index}
                        className={averageMonthly <= bracket.limit && (index === 0 || averageMonthly > irpfTable[index - 1].limit) 
                          ? "bg-primary/10" 
                          : ""
                        }
                      >
                        <TableCell className="font-medium">{index + 1}ª Faixa</TableCell>
                        <TableCell className="text-right">
                          {bracket.limit === Infinity ? "Acima" : formatCurrency(bracket.limit)}
                        </TableCell>
                        <TableCell className="text-right">{(bracket.rate * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(bracket.deduction)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receitas por Mês - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedMonths.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Valor Recebido</TableHead>
                        <TableHead className="text-right">IR Estimado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMonths.map((month) => {
                        const monthValue = monthlyTotals[month];
                        const { tax } = calculateIRPF(monthValue);
                        return (
                          <TableRow key={month}>
                            <TableCell className="font-medium">
                              {formatMonthYear(month)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(monthValue)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(tax)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(annualTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(annualTax)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum recebimento pago encontrado para {selectedYear}.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
