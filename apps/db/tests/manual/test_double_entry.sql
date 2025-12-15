-- Test double-entry constraint
-- Run: docker exec -i aibos_db psql -U aibos -d aibos_local < tests/manual/test_double_entry.sql

DO $$
DECLARE
  v_tenant_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_company_id UUID;
  v_account_id UUID;
  v_user_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_journal_id UUID;
BEGIN
  -- Get existing company and account
  SELECT id INTO v_company_id FROM finance.companies WHERE tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_account_id FROM finance.accounts WHERE tenant_id = v_tenant_id LIMIT 1;
  
  -- Create a journal entry
  INSERT INTO finance.journal_entries (id, tenant_id, company_id, posting_date, status, created_by)
  VALUES (uuid_generate_v4(), v_tenant_id, v_company_id, CURRENT_DATE, 'DRAFT', v_user_id)
  RETURNING id INTO v_journal_id;
  
  -- Add a debit line
  INSERT INTO finance.journal_lines (journal_entry_id, account_id, direction, amount_cents, currency)
  VALUES (v_journal_id, v_account_id, 'DEBIT', 10000, 'SGD');
  
  -- Try to post without a credit (should fail)
  BEGIN
    UPDATE finance.journal_entries SET status = 'POSTED' WHERE id = v_journal_id;
    RAISE NOTICE 'ERROR: Should have failed but did not!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Unbalanced entry correctly rejected: %', SQLERRM;
  END;
  
  -- Add matching credit
  INSERT INTO finance.journal_lines (journal_entry_id, account_id, direction, amount_cents, currency)
  VALUES (v_journal_id, v_account_id, 'CREDIT', 10000, 'SGD');
  
  -- Now posting should succeed
  UPDATE finance.journal_entries SET status = 'POSTED' WHERE id = v_journal_id;
  RAISE NOTICE 'SUCCESS: Balanced entry posted successfully!';
  
  -- Cleanup
  DELETE FROM finance.journal_lines WHERE journal_entry_id = v_journal_id;
  DELETE FROM finance.journal_entries WHERE id = v_journal_id;
  RAISE NOTICE 'Test complete (cleaned up)';
END;
$$;
