import { db } from "./db";
import { users, properties, contracts, payments } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log("Verificando se já existem dados...");

  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Banco já possui dados. Pulando seed.");
    return;
  }

  console.log("Iniciando seed do banco de dados...");

  // 1. Criar usuário admin
  console.log("Criando usuário admin...");
  const hashedPassword = await hashPassword("admin123");
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin@gestao.com",
      password: hashedPassword,
    })
    .returning();

  console.log(`Usuário criado: ${adminUser.username}`);

  // 2. Criar imóveis
  console.log("Criando imóveis...");
  const propertiesData = [
    {
      address: "Rua Augusta, 1500, Apto 42 - Jardim Paulista, São Paulo/SP",
      type: "apartment",
      description: "Apartamento 2 quartos, 1 vaga",
      rentValue: "2500.00",
      owner: "Carlos Silva",
      ownerDocument: "123.456.789-00",
    },
    {
      address: "Rua Pamplona, 300 - Bela Vista, São Paulo/SP",
      type: "house",
      description: "Casa 3 quartos com quintal",
      rentValue: "3500.00",
      owner: "Maria Santos",
      ownerDocument: "987.654.321-00",
    },
    {
      address: "Av. Paulista, 1000, Loja 5 - Centro, São Paulo/SP",
      type: "commercial",
      description: "Loja comercial 80m²",
      rentValue: "5000.00",
      owner: "João Oliveira",
      ownerDocument: "456.789.123-00",
    },
    {
      address: "Rua da Consolação, 2800, Apto 101 - Consolação, São Paulo/SP",
      type: "apartment",
      description: "Apartamento 3 quartos, 2 vagas",
      rentValue: "3200.00",
      owner: "Ana Ferreira",
      ownerDocument: "321.654.987-00",
    },
    {
      address: "Praça da República, 50, Sala 302 - República, São Paulo/SP",
      type: "commercial",
      description: "Sala comercial 60m²",
      rentValue: "4200.00",
      owner: "Pedro Costa",
      ownerDocument: "654.321.987-00",
    },
  ];

  const createdProperties = await db.insert(properties).values(propertiesData).returning();
  console.log(`${createdProperties.length} imóveis criados`);

  // 3. Criar contratos
  console.log("Criando contratos...");
  const today = new Date();
  const year = today.getFullYear();
  
  const contractsData = [
    {
      propertyId: createdProperties[0].id,
      tenant: "Roberto Almeida",
      tenantDocument: "111.222.333-44",
      tenantEmail: "roberto@gmail.com",
      tenantPhone: "(11) 98111-2222",
      startDate: `${year}-01-01`,
      endDate: `${year + 1}-01-01`,
      rentValue: "2500.00",
      dueDay: 5,
      status: "active",
    },
    {
      propertyId: createdProperties[1].id,
      tenant: "Fernanda Lima",
      tenantDocument: "222.333.444-55",
      tenantEmail: "fernanda@hotmail.com",
      tenantPhone: "(11) 99222-3333",
      startDate: `${year}-01-15`,
      endDate: `${year + 2}-01-15`,
      rentValue: "3500.00",
      dueDay: 10,
      status: "active",
    },
    {
      propertyId: createdProperties[2].id,
      tenant: "Tech Solutions Ltda",
      tenantDocument: "12.345.678/0001-90",
      tenantEmail: "contato@techsolutions.com.br",
      tenantPhone: "(11) 3333-4444",
      startDate: `${year - 1}-07-01`,
      endDate: `${year + 1}-07-01`,
      rentValue: "5000.00",
      dueDay: 1,
      status: "active",
    },
    {
      propertyId: createdProperties[3].id,
      tenant: "Juliana Mendes",
      tenantDocument: "333.444.555-66",
      tenantEmail: "juliana.mendes@outlook.com",
      tenantPhone: "(11) 97333-4444",
      startDate: `${year}-02-01`,
      endDate: `${year + 1}-02-01`,
      rentValue: "3200.00",
      dueDay: 15,
      status: "active",
    },
    {
      propertyId: createdProperties[4].id,
      tenant: "Advocacia Martins & Associados",
      tenantDocument: "98.765.432/0001-10",
      tenantEmail: "contato@martinsadvocacia.com.br",
      tenantPhone: "(11) 3555-6666",
      startDate: `${year}-01-01`,
      endDate: `${year + 3}-01-01`,
      rentValue: "4200.00",
      dueDay: 20,
      status: "active",
    },
  ];

  const createdContracts = await db.insert(contracts).values(contractsData).returning();
  console.log(`${createdContracts.length} contratos criados`);

  // 4. Criar pagamentos
  console.log("Criando pagamentos...");

  const paymentsData: Array<{
    contractId: string;
    referenceMonth: string;
    value: string;
    dueDate: string;
    status: "paid" | "pending" | "overdue";
    paymentDate: string | null;
  }> = [];

  // Janeiro - todos pagos (primeiros 4 contratos)
  createdContracts.slice(0, 4).forEach((contract) => {
    paymentsData.push({
      contractId: contract.id,
      referenceMonth: `${year}-01`,
      value: contract.rentValue,
      dueDate: `${year}-01-${String(contract.dueDay).padStart(2, '0')}`,
      status: "paid",
      paymentDate: `${year}-01-${String(contract.dueDay).padStart(2, '0')}`,
    });
  });

  // Fevereiro - mix de status
  createdContracts.forEach((contract, idx) => {
    let status: "paid" | "pending" | "overdue" = "paid";
    let paymentDate: string | null = `${year}-02-${String(contract.dueDay).padStart(2, '0')}`;

    if (idx === 3) {
      status = "overdue";
      paymentDate = null;
    } else if (idx === 4) {
      status = "pending";
      paymentDate = null;
    }

    paymentsData.push({
      contractId: contract.id,
      referenceMonth: `${year}-02`,
      value: contract.rentValue,
      dueDate: `${year}-02-${String(Math.min(contract.dueDay, 28)).padStart(2, '0')}`,
      status,
      paymentDate,
    });
  });

  // Março - maioria pendente
  createdContracts.forEach((contract, idx) => {
    paymentsData.push({
      contractId: contract.id,
      referenceMonth: `${year}-03`,
      value: contract.rentValue,
      dueDate: `${year}-03-${String(contract.dueDay).padStart(2, '0')}`,
      status: idx === 0 ? "paid" : "pending",
      paymentDate: idx === 0 ? `${year}-03-${String(contract.dueDay).padStart(2, '0')}` : null,
    });
  });

  await db.insert(payments).values(paymentsData);
  console.log(`${paymentsData.length} pagamentos criados`);

  console.log("\n========================================");
  console.log("SEED CONCLUÍDO COM SUCESSO!");
  console.log("========================================");
  console.log("\nCredenciais de acesso:");
  console.log("  Usuário: admin@gestao.com");
  console.log("  Senha: admin123");
  console.log("\nDados criados:");
  console.log(`  - 1 usuário administrador`);
  console.log(`  - ${createdProperties.length} imóveis`);
  console.log(`  - ${createdContracts.length} contratos`);
  console.log(`  - ${paymentsData.length} pagamentos`);
  console.log("========================================\n");
}
