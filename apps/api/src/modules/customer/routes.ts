import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateOrderInputSchema } from '@klink/shared-types';

export const customerRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // All customer routes require CUSTOMER role
  fastify.addHook('onRequest', fastify.requireRole('CUSTOMER'));

  // Place single-supplier order
  fastify.post(
    '/orders',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'Place single-supplier cart order',
        body: CreateOrderInputSchema
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId;
      if (!customerId) {
        return reply.status(400).send({ error: 'Customer profile not found for user' });
      }

      const {
        supplierId,
        districtId,
        items,
        deliveryAddress,
        landmark,
        pincode,
        deliveryInstructions,
        siteContactPhone
      } = request.body;

      // 1. Validate supplier
      const supplier = await fastify.prisma.supplier.findUnique({
        where: { id: supplierId, status: 'ACTIVE' }
      });
      if (!supplier) {
        return reply.status(400).send({ error: 'Supplier not found or not currently active' });
      }

      // 2. Fetch all supplier products and validate single-supplier constraint
      const supplierProductIds = items.map((i) => i.supplierProductId);
      const supplierProducts = await fastify.prisma.supplierProduct.findMany({
        where: {
          id: { in: supplierProductIds },
          supplierId
        },
        include: { masterProduct: true }
      });

      if (supplierProducts.length !== items.length) {
        return reply.status(400).send({
          error: 'All ordered items must belong to the selected supplier (1 cart = 1 supplier)'
        });
      }

      // 3. Calculate totals & build order items
      let totalMaterialAmount = 0;
      let maxDeliveryCharge = 0; // Or sum if individual, standard is fixed trip charge
      const orderItemsData: any[] = [];

      for (const item of items) {
        const sp = supplierProducts.find((p) => p.id === item.supplierProductId);
        if (!sp) continue;

        if (item.quantity < sp.minOrderQty) {
          return reply.status(400).send({
            error: `Minimum order quantity for ${sp.masterProduct.name} is ${sp.minOrderQty} ${sp.unit}`
          });
        }

        const itemTotal = sp.sellingPrice * item.quantity;
        totalMaterialAmount += itemTotal;
        if (sp.deliveryCharge > maxDeliveryCharge) {
          maxDeliveryCharge = sp.deliveryCharge;
        }

        orderItemsData.push({
          supplierProductId: sp.id,
          masterProductName: sp.masterProduct.name,
          unit: sp.unit,
          quantity: item.quantity,
          unitPrice: sp.sellingPrice,
          totalPrice: itemTotal
        });
      }

      const finalTotal = totalMaterialAmount + maxDeliveryCharge;

      // Generate collision-proof order number: KLK-<DISTRICT>-YYMMDD-<RANDOM>
      const district = await fastify.prisma.district.findUnique({ where: { id: districtId } });
      const districtCode = district?.code.substring(0, 3) || 'DRB';
      const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `KLK-${districtCode}-${datePrefix}-${randSuffix}`;

      // 4. Create Order in PENDING_APPROVAL state (Roadmap Section 11)
      const order = await fastify.prisma.order.create({
        data: {
          orderNumber,
          customerId,
          supplierId,
          districtId,
          totalMaterialAmount,
          deliveryCharge: maxDeliveryCharge,
          finalTotal,
          amountPaid: 0,
          balancePending: finalTotal,
          status: 'PENDING_APPROVAL',
          paymentStatus: 'PENDING',
          deliveryAddress,
          landmark,
          pincode,
          deliveryInstructions,
          siteContactPhone,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true,
          supplier: true
        }
      });

      return reply.status(201).send({
        message: 'Order placed successfully. Waiting for supplier approval.',
        order
      });
    }
  );

  // Customer order history
  fastify.get(
    '/orders',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'List customer orders with status'
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId;
      if (!customerId) {
        return reply.status(400).send({ error: 'Customer profile missing' });
      }

      const [orders, ledgers] = await Promise.all([
        fastify.prisma.order.findMany({
          where: { customerId },
          include: {
            supplier: true,
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        fastify.prisma.customerLedger.findMany({
          where: { customerId }
        })
      ]);

      const totalOutstanding = ledgers.reduce((acc, l) => acc + (l.outstandingBalance || 0), 0);
      const totalPurchased = ledgers.reduce((acc, l) => acc + (l.totalPurchased || 0), 0);
      const totalPaid = ledgers.reduce((acc, l) => acc + (l.totalPaid || 0), 0);

      return { orders, summary: { totalOutstanding, totalPurchased, totalPaid } };
    }
  );

  // Customer order details
  fastify.get(
    '/orders/:id',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'Get single order details and fulfillment timeline',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId;
      const { id } = request.params;

      const order = await fastify.prisma.order.findFirst({
        where: { id, customerId },
        include: {
          supplier: true,
          items: true,
          paymentRecords: true
        }
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      return { order };
    }
  );

  // Cancel Pending Order (Customer Self-Service before confirmation)
  fastify.post(
    '/orders/:id/cancel',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'Cancel an order before supplier acceptance',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId;
      const { id } = request.params;

      const order = await fastify.prisma.order.findFirst({
        where: { id, customerId }
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      if (order.status !== 'PENDING_APPROVAL') {
        return reply.status(400).send({
          error: `Cannot cancel order with status ${order.status}. Contact supplier yard directly.`
        });
      }

      const updated = await fastify.prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          balancePending: 0,
          rejectionReason: 'Cancelled by customer before supplier dispatch'
        }
      });

      return {
        message: 'Order cancelled successfully',
        order: updated
      };
    }
  );

  // Saved addresses
  fastify.get(
    '/addresses',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'List saved construction site delivery addresses'
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId;
      const addresses = await fastify.prisma.customerAddress.findMany({
        where: { customerId },
        include: { district: true },
        orderBy: { createdAt: 'desc' }
      });
      return { addresses };
    }
  );

  // Add new construction site address
  fastify.post(
    '/addresses',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'Save a new construction site delivery address',
        body: z.object({
          addressLine: z.string().min(5),
          landmark: z.string().optional(),
          pincode: z.string().optional(),
          districtId: z.string().optional(),
          isDefault: z.boolean().optional()
        })
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId!;
      const { addressLine, landmark, pincode, districtId, isDefault } = request.body;

      // Fallback to customer's default district if not provided
      let targetDistrictId = districtId;
      if (!targetDistrictId) {
        const customer = await fastify.prisma.customer.findUnique({
          where: { id: customerId }
        });
        targetDistrictId = customer?.defaultDistrictId;
      }

      if (!targetDistrictId) {
        const firstDistrict = await fastify.prisma.district.findFirst({ where: { isActive: true } });
        targetDistrictId = firstDistrict?.id;
      }

      if (isDefault) {
        await fastify.prisma.customerAddress.updateMany({
          where: { customerId },
          data: { isDefault: false }
        });
      }

      const address = await fastify.prisma.customerAddress.create({
        data: {
          customerId,
          districtId: targetDistrictId!,
          addressLine,
          landmark,
          pincode,
          isDefault: isDefault ?? false
        },
        include: { district: true }
      });

      return reply.status(201).send({
        message: 'Site address saved successfully',
        address
      });
    }
  );

  // Delete saved site address
  fastify.delete(
    '/addresses/:id',
    {
      schema: {
        tags: ['Customer Orders'],
        summary: 'Delete a saved construction site address',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const customerId = request.user.customerId!;
      const { id } = request.params;

      const existing = await fastify.prisma.customerAddress.findFirst({
        where: { id, customerId }
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Address not found' });
      }

      await fastify.prisma.customerAddress.delete({ where: { id } });

      return {
        success: true,
        message: 'Site address removed'
      };
    }
  );
};

