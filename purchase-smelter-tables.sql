-- SQL untuk menambahkan tabel Purchase from IUP dan Sales to Smelter
-- Khusus untuk bisnis trading murni (bukan mining operations)

-- ============================================================================
-- TABEL PURCHASE FROM IUP (PEMBELIAN DARI PEMEGANG IUP)
-- ============================================================================

-- Tabel utama untuk purchase orders dari IUP
CREATE TABLE IF NOT EXISTS purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    iup_company VARCHAR(255) NOT NULL,
    iup_license_number VARCHAR(100) NOT NULL,
    commodity VARCHAR(100) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'MT',
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    purchase_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    source_location VARCHAR(255) NOT NULL,
    loading_port VARCHAR(255) NOT NULL,
    quality_specifications JSONB DEFAULT '{}',
    contract_terms VARCHAR(50) NOT NULL,
    payment_terms VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'delivered', 'completed', 'cancelled')),
    documents TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- TABEL SALES TO SMELTER (PENJUALAN KE SMELTER)
-- ============================================================================

-- Tabel utama untuk sales ke smelter
CREATE TABLE IF NOT EXISTS smelter_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    smelter_company VARCHAR(255) NOT NULL,
    smelter_location VARCHAR(255) NOT NULL,
    commodity VARCHAR(100) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'MT',
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    sale_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    destination_port VARCHAR(255) NOT NULL,
    quality_specifications JSONB DEFAULT '{}',
    contract_terms VARCHAR(50) NOT NULL,
    payment_terms VARCHAR(100) NOT NULL,
    shipping_terms VARCHAR(100) NOT NULL,
    vessel_name VARCHAR(255),
    bl_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled')),
    documents TEXT[],
    margin_percentage DECIMAL(5,2),
    profit_amount DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- TABEL TRADING MARGINS (UNTUK ANALISIS PROFIT)
-- ============================================================================

-- Tabel untuk tracking margin dan profit per transaksi
CREATE TABLE IF NOT EXISTS trading_margins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES smelter_sales(id) ON DELETE CASCADE,
    commodity VARCHAR(100) NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    sale_price DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    margin_amount DECIMAL(15,2) NOT NULL,
    margin_percentage DECIMAL(5,2) NOT NULL,
    trading_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- TABEL IUP COMPANIES (MASTER DATA PERUSAHAAN IUP)
-- ============================================================================

-- Master data untuk perusahaan pemegang IUP
CREATE TABLE IF NOT EXISTS iup_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(50) NOT NULL, -- IUP, IUPK, etc
    location VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    regency VARCHAR(100) NOT NULL,
    coordinates VARCHAR(100),
    commodity_types TEXT[] NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    production_capacity BIGINT,
    quality_certifications TEXT[],
    environmental_permits TEXT[],
    license_issued DATE,
    license_expiry DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABEL SMELTER COMPANIES (MASTER DATA PERUSAHAAN SMELTER)
-- ============================================================================

-- Master data untuk perusahaan smelter
CREATE TABLE IF NOT EXISTS smelter_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    processing_capacity BIGINT,
    commodity_preference TEXT[],
    quality_requirements JSONB DEFAULT '{}',
    payment_preference TEXT[],
    shipping_preference TEXT[],
    certifications TEXT[],
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES UNTUK PERFORMANCE
-- ============================================================================

-- Indexes untuk purchases
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_number ON purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_iup_company ON purchases(iup_company);
CREATE INDEX IF NOT EXISTS idx_purchases_commodity ON purchases(commodity);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_created_by ON purchases(created_by);

-- Indexes untuk smelter_sales
CREATE INDEX IF NOT EXISTS idx_smelter_sales_sale_number ON smelter_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_smelter_sales_smelter_company ON smelter_sales(smelter_company);
CREATE INDEX IF NOT EXISTS idx_smelter_sales_commodity ON smelter_sales(commodity);
CREATE INDEX IF NOT EXISTS idx_smelter_sales_status ON smelter_sales(status);
CREATE INDEX IF NOT EXISTS idx_smelter_sales_sale_date ON smelter_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_smelter_sales_created_by ON smelter_sales(created_by);

-- Indexes untuk trading_margins
CREATE INDEX IF NOT EXISTS idx_trading_margins_commodity ON trading_margins(commodity);
CREATE INDEX IF NOT EXISTS idx_trading_margins_trading_date ON trading_margins(trading_date);
CREATE INDEX IF NOT EXISTS idx_trading_margins_purchase_id ON trading_margins(purchase_id);
CREATE INDEX IF NOT EXISTS idx_trading_margins_sale_id ON trading_margins(sale_id);

-- Indexes untuk iup_companies
CREATE INDEX IF NOT EXISTS idx_iup_companies_license_number ON iup_companies(license_number);
CREATE INDEX IF NOT EXISTS idx_iup_companies_company_name ON iup_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_iup_companies_status ON iup_companies(status);
CREATE INDEX IF NOT EXISTS idx_iup_companies_province ON iup_companies(province);

-- Indexes untuk smelter_companies
CREATE INDEX IF NOT EXISTS idx_smelter_companies_company_name ON smelter_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_smelter_companies_country ON smelter_companies(country);
CREATE INDEX IF NOT EXISTS idx_smelter_companies_status ON smelter_companies(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS pada semua tabel
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE smelter_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE iup_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE smelter_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies untuk purchases
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON purchases FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Enable update for owners') THEN
        CREATE POLICY "Enable update for owners" ON purchases FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

-- RLS Policies untuk smelter_sales
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smelter_sales' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON smelter_sales FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smelter_sales' AND policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON smelter_sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smelter_sales' AND policyname = 'Enable update for owners') THEN
        CREATE POLICY "Enable update for owners" ON smelter_sales FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

-- RLS Policies untuk trading_margins
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trading_margins' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON trading_margins FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trading_margins' AND policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON trading_margins FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- RLS Policies untuk master data (iup_companies, smelter_companies)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'iup_companies' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON iup_companies FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'iup_companies' AND policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON iup_companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smelter_companies' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON smelter_companies FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smelter_companies' AND policyname = 'Enable insert for authenticated users') THEN
        CREATE POLICY "Enable insert for authenticated users" ON smelter_companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- ============================================================================
-- TRIGGERS UNTUK AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers untuk auto-update updated_at
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchases_updated_at') THEN
        CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_smelter_sales_updated_at') THEN
        CREATE TRIGGER update_smelter_sales_updated_at BEFORE UPDATE ON smelter_sales
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_iup_companies_updated_at') THEN
        CREATE TRIGGER update_iup_companies_updated_at BEFORE UPDATE ON iup_companies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_smelter_companies_updated_at') THEN
        CREATE TRIGGER update_smelter_companies_updated_at BEFORE UPDATE ON smelter_companies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- SAMPLE DATA UNTUK TESTING
-- ============================================================================

-- Sample IUP Companies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM iup_companies WHERE license_number = 'IUP-001234-2023') THEN
        INSERT INTO iup_companies (
            company_name, license_number, license_type, location, province, regency,
            commodity_types, contact_person, email, phone, production_capacity,
            quality_certifications, license_issued, license_expiry
        ) VALUES 
        ('PT Borneo Mineral Resources', 'IUP-001234-2023', 'IUP', 'Balikpapan, Kalimantan Timur', 'Kalimantan Timur', 'Balikpapan', 
         ARRAY['Nickel Ore', 'Iron Ore'], 'Budi Santoso', 'budi@borneominerals.com', '+62 812-3456-7890', 50000,
         ARRAY['ISO 9001', 'ISPO'], '2023-01-15', '2033-01-15'),
        ('CV Sulawesi Mining', 'IUP-005678-2023', 'IUP', 'Sorowako, Sulawesi Selatan', 'Sulawesi Selatan', 'Luwu Timur', 
         ARRAY['Nickel Ore'], 'Sari Dewi', 'sari@sulawesimining.co.id', '+62 813-9876-5432', 30000,
         ARRAY['ISO 14001', 'OHSAS 18001'], '2023-03-20', '2033-03-20'),
        ('PT Maluku Emas Mining', 'IUP-009012-2023', 'IUP', 'Ternate, Maluku Utara', 'Maluku Utara', 'Ternate', 
         ARRAY['Nickel Ore', 'Gold Ore'], 'Ahmad Rahman', 'ahmad@malukuemas.com', '+62 814-5555-1234', 75000,
         ARRAY['ISO 9001', 'ISO 14001', 'PROPER Hijau'], '2023-05-10', '2033-05-10');
    END IF;
END $$;

-- Sample Smelter Companies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM smelter_companies WHERE company_name = 'Tsingshan Holding Group') THEN
        INSERT INTO smelter_companies (
            company_name, country, location, contact_person, email, phone, processing_capacity,
            commodity_preference, quality_requirements, payment_preference
        ) VALUES 
        ('Tsingshan Holding Group', 'China', 'Wenzhou, Zhejiang Province', 'Li Wei', 'li.wei@tsingshan.com', '+86 137-5888-9999', 500000,
         ARRAY['Nickel Ore', 'Stainless Steel'], '{"min_ni_content": 1.8, "max_moisture": 35, "acceptable_size": "0-100mm"}',
         ARRAY['L/C at Sight', 'T/T Advance']),
        ('PT Virtue Dragon Nickel Industry', 'Indonesia', 'Morowali, Sulawesi Tengah', 'Zhang Ming', 'zhang.ming@virtue-dragon.co.id', '+62 813-4567-8901', 300000,
         ARRAY['Nickel Ore'], '{"min_ni_content": 1.5, "max_moisture": 40, "acceptable_size": "0-150mm"}',
         ARRAY['L/C at Sight', 'T/T 30 days']),
        ('PT Obsidian Stainless Steel', 'Indonesia', 'Batang, Jawa Tengah', 'Chen Hui', 'chen.hui@obsidian-steel.com', '+62 812-7777-8888', 400000,
         ARRAY['Nickel Ore', 'Iron Ore'], '{"min_ni_content": 1.6, "max_moisture": 30, "acceptable_size": "0-100mm"}',
         ARRAY['L/C at Sight', 'T/T Advance']);
    END IF;
END $$;

-- Sample Purchase Orders
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM purchases WHERE purchase_number = 'PO202501001') THEN
        INSERT INTO purchases (
            purchase_number, iup_company, iup_license_number, commodity, grade, quantity, unit_price, total_amount,
            purchase_date, delivery_date, source_location, loading_port, quality_specifications,
            contract_terms, payment_terms, status
        ) VALUES 
        ('PO202501001', 'PT Borneo Mineral Resources', 'IUP-001234-2023', 'Nickel Ore', '1.8%', 10000, 45.00, 450000,
         '2025-01-15', '2025-02-15', 'Balikpapan, Kalimantan Timur', 'Port of Balikpapan',
         '{"ni_content": 1.8, "moisture_content": 30, "size": "0-100mm", "impurities": "<5% SiO2"}',
         'FOB', 'L/C at Sight', 'confirmed'),
        ('PO202501002', 'CV Sulawesi Mining', 'IUP-005678-2023', 'Nickel Ore', '1.5%', 15000, 42.00, 630000,
         '2025-01-20', '2025-02-20', 'Sorowako, Sulawesi Selatan', 'Port of Makassar',
         '{"ni_content": 1.5, "moisture_content": 35, "size": "0-150mm"}',
         'CFR', 'T/T Advance', 'draft');
    END IF;
END $$;

-- Sample Smelter Sales
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM smelter_sales WHERE sale_number = 'SS202501001') THEN
        INSERT INTO smelter_sales (
            sale_number, smelter_company, smelter_location, commodity, grade, quantity, unit_price, total_amount,
            sale_date, delivery_date, destination_port, quality_specifications,
            contract_terms, payment_terms, shipping_terms, status, margin_percentage, profit_amount
        ) VALUES 
        ('SS202501001', 'Tsingshan Holding Group', 'Wenzhou, Zhejiang Province', 'Nickel Ore', '1.8%', 10000, 52.00, 520000,
         '2025-01-16', '2025-03-15', 'Port of Wenzhou',
         '{"ni_content": 1.8, "moisture_content": 30, "size": "0-100mm", "fe_content": 15, "sio2_content": 45}',
         'CIF', 'L/C at Sight', 'Bulk Carrier', 'confirmed', 15.56, 70000),
        ('SS202501002', 'PT Virtue Dragon Nickel Industry', 'Morowali, Sulawesi Tengah', 'Nickel Ore', '1.5%', 15000, 48.00, 720000,
         '2025-01-22', '2025-03-20', 'Port of Morowali',
         '{"ni_content": 1.5, "moisture_content": 35, "size": "0-150mm", "fe_content": 12}',
         'CFR', 'T/T 30 days', 'Bulk Carrier', 'draft', 14.29, 90000);
    END IF;
END $$;

-- Sample Trading Margins
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM trading_margins WHERE commodity = 'Nickel Ore' AND trading_date = '2025-01-16') THEN
        INSERT INTO trading_margins (
            commodity, purchase_price, sale_price, quantity, margin_amount, margin_percentage, trading_date, notes
        ) VALUES 
        ('Nickel Ore', 45.00, 52.00, 10000, 70000, 15.56, '2025-01-16', 'Profit from Borneo Minerals to Tsingshan'),
        ('Nickel Ore', 42.00, 48.00, 15000, 90000, 14.29, '2025-01-22', 'Profit from Sulawesi Mining to Virtue Dragon');
    END IF;
END $$;

-- ============================================================================
-- VIEWS UNTUK REPORTING
-- ============================================================================

-- View untuk summary purchase dan sales
CREATE OR REPLACE VIEW v_trading_summary AS
SELECT 
    DATE_TRUNC('month', p.purchase_date) AS month,
    p.commodity,
    COUNT(p.id) AS total_purchases,
    SUM(p.quantity) AS total_purchase_quantity,
    SUM(p.total_amount) AS total_purchase_amount,
    COUNT(s.id) AS total_sales,
    SUM(s.quantity) AS total_sales_quantity,
    SUM(s.total_amount) AS total_sales_amount,
    SUM(s.profit_amount) AS total_profit
FROM purchases p
LEFT JOIN smelter_sales s ON p.commodity = s.commodity 
    AND DATE_TRUNC('month', p.purchase_date) = DATE_TRUNC('month', s.sale_date)
GROUP BY DATE_TRUNC('month', p.purchase_date), p.commodity
ORDER BY month DESC, p.commodity;

-- View untuk margin analysis
CREATE OR REPLACE VIEW v_margin_analysis AS
SELECT 
    commodity,
    AVG(margin_percentage) AS avg_margin_percentage,
    MIN(margin_percentage) AS min_margin_percentage,
    MAX(margin_percentage) AS max_margin_percentage,
    SUM(margin_amount) AS total_margin_amount,
    COUNT(*) AS total_transactions
FROM trading_margins
GROUP BY commodity
ORDER BY avg_margin_percentage DESC;

DO $$ BEGIN
    RAISE NOTICE 'Purchase and Smelter Sales tables created successfully!';
    RAISE NOTICE 'Trading system ready for IUP purchases and Smelter sales operations.';
END $$;
