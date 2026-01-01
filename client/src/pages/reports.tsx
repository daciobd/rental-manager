import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency, formatDate, formatMonthYear, formatDocument } from "@/lib/utils";
import { Printer, FileText, Download, Receipt } from "lucide-react";
import type { PaymentWithContract } from "@shared/schema";

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

export default function Reports() {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");

  const { data: payments, isLoading } = useQuery<PaymentWithContract[]>({
    queryKey: ["/api/payments"],
  });

  const paidPayments = payments?.filter((p) => p.paymentDate) || [];
  const selectedPayment = paidPayments.find((p) => p.id === selectedPaymentId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere recibos e relatórios de pagamentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Gerador de Recibos
          </CardTitle>
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
    </div>
  );
}
