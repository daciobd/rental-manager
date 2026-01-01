import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as fs from "fs";

const { Pool } = pg;

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [migrate] ${message}`);
}

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    log("DATABASE_URL não configurada, pulando migrations");
    return;
  }

  const migrationsFolder = "./migrations";
  
  if (!fs.existsSync(migrationsFolder)) {
    log("Pasta de migrations não encontrada, pulando migrations automáticas");
    log("Use 'npm run db:push' para sincronizar o schema manualmente");
    return;
  }

  const files = fs.readdirSync(migrationsFolder);
  if (files.length === 0) {
    log("Nenhuma migration encontrada, pulando migrations automáticas");
    log("Use 'npm run db:push' para sincronizar o schema manualmente");
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    log("Executando migrations do banco de dados...");
    await migrate(db, { migrationsFolder });
    log("Migrations executadas com sucesso!");
  } catch (error) {
    log(`Erro nas migrations: ${error}`);
    throw error;
  } finally {
    await pool.end();
  }
}
