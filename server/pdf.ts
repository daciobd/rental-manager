import PDFDocument from "pdfkit";
import type { PaymentWithContract } from "../shared/schema";
import { calculatePaymentTaxes } from './tax-calculator';

export function generateReceipt(payment: PaymentWithContract): Buffer {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers: Buffer[] = [];
  
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  const contract = payment.contract!;
  const property = payment.property!;
  
  const taxes = calculatePaymentTaxes(payment, contract);
  const isPF = contract.tenantType === 'pf';
  
  doc.fontSize(20).font('Helvetica-Bold')
     .text('RECIBO DE ALUGUEL', { align: 'center' });
  
  doc.moveDown();
  doc.fontSize(10).font('Helvetica')
     .text(`Recibo Nº: ${payment.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' });
  
  doc.moveDown(2);
  
  doc.fontSize(12).font('Helvetica-Bold').text('LOCADOR (Quem recebe):');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Nome: ${property.owner}`);
  doc.text(`CPF/CNPJ: ${property.ownerDocument}`);
  
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('LOCATÁRIO (Quem paga):');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Nome: ${contract.tenant}`);
  doc.text(`CPF/CNPJ: ${contract.tenantDocument}`);
  doc.text(`Tipo: ${isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}`);
  if (contract.tenantEmail) doc.text(`Email: ${contract.tenantEmail}`);
  if (contract.tenantPhone) doc.text(`Telefone: ${contract.tenantPhone}`);
  
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('IMÓVEL:');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Endereço: ${property.address}`);
  
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('REFERENTE A:');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Período: ${payment.referenceMonth}`);
  doc.text(`Vencimento: ${new Date(payment.dueDate).toLocaleDateString('pt-BR')}`);
  doc.text(`Pagamento: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('pt-BR') : 'Não pago'}`);
  if (payment.paymentMethod) {
    doc.text(`Forma: ${payment.paymentMethod.toUpperCase()}`);
  }
  
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica-Bold').text('DISCRIMINAÇÃO DE VALORES:');
  doc.fontSize(10).font('Helvetica');
  
  const rentAmount = parseFloat(payment.rentAmount || payment.value || '0');
  const iptuAmount = parseFloat(payment.iptuAmount || '0');
  const condominiumAmount = parseFloat(payment.condominiumAmount || '0');
  const otherCharges = parseFloat(payment.otherCharges || '0');
  
  doc.text(`Aluguel: R$ ${rentAmount.toFixed(2).replace('.', ',')}`);
  
  if (iptuAmount > 0) {
    const label = contract.iptuReimbursable ? 'IPTU (Reembolso)' : 'IPTU';
    doc.text(`${label}: R$ ${iptuAmount.toFixed(2).replace('.', ',')}`);
  }
  
  if (condominiumAmount > 0) {
    const label = contract.condominiumReimbursable ? 'Condomínio (Reembolso)' : 'Condomínio';
    doc.text(`${label}: R$ ${condominiumAmount.toFixed(2).replace('.', ',')}`);
  }
  
  if (otherCharges > 0) {
    doc.text(`Outras Despesas: R$ ${otherCharges.toFixed(2).replace('.', ',')}`);
  }
  
  doc.moveDown();
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text(`VALOR TOTAL: R$ ${taxes.grossIncome.toFixed(2).replace('.', ',')}`, { underline: true });
  
  if (isPF || taxes.ivaIbsValue > 0) {
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text('INFORMAÇÕES TRIBUTÁRIAS:');
    doc.fontSize(10).font('Helvetica');
    
    if (taxes.reimbursements > 0) {
      doc.text(`Reembolsos (não tributáveis): R$ ${taxes.reimbursements.toFixed(2).replace('.', ',')}`);
      doc.text(`Renda de aluguel: R$ ${taxes.rentIncome.toFixed(2).replace('.', ',')}`);
    }
    
    if (isPF && taxes.irValue > 0) {
      doc.text(`Base de cálculo IR: R$ ${taxes.taxableIncome.toFixed(2).replace('.', ',')} (80%)`);
      doc.text(`Alíquota IR: ${taxes.irRate}%`);
      doc.text(`IR (Carnê-Leão): R$ ${taxes.irValue.toFixed(2).replace('.', ',')}`);
    }
    
    if (taxes.ivaIbsValue > 0) {
      doc.text(`IVA/IBS (${taxes.ivaIbsRate}%): R$ ${taxes.ivaIbsValue.toFixed(2).replace('.', ',')}`);
    }
    
    doc.moveDown();
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`VALOR LÍQUIDO: R$ ${taxes.netIncome.toFixed(2).replace('.', ',')}`, { underline: true });
  }
  
  if (payment.notes) {
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text('OBSERVAÇÕES:');
    doc.fontSize(10).font('Helvetica');
    doc.text(payment.notes);
  }
  
  doc.moveDown(3);
  doc.fontSize(8).font('Helvetica');
  doc.text('_'.repeat(100), { align: 'center' });
  doc.text('Assinatura do Locador', { align: 'center' });
  
  doc.moveDown();
  doc.fontSize(7).font('Helvetica-Oblique');
  doc.text('Recibo gerado automaticamente pelo Sistema de Gestão de Aluguéis', { align: 'center' });
  
  if (isPF) {
    doc.text('Carnê-Leão (IRPF) deve ser recolhido mensalmente', { align: 'center' });
  }
  
  if (taxes.ivaIbsValue > 0) {
    doc.text('IVA/IBS - Reforma Tributária (estimativa)', { align: 'center' });
  }
  
  doc.end();
  
  return Buffer.concat(buffers);
}
