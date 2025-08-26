// =============================================
// AI LEARNING ENGINE FOR ITM TRADING
// Self-improving prediction system that learns from actual outcomes
// =============================================

import { supabaseAdmin } from '@/lib/supabase/server';

interface PredictionOutcome {
  id: string;
  prediction_id: string;
  commodity: string;
  predicted_value: number;
  actual_value: number;
  prediction_date: string;
  outcome_date: string;
  accuracy_percentage: number;
  factors_considered: string[];
  model_version: string;
}

interface LearningMetrics {
  overall_accuracy: number;
  accuracy_by_commodity: { [key: string]: number };
  accuracy_by_timeframe: { [key: string]: number };
  improving_factors: string[];
  declining_factors: string[];
  recommendation_adjustments: string[];
}

class AILearningEngine {
  private model_version = "1.0";
  private learning_rate = 0.1;
  private min_data_points = 10;

  // Store prediction for future accuracy tracking
  async storePrediction(predictionData: {
    commodity: string;
    predicted_value: number;
    prediction_period: string;
    factors: string[];
    confidence: number;
    recommendations: string[];
  }) {
    try {
      const { data, error } = await supabaseAdmin()
        .from('ai_predictions')
        .insert({
          commodity: predictionData.commodity,
          predicted_value: predictionData.predicted_value,
          prediction_period: predictionData.prediction_period,
          factors_considered: predictionData.factors,
          confidence_level: predictionData.confidence,
          recommendations: predictionData.recommendations,
          model_version: this.model_version,
          created_at: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing prediction:', error);
      throw error;
    }
  }

  // Compare predictions with actual outcomes and calculate accuracy
  async updatePredictionAccuracy(prediction_id: string, actual_value: number) {
    try {
      // Get original prediction
      const { data: prediction, error: fetchError } = await supabaseAdmin()
        .from('ai_predictions')
        .select('*')
        .eq('id', prediction_id)
        .single();

      if (fetchError) throw fetchError;

      // Calculate accuracy
      const predicted = prediction.predicted_value;
      const accuracy = 100 - Math.abs((predicted - actual_value) / Math.max(predicted, actual_value)) * 100;

      // Store outcome
      const { error: insertError } = await supabaseAdmin()
        .from('ai_prediction_outcomes')
        .insert({
          prediction_id,
          commodity: prediction.commodity,
          predicted_value: predicted,
          actual_value,
          prediction_date: prediction.created_at,
          outcome_date: new Date().toISOString(),
          accuracy_percentage: accuracy,
          factors_considered: prediction.factors_considered,
          model_version: prediction.model_version
        });

      if (insertError) throw insertError;

      // Update prediction status
      await supabaseAdmin()
        .from('ai_predictions')
        .update({ 
          status: 'completed',
          actual_outcome: actual_value,
          accuracy_achieved: accuracy 
        })
        .eq('id', prediction_id);

      // Trigger learning process
      await this.learnFromOutcome(prediction, actual_value, accuracy);

      return { accuracy, prediction_id };
    } catch (error) {
      console.error('Error updating prediction accuracy:', error);
      throw error;
    }
  }

  // Learn from prediction outcomes to improve future predictions
  private async learnFromOutcome(prediction: any, actual_value: number, accuracy: number) {
    try {
      // Get historical outcomes for this commodity
      const { data: outcomes, error } = await supabaseAdmin()
        .from('ai_prediction_outcomes')
        .select('*')
        .eq('commodity', prediction.commodity)
        .gte('outcome_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('outcome_date', { ascending: false });

      if (error) throw error;

      if (outcomes && outcomes.length >= this.min_data_points) {
        // Analyze patterns
        const learningInsights = this.analyzePredictionPatterns(outcomes);
        
        // Store learning insights
        await supabaseAdmin()
          .from('ai_learning_insights')
          .insert({
            commodity: prediction.commodity,
            insights: learningInsights,
            model_version: this.model_version,
            data_points_analyzed: outcomes.length,
            overall_accuracy: learningInsights.overall_accuracy,
            created_at: new Date().toISOString()
          });

        // Update model parameters if accuracy is below threshold
        if (learningInsights.overall_accuracy < 70) {
          await this.adjustModelParameters(prediction.commodity, learningInsights);
        }
      }
    } catch (error) {
      console.error('Error in learning process:', error);
    }
  }

  // Analyze prediction patterns to extract learning insights
  private analyzePredictionPatterns(outcomes: PredictionOutcome[]): LearningMetrics {
    const accuracies = outcomes.map(o => o.accuracy_percentage);
    const overall_accuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;

    // Analyze factors that lead to higher accuracy
    const factorAccuracy: { [key: string]: number[] } = {};
    outcomes.forEach(outcome => {
      outcome.factors_considered.forEach(factor => {
        if (!factorAccuracy[factor]) factorAccuracy[factor] = [];
        factorAccuracy[factor].push(outcome.accuracy_percentage);
      });
    });

    // Calculate average accuracy per factor
    const factorScores = Object.entries(factorAccuracy).map(([factor, scores]) => ({
      factor,
      avg_accuracy: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      sample_size: scores.length
    }));

    // Identify improving vs declining factors
    const improving_factors = factorScores
      .filter(f => f.avg_accuracy > overall_accuracy && f.sample_size >= 3)
      .map(f => f.factor);

    const declining_factors = factorScores
      .filter(f => f.avg_accuracy < overall_accuracy && f.sample_size >= 3)
      .map(f => f.factor);

    // Generate model adjustment recommendations
    const recommendation_adjustments = [];
    if (improving_factors.length > 0) {
      recommendation_adjustments.push(`increase_weight_for_factors: ${improving_factors.join(', ')}`);
    }
    if (declining_factors.length > 0) {
      recommendation_adjustments.push(`decrease_weight_for_factors: ${declining_factors.join(', ')}`);
    }

    return {
      overall_accuracy,
      accuracy_by_commodity: { [outcomes[0]?.commodity || 'unknown']: overall_accuracy },
      accuracy_by_timeframe: this.calculateTimeframeAccuracy(outcomes),
      improving_factors,
      declining_factors,
      recommendation_adjustments
    };
  }

  private calculateTimeframeAccuracy(outcomes: PredictionOutcome[]): { [key: string]: number } {
    const timeframes = { '1_month': [] as number[], '3_months': [] as number[], '6_months': [] as number[] };
    
    outcomes.forEach(outcome => {
      const predictionDate = new Date(outcome.prediction_date);
      const outcomeDate = new Date(outcome.outcome_date);
      const diffMonths = (outcomeDate.getTime() - predictionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (diffMonths <= 1) timeframes['1_month'].push(outcome.accuracy_percentage);
      else if (diffMonths <= 3) timeframes['3_months'].push(outcome.accuracy_percentage);
      else if (diffMonths <= 6) timeframes['6_months'].push(outcome.accuracy_percentage);
    });

    return Object.entries(timeframes).reduce((acc, [timeframe, accuracies]) => {
      acc[timeframe] = accuracies.length > 0 
        ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length 
        : 0;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Adjust model parameters based on learning insights
  private async adjustModelParameters(commodity: string, insights: LearningMetrics) {
    try {
      // Store model adjustments
      await supabaseAdmin()
        .from('ai_model_adjustments')
        .insert({
          commodity,
          model_version: this.model_version,
          previous_accuracy: insights.overall_accuracy,
          adjustments_made: insights.recommendation_adjustments,
          factor_weights: {
            increased: insights.improving_factors,
            decreased: insights.declining_factors
          },
          created_at: new Date().toISOString()
        });

      console.log(`Model adjusted for ${commodity}:`, insights.recommendation_adjustments);
    } catch (error) {
      console.error('Error adjusting model parameters:', error);
    }
  }

  // Get AI learning metrics for dashboard
  async getLearningMetrics(commodity?: string): Promise<LearningMetrics> {
    try {
      let query = supabaseAdmin()
        .from('ai_prediction_outcomes')
        .select('*')
        .gte('outcome_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (commodity) {
        query = query.eq('commodity', commodity);
      }

      const { data: outcomes, error } = await query;
      if (error) throw error;

      if (!outcomes || outcomes.length === 0) {
        return {
          overall_accuracy: 0,
          accuracy_by_commodity: {},
          accuracy_by_timeframe: {},
          improving_factors: [],
          declining_factors: [],
          recommendation_adjustments: ['insufficient_data_for_learning']
        };
      }

      return this.analyzePredictionPatterns(outcomes);
    } catch (error) {
      console.error('Error getting learning metrics:', error);
      throw error;
    }
  }

  // Auto-improve predictions based on learned patterns
  async improveForecasting(commodity: string, baseParameters: any) {
    try {
      // Get latest learning insights
      const { data: insights, error } = await supabaseAdmin()
        .from('ai_learning_insights')
        .select('*')
        .eq('commodity', commodity)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !insights) {
        console.log(`No learning insights available for ${commodity}, using base parameters`);
        return baseParameters;
      }

      // Apply learned adjustments
      const improvedParameters = { ...baseParameters };
      
      // Adjust confidence based on historical accuracy
      if (insights.overall_accuracy) {
        improvedParameters.confidence_multiplier = insights.overall_accuracy / 100;
      }

      // Adjust trend factors based on improving/declining factors
      if (insights.insights.improving_factors?.includes('upward_trend_detected')) {
        improvedParameters.trend_sensitivity = Math.min(1.5, improvedParameters.trend_sensitivity * 1.2);
      }

      if (insights.insights.declining_factors?.includes('seasonal_high_period')) {
        improvedParameters.seasonal_weight = Math.max(0.5, improvedParameters.seasonal_weight * 0.8);
      }

      console.log(`Applied AI learning improvements for ${commodity}:`, {
        base_accuracy: baseParameters.confidence || 0.7,
        learned_accuracy: insights.overall_accuracy,
        improvements_applied: insights.insights.recommendation_adjustments
      });

      return improvedParameters;
    } catch (error) {
      console.error('Error improving forecasting:', error);
      return baseParameters;
    }
  }
}

export const aiLearningEngine = new AILearningEngine();

