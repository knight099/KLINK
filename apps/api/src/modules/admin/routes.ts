import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AdminCreateSupplierInputSchema } from '@klink/shared-types';

export const adminRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // All admin routes require ADMIN role
  fastify.addHook('onRequest', fastify.requireRole('ADMIN'));

  // Marketplace Overview & Metrics (Roadmap Section 29)
  fastify.get(
    '/metrics',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Platform-wide marketplace metrics and GMV'
      }
    },
    async () => {
      const [
        totalSuppliers,
        activeSuppliers,
        totalCustomers,
        totalOrders,
        gmvAgg,
        ordersByStatus,
        districts
      ] = await Promise.all([
        fastify.prisma.supplier.count(),
        fastify.prisma.supplier.count({ where: { status: 'ACTIVE' } }),
        fastify.prisma.customer.count(),
        fastify.prisma.order.count(),
        fastify.prisma.order.aggregate({
          where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
          _sum: { finalTotal: true }
        }),
        fastify.prisma.order.groupBy({
          by: ['status'],
          _count: { id: true }
        }),
        fastify.prisma.district.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { suppliers: true, orders: true } }
          }
        })
      ]);

      return {
        metrics: {
          totalSuppliers,
          activeSuppliers,
          totalCustomers,
          totalOrders,
          grossMarketplaceValue: gmvAgg._sum.finalTotal || 0
        },
        ordersByStatus,
        districtBreakdown: districts
      };
    }
  );

  // Supplier Management: List suppliers
  fastify.get(
    '/suppliers',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'List all onboarded and pending suppliers',
        querystring: z.object({
          status: z.string().optional()
        })
      }
    },
    async (request) => {
      const { status } = request.query;
      const where: any = {};
      if (status) {
        where.status = status;
      }

      const suppliers = await fastify.prisma.supplier.findMany({
        where,
        include: {
          district: true,
          _count: { select: { products: true, orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { suppliers };
    }
  );

  // Admin: Create New Supplier with First-Time Credentials (must change password after login)
  fastify.post(
    '/suppliers',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Admin: Create a new supplier with initial credentials and forced password change on first login',
        body: AdminCreateSupplierInputSchema
      }
    },
    async (request, reply) => {
      const {
        phone,
        temporaryPassword,
        businessName,
        ownerName,
        districtId,
        address,
        gstin,
        logoUrl,
        description
      } = request.body;

      const existing = await fastify.prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return reply.status(400).send({ error: 'Phone number already registered on platform' });
      }

      const district = await fastify.prisma.district.findUnique({ where: { id: districtId } });
      if (!district) {
        return reply.status(400).send({ error: 'Selected district not found' });
      }

      const passwordHash = await bcrypt.hash(temporaryPassword, 10);

      const user = await fastify.prisma.user.create({
        data: {
          phone,
          passwordHash,
          role: 'SUPPLIER',
          mustChangePassword: true, // Forces password change on first login!
          supplier: {
            create: {
              businessName,
              ownerName,
              phone,
              address,
              districtId,
              gstin,
              logoUrl,
              description,
              status: 'ACTIVE',
              isVerified: true,
              serviceAreas: {
                create: { districtId }
              }
            }
          }
        },
        include: { supplier: true }
      });

      return reply.status(201).send({
        message: 'Supplier created successfully with first-time temporary password',
        supplier: user.supplier,
        credentials: {
          phone,
          temporaryPassword,
          mustChangePassword: true
        }
      });
    }
  );

  // Approve / Suspend / Reject Supplier
  fastify.patch(
    '/suppliers/:id/status',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Approve, suspend, or reject a supplier application',
        params: z.object({ id: z.string() }),
        body: z.object({
          status: z.enum(['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'REJECTED']),
          isVerified: z.boolean().optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const { status, isVerified } = request.body;

      const supplier = await fastify.prisma.supplier.update({
        where: { id },
        data: {
          status,
          isVerified: isVerified !== undefined ? isVerified : status === 'ACTIVE'
        }
      });

      return {
        message: `Supplier status changed to ${status}`,
        supplier
      };
    }
  );

  // Edit Full Supplier Profile
  fastify.patch(
    '/suppliers/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Update supplier yard profile and credentials',
        params: z.object({ id: z.string() }),
        body: z.object({
          businessName: z.string().optional(),
          ownerName: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          gstin: z.string().optional(),
          districtId: z.string().optional(),
          status: z.enum(['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'REJECTED']).optional(),
          isVerified: z.boolean().optional(),
          rating: z.number().optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const existing = await fastify.prisma.supplier.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Supplier not found' });
      }

      // If phone changed, sync user record phone too
      if (data.phone && data.phone !== existing.phone) {
        await fastify.prisma.user.update({
          where: { id: existing.userId },
          data: { phone: data.phone }
        });
      }

      const updated = await fastify.prisma.supplier.update({
        where: { id },
        data,
        include: { district: true }
      });

      return { message: 'Supplier profile updated successfully', supplier: updated };
    }
  );

  // View Specific Supplier's Products
  fastify.get(
    '/suppliers/:id/products',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: View all products and inventory for a specific yard',
        params: z.object({ id: z.string() })
      }
    },
    async (request) => {
      const { id } = request.params;
      const products = await fastify.prisma.supplierProduct.findMany({
        where: { supplierId: id },
        include: {
          masterProduct: {
            include: { category: true, brand: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return { products };
    }
  );

  // Founder: Fix / Edit Supplier Product (Rates & Stock)
  fastify.patch(
    '/supplier-products/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Correct rate or stock mistakes for a supplier product',
        params: z.object({ id: z.string() }),
        body: z.object({
          sellingPrice: z.number().optional(),
          stockQuantity: z.number().optional(),
          deliveryFee: z.number().optional(),
          minOrderQty: z.number().optional(),
          isAvailable: z.boolean().optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const updated = await fastify.prisma.supplierProduct.update({
        where: { id },
        data,
        include: { masterProduct: true }
      });

      return { message: 'Product updated successfully', product: updated };
    }
  );

  // View all platform orders
  fastify.get(
    '/orders',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'View all orders across all districts and suppliers',
        querystring: z.object({
          status: z.string().optional(),
          supplierId: z.string().optional(),
          customerId: z.string().optional(),
          search: z.string().optional()
        })
      }
    },
    async (request) => {
      const { status, supplierId, customerId, search } = request.query;
      const where: any = {};

      if (status && status !== 'ALL') where.status = status;
      if (supplierId) where.supplierId = supplierId;
      if (customerId) where.customerId = customerId;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { deliveryAddress: { contains: search } },
          { siteContactPhone: { contains: search } },
          { customer: { fullName: { contains: search } } },
          { supplier: { businessName: { contains: search } } }
        ];
      }

      const orders = await fastify.prisma.order.findMany({
        where,
        include: {
          supplier: true,
          customer: true,
          district: true,
          items: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      return { orders };
    }
  );

  // Founder: Fix / Override Order Mistakes
  fastify.patch(
    '/orders/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Intervene and fix order mistakes (status, address, phone, transport details, amounts)',
        params: z.object({ id: z.string() }),
        body: z.object({
          status: z.enum([
            'PENDING_APPROVAL',
            'CONFIRMED',
            'PREPARING',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'COMPLETED',
            'CANCELLED',
            'REJECTED'
          ]).optional(),
          deliveryAddress: z.string().optional(),
          siteContactPhone: z.string().optional(),
          vehicleNumber: z.string().optional(),
          driverName: z.string().optional(),
          driverPhone: z.string().optional(),
          deliveryChallanNo: z.string().optional(),
          deliveryInstructions: z.string().optional(),
          rejectionReason: z.string().optional(),
          finalTotal: z.number().optional(),
          balancePending: z.number().optional(),
          paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const updateData = request.body;

      const order = await fastify.prisma.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      return await fastify.prisma.$transaction(async (tx) => {
        // Stock reconciliation if status is changed
        if (updateData.status && updateData.status !== order.status) {
          const oldStatus = order.status;
          const newStatus = updateData.status;

          const isOldDead = ['CANCELLED', 'REJECTED'].includes(oldStatus);
          const isNewDead = ['CANCELLED', 'REJECTED'].includes(newStatus);

          // If transitioning from active to dead: restore stock and zero balancePending
          if (!isOldDead && isNewDead) {
            for (const item of order.items) {
              await tx.supplierProduct.update({
                where: { id: item.supplierProductId },
                data: { stockQuantity: { increment: item.quantity } }
              });
            }
            if (updateData.balancePending === undefined) {
              updateData.balancePending = 0;
            }
          }
          // If reviving from dead back to active: decrement stock again!
          else if (isOldDead && !isNewDead) {
            for (const item of order.items) {
              await tx.supplierProduct.update({
                where: { id: item.supplierProductId },
                data: { stockQuantity: { decrement: item.quantity } }
              });
            }
            if (updateData.balancePending === undefined) {
              updateData.balancePending = updateData.finalTotal || order.finalTotal;
            }
          }
        }

        const updated = await tx.order.update({
          where: { id },
          data: updateData,
          include: {
            supplier: true,
            customer: true,
            items: true
          }
        });

        return { message: 'Order successfully corrected by administrator', order: updated };
      });
    }
  );

  // User Management: List all platform users
  fastify.get(
    '/users',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: List all registered platform accounts (Customers, Suppliers, Admins)'
      }
    },
    async () => {
      const users = await fastify.prisma.user.findMany({
        select: {
          id: true,
          phone: true,
          role: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              ledgers: {
                select: {
                  outstandingBalance: true
                }
              },
              _count: { select: { orders: true } }
            }
          },
          supplier: {
            select: {
              id: true,
              businessName: true,
              ownerName: true,
              status: true,
              isVerified: true,
              _count: { select: { orders: true, products: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { users };
    }
  );

  // Founder: Edit User / Reset Password Directly
  fastify.patch(
    '/users/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Reset user password, change phone, or toggle force password change',
        params: z.object({ id: z.string() }),
        body: z.object({
          phone: z.string().optional(),
          newPassword: z.string().min(6).optional(),
          role: z.enum(['CUSTOMER', 'SUPPLIER', 'ADMIN']).optional(),
          mustChangePassword: z.boolean().optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const { phone, newPassword, role, mustChangePassword } = request.body;

      const user = await fastify.prisma.user.findUnique({
        where: { id },
        include: { supplier: true, customer: true }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      const updateData: any = {};
      if (phone) updateData.phone = phone;
      if (role) updateData.role = role;
      if (mustChangePassword !== undefined) updateData.mustChangePassword = mustChangePassword;

      if (newPassword) {
        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      const updated = await fastify.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          phone: true,
          role: true,
          mustChangePassword: true,
          updatedAt: true
        }
      });

      // Keep supplier/customer phone synced if changed
      if (phone) {
        if (user.supplier) {
          await fastify.prisma.supplier.update({
            where: { id: user.supplier.id },
            data: { phone }
          });
        }
        if (user.customer) {
          await fastify.prisma.customer.update({
            where: { id: user.customer.id },
            data: { phone }
          });
        }
      }

      return { message: 'User updated successfully by administrator', user: updated };
    }
  );

  // Founder: Delete User Account
  fastify.delete(
    '/users/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Delete user account (with cascade safety check)',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const { id } = request.params;

      if (request.user.id === id) {
        return reply.status(400).send({ error: 'Cannot delete your own admin account!' });
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id },
        include: {
          customer: { include: { orders: true } },
          supplier: { include: { orders: true } }
        }
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Check if user has orders that cannot be deleted
      const orderCount = (user.customer?.orders.length || 0) + (user.supplier?.orders.length || 0);
      if (orderCount > 0) {
        return reply.status(400).send({
          error: `Cannot delete user with ${orderCount} existing orders on record. Suspend the user or archive their data instead.`
        });
      }

      await fastify.prisma.$transaction(async (tx) => {
        if (user.customer) {
          await tx.customerAddress.deleteMany({ where: { customerId: user.customer.id } });
          await tx.customerLedger.deleteMany({ where: { customerId: user.customer.id } });
          await tx.customer.delete({ where: { id: user.customer.id } });
        }
        if (user.supplier) {
          await tx.supplierProduct.deleteMany({ where: { supplierId: user.supplier.id } });
          await tx.supplierVehicle.deleteMany({ where: { supplierId: user.supplier.id } });
          await tx.supplierServiceArea.deleteMany({ where: { supplierId: user.supplier.id } });
          await tx.customerLedger.deleteMany({ where: { supplierId: user.supplier.id } });
          await tx.supplier.delete({ where: { id: user.supplier.id } });
        }
        await tx.user.delete({ where: { id } });
      });

      return { message: 'User account and associated profile deleted successfully' };
    }
  );

  // Consumer Management: List all customers
  fastify.get(
    '/customers',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: List all registered contractors and homeowners'
      }
    },
    async () => {
      const [customers, districts] = await Promise.all([
        fastify.prisma.customer.findMany({
          include: {
            addresses: {
              include: { district: true }
            },
            ledgers: true,
            _count: { select: { orders: true } },
            orders: {
              where: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
              select: { finalTotal: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        fastify.prisma.district.findMany()
      ]);

      const districtMap = new Map<string, any>(districts.map((d: any) => [d.id, d]));

      const formatted = customers.map((c) => {
        const district = districtMap.get(c.defaultDistrictId);
        return {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          district: district || { id: c.defaultDistrictId, name: 'Darbhanga' },
          defaultDistrict: district?.name || 'Darbhanga',
          outstandingBalance: c.ledgers.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0),
          totalOrders: c._count.orders,
          totalSpent: c.orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0),
          totalSpend: c.orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0),
          createdAt: c.createdAt,
          addresses: c.addresses
        };
      });

      return { customers: formatted };
    }
  );

  // Founder: Edit Customer Details
  fastify.patch(
    '/customers/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Edit customer name, phone, or default district',
        params: z.object({ id: z.string() }),
        body: z.object({
          fullName: z.string().optional(),
          phone: z.string().optional(),
          defaultDistrictId: z.string().optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = request.body;

      const customer = await fastify.prisma.customer.findUnique({ where: { id } });
      if (!customer) {
        return reply.status(404).send({ error: 'Customer not found' });
      }

      if (data.phone && data.phone !== customer.phone) {
        await fastify.prisma.user.update({
          where: { id: customer.userId },
          data: { phone: data.phone }
        });
      }

      const updated = await fastify.prisma.customer.update({
        where: { id },
        data
      });

      return { message: 'Customer updated successfully', customer: updated };
    }
  );

  // Founder: Direct Udhaar Balance Adjustment
  fastify.patch(
    '/customers/:id/balance',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Correct contractor Udhaar balance in case of dispute or ledger typo',
        params: z.object({ id: z.string() }),
        body: z.object({
          newBalance: z.number().min(0),
          adjustmentReason: z.string().optional(),
          reason: z.string().optional(),
          supplierId: z.string().optional()
        })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const { newBalance, adjustmentReason, reason, supplierId } = request.body;
      const note = adjustmentReason || reason || 'Manual adjustment by platform admin';

      const customer = await fastify.prisma.customer.findUnique({
        where: { id },
        include: { ledgers: true }
      });
      if (!customer) {
        return reply.status(404).send({ error: 'Customer not found' });
      }

      let targetSupplierId = supplierId;
      if (!targetSupplierId && customer.ledgers.length > 0) {
        targetSupplierId = customer.ledgers[0].supplierId;
      }
      if (!targetSupplierId) {
        const firstSupplier = await fastify.prisma.supplier.findFirst();
        if (firstSupplier) targetSupplierId = firstSupplier.id;
      }

      if (targetSupplierId) {
        await fastify.prisma.customerLedger.upsert({
          where: {
            supplierId_customerId: {
              supplierId: targetSupplierId,
              customerId: id
            }
          },
          create: {
            supplierId: targetSupplierId,
            customerId: id,
            outstandingBalance: newBalance,
            totalPurchased: newBalance,
            totalPaid: 0
          },
          update: {
            outstandingBalance: newBalance
          }
        });
      }

      return {
        message: `Customer Udhaar balance adjusted to ₹${newBalance.toLocaleString('en-IN')}`,
        customer,
        reason: note
      };
    }
  );

  // View All Payment Records
  fastify.get(
    '/payments',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: View recent payment records across all dealer yards'
      }
    },
    async () => {
      const payments = await fastify.prisma.paymentRecord.findMany({
        include: {
          supplier: { select: { id: true, businessName: true } },
          customer: { select: { id: true, fullName: true, phone: true } },
          order: { select: { id: true, orderNumber: true } }
        },
        orderBy: { recordedAt: 'desc' },
        take: 100
      });

      return { payments };
    }
  );

  // Founder: Delete Erroneous Payment Record
  fastify.delete(
    '/payments/:id',
    {
      schema: {
        tags: ['Admin Portal'],
        summary: 'Founder: Delete a wrongly recorded payment and recalculate customer ledger',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const { id } = request.params;

      const payment = await fastify.prisma.paymentRecord.findUnique({ where: { id } });
      if (!payment) {
        return reply.status(404).send({ error: 'Payment record not found' });
      }

      await fastify.prisma.$transaction(async (tx) => {
        // Delete payment
        await tx.paymentRecord.delete({ where: { id } });

        // If linked to an order, restore balancePending on that order
        if (payment.orderId) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              balancePending: { increment: payment.amount }
            }
          });
        }

        // Recalculate customer total ledger
        const allPayments = await tx.paymentRecord.aggregate({
          where: { supplierId: payment.supplierId, customerId: payment.customerId },
          _sum: { amount: true }
        });
        const totalPaid = allPayments._sum.amount || 0;

        const allOrders = await tx.order.aggregate({
          where: {
            supplierId: payment.supplierId,
            customerId: payment.customerId,
            status: { notIn: ['REJECTED', 'CANCELLED'] }
          },
          _sum: { finalTotal: true }
        });
        const totalPurchased = allOrders._sum.finalTotal || 0;
        const currentBalance = Math.max(0, totalPurchased - totalPaid);

        await tx.customerLedger.upsert({
          where: {
            supplierId_customerId: {
              supplierId: payment.supplierId,
              customerId: payment.customerId
            }
          },
          create: {
            supplierId: payment.supplierId,
            customerId: payment.customerId,
            totalPurchased,
            totalPaid,
            outstandingBalance: currentBalance
          },
          update: {
            totalPurchased,
            totalPaid,
            outstandingBalance: currentBalance
          }
        });
      });

      return { message: 'Payment record removed and customer ledger recalculated successfully' };
    }
  );
};
