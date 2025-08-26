'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Brain, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  Activity
} from 'lucide-react';

interface AIInsight {
  summary: string;
  key_metrics: Array<{
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    significance: 'high' | 'medium' | 'low';
  }>;
  predictions: Array<{
    timeframe: string;
    forecast: string;
    confidence: number;
  }>;
  risks: Array<{
    risk: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
  }>;
  actions: Array<{
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    impact: string;
  }>;
}

interface AiInsightCardProps {
  module: string;
  title?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function AiInsightCard({ 
  module, 
  title, 
  autoRefresh = false, 
  refreshInterval = 300000, // 5 minutes
  className = ""
}: AiInsightCardProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadInsight = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module,
          timeframe: '30d'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load AI insight');
      }

      const data = await response.json();
      setInsight(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading AI insight:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsight();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(loadInsight, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [module, autoRefresh, refreshInterval]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Brain className="w-8 h-8 animate-pulse mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">AI analyzing {module} data...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="text-red-600 mb-4">Failed to load AI insights</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={loadInsight} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">No AI insights available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            {title || `AI Insights - ${module.charAt(0).toUpperCase() + module.slice(1)}`}
          </h3>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button onClick={loadInsight} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h4 className="font-medium mb-2 text-gray-700">Executive Summary</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{insight.summary}</p>
      </div>

      {/* Key Metrics */}
      {insight.key_metrics && insight.key_metrics.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Key Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insight.key_metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.trend)}
                  <Badge className={`text-xs ${getSignificanceColor(metric.significance)}`}>
                    {metric.significance}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions */}
      {insight.predictions && insight.predictions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            AI Predictions
          </h4>
          <div className="space-y-3">
            {insight.predictions.map((prediction, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-700">{prediction.timeframe}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(prediction.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{prediction.forecast}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {insight.risks && insight.risks.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Assessment
          </h4>
          <div className="space-y-2">
            {insight.risks.map((risk, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getRiskIcon(risk.impact)}
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{risk.risk}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={`text-xs ${getImpactColor(risk.impact)}`}>
                      {risk.impact} impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(risk.probability * 100)}% probability
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {insight.actions && insight.actions.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommended Actions
          </h4>
          <div className="space-y-3">
            {insight.actions.map((action, index) => (
              <div key={index} className={`p-3 border rounded-lg ${getPriorityColor(action.priority)}`}>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                    {action.priority} priority
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">{action.action}</p>
                <p className="text-xs text-gray-600">{action.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
