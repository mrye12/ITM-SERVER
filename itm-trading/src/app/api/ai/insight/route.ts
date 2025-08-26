import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hfTextGenerate, generateAIInsight } from '@/server/hf';
import { buildPrompt, validateAIResponse, AIInsightRequest } from '@/server/ai-insight';

export async function POST(request: NextRequest) {
  try {
    const { module, timeframe = '30d' } = await request.json();

    if (!module) {
      return NextResponse.json(
        { error: 'Module parameter is required' },
        { status: 400 }
      );
    }

    // Get aggregated data based on module
    const aggregatedData = await getAggregatesForModule(module, timeframe);
    
    if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
      return NextResponse.json({
        summary: `No recent data available for ${module} module.`,
        key_metrics: [],
        predictions: [],
        risks: [{
          risk: "Insufficient data for analysis",
          impact: "medium",
          probability: 0.9
        }],
        actions: [{
          action: "Increase data collection and entry frequency",
          priority: "high", 
          impact: "Better analytical capabilities"
        }]
      });
    }

    // Build AI prompt
    const prompt = buildPrompt({
      module,
      aggregates: aggregatedData,
      timeframe,
      additional_context: {
        timestamp: new Date().toISOString(),
        data_freshness: calculateDataFreshness(aggregatedData)
      }
    });

    // Generate AI insight using Hugging Face
    let aiResponse;
    try {
      aiResponse = await hfTextGenerate(prompt, {
        max_length: 800,
        temperature: 0.6,
        top_p: 0.9,
        repetition_penalty: 1.1
      });
    } catch (hfError) {
      console.error('Hugging Face API error:', hfError);
      
      // Fallback to simple insight generation
      aiResponse = await generateSimpleInsight(module, aggregatedData);
    }

    // Validate and parse AI response
    const validatedResponse = validateAIResponse(aiResponse);

    // Log AI insight for learning
    await logAIInsight(module, prompt, aiResponse, validatedResponse);

    return NextResponse.json(validatedResponse);

  } catch (error: any) {
    console.error('AI Insight Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI insight',
        details: error.message,
        fallback: {
          summary: "AI insight generation temporarily unavailable. System operational with manual monitoring recommended.",
          key_metrics: [],
          predictions: [],
          risks: [],
          actions: []
        }
      },
      { status: 500 }
    );
  }
}

// Helper function to get aggregated data for different modules
async function getAggregatesForModule(module: string, timeframe: string) {
  const supabase = supabaseAdmin();
  const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  try {
    switch (module.toLowerCase()) {
      case 'fuel':
      case 'fuel_operations':
        const { data: fuelData } = await supabase
          .from('fuel_logs')
          .select('*')
          .gte('created_at', fromDate)
          .order('created_at', { ascending: false });

        return {
          total_records: fuelData?.length || 0,
          total_fuel_consumed: fuelData?.reduce((sum, log) => sum + (log.quantity || 0), 0) || 0,
          avg_daily_consumption: (fuelData?.reduce((sum, log) => sum + (log.quantity || 0), 0) || 0) / daysBack,
          unique_equipment: new Set(fuelData?.map(log => log.equipment_id)).size,
          total_cost: fuelData?.reduce((sum, log) => sum + ((log.quantity || 0) * (log.unit_price || 0)), 0) || 0,
          fuel_types: [...new Set(fuelData?.map(log => log.fuel_type))],
          recent_entries: fuelData?.slice(0, 5) || []
        };

      case 'sales':
      case 'trading':
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .gte('created_at', fromDate)
          .order('created_at', { ascending: false });

        return {
          total_records: salesData?.length || 0,
          total_revenue: salesData?.reduce((sum, sale) => sum + ((sale.quantity || 0) * (sale.unit_price || 0)), 0) || 0,
          total_quantity: salesData?.reduce((sum, sale) => sum + (sale.quantity || 0), 0) || 0,
          avg_unit_price: salesData?.length ? (salesData.reduce((sum, sale) => sum + (sale.unit_price || 0), 0) / salesData.length) : 0,
          unique_customers: new Set(salesData?.map(sale => sale.customer_name)).size,
          product_mix: [...new Set(salesData?.map(sale => sale.item_name))],
          recent_sales: salesData?.slice(0, 5) || []
        };

      case 'shipments':
      case 'logistics':
        const { data: shipmentData } = await supabase
          .from('shipments')
          .select('*')
          .gte('created_at', fromDate)
          .order('created_at', { ascending: false });

        return {
          total_records: shipmentData?.length || 0,
          total_quantity: shipmentData?.reduce((sum, ship) => sum + (ship.quantity || 0), 0) || 0,
          completed_shipments: shipmentData?.filter(ship => ship.status === 'delivered').length || 0,
          in_transit: shipmentData?.filter(ship => ship.status === 'in_transit').length || 0,
          pending_shipments: shipmentData?.filter(ship => ship.status === 'pending').length || 0,
          unique_destinations: new Set(shipmentData?.map(ship => ship.destination)).size,
          avg_delivery_time: calculateAvgDeliveryTime(shipmentData || []),
          recent_shipments: shipmentData?.slice(0, 5) || []
        };

      case 'stock':
      case 'inventory':
        const { data: stockData } = await supabase
          .from('stock')
          .select('*')
          .gte('updated_at', fromDate)
          .order('updated_at', { ascending: false });

        return {
          total_records: stockData?.length || 0,
          total_stock_value: stockData?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0,
          total_quantity: stockData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
          low_stock_items: stockData?.filter(item => (item.quantity || 0) < 100).length || 0,
          unique_products: new Set(stockData?.map(item => item.commodity)).size,
          recent_updates: stockData?.slice(0, 5) || []
        };

      case 'equipment':
      case 'maintenance':
        const { data: equipmentData } = await supabase
          .from('equipment_master')
          .select('*')
          .gte('updated_at', fromDate)
          .order('updated_at', { ascending: false });

        return {
          total_equipment: equipmentData?.length || 0,
          active_equipment: equipmentData?.filter(eq => eq.status === 'active').length || 0,
          maintenance_due: equipmentData?.filter(eq => eq.status === 'maintenance').length || 0,
          equipment_types: [...new Set(equipmentData?.map(eq => eq.tipe))],
          recent_updates: equipmentData?.slice(0, 5) || []
        };

      default:
        // Generic data aggregation
        const { data: genericData } = await supabase
          .from('audit_logs')
          .select('*')
          .gte('created_at', fromDate)
          .order('created_at', { ascending: false })
          .limit(100);

        return {
          total_activities: genericData?.length || 0,
          recent_activities: genericData?.slice(0, 10) || [],
          activity_types: [...new Set(genericData?.map(log => log.action))],
          timeframe_analyzed: timeframe
        };
    }
  } catch (error) {
    console.error(`Error fetching ${module} data:`, error);
    return {
      error: `Failed to fetch ${module} data`,
      timeframe_analyzed: timeframe
    };
  }
}

// Helper function to calculate average delivery time
function calculateAvgDeliveryTime(shipments: any[]): number {
  const completedShipments = shipments.filter(ship => 
    ship.status === 'delivered' && ship.shipped_date && ship.delivered_date
  );

  if (completedShipments.length === 0) return 0;

  const totalDays = completedShipments.reduce((sum, ship) => {
    const shipped = new Date(ship.shipped_date);
    const delivered = new Date(ship.delivered_date);
    const diffDays = (delivered.getTime() - shipped.getTime()) / (1000 * 60 * 60 * 24);
    return sum + diffDays;
  }, 0);

  return Math.round(totalDays / completedShipments.length);
}

// Helper function to calculate data freshness
function calculateDataFreshness(data: any): string {
  const recentEntries = data.recent_entries || data.recent_sales || data.recent_shipments || data.recent_updates || [];
  
  if (recentEntries.length === 0) return 'No recent data';
  
  const lastEntry = recentEntries[0];
  const lastDate = new Date(lastEntry.created_at || lastEntry.updated_at);
  const hoursAgo = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursAgo < 1) return 'Very fresh (< 1 hour)';
  if (hoursAgo < 24) return `Fresh (${Math.round(hoursAgo)} hours ago)`;
  if (hoursAgo < 168) return `Recent (${Math.round(hoursAgo / 24)} days ago)`;
  return 'Stale (> 1 week old)';
}

// Simple insight generation fallback
async function generateSimpleInsight(module: string, data: any) {
  const totalRecords = data.total_records || 0;
  const statusMessage = totalRecords > 0 ? 'operational with active data flow' : 'requires attention due to limited data';
  
  return JSON.stringify({
    summary: `${module.charAt(0).toUpperCase() + module.slice(1)} module is ${statusMessage}. ${totalRecords} records analyzed in current period.`,
    key_metrics: [
      {
        label: "Data Volume",
        value: `${totalRecords} records`,
        trend: totalRecords > 10 ? "up" : "stable",
        significance: totalRecords > 10 ? "medium" : "low"
      }
    ],
    predictions: [
      {
        timeframe: "Next 30 days",
        forecast: `Expected continued ${totalRecords > 10 ? 'active' : 'limited'} data activity`,
        confidence: 0.7
      }
    ],
    risks: [
      {
        risk: totalRecords < 5 ? "Low data volume affecting analysis quality" : "Normal operational risks",
        impact: totalRecords < 5 ? "high" : "medium",
        probability: totalRecords < 5 ? 0.8 : 0.3
      }
    ],
    actions: [
      {
        action: totalRecords < 5 ? "Increase data collection frequency" : "Continue monitoring performance",
        priority: totalRecords < 5 ? "high" : "medium",
        impact: "Improved operational visibility"
      }
    ]
  });
}

// Log AI insight for learning and improvement
async function logAIInsight(module: string, prompt: string, rawResponse: string, parsedResponse: any) {
  try {
    const supabase = supabaseAdmin();
    
    await supabase
      .from('ai_logs')
      .insert({
        module,
        prompt_used: prompt,
        raw_response: rawResponse,
        parsed_response: parsedResponse,
        response_quality: rawResponse.length > 100 ? 'good' : 'poor',
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging AI insight:', error);
    // Don't throw - logging is not critical
  }
}
