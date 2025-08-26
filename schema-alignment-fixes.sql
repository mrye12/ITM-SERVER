-- =============================================
-- SCHEMA ALIGNMENT FIXES FOR ITM TRADING
-- Aligning deployed schema with provided schema
-- =============================================

-- Add missing tables from provided schema
CREATE TABLE IF NOT EXISTS app_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    source TEXT NOT NULL,
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    request_data JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    module TEXT NOT NULL,
    period TEXT,
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mobile_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    device_id TEXT NOT NULL,
    device_info JSONB,
    location JSONB,
    session_type TEXT CHECK (session_type IN ('field_inspection', 'shipment_tracking', 'document_upload', 'emergency_report')),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    activities JSONB DEFAULT '[]',
    offline_data JSONB,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
    sync_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scenario_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT CHECK (scenario_type IN ('price_change', 'volume_change', 'regulation_change', 'market_disruption', 'custom')),
    parameters JSONB NOT NULL,
    baseline_data JSONB,
    simulation_results JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    execution_duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('regulation', 'procedure', 'faq', 'best_practice', 'case_study')),
    category TEXT,
    tags JSONB DEFAULT '[]',
    source_documents UUID[] DEFAULT '{}',
    indexed_content TSVECTOR,
    ai_summary TEXT,
    view_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS esg_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_category TEXT CHECK (metric_category IN ('environmental', 'social', 'governance')),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4),
    metric_unit TEXT,
    measurement_period TEXT,
    period_start DATE,
    period_end DATE,
    commodity_id UUID REFERENCES commodities(id),
    related_transactions UUID[],
    calculation_method TEXT,
    data_sources JSONB,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables
DO $$ 
BEGIN
    -- Add missing columns to sales_orders
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN customer_name VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'product_name'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN product_name VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'price_usd'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN price_usd DECIMAL(15,4);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'delivery_term'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN delivery_term VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'loading_port'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN loading_port VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'discharge_port'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN discharge_port VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'contract_date'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN contract_date DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_orders' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE sales_orders ADD COLUMN quantity DECIMAL(15,3);
    END IF;
END $$;

-- Add missing columns to other tables
DO $$ 
BEGIN
    -- Add missing columns to shipments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'vessel'
    ) THEN
        ALTER TABLE shipments ADD COLUMN vessel TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'port_origin'
    ) THEN
        ALTER TABLE shipments ADD COLUMN port_origin TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'port_destination'
    ) THEN
        ALTER TABLE shipments ADD COLUMN port_destination TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'tonnage'
    ) THEN
        ALTER TABLE shipments ADD COLUMN tonnage DECIMAL(15,3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'cargo_type'
    ) THEN
        ALTER TABLE shipments ADD COLUMN cargo_type TEXT;
    END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_app_errors_user_id ON app_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_app_errors_severity ON app_errors(severity);
CREATE INDEX IF NOT EXISTS idx_app_errors_resolved ON app_errors(resolved);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_module ON ai_cache(module);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_mobile_sessions_user ON mobile_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_device ON mobile_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_sync ON mobile_sessions(sync_status);

CREATE INDEX IF NOT EXISTS idx_scenario_simulations_type ON scenario_simulations(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenario_simulations_created_by ON scenario_simulations(created_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON knowledge_base USING GIN(indexed_content);

CREATE INDEX IF NOT EXISTS idx_esg_metrics_category ON esg_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_esg_metrics_commodity ON esg_metrics(commodity_id);
CREATE INDEX IF NOT EXISTS idx_esg_metrics_period ON esg_metrics(period_start, period_end);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ SCHEMA ALIGNMENT COMPLETED - New tables and columns added successfully!';
END $$;
