import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';

let app: express.Express;
let httpServer: ReturnType<typeof createServer>;
let request: supertest.Agent;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  request = supertest(app);
}, 60000);

afterAll(async () => {
  if (httpServer) {
    httpServer.close();
  }
}, 60000);

describe('Properties API', () => {
  let createdPropertyId: string;

  it('should get all properties', async () => {
    const res = await request.get('/api/properties');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a property', async () => {
    const newProperty = {
      address: 'Rua Teste, 123 - Centro, São Paulo/SP',
      type: 'apartamento',
      owner: 'Teste Owner',
      ownerDocument: '123.456.789-00',
      rentValue: '1500.00',
      description: 'Teste descrição',
    };

    const res = await request.post('/api/properties').send(newProperty);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.address).toBe(newProperty.address);
    createdPropertyId = res.body.id;
  });

  it('should get a specific property', async () => {
    if (!createdPropertyId) return;
    const res = await request.get(`/api/properties/${createdPropertyId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdPropertyId);
  });

  it('should update a property', async () => {
    if (!createdPropertyId) return;
    const updatedData = {
      address: 'Rua Atualizada, 456 - Centro, São Paulo/SP',
      type: 'casa',
      owner: 'Teste Owner Atualizado',
      ownerDocument: '123.456.789-00',
      rentValue: '2000.00',
      description: 'Descrição atualizada',
    };

    const res = await request.put(`/api/properties/${createdPropertyId}`).send(updatedData);
    expect(res.status).toBe(200);
    expect(res.body.address).toBe(updatedData.address);
  });

  it('should return 404 for non-existent property', async () => {
    const res = await request.get('/api/properties/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid property data', async () => {
    const invalidData = {
      type: 'apartamento',
    };

    const res = await request.post('/api/properties').send(invalidData);
    expect(res.status).toBe(400);
  });

  it('should delete a property', async () => {
    if (!createdPropertyId) return;
    const res = await request.delete(`/api/properties/${createdPropertyId}`);
    expect(res.status).toBe(204);
  });
});

describe('Contracts API', () => {
  let propertyId: string;
  let contractId: string;

  beforeAll(async () => {
    const propRes = await request.post('/api/properties').send({
      address: 'Contrato Test Address',
      type: 'apartamento',
      owner: 'Test Owner',
      ownerDocument: '123.456.789-00',
      rentValue: '2000.00',
    });
    propertyId = propRes.body.id;
  });

  afterAll(async () => {
    if (contractId) {
      await request.delete(`/api/contracts/${contractId}`);
    }
    if (propertyId) {
      await request.delete(`/api/properties/${propertyId}`);
    }
  });

  it('should get all contracts', async () => {
    const res = await request.get('/api/contracts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a contract', async () => {
    const newContract = {
      propertyId,
      tenant: 'Inquilino Teste',
      tenantDocument: '987.654.321-00',
      tenantEmail: 'inquilino@teste.com',
      tenantPhone: '(11) 99999-9999',
      startDate: '2025-01-01',
      endDate: '2027-01-01',
      rentValue: '2000.00',
      dueDay: 10,
      status: 'active',
    };

    const res = await request.post('/api/contracts').send(newContract);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.tenant).toBe(newContract.tenant);
    contractId = res.body.id;
  });

  it('should return 400 when creating contract for non-existent property', async () => {
    const newContract = {
      propertyId: 'non-existent-id',
      tenant: 'Inquilino Teste',
      tenantDocument: '987.654.321-00',
      startDate: '2025-01-01',
      endDate: '2027-01-01',
      rentValue: '2000.00',
      dueDay: 10,
      status: 'active',
    };

    const res = await request.post('/api/contracts').send(newContract);
    expect(res.status).toBe(400);
  });

  it('should get a specific contract', async () => {
    if (!contractId) return;
    const res = await request.get(`/api/contracts/${contractId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(contractId);
  });
});

describe('Payments API', () => {
  let propertyId: string;
  let contractId: string;
  let paymentId: string;

  beforeAll(async () => {
    const propRes = await request.post('/api/properties').send({
      address: 'Payment Test Address',
      type: 'apartamento',
      owner: 'Test Owner',
      ownerDocument: '123.456.789-00',
      rentValue: '2500.00',
    });
    propertyId = propRes.body.id;

    const contractRes = await request.post('/api/contracts').send({
      propertyId,
      tenant: 'Payment Test Tenant',
      tenantDocument: '111.222.333-44',
      startDate: '2025-01-01',
      endDate: '2027-01-01',
      rentValue: '2500.00',
      dueDay: 15,
      status: 'active',
    });
    contractId = contractRes.body.id;
  });

  afterAll(async () => {
    if (paymentId) {
      await request.delete(`/api/payments/${paymentId}`);
    }
    if (contractId) {
      await request.delete(`/api/contracts/${contractId}`);
    }
    if (propertyId) {
      await request.delete(`/api/properties/${propertyId}`);
    }
  });

  it('should get all payments', async () => {
    const res = await request.get('/api/payments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a payment', async () => {
    const newPayment = {
      contractId,
      referenceMonth: '2025-01',
      dueDate: '2025-01-15',
      value: '2500.00',
      status: 'pending',
    };

    const res = await request.post('/api/payments').send(newPayment);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    paymentId = res.body.id;
  });

  it('should return 400 when creating payment for non-existent contract', async () => {
    const newPayment = {
      contractId: 'non-existent-id',
      referenceMonth: '2025-01',
      dueDate: '2025-01-15',
      value: '2500.00',
      status: 'pending',
    };

    const res = await request.post('/api/payments').send(newPayment);
    expect(res.status).toBe(400);
  });

  it('should update a payment to paid status', async () => {
    if (!paymentId) return;
    const updateData = {
      contractId,
      referenceMonth: '2025-01',
      dueDate: '2025-01-15',
      paymentDate: '2025-01-15',
      value: '2500.00',
      status: 'paid',
      paymentMethod: 'pix',
    };

    const res = await request.put(`/api/payments/${paymentId}`).send(updateData);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
  });

  it('should delete a payment', async () => {
    if (!paymentId) return;
    const res = await request.delete(`/api/payments/${paymentId}`);
    expect(res.status).toBe(204);
    paymentId = '';
  });
});

describe('Dashboard API', () => {
  it('should get dashboard metrics', async () => {
    const res = await request.get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalProperties');
    expect(res.body).toHaveProperty('activeContracts');
    expect(res.body).toHaveProperty('receivedThisMonth');
    expect(res.body).toHaveProperty('pendingThisMonth');
  });
});

describe('Export API', () => {
  it('should export payments as CSV', async () => {
    const res = await request.get('/api/export/payments');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });

  it('should export full backup as JSON', async () => {
    const res = await request.get('/api/export/backup');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toHaveProperty('exportDate');
    expect(res.body).toHaveProperty('data');
  });
});

describe('PDF Receipt API', () => {
  let propertyId: string;
  let contractId: string;
  let paymentId: string;

  beforeAll(async () => {
    const propRes = await request.post('/api/properties').send({
      address: 'Receipt Test Address',
      type: 'apartamento',
      owner: 'Receipt Owner',
      ownerDocument: '123.456.789-00',
      rentValue: '3000.00',
    });
    propertyId = propRes.body.id;

    const contractRes = await request.post('/api/contracts').send({
      propertyId,
      tenant: 'Receipt Tenant',
      tenantDocument: '999.888.777-66',
      tenantEmail: 'tenant@test.com',
      startDate: '2025-01-01',
      endDate: '2027-01-01',
      rentValue: '3000.00',
      dueDay: 10,
      status: 'active',
    });
    contractId = contractRes.body.id;

    const paymentRes = await request.post('/api/payments').send({
      contractId,
      referenceMonth: '2025-01',
      dueDate: '2025-01-10',
      paymentDate: '2025-01-10',
      value: '3000.00',
      status: 'paid',
      paymentMethod: 'pix',
    });
    paymentId = paymentRes.body.id;
  });

  afterAll(async () => {
    if (paymentId) await request.delete(`/api/payments/${paymentId}`);
    if (contractId) await request.delete(`/api/contracts/${contractId}`);
    if (propertyId) await request.delete(`/api/properties/${propertyId}`);
  });

  it('should return 404 for non-existent payment receipt', async () => {
    const res = await request.get('/api/payments/non-existent-id/receipt');
    expect(res.status).toBe(404);
  });

  it('should return 400 for unpaid payment receipt request', async () => {
    const unpaidPaymentRes = await request.post('/api/payments').send({
      contractId,
      referenceMonth: '2025-02',
      dueDate: '2025-02-10',
      value: '3000.00',
      status: 'pending',
    });
    const unpaidPaymentId = unpaidPaymentRes.body.id;

    const res = await request.get(`/api/payments/${unpaidPaymentId}/receipt`);
    expect(res.status).toBe(400);

    await request.delete(`/api/payments/${unpaidPaymentId}`);
  });
});

describe('Email Notification API', () => {
  let propertyId: string;
  let contractId: string;
  let paymentId: string;

  beforeAll(async () => {
    const propRes = await request.post('/api/properties').send({
      address: 'Notify Test Address',
      type: 'casa',
      owner: 'Notify Owner',
      ownerDocument: '111.222.333-44',
      rentValue: '2000.00',
    });
    propertyId = propRes.body.id;

    const contractRes = await request.post('/api/contracts').send({
      propertyId,
      tenant: 'Notify Tenant',
      tenantDocument: '555.666.777-88',
      tenantEmail: 'notify@test.com',
      startDate: '2025-01-01',
      endDate: '2027-01-01',
      rentValue: '2000.00',
      dueDay: 15,
      status: 'active',
    });
    contractId = contractRes.body.id;

    const paymentRes = await request.post('/api/payments').send({
      contractId,
      referenceMonth: '2025-01',
      dueDate: '2025-01-15',
      value: '2000.00',
      status: 'pending',
    });
    paymentId = paymentRes.body.id;
  });

  afterAll(async () => {
    if (paymentId) await request.delete(`/api/payments/${paymentId}`);
    if (contractId) await request.delete(`/api/contracts/${contractId}`);
    if (propertyId) await request.delete(`/api/properties/${propertyId}`);
  });

  it('should return 404 for non-existent payment notification', async () => {
    const res = await request.post('/api/payments/non-existent-id/notify');
    expect(res.status).toBe(404);
  });

  it('should return 400 for already paid payment notification', async () => {
    const paidPaymentRes = await request.post('/api/payments').send({
      contractId,
      referenceMonth: '2025-02',
      dueDate: '2025-02-15',
      paymentDate: '2025-02-15',
      value: '2000.00',
      status: 'paid',
    });
    const paidPaymentId = paidPaymentRes.body.id;

    const res = await request.post(`/api/payments/${paidPaymentId}/notify`);
    expect(res.status).toBe(400);

    await request.delete(`/api/payments/${paidPaymentId}`);
  });

  it('should successfully send notification for pending payment', async () => {
    const res = await request.post(`/api/payments/${paymentId}/notify`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Referential Integrity', () => {
  let propertyId: string;
  let contractId: string;
  let paymentId: string;

  beforeAll(async () => {
    const propRes = await request.post('/api/properties').send({
      address: 'Integrity Test Address',
      type: 'comercial',
      owner: 'Integrity Owner',
      ownerDocument: '12.345.678/0001-90',
      rentValue: '5000.00',
    });
    propertyId = propRes.body.id;

    const contractRes = await request.post('/api/contracts').send({
      propertyId,
      tenant: 'Integrity Tenant',
      tenantDocument: '444.555.666-77',
      startDate: '2025-01-01',
      endDate: '2027-01-01',
      rentValue: '5000.00',
      dueDay: 5,
      status: 'active',
    });
    contractId = contractRes.body.id;

    const paymentRes = await request.post('/api/payments').send({
      contractId,
      referenceMonth: '2025-01',
      dueDate: '2025-01-05',
      value: '5000.00',
      status: 'pending',
    });
    paymentId = paymentRes.body.id;
  });

  afterAll(async () => {
    if (paymentId) await request.delete(`/api/payments/${paymentId}`);
    if (contractId) await request.delete(`/api/contracts/${contractId}`);
    if (propertyId) await request.delete(`/api/properties/${propertyId}`);
  });

  it('should not allow deleting property with linked contracts (409)', async () => {
    const res = await request.delete(`/api/properties/${propertyId}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('contratos vinculados');
  });

  it('should not allow deleting contract with linked payments (409)', async () => {
    const res = await request.delete(`/api/contracts/${contractId}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('pagamentos vinculados');
  });
});
