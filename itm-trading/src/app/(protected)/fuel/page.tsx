"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"

interface FuelEntry {
  id: string
  date: string
  vendor: string
  volume: number
  price_per_liter: number
  total_cost: number
  equipment_id?: string
  notes?: string
  created_at: string
  created_by: string
}

interface FuelForm {
  date: string
  vendor: string
  volume: number
  price_per_liter: number
  equipment_id?: string
  notes?: string
}

export default function FuelManagementPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FuelForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  })

  const volume = watch('volume') || 0
  const pricePerLiter = watch('price_per_liter') || 0
  const totalCost = volume * pricePerLiter

  const { 
    data: fuelEntries, 
    loading, 
    insert, 
    remove 
  } = useRealtimeTable<FuelEntry>({
    table: 'fuel_entries',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  })

  const onSubmit = async (data: FuelForm) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const result = await insert({
        ...data,
        total_cost: totalCost,
        created_by: user.id
      })

      if (result.error) throw result.error
      
      reset({
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        volume: 0,
        price_per_liter: 0,
        equipment_id: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error adding fuel entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data fuel ini?')) {
      await remove(id)
    }
  }

  // Calculate statistics
  const thisWeekEntries = fuelEntries.filter(entry => {
    const entryDate = new Date(entry.date)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return entryDate >= weekAgo
  })

  const thisMonthEntries = fuelEntries.filter(entry => {
    const entryDate = new Date(entry.date)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return entryDate >= monthAgo
  })

  const weeklyStats = {
    totalVolume: thisWeekEntries.reduce((sum, entry) => sum + entry.volume, 0),
    totalCost: thisWeekEntries.reduce((sum, entry) => sum + entry.total_cost, 0),
    avgPrice: thisWeekEntries.length > 0 
      ? thisWeekEntries.reduce((sum, entry) => sum + entry.price_per_liter, 0) / thisWeekEntries.length 
      : 0
  }



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">⛽</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fuel Management</h1>
            <p className="text-gray-600">Monitor dan kelola pembelian bahan bakar</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium">Minggu Ini</span>
          </div>
          <div className="text-2xl font-bold mb-1">{weeklyStats.totalVolume.toLocaleString()} L</div>
          <div className="text-blue-100 text-sm">Total Volume</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="text-sm font-medium">Pengeluaran</span>
          </div>
          <div className="text-2xl font-bold mb-1">Rp {weeklyStats.totalCost.toLocaleString()}</div>
          <div className="text-green-100 text-sm">Minggu Ini</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Rata-rata</span>
          </div>
          <div className="text-2xl font-bold mb-1">Rp {weeklyStats.avgPrice.toLocaleString()}</div>
          <div className="text-purple-100 text-sm">Per Liter</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Transaksi</span>
          </div>
          <div className="text-2xl font-bold mb-1">{thisWeekEntries.length}</div>
          <div className="text-yellow-100 text-sm">Minggu Ini</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Input Pembelian Fuel</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Tanggal wajib diisi' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Supplier
                </label>
                <input
                  type="text"
                  {...register('vendor', { required: 'Vendor wajib diisi' })}
                  placeholder="Nama vendor/supplier"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.vendor && (
                  <p className="text-red-500 text-sm mt-1">{errors.vendor.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume (Liter)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('volume', { 
                    required: 'Volume wajib diisi',
                    min: { value: 0.01, message: 'Volume minimal 0.01 liter' }
                  })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.volume && (
                  <p className="text-red-500 text-sm mt-1">{errors.volume.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga per Liter (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price_per_liter', { 
                    required: 'Harga per liter wajib diisi',
                    min: { value: 0.01, message: 'Harga minimal Rp 0.01' }
                  })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.price_per_liter && (
                  <p className="text-red-500 text-sm mt-1">{errors.price_per_liter.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment ID (Opsional)
                </label>
                <input
                  type="text"
                  {...register('equipment_id')}
                  placeholder="ID alat/kendaraan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Auto-calculated total */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Cost:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rp {totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || totalCost <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data Fuel'}
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Histori Pembelian Fuel</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPeriod('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  30 Hari
                </button>
                <button
                  onClick={() => setSelectedPeriod('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Volume (L)</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Harga/L</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPeriod === 'week' ? thisWeekEntries : 
                      selectedPeriod === 'month' ? thisMonthEntries : fuelEntries).map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(entry.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{entry.vendor}</td>
                        <td className="py-3 px-4 text-sm text-right">
                          {entry.volume.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          Rp {entry.price_per_liter.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold">
                          Rp {entry.total_cost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(selectedPeriod === 'week' ? thisWeekEntries : 
                  selectedPeriod === 'month' ? thisMonthEntries : fuelEntries).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Belum ada data fuel untuk periode ini
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

