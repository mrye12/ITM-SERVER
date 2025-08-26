'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToastSuccess, useToastError } from '@/components/ui/Toast';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatNumber } from '@/lib/utils';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface StockItem {
  id?: string;
  item_name: string;
  category?: string;
  quantity: number;
  unit?: string;
  unit_price?: number;
  location?: string;
  supplier?: string;
  minimum_stock?: number;
  created_at?: string;
  updated_at?: string;
}

interface StockForm {
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  location: string;
  supplier: string;
  minimum_stock: number;
}

const categories = [
  'Coal Grade A', 'Coal Grade B', 'Nickel Ore', 'Iron Ore', 
  'Copper Concentrate', 'Bauxite', 'Tin Ore', 'Equipment Parts', 'Fuel'
];

const units = ['tons', 'kg', 'liters', 'pieces', 'cubic meters'];
const locations = ['Warehouse A', 'Warehouse B', 'Warehouse C', 'Port Storage', 'Processing Plant'];

export default function StockPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StockForm>();

  const {
    data: stockItems,
    loading,
    insert,
    update,
    remove
  } = useRealtimeTable<StockItem>({
    table: 'stock',
    select: '*',
    orderBy: { column: 'item_name', ascending: true }
  });

  // Filter stock items
  const filteredItems = stockItems?.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const isLowStock = (item.quantity || 0) <= (item.minimum_stock || 0);
    const matchesLowStock = !lowStockFilter || isLowStock;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  }) || [];

  // Get low stock items
  const lowStockItems = stockItems?.filter(item => (item.quantity || 0) <= (item.minimum_stock || 0)) || [];

  const onSubmit = async (data: StockForm) => {
    try {
      if (editingItem) {
        const result = await update(editingItem.id!, data);
        if (result.error) throw result.error;
        toastSuccess('Stock item updated successfully');
      } else {
        const result = await insert(data);
        if (result.error) throw result.error;
        toastSuccess('Stock item added successfully');
      }
      closeModal();
    } catch (error) {
      toastError(editingItem ? 'Failed to update stock item' : 'Failed to add stock item');
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    reset({
      item_name: item.item_name,
      category: item.category || '',
      quantity: item.quantity,
      unit: item.unit || '',
      unit_price: item.unit_price || 0,
      location: item.location || '',
      supplier: item.supplier || '',
      minimum_stock: item.minimum_stock || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this stock item?')) {
      try {
        const result = await remove(id);
        if (result.error) throw result.error;
        toastSuccess('Stock item deleted successfully');
      } catch (error) {
        toastError('Failed to delete stock item');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    reset({
      item_name: '',
      category: '',
      quantity: 0,
      unit: '',
      unit_price: 0,
      location: '',
      supplier: '',
      minimum_stock: 0
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Manage commodity inventory and stock levels</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Stock Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Low Stock Alert</h3>
          </div>
          <p className="text-red-700 text-sm">
            {lowStockItems.length} item(s) are running low on stock:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span key={item.id} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                {item.item_name} ({item.quantity} {item.unit || 'units'})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Show Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-pulse">Loading stock data...</div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No stock items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = (item.quantity || 0) <= (item.minimum_stock || 0);
                  return (
                    <tr key={item.id} className={isLowStock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.item_name}
                            </div>
                            <div className="text-sm text-gray-500">{item.supplier || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatNumber(item.quantity)} {item.unit || 'units'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {formatNumber(item.minimum_stock || 0)} {item.unit || 'units'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_price ? `Rp ${formatNumber(item.unit_price)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isLowStock 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              {...register('item_name', { required: 'Item name is required' })}
              error={errors.item_name?.message}
            />
            
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <Input
              label="Quantity"
              type="number"
              {...register('quantity', { required: 'Quantity is required', min: 0 })}
              error={errors.quantity?.message}
            />

            <div>
              <label className="text-sm font-medium">Unit</label>
              <select
                {...register('unit', { required: 'Unit is required' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <Input
              label="Unit Price (IDR)"
              type="number"
              {...register('unit_price', { required: 'Unit price is required', min: 0 })}
              error={errors.unit_price?.message}
            />

            <div>
              <label className="text-sm font-medium">Location</label>
              <select
                {...register('location', { required: 'Location is required' })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier"
              {...register('supplier', { required: 'Supplier is required' })}
              error={errors.supplier?.message}
            />

            <Input
              label="Minimum Stock"
              type="number"
              {...register('minimum_stock', { required: 'Minimum stock is required', min: 0 })}
              error={errors.minimum_stock?.message}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Update' : 'Add'} Stock Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}