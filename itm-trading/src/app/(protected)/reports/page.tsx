"use client"
import { useState, useEffect } from "react"
import { supabaseBrowser } from "@/lib/supabase/client"

interface ReportData {
  fuel: {
    totalVolume: number
    totalCost: number
    weeklyVolume: number
    weeklyCost: number
    transactions: number
  }
  shipments: {
    active: number
    completed: number
    onTransit: number
    totalValue: number
  }
  equipment: {
    active: number
    maintenance: number
    broken: number
    totalValue: number
    maintenanceAlerts: number
  }
  expenses: {
    total: number
    paid: number
    pending: number
    approved: number
    transactions: number
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const supabase = supabaseBrowser()
      
      // Calculate date range based on selected period
      const now = new Date()
      let startDate: Date
      
      switch (selectedPeriod) {
        case 'daily':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch fuel data
      const { data: fuelData } = await supabase
        .from('fuel_entries')
        .select('volume, total_cost, date')
        .gte('date', startDate.toISOString().split('T')[0])

      // Fetch shipments data
      const { data: shipmentsData } = await supabase
        .from('shipments')
        .select('status, quantity, created_at')

      // Fetch equipment data
      const { data: equipmentData } = await supabase
        .from('equipments')
        .select('status, purchase_cost, next_maintenance')

      // Fetch expenses data
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, status, date')
        .gte('date', startDate.toISOString().split('T')[0])

      // Process fuel data
      const fuelStats = {
        totalVolume: fuelData?.reduce((sum, item) => sum + (item.volume || 0), 0) || 0,
        totalCost: fuelData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0,
        weeklyVolume: fuelData?.reduce((sum, item) => sum + (item.volume || 0), 0) || 0,
        weeklyCost: fuelData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0,
        transactions: fuelData?.length || 0
      }

      // Process shipments data
      const shipmentStats = {
        active: shipmentsData?.filter(s => ['booked', 'loading', 'on_shipment'].includes(s.status)).length || 0,
        completed: shipmentsData?.filter(s => s.status === 'completed').length || 0,
        onTransit: shipmentsData?.filter(s => s.status === 'on_shipment').length || 0,
        totalValue: shipmentsData?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0
      }

      // Process equipment data
      const equipmentStats = {
        active: equipmentData?.filter(e => e.status === 'active').length || 0,
        maintenance: equipmentData?.filter(e => e.status === 'maintenance').length || 0,
        broken: equipmentData?.filter(e => e.status === 'broken').length || 0,
        totalValue: equipmentData?.reduce((sum, e) => sum + (e.purchase_cost || 0), 0) || 0,
        maintenanceAlerts: equipmentData?.filter(e => {
          if (!e.next_maintenance) return false
          const nextMaintenance = new Date(e.next_maintenance)
          const today = new Date()
          const daysUntil = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntil <= 7 && daysUntil >= 0
        }).length || 0
      }

      // Process expenses data
      const expenseStats = {
        total: expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        paid: expensesData?.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        pending: expensesData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        approved: expensesData?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        transactions: expensesData?.length || 0
      }

      setReportData({
        fuel: fuelStats,
        shipments: shipmentStats,
        equipment: equipmentStats,
        expenses: expenseStats
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDFReport = async () => {
    setIsGeneratingReport(true)
    try {
      if (!reportData) return

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const periodLabel = selectedPeriod === 'daily' ? 'Harian' : selectedPeriod === 'weekly' ? 'Mingguan' : 'Bulanan'
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Laporan ${periodLabel} - PT. Infinity Trade Mineral</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                .company-logo { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
                .report-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                .report-period { color: #666; margin-bottom: 5px; }
                .section { margin-bottom: 30px; page-break-inside: avoid; }
                .section-title { font-size: 18px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                .stat-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
                .stat-label { font-size: 12px; color: #666; margin-bottom: 5px; }
                .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
                .stat-unit { font-size: 14px; color: #666; }
                .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .summary-table th, .summary-table td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                .summary-table th { background-color: #f9fafb; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #666; }
                .alert-box { background-color: #fef3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
                .alert-title { font-weight: bold; color: #92400e; margin-bottom: 5px; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="company-logo">PT. INFINITY TRADE MINERAL</div>
                <div class="report-title">LAPORAN OPERASIONAL ${periodLabel.toUpperCase()}</div>
                <div class="report-period">Periode: ${new Date().toLocaleDateString('id-ID')}</div>
                <div class="report-period">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</div>
              </div>

              <!-- Fuel Management Section -->
              <div class="section">
                <div class="section-title">⛽ FUEL MANAGEMENT</div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">Total Volume</div>
                    <div class="stat-value">${reportData.fuel.totalVolume.toLocaleString()} <span class="stat-unit">Liter</span></div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Total Biaya</div>
                    <div class="stat-value">Rp ${reportData.fuel.totalCost.toLocaleString()}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Jumlah Transaksi</div>
                    <div class="stat-value">${reportData.fuel.transactions}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Rata-rata per Liter</div>
                    <div class="stat-value">Rp ${reportData.fuel.totalVolume > 0 ? Math.round(reportData.fuel.totalCost / reportData.fuel.totalVolume).toLocaleString() : '0'}</div>
                  </div>
                </div>
              </div>

              <!-- Shipment Management Section -->
              <div class="section">
                <div class="section-title">🚢 SHIPMENT MANAGEMENT</div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">Shipment Aktif</div>
                    <div class="stat-value">${reportData.shipments.active}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Selesai</div>
                    <div class="stat-value">${reportData.shipments.completed}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Dalam Perjalanan</div>
                    <div class="stat-value">${reportData.shipments.onTransit}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Total Kuantitas</div>
                    <div class="stat-value">${reportData.shipments.totalValue.toLocaleString()} <span class="stat-unit">MT</span></div>
                  </div>
                </div>
              </div>

              <!-- Equipment Management Section -->
              <div class="section">
                <div class="section-title">🔧 EQUIPMENT MANAGEMENT</div>
                ${reportData.equipment.maintenanceAlerts > 0 ? `
                <div class="alert-box">
                  <div class="alert-title">⚠️ PERINGATAN MAINTENANCE</div>
                  <div>${reportData.equipment.maintenanceAlerts} equipment memerlukan maintenance dalam 7 hari ke depan</div>
                </div>
                ` : ''}
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">Equipment Aktif</div>
                    <div class="stat-value">${reportData.equipment.active}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Dalam Maintenance</div>
                    <div class="stat-value">${reportData.equipment.maintenance}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Rusak</div>
                    <div class="stat-value">${reportData.equipment.broken}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Total Nilai Aset</div>
                    <div class="stat-value">Rp ${(reportData.equipment.totalValue / 1000000).toFixed(1)} <span class="stat-unit">M</span></div>
                  </div>
                </div>
              </div>

              <!-- Finance & Expense Section -->
              <div class="section">
                <div class="section-title">💰 FINANCE & EXPENSE</div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">Total Pengeluaran</div>
                    <div class="stat-value">Rp ${(reportData.expenses.total / 1000000).toFixed(1)} <span class="stat-unit">M</span></div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Sudah Dibayar</div>
                    <div class="stat-value">Rp ${(reportData.expenses.paid / 1000000).toFixed(1)} <span class="stat-unit">M</span></div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Pending Approval</div>
                    <div class="stat-value">Rp ${(reportData.expenses.pending / 1000000).toFixed(1)} <span class="stat-unit">M</span></div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">Jumlah Transaksi</div>
                    <div class="stat-value">${reportData.expenses.transactions}</div>
                  </div>
                </div>
              </div>

              <!-- Summary Table -->
              <div class="section">
                <div class="section-title">📊 RINGKASAN EKSEKUTIF</div>
                <table class="summary-table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Metrik Utama</th>
                      <th>Nilai</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Fuel Management</td>
                      <td>Total Biaya Fuel</td>
                      <td>Rp ${reportData.fuel.totalCost.toLocaleString()}</td>
                      <td>${reportData.fuel.transactions > 0 ? 'Aktif' : 'Tidak Ada Transaksi'}</td>
                    </tr>
                    <tr>
                      <td>Shipment</td>
                      <td>Shipment Aktif</td>
                      <td>${reportData.shipments.active} unit</td>
                      <td>${reportData.shipments.active > 0 ? 'Operasional' : 'Standby'}</td>
                    </tr>
                    <tr>
                      <td>Equipment</td>
                      <td>Equipment Siap Pakai</td>
                      <td>${reportData.equipment.active} unit</td>
                      <td>${reportData.equipment.broken > 0 ? 'Perlu Perhatian' : 'Baik'}</td>
                    </tr>
                    <tr>
                      <td>Finance</td>
                      <td>Total Pengeluaran</td>
                      <td>Rp ${reportData.expenses.total.toLocaleString()}</td>
                      <td>${reportData.expenses.pending > 0 ? 'Ada Pending' : 'Terkendali'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="footer">
                <p><strong>PT. Infinity Trade Mineral</strong></p>
                <p>Laporan ini digenerate otomatis oleh sistem ITM Trading Management</p>
                <p>Untuk informasi lebih lanjut, hubungi admin@infinitytrademineral.id</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Error generating PDF report:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const sendEmailReport = async () => {
    try {
      // This would typically call an API endpoint to send email
      // For now, we'll just show an alert
      alert('Fitur email report akan segera tersedia. Report telah di-generate untuk di-print.')
      generatePDFReport()
    } catch (error) {
      console.error('Error sending email report:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laporan Operasional</h1>
            <p className="text-gray-600">Generate dan kelola laporan perusahaan</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Periode Laporan:</span>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: 'Harian' },
                { value: 'weekly', label: 'Mingguan' },
                { value: 'monthly', label: 'Bulanan' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={generatePDFReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isGeneratingReport ? 'Generating...' : 'Download PDF'}
            </button>
            
            <button
              onClick={sendEmailReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Report
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 rounded-lg p-2">
                  <span className="text-xl">⛽</span>
                </div>
                <span className="text-sm font-medium">Fuel</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                Rp {(reportData.fuel.totalCost / 1000000).toFixed(1)}M
              </div>
              <div className="text-orange-100 text-sm">
                {reportData.fuel.totalVolume.toLocaleString()} Liter
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 rounded-lg p-2">
                  <span className="text-xl">🚢</span>
                </div>
                <span className="text-sm font-medium">Shipments</span>
              </div>
              <div className="text-2xl font-bold mb-1">{reportData.shipments.active}</div>
              <div className="text-blue-100 text-sm">
                {reportData.shipments.onTransit} On Transit
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 rounded-lg p-2">
                  <span className="text-xl">🔧</span>
                </div>
                <span className="text-sm font-medium">Equipment</span>
              </div>
              <div className="text-2xl font-bold mb-1">{reportData.equipment.active}</div>
              <div className="text-purple-100 text-sm">
                {reportData.equipment.maintenanceAlerts} Need Maintenance
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 rounded-lg p-2">
                  <span className="text-xl">💰</span>
                </div>
                <span className="text-sm font-medium">Expenses</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                Rp {(reportData.expenses.total / 1000000).toFixed(1)}M
              </div>
              <div className="text-green-100 text-sm">
                {reportData.expenses.transactions} Transaksi
              </div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fuel Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600">⛽</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Fuel Management</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Volume</span>
                  <span className="font-semibold">{reportData.fuel.totalVolume.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Biaya</span>
                  <span className="font-semibold">Rp {reportData.fuel.totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Jumlah Transaksi</span>
                  <span className="font-semibold">{reportData.fuel.transactions}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Rata-rata/Liter</span>
                  <span className="font-semibold">
                    Rp {reportData.fuel.totalVolume > 0 ? Math.round(reportData.fuel.totalCost / reportData.fuel.totalVolume).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600">🚢</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Shipment Status</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Shipment Aktif</span>
                  <span className="font-semibold text-blue-600">{reportData.shipments.active}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Dalam Perjalanan</span>
                  <span className="font-semibold text-purple-600">{reportData.shipments.onTransit}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Selesai</span>
                  <span className="font-semibold text-green-600">{reportData.shipments.completed}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Total Kuantitas</span>
                  <span className="font-semibold">{reportData.shipments.totalValue.toLocaleString()} MT</span>
                </div>
              </div>
            </div>

            {/* Equipment Management */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600">🔧</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Equipment Status</h3>
              </div>
              
              {reportData.equipment.maintenanceAlerts > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-sm font-medium text-yellow-800">
                      {reportData.equipment.maintenanceAlerts} equipment perlu maintenance
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Equipment Aktif</span>
                  <span className="font-semibold text-green-600">{reportData.equipment.active}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Dalam Maintenance</span>
                  <span className="font-semibold text-yellow-600">{reportData.equipment.maintenance}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Rusak</span>
                  <span className="font-semibold text-red-600">{reportData.equipment.broken}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Total Nilai Aset</span>
                  <span className="font-semibold">Rp {(reportData.equipment.totalValue / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            {/* Finance & Expenses */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600">💰</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Finance Overview</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Pengeluaran</span>
                  <span className="font-semibold">Rp {(reportData.expenses.total / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Sudah Dibayar</span>
                  <span className="font-semibold text-green-600">Rp {(reportData.expenses.paid / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Pending Approval</span>
                  <span className="font-semibold text-yellow-600">Rp {(reportData.expenses.pending / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Jumlah Transaksi</span>
                  <span className="font-semibold">{reportData.expenses.transactions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Report Schedule Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-blue-900">Jadwal Laporan Otomatis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold text-blue-900 mb-2">📅 Laporan Harian</div>
                <div className="text-blue-700">Dikirim setiap hari jam 08:00 WIB ke email admin@infinitytrademineral.id</div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold text-blue-900 mb-2">📊 Laporan Mingguan</div>
                <div className="text-blue-700">Dikirim setiap Jumat jam 17:00 WIB dengan summary operasional minggu tersebut</div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold text-blue-900 mb-2">📈 Laporan Bulanan</div>
                <div className="text-blue-700">Dikirim setiap tanggal 1 jam 09:00 WIB dengan analisis komprehensif</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


