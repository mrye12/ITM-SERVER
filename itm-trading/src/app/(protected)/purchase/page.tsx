'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DynamicDropdown } from '@/components/ui/DynamicDropdown';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useToast } from '@/hooks/useToast';
import { 
  ShoppingCart, 
  Building, 
 

  DollarSign,



  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
  Search,
  Download
} from 'lucide-react';

interface Purchase {
  id: string;
  purchase_number: string;
  iup_company: string;
  iup_license_number: string;
  commodity: string;
  grade: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  purchase_date: string;
  delivery_date: string;
  source_location: string;
  loading_port: string;
  quality_specifications: {
    ni_content?: number;
    moisture_content?: number;
    size?: string;
    impurities?: string;
  };
  contract_terms: string;
  payment_terms: string;
  status: 'draft' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';
  documents?: string[];
  notes?: string;
  created_at: string;
  created_by: string;
}

interface PurchaseForm {
  iup_company: string;
  iup_license_number: string;
  commodity: string;
  grade: string;
  quantity: number;
  unit_price: number;
  purchase_date: string;
  delivery_date: string;
  source_location: string;
  loading_port: string;
  ni_content?: number;
  moisture_content?: number;
  size?: string;
  impurities?: string;
  contract_terms: string;
  payment_terms: string;
  status: 'draft' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';
  notes?: string;
}

interface IUPCompany {
  id: string;
  company_name: string;
  license_number: string;
  location: string;
  commodity_types: string[];
  contact_person: string;
  email: string;
  phone: string;
  production_capacity: number;
  quality_certifications: string[];
}

export default function PurchasePage() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commodityFilter, setCommodityFilter] = useState<string>('all');
  const [commodities, setCommodities] = useState<any[]>([]);

  
  const { toast } = useToast();
  
  const { data: purchases, loading, insert, update, remove } = useRealtimeTable<Purchase>({
    table: 'purchases',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Load commodities on component mount
  useEffect(() => {
    loadCommodities();
  }, []);

  const loadCommodities = async () => {
    try {
      setLoadingCommodities(true);
      const response = await fetch('/api/commodities/custom');
      const data = await response.json();
      
      if (response.ok) {
        setCommodities(data.commodities || []);
      } else {
        console.error('Failed to load commodities:', data.error);
        toast.error('Failed to load commodities');
      }
    } catch (error) {
      console.error('Error loading commodities:', error);
      toast.error('Error loading commodities');
    } finally {
      setLoadingCommodities(false);
    }
  };

  const handleAddCustomCommodity = async (code: string, name: string, category?: string) => {
    try {
      const response = await fetch('/api/commodities/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          category: category || 'Minerals',
          unit_of_measure: 'MT',
          export_eligible: true
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Reload commodities to include the new one
        await loadCommodities();
        return true;
      } else {
        toast.error(data.error || 'Failed to add custom commodity');
        return false;
      }
    } catch (error) {
      console.error('Error adding custom commodity:', error);
      toast.error('Error adding custom commodity');
      return false;
    }
  };

  // Mock data for IUP companies (replace with real API)
  const [iupCompanies] = useState<IUPCompany[]>([
    { 
      id: '1', 
      company_name: 'PT Borneo Mineral Resources', 
      license_number: 'IUP-001234-2023',
      location: 'Balikpapan, Kalimantan Timur',
      commodity_types: ['Nickel Ore', 'Iron Ore'],
      contact_person: 'Budi Santoso',
      email: 'budi@borneominerals.com',
      phone: '+62 812-3456-7890',
      production_capacity: 50000,
      quality_certifications: ['ISO 9001', 'ISPO']
    },
    { 
      id: '2', 
      company_name: 'CV Sulawesi Mining', 
      license_number: 'IUP-005678-2023',
      location: 'Sorowako, Sulawesi Selatan',
      commodity_types: ['Nickel Ore'],
      contact_person: 'Sari Dewi',
      email: 'sari@sulawesimining.co.id',
      phone: '+62 813-9876-5432',
      production_capacity: 30000,
      quality_certifications: ['ISO 14001', 'OHSAS 18001']
    },
    { 
      id: '3', 
      company_name: 'PT Maluku Emas Mining', 
      license_number: 'IUP-009012-2023',
      location: 'Ternate, Maluku Utara',
      commodity_types: ['Nickel Ore', 'Gold Ore'],
      contact_person: 'Ahmad Rahman',
      email: 'ahmad@malukuemas.com',
      phone: '+62 814-5555-1234',
      production_capacity: 75000,
      quality_certifications: ['ISO 9001', 'ISO 14001', 'PROPER Hijau']
    }
  ]);

  // commodities is now loaded from API as state variable
  const grades = {
    'Nickel Ore': ['1.8%', '1.5%', '1.2%', '2.0%+'],
    'Iron Ore': ['62%', '58%', '65%+'],
    'Coal': ['Grade A (6300+ kcal)', 'Grade B (5800 kcal)', 'Grade C (5000 kcal)'],
    'Bauxite': ['40%+ Al2O3', '35-40% Al2O3'],
    'Copper Ore': ['25%+', '20-25%', '15-20%'],
    'Gold Ore': ['High Grade', 'Medium Grade', 'Low Grade']
  };

  const contractTerms = ['FOB', 'CFR', 'CIF', 'EXW', 'DAP'];
  const paymentTerms = ['T/T Advance', 'L/C at Sight', 'T/T 30 days', 'T/T 60 days', 'Cash'];
  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: '✅' },
    { value: 'delivered', label: 'Delivered', color: 'bg-yellow-100 text-yellow-800', icon: '🚛' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: '🏁' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '❌' }
  ];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PurchaseForm>({
    defaultValues: {
      status: 'draft',
      unit_price: 0,
      quantity: 0
    }
  });
  
  // Register commodity field for validation since DynamicDropdown doesn't use register
  useEffect(() => {
    register("commodity", { required: "Commodity is required" });
  }, [register]);

  const selectedCommodity = watch('commodity');
  const selectedQuantity = watch('quantity');
  const selectedUnitPrice = watch('unit_price');

  // Auto-calculate total
  const totalAmount = selectedQuantity * selectedUnitPrice;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingPurchase) {
      setValue('iup_company', editingPurchase.iup_company);
      setValue('iup_license_number', editingPurchase.iup_license_number);
      setValue('commodity', editingPurchase.commodity);
      setValue('grade', editingPurchase.grade);
      setValue('quantity', editingPurchase.quantity);
      setValue('unit_price', editingPurchase.unit_price);
      setValue('purchase_date', editingPurchase.purchase_date);
      setValue('delivery_date', editingPurchase.delivery_date);
      setValue('source_location', editingPurchase.source_location);
      setValue('loading_port', editingPurchase.loading_port);
      setValue('ni_content', editingPurchase.quality_specifications?.ni_content);
      setValue('moisture_content', editingPurchase.quality_specifications?.moisture_content);
      setValue('size', editingPurchase.quality_specifications?.size);
      setValue('impurities', editingPurchase.quality_specifications?.impurities);
      setValue('contract_terms', editingPurchase.contract_terms);
      setValue('payment_terms', editingPurchase.payment_terms);
      setValue('status', editingPurchase.status);
      setValue('notes', editingPurchase.notes || '');
      setShowForm(true);
    }
  }, [editingPurchase, setValue]);

  const generatePurchaseNumber = () => {
    const prefix = 'PO';
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${year}${timestamp}`;
  };

  const onSubmit = async (formData: PurchaseForm) => {
    setSubmitting(true);
    try {
      const purchaseData = {
        ...formData,
        purchase_number: editingPurchase?.purchase_number || generatePurchaseNumber(),
        unit: 'MT', // Default unit
        total_amount: formData.quantity * formData.unit_price,
        quality_specifications: {
          ni_content: formData.ni_content,
          moisture_content: formData.moisture_content,
          size: formData.size,
          impurities: formData.impurities
        },
        created_at: editingPurchase?.created_at || new Date().toISOString(),
        created_by: 'current_user' // Replace with actual user ID
      };

      if (editingPurchase) {
        await update(editingPurchase.id, purchaseData);
        toast.success('Purchase updated successfully');
      } else {
        await insert(purchaseData);
        toast.success('Purchase created successfully');
      }

      setShowForm(false);
      setEditingPurchase(null);
      reset();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
  };

  const handleDelete = async () => {
    if (purchaseToDelete) {
      try {
        await remove(purchaseToDelete.id);
        toast.success('Purchase deleted successfully');
        setShowDeleteModal(false);
        setPurchaseToDelete(null);
      } catch (error: any) {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  // Filter purchases
  const filteredPurchases = purchases?.filter(purchase => {
    const matchesSearch = purchase.iup_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    const matchesCommodity = commodityFilter === 'all' || purchase.commodity === commodityFilter;
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
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Purchase from IUP
          </h1>
          <p className="text-gray-600 mt-1">
            Pembelian langsung dari perusahaan pemegang IUP (Izin Usaha Pertambangan)
          </p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold">{purchases?.length || 0}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed Orders</p>
              <p className="text-2xl font-bold">
                {purchases?.filter(p => p.status === 'confirmed').length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">
                ${purchases?.reduce((sum, p) => sum + p.total_amount, 0).toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active IUPs</p>
              <p className="text-2xl font-bold">{iupCompanies.length}</p>
            </div>
            <Building className="w-8 h-8 text-purple-600" />
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
              placeholder="Search purchases..."
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
              <option key={commodity.value} value={commodity.value}>
                {commodity.label}
              </option>
            ))}
          </select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Purchase Form */}
      {showForm && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {editingPurchase ? 'Edit Purchase' : 'New Purchase from IUP'}
            </h2>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingPurchase(null); reset(); }}>
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* IUP Company Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">IUP Company *</label>
                <select
                  {...register("iup_company", { required: "IUP Company is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select IUP Company</option>
                  {iupCompanies.map(company => (
                    <option key={company.id} value={company.company_name}>
                      {company.company_name} - {company.location}
                    </option>
                  ))}
                </select>
                {errors.iup_company && (
                  <p className="text-red-600 text-sm mt-1">{errors.iup_company.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">IUP License Number *</label>
                <input
                  type="text"
                  {...register("iup_license_number", { required: "License number is required" })}
                  placeholder="e.g., IUP-001234-2023"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.iup_license_number && (
                  <p className="text-red-600 text-sm mt-1">{errors.iup_license_number.message}</p>
                )}
              </div>
            </div>

            {/* Commodity Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <DynamicDropdown
                  label="Commodity"
                  options={commodities}
                  value={watch('commodity') || ''}
                  onChange={(value) => setValue('commodity', value)}
                  placeholder="Select or add commodity..."
                  allowCustom={true}
                  customLabel="Add Custom Commodity"
                  onAddCustom={handleAddCustomCommodity}
                  category="Minerals"
                  required={true}
                  className="w-full"
                />
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

            {/* Price & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="block text-sm font-medium mb-2">Total Amount (USD)</label>
                <input
                  type="text"
                  value={`$${totalAmount.toLocaleString()}`}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Purchase Date *</label>
                <input
                  type="date"
                  {...register("purchase_date", { required: "Purchase date is required" })}
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.purchase_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.purchase_date.message}</p>
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
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Source Location *</label>
                <input
                  type="text"
                  {...register("source_location", { required: "Source location is required" })}
                  placeholder="e.g., Balikpapan, Kalimantan Timur"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.source_location && (
                  <p className="text-red-600 text-sm mt-1">{errors.source_location.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Loading Port *</label>
                <input
                  type="text"
                  {...register("loading_port", { required: "Loading port is required" })}
                  placeholder="e.g., Port of Balikpapan"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.loading_port && (
                  <p className="text-red-600 text-sm mt-1">{errors.loading_port.message}</p>
                )}
              </div>
            </div>

            {/* Quality Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Quality Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium mb-2">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("moisture_content")}
                    placeholder="e.g., 30"
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

                <div>
                  <label className="block text-sm font-medium mb-2">Impurities</label>
                  <input
                    type="text"
                    {...register("impurities")}
                    placeholder="e.g., <5% SiO2"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Contract Terms */}
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
                onClick={() => { setShowForm(false); setEditingPurchase(null); reset(); }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'Saving...' : editingPurchase ? 'Update Purchase' : 'Create Purchase'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Purchases List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Purchase Orders</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading purchases...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No purchases found</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="mt-4"
            >
              Create First Purchase
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Purchase No.</th>
                  <th className="text-left py-3">IUP Company</th>
                  <th className="text-left py-3">Commodity</th>
                  <th className="text-left py-3">Quantity</th>
                  <th className="text-left py-3">Unit Price</th>
                  <th className="text-left py-3">Total</th>
                  <th className="text-left py-3">Delivery Date</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{purchase.purchase_number}</td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{purchase.iup_company}</p>
                        <p className="text-sm text-gray-600">{purchase.iup_license_number}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{purchase.commodity}</p>
                        <p className="text-sm text-gray-600">{purchase.grade}</p>
                      </div>
                    </td>
                    <td className="py-3">{purchase.quantity.toLocaleString()} {purchase.unit}</td>
                    <td className="py-3">${purchase.unit_price.toLocaleString()}</td>
                    <td className="py-3 font-medium">${purchase.total_amount.toLocaleString()}</td>
                    <td className="py-3">{new Date(purchase.delivery_date).toLocaleDateString()}</td>
                    <td className="py-3">{getStatusBadge(purchase.status)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(purchase)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPurchaseToDelete(purchase);
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
              Are you sure you want to delete purchase &quot;{purchaseToDelete?.purchase_number}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPurchaseToDelete(null);
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
