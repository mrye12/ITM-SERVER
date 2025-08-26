"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"

interface Shipment {
  id: string
  vessel: string
  cargo_type: string
  quantity: number
  unit: string
  origin_port: string
  destination_port: string
  departure_date: string
  arrival_date?: string
  status: 'booked' | 'loading' | 'on_shipment' | 'arrived' | 'completed' | 'cancelled'
  tracking_number: string
  notes?: string
  created_at: string
  created_by: string
}

interface ShipmentForm {
  vessel: string
  cargo_type: string
  quantity: number
  unit: string
  origin_port: string
  destination_port: string
  departure_date: string
  arrival_date?: string
  notes?: string
}

const statusOptions = [
  { value: 'booked', label: 'Booked', color: 'bg-blue-100 text-blue-800', icon: '📋' },
  { value: 'loading', label: 'Loading', color: 'bg-yellow-100 text-yellow-800', icon: '🏗️' },
  { value: 'on_shipment', label: 'On Shipment', color: 'bg-purple-100 text-purple-800', icon: '🚢' },
  { value: 'arrived', label: 'Arrived', color: 'bg-green-100 text-green-800', icon: '✅' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: '🏁' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' }
]

const cargoTypes = [
  'Nikel Ore',
  'Iron Ore', 
  'Coal',
  'Bauxite',
  'Copper Ore',
  'Tin Ore',
  'Gold Ore',
  'Silver Ore',
  'Other Minerals'
]

export default function ShipmentManagementPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShipmentForm>()

  const { 
    data: shipments, 
    loading, 
    insert, 
    update,
    remove 
  } = useRealtimeTable<Shipment>({
    table: 'shipments',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  })

  const generateTrackingNumber = () => {
    const prefix = 'ITM'
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}${timestamp}${random}`
  }

  const onSubmit = async (data: ShipmentForm) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const result = await insert({
        ...data,
        status: 'booked' as const,
        tracking_number: generateTrackingNumber(),
        created_by: user.id
      })

      if (result.error) throw result.error
      
      reset()
    } catch (error) {
      console.error('Error adding shipment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateShipmentStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      
      // Auto-set arrival date when status changes to 'arrived'
      if (newStatus === 'arrived' && selectedShipment) {
        updateData.arrival_date = new Date().toISOString().split('T')[0]
      }

      const result = await update(shipmentId, updateData)
      if (result.error) throw result.error
      
      setShowStatusModal(false)
      setSelectedShipment(null)
    } catch (error) {
      console.error('Error updating shipment status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data shipment ini?')) {
      await remove(id)
    }
  }

  const exportToPDF = (shipment: Shipment) => {
    // Simple PDF generation using window.print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Surat Jalan - ${shipment.tracking_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; }
              .status { padding: 5px 10px; border-radius: 5px; display: inline-block; }
              .footer { margin-top: 50px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PT. INFINITY TRADE MINERAL</h1>
              <h2>SURAT JALAN</h2>
              <p>No. ${shipment.tracking_number}</p>
            </div>
            
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="label">Kapal:</span> ${shipment.vessel}
                </div>
                <div class="info-item">
                  <span class="label">Jenis Barang:</span> ${shipment.cargo_type}
                </div>
                <div class="info-item">
                  <span class="label">Kuantitas:</span> ${shipment.quantity.toLocaleString()} ${shipment.unit}
                </div>
                <div class="info-item">
                  <span class="label">Pelabuhan Asal:</span> ${shipment.origin_port}
                </div>
              </div>
              
              <div>
                <div class="info-item">
                  <span class="label">Pelabuhan Tujuan:</span> ${shipment.destination_port}
                </div>
                <div class="info-item">
                  <span class="label">Tanggal Keberangkatan:</span> ${new Date(shipment.departure_date).toLocaleDateString('id-ID')}
                </div>
                ${shipment.arrival_date ? `
                <div class="info-item">
                  <span class="label">Tanggal Tiba:</span> ${new Date(shipment.arrival_date).toLocaleDateString('id-ID')}
                </div>
                ` : ''}
                <div class="info-item">
                  <span class="label">Status:</span> 
                  <span class="status">${statusOptions.find(s => s.value === shipment.status)?.label || shipment.status}</span>
                </div>
              </div>
            </div>
            
            ${shipment.notes ? `
            <div style="margin-bottom: 30px;">
              <div class="label">Catatan:</div>
              <p>${shipment.notes}</p>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
              <p>PT. Infinity Trade Mineral</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Calculate statistics
  const activeShipments = shipments.filter(s => ['booked', 'loading', 'on_shipment'].includes(s.status))
  const completedThisMonth = shipments.filter(s => {
    const completedDate = new Date(s.created_at)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return completedDate >= monthAgo && s.status === 'completed'
  })

  const statusCounts = statusOptions.reduce((acc, status) => {
    acc[status.value] = shipments.filter(s => s.status === status.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🚢</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shipment Management</h1>
            <p className="text-gray-600">Kelola dan tracking pengiriman mineral</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Aktif</span>
          </div>
          <div className="text-2xl font-bold mb-1">{activeShipments.length}</div>
          <div className="text-blue-100 text-sm">Shipment Berjalan</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Selesai</span>
          </div>
          <div className="text-2xl font-bold mb-1">{statusCounts.completed || 0}</div>
          <div className="text-green-100 text-sm">Total Completed</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium">On Transit</span>
          </div>
          <div className="text-2xl font-bold mb-1">{statusCounts.on_shipment || 0}</div>
          <div className="text-purple-100 text-sm">Dalam Perjalanan</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Bulan Ini</span>
          </div>
          <div className="text-2xl font-bold mb-1">{completedThisMonth.length}</div>
          <div className="text-orange-100 text-sm">Completed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tambah Shipment Baru</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kapal
                </label>
                <input
                  type="text"
                  {...register('vessel', { required: 'Nama kapal wajib diisi' })}
                  placeholder="Nama kapal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.vessel && (
                  <p className="text-red-500 text-sm mt-1">{errors.vessel.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Barang
                </label>
                <select
                  {...register('cargo_type', { required: 'Jenis barang wajib dipilih' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih jenis barang</option>
                  {cargoTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.cargo_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.cargo_type.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kuantitas
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('quantity', { 
                      required: 'Kuantitas wajib diisi',
                      min: { value: 0.01, message: 'Kuantitas minimal 0.01' }
                    })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan
                  </label>
                  <select
                    {...register('unit', { required: 'Satuan wajib dipilih' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih satuan</option>
                    <option value="MT">Metric Ton (MT)</option>
                    <option value="Ton">Ton</option>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="M3">Cubic Meter (M³)</option>
                  </select>
                  {errors.unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelabuhan Asal
                </label>
                <input
                  type="text"
                  {...register('origin_port', { required: 'Pelabuhan asal wajib diisi' })}
                  placeholder="Pelabuhan asal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.origin_port && (
                  <p className="text-red-500 text-sm mt-1">{errors.origin_port.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelabuhan Tujuan
                </label>
                <input
                  type="text"
                  {...register('destination_port', { required: 'Pelabuhan tujuan wajib diisi' })}
                  placeholder="Pelabuhan tujuan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.destination_port && (
                  <p className="text-red-500 text-sm mt-1">{errors.destination_port.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Keberangkatan
                </label>
                <input
                  type="date"
                  {...register('departure_date', { required: 'Tanggal keberangkatan wajib diisi' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.departure_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.departure_date.message}</p>
                )}
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Menyimpan...' : 'Tambah Shipment'}
              </button>
            </form>
          </div>
        </div>

        {/* Shipments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Daftar Shipment</h2>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {shipments.map((shipment) => {
                  const status = statusOptions.find(s => s.value === shipment.status)
                  return (
                    <div key={shipment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{status?.icon}</div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{shipment.vessel}</h3>
                            <p className="text-sm text-gray-600">Tracking: {shipment.tracking_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                            {status?.label}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedShipment(shipment)
                                setShowStatusModal(true)
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Update Status"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => exportToPDF(shipment)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Export PDF"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(shipment.id)}
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
                          <span className="text-gray-500">Barang:</span>
                          <div className="font-medium">{shipment.cargo_type}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Kuantitas:</span>
                          <div className="font-medium">{shipment.quantity.toLocaleString()} {shipment.unit}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Rute:</span>
                          <div className="font-medium">{shipment.origin_port} → {shipment.destination_port}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Keberangkatan:</span>
                          <div className="font-medium">{new Date(shipment.departure_date).toLocaleDateString('id-ID')}</div>
                        </div>
                      </div>

                      {shipment.arrival_date && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-gray-500 text-sm">Tiba: </span>
                          <span className="font-medium text-sm">{new Date(shipment.arrival_date).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}

                      {shipment.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-gray-500 text-sm">Catatan: </span>
                          <span className="text-sm">{shipment.notes}</span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {shipments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Belum ada data shipment
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Update Status Shipment
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {selectedShipment.vessel} - {selectedShipment.tracking_number}
            </p>
            
            <div className="space-y-3">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateShipmentStatus(selectedShipment.id, status.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedShipment.status === status.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{status.icon}</span>
                  <span className="font-medium">{status.label}</span>
                  {selectedShipment.status === status.value && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedShipment(null)
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


