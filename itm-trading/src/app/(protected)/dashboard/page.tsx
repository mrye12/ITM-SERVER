import { requireRole, getUserProfile } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'
import NickelPriceWidget from '@/components/dashboard/NickelPriceWidget'

export default async function DashboardPage() {
  const gate = await requireRole(['admin','staff','viewer'])
  if (!gate.ok) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-800">Access Denied</h1>
          <p className="text-red-600 mt-2">Your role: {gate.role ?? 'unknown'} is not authorized for this page.</p>
        </div>
      </div>
    )
  }

  const profile = await getUserProfile()
  const admin = supabaseAdmin()

  // Get dashboard stats based on role
  const { data: customers } = await admin.from('customers').select('id').limit(1000)
  const { data: salesOrders } = await admin.from('sales_orders').select('id, total_usd').limit(1000) 
  const { data: basicSales } = await admin.from('sales').select('*').order('created_at', { ascending: false }).limit(10)

  // Get activity logs (admin only)
  const { data: recentActivity } = gate.role === 'admin' 
    ? await admin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10)
    : { data: null }

  // Calculate statistics
  const totalCustomers = customers?.length || 0
  const totalOrders = salesOrders?.length || 0
  const totalRevenue = salesOrders?.reduce((sum, order) => sum + (order.total_usd || 0), 0) || 0
  const basicSalesCount = basicSales?.length || 0
  const basicRevenue = basicSales?.reduce((sum: number, sale: any) => sum + (sale.quantity * sale.price), 0) || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name || 'User'}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <div className="text-sm font-medium text-blue-800">
            {/* @ts-ignore */}
            Role: {profile?.roles?.name || 'N/A'}
          </div>
          <div className="text-xs text-blue-600">
            {/* @ts-ignore */}
            Access Level: {profile?.roles?.code || 'unknown'}
          </div>
        </div>
      </div>

      {/* TAHAP 4 Status */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black border border-yellow-500/30 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <h2 className="text-xl font-semibold text-yellow-400">TAHAP 4: Dashboard Internal PT. Infinity Trade Mineral</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">⛽</div>
            <div className="text-sm font-medium text-yellow-200">Fuel Management</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🚢</div>
            <div className="text-sm font-medium text-yellow-200">Shipment Tracking</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔧</div>
            <div className="text-sm font-medium text-yellow-200">Equipment Monitor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm font-medium text-yellow-200">Finance & Expense</div>
          </div>
        </div>
      </div>

      {/* Nickel Price Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <NickelPriceWidget />
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border border-amber-200 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">📈</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Trading Insights</h3>
              <p className="text-sm text-gray-600">Market Analysis</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
              <p className="text-sm font-medium text-gray-700">Market Sentiment</p>
              <p className="text-lg font-bold text-green-700">Bullish</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
              <p className="text-sm font-medium text-gray-700">Recommended Action</p>
              <p className="text-sm text-gray-900">Monitor for buying opportunities</p>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
              <p className="text-sm font-medium text-gray-700">Key Support Level</p>
              <p className="text-lg font-bold text-blue-700">$17,800/MT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Professional Customers</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">{totalCustomers}</p>
              <div className="flex items-center mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: `${Math.min((totalCustomers / 50) * 100, 100)}%`}}></div>
                </div>
              </div>
            </div>
            <div className="bg-blue-600 rounded-full p-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Sales Orders</p>
              <p className="text-4xl font-bold text-green-900 mt-2">{totalOrders}</p>
              <div className="flex items-center mt-2">
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: `${Math.min((totalOrders / 100) * 100, 100)}%`}}></div>
                </div>
              </div>
            </div>
            <div className="bg-green-600 rounded-full p-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl border border-yellow-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Professional Revenue</p>
              <p className="text-4xl font-bold text-yellow-900 mt-2">
                ${totalRevenue.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{width: `${Math.min((totalRevenue / 1000000) * 100, 100)}%`}}></div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-600 rounded-full p-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Basic Sales</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">{basicSalesCount}</p>
              <p className="text-sm text-purple-600 font-medium">${basicRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: `${Math.min((basicSalesCount / 20) * 100, 100)}%`}}></div>
                </div>
              </div>
            </div>
            <div className="bg-purple-600 rounded-full p-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity (Admin Only) */}
      {gate.role === 'admin' && recentActivity && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border border-gray-200 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity (Admin View)</h2>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity: any) => (
                <div key={activity.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.action === 'login' ? 'bg-green-100' :
                        activity.action === 'logout' ? 'bg-red-100' :
                        activity.action === 'insert' ? 'bg-blue-100' :
                        activity.action === 'update' ? 'bg-yellow-100' :
                        activity.action === 'delete' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          activity.action === 'login' ? 'bg-green-500' :
                          activity.action === 'logout' ? 'bg-red-500' :
                          activity.action === 'insert' ? 'bg-blue-500' :
                          activity.action === 'update' ? 'bg-yellow-500' :
                          activity.action === 'delete' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.actor_email} 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            activity.action === 'login' ? 'bg-green-100 text-green-800' :
                            activity.action === 'logout' ? 'bg-red-100 text-red-800' :
                            activity.action === 'insert' ? 'bg-blue-100 text-blue-800' :
                            activity.action === 'update' ? 'bg-yellow-100 text-yellow-800' :
                            activity.action === 'delete' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.action}
                          </span>
                          <span className="ml-2 text-gray-600">
                            {activity.target_table}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-1">
                      <span className="text-xs font-mono text-gray-600">
                        {activity.target_id?.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      )}

      {/* Role-based Quick Actions */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Pure Trading Modules */}
          <a href="/purchase" className="group flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:from-blue-600 group-hover:to-cyan-600 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">🛒</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Purchase from IUP</span>
          </a>

          <a href="/smelter-sales" className="group flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 group-hover:from-orange-600 group-hover:to-red-600 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">🏭</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">Sales to Smelter</span>
          </a>

          <a href="/nickel" className="group flex flex-col items-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 group-hover:from-emerald-600 group-hover:to-green-600 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">📈</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-600">Nickel Price Monitor</span>
          </a>

          {/* TAHAP 4 Modules */}
          <a href="/fuel" className="group flex flex-col items-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-500 group-hover:from-amber-600 group-hover:to-yellow-600 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">⛽</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-600">Fuel Management</span>
          </a>

          <a href="/shipment" className="group flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">🚢</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Shipment Tracking</span>
          </a>

          <a href="/equipment" className="group flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 group-hover:from-purple-600 group-hover:to-purple-700 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">🔧</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600">Equipment</span>
          </a>

          <a href="/finance" className="group flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-green-500 to-green-600 group-hover:from-green-600 group-hover:to-green-700 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">💰</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600">Finance</span>
          </a>

          <a href="/reports" className="group flex flex-col items-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:from-indigo-600 group-hover:to-purple-700 rounded-full p-4 mb-3 transition-all duration-300 shadow-lg">
              <span className="text-white text-xl">📊</span>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">Reports</span>
          </a>

          {/* Legacy & Other Modules */}
          <a href="/orders" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-blue-100 group-hover:bg-blue-600 rounded-full p-4 mb-3 transition-colors duration-300">
              <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Sales Orders</span>
          </a>

          <a href="/files" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-green-100 group-hover:bg-green-600 rounded-full p-4 mb-3 transition-colors duration-300">
              <svg className="w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-8 5v-1a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600">File Manager</span>
          </a>

          {(gate.role === 'admin' || gate.role === 'staff') && (
            <a href="/admin" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-purple-100 group-hover:bg-purple-600 rounded-full p-4 mb-3 transition-colors duration-300">
                <svg className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600">Admin Panel</span>
            </a>
          )}

          <a href="/sales" className="group flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-orange-100 group-hover:bg-orange-600 rounded-full p-4 mb-3 transition-colors duration-300">
              <svg className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">Basic Sales</span>
          </a>
        </div>
      </div>
    </div>
  )
}
