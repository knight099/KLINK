import { recalculateCustomerLedger } from '../../lib/ledger';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { lockSupplier, reserveStock, canTransition, money, acceptedStatuses } from '../../lib/orders';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  AddSupplierProductInputSchema,
  UpdateSupplierProductInputSchema,
  UpdateOrderStatusInputSchema,
  RecordPaymentInputSchema,
  CreateManualOrderInputSchema,
  DispatchDeliveryInputSchema,
  CompleteDeliveryInputSchema,
  CreateSupplierVehicleInputSchema,
  UpdateSupplierVehicleInputSchema
} from '@klink/shared-types';

export const supplierRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // All routes in this module require SUPPLIER role
  fastify.addHook('onRequest', fastify.requireRole('SUPPLIER'));

  // Helper to ensure tenant supplierId
  const getSupplierId = (request: any) => {
    const supplierId = request.user.supplierId;
    if (!supplierId) {
      throw fastify.httpErrors.forbidden('User does not have an associated supplier tenant');
    }
    return supplierId;
  };

  // 1. Supplier Dashboard (Roadmap Section 15)
  fastify.get(
    '/dashboard',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Supplier dashboard stats (New orders, deliveries, revenue, low stock, pending Udhaar)'
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);

      const [
        pendingOrdersCount,
        ordersToDeliverCount,
        lowStockItems,
        totalReceivablesAgg,
        recentOrders,
        supplierProfile
      ] = await Promise.all([
        fastify.prisma.order.count({
          where: { supplierId, status: 'PENDING_APPROVAL' }
        }),
        fastify.prisma.order.count({
          where: { supplierId, status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] } }
        }),
        fastify.prisma.supplierProduct.findMany({
          where: {
            supplierId,
            isAvailable: true,
            stockQuantity: { lte: 20 }
          },
          include: { masterProduct: true },
          take: 5
        }),
        fastify.prisma.customerLedger.aggregate({
          where: { supplierId },
          _sum: { outstandingBalance: true }
        }),
        fastify.prisma.order.findMany({
          where: { supplierId },
          include: { customer: true, items: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        fastify.prisma.supplier.findUnique({
          where: { id: supplierId },
          include: { district: true }
        })
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todaySalesAgg = await fastify.prisma.order.aggregate({
        where: {
          supplierId,
          createdAt: { gte: todayStart },
          status: { notIn: ['REJECTED', 'CANCELLED'] }
        },
        _sum: { finalTotal: true }
      });

      return {
        supplier: supplierProfile,
        stats: {
          newOrdersCount: pendingOrdersCount,
          ordersToDeliverCount,
          todaySales: todaySalesAgg._sum.finalTotal || 0,
          totalPendingUdhaar: totalReceivablesAgg._sum.outstandingBalance || 0,
          lowStockCount: lowStockItems.length
        },
        lowStockItems,
        recentOrders
      };
    }
  );

  // Supplier Profile management (Update address, logo, description, etc.)
  fastify.get(
    '/profile',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Get supplier profile'
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const supplier = await fastify.prisma.supplier.findUnique({
        where: { id: supplierId },
        include: { district: true, serviceAreas: { include: { district: true } } }
      });
      if (!supplier) return reply.status(404).send({ error: 'Supplier not found' });
      return { supplier };
    }
  );

  fastify.patch(
    '/profile',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Update store address, logo, description, contact info, and delivery districts',
        body: z.object({
          businessName: z.string().min(2).optional(),
          ownerName: z.string().min(2).optional(),
          address: z.string().min(5).optional(),
          gstin: z.string().optional(),
          logoUrl: z.string().optional(),
          description: z.string().optional(),
          serviceDistrictIds: z.array(z.string()).optional()
        })
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);
      const { serviceDistrictIds, ...rest } = request.body;

      if (serviceDistrictIds && Array.isArray(serviceDistrictIds)) {
        await fastify.prisma.supplierServiceArea.deleteMany({
          where: { supplierId }
        });
        if (serviceDistrictIds.length > 0) {
          await fastify.prisma.supplierServiceArea.createMany({
            data: serviceDistrictIds.map((districtId) => ({
              supplierId,
              districtId,
              isActive: true
            }))
          });
        }
      }

      const updated = await fastify.prisma.supplier.update({
        where: { id: supplierId },
        data: rest,
        include: { district: true, serviceAreas: { include: { district: true } } }
      });
      return { message: 'Profile updated successfully', supplier: updated };
    }
  );

  // 2. Manage Store Products / Inventory
  fastify.get(
    '/products',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'List supplier products with current prices and stock'
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);
      const products = await fastify.prisma.supplierProduct.findMany({
        where: { supplierId },
        include: {
          masterProduct: {
            include: { category: true, brand: true }
          }
        },
        orderBy: { masterProduct: { name: 'asc' } }
      });
      return { products };
    }
  );

  // Add product from Master Catalog
  fastify.post(
    '/products',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Add a master catalog product to supplier store with custom pricing and stock',
        body: AddSupplierProductInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const {
        masterProductId,
        sellingPrice,
        unit,
        stockQuantity,
        minOrderQty,
        deliveryCharge,
        lowStockThreshold
      } = request.body;

      const product = await fastify.prisma.supplierProduct.upsert({
        where: {
          supplierId_masterProductId: { supplierId, masterProductId }
        },
        update: {
          sellingPrice,
          unit,
          stockQuantity,
          minOrderQty,
          deliveryCharge,
          lowStockThreshold,
          isAvailable: true
        },
        create: {
          supplierId,
          masterProductId,
          sellingPrice,
          unit,
          stockQuantity,
          minOrderQty,
          deliveryCharge,
          lowStockThreshold,
          isAvailable: true
        },
        include: { masterProduct: true }
      });

      return reply.status(201).send({ product });
    }
  );

  // Update existing product price / stock / availability
  fastify.patch(
    '/products/:id',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Update price, stock, or status of a store product',
        params: z.object({ id: z.string() }),
        body: UpdateSupplierProductInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;

      const existing = await fastify.prisma.supplierProduct.findFirst({
        where: { id, supplierId }
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Product not found in your inventory' });
      }

      const product = await fastify.prisma.supplierProduct.update({
        where: { id },
        data: request.body,
        include: { masterProduct: true }
      });

      return { product };
    }
  );

  // 3. Order Management (Roadmap Section 18)
  fastify.get(
    '/orders',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'List supplier orders filtered by status',
        querystring: z.object({
          status: z.string().optional()
        })
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);
      const { status } = request.query;

      const where: any = { supplierId };
      if (status) {
        where.status = status;
      }

      const orders = await fastify.prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: true,
          paymentRecords: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return { orders };
    }
  );

  // Update Order Status (Accept / Reject / Preparing / Out for Delivery / Delivered)
  fastify.patch(
    '/orders/:id/status',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Accept, reject, or update order fulfillment status',
        params: z.object({ id: z.string() }),
        body: UpdateOrderStatusInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;
      const { status, rejectionReason } = request.body;

      const order = await fastify.prisma.order.findFirst({
        where: { id, supplierId },
        include: { items: true }
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      // Execute stock reservation, restoration, status transition, and ledger calculation atomically
      const updatedOrder = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const order = await tx.order.findFirst({ where: { id, supplierId }, include: { items: true } });
        if (!order) throw fastify.httpErrors.notFound('Order not found');
        if (!canTransition(order.status, status)) throw fastify.httpErrors.badRequest(`Cannot change ${order.status} to ${status}`);
        if (['CANCELLED', 'REJECTED'].includes(status) && order.amountPaid > 0) {
          throw fastify.httpErrors.badRequest('Paid orders require a reconciled refund before cancellation');
        }
        if (order.status === 'PENDING_APPROVAL' && status === 'CONFIRMED') {
          await reserveStock(tx, supplierId, order.items);
        }

        // If order was cancelled/rejected after confirmation, restore reserved stock
        if (
          ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status) &&
          ['CANCELLED', 'REJECTED'].includes(status)
        ) {
          for (const item of order.items) {
            await tx.supplierProduct.update({
              where: { id: item.supplierProductId },
              data: {
                stockQuantity: {
                  increment: item.quantity
                }
              }
            });
          }
        }

        const isCancelledOrRejected = ['CANCELLED', 'REJECTED'].includes(status);
        const res = await tx.order.update({
          where: { id },
          data: {
            status,
            rejectionReason: status === 'REJECTED' ? rejectionReason || 'Product or delivery unavailable' : null,
            ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
            ...(isCancelledOrRejected ? { balancePending: 0 } : {})
          },
          include: { customer: true, items: true }
        });

        // Recalculate customer ledger atomically
        await recalculateCustomerLedger(tx, supplierId, order.customerId);

        return res;
      });

      return {
        message: `Order status updated to ${status}`,
        order: updatedOrder
      };
    }
  );

  // 4. Payments & Udhaar Recording (Roadmap Section 21 & 22)
  fastify.post(
    '/orders/:id/payments',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Record offline customer payment (Cash, UPI, Cheque, Udhaar)',
        params: z.object({ id: z.string() }),
        body: RecordPaymentInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;
      const { amount, paymentMode, notes } = request.body;

      const order = await fastify.prisma.order.findFirst({
        where: { id, supplierId }
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const keyResult = z.string().min(8).max(128).safeParse(request.headers['idempotency-key']);
      if (!keyResult.success) throw fastify.httpErrors.badRequest('A unique Idempotency-Key header (8-128 characters) is required');
      const idempotencyKey = keyResult.data;
      const requestHash = createHash('sha256').update(JSON.stringify({ path: request.url, body: request.body })).digest('hex');
      const result = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const previous = await tx.paymentRecord.findUnique({ where: { supplierId_idempotencyKey: { supplierId, idempotencyKey } } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw fastify.httpErrors.conflict('Payment key already used for a different request');
          return { payment: previous, order: await tx.order.findUniqueOrThrow({ where: { id } }) };
        }
        const order = await tx.order.findFirst({ where: { id, supplierId }, include: { items: true } });
        if (!order) throw fastify.httpErrors.notFound('Order not found');
        if (!acceptedStatuses.includes(order.status)) throw fastify.httpErrors.badRequest('Only accepted orders can receive payments');
        if (paymentMode === 'UDHAAR') throw fastify.httpErrors.badRequest('Udhaar is credit, not a payment received');
        if (amount > money(order.balancePending)) throw fastify.httpErrors.badRequest('Payment exceeds outstanding balance');
        // Record payment transaction
        const payment = await tx.paymentRecord.create({
          data: {
            idempotencyKey, requestHash,
            supplierId,
            customerId: order.customerId,
            orderId: order.id,
            amount,
            paymentMode,
            notes
          }
        });

        const newAmountPaid = money(order.amountPaid + amount);
        const newBalancePending = Math.max(0, money(order.finalTotal - newAmountPaid));

        let paymentStatus = 'PENDING';
        if (newBalancePending <= 0) {
          paymentStatus = 'PAID';
        } else if (newAmountPaid > 0) {
          paymentStatus = 'PARTIALLY_PAID';

        }

        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            amountPaid: newAmountPaid,
            balancePending: newBalancePending,
            paymentStatus
          }
        });

        // Update customer Udhaar Ledger atomically
        await recalculateCustomerLedger(tx, supplierId, order.customerId);

        return { payment, order: updatedOrder };
      });

      return {
        message: 'Payment recorded successfully',
        payment: result.payment,
        order: result.order
      };
    }
  );

  // 5. Udhaar / Receivables Ledger (Roadmap Section 22)
  fastify.get(
    '/ledger',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'List customer Udhaar ledger and total outstanding receivables'
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);

      const ledgers = await fastify.prisma.customerLedger.findMany({
        where: { supplierId },
        include: {
          customer: true
        },
        orderBy: { outstandingBalance: 'desc' }
      });

      const totalReceivables = ledgers.reduce((acc, l) => acc + l.outstandingBalance, 0);

      const customerLedgers = ledgers.map((l) => ({
        customerId: l.customerId,
        customerName: l.customer.fullName,
        customerPhone: l.customer.phone,
        totalPurchased: l.totalPurchased,
        totalPaid: l.totalPaid,
        outstandingBalance: l.outstandingBalance,
        lastOrderDate: l.lastOrderDate ? l.lastOrderDate.toISOString() : null,
        lastPaymentDate: l.lastPaymentDate ? l.lastPaymentDate.toISOString() : null
      }));

      return {
        totalReceivables,
        totalCustomers: customerLedgers.length,
        customerLedgers
      };
    }
  );

  // Settle customer Udhaar directly with atomic FIFO order reconciliation
  fastify.post(
    '/ledger/settle',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Record direct customer Udhaar payment settlement',
        body: z.object({
          customerId: z.string(),
          amount: z.number().positive().max(1_000_000_000).multipleOf(0.01),
          paymentMode: z.enum(['CASH', 'UPI_DIRECT', 'BANK_TRANSFER', 'CHEQUE']),
          notes: z.string().optional()
        })
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { customerId, amount, paymentMode, notes } = request.body;

      const keyResult = z.string().min(8).max(128).safeParse(request.headers['idempotency-key']);
      if (!keyResult.success) throw fastify.httpErrors.badRequest('A unique Idempotency-Key header (8-128 characters) is required');
      const idempotencyKey = keyResult.data;
      const requestHash = createHash('sha256').update(JSON.stringify({ path: request.url, body: request.body })).digest('hex');
      const result = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const previous = await tx.paymentRecord.findUnique({ where: { supplierId_idempotencyKey: { supplierId, idempotencyKey } } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw fastify.httpErrors.conflict('Payment key already used for a different request');
          return { payment: previous, ledger: await recalculateCustomerLedger(tx, supplierId, customerId) };
        }
        const due = await tx.order.aggregate({ where: { supplierId, customerId, status: { in: acceptedStatuses } }, _sum: { balancePending: true } });
        if (amount > money(due._sum.balancePending || 0)) throw fastify.httpErrors.badRequest('Settlement exceeds outstanding balance for this yard');
        // 1. Record general payment
        const payment = await tx.paymentRecord.create({
          data: {
            idempotencyKey, requestHash,
            supplierId,
            customerId,
            amount,
            paymentMode,
            notes: notes || 'Direct Udhaar settlement'
          }
        });

        // 2. FIFO Order Reconciliation: allocate payment to oldest unpaid active orders
        const unpaidOrders = await tx.order.findMany({
          where: {
            supplierId,
            customerId,
            balancePending: { gt: 0 },
            status: { in: acceptedStatuses }
          },
          orderBy: { createdAt: 'asc' }
        });

        let remaining = amount;
        for (const o of unpaidOrders) {
          if (remaining <= 0) break;
          const payTowardsOrder = Math.min(remaining, o.balancePending);
          const newPaid = money(o.amountPaid + payTowardsOrder);
          const newBal = money(o.balancePending - payTowardsOrder);

          await tx.order.update({
            where: { id: o.id },
            data: {
              amountPaid: newPaid,
              balancePending: newBal,
              paymentStatus: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID'
            }
          });

          remaining -= payTowardsOrder;
        }

        // 3. Atomically recalculate and persist customer ledger
        const ledger = await recalculateCustomerLedger(tx, supplierId, customerId);

        return { payment, ledger };
      });

      return {
        message: 'Udhaar payment recorded successfully',
        payment: result.payment,
        ledger: result.ledger
      };
    }
  );

  // Get customer specific Bahi-Khata chronological statement (orders + payments)
  fastify.get(
    '/ledger/:customerId',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Get customer specific chronological passbook statement (orders + payments)',
        params: z.object({ customerId: z.string() })
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { customerId } = request.params;

      const customer = await fastify.prisma.customer.findUnique({
        where: { id: customerId, orders: { some: { supplierId } } }
      });
      if (!customer) return reply.status(404).send({ error: 'Customer not found' });

      const ledger = await fastify.prisma.customerLedger.findUnique({
        where: {
          supplierId_customerId: { supplierId, customerId }
        }
      });

      const orders = await fastify.prisma.order.findMany({
        where: {
          supplierId,
          customerId,
          status: { in: acceptedStatuses }
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      });

      const payments = await fastify.prisma.paymentRecord.findMany({
        where: { supplierId, customerId },
        orderBy: { recordedAt: 'desc' }
      });

      // Combine orders (debits) and payments (credits) chronologically
      const statement = [
        ...orders.map((o) => ({
          id: o.id,
          type: 'ORDER_DEBIT' as const,
          date: o.createdAt.toISOString(),
          reference: o.orderNumber,
          amount: o.finalTotal,
          status: o.status,
          paymentStatus: o.paymentStatus,
          notes: `${o.items.length} materials (${o.deliveryAddress})`,
          items: o.items.map((i) => ({ name: i.masterProductName, qty: i.quantity, unit: i.unit, price: i.unitPrice }))
        })),
        ...payments.map((p) => ({
          id: p.id,
          type: 'PAYMENT_CREDIT' as const,
          date: p.recordedAt.toISOString(),
          reference: p.orderId ? 'Order Payment' : 'Direct Khata Settlement',
          amount: p.amount,
          status: 'SETTLED',
          paymentStatus: p.paymentMode,
          notes: p.notes || `Received via ${p.paymentMode}`,
          items: []
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        customer: {
          id: customer.id,
          name: customer.fullName,
          phone: customer.phone
        },
        ledger: {
          totalPurchased: ledger?.totalPurchased || 0,
          totalPaid: ledger?.totalPaid || 0,
          outstandingBalance: ledger?.outstandingBalance || 0
        },
        statement
      };
    }
  );

  // 6. Manual & Walk-in Order Entry (Roadmap Supplier Manual Operations)
  fastify.post(
    '/orders/manual',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Create a manual, phone, or walk-in yard order',
        body: CreateManualOrderInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const supplier = await fastify.prisma.supplier.findUnique({
        where: { id: supplierId }
      });
      if (!supplier) throw fastify.httpErrors.notFound('Supplier tenant not found');

      const {
        customerId: inputCustomerId,
        customerName,
        customerPhone,
        customerAddress,
        items,
        deliveryCharge,
        deliveryAddress,
        landmark,
        pincode,
        siteContactPhone,
        deliveryInstructions,
        vehicleNumber,
        driverName,
        driverPhone,
        amountPaid,
        paymentMode,
        paymentNotes,
        initialStatus
      } = request.body;

      const keyResult = z.string().min(8).max(128).safeParse(request.headers['idempotency-key']);
      if (!keyResult.success) throw fastify.httpErrors.badRequest('A unique Idempotency-Key header (8-128 characters) is required');
      const idempotencyKey = keyResult.data;
      const requestHash = createHash('sha256').update(JSON.stringify(request.body)).digest('hex');
      // Validate supplier products and calculate total upfront
      const supplierProducts = await fastify.prisma.supplierProduct.findMany({
        where: {
          id: { in: items.map((i) => i.supplierProductId) },
          supplierId
        },
        include: { masterProduct: true }
      });

      const spMap = new Map<string, any>(supplierProducts.map((sp) => [sp.id, sp]));

      let totalMaterialAmount = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        const sp = spMap.get(item.supplierProductId);
        if (!sp) {
          throw fastify.httpErrors.badRequest(`Product ${item.supplierProductId} not found in your inventory`);
        }
        const unitPrice = item.unitPrice ?? sp.sellingPrice;
        const totalPrice = money(unitPrice * item.quantity);
        totalMaterialAmount += totalPrice;

        orderItemsData.push({
          supplierProductId: sp.id,
          masterProductName: sp.masterProduct?.name || 'Material',
          unit: sp.unit || sp.masterProduct?.defaultUnit || 'UNIT',
          quantity: item.quantity,
          unitPrice,
          totalPrice
        });
      }

      const finalTotal = money(totalMaterialAmount + deliveryCharge);
      if (amountPaid > finalTotal || (paymentMode === 'UDHAAR' && amountPaid > 0) || (initialStatus === 'PENDING_APPROVAL' && amountPaid > 0)) {
        throw fastify.httpErrors.badRequest('Invalid upfront payment for this order');
      }
      const validAmountPaid = amountPaid;
      const balancePending = Math.max(0, money(finalTotal - validAmountPaid));

      let paymentStatus = 'PENDING';
      if (balancePending <= 0) {
        paymentStatus = 'PAID';
      } else if (validAmountPaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      } else if (paymentMode === 'UDHAAR') {
        paymentStatus = 'UDHAAR';
      }

      const orderNumber = `KLK-MAN-${randomUUID()}`;
      const challanNo =
        initialStatus === 'OUT_FOR_DELIVERY' || initialStatus === 'DELIVERED'
          ? `CHAL-${Date.now().toString().slice(-6)}`
          : undefined;

      // Execute entire walk-in / manual order flow inside an atomic transaction
      const order = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const previous = await tx.order.findUnique({ where: { supplierId_idempotencyKey: { supplierId, idempotencyKey } }, include: { customer: true, items: true, paymentRecords: true } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw fastify.httpErrors.conflict('Order key already used for a different request');
          return previous;
        }
        let targetCustomerId = inputCustomerId;

        // If no customerId provided, resolve or create Customer record
        if (!targetCustomerId) {
          if (!customerPhone || !customerName) {
            throw fastify.httpErrors.badRequest('Either customerId or both customerName and customerPhone are required');
          }

          let user = await tx.user.findUnique({
            where: { phone: customerPhone },
            include: { customer: true }
          });

          if (!user) {
            const tempPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
            user = await tx.user.create({
              data: {
                phone: customerPhone,
                passwordHash: tempPasswordHash,
                role: 'CUSTOMER',
                mustChangePassword: true, // Recovery requires administrator identity verification
                customer: {
                  create: {
                    fullName: customerName,
                    phone: customerPhone,
                    defaultDistrictId: supplier.districtId,
                    addresses: customerAddress
                      ? {
                          create: {
                            districtId: supplier.districtId,
                            addressLine: customerAddress,
                            landmark,
                            pincode,
                            isDefault: true
                          }
                        }
                      : undefined
                  }
                }
              },
              include: { customer: true }
            });
            targetCustomerId = user.customer!.id;
          } else if (user.customer) {
            const relationship = await tx.order.findFirst({ where: { supplierId, customerId: user.customer.id } });
            if (!relationship) throw fastify.httpErrors.badRequest('Existing customers must place an order with this yard before phone-based manual orders can be entered');
            targetCustomerId = user.customer.id;
          } else {
            throw fastify.httpErrors.badRequest('This phone belongs to a non-customer account');
          }
        } else {
          const customer = await tx.customer.findFirst({ where: { id: targetCustomerId, orders: { some: { supplierId } } } });
          if (!customer) throw fastify.httpErrors.badRequest('Customer not found in this yard');
        }

        if (initialStatus !== 'PENDING_APPROVAL') await reserveStock(tx, supplierId, items);

        // Create Order with items
        const createdOrder = await tx.order.create({
          data: {
            idempotencyKey, requestHash,
            orderNumber,
            customerId: targetCustomerId!,
            supplierId,
            districtId: supplier.districtId,
            totalMaterialAmount,
            deliveryCharge,
            finalTotal,
            amountPaid: validAmountPaid,
            balancePending,
            status: initialStatus,
            paymentStatus,
            deliveryAddress,
            landmark,
            pincode,
            deliveryInstructions,
            siteContactPhone,
            vehicleNumber,
            driverName,
            driverPhone,
            deliveryChallanNo: challanNo,
            dispatchedAt:
              initialStatus === 'OUT_FOR_DELIVERY' || initialStatus === 'DELIVERED' ? new Date() : null,
            deliveredAt: initialStatus === 'DELIVERED' ? new Date() : null,
            items: {
              create: orderItemsData
            }
          },
          include: { customer: true, items: true, paymentRecords: true }
        });

        // Record Payment if paid upfront
        if (validAmountPaid > 0) {
          await tx.paymentRecord.create({
            data: {
              supplierId,
              customerId: targetCustomerId!,
              orderId: createdOrder.id,
              amount: validAmountPaid,
              paymentMode,
              notes: paymentNotes || 'Upfront payment on manual order'
            }
          });
        }

        // Recalculate customer ledger accurately
        await recalculateCustomerLedger(tx, supplierId, targetCustomerId!);

        // Increment supplier order counter
        await tx.supplier.update({
          where: { id: supplierId },
          data: { totalOrdersCount: { increment: 1 } }
        });

        return createdOrder;
      });

      return reply.status(201).send({
        message: 'Manual order created successfully',
        order
      });
    }
  );

  // 7. Dispatch Delivery with Driver & Vehicle Assignment
  fastify.post(
    '/orders/:id/dispatch',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Dispatch order for delivery with driver and vehicle assignment',
        params: z.object({ id: z.string() }),
        body: DispatchDeliveryInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;
      const { driverName, driverPhone, vehicleNumber, deliveryChallanNo, deliveryInstructions } = request.body;

      const order = await fastify.prisma.order.findFirst({
        where: { id, supplierId },
        include: { items: true, customer: true }
      });
      if (!order) return reply.status(404).send({ error: 'Order not found' });

      const challan = deliveryChallanNo || `CHAL-${Date.now().toString().slice(-6)}`;

      const updated = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const order = await tx.order.findFirst({ where: { id, supplierId }, include: { items: true } });
        if (!order) throw fastify.httpErrors.notFound('Order not found');
        if (!['PENDING_APPROVAL', 'CONFIRMED', 'PREPARING'].includes(order.status)) throw fastify.httpErrors.badRequest(`Cannot dispatch ${order.status} order`);
        if (order.status === 'PENDING_APPROVAL') await reserveStock(tx, supplierId, order.items);

        // Auto-assign vehicle status to ON_TRIP
        if (vehicleNumber) {
          await tx.supplierVehicle.updateMany({
            where: { supplierId, vehicleNumber },
            data: { status: 'ON_TRIP' }
          });
        }

        const orderUpdated = await tx.order.update({
          where: { id },
          data: {
            status: 'OUT_FOR_DELIVERY',
            driverName,
            driverPhone,
            vehicleNumber,
            deliveryChallanNo: challan,
            deliveryInstructions: deliveryInstructions || order.deliveryInstructions,
            dispatchedAt: new Date()
          },
          include: { customer: true, items: true, paymentRecords: true }
        });

        // Recalculate customer ledger
        await recalculateCustomerLedger(tx, supplierId, order.customerId);

        return orderUpdated;
      });

      return {
        message: 'Order dispatched for delivery',
        order: updated,
        challanNumber: challan
      };
    }
  );

  // 8. Confirm Delivery Completion
  fastify.post(
    '/orders/:id/deliver',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Confirm order delivered at customer construction site',
        params: z.object({ id: z.string() }),
        body: CompleteDeliveryInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;
      const { receivedBy, notes } = request.body;

      const order = await fastify.prisma.order.findFirst({
        where: { id, supplierId },
        include: { items: true, customer: true }
      });
      if (!order) return reply.status(404).send({ error: 'Order not found' });

      const updated = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const order = await tx.order.findFirst({ where: { id, supplierId }, include: { items: true } });
        if (!order) throw fastify.httpErrors.notFound('Order not found');
        if (order.status !== 'OUT_FOR_DELIVERY') throw fastify.httpErrors.badRequest('Only dispatched orders can be delivered');
        // Release vehicle back to AVAILABLE status upon delivery
        if (order.vehicleNumber) {
          await tx.supplierVehicle.updateMany({
            where: { supplierId, vehicleNumber: order.vehicleNumber },
            data: { status: 'AVAILABLE' }
          });
        }

        const orderUpdated = await tx.order.update({
          where: { id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            deliveryInstructions: notes
              ? `${order.deliveryInstructions || ''} | Delivery note: ${notes} (Received by: ${receivedBy || 'Site Incharge'})`
              : order.deliveryInstructions
          },
          include: { customer: true, items: true, paymentRecords: true }
        });

        // Recalculate customer ledger accurately
        await recalculateCustomerLedger(tx, supplierId, order.customerId);

        return orderUpdated;
      });

      return {
        message: 'Order marked as delivered successfully',
        order: updated
      };
    }
  );

  // 9. Deliveries Hub (Active Dispatches, In-Transit, Recent Delivered)
  fastify.get(
    '/deliveries',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Get live dispatch, out for delivery, and completed delivery records'
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);

      const [readyToDispatch, outForDelivery, deliveredRecently] = await Promise.all([
        fastify.prisma.order.findMany({
          where: {
            supplierId,
            status: { in: ['CONFIRMED', 'PREPARING'] }
          },
          include: { customer: true, items: true },
          orderBy: { createdAt: 'desc' }
        }),
        fastify.prisma.order.findMany({
          where: {
            supplierId,
            status: 'OUT_FOR_DELIVERY'
          },
          include: { customer: true, items: true },
          orderBy: { dispatchedAt: 'desc' }
        }),
        fastify.prisma.order.findMany({
          where: {
            supplierId,
            status: 'DELIVERED'
          },
          include: { customer: true, items: true, paymentRecords: true },
          orderBy: { deliveredAt: 'desc' },
          take: 20
        })
      ]);

      return {
        readyToDispatch,
        outForDelivery,
        deliveredRecently,
        stats: {
          readyCount: readyToDispatch.length,
          onRoadCount: outForDelivery.length,
          deliveredCount: deliveredRecently.length
        }
      };
    }
  );

  // 10. Manual Payment Entry (Direct allocation to order or customer Udhaar)
  fastify.post(
    '/payments/manual',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Record manual customer payment (applied to order or general ledger)',
        body: z.object({
          customerId: z.string().min(1, 'Customer is required'),
          orderId: z.string().optional(),
          amount: z.number().positive().max(1_000_000_000).multipleOf(0.01),
          paymentMode: z.enum(['CASH', 'UPI_DIRECT', 'BANK_TRANSFER', 'CHEQUE', 'UDHAAR']),
          referenceNo: z.string().optional(),
          notes: z.string().optional()
        })
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);
      const { customerId, orderId, amount, paymentMode, referenceNo, notes } = request.body;

      const keyResult = z.string().min(8).max(128).safeParse(request.headers['idempotency-key']);
      if (!keyResult.success) throw fastify.httpErrors.badRequest('A unique Idempotency-Key header (8-128 characters) is required');
      const idempotencyKey = keyResult.data;
      const requestHash = createHash('sha256').update(JSON.stringify({ path: request.url, body: request.body })).digest('hex');
      if (paymentMode === 'UDHAAR') throw fastify.httpErrors.badRequest('Udhaar is credit, not a payment received');
      const paymentNoteText = [referenceNo ? `Ref: ${referenceNo}` : null, notes].filter(Boolean).join(' | ');

      const result = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        const previous = await tx.paymentRecord.findUnique({ where: { supplierId_idempotencyKey: { supplierId, idempotencyKey } } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw fastify.httpErrors.conflict('Payment key already used for a different request');
          return { payment: previous, order: orderId ? await tx.order.findUnique({ where: { id: orderId } }) : null, ledger: await recalculateCustomerLedger(tx, supplierId, customerId) };
        }
        const eligible = { supplierId, customerId, status: { in: acceptedStatuses } };
        if (orderId) {
          const order = await tx.order.findFirst({ where: { id: orderId, ...eligible } });
          if (!order || amount > money(order.balancePending)) throw fastify.httpErrors.badRequest('Order/customer mismatch or payment exceeds outstanding balance');
        } else {
          const due = await tx.order.aggregate({ where: eligible, _sum: { balancePending: true } });
          if (amount > money(due._sum.balancePending || 0)) throw fastify.httpErrors.badRequest('Payment exceeds outstanding balance for this yard');
        }
        // 1. Create Payment Record
        const payment = await tx.paymentRecord.create({
          data: {
            idempotencyKey, requestHash,
            supplierId,
            customerId,
            orderId: orderId || null,
            amount,
            paymentMode,
            notes: paymentNoteText || 'Manual payment entry'
          }
        });

        let updatedOrder = null;

        // 2. If specific order provided, update that order
        if (orderId) {
          const order = await tx.order.findFirst({
            where: { id: orderId, supplierId }
          });
          if (order) {
            const newPaid = money(order.amountPaid + amount);
            const newBalance = Math.max(0, money(order.finalTotal - newPaid));
            const paymentStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

            updatedOrder = await tx.order.update({
              where: { id: orderId },
              data: {
                amountPaid: newPaid,
                balancePending: newBalance,
                paymentStatus
              }
            });
          }
        } else {
          // FIFO Order Reconciliation across unpaid active orders
          const unpaidOrders = await tx.order.findMany({
            where: {
              supplierId,
              customerId,
              balancePending: { gt: 0 },
              status: { in: acceptedStatuses }
            },
            orderBy: { createdAt: 'asc' }
          });

          let remaining = amount;
          for (const o of unpaidOrders) {
            if (remaining <= 0) break;
            const payTowardsOrder = Math.min(remaining, o.balancePending);
            const newPaid = money(o.amountPaid + payTowardsOrder);
            const newBal = money(o.balancePending - payTowardsOrder);

            await tx.order.update({
              where: { id: o.id },
              data: {
                amountPaid: newPaid,
                balancePending: newBal,
                paymentStatus: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID'
              }
            });

            remaining -= payTowardsOrder;
          }
        }

        // 3. Atomically recalculate and persist customer ledger
        const ledger = await recalculateCustomerLedger(tx, supplierId, customerId);

        return { payment, order: updatedOrder, ledger };
      });

      return {
        message: 'Manual payment recorded successfully',
        payment: result.payment,
        order: result.order,
        ledger: result.ledger
      };
    }
  );

  // 11. Supplier Customers List (for quick select in Manual Orders and Payments)
  fastify.get(
    '/customers',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'List customers who have dealt with this supplier'
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);
      const ledgers = await fastify.prisma.customerLedger.findMany({
        where: { supplierId },
        include: {
          customer: {
            include: { orders: { where: { supplierId }, orderBy: { createdAt: 'desc' }, take: 1, select: { deliveryAddress: true, landmark: true, pincode: true } } }
          }
        },
        orderBy: { customer: { fullName: 'asc' } }
      });

      // Also include any customer from orders who might not yet be in ledger
      const orderCustomers = await fastify.prisma.order.findMany({
        where: { supplierId },
        select: {
          customer: {
            include: { orders: { where: { supplierId }, orderBy: { createdAt: 'desc' }, take: 1, select: { deliveryAddress: true, landmark: true, pincode: true } } }
          }
        },
        distinct: ['customerId']
      });

      const customerMap = new Map<string, any>();

      for (const l of ledgers) {
        customerMap.set(l.customer.id, {
          id: l.customer.id,
          fullName: l.customer.fullName,
          phone: l.customer.phone,
          address: l.customer.orders[0]?.deliveryAddress || '',
          landmark: l.customer.orders[0]?.landmark || '',
          pincode: l.customer.orders[0]?.pincode || '',
          outstandingBalance: l.outstandingBalance,
          totalPurchased: l.totalPurchased
        });
      }

      for (const oc of orderCustomers) {
        if (!customerMap.has(oc.customer.id)) {
          customerMap.set(oc.customer.id, {
            id: oc.customer.id,
            fullName: oc.customer.fullName,
            phone: oc.customer.phone,
            address: oc.customer.orders[0]?.deliveryAddress || '',
            landmark: oc.customer.orders[0]?.landmark || '',
            pincode: oc.customer.orders[0]?.pincode || '',
            outstandingBalance: 0,
            totalPurchased: 0
          });
        }
      }

      return {
        customers: Array.from(customerMap.values())
      };
    }
  );

  // 12. Supplier Fleet / Vehicles Management
  fastify.get(
    '/vehicles',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'List all delivery fleet vehicles for supplier'
      }
    },
    async (request) => {
      const supplierId = getSupplierId(request);

      const vehicles = await fastify.prisma.supplierVehicle.findMany({
        where: { supplierId },
        orderBy: { createdAt: 'desc' }
      });

      return { vehicles };
    }
  );

  fastify.post(
    '/vehicles',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Add a new delivery vehicle to yard fleet',
        body: CreateSupplierVehicleInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { vehicleNumber, vehicleType, driverName, driverPhone, capacityInfo, status } = request.body;

      const vehicle = await fastify.prisma.supplierVehicle.create({
        data: {
          supplierId,
          vehicleNumber,
          vehicleType,
          driverName: driverName || null,
          driverPhone: driverPhone || null,
          capacityInfo: capacityInfo || null,
          status: status || 'AVAILABLE'
        }
      });

      return reply.status(201).send({ vehicle });
    }
  );

  fastify.patch(
    '/vehicles/:id',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Update vehicle details or availability status',
        params: z.object({ id: z.string() }),
        body: UpdateSupplierVehicleInputSchema
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;

      const existing = await fastify.prisma.supplierVehicle.findFirst({
        where: { id, supplierId }
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Vehicle not found in your yard fleet' });
      }

      const vehicle = await fastify.prisma.supplierVehicle.update({
        where: { id },
        data: request.body
      });

      return { vehicle };
    }
  );

  fastify.delete(
    '/vehicles/:id',
    {
      schema: {
        tags: ['Supplier Tenant'],
        summary: 'Remove vehicle from yard fleet',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const supplierId = getSupplierId(request);
      const { id } = request.params;

      const existing = await fastify.prisma.supplierVehicle.findFirst({
        where: { id, supplierId }
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Vehicle not found in your yard fleet' });
      }

      await fastify.prisma.supplierVehicle.delete({
        where: { id }
      });

      return { success: true, message: 'Vehicle removed from fleet' };
    }
  );
};

