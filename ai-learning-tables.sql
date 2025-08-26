-- =============================================
-- AI LEARNING SYSTEM TABLES FOR ITM TRADING  
-- Self-improving prediction system database schema
-- =============================================

-- Table untuk menyimpan semua prediksi AI
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity VARCHAR(100) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'cashflow', 'maintenance'
    predicted_value DECIMAL(15,4) NOT NULL,
    prediction_period VARCHAR(20) NOT NULL, -- '1_month', '3_months', '6_months'
    factors_considered TEXT[] NOT NULL,
    confidence_level DECIMAL(5,4) NOT NULL, -- 0.0 to 1.0
    recommendations TEXT[] NOT NULL,
    model_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    parameters_used JSONB, -- Store all parameters used for prediction
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'obsolete')),
    actual_outcome DECIMAL(15,4), -- Filled when actual data becomes available
    accuracy_achieved DECIMAL(5,2), -- Calculated accuracy percentage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table untuk menyimpan hasil aktual dan akurasi prediksi
CREATE TABLE IF NOT EXISTS ai_prediction_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES ai_predictions(id) ON DELETE CASCADE,
    commodity VARCHAR(100) NOT NULL,
    predicted_value DECIMAL(15,4) NOT NULL,
    actual_value DECIMAL(15,4) NOT NULL,
    prediction_date TIMESTAMPTZ NOT NULL,
    outcome_date TIMESTAMPTZ NOT NULL,
    accuracy_percentage DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    factors_considered TEXT[] NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    variance_analysis JSONB, -- Analysis of why prediction was off
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table untuk menyimpan insight pembelajaran AI
CREATE TABLE IF NOT EXISTS ai_learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    data_points_analyzed INTEGER NOT NULL,
    overall_accuracy DECIMAL(5,2) NOT NULL,
    insights JSONB NOT NULL, -- Full LearningMetrics object
    improvement_recommendations TEXT[] NOT NULL,
    accuracy_trend VARCHAR(20), -- 'improving', 'declining', 'stable'
    confidence_in_insights DECIMAL(5,4) NOT NULL DEFAULT 0.7,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table untuk menyimpan penyesuaian model AI
CREATE TABLE IF NOT EXISTS ai_model_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    previous_accuracy DECIMAL(5,2) NOT NULL,
    target_accuracy DECIMAL(5,2) NOT NULL DEFAULT 85.0,
    adjustments_made TEXT[] NOT NULL,
    factor_weights JSONB NOT NULL, -- { "increased": [...], "decreased": [...] }
    parameter_changes JSONB, -- Before/after parameter values
    effectiveness_score DECIMAL(5,4), -- How effective the adjustment was
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    results_measured_at TIMESTAMPTZ
);

-- Table untuk tracking performance AI secara real-time
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    commodity VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    total_predictions INTEGER NOT NULL DEFAULT 0,
    accurate_predictions INTEGER NOT NULL DEFAULT 0, -- Accuracy > 80%
    average_accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    prediction_confidence_avg DECIMAL(5,4) NOT NULL DEFAULT 0,
    learning_iterations INTEGER NOT NULL DEFAULT 0,
    model_improvements INTEGER NOT NULL DEFAULT 0,
    business_impact_score DECIMAL(5,2), -- How much the predictions helped business
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_date, commodity, model_version)
);

-- Table untuk menyimpan feedback dari user tentang prediksi
CREATE TABLE IF NOT EXISTS ai_prediction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES ai_predictions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    feedback_type VARCHAR(50) NOT NULL, -- 'accuracy', 'usefulness', 'timing', 'recommendations'
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    suggested_improvements TEXT,
    business_context TEXT, -- Additional context that AI should consider
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_commodity ON ai_predictions(commodity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_status ON ai_predictions(status);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_model_version ON ai_predictions(model_version);

CREATE INDEX IF NOT EXISTS idx_ai_outcomes_prediction_id ON ai_prediction_outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_ai_outcomes_commodity ON ai_prediction_outcomes(commodity, outcome_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_outcomes_accuracy ON ai_prediction_outcomes(accuracy_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_ai_insights_commodity ON ai_learning_insights(commodity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_accuracy ON ai_learning_insights(overall_accuracy DESC);

CREATE INDEX IF NOT EXISTS idx_ai_adjustments_commodity ON ai_model_adjustments(commodity, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_adjustments_effectiveness ON ai_model_adjustments(effectiveness_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_performance_date ON ai_performance_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_performance_commodity ON ai_performance_metrics(commodity, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_prediction ON ai_prediction_feedback(prediction_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_prediction_feedback(rating DESC);

-- Functions untuk auto-update metrics
CREATE OR REPLACE FUNCTION update_ai_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily performance metrics when new outcome is recorded
    INSERT INTO ai_performance_metrics (
        metric_date, commodity, model_version, 
        total_predictions, accurate_predictions, average_accuracy, learning_iterations
    )
    VALUES (
        CURRENT_DATE,
        NEW.commodity,
        NEW.model_version,
        1,
        CASE WHEN NEW.accuracy_percentage >= 80 THEN 1 ELSE 0 END,
        NEW.accuracy_percentage,
        1
    )
    ON CONFLICT (metric_date, commodity, model_version) 
    DO UPDATE SET
        total_predictions = ai_performance_metrics.total_predictions + 1,
        accurate_predictions = ai_performance_metrics.accurate_predictions + 
            CASE WHEN NEW.accuracy_percentage >= 80 THEN 1 ELSE 0 END,
        average_accuracy = (
            (ai_performance_metrics.average_accuracy * ai_performance_metrics.total_predictions + NEW.accuracy_percentage) /
            (ai_performance_metrics.total_predictions + 1)
        ),
        learning_iterations = ai_performance_metrics.learning_iterations + 1;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update metrics
DROP TRIGGER IF EXISTS trigger_update_ai_performance ON ai_prediction_outcomes;
CREATE TRIGGER trigger_update_ai_performance
    AFTER INSERT ON ai_prediction_outcomes
    FOR EACH ROW EXECUTE FUNCTION update_ai_performance_metrics();

-- Function untuk auto-archive old predictions
CREATE OR REPLACE FUNCTION archive_old_predictions()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Mark predictions older than 1 year as obsolete if no outcome recorded
    UPDATE ai_predictions 
    SET status = 'obsolete'
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND status = 'active'
    AND actual_outcome IS NULL;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data untuk testing
DO $$
BEGIN
    -- Only insert if tables are empty
    IF NOT EXISTS (SELECT 1 FROM ai_predictions LIMIT 1) THEN
        -- Sample prediction
        INSERT INTO ai_predictions (
            commodity, prediction_type, predicted_value, prediction_period,
            factors_considered, confidence_level, recommendations, parameters_used
        ) VALUES (
            'coal', 'sales', 2500.00, '1_month',
            ARRAY['historical_trend', 'seasonal_pattern', 'market_conditions'],
            0.85,
            ARRAY['increase_inventory', 'negotiate_contracts'],
            '{"trend_factor": 1.1, "seasonal_factor": 1.05, "confidence_base": 0.8}'::jsonb
        );
        
        -- Sample learning insight  
        INSERT INTO ai_learning_insights (
            commodity, model_version, data_points_analyzed, overall_accuracy,
            insights, improvement_recommendations
        ) VALUES (
            'coal', '1.0', 25, 78.50,
            '{"overall_accuracy": 78.5, "improving_factors": ["historical_trend"], "declining_factors": ["seasonal_pattern"]}'::jsonb,
            ARRAY['increase_historical_data_weight', 'improve_seasonal_analysis']
        );
    END IF;
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '🤖 AI LEARNING SYSTEM TABLES CREATED SUCCESSFULLY!';
    RAISE NOTICE '✅ Now your AI can truly LEARN and IMPROVE from every prediction!';
    RAISE NOTICE '📊 Tables: ai_predictions, ai_prediction_outcomes, ai_learning_insights, ai_model_adjustments, ai_performance_metrics, ai_prediction_feedback';
END $$;

