-- Test script to isolate commodities table issue
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if exists (for testing)
DROP TABLE IF EXISTS commodities CASCADE;

-- Create commodities table
CREATE TABLE commodities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    grade VARCHAR(20),
    origin_country VARCHAR(50),
    hs_code VARCHAR(20),
    export_eligible BOOLEAN DEFAULT TRUE,
    min_order_quantity DECIMAL(15,3),
    unit_of_measure VARCHAR(20),
    standard_price DECIMAL(15,2),
    quality_specs JSONB,
    compliance_docs JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if table was created successfully
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commodities') THEN
        RAISE NOTICE 'SUCCESS: Commodities table created successfully';
        
        -- Check if code column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'commodities' AND column_name = 'code') THEN
            RAISE NOTICE 'SUCCESS: Code column exists in commodities table';
            
            -- Try to insert test data
            INSERT INTO commodities (code, name, category, grade, export_eligible, unit_of_measure) VALUES
            ('TEST-001', 'Test Commodity', 'Test', 'A', true, 'MT')
            ON CONFLICT (code) DO NOTHING;
            
            RAISE NOTICE 'SUCCESS: Test data inserted successfully';
        ELSE
            RAISE NOTICE 'ERROR: Code column does not exist in commodities table';
        END IF;
    ELSE
        RAISE NOTICE 'ERROR: Commodities table was not created';
    END IF;
END $$;

-- Verify the data
SELECT 'Final verification' as status, * FROM commodities WHERE code = 'TEST-001';

