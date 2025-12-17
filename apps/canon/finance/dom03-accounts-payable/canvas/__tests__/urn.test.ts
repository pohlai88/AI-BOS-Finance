/**
 * URN Parser & Builder Tests
 * 
 * Tests the "Magic Link" URN utilities for binding canvas objects
 * to AP entities.
 */

import { describe, it, expect } from 'vitest';
import {
  parseURN,
  tryParseURN,
  buildURN,
  buildURNFromEntity,
  isValidURN,
  isValidUUID,
  extractEntityId,
  extractCellCode,
  getCellDisplayCode,
  isSameEntity,
  groupURNsByCell,
  URNParseError,
  CELL_ENTITY_MAP,
  ENTITY_CELL_MAP,
} from '../urn';

describe('URN Utilities', () => {
  // =========================================================================
  // parseURN
  // =========================================================================
  
  describe('parseURN', () => {
    it('parses valid invoice URN', () => {
      const urn = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      const result = parseURN(urn);
      
      expect(result.namespace).toBe('aibos');
      expect(result.domain).toBe('ap');
      expect(result.cell).toBe('02');
      expect(result.entityType).toBe('invoice');
      expect(result.entityId).toBe('8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
      expect(result.cellName).toBe('Invoice Entry');
      expect(result.cellDisplayCode).toBe('AP-02');
    });

    it('parses valid vendor URN', () => {
      const urn = 'urn:aibos:ap:01:vendor:550e8400-e29b-41d4-a716-446655440001';
      const result = parseURN(urn);
      
      expect(result.cell).toBe('01');
      expect(result.entityType).toBe('vendor');
      expect(result.cellName).toBe('Vendor Master');
    });

    it('parses valid payment URN', () => {
      const urn = 'urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a';
      const result = parseURN(urn);
      
      expect(result.cell).toBe('05');
      expect(result.entityType).toBe('payment');
      expect(result.cellDisplayCode).toBe('AP-05');
    });

    it('handles uppercase input', () => {
      const urn = 'URN:AIBOS:AP:02:INVOICE:8F14E45F-CEEA-46ED-A8B2-0BA60A3E01C3';
      const result = parseURN(urn);
      
      expect(result.cell).toBe('02');
      expect(result.entityType).toBe('invoice');
      expect(result.entityId).toBe('8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
    });

    it('throws on invalid format', () => {
      expect(() => parseURN('invalid')).toThrow(URNParseError);
      expect(() => parseURN('urn:aibos:ap:02:invoice')).toThrow(URNParseError);
      expect(() => parseURN('urn:other:ap:02:invoice:uuid')).toThrow(URNParseError);
    });

    it('throws on cell/entity type mismatch', () => {
      // Cell 02 should have 'invoice', not 'payment'
      expect(() => parseURN('urn:aibos:ap:02:payment:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3'))
        .toThrow(URNParseError);
    });

    it('throws on invalid UUID', () => {
      expect(() => parseURN('urn:aibos:ap:02:invoice:not-a-uuid'))
        .toThrow(URNParseError);
    });

    it('throws on empty/null input', () => {
      expect(() => parseURN('')).toThrow(URNParseError);
      // @ts-expect-error - Testing runtime behavior
      expect(() => parseURN(null)).toThrow(URNParseError);
    });
  });

  // =========================================================================
  // tryParseURN
  // =========================================================================
  
  describe('tryParseURN', () => {
    it('returns parsed URN for valid input', () => {
      const urn = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      const result = tryParseURN(urn);
      
      expect(result).not.toBeNull();
      expect(result?.cell).toBe('02');
    });

    it('returns null for invalid input', () => {
      expect(tryParseURN('invalid')).toBeNull();
      expect(tryParseURN('')).toBeNull();
    });
  });

  // =========================================================================
  // buildURN
  // =========================================================================
  
  describe('buildURN', () => {
    it('builds correct URN for each cell', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440001';
      
      expect(buildURN('01', uuid)).toBe(`urn:aibos:ap:01:vendor:${uuid}`);
      expect(buildURN('02', uuid)).toBe(`urn:aibos:ap:02:invoice:${uuid}`);
      expect(buildURN('03', uuid)).toBe(`urn:aibos:ap:03:match:${uuid}`);
      expect(buildURN('04', uuid)).toBe(`urn:aibos:ap:04:approval:${uuid}`);
      expect(buildURN('05', uuid)).toBe(`urn:aibos:ap:05:payment:${uuid}`);
    });

    it('throws on invalid UUID', () => {
      expect(() => buildURN('02', 'not-a-uuid')).toThrow();
    });

    it('throws on invalid cell code', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => buildURN('99', '550e8400-e29b-41d4-a716-446655440001')).toThrow();
    });

    it('lowercases UUID', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440001';
      const result = buildURN('02', uuid);
      expect(result).toContain(uuid.toLowerCase());
    });
  });

  // =========================================================================
  // buildURNFromEntity
  // =========================================================================
  
  describe('buildURNFromEntity', () => {
    it('builds correct URN from entity type', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440001';
      
      expect(buildURNFromEntity('vendor', uuid)).toContain(':01:vendor:');
      expect(buildURNFromEntity('invoice', uuid)).toContain(':02:invoice:');
      expect(buildURNFromEntity('match', uuid)).toContain(':03:match:');
      expect(buildURNFromEntity('approval', uuid)).toContain(':04:approval:');
      expect(buildURNFromEntity('payment', uuid)).toContain(':05:payment:');
    });
  });

  // =========================================================================
  // Validation Helpers
  // =========================================================================
  
  describe('isValidUUID', () => {
    it('validates correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440001')).toBe(true);
      expect(isValidUUID('8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isValidURN', () => {
    it('validates correct URNs', () => {
      expect(isValidURN('urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3')).toBe(true);
      expect(isValidURN('urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a')).toBe(true);
    });

    it('rejects invalid URNs', () => {
      expect(isValidURN('invalid')).toBe(false);
      expect(isValidURN('urn:aibos:ap:02:invoice')).toBe(false);
    });
  });

  // =========================================================================
  // Helper Functions
  // =========================================================================
  
  describe('extractEntityId', () => {
    it('extracts entity ID from valid URN', () => {
      const urn = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      expect(extractEntityId(urn)).toBe('8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3');
    });

    it('returns null for invalid URN', () => {
      expect(extractEntityId('invalid')).toBeNull();
    });
  });

  describe('extractCellCode', () => {
    it('extracts cell code from valid URN', () => {
      expect(extractCellCode('urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3')).toBe('02');
      expect(extractCellCode('urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a')).toBe('05');
    });

    it('returns null for invalid URN', () => {
      expect(extractCellCode('invalid')).toBeNull();
    });
  });

  describe('getCellDisplayCode', () => {
    it('returns display code from valid URN', () => {
      expect(getCellDisplayCode('urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3')).toBe('AP-02');
      expect(getCellDisplayCode('urn:aibos:ap:01:vendor:550e8400-e29b-41d4-a716-446655440001')).toBe('AP-01');
    });
  });

  describe('isSameEntity', () => {
    it('returns true for same entity', () => {
      const urn1 = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      const urn2 = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      expect(isSameEntity(urn1, urn2)).toBe(true);
    });

    it('returns false for different entities', () => {
      const urn1 = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      const urn2 = 'urn:aibos:ap:02:invoice:550e8400-e29b-41d4-a716-446655440001';
      expect(isSameEntity(urn1, urn2)).toBe(false);
    });

    it('returns false for different cells', () => {
      const urn1 = 'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      const urn2 = 'urn:aibos:ap:05:payment:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3';
      expect(isSameEntity(urn1, urn2)).toBe(false);
    });
  });

  describe('groupURNsByCell', () => {
    it('groups URNs by cell code', () => {
      const urns = [
        'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3',
        'urn:aibos:ap:02:invoice:550e8400-e29b-41d4-a716-446655440001',
        'urn:aibos:ap:05:payment:e4d909c2-9022-4d1d-8b22-1f6d9c3f1c0a',
        'urn:aibos:ap:01:vendor:a87ff679-a2f3-4c94-a1f7-d1d8e0f21f7b',
      ];
      
      const grouped = groupURNsByCell(urns);
      
      expect(grouped.get('02')?.length).toBe(2);
      expect(grouped.get('05')?.length).toBe(1);
      expect(grouped.get('01')?.length).toBe(1);
      expect(grouped.get('03')).toBeUndefined();
    });

    it('skips invalid URNs', () => {
      const urns = [
        'urn:aibos:ap:02:invoice:8f14e45f-ceea-46ed-a8b2-0ba60a3e01c3',
        'invalid',
        '',
      ];
      
      const grouped = groupURNsByCell(urns);
      expect(grouped.get('02')?.length).toBe(1);
    });
  });

  // =========================================================================
  // Constants
  // =========================================================================
  
  describe('Cell/Entity Mappings', () => {
    it('CELL_ENTITY_MAP is complete', () => {
      expect(CELL_ENTITY_MAP['01']).toBe('vendor');
      expect(CELL_ENTITY_MAP['02']).toBe('invoice');
      expect(CELL_ENTITY_MAP['03']).toBe('match');
      expect(CELL_ENTITY_MAP['04']).toBe('approval');
      expect(CELL_ENTITY_MAP['05']).toBe('payment');
    });

    it('ENTITY_CELL_MAP is inverse of CELL_ENTITY_MAP', () => {
      expect(ENTITY_CELL_MAP['vendor']).toBe('01');
      expect(ENTITY_CELL_MAP['invoice']).toBe('02');
      expect(ENTITY_CELL_MAP['match']).toBe('03');
      expect(ENTITY_CELL_MAP['approval']).toBe('04');
      expect(ENTITY_CELL_MAP['payment']).toBe('05');
    });
  });
});
