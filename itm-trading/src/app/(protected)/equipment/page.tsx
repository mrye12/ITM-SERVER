"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { supabaseBrowser } from "@/lib/supabase/client"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"

interface Equipment {
  id: string
  name: string
  category: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_cost?: number
  status: 'active' | 'maintenance' | 'retired' | 'broken'
  location?: string
  last_maintenance?: string
  next_maintenance?: string
  notes?: string
  created_at: string
  created_by: string
}

interface EquipmentForm {
  name: string
  category: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_cost?: number
  status: 'active' | 'maintenance' | 'retired' | 'broken'
  location?: string
  last_maintenance?: string
  next_maintenance?: string
  notes?: string
}

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800', icon: '✅' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800', icon: '🔧' },
  { value: 'broken', label: 'Broken', color: 'bg-red-100 text-red-800', icon: '❌' },
  { value: 'retired', label: 'Retired', color: 'bg-gray-100 text-gray-800', icon: '📦' }
]

const categories = [
  'Heavy Machinery',
  'Mining Equipment', 
  'Transportation',
  'Power Tools',
  'Safety Equipment',
  'Office Equipment',
  'IT Equipment',
  'Other'
]

export default function EquipmentManagementPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EquipmentForm>({
    defaultValues: {
      status: 'active'
    }
  })

  const { 
    data: equipment, 
    loading, 
    insert, 
    update,
    remove 
  } = useRealtimeTable<Equipment>({
    table: 'equipments',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  })

  const onSubmit = async (data: EquipmentForm) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const result = await insert({
        ...data,
        created_by: user.id
      })

      if (result.error) throw result.error
      
      reset({
        status: 'active'
      })
    } catch (error) {
      console.error('Error adding equipment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateMaintenanceDate = async (equipmentId: string, lastMaintenance: string, nextMaintenance: string) => {
    try {
      const result = await update(equipmentId, {
        last_maintenance: lastMaintenance,
        next_maintenance: nextMaintenance,
        status: 'active' // Reset to active after maintenance
      })
      
      if (result.error) throw result.error
      
      setShowMaintenanceModal(false)
      setSelectedEquipment(null)
    } catch (error) {
      console.error('Error updating maintenance:', error)
    }
  }

  const updateEquipmentStatus = async (equipmentId: string, newStatus: string) => {
    try {
      const result = await update(equipmentId, { status: newStatus as 'active' | 'maintenance' | 'retired' | 'broken' })
      if (result.error) throw result.error
    } catch (error) {
      console.error('Error updating equipment status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data equipment ini?')) {
      await remove(id)
    }
  }

  // Filter equipment based on status and category
  const filteredEquipment = equipment.filter(item => {
    const statusMatch = filterStatus === 'all' || item.status === filterStatus
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory
    return statusMatch && categoryMatch
  })

  // Calculate statistics
  const statusCounts = statusOptions.reduce((acc, status) => {
    acc[status.value] = equipment.filter(e => e.status === status.value).length
    return acc
  }, {} as Record<string, number>)

  // Get maintenance alerts (equipment needing maintenance soon)
  const maintenanceAlerts = equipment.filter(item => {
    if (!item.next_maintenance) return false
    const nextMaintenance = new Date(item.next_maintenance)
    const today = new Date()
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0
  })

  const overdueMaintenanceCount = equipment.filter(item => {
    if (!item.next_maintenance) return false
    const nextMaintenance = new Date(item.next_maintenance)
    const today = new Date()
    return nextMaintenance < today
  }).length

  const totalValue = equipment.reduce((sum, item) => sum + (item.purchase_cost || 0), 0)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🔧</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
            <p className="text-gray-600">Monitor dan kelola peralatan perusahaan</p>
          </div>
        </div>

        {/* Maintenance Alerts */}
        {(maintenanceAlerts.length > 0 || overdueMaintenanceCount > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium text-yellow-800">Peringatan Maintenance</span>
            </div>
            <div className="text-sm text-yellow-700">
              {overdueMaintenanceCount > 0 && (
                <p className="mb-1">• {overdueMaintenanceCount} equipment terlambat maintenance</p>
              )}
              {maintenanceAlerts.length > 0 && (
                <p>• {maintenanceAlerts.length} equipment perlu maintenance dalam 7 hari</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Active</span>
          </div>
          <div className="text-2xl font-bold mb-1">{statusCounts.active || 0}</div>
          <div className="text-green-100 text-sm">Equipment Aktif</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Maintenance</span>
          </div>
          <div className="text-2xl font-bold mb-1">{statusCounts.maintenance || 0}</div>
          <div className="text-yellow-100 text-sm">Dalam Perbaikan</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-sm font-medium">Broken</span>
          </div>
          <div className="text-2xl font-bold mb-1">{statusCounts.broken || 0}</div>
          <div className="text-red-100 text-sm">Rusak</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="text-sm font-medium">Total Value</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {totalValue > 1000000 ? `${(totalValue / 1000000).toFixed(1)}M` : `${(totalValue / 1000).toFixed(0)}K`}
          </div>
          <div className="text-blue-100 text-sm">Rupiah</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Alerts</span>
          </div>
          <div className="text-2xl font-bold mb-1">{maintenanceAlerts.length + overdueMaintenanceCount}</div>
          <div className="text-orange-100 text-sm">Maintenance Due</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tambah Equipment Baru</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Equipment
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Nama equipment wajib diisi' })}
                  placeholder="Nama equipment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  {...register('category', { required: 'Kategori wajib dipilih' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    {...register('model')}
                    placeholder="Model/Type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    {...register('serial_number')}
                    placeholder="Serial number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Beli
                  </label>
                  <input
                    type="date"
                    {...register('purchase_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Beli (Rp)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('purchase_cost')}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status', { required: 'Status wajib dipilih' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi
                </label>
                <input
                  type="text"
                  {...register('location')}
                  placeholder="Lokasi equipment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Maintenance
                  </label>
                  <input
                    type="date"
                    {...register('last_maintenance')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Maintenance
                  </label>
                  <input
                    type="date"
                    {...register('next_maintenance')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Menyimpan...' : 'Tambah Equipment'}
              </button>
            </form>
          </div>
        </div>

        {/* Equipment List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Daftar Equipment</h2>
              
              {/* Filters */}
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEquipment.map((item) => {
                  const status = statusOptions.find(s => s.value === item.status)
                  const isMaintenanceDue = item.next_maintenance && 
                    new Date(item.next_maintenance) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  
                  return (
                    <div key={item.id} className={`border rounded-xl p-6 hover:shadow-md transition-shadow ${
                      isMaintenanceDue ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{status?.icon}</div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.category}</p>
                            {item.model && (
                              <p className="text-xs text-gray-500">Model: {item.model}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isMaintenanceDue && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Maintenance Due
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                            {status?.label}
                          </span>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedEquipment(item)
                                setShowMaintenanceModal(true)
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Update Maintenance"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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
                        {item.location && (
                          <div>
                            <span className="text-gray-500">Lokasi:</span>
                            <div className="font-medium">{item.location}</div>
                          </div>
                        )}
                        {item.purchase_cost && (
                          <div>
                            <span className="text-gray-500">Harga Beli:</span>
                            <div className="font-medium">Rp {item.purchase_cost.toLocaleString()}</div>
                          </div>
                        )}
                        {item.last_maintenance && (
                          <div>
                            <span className="text-gray-500">Last Maintenance:</span>
                            <div className="font-medium">{new Date(item.last_maintenance).toLocaleDateString('id-ID')}</div>
                          </div>
                        )}
                        {item.next_maintenance && (
                          <div>
                            <span className="text-gray-500">Next Maintenance:</span>
                            <div className={`font-medium ${isMaintenanceDue ? 'text-yellow-600' : ''}`}>
                              {new Date(item.next_maintenance).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        )}
                      </div>

                      {item.serial_number && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-gray-500 text-sm">S/N: </span>
                          <span className="font-mono text-sm">{item.serial_number}</span>
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-gray-500 text-sm">Catatan: </span>
                          <span className="text-sm">{item.notes}</span>
                        </div>
                      )}

                      {/* Quick Status Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          {statusOptions.map(statusOption => (
                            <button
                              key={statusOption.value}
                              onClick={() => updateEquipmentStatus(item.id, statusOption.value)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                item.status === statusOption.value
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

                {filteredEquipment.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    {filterStatus !== 'all' || filterCategory !== 'all' 
                      ? 'Tidak ada equipment yang sesuai filter'
                      : 'Belum ada data equipment'
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Update Modal */}
      {showMaintenanceModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Update Maintenance
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {selectedEquipment.name} - {selectedEquipment.category}
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const lastMaintenance = formData.get('last_maintenance') as string
              const nextMaintenance = formData.get('next_maintenance') as string
              
              if (lastMaintenance && nextMaintenance) {
                updateMaintenanceDate(selectedEquipment.id, lastMaintenance, nextMaintenance)
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Maintenance
                </label>
                <input
                  type="date"
                  name="last_maintenance"
                  defaultValue={selectedEquipment.last_maintenance || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Maintenance
                </label>
                <input
                  type="date"
                  name="next_maintenance"
                  defaultValue={selectedEquipment.next_maintenance || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMaintenanceModal(false)
                    setSelectedEquipment(null)
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

