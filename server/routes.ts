import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertContractSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { generateReceipt } from "./pdf";
import { sendOverduePaymentNotification, sendPaymentDueSoonNotification } from "./email";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register object storage routes for document uploads
  registerObjectStorageRoutes(app);
  
  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.updateProperty(req.params.id, validatedData);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const contracts = await storage.getContractsByPropertyId(req.params.id);
      if (contracts.length > 0) {
        return res.status(409).json({ 
          error: "Não é possível excluir este imóvel pois existem contratos vinculados",
          details: `${contracts.length} contrato(s) encontrado(s)`
        });
      }
      const deleted = await storage.deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Contracts
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const property = await storage.getProperty(validatedData.propertyId);
      if (!property) {
        return res.status(400).json({ error: "Imóvel não encontrado" });
      }
      const contract = await storage.createContract(validatedData);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.updateContract(req.params.id, validatedData);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByContractId(req.params.id);
      if (payments.length > 0) {
        return res.status(409).json({ 
          error: "Não é possível excluir este contrato pois existem pagamentos vinculados",
          details: `${payments.length} pagamento(s) encontrado(s)`
        });
      }
      const deleted = await storage.deleteContract(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const contract = await storage.getContract(validatedData.contractId);
      if (!contract) {
        return res.status(400).json({ error: "Contrato não encontrado" });
      }
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.updatePayment(req.params.id, validatedData);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePayment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Chart data - Monthly revenue for last 6 months
  app.get("/api/charts/monthly-revenue", async (req, res) => {
    try {
      const chartData = await storage.getMonthlyRevenueData();
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  // Export payments as CSV
  app.get("/api/export/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const csvHeader = "Mês Referência,Inquilino,Imóvel,Valor,Vencimento,Data Pagamento,Status,Forma Pagamento\n";
      const csvRows = payments.map(p => {
        const status = p.paymentDate ? "Pago" : (new Date(p.dueDate) < new Date() ? "Atrasado" : "Pendente");
        return [
          p.referenceMonth,
          p.contract?.tenant || "",
          p.property?.address || "",
          p.value,
          p.dueDate,
          p.paymentDate || "",
          status,
          p.paymentMethod || ""
        ].map(v => `"${v}"`).join(",");
      }).join("\n");
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=recebimentos.csv");
      res.send("\uFEFF" + csvHeader + csvRows);
    } catch (error) {
      res.status(500).json({ error: "Failed to export payments" });
    }
  });

  // Full backup export as JSON
  app.get("/api/export/backup", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      const contracts = await storage.getContracts();
      const payments = await storage.getPayments();
      
      const backup = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: {
          properties,
          contracts,
          payments
        }
      };
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=backup-alugueis-${new Date().toISOString().split('T')[0]}.json`);
      res.send(JSON.stringify(backup, null, 2));
    } catch (error) {
      res.status(500).json({ error: "Failed to export backup" });
    }
  });

  // Send email notification for overdue payment
  app.post("/api/payments/:id/notify", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (payment.paymentDate) {
        return res.status(400).json({ error: "Pagamento já realizado" });
      }
      
      const today = new Date();
      const dueDate = new Date(payment.dueDate);
      const isOverdue = dueDate < today;
      
      let result;
      if (isOverdue) {
        result = await sendOverduePaymentNotification(payment);
      } else {
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        result = await sendPaymentDueSoonNotification(payment, daysUntilDue);
      }
      
      if (result.success) {
        res.json({ message: result.message, emailId: result.emailId });
      } else {
        res.status(500).json({ error: result.message });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Generate PDF receipt for a payment
  app.get("/api/payments/:id/receipt", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (!payment.paymentDate) {
        return res.status(400).json({ error: "Não é possível gerar recibo para pagamento não realizado" });
      }
      
      const pdfBuffer = generateReceipt(payment);
      
      const filename = `recibo-${payment.referenceMonth}-${payment.id.slice(0, 8)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ error: "Failed to generate receipt" });
    }
  });

  // Load demo data
  app.post("/api/demo-data", async (req, res) => {
    try {
      // Create demo properties
      const prop1 = await storage.createProperty({
        address: "Rua das Flores, 123 - Centro, São Paulo/SP",
        type: "apartamento",
        owner: "João da Silva",
        ownerDocument: "123.456.789-00",
        rentValue: "2500.00",
        description: "Apartamento 2 quartos, 70m²"
      });
      
      const prop2 = await storage.createProperty({
        address: "Av. Brasil, 456 - Jardim Europa, São Paulo/SP",
        type: "casa",
        owner: "Maria Santos",
        ownerDocument: "987.654.321-00",
        rentValue: "3800.00",
        description: "Casa 3 quartos com quintal"
      });
      
      const prop3 = await storage.createProperty({
        address: "Rua Comercial, 789 - Centro, São Paulo/SP",
        type: "comercial",
        owner: "Pedro Oliveira",
        ownerDocument: "12.345.678/0001-90",
        rentValue: "5000.00",
        description: "Sala comercial 100m²"
      });
      
      // Create demo contracts
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear() + 2, today.getMonth(), 1).toISOString().split('T')[0];
      
      const contract1 = await storage.createContract({
        propertyId: prop1.id,
        tenant: "Carlos Pereira",
        tenantDocument: "111.222.333-44",
        tenantEmail: "carlos@email.com",
        tenantPhone: "(11) 99999-1111",
        startDate,
        endDate,
        rentValue: "2500.00",
        dueDay: 10,
        status: "active"
      });
      
      const contract2 = await storage.createContract({
        propertyId: prop2.id,
        tenant: "Ana Costa",
        tenantDocument: "555.666.777-88",
        tenantEmail: "ana@email.com",
        tenantPhone: "(11) 99999-2222",
        startDate,
        endDate,
        rentValue: "3800.00",
        dueDay: 15,
        status: "active"
      });
      
      const contract3 = await storage.createContract({
        propertyId: prop3.id,
        tenant: "Tech Solutions Ltda",
        tenantDocument: "98.765.432/0001-10",
        tenantEmail: "contato@techsolutions.com",
        tenantPhone: "(11) 3333-4444",
        startDate,
        endDate,
        rentValue: "5000.00",
        dueDay: 5,
        status: "active"
      });
      
      // Create demo payments for last 3 months
      const contracts = [
        { contract: contract1, value: "2500.00" },
        { contract: contract2, value: "3800.00" },
        { contract: contract3, value: "5000.00" }
      ];
      
      for (let i = 2; i >= 0; i--) {
        const refDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const refMonth = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;
        
        for (const { contract, value } of contracts) {
          const dueDate = `${refMonth}-${String(contract.dueDay).padStart(2, '0')}`;
          const isPaid = i > 0; // Past months are paid
          
          await storage.createPayment({
            contractId: contract.id,
            referenceMonth: refMonth,
            dueDate,
            paymentDate: isPaid ? dueDate : null,
            value,
            status: isPaid ? "paid" : "pending",
            paymentMethod: isPaid ? "pix" : null,
            notes: null
          });
        }
      }
      
      res.json({ 
        message: "Dados de demonstração carregados com sucesso!",
        created: {
          properties: 3,
          contracts: 3,
          payments: 9
        }
      });
    } catch (error) {
      console.error("Error loading demo data:", error);
      res.status(500).json({ error: "Falha ao carregar dados de demonstração" });
    }
  });

  return httpServer;
}
