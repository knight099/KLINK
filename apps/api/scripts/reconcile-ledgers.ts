import { prisma } from '@klink/database';
import { reconcileLedgers } from '../src/lib/ledger';

async function main() {
  const apply = process.argv.includes('--apply');
  const reason = process.env.LEDGER_RECONCILIATION_REASON || '';
  if (apply && !reason) throw new Error('Set LEDGER_RECONCILIATION_REASON before applying reviewed changes');
  try {
    const changes = await reconcileLedgers(prisma, reason || 'Read-only preview', apply);
    // No customer names, phones or addresses are included in the preview.
    console.log(JSON.stringify({ applied: apply, changes }, null, 2));
  } finally { await prisma.$disconnect(); }

}
main().catch(() => { console.error("Ledger reconciliation failed; no partial transaction was committed."); process.exitCode = 1; });
