import { NextRequest, NextResponse } from 'next/server';
import { nickelPriceScraper } from '@/lib/nickel-price-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const analysis = searchParams.get('analysis') === 'true';

    if (analysis) {
      // Return price analysis
      const analysisData = await nickelPriceScraper.getPriceAnalysis();
      return NextResponse.json({
        success: true,
        analysis: analysisData,
        timestamp: new Date().toISOString()
      });
    } else {
      // Return price data
      const priceData = await nickelPriceScraper.getNickelPrices(forceRefresh);
      return NextResponse.json(priceData);
    }

  } catch (error: any) {
    console.error('Nickel prices API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch nickel prices',
        details: error.message,
        data: [],
        last_updated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'refresh':
        const refreshedData = await nickelPriceScraper.getNickelPrices(true);
        return NextResponse.json({
          success: true,
          message: 'Prices refreshed successfully',
          data: refreshedData
        });

      case 'analysis':
        const analysis = await nickelPriceScraper.getPriceAnalysis();
        return NextResponse.json({
          success: true,
          analysis,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "refresh" or "analysis"' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        details: error.message
      },
      { status: 500 }
    );
  }
}
