'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

interface LearningMetrics {
  overall_accuracy: number;
  accuracy_by_commodity: { [key: string]: number };
  accuracy_by_timeframe: { [key: string]: number };
  improving_factors: string[];
  declining_factors: string[];
  recommendation_adjustments: string[];
}

interface AIPerformanceData {
  total_predictions: number;
  accurate_predictions: number;
  average_accuracy: number;
  learning_iterations: number;
  model_improvements: number;
  business_impact_score: number;
}

interface PredictionOutcome {
  id: string;
  commodity: string;
  predicted_value: number;
  actual_value: number;
  accuracy_percentage: number;
  prediction_date: string;
  outcome_date: string;
}

export default function AILearningDashboard() {
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<AIPerformanceData | null>(null);
  const [recentOutcomes, setRecentOutcomes] = useState<PredictionOutcome[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const commodities = ['all', 'coal', 'nickel', 'iron', 'copper', 'bauxite'];

  useEffect(() => {
    loadAIMetrics();
  }, [selectedCommodity]);

  const loadAIMetrics = async () => {
    setLoading(true);
    try {
      // Load learning metrics
      const metricsResponse = await fetch(`/api/ai/learning-metrics${selectedCommodity !== 'all' ? `?commodity=${selectedCommodity}` : ''}`);
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        setLearningMetrics(metrics);
      }

      // Load performance data
      const performanceResponse = await fetch(`/api/ai/performance${selectedCommodity !== 'all' ? `?commodity=${selectedCommodity}` : ''}`);
      if (performanceResponse.ok) {
        const performance = await performanceResponse.json();
        setPerformanceData(performance);
      }

      // Load recent prediction outcomes
      const outcomesResponse = await fetch(`/api/ai/recent-outcomes${selectedCommodity !== 'all' ? `?commodity=${selectedCommodity}` : ''}?limit=10`);
      if (outcomesResponse.ok) {
        const outcomes = await outcomesResponse.json();
        setRecentOutcomes(outcomes);
      }

    } catch (error) {
      console.error('Error loading AI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualLearning = async () => {
    try {
      const response = await fetch('/api/ai/trigger-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity: selectedCommodity !== 'all' ? selectedCommodity : undefined })
      });
      
      if (response.ok) {
        await loadAIMetrics(); // Reload data
      }
    } catch (error) {
      console.error('Error triggering learning:', error);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'text-green-600 bg-green-100';
    if (accuracy >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 85) return <CheckCircle className="w-4 h-4" />;
    if (accuracy >= 70) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>AI Learning Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Learning Dashboard
          </h2>
          <p className="text-gray-600">Monitor AI prediction accuracy and learning progress</p>
        </div>
        
        <div className="flex gap-4">
          <select 
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {commodities.map(commodity => (
              <option key={commodity} value={commodity}>
                {commodity === 'all' ? 'All Commodities' : commodity.toUpperCase()}
              </option>
            ))}
          </select>
          
          <Button onClick={triggerManualLearning} variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            Trigger Learning
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Accuracy</p>
              <p className="text-2xl font-bold">
                {learningMetrics?.overall_accuracy.toFixed(1) || '0.0'}%
              </p>
            </div>
            <div className={`p-2 rounded-full ${getAccuracyColor(learningMetrics?.overall_accuracy || 0)}`}>
              {getAccuracyIcon(learningMetrics?.overall_accuracy || 0)}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold">{performanceData?.total_predictions || 0}</p>
            </div>
            <Target className="w-6 h-6 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning Iterations</p>
              <p className="text-2xl font-bold">{performanceData?.learning_iterations || 0}</p>
            </div>
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Model Improvements</p>
              <p className="text-2xl font-bold">{performanceData?.model_improvements || 0}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Accuracy by Commodity */}
      {learningMetrics?.accuracy_by_commodity && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Accuracy by Commodity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(learningMetrics.accuracy_by_commodity).map(([commodity, accuracy]) => (
              <div key={commodity} className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium capitalize">{commodity}</span>
                <Badge className={getAccuracyColor(accuracy)}>
                  {accuracy.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Learning Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Improving Factors
          </h3>
          <div className="space-y-2">
            {learningMetrics?.improving_factors.length ? (
              learningMetrics.improving_factors.map((factor, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2 text-green-700 border-green-300">
                  {factor.replace(/_/g, ' ')}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500">No improving factors identified yet</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Declining Factors
          </h3>
          <div className="space-y-2">
            {learningMetrics?.declining_factors.length ? (
              learningMetrics.declining_factors.map((factor, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2 text-red-700 border-red-300">
                  {factor.replace(/_/g, ' ')}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500">No declining factors identified</p>
            )}
          </div>
        </Card>
      </div>

      {/* Model Adjustments */}
      {learningMetrics?.recommendation_adjustments && learningMetrics.recommendation_adjustments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI Model Adjustments</h3>
          <div className="space-y-2">
            {learningMetrics.recommendation_adjustments.map((adjustment, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-blue-800">{adjustment.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Prediction Outcomes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Prediction Outcomes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Commodity</th>
                <th className="text-left py-2">Predicted</th>
                <th className="text-left py-2">Actual</th>
                <th className="text-left py-2">Accuracy</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOutcomes.map((outcome) => (
                <tr key={outcome.id} className="border-b">
                  <td className="py-2 capitalize">{outcome.commodity}</td>
                  <td className="py-2">{outcome.predicted_value.toLocaleString()}</td>
                  <td className="py-2">{outcome.actual_value.toLocaleString()}</td>
                  <td className="py-2">
                    <Badge className={getAccuracyColor(outcome.accuracy_percentage)}>
                      {outcome.accuracy_percentage.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="py-2 text-sm text-gray-600">
                    {new Date(outcome.outcome_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {recentOutcomes.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No prediction outcomes available yet. Start making predictions to see learning data.
            </p>
          )}
        </div>
      </Card>

      {/* Learning Progress Visualization */}
      {learningMetrics?.accuracy_by_timeframe && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Accuracy by Prediction Timeframe</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(learningMetrics.accuracy_by_timeframe).map(([timeframe, accuracy]) => (
              <div key={timeframe} className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{timeframe.replace('_', ' ')}</p>
                <p className="text-xl font-bold">{accuracy.toFixed(1)}%</p>
                <div className={`w-full h-2 rounded-full mt-2 ${getAccuracyColor(accuracy).split(' ')[1]}`}>
                  <div 
                    className={`h-full rounded-full ${getAccuracyColor(accuracy).split(' ')[1].replace('bg-', 'bg-')}`}
                    style={{ width: `${Math.min(100, accuracy)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

