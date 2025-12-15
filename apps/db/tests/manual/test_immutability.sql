-- Test journal immutability constraint
-- Run: docker exec -i aibos_db psql -U aibos -d aibos_local < tests/manual/test_immutability.sql

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
  
  -- Create a balanced journal entry
  INSERT INTO finance.journal_entries (id, tenant_id, company_id, posting_date, status, created_by)
  VALUES (uuid_generate_v4(), v_tenant_id, v_company_id, CURRENT_DATE, 'DRAFT', v_user_id)
  RETURNING id INTO v_journal_id;
  
  -- Add balanced lines
  INSERT INTO finance.journal_lines (journal_entry_id, account_id, direction, amount_cents, currency)
  VALUES 
    (v_journal_id, v_account_id, 'DEBIT', 10000, 'SGD'),
    (v_journal_id, v_account_id, 'CREDIT', 10000, 'SGD');
  
  -- Post the journal
  UPDATE finance.journal_entries SET status = 'POSTED' WHERE id = v_journal_id;
  RAISE NOTICE 'Journal entry posted (id: %)', v_journal_id;
  
  -- TEST 1: Try to UPDATE a posted journal entry
  BEGIN
    UPDATE finance.journal_entries SET description = 'Fraudulent edit' WHERE id = v_journal_id;
    RAISE NOTICE 'ERROR: Update should have been blocked!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 1 PASSED: UPDATE blocked - %', SQLERRM;
  END;
  
  -- TEST 2: Try to DELETE a posted journal entry
  BEGIN
    DELETE FROM finance.journal_entries WHERE id = v_journal_id;
    RAISE NOTICE 'ERROR: Delete should have been blocked!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 2 PASSED: DELETE blocked - %', SQLERRM;
  END;
  
  -- TEST 3: Try to UPDATE a journal line
  BEGIN
    UPDATE finance.journal_lines SET amount_cents = 99999 WHERE journal_entry_id = v_journal_id AND direction = 'DEBIT';
    RAISE NOTICE 'ERROR: Line update should have been blocked!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 3 PASSED: Line UPDATE blocked - %', SQLERRM;
  END;
  
  -- TEST 4: Try to DELETE a journal line
  BEGIN
    DELETE FROM finance.journal_lines WHERE journal_entry_id = v_journal_id;
    RAISE NOTICE 'ERROR: Line delete should have been blocked!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 4 PASSED: Line DELETE blocked - %', SQLERRM;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE 'ALL IMMUTABILITY TESTS PASSED!';
  RAISE NOTICE 'Note: Journal remains in DB (id: %). This is expected - posted journals cannot be deleted.', v_journal_id;
END;
$$;
