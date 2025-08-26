'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import RealtimeChart from '@/components/dashboard/RealtimeChart';
import { Button } from '@/components/ui/Button';
import {

  DollarSign,
  Package,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,

  Activity,
  FileText,
  Globe,

} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    activeCustomers: number;
    customerGrowth: number;
    inventoryValue: number;
    inventoryChange: number;
  };
  salesData: Array<{
    month: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  commodityData: Array<{
    name: string;
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  pendingApprovals: Array<{
    id: string;
    type: string;
    amount: number;
    requestor: string;
    daysWaiting: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  complianceStatus: {
    compliant: number;
    pending: number;
    nonCompliant: number;
  };
  shipmentStatus: {
    inTransit: number;
    delivered: number;
    delayed: number;
  };
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [refreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(loadDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [selectedPeriod, refreshInterval]);

  const loadDashboardData = async () => {
    try {
      // Fetch real data from Supabase API
      const response = await fetch('/api/dashboard/executive');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  if (loading || !data) {
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
    );
  }

  const approvalColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (value: string) => (
        <StatusBadge status={value.toLowerCase().replace(' ', '_')} />
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'requestor',
      title: 'Requestor'
    },
    {
      key: 'daysWaiting',
      title: 'Days Waiting',
      render: (value: number) => (
        <span className={value > 3 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
          {value} days
        </span>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value: string) => (
        <StatusBadge status={value} />
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights for ITM Trading operations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <Button variant="outline" onClick={loadDashboardData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.kpis.totalRevenue)}
          change={{
            value: data.kpis.revenueGrowth,
            type: data.kpis.revenueGrowth > 0 ? 'increase' : 'decrease',
            period: 'vs last month'
          }}
          icon={<DollarSign className="h-6 w-6" />}
        />
        
        <MetricCard
          title="Total Orders"
          value={formatNumber(data.kpis.totalOrders)}
          change={{
            value: data.kpis.ordersGrowth,
            type: data.kpis.ordersGrowth > 0 ? 'increase' : 'decrease',
            period: 'vs last month'
          }}
          icon={<FileText className="h-6 w-6" />}
        />
        
        <MetricCard
          title="Active Customers"
          value={formatNumber(data.kpis.activeCustomers)}
          change={{
            value: data.kpis.customerGrowth,
            type: data.kpis.customerGrowth > 0 ? 'increase' : 'decrease',
            period: 'vs last month'
          }}
          icon={<Users className="h-6 w-6" />}
        />
        
        <MetricCard
          title="Inventory Value"
          value={formatCurrency(data.kpis.inventoryValue)}
          change={{
            value: Math.abs(data.kpis.inventoryChange),
            type: data.kpis.inventoryChange > 0 ? 'increase' : 'decrease',
            period: 'vs last month'
          }}
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <RealtimeChart
          title="Revenue Trend"
          data={data.salesData.map(item => ({
            name: item.month,
            value: item.revenue / 1000000000, // Convert to billions
            orders: item.orders
          }))}
          type="area"
          dataKey="value"
          height={300}
          color="#3B82F6"
        />

        {/* Commodity Performance */}
        <RealtimeChart
          title="Commodity Performance"
          data={data.commodityData}
          type="pie"
          dataKey="percentage"
          height={300}
          color="#10B981"
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compliant</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${(data.complianceStatus.compliant / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{data.complianceStatus.compliant}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-yellow-500 rounded-full"
                      style={{ width: `${(data.complianceStatus.pending / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{data.complianceStatus.pending}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Non-Compliant</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-red-500 rounded-full"
                      style={{ width: `${(data.complianceStatus.nonCompliant / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{data.complianceStatus.nonCompliant}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">In Transit</span>
                </div>
                <span className="text-lg font-semibold">{data.shipmentStatus.inTransit}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Delivered</span>
                </div>
                <span className="text-lg font-semibold">{data.shipmentStatus.delivered}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Delayed</span>
                </div>
                <span className="text-lg font-semibold text-red-600">{data.shipmentStatus.delayed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Monthly Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review Alerts
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Export Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
            {data.pendingApprovals.length > 0 && (
              <StatusBadge variant="warning" size="sm">
                {data.pendingApprovals.length} pending
              </StatusBadge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.pendingApprovals}
            columns={approvalColumns}
            searchable={false}
            pageSize={5}
            onRowClick={(row) => {
              // Navigate to approval detail
              console.log('Navigate to approval:', row.id);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

