import PDFDocument from 'pdfkit';
import type { PaymentWithContract } from '@shared/schema';

export function generateReceipt(payment: PaymentWithContract): Buffer {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(20).font('Helvetica-Bold').text('RECIBO DE ALUGUEL', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('LOCADOR (Proprietário)', { underline: true });
  doc.font('Helvetica').text(payment.property?.owner || 'N/A');
  doc.text(`CPF/CNPJ: ${payment.property?.ownerDocument || 'N/A'}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('LOCATÁRIO (Inquilino)', { underline: true });
  doc.font('Helvetica').text(payment.contract?.tenant || 'N/A');
  doc.text(`CPF/CNPJ: ${payment.contract?.tenantDocument || 'N/A'}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('IMÓVEL', { underline: true });
  doc.font('Helvetica').text(payment.property?.address || 'N/A');
  doc.moveDown();

  doc.font('Helvetica-Bold').text('DADOS DO PAGAMENTO', { underline: true });
  doc.font('Helvetica');

  const refMonth = payment.referenceMonth || 'N/A';
  const [year, month] = refMonth.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = monthNames[parseInt(month, 10) - 1] || month;

  doc.text(`Mês de Referência: ${monthName}/${year}`);
  doc.text(`Valor: R$ ${formatCurrency(payment.value)}`);
  doc.text(`Data do Pagamento: ${formatDate(payment.paymentDate)}`);
  doc.text(`Forma de Pagamento: ${formatPaymentMethod(payment.paymentMethod)}`);
  doc.moveDown(2);

  const valueInWords = valueToWords(parseFloat(payment.value));
  doc.text(`Recebi(emos) a importância de ${valueInWords} referente ao aluguel do mês acima mencionado.`);
  doc.moveDown(2);

  doc.text(`Data de Emissão: ${formatDate(new Date().toISOString().split('T')[0])}`, { align: 'right' });
  doc.moveDown(3);

  doc.text('_________________________________________', { align: 'center' });
  doc.text('Assinatura do Locador', { align: 'center' });

  doc.end();

  return Buffer.concat(chunks);
}

function formatCurrency(value: string): string {
  const num = parseFloat(value);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatPaymentMethod(method: string | null | undefined): string {
  const methods: Record<string, string> = {
    pix: 'PIX',
    boleto: 'Boleto Bancário',
    transferencia: 'Transferência Bancária',
    dinheiro: 'Dinheiro',
  };
  return methods[method || ''] || method || 'N/A';
}

function valueToWords(value: number): string {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const intPart = Math.floor(value);
  const centsPart = Math.round((value - intPart) * 100);

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      return tens[t] + (u ? ' e ' + units[u] : '');
    }
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return hundreds[h] + (rest ? ' e ' + convertGroup(rest) : '');
  }

  function convertThousands(n: number): string {
    if (n === 0) return 'zero';
    if (n < 1000) return convertGroup(n);
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thousandWord = thousands === 1 ? 'mil' : convertGroup(thousands) + ' mil';
    return thousandWord + (rest ? ' ' + (rest < 100 ? 'e ' : '') + convertGroup(rest) : '');
  }

  let result = convertThousands(intPart) + ' reais';
  if (centsPart > 0) {
    result += ' e ' + convertGroup(centsPart) + (centsPart === 1 ? ' centavo' : ' centavos');
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}
