'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Globe,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';

interface NickelPriceData {
  commodity: string;
  grade: string;
  moisture_content: string;
  price_usd: number;
  price_change: number;
  percentage_change: number;
  date: string;
  period: string;
  source: string;
}

interface PriceAnalysis {
  current_avg: number;
  trend: 'up' | 'down' | 'stable';
  volatility: 'high' | 'medium' | 'low';
  recommendation: string;
}

export default function NickelPriceMonitor() {
  const [prices, setPrices] = useState<NickelPriceData[]>([]);
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrices();
    loadAnalysis();

    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      loadPrices();
      loadAnalysis();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadPrices = async () => {
    try {
      setError(null);
      const response = await fetch('/api/nickel/prices');
      const data = await response.json();

      if (data.success) {
        setPrices(data.data || []);
        setLastUpdated(new Date(data.last_updated));
      } else {
        setError(data.error || 'Failed to load prices');
        setPrices(data.data || []);
      }
    } catch (err: any) {
      setError('Network error loading prices');
      console.error('Error loading prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      const response = await fetch('/api/nickel/prices?analysis=true');
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
    }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/nickel/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });

      const data = await response.json();
      if (data.success) {
        setPrices(data.data.data || []);
        setLastUpdated(new Date());
        await loadAnalysis();
      }
    } catch (err) {
      console.error('Error refreshing prices:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-100';
    if (change < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Globe className="w-8 h-8 animate-pulse mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading nickel prices from APNI...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Nickel Price Monitor
          </h2>
          <p className="text-gray-600">
            Real-time prices from{' '}
            <a 
              href="https://www.apni.or.id/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              APNI (Asosiasi Penambang Nikel Indonesia)
            </a>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              <Calendar className="w-4 h-4 inline mr-1" />
              {lastUpdated.toLocaleString('id-ID')}
            </div>
          )}
          <Button 
            onClick={refreshPrices} 
            variant="outline" 
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Data Source Issue</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <p className="text-red-500 text-xs mt-2">
            Showing cached data. Prices may not be current.
          </p>
        </Card>
      )}

      {/* Price Analysis Summary */}
      {analysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-xl font-bold">{formatPrice(analysis.current_avg)}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                {analysis.trend === 'up' ? 
                  <TrendingUp className="w-6 h-6 text-green-600" /> :
                  analysis.trend === 'down' ?
                  <TrendingDown className="w-6 h-6 text-red-600" /> :
                  <Activity className="w-6 h-6 text-gray-600" />
                }
              </div>
              <p className="text-sm text-gray-600">Trend</p>
              <p className="text-lg font-semibold capitalize">{analysis.trend}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Volatility</p>
              <Badge className={`${getVolatilityColor(analysis.volatility)} text-sm`}>
                {analysis.volatility.toUpperCase()}
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Globe className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Source</p>
              <p className="text-lg font-semibold">APNI</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">AI Recommendation:</h4>
            <p className="text-blue-700 text-sm">{analysis.recommendation}</p>
          </div>
        </Card>
      )}

      {/* Price Data Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Nickel Prices</h3>
        
        {prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Grade</th>
                  <th className="text-left py-3">Moisture Content</th>
                  <th className="text-right py-3">Price (USD)</th>
                  <th className="text-right py-3">Change</th>
                  <th className="text-right py-3">% Change</th>
                  <th className="text-center py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{price.grade}</td>
                    <td className="py-3">{price.moisture_content}</td>
                    <td className="py-3 text-right font-semibold">
                      {formatPrice(price.price_usd)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(price.price_change)}
                        <span className={price.price_change > 0 ? 'text-green-600' : price.price_change < 0 ? 'text-red-600' : 'text-gray-600'}>
                          {formatPrice(Math.abs(price.price_change))}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Badge className={`${getTrendColor(price.percentage_change)} text-xs`}>
                        {formatPercentage(price.percentage_change)}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-sm text-gray-600">
                      {new Date(price.date).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">No price data available</p>
            <p className="text-sm text-gray-500 mt-1">
              Try refreshing or check the APNI website connection
            </p>
          </div>
        )}
      </Card>

      {/* Integration Status */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700 mb-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">APNI Integration Active</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-green-800">Auto-Updates:</p>
            <p className="text-green-600">Every 30 minutes</p>
          </div>
          <div>
            <p className="font-medium text-green-800">AI Integration:</p>
            <p className="text-green-600">Price predictions active</p>
          </div>
          <div>
            <p className="font-medium text-green-800">Data Source:</p>
            <p className="text-green-600">APNI Official Website</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
