"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface Expense {
  id: string
  date: string
  category: string
  subcategory?: string
  description: string
  amount: number
  payment_method: string
  vendor?: string
  receipt_number?: string
  notes?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
  created_by: string
}

interface ExpenseForm {
  date: string
  category: string
  subcategory?: string
  description: string
  amount: number
  payment_method: string
  vendor?: string
  receipt_number?: string
  notes?: string
}

const categories = [
  { value: 'fuel', label: 'Fuel & Energy', subcategories: ['Diesel', 'Gasoline', 'Electricity', 'Generator'] },
  { value: 'equipment', label: 'Equipment & Machinery', subcategories: ['Purchase', 'Maintenance', 'Repair', 'Spare Parts'] },
  { value: 'shipment', label: 'Shipping & Logistics', subcategories: ['Freight', 'Port Charges', 'Insurance', 'Documentation'] },
  { value: 'operational', label: 'Operational', subcategories: ['Office Supplies', 'Communication', 'Utilities', 'Rent'] },
  { value: 'hr', label: 'Human Resources', subcategories: ['Salaries', 'Benefits', 'Training', 'Recruitment'] },
  { value: 'marketing', label: 'Marketing & Sales', subcategories: ['Advertising', 'Travel', 'Entertainment', 'Commissions'] },
  { value: 'legal', label: 'Legal & Compliance', subcategories: ['Legal Fees', 'Permits', 'Licenses', 'Audit'] },
  { value: 'other', label: 'Other', subcategories: ['Miscellaneous', 'Emergency', 'Contingency'] }
]

const paymentMethods = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Check',
  'Digital Wallet'
]

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  { value: 'approved', label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800', icon: '💰' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: '❌' }
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb']

export default function FinanceExpensePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  })

  const watchedCategory = watch('category')

  // Update subcategories when category changes
  useEffect(() => {
    const category = categories.find(c => c.value === watchedCategory)
    setSelectedSubcategories(category?.subcategories || [])
    setValue('subcategory', '') // Reset subcategory
  }, [watchedCategory, setValue])

  const { 
    data: expenses, 
    loading, 
    insert, 
    update,
    remove 
  } = useRealtimeTable<Expense>({
    table: 'expenses',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  })

  const onSubmit = async (data: ExpenseForm) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const result = await insert({
        ...data,
        status: 'pending' as const,
        created_by: user.id
      })

      if (result.error) throw result.error
      
      reset({
        date: new Date().toISOString().split('T')[0],
        category: '',
        subcategory: '',
        description: '',
        amount: 0,
        payment_method: '',
        vendor: '',
        receipt_number: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error adding expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateExpenseStatus = async (expenseId: string, newStatus: string) => {
    try {
      const result = await update(expenseId, { status: newStatus as 'pending' | 'approved' | 'paid' | 'rejected' })
      if (result.error) throw result.error
    } catch (error) {
      console.error('Error updating expense status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data expense ini?')) {
      await remove(id)
    }
  }

  // Filter expenses based on period
  const getFilteredExpenses = () => {
    const now = new Date()
    let startDate: Date

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        return expenses
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const statusMatch = filterStatus === 'all' || expense.status === filterStatus
      return expenseDate >= startDate && statusMatch
    })
  }

  const filteredExpenses = getFilteredExpenses()

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const paidExpenses = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)

  // Category breakdown
  const categoryBreakdown = categories.map(category => {
    const categoryExpenses = filteredExpenses.filter(e => e.category === category.value)
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      name: category.label,
      value: total,
      count: categoryExpenses.length
    }
  }).filter(item => item.value > 0)

  // Monthly trend data (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === date.getMonth() && 
             expenseDate.getFullYear() === date.getFullYear()
    })
    
    return {
      month: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      amount: monthExpenses.reduce((sum, e) => sum + e.amount, 0) / 1000000, // in millions
      count: monthExpenses.length
    }
  }).reverse()



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">💰</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance & Expense Management</h1>
            <p className="text-gray-600">Kelola pengeluaran dan keuangan perusahaan</p>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Periode:</span>
          <div className="flex gap-2">
            {[
              { value: 'week', label: '7 Hari' },
              { value: 'month', label: '30 Hari' },
              { value: 'quarter', label: '3 Bulan' },
              { value: 'year', label: '1 Tahun' },
              { value: 'all', label: 'Semua' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ml-4"
          >
            <option value="all">Semua Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="text-sm font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            Rp {(totalExpenses / 1000000).toFixed(1)}M
          </div>
          <div className="text-blue-100 text-sm">Total Pengeluaran</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Paid</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            Rp {(paidExpenses / 1000000).toFixed(1)}M
          </div>
          <div className="text-green-100 text-sm">Sudah Dibayar</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Pending</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            Rp {(pendingExpenses / 1000000).toFixed(1)}M
          </div>
          <div className="text-yellow-100 text-sm">Menunggu Approval</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Transaksi</span>
          </div>
          <div className="text-2xl font-bold mb-1">{filteredExpenses.length}</div>
          <div className="text-purple-100 text-sm">Total Transaksi</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Trend Pengeluaran (6 Bulan)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`Rp ${Number(value).toFixed(1)}M`, 'Pengeluaran']} />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Breakdown per Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tambah Expense Baru</h2>
            
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Tanggal wajib diisi' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  {...register('category', { required: 'Kategori wajib dipilih' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              {selectedSubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub-kategori
                  </label>
                  <select
                    {...register('subcategory')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Pilih sub-kategori</option>
                    {selectedSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <input
                  type="text"
                  {...register('description', { required: 'Deskripsi wajib diisi' })}
                  placeholder="Deskripsi pengeluaran"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { 
                    required: 'Jumlah wajib diisi',
                    min: { value: 0.01, message: 'Jumlah minimal Rp 0.01' }
                  })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  {...register('payment_method', { required: 'Metode pembayaran wajib dipilih' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Pilih metode pembayaran</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mt-1">{errors.payment_method.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Supplier
                </label>
                <input
                  type="text"
                  {...register('vendor')}
                  placeholder="Nama vendor/supplier"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Kwitansi/Invoice
                </label>
                <input
                  type="text"
                  {...register('receipt_number')}
                  placeholder="Nomor kwitansi/invoice"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Menyimpan...' : 'Tambah Expense'}
              </button>
            </form>
          </div>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Daftar Pengeluaran</h2>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => {
                  const status = statusOptions.find(s => s.value === expense.status)
                  const category = categories.find(c => c.value === expense.category)
                  
                  return (
                    <div key={expense.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{status?.icon}</div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{expense.description}</h3>
                            <p className="text-sm text-gray-600">{category?.label}</p>
                            {expense.subcategory && (
                              <p className="text-xs text-gray-500">{expense.subcategory}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              Rp {expense.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(expense.date).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                            {status?.label}
                          </span>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Payment Method:</span>
                          <div className="font-medium">{expense.payment_method}</div>
                        </div>
                        {expense.vendor && (
                          <div>
                            <span className="text-gray-500">Vendor:</span>
                            <div className="font-medium">{expense.vendor}</div>
                          </div>
                        )}
                        {expense.receipt_number && (
                          <div>
                            <span className="text-gray-500">Receipt:</span>
                            <div className="font-medium">{expense.receipt_number}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="font-medium">{status?.label}</div>
                        </div>
                      </div>

                      {expense.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-gray-500 text-sm">Catatan: </span>
                          <span className="text-sm">{expense.notes}</span>
                        </div>
                      )}

                      {/* Status Actions (for admin/manager) */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          {statusOptions.map(statusOption => (
                            <button
                              key={statusOption.value}
                              onClick={() => updateExpenseStatus(expense.id, statusOption.value)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                expense.status === statusOption.value
                                  ? statusOption.color
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {statusOption.icon} {statusOption.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredExpenses.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Tidak ada data expense untuk periode ini
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

