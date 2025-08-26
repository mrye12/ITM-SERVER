'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import toast from 'react-hot-toast';
import { 
  Factory, 
  TrendingUp, 
  FileText, 
  Calendar,
  DollarSign,
  Scale,
  Ship,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  Globe,
  Building2
} from 'lucide-react';

interface SmelterSale {
  id: string;
  sale_number: string;
  smelter_company: string;
  smelter_location: string;
  commodity: string;
  grade: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  delivery_date: string;
  destination_port: string;
  quality_specifications: {
    ni_content?: number;
    moisture_content?: number;
    size?: string;
    fe_content?: number;
    sio2_content?: number;
  };
  contract_terms: string;
  payment_terms: string;
  shipping_terms: string;
  vessel_name?: string;
  bl_number?: string;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  documents?: string[];
  margin_percentage?: number;
  profit_amount?: number;
  notes?: string;
  created_at: string;
  created_by: string;
}

interface SmelterSaleForm {
  smelter_company: string;
  smelter_location: string;
  commodity: string;
  grade: string;
  quantity: number;
  unit_price: number;
  sale_date: string;
  delivery_date: string;
  destination_port: string;
  ni_content?: number;
  moisture_content?: number;
  size?: string;
  fe_content?: number;
  sio2_content?: number;
  contract_terms: string;
  payment_terms: string;
  shipping_terms: string;
  vessel_name?: string;
  bl_number?: string;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  margin_percentage?: number;
  notes?: string;
}

interface SmelterCompany {
  id: string;
  company_name: string;
  country: string;
  location: string;
  contact_person: string;
  email: string;
  phone: string;
  processing_capacity: number;
  commodity_preference: string[];
  quality_requirements: {
    min_ni_content?: number;
    max_moisture?: number;
    acceptable_size?: string;
  };
  payment_preference: string[];
}

export default function SmelterSalesPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSale, setEditingSale] = useState<SmelterSale | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SmelterSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commodityFilter, setCommodityFilter] = useState<string>('all');
  
  // Toast is imported directly from react-hot-toast
  
  const { data: smelterSales, loading, error, insert, update, remove } = useRealtimeTable<SmelterSale>({
    table: 'smelter_sales',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Mock data for Smelter companies (replace with real API)
  const [smelterCompanies] = useState<SmelterCompany[]>([
    { 
      id: '1', 
      company_name: 'Tsingshan Holding Group', 
      country: 'China',
      location: 'Wenzhou, Zhejiang Province',
      contact_person: 'Li Wei',
      email: 'li.wei@tsingshan.com',
      phone: '+86 137-5888-9999',
      processing_capacity: 500000,
      commodity_preference: ['Nickel Ore', 'Stainless Steel'],
      quality_requirements: {
        min_ni_content: 1.8,
        max_moisture: 35,
        acceptable_size: '0-100mm'
      },
      payment_preference: ['L/C at Sight', 'T/T Advance']
    },
    { 
      id: '2', 
      company_name: 'PT Virtue Dragon Nickel Industry', 
      country: 'Indonesia',
      location: 'Morowali, Sulawesi Tengah',
      contact_person: 'Zhang Ming',
      email: 'zhang.ming@virtue-dragon.co.id',
      phone: '+62 813-4567-8901',
      processing_capacity: 300000,
      commodity_preference: ['Nickel Ore'],
      quality_requirements: {
        min_ni_content: 1.5,
        max_moisture: 40,
        acceptable_size: '0-150mm'
      },
      payment_preference: ['L/C at Sight', 'T/T 30 days']
    },
    { 
      id: '3', 
      company_name: 'PT Obsidian Stainless Steel', 
      country: 'Indonesia',
      location: 'Batang, Jawa Tengah',
      contact_person: 'Chen Hui',
      email: 'chen.hui@obsidian-steel.com',
      phone: '+62 812-7777-8888',
      processing_capacity: 400000,
      commodity_preference: ['Nickel Ore', 'Iron Ore'],
      quality_requirements: {
        min_ni_content: 1.6,
        max_moisture: 30,
        acceptable_size: '0-100mm'
      },
      payment_preference: ['L/C at Sight', 'T/T Advance']
    },
    { 
      id: '4', 
      company_name: 'Hyundai Steel Company', 
      country: 'South Korea',
      location: 'Pohang, Gyeongsangbuk-do',
      contact_person: 'Park Sang Min',
      email: 'park.sangmin@hyundai-steel.com',
      phone: '+82 10-9999-7777',
      processing_capacity: 600000,
      commodity_preference: ['Iron Ore', 'Coal'],
      quality_requirements: {
        min_ni_content: 1.4,
        max_moisture: 25,
        acceptable_size: '0-80mm'
      },
      payment_preference: ['L/C at Sight']
    }
  ]);

  const commodities = ['Nickel Ore', 'Iron Ore', 'Coal', 'Bauxite', 'Copper Ore'];
  const grades = {
    'Nickel Ore': ['1.8%', '1.5%', '1.2%', '2.0%+'],
    'Iron Ore': ['62%', '58%', '65%+'],
    'Coal': ['Grade A (6300+ kcal)', 'Grade B (5800 kcal)', 'Grade C (5000 kcal)'],
    'Bauxite': ['40%+ Al2O3', '35-40% Al2O3'],
    'Copper Ore': ['25%+', '20-25%', '15-20%']
  };
  const units = ['MT', 'WMT', 'DMT'];
  const contractTerms = ['FOB', 'CFR', 'CIF', 'EXW', 'DAP'];
  const paymentTerms = ['T/T Advance', 'L/C at Sight', 'T/T 30 days', 'T/T 60 days', 'Cash'];
  const shippingTerms = ['Bulk Carrier', 'Container', 'Barge', 'Break Bulk'];
  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: '✅' },
    { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: '🚢' },
    { value: 'delivered', label: 'Delivered', color: 'bg-yellow-100 text-yellow-800', icon: '🚛' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: '🏁' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' }
  ];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SmelterSaleForm>({
    defaultValues: {
      status: 'draft',
      unit_price: 0,
      quantity: 0,
      margin_percentage: 10
    }
  });

  const selectedCommodity = watch('commodity');
  const selectedQuantity = watch('quantity');
  const selectedUnitPrice = watch('unit_price');
  const selectedMargin = watch('margin_percentage');

  // Auto-calculate totals
  const totalAmount = selectedQuantity * selectedUnitPrice;
  const profitAmount = totalAmount * ((selectedMargin || 0) / 100);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingSale) {
      setValue('smelter_company', editingSale.smelter_company);
      setValue('smelter_location', editingSale.smelter_location);
      setValue('commodity', editingSale.commodity);
      setValue('grade', editingSale.grade);
      setValue('quantity', editingSale.quantity);
      setValue('unit_price', editingSale.unit_price);
      setValue('sale_date', editingSale.sale_date);
      setValue('delivery_date', editingSale.delivery_date);
      setValue('destination_port', editingSale.destination_port);
      setValue('ni_content', editingSale.quality_specifications?.ni_content);
      setValue('moisture_content', editingSale.quality_specifications?.moisture_content);
      setValue('size', editingSale.quality_specifications?.size);
      setValue('fe_content', editingSale.quality_specifications?.fe_content);
      setValue('sio2_content', editingSale.quality_specifications?.sio2_content);
      setValue('contract_terms', editingSale.contract_terms);
      setValue('payment_terms', editingSale.payment_terms);
      setValue('shipping_terms', editingSale.shipping_terms);
      setValue('vessel_name', editingSale.vessel_name);
      setValue('bl_number', editingSale.bl_number);
      setValue('status', editingSale.status);
      setValue('margin_percentage', editingSale.margin_percentage);
      setValue('notes', editingSale.notes || '');
      setShowForm(true);
    }
  }, [editingSale, setValue]);

  const generateSaleNumber = () => {
    const prefix = 'SS';
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${year}${timestamp}`;
  };

  const onSubmit = async (formData: SmelterSaleForm) => {
    setSubmitting(true);
    try {
      const saleData = {
        ...formData,
        sale_number: editingSale?.sale_number || generateSaleNumber(),
        unit: 'MT', // Default unit
        total_amount: formData.quantity * formData.unit_price,
        profit_amount: (formData.quantity * formData.unit_price) * ((formData.margin_percentage || 0) / 100),
        quality_specifications: {
          ni_content: formData.ni_content,
          moisture_content: formData.moisture_content,
          size: formData.size,
          fe_content: formData.fe_content,
          sio2_content: formData.sio2_content
        },
        created_at: editingSale?.created_at || new Date().toISOString(),
        created_by: 'current_user' // Replace with actual user ID
      };

      if (editingSale) {
        await update(editingSale.id, saleData);
        toast('Sale updated successfully');
      } else {
        await insert(saleData);
        toast('Sale created successfully');
      }

      setShowForm(false);
      setEditingSale(null);
      reset();
    } catch (error: any) {
      toast(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sale: SmelterSale) => {
    setEditingSale(sale);
  };

  const handleDelete = async () => {
    if (saleToDelete) {
      try {
        await remove(saleToDelete.id);
        toast('Sale deleted successfully');
        setShowDeleteModal(false);
        setSaleToDelete(null);
      } catch (error: any) {
        toast(`Error: ${error.message}`);
      }
    }
  };

  // Filter sales
  const filteredSales = smelterSales?.filter(sale => {
    const matchesSearch = sale.smelter_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const matchesCommodity = commodityFilter === 'all' || sale.commodity === commodityFilter;
    return matchesSearch && matchesStatus && matchesCommodity;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusOption.color}`}>
        {statusOption.icon} {statusOption.label}
      </span>
    ) : null;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-8 h-8 text-orange-600" />
            Sales to Smelter
          </h1>
          <p className="text-gray-600 mt-1">
            Penjualan mineral ke perusahaan smelter domestik dan internasional
          </p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold">{smelterSales?.length || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed Sales</p>
              <p className="text-2xl font-bold">
                {smelterSales?.filter(s => s.status === 'confirmed').length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${smelterSales?.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold">
                ${smelterSales?.reduce((sum, s) => sum + (s.profit_amount || 0), 0).toLocaleString() || 0}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border rounded-lg w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          
          <select
            value={commodityFilter}
            onChange={(e) => setCommodityFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Commodities</option>
            {commodities.map(commodity => (
              <option key={commodity} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Sale Form */}
      {showForm && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {editingSale ? 'Edit Sale' : 'New Sale to Smelter'}
            </h2>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingSale(null); reset(); }}>
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Smelter Company Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Smelter Company *</label>
                <select
                  {...register("smelter_company", { required: "Smelter company is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Smelter Company</option>
                  {smelterCompanies.map(company => (
                    <option key={company.id} value={company.company_name}>
                      {company.company_name} - {company.country}
                    </option>
                  ))}
                </select>
                {errors.smelter_company && (
                  <p className="text-red-600 text-sm mt-1">{errors.smelter_company.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Smelter Location *</label>
                <input
                  type="text"
                  {...register("smelter_location", { required: "Location is required" })}
                  placeholder="e.g., Morowali, Sulawesi Tengah"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.smelter_location && (
                  <p className="text-red-600 text-sm mt-1">{errors.smelter_location.message}</p>
                )}
              </div>
            </div>

            {/* Commodity Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Commodity *</label>
                <select
                  {...register("commodity", { required: "Commodity is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Commodity</option>
                  {commodities.map(commodity => (
                    <option key={commodity} value={commodity}>
                      {commodity}
                    </option>
                  ))}
                </select>
                {errors.commodity && (
                  <p className="text-red-600 text-sm mt-1">{errors.commodity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grade *</label>
                <select
                  {...register("grade", { required: "Grade is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Grade</option>
                  {selectedCommodity && grades[selectedCommodity as keyof typeof grades]?.map(grade => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="text-red-600 text-sm mt-1">{errors.grade.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity (MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("quantity", { 
                    required: "Quantity is required",
                    min: { value: 0.01, message: "Quantity must be greater than 0" }
                  })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* Price & Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Unit Price (USD/MT) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("unit_price", { 
                    required: "Unit price is required",
                    min: { value: 0.01, message: "Price must be greater than 0" }
                  })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.unit_price && (
                  <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Margin (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("margin_percentage")}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Revenue</label>
                <input
                  type="text"
                  value={`$${totalAmount.toLocaleString()}`}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Profit Amount</label>
                <input
                  type="text"
                  value={`$${profitAmount.toLocaleString()}`}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status *</label>
                <select
                  {...register("status", { required: "Status is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Dates & Ports */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sale Date *</label>
                <input
                  type="date"
                  {...register("sale_date", { required: "Sale date is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.sale_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.sale_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Date *</label>
                <input
                  type="date"
                  {...register("delivery_date", { required: "Delivery date is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.delivery_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.delivery_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Destination Port *</label>
                <input
                  type="text"
                  {...register("destination_port", { required: "Destination port is required" })}
                  placeholder="e.g., Port of Morowali"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.destination_port && (
                  <p className="text-red-600 text-sm mt-1">{errors.destination_port.message}</p>
                )}
              </div>
            </div>

            {/* Quality Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Quality Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ni Content (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("ni_content")}
                    placeholder="e.g., 1.8"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Moisture (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("moisture_content")}
                    placeholder="e.g., 30"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fe Content (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("fe_content")}
                    placeholder="e.g., 15"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SiO2 Content (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("sio2_content")}
                    placeholder="e.g., 45"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <input
                    type="text"
                    {...register("size")}
                    placeholder="e.g., 0-100mm"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Contract & Shipping Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contract Terms *</label>
                <select
                  {...register("contract_terms", { required: "Contract terms is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Terms</option>
                  {contractTerms.map(term => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
                {errors.contract_terms && (
                  <p className="text-red-600 text-sm mt-1">{errors.contract_terms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Terms *</label>
                <select
                  {...register("payment_terms", { required: "Payment terms is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Payment Terms</option>
                  {paymentTerms.map(term => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
                {errors.payment_terms && (
                  <p className="text-red-600 text-sm mt-1">{errors.payment_terms.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Shipping Terms *</label>
                <select
                  {...register("shipping_terms", { required: "Shipping terms is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Shipping Terms</option>
                  {shippingTerms.map(term => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
                {errors.shipping_terms && (
                  <p className="text-red-600 text-sm mt-1">{errors.shipping_terms.message}</p>
                )}
              </div>
            </div>

            {/* Shipping Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vessel Name</label>
                <input
                  type="text"
                  {...register("vessel_name")}
                  placeholder="e.g., MV Ocean Pioneer"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">B/L Number</label>
                <input
                  type="text"
                  {...register("bl_number")}
                  placeholder="e.g., BL202501001"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Additional notes or comments..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setShowForm(false); setEditingSale(null); reset(); }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {submitting ? 'Saving...' : editingSale ? 'Update Sale' : 'Create Sale'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Sales List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Smelter Sales</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading sales...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-8">
            <Factory className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No sales found</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="mt-4"
            >
              Create First Sale
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Sale No.</th>
                  <th className="text-left py-3">Smelter Company</th>
                  <th className="text-left py-3">Commodity</th>
                  <th className="text-left py-3">Quantity</th>
                  <th className="text-left py-3">Unit Price</th>
                  <th className="text-left py-3">Revenue</th>
                  <th className="text-left py-3">Profit</th>
                  <th className="text-left py-3">Delivery Date</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{sale.sale_number}</td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{sale.smelter_company}</p>
                        <p className="text-sm text-gray-600">{sale.smelter_location}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{sale.commodity}</p>
                        <p className="text-sm text-gray-600">{sale.grade}</p>
                      </div>
                    </td>
                    <td className="py-3">{sale.quantity.toLocaleString()} {sale.unit}</td>
                    <td className="py-3">${sale.unit_price.toLocaleString()}</td>
                    <td className="py-3 font-medium">${sale.total_amount.toLocaleString()}</td>
                    <td className="py-3 text-green-600 font-medium">
                      ${(sale.profit_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3">{new Date(sale.delivery_date).toLocaleDateString()}</td>
                    <td className="py-3">{getStatusBadge(sale.status)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSaleToDelete(sale);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete sale "{saleToDelete?.sale_number}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSaleToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
