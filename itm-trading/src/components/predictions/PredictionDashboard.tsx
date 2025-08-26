'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import RealtimeChart from '@/components/dashboard/RealtimeChart';
import KPIWidget from '@/components/dashboard/KPIWidget';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Zap,
  Brain,
  Target,
  BarChart3
} from 'lucide-react';

interface SalesPrediction {
  commodity: string;
  monthly_forecast: Array<{
    month: string;
    predicted_quantity: number;
    confidence: number;
    trend: string;
  }>;
  factors: string[];
  recommendations: string[];
  historical_average: number;
  confidence_level: string;
  risk_factors: string[];
}

interface CashFlowPrediction {
  monthly_cashflow: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
    confidence: number;
  }>;
  risk_scenarios: {
    [key: string]: {
      impact: number;
      probability: number;
    };
  };
  recommendations: string[];
}

interface InventoryPrediction {
  reorder_alerts: Array<{
    commodity: string;
    current_stock: number;
    reorder_point: number;
    recommended_order: number;
    urgency: string;
  }>;
  overstock_warnings: Array<{
    commodity: string;
    current_stock: number;
    predicted_usage: number;
    action: string;
  }>;
  optimal_levels: {
    [key: string]: {
      min: number;
      max: number;
      optimal: number;
    };
  };
}

export default function PredictionDashboard() {
  const [salesPrediction, setSalesPrediction] = useState<SalesPrediction | null>(null);
  const [cashFlowPrediction, setCashFlowPrediction] = useState<CashFlowPrediction | null>(null);
  const [inventoryPrediction, setInventoryPrediction] = useState<InventoryPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState('coal');

  const commodities = ['coal', 'nickel', 'iron', 'copper', 'bauxite'];

  useEffect(() => {
    loadPredictions();
  }, [selectedCommodity]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      // Load sales prediction
      const salesResponse = await fetch(`/api/predictions/sales?commodity=${selectedCommodity}&months=6`);
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setSalesPrediction(salesData);
      }

      // Simulate cash flow prediction
      setCashFlowPrediction({
        monthly_cashflow: [
          { month: '2025-03', inflow: 2500000000, outflow: 1800000000, net: 700000000, confidence: 0.88 },
          { month: '2025-04', inflow: 2800000000, outflow: 2000000000, net: 800000000, confidence: 0.85 },
          { month: '2025-05', inflow: 2600000000, outflow: 1900000000, net: 700000000, confidence: 0.82 }
        ],
        risk_scenarios: {
          'late_payments': { impact: -300000000, probability: 0.3 },
          'delayed_shipments': { impact: -200000000, probability: 0.2 }
        },
        recommendations: ['secure_credit_line', 'negotiate_payment_terms']
      });

      // Simulate inventory prediction
      setInventoryPrediction({
        reorder_alerts: [
          { commodity: 'coal_grade_a', current_stock: 1200, reorder_point: 1500, recommended_order: 3000, urgency: 'high' },
          { commodity: 'nickel_ore', current_stock: 800, reorder_point: 1000, recommended_order: 2000, urgency: 'medium' }
        ],
        overstock_warnings: [
          { commodity: 'iron_ore', current_stock: 5000, predicted_usage: 2000, action: 'find_buyer_or_reduce_purchase' }
        ],
        optimal_levels: {
          'coal_grade_a': { min: 1500, max: 4000, optimal: 2500 },
          'nickel_ore': { min: 800, max: 2500, optimal: 1500 }
        }
      });

    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Loading size="lg" text="Loading AI predictions..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Predictive Analytics
          </h1>
          <p className="text-gray-600">Intelligent forecasting for business planning</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            {commodities.map(commodity => (
              <option key={commodity} value={commodity}>
                {commodity.charAt(0).toUpperCase() + commodity.slice(1)}
              </option>
            ))}
          </select>
          
          <Button onClick={loadPredictions} variant="outline">
            Refresh Predictions
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPIWidget
          title="Next Month Forecast"
          value={salesPrediction?.monthly_forecast[0]?.predicted_quantity || 0}
          format="number"
          suffix="tons"
          icon={<Target className="h-5 w-5" />}
          color="blue"
        />
        
        <KPIWidget
          title="Prediction Confidence"
          value={(salesPrediction?.monthly_forecast[0]?.confidence || 0) * 100}
          format="percentage"
          icon={<BarChart3 className="h-5 w-5" />}
          color="green"
        />
        
        <KPIWidget
          title="Historical Average"
          value={salesPrediction?.historical_average || 0}
          format="number"
          suffix="tons"
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        
        <KPIWidget
          title="Risk Level"
          value={salesPrediction?.risk_factors?.length || 0}
          format="number"
          suffix="factors"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Forecast Chart */}
        {salesPrediction && (
          <RealtimeChart
            title={`Sales Forecast - ${selectedCommodity.toUpperCase()}`}
            data={salesPrediction.monthly_forecast.map(item => ({
              name: item.month,
              value: item.predicted_quantity,
              confidence: Math.round(item.confidence * 100)
            }))}
            type="area"
            dataKey="value"
            height={300}
            color="#3B82F6"
          />
        )}

        {/* Cash Flow Prediction */}
        {cashFlowPrediction && (
          <RealtimeChart
            title="Cash Flow Forecast"
            data={cashFlowPrediction.monthly_cashflow.map(item => ({
              name: item.month,
              value: item.net / 1000000, // Convert to millions
              inflow: item.inflow / 1000000,
              outflow: item.outflow / 1000000
            }))}
            type="bar"
            dataKey="value"
            height={300}
            color="#10B981"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Insights */}
        {salesPrediction && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Sales Insights
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Key Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {salesPrediction.factors.map((factor, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {factor.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {salesPrediction.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      {rec.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Alerts */}
        {inventoryPrediction && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-600" />
              Inventory Alerts
            </h3>
            
            <div className="space-y-3">
              {inventoryPrediction.reorder_alerts.map((alert, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-3 py-2 bg-red-50">
                  <div className="font-semibold text-sm text-red-800">
                    {alert.commodity.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-red-600">
                    Current: {alert.current_stock} | Reorder: {alert.recommended_order}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    alert.urgency === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.urgency} priority
                  </span>
                </div>
              ))}
              
              {inventoryPrediction.overstock_warnings.map((warning, index) => (
                <div key={index} className="border-l-4 border-yellow-500 pl-3 py-2 bg-yellow-50">
                  <div className="font-semibold text-sm text-yellow-800">
                    {warning.commodity.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-yellow-600">
                    Overstock: {warning.current_stock} vs Usage: {warning.predicted_usage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cash Flow Risks */}
        {cashFlowPrediction && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Cash Flow Risks
            </h3>
            
            <div className="space-y-3">
              {Object.entries(cashFlowPrediction.risk_scenarios).map(([risk, data], index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium text-sm text-gray-800">
                    {risk.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Impact: Rp {Math.abs(data.impact / 1000000).toFixed(0)}M
                  </div>
                  <div className="text-xs text-gray-600">
                    Probability: {(data.probability * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Actions</h4>
                <ul className="space-y-1">
                  {cashFlowPrediction.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      {rec.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

