import { pool } from "./db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // Verificar se já existe dados
    const userCheck = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log("⚠️  Banco já possui dados. Pulando seed.");
      return;
    }

    // 1. Criar usuário admin
    const hashedPassword = await hashPassword("admin123");
    await pool.query(
      `
      INSERT INTO users (username, password)
      VALUES ('admin@gestao.com', $1)
    `,
      [hashedPassword],
    );
    console.log("✅ Usuário admin criado");

    // 2. Criar imóveis
    const properties = [
      {
        address:
          "Rua das Flores, 123 - Apto 501 - Jardim Paulista, São Paulo/SP",
        type: "apartamento",
        owner: "João da Silva Santos",
        ownerDocument: "123.456.789-00",
        rentValue: "2500.00",
        description:
          "Apartamento 2 quartos, 1 suíte, 1 vaga de garagem, próximo ao metrô",
      },
      {
        address: "Av. Paulista, 1000 - Casa 3 - Bela Vista, São Paulo/SP",
        type: "casa",
        owner: "Maria Aparecida Santos",
        ownerDocument: "987.654.321-00",
        rentValue: "3500.00",
        description: "Casa 3 quartos, 2 vagas, churrasqueira, quintal",
      },
      {
        address: "Rua do Comércio, 500 - Loja 1 - Centro, São Paulo/SP",
        type: "comercial",
        owner: "Empresa XYZ Empreendimentos LTDA",
        ownerDocument: "12.345.678/0001-90",
        rentValue: "5000.00",
        description: "Loja comercial 80m², 2 banheiros, copa, estacionamento",
      },
      {
        address: "Rua Augusta, 250 - Apto 302 - Consolação, São Paulo/SP",
        type: "apartamento",
        owner: "Carlos Eduardo Lima",
        ownerDocument: "456.789.123-00",
        rentValue: "3200.00",
        description: "Apartamento 3 quartos, 2 vagas, varanda gourmet",
      },
      {
        address: "Av. Ipiranga, 800 - Sala 15 - República, São Paulo/SP",
        type: "comercial",
        owner: "Tech Investimentos S.A.",
        ownerDocument: "98.765.432/0001-10",
        rentValue: "4200.00",
        description: "Sala comercial 60m², 2 salas, recepção, copa",
      },
    ];

    const propertyIds = [];
    for (const prop of properties) {
      const result = await pool.query(
        `
        INSERT INTO properties (address, type, owner, owner_document, rent_value, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
        [
          prop.address,
          prop.type,
          prop.owner,
          prop.ownerDocument,
          prop.rentValue,
          prop.description,
        ],
      );
      propertyIds.push(result.rows[0].id);
    }
    console.log(`✅ ${properties.length} imóveis criados`);

    // 3. Criar contratos
    const contracts = [
      {
        propertyId: propertyIds[0],
        tenant: "Pedro Henrique Costa",
        tenantDocument: "111.222.333-44",
        tenantEmail: "pedro.costa@email.com",
        tenantPhone: "(11) 98765-4321",
        startDate: "2024-01-01",
        endDate: "2025-01-01",
        rentValue: "2500.00",
        dueDay: 10,
        status: "active",
      },
      {
        propertyId: propertyIds[1],
        tenant: "Ana Carolina Lima Silva",
        tenantDocument: "222.333.444-55",
        tenantEmail: "ana.lima@email.com",
        tenantPhone: "(11) 91234-5678",
        startDate: "2024-01-15",
        endDate: "2025-01-15",
        rentValue: "3500.00",
        dueDay: 15,
        status: "active",
      },
      {
        propertyId: propertyIds[2],
        tenant: "Restaurante Bom Sabor LTDA",
        tenantDocument: "11.222.333/0001-44",
        tenantEmail: "contato@bomsabor.com.br",
        tenantPhone: "(11) 3333-4444",
        startDate: "2024-02-01",
        endDate: "2026-02-01",
        rentValue: "5000.00",
        dueDay: 5,
        status: "active",
      },
      {
        propertyId: propertyIds[3],
        tenant: "Fernanda Oliveira Souza",
        tenantDocument: "333.444.555-66",
        tenantEmail: "fernanda.oliveira@email.com",
        tenantPhone: "(11) 99999-8888",
        startDate: "2023-12-01",
        endDate: "2024-12-01",
        rentValue: "3200.00",
        dueDay: 20,
        status: "active",
      },
      {
        propertyId: propertyIds[4],
        tenant: "Consultoria ABC Ltda",
        tenantDocument: "22.333.444/0001-55",
        tenantEmail: "contato@consultoriaabc.com",
        tenantPhone: "(11) 4444-5555",
        startDate: "2024-01-10",
        endDate: "2025-01-10",
        rentValue: "4200.00",
        dueDay: 8,
        status: "active",
      },
    ];

    const contractIds = [];
    for (const contract of contracts) {
      const result = await pool.query(
        `
        INSERT INTO contracts 
        (property_id, tenant, tenant_document, tenant_email, tenant_phone, 
         start_date, end_date, rent_value, due_day, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
        [
          contract.propertyId,
          contract.tenant,
          contract.tenantDocument,
          contract.tenantEmail,
          contract.tenantPhone,
          contract.startDate,
          contract.endDate,
          contract.rentValue,
          contract.dueDay,
          contract.status,
        ],
      );
      contractIds.push(result.rows[0].id);
    }
    console.log(`✅ ${contracts.length} contratos criados`);

    // 4. Criar pagamentos (mix de pagos, pendentes e atrasados)
    const payments = [
      // Janeiro 2024 - Todos pagos
      {
        contractId: contractIds[0],
        referenceMonth: "2024-01",
        dueDate: "2024-01-10",
        paymentDate: "2024-01-09",
        value: "2500.00",
        status: "paid",
        paymentMethod: "pix",
        notes: "Pagamento via PIX",
      },
      {
        contractId: contractIds[1],
        referenceMonth: "2024-01",
        dueDate: "2024-01-15",
        paymentDate: "2024-01-15",
        value: "3500.00",
        status: "paid",
        paymentMethod: "transferencia",
        notes: "Transferência bancária",
      },
      {
        contractId: contractIds[3],
        referenceMonth: "2024-01",
        dueDate: "2024-01-20",
        paymentDate: "2024-01-18",
        value: "3200.00",
        status: "paid",
        paymentMethod: "pix",
        notes: "Pagamento antecipado",
      },
      {
        contractId: contractIds[4],
        referenceMonth: "2024-01",
        dueDate: "2024-01-08",
        paymentDate: "2024-01-08",
        value: "4200.00",
        status: "paid",
        paymentMethod: "boleto",
        notes: "Boleto bancário",
      },
      // Fevereiro 2024 - Mix
      {
        contractId: contractIds[0],
        referenceMonth: "2024-02",
        dueDate: "2024-02-10",
        paymentDate: "2024-02-12",
        value: "2500.00",
        status: "paid",
        paymentMethod: "pix",
        notes: "Pago com 2 dias de atraso",
      },
      {
        contractId: contractIds[1],
        referenceMonth: "2024-02",
        dueDate: "2024-02-15",
        paymentDate: null,
        value: "3500.00",
        status: "overdue",
        paymentMethod: null,
        notes: null,
      },
      {
        contractId: contractIds[2],
        referenceMonth: "2024-02",
        dueDate: "2024-02-05",
        paymentDate: "2024-02-05",
        value: "5000.00",
        status: "paid",
        paymentMethod: "transferencia",
        notes: "Pagamento em dia",
      },
      {
        contractId: contractIds[3],
        referenceMonth: "2024-02",
        dueDate: "2024-02-20",
        paymentDate: "2024-02-19",
        value: "3200.00",
        status: "paid",
        paymentMethod: "pix",
        notes: null,
      },
      {
        contractId: contractIds[4],
        referenceMonth: "2024-02",
        dueDate: "2024-02-08",
        paymentDate: null,
        value: "4200.00",
        status: "pending",
        paymentMethod: null,
        notes: null,
      },
      // Março 2024 - Pendentes
      {
        contractId: contractIds[0],
        referenceMonth: "2024-03",
        dueDate: "2024-03-10",
        paymentDate: null,
        value: "2500.00",
        status: "pending",
        paymentMethod: null,
        notes: null,
      },
      {
        contractId: contractIds[1],
        referenceMonth: "2024-03",
        dueDate: "2024-03-15",
        paymentDate: null,
        value: "3500.00",
        status: "pending",
        paymentMethod: null,
        notes: null,
      },
      {
        contractId: contractIds[2],
        referenceMonth: "2024-03",
        dueDate: "2024-03-05",
        paymentDate: "2024-03-04",
        value: "5000.00",
        status: "paid",
        paymentMethod: "pix",
        notes: "Pagamento antecipado",
      },
      {
        contractId: contractIds[3],
        referenceMonth: "2024-03",
        dueDate: "2024-03-20",
        paymentDate: null,
        value: "3200.00",
        status: "pending",
        paymentMethod: null,
        notes: null,
      },
      {
        contractId: contractIds[4],
        referenceMonth: "2024-03",
        dueDate: "2024-03-08",
        paymentDate: null,
        value: "4200.00",
        status: "pending",
        paymentMethod: null,
        notes: null,
      },
    ];

    for (const payment of payments) {
      await pool.query(
        `
        INSERT INTO payments 
        (contract_id, reference_month, due_date, payment_date, value, status, payment_method, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          payment.contractId,
          payment.referenceMonth,
          payment.dueDate,
          payment.paymentDate,
          payment.value,
          payment.status,
          payment.paymentMethod,
          payment.notes,
        ],
      );
    }
    console.log(`✅ ${payments.length} pagamentos criados`);

    console.log("🎉 Seed concluído com sucesso!");
    console.log("");
    console.log("📊 Resumo dos dados criados:");
    console.log(`   👤 1 usuário (admin@gestao.com / admin123)`);
    console.log(`   🏠 ${properties.length} imóveis`);
    console.log(`   📄 ${contracts.length} contratos`);
    console.log(`   💰 ${payments.length} pagamentos`);
    console.log("");
    console.log("✅ Você já pode fazer login e ver o sistema populado!");
  } catch (error) {
    console.error("❌ Erro ao fazer seed:", error);
    throw error;
  }
}
