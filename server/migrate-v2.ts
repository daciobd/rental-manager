import { pool } from './db';

export async function runMigrationsV2() {
  console.log('[migrate-v2] 🔄 Iniciando atualização de schema...');
  
  try {
    await pool.query(`
      ALTER TABLE contracts 
      ADD COLUMN IF NOT EXISTS tenant_type TEXT DEFAULT 'pf',
      ADD COLUMN IF NOT EXISTS rent_base_value DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS iptu_value DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS condominium_value DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS iptu_reimbursable BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS condominium_reimbursable BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS iva_ibs_subject BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS iva_ibs_rate DECIMAL(5, 2) DEFAULT 0;
    `);
    console.log('[migrate-v2] ✅ Tabela contracts atualizada');

    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS rent_amount DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS iptu_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS condominium_amount DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS other_charges DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ir_value DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS iva_ibs_value DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS receipt_type TEXT DEFAULT 'rent';
    `);
    console.log('[migrate-v2] ✅ Tabela payments atualizada');

    await pool.query(`
      UPDATE contracts 
      SET rent_base_value = rent_value 
      WHERE rent_base_value IS NULL;
    `);
    console.log('[migrate-v2] ✅ Dados migrados');

    await pool.query(`
      UPDATE payments 
      SET rent_amount = value 
      WHERE rent_amount IS NULL;
    `);
    console.log('[migrate-v2] ✅ Pagamentos migrados');

    console.log('[migrate-v2] 🎉 Todas as atualizações concluídas!');
    
  } catch (error) {
    console.error('[migrate-v2] ❌ Erro:', error);
    throw error;
  }
}
