import { NextRequest, NextResponse } from 'next/server';
import { nickelPriceScraper } from '@/lib/nickel-price-scraper';
import { supabaseAdmin } from '@/lib/supabase/server';

// This endpoint can be called by cron jobs or webhooks for automatic updates
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (optional: add API key check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting automated nickel price update...');

    // Force refresh prices from APNI
    const priceResponse = await nickelPriceScraper.getNickelPrices(true);
    
    if (!priceResponse.success) {
      throw new Error(priceResponse.error || 'Failed to fetch prices');
    }

    // Get price analysis
    const analysis = await nickelPriceScraper.getPriceAnalysis();

    // Log the update activity
    await logUpdateActivity(priceResponse.data.length, analysis);

    // Check for significant price changes and create alerts
    await checkPriceAlerts(priceResponse.data, analysis);

    console.log(`Successfully updated ${priceResponse.data.length} nickel price records`);

    return NextResponse.json({
      success: true,
      message: 'Nickel prices updated successfully',
      data: {
        prices_updated: priceResponse.data.length,
        last_updated: priceResponse.last_updated,
        analysis: analysis
      }
    });

  } catch (error: any) {
    console.error('Automated nickel price update failed:', error);
    
    // Log the error
    await logUpdateError(error.message);

    return NextResponse.json(
      { 
        success: false,
        error: 'Automated update failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manual = searchParams.get('manual') === 'true';

    if (!manual) {
      return NextResponse.json({
        message: 'Nickel price auto-update endpoint',
        usage: 'POST with Bearer token or GET with ?manual=true',
        schedule: 'Runs every 30 minutes',
        status: 'Active'
      });
    }

    // Manual trigger (no auth required for testing)
    const priceResponse = await nickelPriceScraper.getNickelPrices(true);
    const analysis = await nickelPriceScraper.getPriceAnalysis();

    return NextResponse.json({
      success: true,
      message: 'Manual update completed',
      data: {
        prices: priceResponse.data.length,
        analysis: analysis
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Manual update failed', details: error.message },
      { status: 500 }
    );
  }
}

// Log update activity
async function logUpdateActivity(pricesCount: number, analysis: any) {
  try {
    const supabase = supabaseAdmin();
    
    await supabase
      .from('system_logs')
      .insert({
        module: 'nickel_price_monitor',
        action: 'auto_update',
        details: {
          prices_updated: pricesCount,
          analysis: analysis,
          timestamp: new Date().toISOString()
        },
        status: 'success',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging update activity:', error);
  }
}

// Log update errors
async function logUpdateError(errorMessage: string) {
  try {
    const supabase = supabaseAdmin();
    
    await supabase
      .from('system_logs')
      .insert({
        module: 'nickel_price_monitor',
        action: 'auto_update',
        details: {
          error: errorMessage,
          timestamp: new Date().toISOString()
        },
        status: 'error',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging update error:', error);
  }
}

// Check for significant price changes and create alerts
async function checkPriceAlerts(prices: any[], analysis: any) {
  try {
    const supabase = supabaseAdmin();
    
    // Check for high volatility
    if (analysis.volatility === 'high') {
      await supabase
        .from('alerts')
        .insert({
          module: 'nickel_prices',
          type: 'price_volatility',
          severity: 'medium',
          title: 'High Nickel Price Volatility Detected',
          description: `Current market volatility is high. Average price: $${analysis.current_avg}. Recommendation: ${analysis.recommendation}`,
          data: { analysis, prices },
          status: 'active',
          created_at: new Date().toISOString()
        });
    }

    // Check for significant price changes
    const significantChanges = prices.filter(p => Math.abs(p.percentage_change) > 5);
    
    if (significantChanges.length > 0) {
      for (const change of significantChanges) {
        await supabase
          .from('alerts')
          .insert({
            module: 'nickel_prices',
            type: 'significant_price_change',
            severity: Math.abs(change.percentage_change) > 10 ? 'high' : 'medium',
            title: `Significant Nickel Price Change: ${change.grade}`,
            description: `${change.grade} price changed by ${change.percentage_change.toFixed(2)}% to $${change.price_usd}`,
            data: { price_data: change },
            status: 'active',
            created_at: new Date().toISOString()
          });
      }
    }

    // Check for trend changes
    if (analysis.trend === 'up' && analysis.current_avg > 20000) {
      await supabase
        .from('alerts')
        .insert({
          module: 'nickel_prices',
          type: 'price_trend',
          severity: 'low',
          title: 'Nickel Prices Trending Upward',
          description: `Nickel prices showing upward trend. Consider reviewing purchasing strategies.`,
          data: { analysis },
          status: 'active',
          created_at: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Error creating price alerts:', error);
  }
}
