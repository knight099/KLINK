import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateDistrictInputSchema } from '@klink/shared-types';

export const geoRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // List all active districts
  fastify.get(
    '/districts',
    {
      schema: {
        tags: ['Geo'],
        summary: 'List available marketplace districts'
      }
    },
    async (request) => {
      const districts = await fastify.prisma.district.findMany({
        where: { isActive: true },
        include: {
          state: true,
          _count: {
            select: { suppliers: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      return { districts };
    }
  );

  // Admin: Create / expand to a new district
  fastify.post(
    '/districts',
    {
      onRequest: [fastify.requireRole('ADMIN')],
      schema: {
        tags: ['Geo', 'Admin'],
        summary: 'Admin: Add a new district for marketplace rollout',
        body: CreateDistrictInputSchema
      }
    },
    async (request, reply) => {
      const { stateId, code, name, isActive } = request.body;

      const district = await fastify.prisma.district.create({
        data: {
          stateId,
          code,
          name,
          isActive
        }
      });

      return reply.status(201).send({ district });
    }
  );
};

