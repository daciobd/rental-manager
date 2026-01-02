import { pool } from "./db";

export async function runMigrations() {
  console.log("[migrate] Iniciando criação de tabelas...");

  try {
    // Criar tabela users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    console.log("[migrate] ✅ Tabela users criada");

    // Criar tabela properties
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        address TEXT NOT NULL,
        type TEXT NOT NULL,
        owner TEXT NOT NULL,
        owner_document TEXT NOT NULL,
        rent_value DECIMAL(10, 2) NOT NULL,
        description TEXT
      );
    `);
    console.log("[migrate] ✅ Tabela properties criada");

    // Criar tabela contracts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id VARCHAR NOT NULL,
        tenant TEXT NOT NULL,
        tenant_document TEXT NOT NULL,
        tenant_email TEXT,
        tenant_phone TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        rent_value DECIMAL(10, 2) NOT NULL,
        due_day INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      );
    `);
    console.log("[migrate] ✅ Tabela contracts criada");

    // Criar tabela payments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id VARCHAR NOT NULL,
        reference_month TEXT NOT NULL,
        due_date TEXT NOT NULL,
        payment_date TEXT,
        value DECIMAL(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        notes TEXT
      );
    `);
    console.log("[migrate] ✅ Tabela payments criada");

    // Criar tabela de sessões
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    console.log("[migrate] ✅ Tabela user_sessions criada");

    // Criar índice
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON user_sessions (expire);
    `);
    console.log("[migrate] ✅ Índice criado");

    console.log("[migrate] 🎉 Todas as tabelas criadas com sucesso!");
  } catch (error) {
    console.error("[migrate] ❌ Erro ao criar tabelas:", error);
    throw error;
  }
}
