import Link from 'next/link';
import { 
  Shield, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Package,
  CheckCircle,
  Zap,
  ArrowRight,
  Sparkles,
  Building2,
  BarChart3
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            TAHAP 7 - COMPREHENSIVE SYSTEM
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            ITM Trading
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Enterprise System
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Comprehensive trading system untuk komoditas tambang dengan AI compliance engine, 
            smart document management, dan real-time business intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/compliance">
              <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Shield className="h-5 w-5" />
                Compliance Center
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg border border-gray-200 transition-all">
                <BarChart3 className="h-5 w-5" />
                Main Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Shield,
              title: "AI Compliance Engine",
              description: "Automatic export/import compliance checking dengan real-time regulatory analysis",
              color: "text-blue-600"
            },
            {
              icon: FileText,
              title: "Smart Document Management",
              description: "OCR-enabled document processing dengan AI validation dan categorization",
              color: "text-green-600"
            },
            {
              icon: TrendingUp,
              title: "Business Intelligence",
              description: "Advanced analytics, risk scoring, dan predictive insights untuk trading decisions",
              color: "text-purple-600"
            }
          ].map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <div className="p-3 bg-gray-50 rounded-xl w-fit">
                    <IconComponent className={`h-6 w-6 ${feature.color}`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* System Modules */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Integrated Business Modules
            </h2>
            <p className="text-gray-600">
              All modules fully integrated with AI compliance and real-time monitoring
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Compliance & Export", icon: Shield, status: "AI-Enhanced" },
              { name: "Finance & Currency", icon: DollarSign, status: "Multi-Currency" },
              { name: "Document Management", icon: FileText, status: "AI-Validated" },
              { name: "Logistics & Shipment", icon: Truck, status: "Real-time Tracking" },
              { name: "Equipment & Fuel", icon: Package, status: "IoT Monitoring" },
              { name: "Analytics & Reports", icon: BarChart3, status: "Advanced Insights" }
            ].map((module, index) => {
              const IconComponent = module.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <IconComponent className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{module.name}</h4>
                    <p className="text-xs text-gray-600">{module.status}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Access
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/compliance" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Compliance Center
            </Link>
            <Link href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Main Dashboard
            </Link>
            <Link href="/finance" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Finance Module
            </Link>
            <Link href="/equipment" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
              Equipment Monitor
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>ITM Trading Enterprise System • TAHAP 7 Complete Integration</p>
          <p className="mt-1">Powered by Next.js 15.5.0 • Supabase • Hugging Face AI</p>
        </div>
      </div>
    </div>
  );
}

