using { nexus.canon as db } from '../db/schema';

// THE FORENSIC API
service ForensicService {

  // Read-Only View for the Dashboard (The God View)
  @readonly
  entity MasterLedger as select from db.Ledger {
    ID,
    entity_code,
    class,
    amount,
    currency,
    status,
    block_hash,
    createdAt
  } order by createdAt desc;

  // The Action to "Crystalize" (Lock) a record
  action lockPeriod(ids: array of UUID) returns Boolean;
  
  // The Action to "Scan" for anomalies
  function runIntegrityScan() returns String;
}

