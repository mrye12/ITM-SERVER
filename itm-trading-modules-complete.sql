-- =============================================
-- ITM TRADING COMPLETE MODULES DATABASE ENHANCEMENT
-- SPECIALIZED FOR MINING COMMODITY TRADING
-- =============================================

-- =============================================
-- 1. HUMAN RESOURCES (HR) COMPLETE MODULE
-- =============================================

-- Payroll Management
CREATE TABLE IF NOT EXISTS payroll_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_cycle_id UUID REFERENCES payroll_cycles(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    basic_salary DECIMAL(12,2),
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    overtime_rate DECIMAL(8,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    allowances JSONB DEFAULT '{}', -- transport, meal, housing, etc
    bonuses DECIMAL(12,2) DEFAULT 0,
    gross_salary DECIMAL(12,2),
    tax_deduction DECIMAL(12,2) DEFAULT 0,
    insurance_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2),
    bank_account VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Management
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_start TIME DEFAULT '08:00',
    shift_end TIME DEFAULT '17:00',
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'sick', 'leave', 'holiday')),
    location JSONB, -- GPS coordinates for mobile check-in
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Leave Management
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    max_days_per_year INTEGER DEFAULT 12,
    carry_forward BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. COMMODITY TRADING SPECIALIZED MODULE
-- =============================================

-- Real-time Commodity Pricing
CREATE TABLE IF NOT EXISTS commodity_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_code VARCHAR(20) NOT NULL,
    commodity_name VARCHAR(100) NOT NULL,
    exchange VARCHAR(50), -- LME, SHFE, CME, etc
    price_usd DECIMAL(15,4) NOT NULL,
    price_change DECIMAL(15,4),
    price_change_percent DECIMAL(6,3),
    volume DECIMAL(15,3),
    market_cap DECIMAL(18,2),
    price_date TIMESTAMPTZ NOT NULL,
    session VARCHAR(20), -- AM, PM, Close
    currency VARCHAR(3) DEFAULT 'USD',
    unit VARCHAR(20), -- per MT, per oz, etc
    grade VARCHAR(50), -- specific grade/quality
    source VARCHAR(100), -- data source/API
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Positions & Contracts
CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id VARCHAR(50) UNIQUE NOT NULL,
    commodity_id UUID REFERENCES commodities(id),
    contract_type VARCHAR(20) CHECK (contract_type IN ('spot', 'forward', 'futures')),
    position_type VARCHAR(10) CHECK (position_type IN ('long', 'short')),
    quantity DECIMAL(15,3) NOT NULL,
    entry_price DECIMAL(15,4) NOT NULL,
    current_price DECIMAL(15,4),
    unrealized_pnl DECIMAL(15,2),
    margin_required DECIMAL(15,2),
    delivery_month VARCHAR(7), -- YYYY-MM format
    delivery_location VARCHAR(100),
    counterparty VARCHAR(200),
    trader_id UUID REFERENCES employee_profiles(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'delivered', 'settled')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Testing & Certificates
CREATE TABLE IF NOT EXISTS quality_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id VARCHAR(50) UNIQUE NOT NULL,
    commodity_id UUID REFERENCES commodities(id),
    shipment_id UUID REFERENCES shipments(id),
    lot_number VARCHAR(50),
    test_date DATE NOT NULL,
    lab_name VARCHAR(200) NOT NULL,
    lab_certificate_number VARCHAR(100),
    test_type VARCHAR(50), -- assay, chemical, physical
    test_results JSONB NOT NULL, -- detailed mineral composition
    moisture_content DECIMAL(5,2),
    passed BOOLEAN NOT NULL,
    grade_achieved VARCHAR(50),
    remarks TEXT,
    retested BOOLEAN DEFAULT FALSE,
    original_test_id UUID REFERENCES quality_tests(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mining Concessions & Operations
CREATE TABLE IF NOT EXISTS mining_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concession_name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    concession_type VARCHAR(50) CHECK (concession_type IN ('exploration', 'exploitation', 'processing')),
    location JSONB NOT NULL, -- coordinates, province, regency
    area_hectares DECIMAL(12,2) NOT NULL,
    commodity_types JSONB, -- array of commodities
    owner_company VARCHAR(200) NOT NULL,
    license_issued DATE,
    license_expiry DATE NOT NULL,
    production_capacity DECIMAL(15,3),
    current_production DECIMAL(15,3),
    environmental_permit VARCHAR(100),
    environmental_status VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export/Import Documentation
CREATE TABLE IF NOT EXISTS trade_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id),
    document_type VARCHAR(50) NOT NULL, -- COO, COA, B/L, Invoice, Packing List, etc
    document_number VARCHAR(100) NOT NULL,
    document_title VARCHAR(200),
    issued_by VARCHAR(200) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    customs_status VARCHAR(20),
    notes TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. ADVANCED CRM & CUSTOMER MANAGEMENT
-- =============================================

-- Customer Lifecycle Management
CREATE TABLE IF NOT EXISTS customer_lifecycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('lead', 'prospect', 'active', 'inactive', 'churned')),
    stage_changed_date DATE NOT NULL,
    previous_stage VARCHAR(50),
    reason TEXT,
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    acquisition_cost DECIMAL(12,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,1), -- 1-10 scale
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    next_action TEXT,
    assigned_to UUID REFERENCES employee_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Interactions & Communications
CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- call, email, meeting, complaint, etc
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    interaction_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    outcome VARCHAR(50),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    handled_by UUID REFERENCES employee_profiles(id),
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. ADVANCED WAREHOUSE & INVENTORY
-- =============================================

-- Multi-location Warehouse Management
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    zone VARCHAR(50) NOT NULL,
    aisle VARCHAR(20),
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_type VARCHAR(30) CHECK (location_type IN ('storage', 'picking', 'packing', 'staging', 'quarantine')),
    capacity_mt DECIMAL(12,3),
    current_occupancy DECIMAL(12,3) DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements with Detailed Tracking
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID REFERENCES stock(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment')),
    quantity DECIMAL(15,3) NOT NULL,
    from_location_id UUID REFERENCES warehouse_locations(id),
    to_location_id UUID REFERENCES warehouse_locations(id),
    reference_type VARCHAR(50), -- shipment, sales_order, purchase_order, adjustment
    reference_id UUID,
    movement_date TIMESTAMPTZ DEFAULT NOW(),
    unit_cost DECIMAL(12,4),
    total_value DECIMAL(15,2),
    reason TEXT,
    batch_number VARCHAR(50),
    expiry_date DATE,
    quality_grade VARCHAR(50),
    moved_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. COMPLETE FINANCE & ACCOUNTING
-- =============================================

-- Accounts Payable (AP)
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id),
    invoice_number VARCHAR(100) NOT NULL,
    purchase_order_number VARCHAR(100),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) DEFAULT 1,
    amount_usd DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'overdue', 'disputed')),
    payment_terms VARCHAR(50),
    description TEXT,
    department_id UUID REFERENCES departments(id),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts Receivable (AR)
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    invoice_id UUID REFERENCES invoices(id),
    sales_order_id UUID REFERENCES sales_orders(id),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) DEFAULT 1,
    amount_usd DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    received_amount DECIMAL(15,2) DEFAULT 0,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'disputed', 'written_off')),
    payment_terms VARCHAR(50),
    aging_bucket VARCHAR(20), -- current, 30, 60, 90, 120+
    collection_notes TEXT,
    last_collection_date DATE,
    assigned_collector UUID REFERENCES employee_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Management
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_name VARCHAR(100) NOT NULL,
    budget_year INTEGER NOT NULL,
    department_id UUID REFERENCES departments(id),
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    budgeted_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    committed_amount DECIMAL(15,2) DEFAULT 0,
    variance_amount DECIMAL(15,2) DEFAULT 0,
    variance_percent DECIMAL(6,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    period_type VARCHAR(20) CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'locked')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. ADVANCED LOGISTICS & OPERATIONS
-- =============================================

-- Vessel Management
CREATE TABLE IF NOT EXISTS vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_name VARCHAR(200) NOT NULL,
    imo_number VARCHAR(20) UNIQUE,
    vessel_type VARCHAR(50) NOT NULL,
    flag_country VARCHAR(50),
    built_year INTEGER,
    gross_tonnage DECIMAL(12,2),
    net_tonnage DECIMAL(12,2),
    deadweight_tonnage DECIMAL(12,2),
    length_meters DECIMAL(8,2),
    beam_meters DECIMAL(8,2),
    draft_meters DECIMAL(6,2),
    max_speed_knots DECIMAL(4,1),
    fuel_consumption DECIMAL(8,2), -- MT per day
    owner_company VARCHAR(200),
    operator_company VARCHAR(200),
    classification_society VARCHAR(100),
    insurance_details JSONB,
    certificates JSONB,
    current_status VARCHAR(50) DEFAULT 'available',
    current_location JSONB,
    last_position_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Port Operations
CREATE TABLE IF NOT EXISTS ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_code VARCHAR(10) UNIQUE NOT NULL,
    port_name VARCHAR(200) NOT NULL,
    country VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    coordinates JSONB, -- lat, lng
    port_type VARCHAR(50), -- seaport, inland, dry port
    facilities JSONB, -- berths, cranes, storage
    operating_hours JSONB,
    contact_details JSONB,
    customs_office VARCHAR(200),
    quarantine_required BOOLEAN DEFAULT FALSE,
    max_vessel_size DECIMAL(12,2),
    cargo_handling_capacity DECIMAL(15,3),
    storage_capacity DECIMAL(15,3),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voyage Tracking
CREATE TABLE IF NOT EXISTS voyages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voyage_number VARCHAR(50) UNIQUE NOT NULL,
    vessel_id UUID REFERENCES vessels(id),
    shipment_id UUID REFERENCES shipments(id),
    departure_port_id UUID REFERENCES ports(id),
    destination_port_id UUID REFERENCES ports(id),
    planned_departure TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    distance_nautical_miles DECIMAL(10,2),
    current_position JSONB,
    speed_knots DECIMAL(4,1),
    weather_conditions JSONB,
    delays JSONB,
    fuel_consumed DECIMAL(10,2),
    voyage_status VARCHAR(30) DEFAULT 'planned' CHECK (voyage_status IN ('planned', 'loading', 'departed', 'in_transit', 'arrived', 'completed')),
    captain_name VARCHAR(100),
    crew_count INTEGER,
    cargo_manifest JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. TRADE FINANCE & BANKING
-- =============================================

-- Sales Contracts
CREATE TABLE IF NOT EXISTS sales_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    commodity_id UUID REFERENCES commodities(id),
    contract_type VARCHAR(50) CHECK (contract_type IN ('spot', 'forward', 'long_term')),
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,4) NOT NULL,
    total_value DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    delivery_terms VARCHAR(50), -- FOB, CIF, etc
    delivery_location VARCHAR(200),
    delivery_period VARCHAR(100),
    contract_date DATE NOT NULL,
    delivery_start_date DATE,
    delivery_end_date DATE,
    payment_terms VARCHAR(200),
    quality_specifications JSONB,
    penalties JSONB,
    force_majeure_clause TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'executed', 'active', 'completed', 'cancelled')),
    signed_by_customer BOOLEAN DEFAULT FALSE,
    signed_by_company BOOLEAN DEFAULT FALSE,
    contract_file_path TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Letters of Credit
CREATE TABLE IF NOT EXISTS letters_of_credit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lc_number VARCHAR(100) UNIQUE NOT NULL,
    lc_type VARCHAR(50) CHECK (lc_type IN ('sight', 'usance', 'confirmed', 'unconfirmed', 'revolving')),
    sales_contract_id UUID REFERENCES sales_contracts(id),
    customer_id UUID REFERENCES customers(id),
    issuing_bank VARCHAR(200) NOT NULL,
    advising_bank VARCHAR(200),
    confirming_bank VARCHAR(200),
    beneficiary VARCHAR(200) NOT NULL,
    applicant VARCHAR(200) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    tolerance_percent DECIMAL(5,2) DEFAULT 0,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    latest_shipment_date DATE,
    presentation_period_days INTEGER DEFAULT 21,
    terms_conditions TEXT NOT NULL,
    required_documents JSONB NOT NULL,
    partial_shipments BOOLEAN DEFAULT FALSE,
    transshipment BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'advised', 'documents_presented', 'paid', 'expired', 'cancelled')),
    amendments JSONB,
    discrepancies JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts & Transactions
CREATE TABLE IF NOT EXISTS company_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name VARCHAR(200) NOT NULL,
    bank_name VARCHAR(200) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(30) CHECK (account_type IN ('checking', 'savings', 'escrow', 'trade_finance')),
    currency VARCHAR(3) NOT NULL,
    country VARCHAR(50) NOT NULL,
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    routing_number VARCHAR(20),
    current_balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    interest_rate DECIMAL(6,4),
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'frozen', 'closed')),
    contact_person VARCHAR(100),
    contact_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. MARKET INTELLIGENCE & ANALYTICS
-- =============================================

-- Market Analysis & Reports
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_date DATE NOT NULL,
    commodity_type VARCHAR(50) NOT NULL,
    market_region VARCHAR(50),
    price_trend VARCHAR(20) CHECK (price_trend IN ('bullish', 'bearish', 'neutral')),
    demand_outlook VARCHAR(20) CHECK (demand_outlook IN ('strong', 'moderate', 'weak')),
    supply_outlook VARCHAR(20) CHECK (supply_outlook IN ('tight', 'balanced', 'surplus')),
    key_factors JSONB, -- array of market influencing factors
    price_forecast JSONB, -- short, medium, long term forecasts
    risk_factors JSONB,
    opportunities JSONB,
    analyst_notes TEXT,
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'medium', 'low')),
    data_sources JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Analysis
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    country VARCHAR(50),
    business_type VARCHAR(50),
    commodities_traded JSONB,
    estimated_revenue DECIMAL(15,2),
    market_share_percent DECIMAL(5,2),
    strengths JSONB,
    weaknesses JSONB,
    recent_activities TEXT,
    threat_level VARCHAR(20) CHECK (threat_level IN ('high', 'medium', 'low')),
    monitoring_priority VARCHAR(20) CHECK (monitoring_priority IN ('high', 'medium', 'low')),
    last_updated DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_items_cycle ON payroll_items(payroll_cycle_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);

-- Commodity pricing indexes
CREATE INDEX IF NOT EXISTS idx_commodity_prices_code_date ON commodity_prices(commodity_code, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_exchange ON commodity_prices(exchange, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_date ON commodity_prices(price_date DESC);

-- Trading positions indexes
CREATE INDEX IF NOT EXISTS idx_trading_positions_commodity ON trading_positions(commodity_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_trader ON trading_positions(trader_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_status ON trading_positions(status);

-- Quality tests indexes
CREATE INDEX IF NOT EXISTS idx_quality_tests_commodity ON quality_tests(commodity_id);
CREATE INDEX IF NOT EXISTS idx_quality_tests_shipment ON quality_tests(shipment_id);
CREATE INDEX IF NOT EXISTS idx_quality_tests_date ON quality_tests(test_date);

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_date ON customer_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_customer_lifecycle_customer ON customer_lifecycle(customer_id);

-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_accounts_payable_vendor ON accounts_payable(vendor_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer ON accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);

-- Logistics indexes
CREATE INDEX IF NOT EXISTS idx_voyages_vessel ON voyages(vessel_id);
CREATE INDEX IF NOT EXISTS idx_voyages_shipment ON voyages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_voyages_status ON voyages(voyage_status);

-- Sales contracts indexes
CREATE INDEX IF NOT EXISTS idx_sales_contracts_customer ON sales_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_commodity ON sales_contracts(commodity_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_status ON sales_contracts(status);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_date ON sales_contracts(contract_date);

-- Letters of credit indexes
CREATE INDEX IF NOT EXISTS idx_letters_credit_contract ON letters_of_credit(sales_contract_id);
CREATE INDEX IF NOT EXISTS idx_letters_credit_customer ON letters_of_credit(customer_id);
CREATE INDEX IF NOT EXISTS idx_letters_credit_status ON letters_of_credit(status);
CREATE INDEX IF NOT EXISTS idx_letters_credit_expiry ON letters_of_credit(expiry_date);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample leave types
INSERT INTO leave_types (name, description, max_days_per_year, is_paid) VALUES
('Annual Leave', 'Annual vacation leave', 21, true),
('Sick Leave', 'Medical sick leave', 14, true),
('Maternity Leave', 'Maternity leave for mothers', 90, true),
('Paternity Leave', 'Paternity leave for fathers', 14, true),
('Emergency Leave', 'Emergency family leave', 7, false)
ON CONFLICT DO NOTHING;

-- Insert sample ports
INSERT INTO ports (port_code, port_name, country, city, coordinates) VALUES
('IDTPP', 'Tanjung Perak', 'Indonesia', 'Surabaya', '{"lat": -7.2092, "lng": 112.7305}'),
('IDJKT', 'Tanjung Priok', 'Indonesia', 'Jakarta', '{"lat": -6.1041, "lng": 106.8753}'),
('SGSIN', 'Singapore Port', 'Singapore', 'Singapore', '{"lat": 1.2966, "lng": 103.8006}'),
('CNSHA', 'Shanghai', 'China', 'Shanghai', '{"lat": 31.2304, "lng": 121.4737}'),
('MYPKG', 'Port Klang', 'Malaysia', 'Klang', '{"lat": 3.0044, "lng": 101.3997}')
ON CONFLICT DO NOTHING;

-- Insert sample sales contracts (conditional - only if customers and commodities exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_contracts') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commodities') THEN
        
        -- Only insert if we have sample customers and commodities
        IF EXISTS (SELECT 1 FROM customers LIMIT 1) AND EXISTS (SELECT 1 FROM commodities LIMIT 1) THEN
            INSERT INTO sales_contracts (
                contract_number, 
                customer_id, 
                commodity_id, 
                contract_type,
                quantity, 
                unit_price, 
                total_value,
                delivery_terms,
                contract_date,
                delivery_start_date,
                payment_terms,
                status
            ) VALUES
            (
                'SC-2025-001',
                (SELECT id FROM customers LIMIT 1),
                (SELECT id FROM commodities LIMIT 1),
                'spot',
                10000,
                85.50,
                855000,
                'FOB Tanjung Perak',
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days',
                'L/C at sight',
                'active'
            )
            ON CONFLICT (contract_number) DO NOTHING;
            
            RAISE NOTICE 'Sample sales contract inserted successfully';
        ELSE
            RAISE NOTICE 'Skipping sales contracts sample data - no customers or commodities found';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping sales contracts sample data - required tables not found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting sales contracts sample data: %', SQLERRM;
END $$;

-- Success message
DO $$ BEGIN
    RAISE NOTICE '🎉 ITM TRADING COMPLETE MODULES DATABASE ENHANCEMENT DEPLOYED SUCCESSFULLY!';
    RAISE NOTICE '✅ HR Module: Payroll, Attendance, Leave Management';
    RAISE NOTICE '✅ Commodity Trading: Pricing, Positions, Quality Tests';
    RAISE NOTICE '✅ Advanced CRM: Customer Lifecycle, Interactions';
    RAISE NOTICE '✅ Warehouse: Multi-location, Stock Movements';
    RAISE NOTICE '✅ Finance: AP/AR, Budget Management';
    RAISE NOTICE '✅ Logistics: Vessel, Port, Voyage Tracking';
    RAISE NOTICE '✅ Trade Finance: Letters of Credit, Banking';
    RAISE NOTICE '✅ Market Intelligence: Analysis, Competitor Tracking';
    RAISE NOTICE '🚀 Ready for Mining Commodity Trading Operations!';
END $$;
