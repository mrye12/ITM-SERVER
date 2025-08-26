-- =============================================
-- SECURITY ENHANCEMENT SCHEMA FOR ITM TRADING (FIXED)
-- Two-Factor Authentication & Advanced Security
-- =============================================

-- First, ensure we can reference auth schema
-- (This should be already available in Supabase)

-- 1. Two-Factor Authentication Tables
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[], -- Encrypted backup codes
    recovery_email TEXT,
    last_security_update TIMESTAMPTZ DEFAULT NOW(),
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    security_questions JSONB, -- Encrypted security Q&A
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_security_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Session Management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- Country, city, etc.
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Security Events Log
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type TEXT NOT NULL, -- 'login_attempt', 'mfa_challenge', 'suspicious_activity', etc.
    event_severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location JSONB,
    event_data JSONB, -- Additional event details
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_security_events_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. API Rate Limiting
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP or user_id
    endpoint TEXT NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Data Encryption Keys
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL UNIQUE,
    key_version INTEGER NOT NULL DEFAULT 1,
    encrypted_key TEXT NOT NULL, -- Encrypted with master key
    key_purpose TEXT NOT NULL, -- 'database', 'file', 'backup', etc.
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Compliance Audit Trail
CREATE TABLE IF NOT EXISTS compliance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    resource_type TEXT NOT NULL, -- 'financial_record', 'trade_data', etc.
    resource_id UUID,
    action_type TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'export'
    action_details JSONB,
    compliance_flags TEXT[], -- 'gdpr', 'sox', 'iso27001', etc.
    data_classification TEXT DEFAULT 'internal', -- 'public', 'internal', 'confidential', 'restricted'
    retention_period INTERVAL DEFAULT '7 years',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_compliance_audit_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7. Risk Assessment
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    assessment_type TEXT NOT NULL, -- 'login', 'transaction', 'data_access'
    risk_factors JSONB, -- Detailed risk analysis
    risk_score INTEGER NOT NULL, -- 0-100
    risk_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    mitigation_actions TEXT[],
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_risk_assessments_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_risk_assessments_approver FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(event_severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier ON api_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_user_id ON compliance_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_resource ON compliance_audit(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_security_settings
CREATE POLICY "Users can view own security settings" ON user_security_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" ON user_security_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security settings" ON user_security_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for security_events
CREATE POLICY "Users can view own security events" ON security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Security admins can view all events" ON security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'security_admin')
        )
    );

-- RLS Policies for compliance_audit
CREATE POLICY "Compliance officers can view all audit logs" ON compliance_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'compliance_officer', 'auditor')
        )
    );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_security_settings_updated_at 
    BEFORE UPDATE ON user_security_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
    user_id_param UUID,
    event_type_param TEXT,
    ip_address_param INET,
    device_fingerprint_param TEXT
) RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 0;
    failed_attempts_count INTEGER;
    suspicious_ip_count INTEGER;
    new_device_count INTEGER;
BEGIN
    -- Check failed login attempts in last hour
    SELECT COUNT(*) INTO failed_attempts_count
    FROM security_events
    WHERE user_id = user_id_param
    AND event_type = 'login_failed'
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Check suspicious IPs
    SELECT COUNT(*) INTO suspicious_ip_count
    FROM security_events
    WHERE ip_address = ip_address_param
    AND event_severity IN ('high', 'critical')
    AND created_at > NOW() - INTERVAL '24 hours';
    
    -- Check new device
    SELECT COUNT(*) INTO new_device_count
    FROM user_sessions
    WHERE user_id = user_id_param
    AND device_fingerprint = device_fingerprint_param;
    
    -- Calculate risk score
    base_score := base_score + (failed_attempts_count * 20);
    base_score := base_score + (suspicious_ip_count * 30);
    
    IF new_device_count = 0 THEN
        base_score := base_score + 25; -- New device adds risk
    END IF;
    
    -- Cap at 100
    IF base_score > 100 THEN
        base_score := 100;
    END IF;
    
    RETURN base_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[];
    i INTEGER;
BEGIN
    codes := ARRAY[]::TEXT[];
    
    FOR i IN 1..10 LOOP
        codes := array_append(codes, 
            LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
        );
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL SECURITY SETTINGS
-- =============================================

-- Create security settings for existing users (if any)
-- This will be handled by the application when users first login

-- =============================================
-- GRANTS & PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_security_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON security_events TO authenticated;
GRANT SELECT ON compliance_audit TO authenticated;
GRANT SELECT, INSERT ON risk_assessments TO authenticated;

-- Grant admin permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DO $$ BEGIN
    RAISE NOTICE 'Security enhancement schema created successfully!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '• Two-Factor Authentication system';
    RAISE NOTICE '• Advanced session management';
    RAISE NOTICE '• Security events logging';
    RAISE NOTICE '• API rate limiting';
    RAISE NOTICE '• Data encryption key management';
    RAISE NOTICE '• Compliance audit trail';
    RAISE NOTICE '• Risk assessment system';
    RAISE NOTICE '• Row Level Security enabled';
    RAISE NOTICE 'All tables connected to Supabase Auth with proper foreign keys!';
END $$;
