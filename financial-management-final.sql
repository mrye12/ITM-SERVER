-- =============================================
-- ADVANCED FINANCIAL MANAGEMENT SCHEMA (FINAL FIX)
-- Multi-Currency, Tax, Accounting & Banking Integration
-- =============================================

-- 1. Currency Management
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) NOT NULL UNIQUE, -- USD, IDR, EUR, etc.
    name TEXT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_crypto BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exchange Rates (Real-time)
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency_id UUID NOT NULL,
    to_currency_id UUID NOT NULL,
    rate DECIMAL(18,8) NOT NULL,
    source TEXT NOT NULL, -- 'bank_indonesia', 'xe.com', 'api_layer', etc.
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency_id, to_currency_id, valid_from)
);

-- Add foreign key constraints separately
ALTER TABLE exchange_rates 
ADD CONSTRAINT fk_exchange_rates_from_currency 
FOREIGN KEY (from_currency_id) REFERENCES currencies(id);

ALTER TABLE exchange_rates 
ADD CONSTRAINT fk_exchange_rates_to_currency 
FOREIGN KEY (to_currency_id) REFERENCES currencies(id);

-- 3. Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    account_subtype TEXT, -- 'current_asset', 'fixed_asset', 'current_liability', etc.
    parent_account_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    is_system_account BOOLEAN DEFAULT FALSE,
    normal_balance TEXT NOT NULL, -- 'debit' or 'credit'
    description TEXT,
    tax_category TEXT, -- For tax reporting
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints separately
ALTER TABLE chart_of_accounts 
ADD CONSTRAINT fk_chart_accounts_parent 
FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE chart_of_accounts 
ADD CONSTRAINT fk_chart_accounts_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 4. Financial Transactions (Double-Entry Accounting)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    reference_type TEXT, -- 'sales_order', 'purchase_order', 'invoice', 'payment', etc.
    reference_id UUID,
    description TEXT NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    currency_id UUID NOT NULL,
    exchange_rate DECIMAL(18,8) DEFAULT 1.0,
    base_currency_amount DECIMAL(18,2) NOT NULL, -- Amount in company base currency
    status TEXT DEFAULT 'draft', -- 'draft', 'posted', 'reversed'
    posted_by UUID,
    posted_at TIMESTAMPTZ,
    reversed_by UUID,
    reversed_at TIMESTAMPTZ,
    reversal_reason TEXT,
    fiscal_year INTEGER,
    fiscal_period INTEGER,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints separately
ALTER TABLE financial_transactions 
ADD CONSTRAINT fk_financial_transactions_currency 
FOREIGN KEY (currency_id) REFERENCES currencies(id);

ALTER TABLE financial_transactions 
ADD CONSTRAINT fk_financial_transactions_posted_by 
FOREIGN KEY (posted_by) REFERENCES auth.users(id);

ALTER TABLE financial_transactions 
ADD CONSTRAINT fk_financial_transactions_reversed_by 
FOREIGN KEY (reversed_by) REFERENCES auth.users(id);

ALTER TABLE financial_transactions 
ADD CONSTRAINT fk_financial_transactions_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 5. Journal Entries (Transaction Details)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    line_number INTEGER NOT NULL,
    account_id UUID NOT NULL,
    debit_amount DECIMAL(18,2) DEFAULT 0,
    credit_amount DECIMAL(18,2) DEFAULT 0,
    description TEXT,
    cost_center TEXT,
    project_code TEXT,
    dimension1 TEXT, -- For additional reporting dimensions
    dimension2 TEXT,
    dimension3 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_amounts CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (debit_amount = 0 AND credit_amount > 0)
    )
);

-- Add foreign key constraints separately
ALTER TABLE journal_entries 
ADD CONSTRAINT fk_journal_entries_transaction 
FOREIGN KEY (transaction_id) REFERENCES financial_transactions(id) ON DELETE CASCADE;

ALTER TABLE journal_entries 
ADD CONSTRAINT fk_journal_entries_account 
FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);

-- 6. Tax Configuration
CREATE TABLE IF NOT EXISTS tax_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_code VARCHAR(20) NOT NULL UNIQUE,
    tax_name TEXT NOT NULL,
    tax_type TEXT NOT NULL, -- 'vat', 'sales_tax', 'withholding_tax', 'import_duty'
    tax_rate DECIMAL(5,4) NOT NULL, -- Percentage as decimal (e.g., 0.11 for 11%)
    is_compound BOOLEAN DEFAULT FALSE, -- Tax on tax
    effective_from DATE NOT NULL,
    effective_until DATE,
    account_payable_id UUID,
    account_receivable_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    country_code VARCHAR(2) DEFAULT 'ID',
    regulatory_code TEXT, -- Government tax code
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints separately
ALTER TABLE tax_codes 
ADD CONSTRAINT fk_tax_codes_account_payable 
FOREIGN KEY (account_payable_id) REFERENCES chart_of_accounts(id);

ALTER TABLE tax_codes 
ADD CONSTRAINT fk_tax_codes_account_receivable 
FOREIGN KEY (account_receivable_id) REFERENCES chart_of_accounts(id);

-- 7. Banking Integration
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type TEXT NOT NULL, -- 'checking', 'savings', 'credit_line'
    currency_id UUID NOT NULL,
    current_balance DECIMAL(18,2) DEFAULT 0,
    available_balance DECIMAL(18,2) DEFAULT 0,
    gl_account_id UUID,
    bank_code VARCHAR(10), -- Indonesian bank code
    swift_code VARCHAR(11),
    iban VARCHAR(34),
    routing_number VARCHAR(20),
    api_connection JSONB, -- Bank API connection details
    auto_reconcile BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints separately
ALTER TABLE bank_accounts 
ADD CONSTRAINT fk_bank_accounts_currency 
FOREIGN KEY (currency_id) REFERENCES currencies(id);

ALTER TABLE bank_accounts 
ADD CONSTRAINT fk_bank_accounts_gl_account 
FOREIGN KEY (gl_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE bank_accounts 
ADD CONSTRAINT fk_bank_accounts_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 8. Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    value_date DATE,
    transaction_type TEXT NOT NULL, -- 'debit', 'credit'
    amount DECIMAL(18,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    counterparty_name TEXT,
    counterparty_account VARCHAR(50),
    counterparty_bank TEXT,
    transaction_code TEXT, -- Bank-specific transaction code
    balance_after DECIMAL(18,2),
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_with UUID,
    reconciled_by UUID,
    reconciled_at TIMESTAMPTZ,
    imported_from TEXT, -- Source system
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints separately
ALTER TABLE bank_transactions 
ADD CONSTRAINT fk_bank_transactions_bank_account 
FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id);

ALTER TABLE bank_transactions 
ADD CONSTRAINT fk_bank_transactions_reconciled_with 
FOREIGN KEY (reconciled_with) REFERENCES financial_transactions(id);

ALTER TABLE bank_transactions 
ADD CONSTRAINT fk_bank_transactions_reconciled_by 
FOREIGN KEY (reconciled_by) REFERENCES auth.users(id);

-- 9. Payment Terms
CREATE TABLE IF NOT EXISTS payment_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    days_net INTEGER NOT NULL, -- Net payment days
    discount_days INTEGER DEFAULT 0, -- Early payment discount days
    discount_percentage DECIMAL(5,4) DEFAULT 0, -- Discount percentage
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Budget Planning
CREATE TABLE IF NOT EXISTS budget_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_name TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    budget_type TEXT NOT NULL, -- 'operating', 'capital', 'cash_flow'
    status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'active', 'closed'
    currency_id UUID NOT NULL,
    total_budget DECIMAL(18,2) NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    effective_from DATE NOT NULL,
    effective_until DATE NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints separately
ALTER TABLE budget_plans 
ADD CONSTRAINT fk_budget_plans_currency 
FOREIGN KEY (currency_id) REFERENCES currencies(id);

ALTER TABLE budget_plans 
ADD CONSTRAINT fk_budget_plans_approved_by 
FOREIGN KEY (approved_by) REFERENCES auth.users(id);

ALTER TABLE budget_plans 
ADD CONSTRAINT fk_budget_plans_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 11. Budget Line Items
CREATE TABLE IF NOT EXISTS budget_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_plan_id UUID NOT NULL,
    account_id UUID NOT NULL,
    cost_center TEXT,
    project_code TEXT,
    period_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annually'
    period_number INTEGER NOT NULL, -- 1-12 for monthly, 1-4 for quarterly, 1 for annual
    budgeted_amount DECIMAL(18,2) NOT NULL,
    actual_amount DECIMAL(18,2) DEFAULT 0,
    variance_amount DECIMAL(18,2) DEFAULT 0,
    variance_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(budget_plan_id, account_id, cost_center, period_type, period_number)
);

-- Add foreign key constraints separately
ALTER TABLE budget_line_items 
ADD CONSTRAINT fk_budget_line_items_budget 
FOREIGN KEY (budget_plan_id) REFERENCES budget_plans(id) ON DELETE CASCADE;

ALTER TABLE budget_line_items 
ADD CONSTRAINT fk_budget_line_items_account 
FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);

-- 12. Financial Reports Configuration
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL, -- 'balance_sheet', 'income_statement', 'cash_flow', 'trial_balance'
    report_template JSONB NOT NULL, -- Report structure and formatting
    default_filters JSONB, -- Default date ranges, accounts, etc.
    is_system_report BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint separately
ALTER TABLE financial_reports 
ADD CONSTRAINT fk_financial_reports_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency_id, to_currency_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_transaction ON journal_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account ON journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_budget ON budget_line_items(budget_plan_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_account ON budget_line_items(account_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial data (Admin and Finance roles only)
DROP POLICY IF EXISTS "Finance team can access financial data" ON financial_transactions;
CREATE POLICY "Finance team can access financial data" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'finance_manager', 'accountant')
        )
    );

DROP POLICY IF EXISTS "Finance team can access journal entries" ON journal_entries;
CREATE POLICY "Finance team can access journal entries" ON journal_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'finance_manager', 'accountant')
        )
    );

DROP POLICY IF EXISTS "Users can view currencies" ON currencies;
CREATE POLICY "Users can view currencies" ON currencies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view exchange rates" ON exchange_rates;
CREATE POLICY "Users can view exchange rates" ON exchange_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view payment terms" ON payment_terms;
CREATE POLICY "Users can view payment terms" ON payment_terms FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update budget actuals
CREATE OR REPLACE FUNCTION update_budget_actuals()
RETURNS TRIGGER AS $$
DECLARE
    budget_record RECORD;
    period_num INTEGER;
    period_type TEXT;
BEGIN
    -- Find matching budget line items for posted transactions
    IF NEW.status = 'posted' AND (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        -- Get current period (simplified - monthly)
        period_num := EXTRACT(MONTH FROM NEW.transaction_date);
        period_type := 'monthly';
        
        -- Update budget actuals for each journal entry
        FOR budget_record IN 
            SELECT DISTINCT bli.id, bli.budgeted_amount, bli.actual_amount
            FROM budget_line_items bli
            JOIN journal_entries je ON je.account_id = bli.account_id
            WHERE je.transaction_id = NEW.id
            AND bli.period_number = period_num
            AND bli.period_type = period_type
        LOOP
            -- Calculate new actual amount from all transactions for this account and period
            UPDATE budget_line_items 
            SET 
                actual_amount = (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN coa.normal_balance = 'debit' 
                            THEN je.debit_amount - je.credit_amount
                            ELSE je.credit_amount - je.debit_amount
                        END
                    ), 0)
                    FROM journal_entries je
                    JOIN chart_of_accounts coa ON coa.id = je.account_id
                    JOIN financial_transactions ft ON ft.id = je.transaction_id
                    WHERE je.account_id = budget_record.id
                    AND ft.status = 'posted'
                    AND EXTRACT(MONTH FROM ft.transaction_date) = period_num
                ),
                variance_amount = budgeted_amount - actual_amount,
                variance_percentage = CASE 
                    WHEN budgeted_amount != 0 
                    THEN ((actual_amount - budgeted_amount) / budgeted_amount) * 100
                    ELSE 0 
                END,
                updated_at = NOW()
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update budget actuals
DROP TRIGGER IF EXISTS update_budget_actuals_trigger ON financial_transactions;
CREATE TRIGGER update_budget_actuals_trigger
    AFTER INSERT OR UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_budget_actuals();

-- Function to validate journal entries (balanced)
CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
    total_debits DECIMAL(18,2);
    total_credits DECIMAL(18,2);
BEGIN
    -- Calculate totals for the transaction
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM journal_entries
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    -- Check if balanced
    IF ABS(total_debits - total_credits) > 0.01 THEN
        RAISE EXCEPTION 'Journal entries must be balanced. Debits: %, Credits: %', 
            total_debits, total_credits;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate journal balance
DROP TRIGGER IF EXISTS validate_journal_balance_trigger ON journal_entries;
CREATE TRIGGER validate_journal_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION validate_journal_balance();

-- Function to update bank account balances
CREATE OR REPLACE FUNCTION update_bank_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bank_accounts 
        SET 
            current_balance = current_balance + 
                CASE WHEN NEW.transaction_type = 'credit' 
                THEN NEW.amount 
                ELSE -NEW.amount 
                END,
            updated_at = NOW()
        WHERE id = NEW.bank_account_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update bank balances
DROP TRIGGER IF EXISTS update_bank_balance_trigger ON bank_transactions;
CREATE TRIGGER update_bank_balance_trigger
    AFTER INSERT ON bank_transactions
    FOR EACH ROW EXECUTE FUNCTION update_bank_balance();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('IDR', 'Indonesian Rupiah', 'Rp', 0),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('JPY', 'Japanese Yen', '¥', 0),
('SGD', 'Singapore Dollar', 'S$', 2),
('AUD', 'Australian Dollar', 'A$', 2)
ON CONFLICT (code) DO NOTHING;

-- Insert default chart of accounts (Fixed with correct column order)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_subtype, normal_balance, is_system_account) VALUES
-- Assets
('1000', 'Current Assets', 'asset', 'current_asset', 'debit', true),
('1100', 'Cash and Cash Equivalents', 'asset', 'current_asset', 'debit', true),
('1110', 'Cash in Bank - IDR', 'asset', 'current_asset', 'debit', true),
('1111', 'Cash in Bank - USD', 'asset', 'current_asset', 'debit', true),
('1200', 'Accounts Receivable', 'asset', 'current_asset', 'debit', true),
('1300', 'Inventory', 'asset', 'current_asset', 'debit', true),
('1500', 'Fixed Assets', 'asset', 'fixed_asset', 'debit', true),
('1510', 'Equipment', 'asset', 'fixed_asset', 'debit', true),
('1520', 'Accumulated Depreciation - Equipment', 'asset', 'fixed_asset', 'credit', true),

-- Liabilities
('2000', 'Current Liabilities', 'liability', 'current_liability', 'credit', true),
('2100', 'Accounts Payable', 'liability', 'current_liability', 'credit', true),
('2200', 'Tax Payable', 'liability', 'current_liability', 'credit', true),
('2210', 'VAT Payable', 'liability', 'current_liability', 'credit', true),

-- Equity
('3000', 'Owner''s Equity', 'equity', 'equity', 'credit', true),
('3100', 'Capital Stock', 'equity', 'equity', 'credit', true),
('3200', 'Retained Earnings', 'equity', 'equity', 'credit', true),

-- Revenue
('4000', 'Sales Revenue', 'revenue', 'operating_revenue', 'credit', true),
('4100', 'Commodity Sales', 'revenue', 'operating_revenue', 'credit', true),

-- Expenses
('5000', 'Cost of Goods Sold', 'expense', 'operating_expense', 'debit', true),
('6000', 'Operating Expenses', 'expense', 'operating_expense', 'debit', true),
('6100', 'General & Administrative', 'expense', 'operating_expense', 'debit', true)
ON CONFLICT (account_code) DO NOTHING;

-- Insert default tax codes (Indonesian taxes)
INSERT INTO tax_codes (tax_code, tax_name, tax_type, tax_rate, effective_from, country_code) VALUES
('VAT-11', 'VAT 11%', 'vat', 0.11, '2024-01-01', 'ID'),
('VAT-0', 'VAT 0% (Export)', 'vat', 0.00, '2024-01-01', 'ID'),
('PPH-21', 'PPh 21 - Employee Income Tax', 'withholding_tax', 0.05, '2024-01-01', 'ID'),
('PPH-23', 'PPh 23 - Service Tax', 'withholding_tax', 0.02, '2024-01-01', 'ID')
ON CONFLICT (tax_code) DO NOTHING;

-- Insert default payment terms
INSERT INTO payment_terms (code, name, days_net, discount_days, discount_percentage) VALUES
('NET30', 'Net 30 Days', 30, 0, 0),
('NET60', 'Net 60 Days', 60, 0, 0),
('2/10NET30', '2% 10 Days, Net 30', 30, 10, 0.02),
('COD', 'Cash on Delivery', 0, 0, 0),
('PREPAID', 'Prepayment Required', -1, 0, 0)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- GRANTS & PERMISSIONS
-- =============================================

GRANT SELECT ON currencies TO authenticated;
GRANT SELECT ON exchange_rates TO authenticated;
GRANT SELECT ON payment_terms TO authenticated;
GRANT SELECT ON chart_of_accounts TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DO $$ BEGIN
    RAISE NOTICE 'Financial Management schema created successfully!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '• Multi-currency support with real-time exchange rates';
    RAISE NOTICE '• Double-entry accounting system';
    RAISE NOTICE '• Tax management (VAT, withholding tax)';
    RAISE NOTICE '• Banking integration and reconciliation';
    RAISE NOTICE '• Budget planning and variance analysis';
    RAISE NOTICE '• Financial reporting framework';
    RAISE NOTICE '• Payment terms management';
    RAISE NOTICE '• Chart of accounts with Indonesian standards';
    RAISE NOTICE 'All connected to Supabase with separate foreign key constraints!';
END $$;
