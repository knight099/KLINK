import { buildApp } from './app';

const server = buildApp();

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

server.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 KLINK Fastify Marketplace API running at: ${address}`);
  console.log(`📚 Swagger OpenAPI Documentation: ${address}/documentation`);
});

