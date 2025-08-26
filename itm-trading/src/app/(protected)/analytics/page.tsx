"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import { useToast } from '@/hooks/useToast'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Activity,
  Download,
  Filter,
  Calendar,
  Refresh,
  Eye,
  PieChart
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsePieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface AnalyticsData {
  financial_metrics: {
    total_revenue: number
    revenue_growth: number
    total_expenses: number
    expense_growth: number
    net_profit: number
    profit_margin: number
    gross_margin: number
  }
  sales_metrics: {
    total_sales: number
    sales_growth: number
    avg_order_value: number
    conversion_rate: number
    customer_acquisition_cost: number
    customer_lifetime_value: number
  }
  operational_metrics: {
    inventory_turnover: number
    inventory_value: number
    production_efficiency: number
    equipment_utilization: number
    delivery_performance: number
  }
  market_metrics: {
    market_share: number
    price_competitiveness: number
    customer_satisfaction: number
    brand_recognition: number
  }
}

interface ChartData {
  period: string
  revenue: number
  profit: number
  expenses: number
  sales_volume: number
  [key: string]: string | number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'profit' | 'sales' | 'expenses'>('revenue')
  const [refreshing, setRefreshing] = useState(false)
  
  const { toast } = useToast()

  // Real-time data from Supabase
  const { data: recentSales } = useRealtimeTable({
    table: 'sales',
    orderBy: { column: 'created_at', ascending: false },
    select: 'id, total_amount, customer_name, product, created_at'
  })

  const { data: recentPurchases } = useRealtimeTable({
    table: 'purchases',
    orderBy: { column: 'created_at', ascending: false },
    select: 'id, total_amount, supplier_name, commodity_type, created_at'
  })

  const { data: inventoryData } = useRealtimeTable({
    table: 'inventory',
    select: 'commodity_name, current_stock, unit_value, total_value'
  })

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch analytics data from API
      const response = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data.metrics)
      setChartData(data.chart_data)

    } catch (error) {
      console.error('Analytics data load error:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
    toast.success('Analytics data refreshed')
  }

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/export?period=${selectedPeriod}&format=csv`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Analytics data exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
          <p className="text-gray-600">Real-time analytics and insights for ITM Trading</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Period Filter */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>

          <Button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <Refresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={exportData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.financial_metrics.total_revenue)}
                </p>
                <p className={`text-sm flex items-center ${
                  analyticsData.financial_metrics.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analyticsData.financial_metrics.revenue_growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {formatPercentage(analyticsData.financial_metrics.revenue_growth)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Profit Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.financial_metrics.net_profit)}
                </p>
                <p className="text-sm text-gray-600">
                  Margin: {analyticsData.financial_metrics.profit_margin.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Sales Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.sales_metrics.total_sales.toLocaleString()}
                </p>
                <p className={`text-sm flex items-center ${
                  analyticsData.sales_metrics.sales_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analyticsData.sales_metrics.sales_growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {formatPercentage(analyticsData.sales_metrics.sales_growth)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Inventory Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.operational_metrics.inventory_value)}
                </p>
                <p className="text-sm text-gray-600">
                  Turnover: {analyticsData.operational_metrics.inventory_turnover.toFixed(1)}x
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit Trend</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="expenses">Expenses</option>
              <option value="sales">Sales Volume</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                typeof value === 'number' ? formatCurrency(value) : value,
                name
              ]} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#0088FE"
                fill="#0088FE"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stackId="1"
                stroke="#00C49F"
                fill="#00C49F"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Sales Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales_volume" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Inventory Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsePieChart>
              <Pie
                data={inventoryData?.map((item, index) => ({
                  name: item.commodity_name,
                  value: item.total_value,
                  color: COLORS[index % COLORS.length]
                }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {inventoryData?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </RechartsePieChart>
          </ResponsiveContainer>
        </Card>

        {/* Real-time Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {recentSales?.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Sale to {sale.customer_name}</p>
                  <p className="text-sm text-gray-600">{sale.product}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {formatCurrency(sale.total_amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            
            {recentPurchases?.slice(0, 3).map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Purchase from {purchase.supplier_name}</p>
                  <p className="text-sm text-gray-600">{purchase.commodity_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(purchase.total_amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Production Efficiency</span>
                <span className="font-semibold">
                  {analyticsData.operational_metrics.production_efficiency.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Equipment Utilization</span>
                <span className="font-semibold">
                  {analyticsData.operational_metrics.equipment_utilization.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Performance</span>
                <span className="font-semibold">
                  {analyticsData.operational_metrics.delivery_performance.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Order Value</span>
                <span className="font-semibold">
                  {formatCurrency(analyticsData.sales_metrics.avg_order_value)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold">
                  {analyticsData.sales_metrics.conversion_rate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Customer LTV</span>
                <span className="font-semibold">
                  {formatCurrency(analyticsData.sales_metrics.customer_lifetime_value)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Position</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Market Share</span>
                <span className="font-semibold">
                  {analyticsData.market_metrics.market_share.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price Competitiveness</span>
                <span className="font-semibold">
                  {analyticsData.market_metrics.price_competitiveness.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold">
                  {analyticsData.market_metrics.customer_satisfaction.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
