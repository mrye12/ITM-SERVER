'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface KPIWidgetProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'number' | 'percentage';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  suffix?: string;
  loading?: boolean;
}

export function KPIWidget({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  color = 'blue',
  suffix,
  loading = false
}: KPIWidgetProps) {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return formatNumber(val);
    }
  };

  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    return {
      percentage: Math.abs(change),
      isPositive,
      isNegative,
      isNeutral: change === 0
    };
  };

  const change = calculateChange();

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon && (
          <div className={`p-2 rounded-lg ${iconColorClasses[color]} bg-white bg-opacity-50`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
            {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
          </p>
          
          {change && (
            <div className="flex items-center mt-1">
              {change.isPositive && <TrendingUp className="h-3 w-3 text-green-600 mr-1" />}
              {change.isNegative && <TrendingDown className="h-3 w-3 text-red-600 mr-1" />}
              {change.isNeutral && <Minus className="h-3 w-3 text-gray-600 mr-1" />}
              
              <span className={`text-xs font-medium ${
                change.isPositive ? 'text-green-600' : 
                change.isNegative ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change.percentage.toFixed(1)}%
              </span>
              
              <span className="text-xs text-gray-500 ml-1">vs period sebelumnya</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KPIWidget;

