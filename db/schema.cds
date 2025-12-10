namespace nexus.canon;

using { managed, cuid } from '@sap/cds/common';

// THE MASTER LEDGER
// Matches the ForensicRecord interface from the Frontend
entity Ledger : cuid, managed {
  @title: 'Legal Entity'
  entity_code : String(50); // e.g., "US_HOLDING_CORP"
  
  @title: 'Transaction Class'
  class       : String(20); // e.g., "VALUATION", "TRANSACTION"
  
  @title: 'Notional Value'
  amount      : Decimal(15, 2);
  
  @title: 'Currency'
  currency    : String(3);
  
  @title: 'Forensic State'
  status      : String(10) enum {
    PENDING = 'PENDING';
    LOCKED  = 'LOCKED';
    FLAGGED = 'FLAGGED';
  };
  
  @title: 'Cryptographic Hash'
  block_hash  : String(64);
  
  @title: 'Audit Notes'
  notes       : String(500);
}

// THE AUDIT LOG
// Tracks every single interaction (The "Living Lens")
entity AccessLog : cuid, managed {
  action    : String(50); // e.g., "VIEW", "EXPORT", "SYNC"
  user_id   : String(100);
  timestamp : DateTime;
  details   : String(1000);
}

