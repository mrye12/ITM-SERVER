-- =============================================
-- VERIFICATION SCRIPT FOR ITM TRADING DEPLOYMENT
-- Check all tables, constraints, and initial data
-- =============================================

-- 1. Check Security Tables
SELECT 'SECURITY TABLES' as section;
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'user_security_settings',
    'user_sessions', 
    'security_events',
    'api_rate_limits',
    'encryption_keys',
    'compliance_audit',
    'risk_assessments'
)
ORDER BY table_name;

-- 2. Check Financial Tables
SELECT 'FINANCIAL TABLES' as section;
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'currencies',
    'exchange_rates',
    'chart_of_accounts',
    'financial_transactions',
    'journal_entries',
    'tax_codes',
    'bank_accounts',
    'bank_transactions',
    'payment_terms',
    'budget_plans',
    'budget_line_items',
    'financial_reports'
)
ORDER BY table_name;

-- 3. Check Foreign Key Constraints
SELECT 'FOREIGN KEY CONSTRAINTS' as section;
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND (tc.table_name LIKE '%security%' 
     OR tc.table_name LIKE '%session%'
     OR tc.table_name LIKE '%audit%'
     OR tc.table_name LIKE '%risk%'
     OR tc.table_name IN ('currencies', 'exchange_rates', 'chart_of_accounts', 
                          'financial_transactions', 'journal_entries', 'tax_codes',
                          'bank_accounts', 'bank_transactions', 'budget_plans', 'budget_line_items'))
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Check RLS Policies
SELECT 'ROW LEVEL SECURITY POLICIES' as section;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE '%security%' 
     OR tablename LIKE '%session%'
     OR tablename LIKE '%audit%'
     OR tablename LIKE '%risk%'
     OR tablename IN ('currencies', 'exchange_rates', 'chart_of_accounts', 
                      'financial_transactions', 'journal_entries', 'tax_codes',
                      'bank_accounts', 'bank_transactions', 'budget_plans', 'budget_line_items'))
ORDER BY tablename, policyname;

-- 5. Check Initial Data
SELECT 'INITIAL DATA VERIFICATION' as section;
SELECT 'currencies' as table_name, count(*) as record_count FROM currencies
UNION ALL
SELECT 'payment_terms' as table_name, count(*) as record_count FROM payment_terms  
UNION ALL
SELECT 'chart_of_accounts' as table_name, count(*) as record_count FROM chart_of_accounts
UNION ALL
SELECT 'tax_codes' as table_name, count(*) as record_count FROM tax_codes
ORDER BY table_name;

-- 6. Check Functions
SELECT 'CUSTOM FUNCTIONS' as section;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_updated_at_column',
    'calculate_risk_score',
    'cleanup_expired_sessions',
    'generate_backup_codes',
    'validate_journal_balance',
    'update_bank_balance'
)
ORDER BY routine_name;

-- 7. Check Triggers
SELECT 'TRIGGERS' as section;
SELECT event_object_table, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND (event_object_table LIKE '%security%' 
     OR event_object_table LIKE '%session%'
     OR event_object_table IN ('currencies', 'chart_of_accounts', 'financial_transactions', 'bank_transactions'))
ORDER BY event_object_table, trigger_name;

-- 8. Sample Data Queries
SELECT 'SAMPLE DATA' as section;
SELECT 'Available Currencies:' as info, string_agg(code || ' (' || symbol || ')', ', ') as data
FROM currencies WHERE is_active = true;

SELECT 'Available Payment Terms:' as info, string_agg(code || ' - ' || name, ', ') as data  
FROM payment_terms WHERE is_active = true;

SELECT 'Chart of Accounts Structure:' as info, 
       count(*) || ' accounts across ' || count(DISTINCT account_type) || ' types' as data
FROM chart_of_accounts;

SELECT 'Tax Codes:' as info, string_agg(tax_code || ' (' || (tax_rate * 100)::text || '%)', ', ') as data
FROM tax_codes WHERE is_active = true;
