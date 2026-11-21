import { buildCheckout, checkoutQuoteStatus, type DeliverySchedule, scheduleFromOffer } from '../../lib/yard-delivery';
import { createHash, randomUUID } from 'node:crypto';
import { lockSupplier } from '../../lib/orders';
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

      const key = z.string().min(8).max(128).optional().safeParse(request.headers['idempotency-key']);
      if (!key.success) throw fastify.httpErrors.badRequest('Invalid Idempotency-Key header');
      const idempotencyKey = key.data
        ? 'customer:' + createHash('sha256').update(JSON.stringify([customerId, key.data])).digest('hex')
        : undefined;
      const { quoteToken, ...orderIntent } = request.body;
      const requestHash = idempotencyKey
        ? createHash('sha256').update(JSON.stringify(orderIntent)).digest('hex')
        : undefined;

      const order = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, supplierId);
        if (idempotencyKey) {
          const existing = await tx.order.findUnique({
            where: { supplierId_idempotencyKey: { supplierId, idempotencyKey } },
            include: { items: true, supplier: true }
          });
          if (existing) {
            if (existing.customerId !== customerId || existing.requestHash !== requestHash) {
              throw fastify.httpErrors.conflict('Order key already used for a different request');
            }
            return existing;
          }
        }

        // 1. Validate supplier
        const intent = { supplierId, districtId, pincode, items };
        const quote = await buildCheckout(tx, intent);
        const { lines: orderItemsData, materialTotal: totalMaterialAmount, deliveryCharge: maxDeliveryCharge, finalTotal } = quote;
        const quoteStatus = checkoutQuoteStatus(quoteToken, intent, quote);
        if (quoteStatus === 'CHANGED') {
          const id = createHash('sha256').update(JSON.stringify([customerId, quoteToken])).digest('hex');
          await tx.yardQuoteChange.createMany({ data: [{ id }], skipDuplicates: true });
        }
        if (quoteStatus !== 'CURRENT') return null;

        // Generate collision-proof order number: KLK-<DISTRICT>-YYMMDD-<RANDOM>
        const district = await tx.district.findUnique({ where: { id: districtId } });
        const districtCode = district?.code.substring(0, 3) || 'DRB';
        const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const randSuffix = randomUUID();
        const orderNumber = `KLK-${districtCode}-${datePrefix}-${randSuffix}`;

        // 4. Create Order in PENDING_APPROVAL state (Roadmap Section 11)
        return tx.order.create({
          data: {
            orderNumber,
            idempotencyKey,
            requestHash,
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
            ...(quote.offer && { deliverySchedule: scheduleFromOffer(quote.offer) }),
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
      });

      if (!order) throw fastify.httpErrors.conflict('The quote expired or changed. Review the latest quote before placing the order.');
      return reply.status(201).send({
        message: 'Order placed successfully. Waiting for supplier approval.',
        order
      });
    }
  );

  fastify.post('/orders/:id/delivery-window/approve', {
    schema: { params: z.object({ id: z.string() }), body: z.object({ startsAt: z.string(), endsAt: z.string() }) }
  }, async (request) => {
    const { id } = request.params;
    const selector = { id, customerId: request.user.customerId ?? '' };
    const existing = await fastify.prisma.order.findFirst({ where: selector });
    if (!existing) throw fastify.httpErrors.notFound('Order not found');
    return fastify.prisma.$transaction(async tx => {
      await lockSupplier(tx, existing.supplierId);
      const order = await tx.order.findFirstOrThrow({ where: selector });
      const schedule = order.deliverySchedule as DeliverySchedule | null;
      const proposed = schedule?.proposed;
      if (!schedule || !proposed || !['PENDING_APPROVAL', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status) ||
          proposed.startsAt !== request.body.startsAt || proposed.endsAt !== request.body.endsAt || Date.parse(proposed.endsAt) <= Date.now()) {
        throw fastify.httpErrors.conflict('This delivery window is no longer available');
      }
      delete schedule.proposed;
      if (order.status === 'PENDING_APPROVAL') {
        schedule.requested = proposed;
        schedule.respondBy = new Date(Date.now() + 3_600_000).toISOString();
      } else {
        schedule.confirmed = proposed;
      }
      schedule.events.push({ type: 'BUYER_APPROVED', at: new Date().toISOString(), window: proposed });
      return { order: await tx.order.update({ where: { id }, data: { deliverySchedule: schedule } }) };
    });
  });

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

      const updated = await fastify.prisma.$transaction(async (tx) => {
        await lockSupplier(tx, order.supplierId);
        const result = await tx.order.updateMany({ where: { id, customerId, status: 'PENDING_APPROVAL' }, data: { status: 'CANCELLED', balancePending: 0, rejectionReason: 'Cancelled by customer' } });
        if (!result.count) throw fastify.httpErrors.conflict('Order was already accepted or cancelled');
        return tx.order.findUniqueOrThrow({ where: { id } });
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

