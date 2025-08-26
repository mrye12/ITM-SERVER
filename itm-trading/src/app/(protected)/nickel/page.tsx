'use client';

import { useState, useEffect } from 'react';
import NickelPriceMonitor from '@/components/nickel/NickelPriceMonitor';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Globe, 
  TrendingUp, 
  AlertTriangle, 
  Brain,
  RefreshCw,
  ExternalLink,
  Database,
  Activity
} from 'lucide-react';

export default function NickelPage() {
  const [integrationStatus, setIntegrationStatus] = useState<{
    apni: boolean;
    ai: boolean;
    database: boolean;
  }>({
    apni: false,
    ai: false,
    database: false
  });

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      // Check APNI connection
      const apniResponse = await fetch('/api/nickel/prices');
      const apniData = await apniResponse.json();
      
      // Check AI integration
      const aiResponse = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'nickel', timeframe: '7d' })
      });
      
      setIntegrationStatus({
        apni: apniData.success,
        ai: aiResponse.ok,
        database: apniData.data && apniData.data.length > 0
      });
    } catch (error) {
      console.error('Error checking integration status:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nickel Price Intelligence
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Real-time nickel price monitoring and AI-powered market analysis integrated with{' '}
            <a 
              href="https://www.apni.or.id/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              APNI <ExternalLink className="w-3 h-3" />
            </a>
            {' '}for comprehensive mining commodity intelligence.
          </p>
        </div>
        
        <Button onClick={checkIntegrationStatus} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Check Status
        </Button>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-4 ${integrationStatus.apni ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <Globe className={`w-6 h-6 ${integrationStatus.apni ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <h3 className="font-semibold">APNI Connection</h3>
              <p className={`text-sm ${integrationStatus.apni ? 'text-green-600' : 'text-red-600'}`}>
                {integrationStatus.apni ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${integrationStatus.ai ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <Brain className={`w-6 h-6 ${integrationStatus.ai ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <h3 className="font-semibold">AI Analysis</h3>
              <p className={`text-sm ${integrationStatus.ai ? 'text-green-600' : 'text-red-600'}`}>
                {integrationStatus.ai ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 ${integrationStatus.database ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-3">
            <Database className={`w-6 h-6 ${integrationStatus.database ? 'text-green-600' : 'text-yellow-600'}`} />
            <div>
              <h3 className="font-semibold">Data Storage</h3>
              <p className={`text-sm ${integrationStatus.database ? 'text-green-600' : 'text-yellow-600'}`}>
                {integrationStatus.database ? 'Data Available' : 'No Data'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Features Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Nickel Price Intelligence Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <Globe className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium mb-1">APNI Integration</h3>
            <p className="text-sm text-gray-600">
              Direct data scraping from APNI website with multiple fallback methods
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-medium mb-1">Price Analysis</h3>
            <p className="text-sm text-gray-600">
              Real-time trend analysis, volatility assessment, and market insights
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <Brain className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-medium mb-1">AI Predictions</h3>
            <p className="text-sm text-gray-600">
              Machine learning powered price forecasting and recommendation engine
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <Database className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-medium mb-1">Data Management</h3>
            <p className="text-sm text-gray-600">
              Automated data storage, caching, and historical price tracking
            </p>
          </div>
        </div>
      </Card>

      {/* Warning for Integration Issues */}
      {(!integrationStatus.apni || !integrationStatus.ai) && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Integration Notice</h3>
              <p className="text-yellow-700 text-sm">
                Some features may be limited due to connection issues. The system will continue 
                to function using cached data and fallback mechanisms.
              </p>
              {!integrationStatus.apni && (
                <p className="text-yellow-600 text-xs mt-2">
                  • APNI website connection: Please check network connectivity
                </p>
              )}
              {!integrationStatus.ai && (
                <p className="text-yellow-600 text-xs">
                  • AI analysis: Verify Hugging Face token configuration
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Price Monitor Component */}
      <NickelPriceMonitor />

      {/* Technical Information */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Technical Implementation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Data Collection</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Web scraping from APNI official website</li>
              <li>• Multiple fallback methods for reliability</li>
              <li>• Automatic data parsing and validation</li>
              <li>• 30-minute auto-refresh intervals</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">AI Integration</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Hugging Face GPT-OSS-20B model</li>
              <li>• Custom price prediction algorithms</li>
              <li>• Market sentiment analysis</li>
              <li>• Trading recommendation engine</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Data Storage</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• PostgreSQL with Supabase</li>
              <li>• Historical price tracking</li>
              <li>• Automated data deduplication</li>
              <li>• Performance optimized queries</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Business Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time price alerts</li>
              <li>• Market trend notifications</li>
              <li>• Export data capabilities</li>
              <li>• Integration with trading workflows</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
