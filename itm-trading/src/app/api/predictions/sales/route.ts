import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Simulate AI prediction with data analysis
async function predictSalesDemand(commodity: string, months: number = 3) {
  try {
    // Get historical sales data (last 12 months)
    const { data: historicalSales, error } = await supabaseAdmin()
      .from('sales')
      .select('*')
      .ilike('item_name', `%${commodity}%`)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Basic trend analysis
    const monthlyData: { [key: string]: { quantity: number, revenue: number, count: number } } = {};
    
    historicalSales?.forEach(sale => {
      const month = new Date(sale.created_at).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { quantity: 0, revenue: 0, count: 0 };
      }
      monthlyData[month].quantity += sale.quantity || 0;
      monthlyData[month].revenue += (sale.quantity || 0) * (sale.unit_price || 0);
      monthlyData[month].count += 1;
    });

    // Calculate trends
    const monthlyValues = Object.values(monthlyData);
    const avgQuantity = monthlyValues.reduce((sum, m) => sum + m.quantity, 0) / Math.max(monthlyValues.length, 1);
    const recentMonths = monthlyValues.slice(-3);
    const recentAvg = recentMonths.reduce((sum, m) => sum + m.quantity, 0) / Math.max(recentMonths.length, 1);
    
    // Simple trend calculation
    const trendFactor = recentAvg > avgQuantity ? 1.1 : 0.9;
    const seasonalFactor = Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30) * Math.PI / 6) * 0.2 + 1;

    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const baseQuantity = avgQuantity * trendFactor * seasonalFactor;
      const variance = baseQuantity * 0.1; // 10% variance
      const predicted = Math.max(0, baseQuantity + (Math.random() - 0.5) * variance * 2);
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      
      predictions.push({
        month: futureDate.toISOString().slice(0, 7),
        predicted_quantity: Math.round(predicted),
        confidence: Math.max(0.6, 0.9 - (i * 0.1)), // Decreasing confidence over time
        trend: trendFactor > 1 ? 'increasing' : 'decreasing'
      });
    }

    // Generate insights
    const factors = [];
    if (trendFactor > 1) factors.push('upward_trend_detected');
    if (seasonalFactor > 1) factors.push('seasonal_high_period');
    factors.push('historical_data_analysis');

    const recommendations = [];
    if (trendFactor > 1) {
      recommendations.push('consider_increasing_inventory');
      recommendations.push('negotiate_supplier_contracts');
    }
    recommendations.push('monitor_market_conditions');

    return {
      commodity,
      prediction_period: `${months} months`,
      monthly_forecast: predictions,
      factors,
      recommendations,
      historical_average: Math.round(avgQuantity),
      confidence_level: 'medium',
      risk_factors: ['market_volatility', 'supply_chain_disruption']
    };

  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity') || 'coal';
    const months = parseInt(searchParams.get('months') || '3');

    const prediction = await predictSalesDemand(commodity, months);
    
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { commodity, months = 3 } = await request.json();
    
    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity parameter is required' },
        { status: 400 }
      );
    }

    const prediction = await predictSalesDemand(commodity, months);
    
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: error.message },
      { status: 500 }
    );
  }
}

