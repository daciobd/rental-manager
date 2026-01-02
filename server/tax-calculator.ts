export interface TaxCalculation {
  grossIncome: number;
  rentIncome: number;
  reimbursements: number;
  taxableIncome: number;
  irRate: number;
  irDeduction: number;
  irValue: number;
  ivaIbsRate: number;
  ivaIbsValue: number;
  netIncome: number;
}

const IR_TABLE = [
  { limit: 2259.20, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 7.5, deduction: 169.44 },
  { limit: 3751.05, rate: 15, deduction: 381.44 },
  { limit: 4664.68, rate: 22.5, deduction: 662.77 },
  { limit: Infinity, rate: 27.5, deduction: 896.00 },
];

export function calculateTaxes(
  rentAmount: number,
  iptuAmount: number,
  condominiumAmount: number,
  iptuReimbursable: boolean,
  condominiumReimbursable: boolean,
  tenantType: string,
  ivaIbsSubject: boolean,
  ivaIbsRate: number
): TaxCalculation {
  
  const grossIncome = rentAmount + iptuAmount + condominiumAmount;
  
  const reimbursements = 
    (iptuReimbursable ? iptuAmount : 0) + 
    (condominiumReimbursable ? condominiumAmount : 0);
  
  const rentIncome = grossIncome - reimbursements;
  const taxableIncome = rentIncome * 0.80;
  
  let irRate = 0;
  let irDeduction = 0;
  let irValue = 0;
  
  if (tenantType === 'pf') {
    for (const bracket of IR_TABLE) {
      if (taxableIncome <= bracket.limit) {
        irRate = bracket.rate;
        irDeduction = bracket.deduction;
        break;
      }
    }
    irValue = (taxableIncome * irRate / 100) - irDeduction;
    irValue = Math.max(0, irValue);
  }
  
  let ivaIbsValue = 0;
  if (ivaIbsSubject && ivaIbsRate > 0) {
    ivaIbsValue = rentIncome * (ivaIbsRate / 100);
  }
  
  const netIncome = rentIncome - irValue - ivaIbsValue;
  
  return {
    grossIncome,
    rentIncome,
    reimbursements,
    taxableIncome,
    irRate,
    irDeduction,
    irValue,
    ivaIbsRate,
    ivaIbsValue,
    netIncome,
  };
}

export function calculatePaymentTaxes(payment: any, contract: any): TaxCalculation {
  return calculateTaxes(
    parseFloat(payment.rentAmount || payment.value || 0),
    parseFloat(payment.iptuAmount || 0),
    parseFloat(payment.condominiumAmount || 0),
    contract.iptuReimbursable || false,
    contract.condominiumReimbursable || false,
    contract.tenantType || 'pf',
    contract.ivaIbsSubject !== false,
    parseFloat(contract.ivaIbsRate || 0)
  );
}
