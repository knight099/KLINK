import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  if (!phone || !/^\d{10}$/.test(phone) || !password || password.length < 16 || Buffer.byteLength(password) > 72) {
    throw new Error('Set ADMIN_PHONE (10 digits) and ADMIN_PASSWORD (16+ characters, at most 72 UTF-8 bytes) in the secure environment');
  }
  await prisma.$transaction(async tx => {
    if (await tx.user.findFirst({ where: { role: 'ADMIN' } })) throw new Error('An administrator already exists; bootstrap will not overwrite it');
    const state = await tx.state.upsert({ where: { code: 'BR' }, update: {}, create: { code: 'BR', name: 'Bihar' } });
    await tx.district.upsert({ where: { code: 'DARBHANGA' }, update: {}, create: { code: 'DARBHANGA', name: 'Darbhanga', stateId: state.id } });
    await tx.user.create({ data: { phone, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  });
  console.log('Administrator and Darbhanga geography initialized. No demo accounts or transactions created.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
