import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface ReportRequest {
  type: 'sales' | 'financial' | 'inventory' | 'compliance' | 'performance';
  period: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'excel' | 'csv';
  filters?: Record<string, any>;
  groupBy?: string[];
  includeCharts?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const reportRequest: ReportRequest = await request.json();
    
    const reportData = await generateReportData(reportRequest);
    
    // In a real implementation, you would generate PDF/Excel files here
    // For now, we'll return the data structure
    return NextResponse.json({
      success: true,
      reportId: `RPT-${Date.now()}`,
      data: reportData,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/reports/download/${Date.now()}`
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function generateReportData(request: ReportRequest) {
  const supabase = supabaseAdmin();
  
  switch (request.type) {
    case 'sales':
      return await generateSalesReport(supabase, request);
    case 'financial':
      return await generateFinancialReport(supabase, request);
    case 'inventory':
      return await generateInventoryReport(supabase, request);
    case 'compliance':
      return await generateComplianceReport(supabase, request);
    case 'performance':
      return await generatePerformanceReport(supabase, request);
    default:
      throw new Error('Invalid report type');
  }
}

async function generateSalesReport(supabase: any, request: ReportRequest) {
  // Sales by period
  const { data: salesData } = await supabase
    .from('sales_orders')
    .select(`
      id,
      order_number,
      order_date,
      total_amount,
      status,
      customers (company_name),
      employee_profiles (full_name)
    `)
    .gte('order_date', request.period.start)
    .lte('order_date', request.period.end)
    .order('order_date', { ascending: false });

  // Sales by commodity
  const { data: commodityData } = await supabase
    .from('sales_order_items')
    .select(`
      quantity,
      unit_price,
      line_total,
      commodities (name, category),
      sales_orders!inner (order_date, status)
    `)
    .gte('sales_orders.order_date', request.period.start)
    .lte('sales_orders.order_date', request.period.end)
    .in('sales_orders.status', ['approved', 'shipped', 'delivered']);

  // Sales performance by sales rep
  const { data: repPerformance } = await supabase
    .from('sales_orders')
    .select(`
      sales_rep_id,
      employee_profiles (full_name),
      total_amount,
      status
    `)
    .gte('order_date', request.period.start)
    .lte('order_date', request.period.end)
    .in('status', ['approved', 'shipped', 'delivered']);

  // Aggregate data
  const totalSales = salesData?.reduce((sum: number, order: any) => 
    sum + (order.total_amount || 0), 0) || 0;
  
  const totalOrders = salesData?.length || 0;
  
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Group by commodity
  const commoditySummary = commodityData?.reduce((acc: any, item: any) => {
    const commodityName = item.commodities?.name || 'Unknown';
    if (!acc[commodityName]) {
      acc[commodityName] = {
        name: commodityName,
        category: item.commodities?.category,
        totalQuantity: 0,
        totalValue: 0,
        orderCount: 0
      };
    }
    acc[commodityName].totalQuantity += item.quantity || 0;
    acc[commodityName].totalValue += item.line_total || 0;
    acc[commodityName].orderCount += 1;
    return acc;
  }, {});

  // Group by sales rep
  const repSummary = repPerformance?.reduce((acc: any, order: any) => {
    const repId = order.sales_rep_id;
    const repName = order.employee_profiles?.full_name || 'Unknown';
    if (!acc[repId]) {
      acc[repId] = {
        name: repName,
        totalSales: 0,
        orderCount: 0,
        avgOrderValue: 0
      };
    }
    acc[repId].totalSales += order.total_amount || 0;
    acc[repId].orderCount += 1;
    acc[repId].avgOrderValue = acc[repId].totalSales / acc[repId].orderCount;
    return acc;
  }, {});

  return {
    summary: {
      totalSales,
      totalOrders,
      avgOrderValue,
      period: request.period
    },
    details: {
      orders: salesData || [],
      commodityBreakdown: Object.values(commoditySummary || {}),
      salesRepPerformance: Object.values(repSummary || {})
    },
    charts: request.includeCharts ? {
      salesTrend: generateSalesTrendData(salesData),
      commodityMix: generateCommodityMixData(commoditySummary),
      repPerformance: generateRepPerformanceData(repSummary)
    } : null
  };
}

async function generateFinancialReport(supabase: any, request: ReportRequest) {
  // Revenue and expenses
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .gte('invoice_date', request.period.start)
    .lte('invoice_date', request.period.end);

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .gte('payment_date', request.period.start)
    .lte('payment_date', request.period.end);

  // Accounts receivable aging
  const { data: arAging } = await supabase
    .rpc('calculate_customer_aging');

  const totalRevenue = invoices?.filter((inv: any) => inv.invoice_type === 'sales')
    .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0;

  const totalExpenses = invoices?.filter((inv: any) => inv.invoice_type === 'purchase')
    .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0;

  const totalPayments = payments?.reduce((sum: number, payment: any) => 
    sum + (payment.amount || 0), 0) || 0;

  const outstandingAR = invoices?.filter((inv: any) => inv.invoice_type === 'sales')
    .reduce((sum: number, inv: any) => sum + (inv.outstanding_amount || 0), 0) || 0;

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      totalPayments,
      outstandingAR,
      period: request.period
    },
    details: {
      invoices: invoices || [],
      payments: payments || [],
      arAging: arAging || []
    },
    charts: request.includeCharts ? {
      revenueVsExpenses: generateRevenueExpenseData(invoices),
      paymentTrend: generatePaymentTrendData(payments),
      arAging: generateARAgingData(arAging)
    } : null
  };
}

async function generateInventoryReport(supabase: any, request: ReportRequest) {
  // Stock valuation
  const { data: stockValuation } = await supabase
    .rpc('calculate_stock_valuation');

  // Stock movements
  const { data: stockMovements } = await supabase
    .from('stock_inventory')
    .select(`
      *,
      commodities (name, category),
      warehouses (name, location)
    `)
    .gte('updated_at', request.period.start)
    .lte('updated_at', request.period.end);

  // Low stock alerts
  const { data: lowStock } = await supabase
    .from('stock_inventory')
    .select(`
      *,
      commodities (name, category)
    `)
    .lt('available_quantity', 'reserved_quantity');

  const totalInventoryValue = stockValuation?.reduce((sum: number, item: any) => 
    sum + (item.total_value || 0), 0) || 0;

  const totalItems = stockValuation?.length || 0;

  return {
    summary: {
      totalInventoryValue,
      totalItems,
      lowStockItems: lowStock?.length || 0,
      period: request.period
    },
    details: {
      stockValuation: stockValuation || [],
      stockMovements: stockMovements || [],
      lowStockAlerts: lowStock || []
    },
    charts: request.includeCharts ? {
      inventoryValue: generateInventoryValueData(stockValuation),
      stockLevels: generateStockLevelData(stockValuation),
      turnoverRatio: generateTurnoverData(stockValuation)
    } : null
  };
}

async function generateComplianceReport(supabase: any, request: ReportRequest) {
  // Compliance checks
  const { data: complianceChecks } = await supabase
    .from('compliance_checks')
    .select(`
      *,
      regulatory_requirements (title, authority, category)
    `)
    .gte('check_date', request.period.start)
    .lte('check_date', request.period.end);

  const totalChecks = complianceChecks?.length || 0;
  const compliantChecks = complianceChecks?.filter((check: any) => 
    check.status === 'compliant').length || 0;
  const nonCompliantChecks = complianceChecks?.filter((check: any) => 
    check.status === 'non_compliant').length || 0;

  const complianceRate = totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 0;

  return {
    summary: {
      totalChecks,
      compliantChecks,
      nonCompliantChecks,
      complianceRate,
      period: request.period
    },
    details: {
      checks: complianceChecks || []
    },
    charts: request.includeCharts ? {
      complianceStatus: generateComplianceStatusData(complianceChecks),
      complianceTrend: generateComplianceTrendData(complianceChecks)
    } : null
  };
}

async function generatePerformanceReport(supabase: any, request: ReportRequest) {
  // KPI data would be fetched from kpi_values table
  const { data: kpiData } = await supabase
    .from('kpi_values')
    .select(`
      *,
      kpi_definitions (name, category, unit, target_value)
    `)
    .gte('period_start', request.period.start)
    .lte('period_end', request.period.end);

  // Calculate performance metrics
  const performanceMetrics = kpiData?.map((kpi: any) => ({
    name: kpi.kpi_definitions?.name,
    category: kpi.kpi_definitions?.category,
    actual: kpi.actual_value,
    target: kpi.target_value,
    variance: kpi.variance,
    variancePercent: kpi.variance_percent,
    unit: kpi.kpi_definitions?.unit
  })) || [];

  return {
    summary: {
      totalKPIs: performanceMetrics.length,
      kpisOnTarget: performanceMetrics.filter((kpi: any) => kpi.variance >= 0).length,
      avgPerformance: performanceMetrics.reduce((sum: any, kpi: any) => sum + (kpi.variancePercent || 0), 0) / Math.max(performanceMetrics.length, 1),
      period: request.period
    },
    details: {
      kpis: performanceMetrics
    },
    charts: request.includeCharts ? {
      kpiPerformance: generateKPIPerformanceData(performanceMetrics),
      categoryPerformance: generateCategoryPerformanceData(performanceMetrics)
    } : null
  };
}

// Helper functions for chart data generation
function generateSalesTrendData(salesData: any[]) {
  // Group sales by month
  const monthlyData = salesData?.reduce((acc: any, order: any) => {
    const month = new Date(order.order_date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, totalSales: 0, orderCount: 0 };
    }
    acc[month].totalSales += order.total_amount || 0;
    acc[month].orderCount += 1;
    return acc;
  }, {});

  return Object.values(monthlyData || {});
}

function generateCommodityMixData(commoditySummary: any) {
  return Object.values(commoditySummary || {}).map((item: any) => ({
    name: item.name,
    value: item.totalValue,
    percentage: 0 // Calculate based on total
  }));
}

function generateRepPerformanceData(repSummary: any) {
  return Object.values(repSummary || {});
}

function generateRevenueExpenseData(invoices: any[]) {
  // Group by month and type
  return invoices?.reduce((acc: any, invoice: any) => {
    const month = new Date(invoice.invoice_date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, revenue: 0, expenses: 0 };
    }
    if (invoice.invoice_type === 'sales') {
      acc[month].revenue += invoice.total_amount || 0;
    } else {
      acc[month].expenses += invoice.total_amount || 0;
    }
    return acc;
  }, {}) || {};
}

function generatePaymentTrendData(payments: any[]) {
  return payments?.reduce((acc: any, payment: any) => {
    const month = new Date(payment.payment_date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, totalPayments: 0, paymentCount: 0 };
    }
    acc[month].totalPayments += payment.amount || 0;
    acc[month].paymentCount += 1;
    return acc;
  }, {}) || {};
}

function generateARAgingData(arAging: any[]) {
  return arAging;
}

function generateInventoryValueData(stockValuation: any[]) {
  return stockValuation?.map((item: any) => ({
    commodity: item.commodity_name,
    value: item.total_value,
    quantity: item.total_quantity
  })) || [];
}

function generateStockLevelData(stockValuation: any[]) {
  return stockValuation;
}

function generateTurnoverData(stockValuation: any[]) {
  return stockValuation?.map((item: any) => ({
    commodity: item.commodity_name,
    turnoverRatio: item.turnover_ratio || 0
  })) || [];
}

function generateComplianceStatusData(complianceChecks: any[]) {
  const statusCounts = complianceChecks?.reduce((acc: any, check: any) => {
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));
}

function generateComplianceTrendData(complianceChecks: any[]) {
  return complianceChecks?.reduce((acc: any, check: any) => {
    const month = new Date(check.check_date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = { month, compliant: 0, nonCompliant: 0, total: 0 };
    }
    acc[month].total += 1;
    if (check.status === 'compliant') {
      acc[month].compliant += 1;
    } else if (check.status === 'non_compliant') {
      acc[month].nonCompliant += 1;
    }
    return acc;
  }, {}) || {};
}

function generateKPIPerformanceData(performanceMetrics: any[]) {
  return performanceMetrics;
}

function generateCategoryPerformanceData(performanceMetrics: any[]) {
  return performanceMetrics?.reduce((acc: any, kpi: any) => {
    const category = kpi.category || 'Other';
    if (!acc[category]) {
      acc[category] = { category, avgPerformance: 0, count: 0 };
    }
    acc[category].avgPerformance += kpi.variancePercent || 0;
    acc[category].count += 1;
    return acc;
  }, {}) || {};
}

