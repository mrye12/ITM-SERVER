// itm-trading/src/app/(protected)/compliance/page.tsx
'use client';

import React, { useState } from 'react';
import ComplianceChecker from '@/components/compliance/ComplianceChecker';
import { 
  Shield, 
  FileText, 
  TrendingUp, 
  BarChart3,
  CheckCircle,
  Zap,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  compliance: {
    total_checks: number;
    allowed: number;
    conditional: number;
    prohibited: number;
    review_required: number;
  };
  documents: {
    total: number;
    valid: number;
    pending_review: number;
    invalid: number;
  };
  risk: {
    average_score: number;
    high_risk_transactions: number;
    compliance_issues: number;
  };
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('checker');
  const [stats] = useState<DashboardStats>({
    compliance: {
      total_checks: 156,
      allowed: 89,
      conditional: 45,
      prohibited: 12,
      review_required: 10
    },
    documents: {
      total: 324,
      valid: 267,
      pending_review: 42,
      invalid: 15
    },
    risk: {
      average_score: 3.2,
      high_risk_transactions: 8,
      compliance_issues: 3
    }
  });

  const tabs = [
    { id: 'checker', label: 'Compliance Checker', icon: Shield },
    { id: 'overview', label: 'Overview', icon: BarChart3 }
  ];

  const getComplianceRate = () => {
    const total = stats.compliance.total_checks;
    const allowed = stats.compliance.allowed;
    return total > 0 ? (allowed / total * 100) : 0;
  };

  const getDocumentValidationRate = () => {
    const total = stats.documents.total;
    const valid = stats.documents.valid;
    return total > 0 ? (valid / total * 100) : 0;
  };

  const getRiskLevel = (score: number) => {
    if (score <= 2) return { level: 'Low', color: 'text-green-600' };
    if (score <= 4) return { level: 'Medium', color: 'text-amber-600' };
    if (score <= 6) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Critical', color: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ITM Trading • Compliance Center
              </h1>
              <p className="text-lg text-gray-600">
                AI-Powered Export/Import Compliance Management
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">System Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">AI Online</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Compliance Rate */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Today</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
              Compliance Rate
            </h3>
            <p className="text-2xl font-bold text-gray-900">{getComplianceRate().toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.compliance.allowed} of {stats.compliance.total_checks} passed
            </p>
          </div>

          {/* Document Validation */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
              Documents Valid
            </h3>
            <p className="text-2xl font-bold text-gray-900">{getDocumentValidationRate().toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.documents.valid} valid documents
            </p>
          </div>

          {/* Risk Score */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs text-gray-500">Average</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
              Risk Score
            </h3>
            <p className="text-2xl font-bold text-gray-900">{stats.risk.average_score}/10</p>
            <p className={`text-xs mt-1 ${getRiskLevel(stats.risk.average_score).color}`}>
              {getRiskLevel(stats.risk.average_score).level} Risk
            </p>
          </div>

          {/* Active Checks */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">This Month</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
              Total Checks
            </h3>
            <p className="text-2xl font-bold text-gray-900">{stats.compliance.total_checks}</p>
            <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'checker' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <ComplianceChecker />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Status */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Compliance Engine</span>
                  </div>
                  <p className="text-sm text-green-700">AI model operational</p>
                  <p className="text-xs text-green-600 mt-1">Last check: 2 minutes ago</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Document Processing</span>
                  </div>
                  <p className="text-sm text-blue-700">OCR & validation active</p>
                  <p className="text-xs text-blue-600 mt-1">Queue: 3 documents</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Risk Analysis</span>
                  </div>
                  <p className="text-sm text-purple-700">Real-time monitoring</p>
                  <p className="text-xs text-purple-600 mt-1">8 high-risk flagged</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Compliance Checks</h3>
              <div className="space-y-3">
                {[
                  { commodity: 'Ferro Nickel', destination: 'China', status: 'allowed', time: '10 mins ago', risk: 2.1 },
                  { commodity: 'Coal Thermal', destination: 'India', status: 'conditional', time: '25 mins ago', risk: 3.5 },
                  { commodity: 'Nickel Ore', destination: 'Japan', status: 'prohibited', time: '1 hour ago', risk: 10.0 },
                  { commodity: 'Tin Ingot', destination: 'Singapore', status: 'allowed', time: '2 hours ago', risk: 4.0 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'allowed' ? 'bg-green-500' :
                        item.status === 'conditional' ? 'bg-amber-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{item.commodity} → {item.destination}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {item.status} • Risk: {item.risk}/10
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>ITM Trading Compliance Center • Powered by AI & Advanced Analytics</p>
        </div>
      </div>
    </div>
  );
}

