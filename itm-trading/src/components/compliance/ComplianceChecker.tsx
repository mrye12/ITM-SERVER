// itm-trading/src/components/compliance/ComplianceChecker.tsx
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
 
  TrendingUp,
  DollarSign,
  Eye,
  Search,
  Download
} from 'lucide-react';

interface ComplianceCheckProps {
  onResult?: (result: any) => void;
  defaultValues?: {
    commodity_id?: string;
    destination_country?: string;
  };
}

interface ComplianceResult {
  status: 'allowed' | 'conditional' | 'prohibited' | 'review_required';
  risk_score: number;
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  compliance_summary: string;
  required_documents: string[];
  regulatory_notes: string[];
  restrictions: string[];
  recommendations: string[];
  estimated_costs?: {
    taxes: number;
    fees: number;
    total: number;
    currency: string;
  };
}

export default function ComplianceChecker({ onResult, defaultValues }: ComplianceCheckProps) {
  const [formData, setFormData] = useState({
    commodity_id: defaultValues?.commodity_id || '',
    commodity_name: '',
    hs_code: '',
    destination_country: defaultValues?.destination_country || '',
    quantity: '',
    unit: 'MT',
    transaction_value: '',
    currency: 'USD',
    buyer_name: '',
    buyer_country: '',
    is_new_buyer: false
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commodities, setCommodities] = useState<any[]>([]);

  // Load commodities list
  useEffect(() => {
    loadCommodities();
  }, []);

  const loadCommodities = async () => {
    try {
      // Would load from Supabase in real implementation
      const mockCommodities = [
        { id: '1', kode_komoditas: 'COAL-THERMAL', nama_komoditas: 'Batubara Thermal', hs_code: '2701.12' },
        { id: '2', kode_komoditas: 'FERRO-NICKEL', nama_komoditas: 'Ferro Nikel', hs_code: '7202.60' },
        { id: '3', kode_komoditas: 'NICKEL-ORE', nama_komoditas: 'Bijih Nikel', hs_code: '2604.00' },
        { id: '4', kode_komoditas: 'TIN-INGOT', nama_komoditas: 'Timah Batangan', hs_code: '8001.10' }
      ];
      setCommodities(mockCommodities);
    } catch (error) {
      console.error('Error loading commodities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity_id: formData.commodity_id,
          commodity_name: formData.commodity_name,
          hs_code: formData.hs_code,
          destination_country: formData.destination_country,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          transaction_value: formData.transaction_value ? parseFloat(formData.transaction_value) : undefined,
          currency: formData.currency,
          buyer_info: {
            name: formData.buyer_name,
            country: formData.buyer_country,
            is_new_buyer: formData.is_new_buyer
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || 'Compliance check failed');
      }

      setResult(data.result);
      onResult?.(data.result);

    } catch (err: any) {
      console.error('Compliance check error:', err);
      setError(err.message || 'Failed to check compliance');
    } finally {
      setLoading(false);
    }
  };

  const handleCommodityChange = (commodityId: string) => {
    const selected = commodities.find(c => c.id === commodityId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        commodity_id: commodityId,
        commodity_name: selected.nama_komoditas,
        hs_code: selected.hs_code
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allowed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'conditional': return <Clock className="h-5 w-5 text-amber-600" />;
      case 'prohibited': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'review_required': return <Eye className="h-5 w-5 text-purple-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allowed': return 'bg-green-100 text-green-800 border-green-200';
      case 'conditional': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'prohibited': return 'bg-red-100 text-red-800 border-red-200';
      case 'review_required': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very_low': return 'text-green-600';
      case 'low': return 'text-green-500';
      case 'medium': return 'text-amber-600';
      case 'high': return 'text-red-500';
      case 'very_high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Compliance Checker</h2>
          <p className="text-sm text-gray-600">Periksa kelayakan ekspor komoditas tambang</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commodity Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Komoditas *
            </label>
            <select
              value={formData.commodity_id}
              onChange={(e) => handleCommodityChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Komoditas</option>
              {commodities.map(commodity => (
                <option key={commodity.id} value={commodity.id}>
                  {commodity.nama_komoditas} ({commodity.hs_code})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negara Tujuan *
            </label>
            <select
              value={formData.destination_country}
              onChange={(e) => setFormData(prev => ({ ...prev, destination_country: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Negara</option>
              <option value="CHINA">China</option>
              <option value="INDIA">India</option>
              <option value="JAPAN">Japan</option>
              <option value="SOUTH_KOREA">South Korea</option>
              <option value="SINGAPORE">Singapore</option>
              <option value="MALAYSIA">Malaysia</option>
              <option value="PHILIPPINES">Philippines</option>
              <option value="THAILAND">Thailand</option>
              <option value="VIETNAM">Vietnam</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                required
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MT">MT</option>
                <option value="KG">KG</option>
                <option value="TON">TON</option>
              </select>
            </div>
          </div>

          {/* Transaction Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nilai Transaksi
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.transaction_value}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_value: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="EUR">EUR</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
          </div>

          {/* Buyer Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Buyer
            </label>
            <input
              type="text"
              value={formData.buyer_name}
              onChange={(e) => setFormData(prev => ({ ...prev, buyer_name: e.target.value }))}
              placeholder="Nama perusahaan buyer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* New Buyer Checkbox */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_new_buyer}
                onChange={(e) => setFormData(prev => ({ ...prev, is_new_buyer: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Buyer baru (belum pernah transaksi)</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Checking...' : 'Check Compliance'}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          {/* Status Header */}
          <div className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <h3 className="font-semibold">Status: {result.status.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-sm opacity-90">{result.compliance_summary}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Risk Score</div>
                <div className={`text-lg font-bold ${getRiskColor(result.risk_level)}`}>
                  {result.risk_score.toFixed(1)}/10
                </div>
                <div className="text-xs capitalize">{result.risk_level.replace('_', ' ')}</div>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          {result.required_documents.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Dokumen Diperlukan</h4>
              </div>
              <ul className="space-y-1">
                {result.required_documents.map((doc, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Restrictions */}
          {result.restrictions.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-900">Pembatasan</h4>
              </div>
              <ul className="space-y-1">
                {result.restrictions.map((restriction, index) => (
                  <li key={index} className="text-sm text-red-800">
                    • {restriction}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-900">Rekomendasi</h4>
              </div>
              <ul className="space-y-1">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-green-800">
                    • {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estimated Costs */}
          {result.estimated_costs && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Estimasi Biaya</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Pajak</div>
                  <div className="font-medium">{result.estimated_costs.taxes.toLocaleString()} {result.estimated_costs.currency}</div>
                </div>
                <div>
                  <div className="text-gray-600">Fees</div>
                  <div className="font-medium">{result.estimated_costs.fees.toLocaleString()} {result.estimated_costs.currency}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total</div>
                  <div className="font-bold text-lg">{result.estimated_costs.total.toLocaleString()} {result.estimated_costs.currency}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {/* Generate report */}}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
            <button
              onClick={() => {/* Save to database */}}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText className="h-4 w-4" />
              Save Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

