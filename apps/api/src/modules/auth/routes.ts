import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  LoginInputSchema,
  RegisterCustomerInputSchema,
  OnboardSupplierInputSchema,
  ChangePasswordInputSchema,
  UserRoleEnum
} from '@klink/shared-types';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Login
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Login with phone and password',
        body: LoginInputSchema,
        response: {
          200: z.object({
            token: z.string(),
            user: z.object({
              id: z.string(),
              phone: z.string(),
              role: UserRoleEnum,
              name: z.string(),
              supplierId: z.string().optional(),
              customerId: z.string().optional(),
              mustChangePassword: z.boolean().optional()
            })
          }),
          401: z.object({ error: z.string() }),
          403: z.object({ error: z.string() })
        }
      }
    },
    async (request, reply) => {
      const { phone, password } = request.body;

      const user = await fastify.prisma.user.findUnique({
        where: { phone },
        include: {
          supplier: true,
          customer: true
        }
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid phone or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return reply.status(401).send({ error: 'Invalid phone or password' });
      }

      let name = 'User';
      let supplierId: string | undefined;
      let customerId: string | undefined;

      if (user.role === 'ADMIN') {
        name = 'Platform Admin';
      } else if (user.role === 'SUPPLIER' && user.supplier) {
        if (user.supplier.status === 'PENDING_APPROVAL') {
          return reply.status(403).send({
            error: 'Your supplier yard registration is pending verification by the KLINK platform administrator.'
          });
        }
        if (user.supplier.status === 'SUSPENDED') {
          return reply.status(403).send({
            error: 'Your supplier yard account has been suspended. Please contact platform administration.'
          });
        }
        if (user.supplier.status === 'REJECTED') {
          return reply.status(403).send({
            error: 'Your supplier yard registration was not approved.'
          });
        }
        name = user.supplier.businessName;
        supplierId = user.supplier.id;
      } else if (user.role === 'CUSTOMER' && user.customer) {
        name = user.customer.fullName;
        customerId = user.customer.id;
      }

      const payload = {
        id: user.id,
        phone: user.phone,
        role: user.role as any,
        name,
        supplierId,
        customerId,
        mustChangePassword: user.mustChangePassword
      };

      const token = fastify.jwt.sign(payload, { expiresIn: '30d' });

      return {
        token,
        user: payload
      };
    }
  );

  // Change Password (e.g. on first login)
  fastify.post(
    '/change-password',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Change user password (mandatory after first login)',
        body: ChangePasswordInputSchema,
        response: {
          200: z.object({
            message: z.string(),
            token: z.string(),
            user: z.any()
          }),
          400: z.object({ error: z.string() })
        }
      }
    },
    async (request, reply) => {
      const userId = request.user.id;
      const { newPassword } = request.body;

      const passwordHash = await bcrypt.hash(newPassword, 10);

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false
        },
        include: {
          supplier: true,
          customer: true
        }
      });

      const payload = {
        ...request.user,
        mustChangePassword: false
      };

      const token = fastify.jwt.sign(payload, { expiresIn: '30d' });

      return {
        message: 'Password changed successfully',
        token,
        user: payload
      };
    }
  );

  // Register Customer
  fastify.post(
    '/register-customer',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a new customer account',
        body: RegisterCustomerInputSchema,
        response: {
          201: z.object({
            token: z.string(),
            user: z.any()
          }),
          400: z.object({ error: z.string() })
        }
      }
    },
    async (request, reply) => {
      const { phone, password, fullName, districtId, addressLine, landmark, pincode } = request.body;

      const existing = await fastify.prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return reply.status(400).send({ error: 'Phone number already registered' });
      }

      const district = await fastify.prisma.district.findUnique({ where: { id: districtId } });
      if (!district) {
        return reply.status(400).send({ error: 'Invalid district ID' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await fastify.prisma.user.create({
        data: {
          phone,
          passwordHash,
          role: 'CUSTOMER',
          mustChangePassword: false,
          customer: {
            create: {
              fullName,
              phone,
              defaultDistrictId: districtId,
              addresses: addressLine
                ? {
                    create: {
                      districtId,
                      addressLine,
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

      const payload = {
        id: user.id,
        phone: user.phone,
        role: 'CUSTOMER' as const,
        name: fullName,
        customerId: user.customer?.id,
        mustChangePassword: false
      };

      const token = fastify.jwt.sign(payload, { expiresIn: '30d' });

      return reply.status(201).send({
        token,
        user: payload
      });
    }
  );

  // Onboard Supplier (Self registration)
  fastify.post(
    '/onboard-supplier',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Supplier onboarding application',
        body: OnboardSupplierInputSchema,
        response: {
          201: z.object({
            message: z.string(),
            supplierId: z.string()
          }),
          400: z.object({ error: z.string() })
        }
      }
    },
    async (request, reply) => {
      const { phone, password, businessName, ownerName, districtId, address, gstin, logoUrl, description } = request.body;

      const existing = await fastify.prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return reply.status(400).send({ error: 'Phone number already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await fastify.prisma.user.create({
        data: {
          phone,
          passwordHash,
          role: 'SUPPLIER',
          mustChangePassword: false,
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
              status: 'PENDING_APPROVAL',
              isVerified: false,
              serviceAreas: {
                create: { districtId }
              }
            }
          }
        },
        include: { supplier: true }
      });

      return reply.status(201).send({
        message: 'Supplier registration submitted. Our team will verify your yard details within 24 hours.',
        supplierId: user.supplier!.id
      });
    }
  );

  // Current session
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Get current logged in user details'
      }
    },
    async (request) => {
      return { user: request.user };
    }
  );
};
