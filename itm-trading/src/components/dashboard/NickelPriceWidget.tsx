'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart3 } from 'lucide-react';

interface NickelPrice {
  timestamp: string;
  price_usd_per_lb: number;
  price_usd_per_mt: number;
  change_24h_percent: number;
  trend: 'up' | 'down' | 'stable';
  market_status: 'open' | 'closed';
  source: string;
  additional_data?: {
    volatility?: number;
    volume?: number;
    high_24h?: number;
    low_24h?: number;
  };
}

interface NickelPriceWidgetProps {
  className?: string;
  compact?: boolean;
}

export default function NickelPriceWidget({ className = '', compact = false }: NickelPriceWidgetProps) {
  const [nickelData, setNickelData] = useState<NickelPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNickelPrice = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = forceRefresh 
        ? '/api/nickel/prices?analysis=true&force=true'
        : '/api/nickel/prices?analysis=true';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.prices?.length > 0) {
        const latestPrice = data.prices[0];
        setNickelData(latestPrice);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'No price data available');
      }
    } catch (err: any) {
      console.error('Failed to fetch nickel price:', err);
      setError(err.message);
      
      // Fallback to sample data if API fails
      setNickelData({
        timestamp: new Date().toISOString(),
        price_usd_per_lb: 8.25,
        price_usd_per_mt: 18_200,
        change_24h_percent: 2.3,
        trend: 'up',
        market_status: 'open',
        source: 'Sample Data (API Unavailable)',
        additional_data: {
          volatility: 1.2,
          volume: 15420,
          high_24h: 8.31,
          low_24h: 8.05
        }
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNickelPrice();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchNickelPrice();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = () => {
    if (!nickelData) return null;
    
    if (nickelData.change_24h_percent > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (nickelData.change_24h_percent < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!nickelData) return 'text-gray-600';
    
    if (nickelData.change_24h_percent > 0) {
      return 'text-green-600';
    } else if (nickelData.change_24h_percent < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  };

  const getBackgroundGradient = () => {
    if (!nickelData) return 'from-gray-50 to-gray-100';
    
    if (nickelData.change_24h_percent > 0) {
      return 'from-green-50 to-emerald-100';
    } else if (nickelData.change_24h_percent < 0) {
      return 'from-red-50 to-rose-100';
    } else {
      return 'from-blue-50 to-indigo-100';
    }
  };

  if (compact) {
    return (
      <div className={`bg-gradient-to-br ${getBackgroundGradient()} rounded-xl border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">Ni</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Nickel</p>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-xs font-medium ${getTrendColor()}`}>
                  {nickelData?.change_24h_percent ? 
                    `${nickelData.change_24h_percent > 0 ? '+' : ''}${nickelData.change_24h_percent.toFixed(2)}%` 
                    : '0.00%'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              ${nickelData?.price_usd_per_lb.toFixed(2) || '0.00'}<span className="text-sm font-normal text-gray-600">/lb</span>
            </p>
            <p className="text-xs text-gray-600">
              ${nickelData?.price_usd_per_mt.toLocaleString() || '0'}/MT
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${getBackgroundGradient()} rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">Ni</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Nickel Price</h3>
            <p className="text-sm text-gray-600">Real-time Market Data</p>
          </div>
        </div>
        
        <button
          onClick={() => fetchNickelPrice(true)}
          disabled={loading}
          className="p-2 bg-white/80 rounded-lg border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200 disabled:opacity-50"
          title="Refresh Price"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !nickelData ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Loading price data...</p>
        </div>
      ) : error && !nickelData ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <p className="text-sm text-red-600 font-medium">Failed to load price data</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => fetchNickelPrice(true)}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : nickelData ? (
        <>
          {/* Price Display */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Per Pound</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${nickelData.price_usd_per_lb.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Per Metric Ton</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${nickelData.price_usd_per_mt.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Change & Trend */}
          <div className="bg-white/80 rounded-xl p-4 border border-gray-200 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <span className="text-sm font-medium text-gray-700">24h Change</span>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${getTrendColor()}`}>
                  {nickelData.change_24h_percent > 0 ? '+' : ''}
                  {nickelData.change_24h_percent.toFixed(2)}%
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${nickelData.market_status === 'open' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600 capitalize">{nickelData.market_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Data */}
          {nickelData.additional_data && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {nickelData.additional_data.high_24h && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-600">24h High</p>
                  <p className="text-sm font-bold text-green-700">
                    ${nickelData.additional_data.high_24h.toFixed(2)}
                  </p>
                </div>
              )}
              
              {nickelData.additional_data.low_24h && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-600">24h Low</p>
                  <p className="text-sm font-bold text-red-700">
                    ${nickelData.additional_data.low_24h.toFixed(2)}
                  </p>
                </div>
              )}
              
              {nickelData.additional_data.volatility && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-600">Volatility</p>
                  <p className="text-sm font-bold text-blue-700">
                    {nickelData.additional_data.volatility.toFixed(1)}%
                  </p>
                </div>
              )}
              
              {nickelData.additional_data.volume && (
                <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-600">Volume</p>
                  <p className="text-sm font-bold text-purple-700">
                    {nickelData.additional_data.volume.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 bg-white/60 rounded-lg p-3 border border-gray-100">
            <span>Source: {nickelData.source}</span>
            {lastUpdated && (
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
