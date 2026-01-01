// Database integration: blueprint:javascript_database
import { 
  users, properties, contracts, payments,
  type User, type InsertUser,
  type Property, type InsertProperty,
  type Contract, type InsertContract, type ContractWithProperty,
  type Payment, type InsertPayment, type PaymentWithContract,
  type DashboardMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, isNull, isNotNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: InsertProperty): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  
  // Contracts
  getContracts(): Promise<ContractWithProperty[]>;
  getContract(id: string): Promise<ContractWithProperty | undefined>;
  getContractsByPropertyId(propertyId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: InsertContract): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;
  
  // Payments
  getPayments(): Promise<PaymentWithContract[]>;
  getPayment(id: string): Promise<PaymentWithContract | undefined>;
  getPaymentsByContractId(contractId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: InsertPayment): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<boolean>;
  
  // Dashboard
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Properties
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(id: string, insertProperty: InsertProperty): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set(insertProperty)
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id)).returning();
    return result.length > 0;
  }

  // Contracts
  async getContracts(): Promise<ContractWithProperty[]> {
    const allContracts = await db.select().from(contracts);
    const allProperties = await db.select().from(properties);
    
    const propertiesMap = new Map(allProperties.map(p => [p.id, p]));
    
    return allContracts.map(contract => ({
      ...contract,
      property: propertiesMap.get(contract.propertyId),
    }));
  }

  async getContract(id: string): Promise<ContractWithProperty | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    if (!contract) return undefined;
    
    const [property] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
    
    return {
      ...contract,
      property: property || undefined,
    };
  }

  async getContractsByPropertyId(propertyId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.propertyId, propertyId));
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values({
      ...insertContract,
      status: insertContract.status || "active",
    }).returning();
    return contract;
  }

  async updateContract(id: string, insertContract: InsertContract): Promise<Contract | undefined> {
    const [contract] = await db
      .update(contracts)
      .set({
        ...insertContract,
        status: insertContract.status || "active",
      })
      .where(eq(contracts.id, id))
      .returning();
    return contract || undefined;
  }

  async deleteContract(id: string): Promise<boolean> {
    const result = await db.delete(contracts).where(eq(contracts.id, id)).returning();
    return result.length > 0;
  }

  // Payments
  async getPayments(): Promise<PaymentWithContract[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.dueDate));
    const allContracts = await db.select().from(contracts);
    const allProperties = await db.select().from(properties);
    
    const contractsMap = new Map(allContracts.map(c => [c.id, c]));
    const propertiesMap = new Map(allProperties.map(p => [p.id, p]));
    
    return allPayments.map(payment => {
      const contract = contractsMap.get(payment.contractId);
      return {
        ...payment,
        contract,
        property: contract ? propertiesMap.get(contract.propertyId) : undefined,
      };
    });
  }

  async getPayment(id: string): Promise<PaymentWithContract | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!payment) return undefined;
    
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, payment.contractId));
    let property: Property | undefined;
    
    if (contract) {
      const [prop] = await db.select().from(properties).where(eq(properties.id, contract.propertyId));
      property = prop;
    }
    
    return {
      ...payment,
      contract: contract || undefined,
      property,
    };
  }

  async getPaymentsByContractId(contractId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.contractId, contractId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values({
      ...insertPayment,
      status: insertPayment.status || "pending",
    }).returning();
    return payment;
  }

  async updatePayment(id: string, insertPayment: InsertPayment): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({
        ...insertPayment,
        status: insertPayment.status || "pending",
      })
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id)).returning();
    return result.length > 0;
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const allProperties = await db.select().from(properties);
    const allContracts = await db.select().from(contracts);
    const allPayments = await db.select().from(payments);
    
    const activeContracts = allContracts.filter(c => c.status === "active");
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    const thisMonthPayments = allPayments.filter(p => p.referenceMonth === currentMonth);
    
    const receivedThisMonth = thisMonthPayments
      .filter(p => p.paymentDate)
      .reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
    
    const pendingThisMonth = thisMonthPayments
      .filter(p => !p.paymentDate)
      .reduce((sum, p) => sum + parseFloat(p.value.toString()), 0);
    
    // Get upcoming payments (next 30 days, not paid)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    const contractsMap = new Map(allContracts.map(c => [c.id, c]));
    const propertiesMap = new Map(allProperties.map(p => [p.id, p]));
    
    const upcomingPayments = allPayments
      .filter(p => {
        if (p.paymentDate) return false;
        const dueDate = new Date(p.dueDate);
        return dueDate >= today && dueDate <= thirtyDaysLater;
      })
      .map(payment => {
        const contract = contractsMap.get(payment.contractId);
        return {
          ...payment,
          contract,
          property: contract ? propertiesMap.get(contract.propertyId) : undefined,
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6);
    
    return {
      totalProperties: allProperties.length,
      activeContracts: activeContracts.length,
      receivedThisMonth,
      pendingThisMonth,
      upcomingPayments,
    };
  }
}

export const storage = new DatabaseStorage();
