import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';

for (const app of ['web', 'partner-web', 'marketplace-web', 'admin-web']) {
  test(`${app}: lost payment response retains the retry key until success`, async () => {
    const source = readFileSync(resolve(process.cwd(), `../${app}/src/lib/api.ts`), 'utf8').replaceAll('import.meta.env', '({ DEV: true })');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const storage = new Map<string, string>();
    const memory = { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) };
    const keys: string[] = [];
    const context = { exports: {} as any, localStorage: memory, sessionStorage: memory, crypto: webcrypto, TextEncoder, fetch: async (_url: string, options: any) => {
      keys.push(options.headers['Idempotency-Key']);
      if (keys.length === 1) throw new Error('Response lost after server committed');
      return { ok: true, json: async () => ({ ok: true }) };
    } };
    runInNewContext(js, context);
    const submit = () => context.exports.apiFetch('/supplier/payments/manual', { method: 'POST', body: JSON.stringify({ customerId: 'customer', amount: 10, paymentMode: 'CASH' }) });
    await assert.rejects(submit(), /Response lost/);
    await submit();
    assert.equal(keys[0], keys[1], 'A transport retry must not create a second receipt');
    await submit();
    assert.notEqual(keys[1], keys[2], 'A new receipt after confirmed success needs a new key');
  });
}
