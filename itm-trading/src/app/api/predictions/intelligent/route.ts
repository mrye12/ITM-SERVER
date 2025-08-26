import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { aiLearningEngine } from '@/lib/ai-learning-engine';

// Enhanced AI prediction with learning capabilities
async function generateIntelligentPrediction(commodity: string, months: number = 3) {
  try {
    // Get historical sales data (extended period for better learning)
    const { data: historicalSales, error } = await supabaseAdmin()
      .from('sales')
      .select('*')
      .ilike('item_name', `%${commodity}%`)
      .gte('created_at', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()) // 2 years
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get market conditions data
    const { data: marketData } = await supabaseAdmin()
      .from('commodity_prices')
      .select('*')
      .eq('commodity_code', commodity.toUpperCase())
      .gte('price_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('price_date', { ascending: false })
      .limit(100);

    // Get external factors (seasonality, economic indicators)
    const { data: economicFactors } = await supabaseAdmin()
      .from('market_intelligence')
      .select('analysis_data')
      .eq('commodity', commodity)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Base prediction parameters
    let baseParameters = {
      trend_sensitivity: 1.0,
      seasonal_weight: 1.0,
      market_factor: 1.0,
      confidence: 0.7,
      variance_tolerance: 0.15
    };

    // Apply AI learning improvements
    const improvedParameters = await aiLearningEngine.improveForecasting(commodity, baseParameters);

    // Enhanced data analysis with multiple factors
    const analysisResult = await performAdvancedAnalysis(
      historicalSales || [],
      marketData || [],
      economicFactors || [],
      improvedParameters
    );

    // Generate predictions with learned parameters
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const prediction = calculateMonthlyPrediction(
        analysisResult,
        i,
        improvedParameters
      );
      predictions.push(prediction);
    }

    // Prepare factors considered
    const factorsConsidered = [
      'historical_sales_pattern',
      'market_price_trends',
      'seasonal_variations',
      'economic_indicators',
      'ai_learned_patterns'
    ];

    // Generate AI-powered recommendations
    const recommendations = generateIntelligentRecommendations(
      analysisResult,
      predictions,
      improvedParameters
    );

    // Calculate overall confidence based on historical accuracy
    const learningMetrics = await aiLearningEngine.getLearningMetrics(commodity);
    const adjustedConfidence = Math.min(
      0.95,
      improvedParameters.confidence * (learningMetrics.overall_accuracy / 100 || 0.7)
    );

    const predictionResult = {
      commodity,
      prediction_period: `${months} months`,
      monthly_forecast: predictions,
      factors: factorsConsidered,
      recommendations,
      historical_average: analysisResult.historicalAverage,
      confidence_level: adjustedConfidence > 0.8 ? 'high' : adjustedConfidence > 0.6 ? 'medium' : 'low',
      confidence_score: adjustedConfidence,
      risk_factors: analysisResult.riskFactors,
      ai_learning_applied: true,
      model_improvements: learningMetrics.recommendation_adjustments,
      accuracy_history: learningMetrics.overall_accuracy,
      prediction_metadata: {
        data_points_analyzed: (historicalSales?.length || 0) + (marketData?.length || 0),
        model_version: '2.0-adaptive',
        learning_iterations: learningMetrics.overall_accuracy > 0 ? 'active' : 'initial',
        parameters_used: improvedParameters
      }
    };

    // Store prediction for future learning
    await aiLearningEngine.storePrediction({
      commodity,
      predicted_value: predictions[0]?.predicted_quantity || 0,
      prediction_period: `${months}_months`,
      factors: factorsConsidered,
      confidence: adjustedConfidence,
      recommendations
    });

    return predictionResult;

  } catch (error) {
    console.error('Intelligent prediction error:', error);
    throw error;
  }
}

async function performAdvancedAnalysis(
  historicalSales: any[],
  marketData: any[],
  economicFactors: any[],
  parameters: any
) {
  // Monthly aggregation with trend analysis
  const monthlyData: { [key: string]: { 
    quantity: number, 
    revenue: number, 
    count: number, 
    avgPrice: number 
  } } = {};
  
  historicalSales.forEach(sale => {
    const month = new Date(sale.created_at).toISOString().slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { quantity: 0, revenue: 0, count: 0, avgPrice: 0 };
    }
    monthlyData[month].quantity += sale.quantity || 0;
    monthlyData[month].revenue += (sale.quantity || 0) * (sale.unit_price || 0);
    monthlyData[month].count += 1;
  });

  // Calculate average prices
  Object.keys(monthlyData).forEach(month => {
    const data = monthlyData[month];
    data.avgPrice = data.revenue / Math.max(data.quantity, 1);
  });

  // Advanced trend analysis
  const monthlyValues = Object.values(monthlyData);
  const quantities = monthlyValues.map(m => m.quantity);
  
  // Linear regression for trend
  const trendCoefficient = calculateLinearTrend(quantities);
  const trendFactor = Math.max(0.5, Math.min(2.0, 1 + (trendCoefficient * parameters.trend_sensitivity)));

  // Seasonal pattern analysis (12-month cycle)
  const seasonalPattern = calculateSeasonalPattern(monthlyData);
  
  // Market condition analysis
  const marketTrend = analyzeMarketConditions(marketData);
  const marketFactor = 1 + (marketTrend * parameters.market_factor * 0.1);

  // Economic indicators impact
  const economicImpact = analyzeEconomicFactors(economicFactors);

  // Risk assessment
  const riskFactors = assessRisks(
    trendCoefficient,
    seasonalPattern.volatility,
    marketTrend,
    economicImpact
  );

  return {
    historicalAverage: quantities.reduce((sum, q) => sum + q, 0) / Math.max(quantities.length, 1),
    trendFactor,
    seasonalPattern,
    marketFactor,
    economicImpact,
    riskFactors,
    dataQuality: quantities.length >= 12 ? 'high' : quantities.length >= 6 ? 'medium' : 'low'
  };
}

function calculateLinearTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope / Math.max(sumY / n, 1); // Normalize by average
}

function calculateSeasonalPattern(monthlyData: any) {
  const months = Object.keys(monthlyData).sort();
  if (months.length < 12) {
    return { factor: 1.0, volatility: 0.1 };
  }

  // Extract seasonal component by month number
  const seasonalFactors: { [key: number]: number[] } = {};
  months.forEach(month => {
    const monthNum = parseInt(month.split('-')[1]);
    if (!seasonalFactors[monthNum]) seasonalFactors[monthNum] = [];
    seasonalFactors[monthNum].push(monthlyData[month].quantity);
  });

  // Calculate current month's seasonal factor
  const currentMonth = new Date().getMonth() + 1;
  const currentSeasonalData = seasonalFactors[currentMonth] || [];
  const avgForMonth = currentSeasonalData.reduce((sum, val) => sum + val, 0) / Math.max(currentSeasonalData.length, 1);
  
  const overallAvg = (Object.values(monthlyData) as any[]).reduce((sum, data: any) => sum + data.quantity, 0) / months.length;
  const seasonalFactor = avgForMonth / Math.max(overallAvg, 1);

  // Calculate volatility
  const allQuantities = Object.values(monthlyData).map((data: any) => data.quantity);
  const variance = allQuantities.reduce((sum, q) => sum + Math.pow(q - overallAvg, 2), 0) / allQuantities.length;
  const volatility = Math.sqrt(variance) / Math.max(overallAvg, 1);

  return { factor: seasonalFactor, volatility };
}

function analyzeMarketConditions(marketData: any[]): number {
  if (!marketData || marketData.length < 2) return 0;

  const prices = marketData.map(d => d.price_usd).filter(p => p > 0);
  if (prices.length < 2) return 0;

  // Calculate price trend
  const recentPrices = prices.slice(0, 10); // Last 10 data points
  const olderPrices = prices.slice(-10); // Earlier 10 data points
  
  const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
  const olderAvg = olderPrices.reduce((sum, p) => sum + p, 0) / olderPrices.length;
  
  return (recentAvg - olderAvg) / Math.max(olderAvg, 1); // Normalized price trend
}

function analyzeEconomicFactors(economicFactors: any[]): number {
  if (!economicFactors || economicFactors.length === 0) return 0;

  // Extract sentiment and growth indicators from market intelligence
  let impactScore = 0;
  economicFactors.forEach(factor => {
    if (factor.analysis_data?.sentiment === 'positive') impactScore += 0.1;
    if (factor.analysis_data?.sentiment === 'negative') impactScore -= 0.1;
    if (factor.analysis_data?.growth_forecast === 'increasing') impactScore += 0.05;
    if (factor.analysis_data?.growth_forecast === 'decreasing') impactScore -= 0.05;
  });

  return impactScore;
}

function assessRisks(trendCoeff: number, volatility: number, marketTrend: number, economicImpact: number): string[] {
  const risks = [];
  
  if (Math.abs(trendCoeff) > 0.1) risks.push('high_trend_volatility');
  if (volatility > 0.3) risks.push('high_demand_variability');
  if (Math.abs(marketTrend) > 0.2) risks.push('market_price_instability');
  if (economicImpact < -0.1) risks.push('negative_economic_indicators');
  if (risks.length === 0) risks.push('normal_market_conditions');
  
  return risks;
}

function calculateMonthlyPrediction(analysis: any, monthOffset: number, parameters: any) {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + monthOffset);
  
  // Apply multiple factors with learned weights
  let baseQuantity = analysis.historicalAverage;
  baseQuantity *= analysis.trendFactor ** monthOffset; // Compound trend effect
  baseQuantity *= analysis.seasonalPattern.factor;
  baseQuantity *= analysis.marketFactor;
  baseQuantity *= (1 + analysis.economicImpact);
  
  // Add controlled variance
  const variance = baseQuantity * parameters.variance_tolerance;
  const predicted = Math.max(0, baseQuantity + (Math.random() - 0.5) * variance);
  
  // Confidence decreases with distance
  const confidence = Math.max(0.4, parameters.confidence - (monthOffset * 0.05));
  
  return {
    month: futureDate.toISOString().slice(0, 7),
    predicted_quantity: Math.round(predicted),
    confidence,
    trend: analysis.trendFactor > 1 ? 'increasing' : 'decreasing',
    factors_impact: {
      trend: analysis.trendFactor,
      seasonal: analysis.seasonalPattern.factor,
      market: analysis.marketFactor,
      economic: analysis.economicImpact
    }
  };
}

function generateIntelligentRecommendations(analysis: any, predictions: any[], parameters: any): string[] {
  const recommendations = [];
  
  // Trend-based recommendations
  if (analysis.trendFactor > 1.1) {
    recommendations.push('increase_inventory_capacity');
    recommendations.push('secure_additional_suppliers');
  } else if (analysis.trendFactor < 0.9) {
    recommendations.push('optimize_inventory_levels');
    recommendations.push('explore_new_markets');
  }
  
  // Risk-based recommendations
  if (analysis.riskFactors.includes('high_demand_variability')) {
    recommendations.push('implement_flexible_contracts');
  }
  if (analysis.riskFactors.includes('market_price_instability')) {
    recommendations.push('consider_price_hedging');
  }
  
  // Seasonal recommendations
  if (analysis.seasonalPattern.factor > 1.1) {
    recommendations.push('prepare_for_seasonal_peak');
  }
  
  // Data quality recommendations
  if (analysis.dataQuality === 'low') {
    recommendations.push('improve_data_collection');
  }
  
  // AI learning recommendations
  if (parameters.confidence < 0.7) {
    recommendations.push('monitor_predictions_closely');
  }
  
  return recommendations.length > 0 ? recommendations : ['maintain_current_strategy'];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity') || 'coal';
    const months = parseInt(searchParams.get('months') || '3');

    const prediction = await generateIntelligentPrediction(commodity, months);
    
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate intelligent prediction', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { commodity, months = 3, feedback } = await request.json();
    
    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity parameter is required' },
        { status: 400 }
      );
    }

    // If feedback is provided, use it to improve the model
    if (feedback && feedback.prediction_id && feedback.actual_value) {
      await aiLearningEngine.updatePredictionAccuracy(
        feedback.prediction_id,
        feedback.actual_value
      );
    }

    const prediction = await generateIntelligentPrediction(commodity, months);
    
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate intelligent prediction', details: error.message },
      { status: 500 }
    );
  }
}

