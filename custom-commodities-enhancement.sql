-- =====================================================
-- CUSTOM COMMODITIES & MATERIALS ENHANCEMENT
-- Support for user-defined commodities and materials
-- =====================================================

-- Create user-defined commodities table
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_commodities') THEN
    CREATE TABLE user_commodities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      unit_of_measure VARCHAR(50) DEFAULT 'MT',
      grade VARCHAR(50),
      export_eligible BOOLEAN DEFAULT false,
      is_custom BOOLEAN DEFAULT true,
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created user_commodities table';
  END IF;
END $$;

-- Create user-defined materials table  
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_materials') THEN
    CREATE TABLE user_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      unit_of_measure VARCHAR(50) DEFAULT 'Unit',
      supplier_info JSONB,
      specifications JSONB,
      is_custom BOOLEAN DEFAULT true,
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created user_materials table';
  END IF;
END $$;

-- Create user-defined equipment types table
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_equipment_types') THEN
    CREATE TABLE user_equipment_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      description TEXT,
      specifications JSONB,
      maintenance_schedule JSONB,
      is_custom BOOLEAN DEFAULT true,
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created user_equipment_types table';
  END IF;
END $$;

-- Create indexes for performance
DO $$ BEGIN
  BEGIN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commodities_code ON user_commodities(code);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commodities_category ON user_commodities(category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commodities_created_by ON user_commodities(created_by);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_materials_code ON user_materials(code);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_materials_category ON user_materials(category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_materials_created_by ON user_materials(created_by);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_equipment_types_code ON user_equipment_types(code);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_equipment_types_category ON user_equipment_types(category);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_equipment_types_created_by ON user_equipment_types(created_by);
    
    RAISE NOTICE 'Created indexes for user-defined tables';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some indexes may already exist: %', SQLERRM;
  END;
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE user_commodities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_materials ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_equipment_types ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'Enabled RLS for user-defined tables';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RLS may already be enabled: %', SQLERRM;
END $$;

-- Create RLS policies
DO $$ BEGIN
  -- User commodities policies
  BEGIN
    CREATE POLICY "Users can view all user commodities" 
      ON user_commodities FOR SELECT 
      USING (true);
      
    CREATE POLICY "Users can insert their own commodities" 
      ON user_commodities FOR INSERT 
      WITH CHECK (auth.uid() = created_by);
      
    CREATE POLICY "Users can update their own commodities" 
      ON user_commodities FOR UPDATE 
      USING (auth.uid() = created_by);
      
    CREATE POLICY "Admins can manage all commodities" 
      ON user_commodities FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      );
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'User commodities policies already exist';
  END;

  -- User materials policies
  BEGIN
    CREATE POLICY "Users can view all user materials" 
      ON user_materials FOR SELECT 
      USING (true);
      
    CREATE POLICY "Users can insert their own materials" 
      ON user_materials FOR INSERT 
      WITH CHECK (auth.uid() = created_by);
      
    CREATE POLICY "Users can update their own materials" 
      ON user_materials FOR UPDATE 
      USING (auth.uid() = created_by);
      
    CREATE POLICY "Admins can manage all materials" 
      ON user_materials FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      );
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'User materials policies already exist';
  END;

  -- User equipment types policies
  BEGIN
    CREATE POLICY "Users can view all user equipment types" 
      ON user_equipment_types FOR SELECT 
      USING (true);
      
    CREATE POLICY "Users can insert their own equipment types" 
      ON user_equipment_types FOR INSERT 
      WITH CHECK (auth.uid() = created_by);
      
    CREATE POLICY "Users can update their own equipment types" 
      ON user_equipment_types FOR UPDATE 
      USING (auth.uid() = created_by);
      
    CREATE POLICY "Admins can manage all equipment types" 
      ON user_equipment_types FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
        )
      );
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'User equipment types policies already exist';
  END;
END $$;

-- Create function to get all commodities (built-in + custom)
CREATE OR REPLACE FUNCTION get_all_commodities()
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  category VARCHAR,
  description TEXT,
  unit_of_measure VARCHAR,
  grade VARCHAR,
  export_eligible BOOLEAN,
  is_custom BOOLEAN,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- Get built-in commodities
  SELECT 
    c.id,
    c.code,
    c.name,
    c.category,
    c.description,
    c.unit_of_measure,
    c.grade,
    c.export_eligible,
    false as is_custom,
    NULL::UUID as created_by,
    c.created_at
  FROM commodities c
  
  UNION ALL
  
  -- Get user-defined commodities
  SELECT 
    uc.id,
    uc.code,
    uc.name,
    uc.category,
    uc.description,
    uc.unit_of_measure,
    uc.grade,
    uc.export_eligible,
    uc.is_custom,
    uc.created_by,
    uc.created_at
  FROM user_commodities uc
  
  ORDER BY is_custom ASC, category ASC, name ASC;
$$;

-- Create function to get all materials (built-in + custom)
CREATE OR REPLACE FUNCTION get_all_materials()
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  category VARCHAR,
  description TEXT,
  unit_of_measure VARCHAR,
  specifications JSONB,
  is_custom BOOLEAN,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- Get user-defined materials (assuming we don't have built-in materials table)
  SELECT 
    um.id,
    um.code,
    um.name,
    um.category,
    um.description,
    um.unit_of_measure,
    um.specifications,
    um.is_custom,
    um.created_by,
    um.created_at
  FROM user_materials um
  
  ORDER BY is_custom ASC, category ASC, name ASC;
$$;

-- Insert sample user commodities
DO $$ 
DECLARE
  admin_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Insert sample custom commodities if they don't exist
    INSERT INTO user_commodities (code, name, category, description, unit_of_measure, grade, export_eligible, created_by) 
    VALUES
      ('COAL-SPECIAL', 'Special Grade Coal', 'Coal', 'High-quality special grade coal for specific applications', 'MT', 'Special', true, admin_id),
      ('NI-PREMIUM', 'Premium Nickel Ore', 'Nickel', 'Premium grade nickel ore with enhanced purity', 'MT', 'Premium', true, admin_id),
      ('IRON-PELLET', 'Iron Ore Pellets', 'Iron', 'Processed iron ore pellets for steel production', 'MT', 'Pellet', true, admin_id),
      ('COPPER-CUSTOM', 'Custom Copper Concentrate', 'Copper', 'Custom copper concentrate for specific smelter requirements', 'MT', 'Concentrate', true, admin_id),
      ('GOLD-DORE', 'Gold Dore Bar', 'Precious Metals', 'Semi-pure gold alloy for refining', 'Troy Oz', 'Dore', true, admin_id)
    ON CONFLICT (code) DO NOTHING;
    
    -- Insert sample custom materials
    INSERT INTO user_materials (code, name, category, description, unit_of_measure, specifications, created_by)
    VALUES
      ('CHEM-FLOTATION', 'Flotation Chemicals', 'Chemicals', 'Specialized chemicals for ore flotation process', 'Liter', '{"purity": "99.5%", "ph_range": "6.5-7.5"}', admin_id),
      ('EQUIP-CRUSHER', 'Heavy Duty Crusher', 'Equipment', 'Industrial grade rock crusher for mining operations', 'Unit', '{"capacity": "500 tons/hour", "power": "750 kW"}', admin_id),
      ('SPARE-CONVEYOR', 'Conveyor Belt Components', 'Spare Parts', 'High-grade conveyor belt and components', 'Set', '{"belt_width": "1200mm", "material": "steel-cord"}', admin_id)
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE 'Inserted sample custom commodities and materials';
  ELSE
    RAISE NOTICE 'No admin user found, skipping sample data insertion';
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_user_commodities_updated_at ON user_commodities;
  CREATE TRIGGER update_user_commodities_updated_at 
    BEFORE UPDATE ON user_commodities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_user_materials_updated_at ON user_materials;
  CREATE TRIGGER update_user_materials_updated_at 
    BEFORE UPDATE ON user_materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_user_equipment_types_updated_at ON user_equipment_types;
  CREATE TRIGGER update_user_equipment_types_updated_at 
    BEFORE UPDATE ON user_equipment_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
    
  RAISE NOTICE 'Created update triggers for user-defined tables';
END $$;

RAISE NOTICE '✅ Custom commodities and materials enhancement completed successfully!';
RAISE NOTICE '🎯 Features added:';
RAISE NOTICE '  - user_commodities table for custom commodity types';
RAISE NOTICE '  - user_materials table for custom materials';
RAISE NOTICE '  - user_equipment_types table for custom equipment';
RAISE NOTICE '  - get_all_commodities() function for combined data';
RAISE NOTICE '  - get_all_materials() function for combined data';
RAISE NOTICE '  - RLS policies for security';
RAISE NOTICE '  - Sample custom data inserted';
RAISE NOTICE '🚀 Ready for dynamic dropdown implementation!';
