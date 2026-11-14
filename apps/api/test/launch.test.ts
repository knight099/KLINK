import { recalculateCustomerLedger } from '../src/lib/ledger';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../src/app';

// Never run these integration tests against an operator's database.
if (!process.env.DATABASE_URL?.includes('/klink_test')) throw new Error('Tests require a dedicated klink_test database');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';
const app = buildApp();
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};
const tag = randomUUID();
const password = 'TestPassword123!';
const call = (method: any, url: string, token?: string, payload?: any) => app.inject({ method, url: '/api/v1' + url, headers: token ? { authorization: `Bearer ${token}`, 'idempotency-key': randomUUID() } : {}, payload });
const login = async (phone: string) => (await call('POST', '/auth/login', undefined, { phone, password })).json();

before(async () => {
  await app.ready();
  const p = app.prisma;
  const state = await p.state.create({ data: { code: tag, name: 'Test' } });
  const district = await p.district.create({ data: { code: tag, name: 'Test', stateId: state.id } });
  ids.district = district.id;
  const category = await p.category.create({ data: { slug: tag, name: 'Test' } });
  const master = await p.masterProduct.create({ data: { categoryId: category.id, name: 'Cement', defaultUnit: 'BAG' } });
  const hash = await bcrypt.hash(password, 4);
  for (const [key, role, forced] of [['supplier', 'SUPPLIER', false], ['other', 'SUPPLIER', false], ['forced', 'SUPPLIER', true], ['customer', 'CUSTOMER', false], ['walkin', 'CUSTOMER', true], ['admin', 'ADMIN', false]] as const) {
    const phone = `${tag}-${key}`;
    const u = await p.user.create({ data: { phone, passwordHash: hash, role, mustChangePassword: forced,
      ...(role === 'SUPPLIER' ? { supplier: { create: { businessName: key, ownerName: key, phone, address: 'Test address', districtId: district.id, serviceAreas: { create: { districtId: district.id } } } } } : {}),
      ...(role === 'CUSTOMER' ? { customer: { create: { fullName: key, phone, defaultDistrictId: district.id } } } : {})
    }, include: { supplier: true, customer: true } });
    ids[key] = u.id;
    if (u.supplier) ids[key + 'Profile'] = u.supplier.id;
    if (u.customer) ids[key + 'Profile'] = u.customer.id;
    tokens[key] = (await login(phone)).token;
  }
  const product = await p.supplierProduct.create({ data: { supplierId: ids.supplierProfile, masterProductId: master.id, sellingPrice: 100, unit: 'BAG', stockQuantity: 10 } });
  ids.product = product.id;
});
after(async () => { await app.close(); });

async function order(status = 'PENDING_APPROVAL', quantity = 1) {
  return app.prisma.order.create({ data: { orderNumber: randomUUID(), customerId: ids.customerProfile, supplierId: ids.supplierProfile, districtId: ids.district, totalMaterialAmount: 100 * quantity, finalTotal: 100 * quantity, balancePending: 100 * quantity, status, deliveryAddress: 'Test address', siteContactPhone: '9123456789', items: { create: { supplierProductId: ids.product, masterProductName: 'Cement', unit: 'BAG', quantity, unitPrice: 100, totalPrice: 100 * quantity } } } });
}

test('registration cannot take over a walk-in account by knowing its phone', async () => {
  const res = await call('POST', '/auth/register-customer', undefined, { phone: `${tag}-walkin`, password: 'Attacker123!', fullName: 'Attacker', districtId: ids.district });
  assert.equal(res.statusCode, 400, res.body);
  assert.equal((await app.prisma.user.findUniqueOrThrow({ where: { id: ids.walkin } })).mustChangePassword, true);
});
test('temporary sessions cannot use supplier APIs before password change', async () => {
  assert.equal((await call('GET', '/supplier/dashboard', tokens.forced)).statusCode, 403);
  const res = await call('POST', '/auth/change-password', tokens.forced, { newPassword: 'NewPassword123!' });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal((await call('GET', '/supplier/dashboard', tokens.forced)).statusCode, 401);
  assert.equal((await call('GET', '/supplier/dashboard', res.json().token)).statusCode, 200);
});
test('admin password reset revokes existing sessions', async () => {
  const res = await call('PATCH', `/admin/users/${ids.other}`, tokens.admin, { newPassword: 'ResetPassword123!' });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal((await call('GET', '/supplier/dashboard', tokens.other)).statusCode, 401);
});
test('supplier cannot inspect another tenant customer passbook', async () => {
  const res = await call('GET', `/supplier/ledger/${ids.walkinProfile}`, tokens.supplier);
  assert.equal(res.statusCode, 404, res.body);
});
test('orders cannot skip acceptance or revive a cancelled order', async () => {
  const o = await order();
  const res = await call('PATCH', `/supplier/orders/${o.id}/status`, tokens.supplier, { status: 'DELIVERED' });
  assert.equal(res.statusCode, 400, res.body);
  await app.prisma.order.update({ where: { id: o.id }, data: { status: 'CANCELLED' } });
  assert.equal((await call('POST', `/supplier/orders/${o.id}/dispatch`, tokens.supplier, { driverName: 'Driver', driverPhone: '9123456789', vehicleNumber: 'BR01XX1234' })).statusCode, 400);
});
test('direct dispatch cannot produce negative stock', async () => {
  await app.prisma.supplierProduct.update({ where: { id: ids.product }, data: { stockQuantity: 0 } });
  const o = await order();
  const res = await call('POST', `/supplier/orders/${o.id}/dispatch`, tokens.supplier, { driverName: 'Driver', driverPhone: '9123456789', vehicleNumber: 'BR01XX1234' });
  assert.equal(res.statusCode, 400, res.body);
  assert.equal((await app.prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status, 'PENDING_APPROVAL');
});
test('concurrent confirmations reserve stock only once', async () => {
  await app.prisma.supplierProduct.update({ where: { id: ids.product }, data: { stockQuantity: 10 } });
  const o = await order();
  await Promise.all(Array.from({ length: 4 }, () => call('PATCH', `/supplier/orders/${o.id}/status`, tokens.supplier, { status: 'CONFIRMED' })));
  assert.equal((await app.prisma.supplierProduct.findUniqueOrThrow({ where: { id: ids.product } })).stockQuantity, 9);
});
test('concurrent payments cannot overwrite each other', async () => {
  const o = await order('CONFIRMED');
  const res = await Promise.all(Array.from({ length: 3 }, () => call('POST', `/supplier/orders/${o.id}/payments`, tokens.supplier, { amount: 10, paymentMode: 'CASH' })));
  res.forEach(r => assert.equal(r.statusCode, 200, r.body));
  assert.equal((await app.prisma.order.findUniqueOrThrow({ where: { id: o.id } })).amountPaid, 30);
});
test('Udhaar is credit, never money received', async () => {
  const o = await order('CONFIRMED');
  assert.equal((await call('POST', `/supplier/orders/${o.id}/payments`, tokens.supplier, { amount: 100, paymentMode: 'UDHAAR' })).statusCode, 400);
  assert.equal((await app.prisma.order.findUniqueOrThrow({ where: { id: o.id } })).amountPaid, 0);
});
test('overpayments and payments against pending orders are rejected', async () => {
  const o = await order('CONFIRMED');
  assert.equal((await call('POST', `/supplier/orders/${o.id}/payments`, tokens.supplier, { amount: 101, paymentMode: 'CASH' })).statusCode, 400);
  const pending = await order();
  assert.equal((await call('POST', `/supplier/orders/${pending.id}/payments`, tokens.supplier, { amount: 1, paymentMode: 'CASH' })).statusCode, 400);
});
test('manual pending orders do not reserve stock until accepted', async () => {
  await app.prisma.supplierProduct.update({ where: { id: ids.product }, data: { stockQuantity: 10 } });
  const res = await call('POST', '/supplier/orders/manual', tokens.supplier, { customerId: ids.customerProfile, items: [{ supplierProductId: ids.product, quantity: 1 }], deliveryAddress: 'Test address', siteContactPhone: '9123456789', initialStatus: 'PENDING_APPROVAL' });
  assert.equal(res.statusCode, 201, res.body);
  assert.equal((await app.prisma.supplierProduct.findUniqueOrThrow({ where: { id: ids.product } })).stockQuantity, 10);
});
test('customer cannot order unavailable material', async () => {
  await app.prisma.supplierProduct.update({ where: { id: ids.product }, data: { isAvailable: false } });
  const res = await call('POST', '/customer/orders', tokens.customer, { supplierId: ids.supplierProfile, districtId: ids.district, items: [{ supplierProductId: ids.product, quantity: 1 }], deliveryAddress: 'Test address', siteContactPhone: '9123456789' });
  assert.equal(res.statusCode, 400, res.body);
});
test('admin cannot bypass stock and ledger rules with a raw order override', async () => {
  const o = await order();
  const res = await call('PATCH', `/admin/orders/${o.id}`, tokens.admin, { status: 'DELIVERED', finalTotal: -100 });
  assert.equal(res.statusCode, 400, res.body);
});
test('retrying a payment with the same key records money once', async () => {
  const o = await order('CONFIRMED');
  const key = randomUUID();
  const pay = () => app.inject({ method: 'POST', url: `/api/v1/supplier/orders/${o.id}/payments`, headers: { authorization: `Bearer ${tokens.supplier}`, 'idempotency-key': key }, payload: { amount: 10, paymentMode: 'CASH' } });
  const results = await Promise.all([pay(), pay()]);
  results.forEach(r => assert.equal(r.statusCode, 200, r.body));
  assert.equal((await app.prisma.order.findUniqueOrThrow({ where: { id: o.id } })).amountPaid, 10);
});
test('manual payment must match the order customer', async () => {
  const o = await order('CONFIRMED');
  const res = await call('POST', '/supplier/payments/manual', tokens.supplier, { orderId: o.id, customerId: ids.walkinProfile, amount: 10, paymentMode: 'CASH' });
  assert.equal(res.statusCode, 400, res.body);
});
test('manual payment rejects credit as cash and overpayment', async () => {
  const o = await order('CONFIRMED');
  for (const [amount, paymentMode] of [[10, 'UDHAAR'], [101, 'CASH']]) {
    const res = await call('POST', '/supplier/payments/manual', tokens.supplier, { orderId: o.id, customerId: ids.customerProfile, amount, paymentMode });
    assert.equal(res.statusCode, 400, res.body);
  }
});
test('admin cannot fabricate ledger payments or delete payment history', async () => {
  const o = await order('CONFIRMED');
  const payment = (await call('POST', `/supplier/orders/${o.id}/payments`, tokens.supplier, { amount: 10, paymentMode: 'CASH' })).json().payment;
  assert.equal((await call('DELETE', `/admin/payments/${payment.id}`, tokens.admin)).statusCode, 409);
  assert.equal((await call('PATCH', `/admin/customers/${ids.customerProfile}/balance`, tokens.admin, { newBalance: 99999 })).statusCode, 409);
});
test('manual phone lookup cannot claim another yard customer relationship', async () => {
  const res = await call('POST', '/supplier/orders/manual', tokens.supplier, { customerName: 'Someone', customerPhone: `${tag}-walkin`, items: [{ supplierProductId: ids.product, quantity: 1 }], deliveryAddress: 'Test address', siteContactPhone: '9123456789', initialStatus: 'PENDING_APPROVAL' });
  assert.equal(res.statusCode, 400, res.body);
});
test('manual order retry does not duplicate an upfront receipt or stock reservation', async () => {
  await app.prisma.supplierProduct.update({ where: { id: ids.product }, data: { isAvailable: true, stockQuantity: 10 } });
  const key = randomUUID();
  const payload = { customerId: ids.customerProfile, items: [{ supplierProductId: ids.product, quantity: 1 }], deliveryAddress: 'Test address', siteContactPhone: '9123456789', initialStatus: 'CONFIRMED', amountPaid: 10, paymentMode: 'CASH' };
  const send = () => app.inject({ method:'POST', url:'/api/v1/supplier/orders/manual', headers:{ authorization:`Bearer ${tokens.supplier}`, 'idempotency-key':key }, payload });
  const results=await Promise.all([send(),send()]);
  results.forEach(r=>assert.equal(r.statusCode,201,r.body));
  assert.equal(results[0].json().order.id,results[1].json().order.id);
  assert.equal((await app.prisma.supplierProduct.findUniqueOrThrow({where:{id:ids.product}})).stockQuantity,9);
});
test('manual order cannot record a fractional paise payment', async () => {
 const res=await call('POST','/supplier/orders/manual',tokens.supplier,{ customerId:ids.customerProfile, items:[{supplierProductId:ids.product,quantity:1}], deliveryAddress:'Test address',siteContactPhone:'9123456789',amountPaid:0.005 });
 assert.equal(res.statusCode,400,res.body);
});
test('generic status route cannot bypass delivery vehicle release', async () => {
 const o=await order('OUT_FOR_DELIVERY');
 const res=await call('PATCH',`/supplier/orders/${o.id}/status`,tokens.supplier,{status:'DELIVERED'});
 assert.equal(res.statusCode,400,res.body);
});
test('customer order completes acceptance, dispatch, delivery and payment with correct stock', async () => {
 await app.prisma.supplierProduct.update({where:{id:ids.product},data:{isAvailable:true,stockQuantity:10}});
 const created=await call('POST','/customer/orders',tokens.customer,{supplierId:ids.supplierProfile,districtId:ids.district,items:[{supplierProductId:ids.product,quantity:1}],deliveryAddress:'Test site address',siteContactPhone:'9123456789'});
 assert.equal(created.statusCode,201,created.body);const id=created.json().order.id;
 assert.equal((await call('PATCH',`/supplier/orders/${id}/status`,tokens.supplier,{status:'CONFIRMED'})).statusCode,200);
 assert.equal((await call('POST',`/supplier/orders/${id}/dispatch`,tokens.supplier,{driverName:'Driver',driverPhone:'9123456789',vehicleNumber:'BR01XX1234'})).statusCode,200);
 assert.equal((await call('POST',`/supplier/orders/${id}/deliver`,tokens.supplier,{})).statusCode,200);
 const paid=await call('POST',`/supplier/orders/${id}/payments`,tokens.supplier,{amount:100,paymentMode:'CASH'});
 assert.equal(paid.statusCode,200,paid.body);assert.equal(paid.json().order.balancePending,0);
 assert.equal(paid.json().order.paymentStatus,'PAID');
 assert.equal((await app.prisma.supplierProduct.findUniqueOrThrow({where:{id:ids.product}})).stockQuantity,9);
});

test('ledger totals use accepted orders and receipts, excluding legacy pending quotes', async () => {
  const pending = await order('PENDING', 2);
  try {
    const result = await app.prisma.$transaction(async tx => {
      const expected = await tx.order.aggregate({ where: { supplierId: ids.supplierProfile, customerId: ids.customerProfile, status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'] } }, _sum: { finalTotal: true } });
      const ledger = await recalculateCustomerLedger(tx, ids.supplierProfile, ids.customerProfile);
      return { expected: expected._sum.finalTotal || 0, actual: ledger.totalPurchased };
    });
    assert.equal(result.actual, result.expected);
  } finally { await app.prisma.orderItem.deleteMany({where:{orderId:pending.id}}); await app.prisma.order.delete({where:{id:pending.id}}); }
});

test('ledger reconciliation previews, audits repairs and is idempotent', async () => {
  const { reconcileLedgers } = await import('../src/lib/ledger');
  const ledger = await app.prisma.customerLedger.upsert({ where: { supplierId_customerId: { supplierId: ids.supplierProfile, customerId: ids.customerProfile } }, create: {supplierId: ids.supplierProfile, customerId: ids.customerProfile, totalPurchased: 999999}, update: { totalPurchased: 999999 } });
  const preview = await reconcileLedgers(app.prisma, 'Test preview');
  assert.ok(preview.some(row => row.ledgerId === ledger.id));
  assert.equal((await app.prisma.customerLedger.findUniqueOrThrow({where:{id:ledger.id}})).totalPurchased, 999999);
  await reconcileLedgers(app.prisma, 'Test authorized repair', true);
  const audit = await app.prisma.$queryRaw<{reason:string}[]>`SELECT reason FROM "LedgerReconciliation" WHERE "ledgerId"=${ledger.id}`;
  assert.equal(audit.length, 1);
  assert.equal(audit[0].reason, 'Test authorized repair');
  assert.equal((await reconcileLedgers(app.prisma, 'Test repeat', true)).length, 0);
});

test('reconciliation creates missing ledgers for accepted orders and receipts', async () => {
  const { reconcileLedgers } = await import('../src/lib/ledger');
  await app.prisma.customerLedger.deleteMany({where:{supplierId:ids.supplierProfile,customerId:ids.customerProfile}});
  const preview = await reconcileLedgers(app.prisma, 'Missing ledger preview');
  assert.ok(preview.some(row => row.before === null && row.after.totalPurchased > 0));
  await reconcileLedgers(app.prisma, 'Missing ledger repair', true);
  assert.ok(await app.prisma.customerLedger.findUnique({where:{supplierId_customerId:{supplierId:ids.supplierProfile,customerId:ids.customerProfile}}}));
  assert.equal((await reconcileLedgers(app.prisma, 'Repeat', true)).length, 0);
});
