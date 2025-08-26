"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { supabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/hooks/useToast"

interface SalesRecord {
  id: string
  customer_name: string
  product: string
  quantity: number
  price: number
  status: 'draft' | 'confirmed' | 'delivered' | 'cancelled'
  notes?: string
  created_at: string
  created_by: string
}

interface SalesForm {
  customer_name: string
  product: string
  quantity: number
  price: number
  status: 'draft' | 'confirmed' | 'delivered' | 'cancelled'
  notes?: string
}

interface Customer {
  id: string
  name: string
  email: string
  company: string
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  unit: string
}

export default function SalesPage() {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<SalesRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { toast } = useToast()
  
  const { data: sales, loading, error, insert, update, remove } = useRealtimeTable<SalesRecord>({
    table: 'sales',
    orderBy: { column: 'created_at', ascending: false }
  })

  // Load customers and products from Supabase
  const { data: customers, loading: customersLoading } = useRealtimeTable<Customer>({
    table: 'customers',
    orderBy: { column: 'name', ascending: true }
  })

  const { data: products, loading: productsLoading } = useRealtimeTable<Product>({
    table: 'commodities',
    orderBy: { column: 'name', ascending: true }
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SalesForm>({
    defaultValues: {
      status: 'draft'
    }
  })

  // Auto-fill price when product is selected
  const selectedProduct = watch('product')
  useEffect(() => {
    const product = products.find(p => p.name === selectedProduct)
    if (product) {
      setValue('price', product.price)
    }
  }, [selectedProduct, setValue, products])

  // Pre-fill form when editing
  useEffect(() => {
    if (editingSale) {
      setValue('customer_name', editingSale.customer_name)
      setValue('product', editingSale.product)
      setValue('quantity', editingSale.quantity)
      setValue('price', editingSale.price)
      setValue('status', editingSale.status)
      setValue('notes', editingSale.notes || '')
      setShowForm(true)
    }
  }, [editingSale, setValue])

  const onSubmit = async (formData: SalesForm) => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editingSale) {
        // Update existing sale
        const { error } = await update(editingSale.id, formData)
        if (error) throw new Error(error)
        toast.success("Sale updated successfully")
        setEditingSale(null)
      } else {
        // Create new sale
        const { error } = await insert({
          ...formData,
          created_by: user.id
        })
        if (error) throw new Error(error)
        toast.success("Sale created successfully")
      }

      reset({ status: 'draft' })
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save sales record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (sale: SalesRecord) => {
    setEditingSale(sale)
  }

  const handleDelete = async () => {
    if (!saleToDelete) return
    
    try {
      const { error } = await remove(saleToDelete.id)
      if (error) throw new Error(error)
      
      toast.success("Sale deleted successfully")
      setShowDeleteModal(false)
      setSaleToDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete sale')
    }
  }

  const handleStatusUpdate = async (saleId: string, newStatus: SalesRecord['status']) => {
    try {
      const { error } = await update(saleId, { status: newStatus })
      if (error) throw new Error(error)
      
      toast.success("Status updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.product.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const exportToCSV = () => {
    const csvContent = [
      ['Customer', 'Product', 'Quantity', 'Price', 'Total', 'Status', 'Date'],
      ...filteredSales.map(sale => [
        sale.customer_name,
        sale.product,
        sale.quantity,
        sale.price,
        (sale.quantity * sale.price).toFixed(2),
        sale.status,
        new Date(sale.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6">Loading sales data...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Sales Management</h1>
          <p className="text-gray-600">Manage sales records and track performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            📊 Export CSV
          </Button>
          <Button onClick={() => {
            setEditingSale(null)
            setShowForm(!showForm)
            reset({ status: 'draft' })
          }}>
            {showForm ? '✕ Cancel' : '+ Add Sale'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{sales.length}</div>
          <div className="text-sm text-gray-600">Total Sales</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            ${sales.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {sales.filter(sale => sale.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {sales.filter(sale => sale.status === 'delivered').length}
          </div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredSales.length} of {sales.length} records
          </div>
        </div>
      </div>

      {/* Enhanced Sales Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingSale ? 'Edit Sale' : 'Add New Sale'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <select
                {...register("customer_name", { required: "Customer is required" })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name} - {customer.company}
                  </option>
                ))}
              </select>
              {errors.customer_name && (
                <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product *</label>
              <select
                {...register("product", { required: "Product is required" })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.name}>
                    {product.name} - ${product.price}/{product.unit}
                  </option>
                ))}
              </select>
              {errors.product && (
                <p className="text-red-600 text-sm mt-1">{errors.product.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity *</label>
              <input
                type="number"
                {...register("quantity", { 
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
                  valueAsNumber: true
                })}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                {...register("price", { 
                  required: "Price is required",
                  min: { value: 0.01, message: "Price must be greater than 0" },
                  valueAsNumber: true
                })}
                className="w-full border rounded px-3 py-2"
                placeholder="Auto-filled from product"
              />
              {errors.price && (
                <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full border rounded px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                {...register("notes")}
                className="w-full border rounded px-3 py-2"
                placeholder="Optional notes"
              />
            </div>

            <div className="col-span-full flex gap-2">
              <Button
                type="submit"
                loading={submitting}
                variant={editingSale ? "default" : "success"}
              >
                {editingSale ? 'Update Sale' : 'Create Sale'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingSale(null)
                  reset({ status: 'draft' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Sales Table */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Sales Records ({filteredSales.length})</h2>
          <div className="text-sm text-green-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time sync active
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Customer</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Product</th>
                <th className="p-3 text-right text-sm font-medium text-gray-500">Qty</th>
                <th className="p-3 text-right text-sm font-medium text-gray-500">Price</th>
                <th className="p-3 text-right text-sm font-medium text-gray-500">Total</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Date</th>
                <th className="p-3 text-center text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{sale.customer_name}</div>
                      {sale.notes && (
                        <div className="text-xs text-gray-500">{sale.notes}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{sale.product}</div>
                      <div className="text-xs text-gray-500">
                        {products.find(p => p.name === sale.product)?.category}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {sale.quantity.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">${sale.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-lg">
                      ${(sale.quantity * sale.price).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <select
                        value={sale.status}
                        onChange={(e) => handleStatusUpdate(sale.id, e.target.value as SalesRecord['status'])}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-none ${getStatusColor(sale.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(sale.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleEdit(sale)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => {
                            setSaleToDelete(sale)
                            setShowDeleteModal(true)
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">💼</div>
                    <p>No sales records found</p>
                    <p className="text-sm">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Click "Add Sale" to create your first record'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this sale record?</p>
          {saleToDelete && (
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Customer:</strong> {saleToDelete.customer_name}</p>
              <p><strong>Product:</strong> {saleToDelete.product}</p>
              <p><strong>Total:</strong> ${(saleToDelete.quantity * saleToDelete.price).toLocaleString()}</p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
