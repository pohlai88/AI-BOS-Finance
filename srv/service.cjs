const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Ledger } = cds.entities('nexus.canon');

  // 1. The Logic for "Locking" (Crystalizing)
  this.on('lockPeriod', async (req) => {
    const { ids } = req.data;
    if (!ids || ids.length === 0) return false;

    console.log('>> CRYSTALIZING RECORDS:', ids);

    // Update the database - set status to LOCKED
    await UPDATE(Ledger).set({ status: 'LOCKED' }).where({ ID: { in: ids } });

    return true;
  });

  // 2. The Logic for "Integrity Scan"
  this.on('runIntegrityScan', async () => {
    const flagged = await SELECT.from(Ledger).where({ status: 'FLAGGED' });
    console.log('>> INTEGRITY SCAN: Found', flagged.length, 'flagged records');
    return `Scan complete. ${flagged.length} records require attention.`;
  });
});

