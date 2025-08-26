"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { supabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/hooks/useToast"

interface SalesOrder {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  product_name: string
  quantity: number
  price_usd: number
  total_usd: number
  contract_date: string
  delivery_date: string
  delivery_term: string
  loading_port: string
  discharge_port: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  created_by: string
}

interface OrderForm {
  customer_name: string
  product_name: string
  quantity: number
  price_usd: number
  contract_date: string
  delivery_date: string
  delivery_term: string
  loading_port: string
  discharge_port: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

interface Customer {
  id: string
  name: string
  contact_person: string
  email: string
  country: string
}

interface Product {
  id: string
  name: string
  spec: string
  unit: string
  price_usd: number
  category: string
}

export default function OrdersPage() {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { toast } = useToast()

  const { data: salesOrders, loading: ordersLoading, insert, update, remove } = useRealtimeTable<SalesOrder>({
    table: 'sales_orders',
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

  const deliveryTerms = ['FOB', 'CFR', 'CIF', 'DAP', 'DDP']
  const ports = [
    'Port of Tanjung Priok - Indonesia',
    'Port of Singapore - Singapore', 
    'Port Klang - Malaysia',
    'Laem Chabang - Thailand',
    'Port of Shanghai - China',
    'Port of Busan - South Korea'
  ]

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OrderForm>({
    defaultValues: {
      status: 'draft'
    }
  })

  // Auto-fill price when product is selected
  const selectedProduct = watch('product_name')
  useEffect(() => {
    const product = products.find(p => p.name === selectedProduct)
    if (product) {
      setValue('price_usd', product.price_usd)
    }
  }, [selectedProduct, setValue, products])

  // Pre-fill form when editing
  useEffect(() => {
    if (editingOrder) {
      setValue('customer_name', editingOrder.customer_name)
      setValue('product_name', editingOrder.product_name)
      setValue('quantity', editingOrder.quantity)
      setValue('price_usd', editingOrder.price_usd)
      setValue('contract_date', editingOrder.contract_date)
      setValue('delivery_date', editingOrder.delivery_date)
      setValue('delivery_term', editingOrder.delivery_term)
      setValue('loading_port', editingOrder.loading_port)
      setValue('discharge_port', editingOrder.discharge_port)
      setValue('status', editingOrder.status)
      setValue('notes', editingOrder.notes || '')
      setShowForm(true)
    }
  }, [editingOrder, setValue])

  const generateOrderNumber = () => {
    const prefix = 'SO'
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${year}${timestamp}`
  }

  const onSubmit = async (formData: OrderForm) => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const total_usd = formData.quantity * formData.price_usd

      if (editingOrder) {
        // Update existing order
        const { error } = await update(editingOrder.id, {
          ...formData,
          total_usd
        })
        if (error) throw new Error(error)
        toast.success("Order updated successfully")
        setEditingOrder(null)
      } else {
        // Create new order
        const { error } = await insert({
          ...formData,
          order_number: generateOrderNumber(),
          customer_id: customers.find(c => c.name === formData.customer_name)?.id || '',
          total_usd,
          created_by: user.id
        })
        if (error) throw new Error(error)
        toast.success("Order created successfully")
      }

      reset({ status: 'draft' })
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (order: SalesOrder) => {
    setEditingOrder(order)
  }

  const handleDelete = async () => {
    if (!orderToDelete) return
    
    try {
      const { error } = await remove(orderToDelete.id)
      if (error) throw new Error(error)
      
      toast.success("Order deleted successfully")
      setShowDeleteModal(false)
      setOrderToDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete order')
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: SalesOrder['status']) => {
    try {
      const { error } = await update(orderId, { status: newStatus })
      if (error) throw new Error(error)
      
      toast.success("Status updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter orders
  const filteredOrders = salesOrders.filter(order => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const exportToCSV = () => {
    const csvContent = [
      ['Order Number', 'Customer', 'Product', 'Quantity', 'Price', 'Total', 'Status', 'Contract Date'],
      ...filteredOrders.map(order => [
        order.order_number,
        order.customer_name,
        order.product_name,
        order.quantity,
        order.price_usd,
        order.total_usd,
        order.status,
        order.contract_date
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (ordersLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-center mt-2">Loading sales orders...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Order Management</h1>
          <p className="text-gray-600">Manage sales orders and track delivery progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            📊 Export CSV
          </Button>
          <Button onClick={() => {
            setEditingOrder(null)
            setShowForm(!showForm)
            reset({ 
              status: 'draft',
              contract_date: new Date().toISOString().split('T')[0]
            })
          }}>
            {showForm ? '✕ Cancel' : '+ New Order'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{salesOrders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(salesOrders.reduce((sum, order) => sum + (order.total_usd || 0), 0))}
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {salesOrders.filter(order => order.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {customers.length}
          </div>
          <div className="text-sm text-gray-600">Active Customers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order number, customer, or product..."
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
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {salesOrders.length} orders
          </div>
        </div>
      </div>

      {/* Enhanced Order Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingOrder ? 'Edit Order' : 'Create New Order'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <select
                {...register("customer_name", { required: "Customer is required" })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name} - {customer.country}
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
                {...register("product_name", { required: "Product is required" })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.name}>
                    {product.name} - {product.spec}
                  </option>
                ))}
              </select>
              {errors.product_name && (
                <p className="text-red-600 text-sm mt-1">{errors.product_name.message}</p>
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
                {...register("price_usd", { 
                  required: "Price is required",
                  min: { value: 0.01, message: "Price must be greater than 0" },
                  valueAsNumber: true
                })}
                className="w-full border rounded px-3 py-2"
                placeholder="Auto-filled from product"
              />
              {errors.price_usd && (
                <p className="text-red-600 text-sm mt-1">{errors.price_usd.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contract Date *</label>
              <input
                type="date"
                {...register("contract_date", { required: "Contract date is required" })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.contract_date && (
                <p className="text-red-600 text-sm mt-1">{errors.contract_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Delivery Date</label>
              <input
                type="date"
                {...register("delivery_date")}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Delivery Terms *</label>
              <select
                {...register("delivery_term", { required: "Delivery term is required" })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Terms</option>
                {deliveryTerms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
              {errors.delivery_term && (
                <p className="text-red-600 text-sm mt-1">{errors.delivery_term.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Loading Port</label>
              <select
                {...register("loading_port")}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Loading Port</option>
                {ports.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Discharge Port</label>
              <select
                {...register("discharge_port")}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Discharge Port</option>
                {ports.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full border rounded px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-span-full">
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
                variant={editingOrder ? "default" : "success"}
              >
                {editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingOrder(null)
                  reset({ status: 'draft' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Orders Table */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Sales Orders ({filteredOrders.length})</h2>
          <div className="text-sm text-green-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time sync active
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Order #</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Customer</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Product</th>
                <th className="p-3 text-right text-sm font-medium text-gray-500">Quantity</th>
                <th className="p-3 text-right text-sm font-medium text-gray-500">Price</th>
                <th className="p-3 text-right text-sm font-medium text-gray-500">Total</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Contract Date</th>
                <th className="p-3 text-center text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No orders found</p>
                    <p className="text-sm">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Click "New Order" to create your first order'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-blue-600">{order.order_number}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">
                        {customers.find(c => c.name === order.customer_name)?.country}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{order.product_name}</div>
                      <div className="text-xs text-gray-500">
                        {products.find(p => p.name === order.product_name)?.spec}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium">{order.quantity?.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {products.find(p => p.name === order.product_name)?.unit}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(order.price_usd)}
                    </td>
                    <td className="p-3 text-right font-bold text-lg">
                      {formatCurrency(order.total_usd)}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as SalesOrder['status'])}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-none ${getStatusColor(order.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(order.contract_date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleEdit(order)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => {
                            setOrderToDelete(order)
                            setShowDeleteModal(true)
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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
          <p>Are you sure you want to delete this order?</p>
          {orderToDelete && (
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Order:</strong> {orderToDelete.order_number}</p>
              <p><strong>Customer:</strong> {orderToDelete.customer_name}</p>
              <p><strong>Total:</strong> {formatCurrency(orderToDelete.total_usd)}</p>
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
