import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateMasterProductInputSchema,
  UpdateMasterProductInputSchema,
  CreateBrandInputSchema
} from '@klink/shared-types';

export const catalogRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Categories
  fastify.get(
    '/categories',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'List product categories'
      }
    },
    async () => {
      const categories = await fastify.prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { masterProducts: true }
          }
        }
      });
      return { categories };
    }
  );

  // Brands
  fastify.get(
    '/brands',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'List brands'
      }
    },
    async () => {
      const brands = await fastify.prisma.brand.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { masterProducts: true }
          }
        }
      });
      return { brands };
    }
  );

  // Admin: Create Brand
  fastify.post(
    '/brands',
    {
      onRequest: [fastify.requireRole('ADMIN')],
      schema: {
        tags: ['Catalog', 'Admin'],
        summary: 'Admin: Add a new brand',
        body: CreateBrandInputSchema
      }
    },
    async (request, reply) => {
      const { name, logoUrl } = request.body;
      const brand = await fastify.prisma.brand.upsert({
        where: { name },
        update: { logoUrl },
        create: { name, logoUrl }
      });
      return reply.status(201).send({ brand });
    }
  );

  // Master Products
  fastify.get(
    '/master-products',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'List master product catalog',
        querystring: z.object({
          categoryId: z.string().optional(),
          categorySlug: z.string().optional(),
          brandId: z.string().optional(),
          search: z.string().optional(),
          includeInactive: z.string().optional()
        })
      }
    },
    async (request) => {
      const { categoryId, categorySlug, brandId, search, includeInactive } = request.query;

      const where: any = {};
      if (includeInactive !== 'true') {
        where.isActive = true;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (categorySlug) {
        where.category = { slug: categorySlug };
      }
      if (brandId) {
        where.brandId = brandId;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const masterProducts = await fastify.prisma.masterProduct.findMany({
        where,
        include: {
          category: true,
          brand: true,
          _count: {
            select: { supplierProducts: true }
          }
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { name: 'asc' }
        ]
      });

      return { masterProducts };
    }
  );

  // Master Product by ID
  fastify.get(
    '/master-products/:id',
    {
      schema: {
        tags: ['Catalog'],
        summary: 'Get master product by ID',
        params: z.object({ id: z.string() })
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const product = await fastify.prisma.masterProduct.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          supplierProducts: {
            include: { supplier: true }
          }
        }
      });

      if (!product) {
        return reply.status(404).send({ error: 'Master product not found' });
      }

      return { product };
    }
  );

  // Admin: Create Master Product
  fastify.post(
    '/master-products',
    {
      onRequest: [fastify.requireRole('ADMIN')],
      schema: {
        tags: ['Catalog', 'Admin'],
        summary: 'Admin: Add a new master product to platform catalog',
        body: CreateMasterProductInputSchema
      }
    },
    async (request, reply) => {
      const { categoryId, brandId, name, description, defaultUnit, specifications, imageUrl } = request.body;

      const product = await fastify.prisma.masterProduct.create({
        data: {
          categoryId,
          brandId: brandId || null,
          name,
          description,
          defaultUnit,
          specifications: specifications ? JSON.stringify(specifications) : null,
          imageUrl,
          isActive: true
        },
        include: { category: true, brand: true }
      });

      return reply.status(201).send({ product });
    }
  );

  // Admin: Update Master Product
  fastify.patch(
    '/master-products/:id',
    {
      onRequest: [fastify.requireRole('ADMIN')],
      schema: {
        tags: ['Catalog', 'Admin'],
        summary: 'Admin: Update master product details',
        params: z.object({ id: z.string() }),
        body: UpdateMasterProductInputSchema
      }
    },
    async (request, reply) => {
      const { id } = request.params;
      const { specifications, ...rest } = request.body;

      const updateData: any = { ...rest };
      if (specifications !== undefined) {
        updateData.specifications = specifications ? JSON.stringify(specifications) : null;
      }

      const product = await fastify.prisma.masterProduct.update({
        where: { id },
        data: updateData,
        include: { category: true, brand: true }
      });

      return { message: 'Master product updated successfully', product };
    }
  );

  // Admin: Delete / Toggle Active Master Product
  fastify.delete(
    '/master-products/:id',
    {
      onRequest: [fastify.requireRole('ADMIN')],
      schema: {
        tags: ['Catalog', 'Admin'],
        summary: 'Admin: Deactivate master product',
        params: z.object({ id: z.string() })
      }
    },
    async (request) => {
      const { id } = request.params;
      const product = await fastify.prisma.masterProduct.update({
        where: { id },
        data: { isActive: false }
      });
      return { message: 'Master product deactivated', product };
    }
  );
};
