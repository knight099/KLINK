import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const marketplaceRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // List suppliers in a district
  fastify.get(
    '/suppliers',
    {
      schema: {
        tags: ['Marketplace'],
        summary: 'List active suppliers in a district',
        querystring: z.object({
          districtId: z.string().optional(),
          districtCode: z.string().optional()
        })
      }
    },
    async (request) => {
      const { districtId, districtCode } = request.query;

      const where: any = { status: 'ACTIVE' };

      if (districtId) {
        where.serviceAreas = { some: { districtId, isActive: true } };
      } else if (districtCode) {
        where.serviceAreas = { some: { district: { code: districtCode.toUpperCase() }, isActive: true } };
      }

      const suppliers = await fastify.prisma.supplier.findMany({
        where,
        include: {
          district: true,
          _count: {
            select: { products: true, orders: true }
          }
        },
        orderBy: [{ rating: 'desc' }, { businessName: 'asc' }]
      });

      return { suppliers };
    }
  );

  // Supplier public storefront
  fastify.get(
    '/suppliers/:id/storefront',
    {
      schema: {
        tags: ['Marketplace'],
        summary: 'Get supplier public storefront and active catalog',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const { id } = request.params;

      const supplier = await fastify.prisma.supplier.findUnique({
        where: { id },
        include: {
          district: true,
          serviceAreas: { include: { district: true } },
          products: {
            where: { isAvailable: true },
            include: {
              masterProduct: {
                include: { category: true, brand: true }
              }
            },
            orderBy: { masterProduct: { name: 'asc' } }
          }
        }
      });

      if (!supplier) {
        return reply.status(404).send({ error: 'Supplier not found' });
      }

      return { supplier };
    }
  );

  // Compare suppliers for a master product
  fastify.get(
    '/compare/:masterProductId',
    {
      schema: {
        tags: ['Marketplace'],
        summary: 'Compare supplier prices, stock, and delivery for a master product in a district',
        params: z.object({ masterProductId: z.string() }),
        querystring: z.object({
          districtId: z.string().optional(),
          districtCode: z.string().optional(),
          quantity: z.coerce.number().optional().default(1)
        })
      }
    },
    async (request, reply) => {
      const { masterProductId } = request.params;
      const { districtId, districtCode, quantity } = request.query;

      const masterProduct = await fastify.prisma.masterProduct.findUnique({
        where: { id: masterProductId },
        include: { category: true, brand: true }
      });

      if (!masterProduct) {
        return reply.status(404).send({ error: 'Master product not found' });
      }

      const whereSupplier: any = { status: 'ACTIVE' };
      if (districtId) {
        whereSupplier.serviceAreas = { some: { districtId, isActive: true } };
      } else if (districtCode) {
        whereSupplier.serviceAreas = { some: { district: { code: districtCode.toUpperCase() }, isActive: true } };
      }

      const supplierProducts = await fastify.prisma.supplierProduct.findMany({
        where: {
          masterProductId,
          isAvailable: true,
          supplier: whereSupplier
        },
        include: {
          supplier: {
            include: { district: true }
          }
        },
        orderBy: [{ sellingPrice: 'asc' }, { deliveryCharge: 'asc' }]
      });

      const comparisons = supplierProducts.map((sp) => {
        const materialTotal = sp.sellingPrice * quantity;
        const totalEstimated = materialTotal + sp.deliveryCharge;
        return {
          supplierProductId: sp.id,
          supplierId: sp.supplierId,
          businessName: sp.supplier.businessName,
          address: sp.supplier.address,
          rating: sp.supplier.rating,
          isVerified: sp.supplier.isVerified,
          unit: sp.unit,
          sellingPrice: sp.sellingPrice,
          stockQuantity: sp.stockQuantity,
          minOrderQty: sp.minOrderQty,
          deliveryCharge: sp.deliveryCharge,
          materialTotal,
          totalEstimated,
          inStock: sp.stockQuantity >= quantity,
          meetsMinOrder: quantity >= sp.minOrderQty
        };
      });

      // Sort by actual landed cost (totalEstimated) so Best Landed Rate is 100% mathematically accurate
      comparisons.sort((a, b) => {
        const aValid = a.inStock && a.meetsMinOrder ? 1 : 0;
        const bValid = b.inStock && b.meetsMinOrder ? 1 : 0;
        if (aValid !== bValid) return bValid - aValid;
        if (a.totalEstimated !== b.totalEstimated) return a.totalEstimated - b.totalEstimated;
        return a.sellingPrice - b.sellingPrice;
      });

      return {
        masterProduct,
        requestedQuantity: quantity,
        totalSuppliers: comparisons.length,
        comparisons
      };
    }
  );
};

