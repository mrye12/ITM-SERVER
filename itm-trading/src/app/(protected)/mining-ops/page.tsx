'use client'

import { useState, useEffect } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'

import { 
  MapPin, 
  Mountain, 
  FileText, 



  Activity,
  Gauge,
  Layers,
  Shield,
  Download,
  Plus,
  Edit2,

  Search,

} from 'lucide-react'

interface MiningConcession {
  id: string
  concession_name: string
  license_number: string
  concession_type: 'exploration' | 'exploitation' | 'processing'
  location: any
  area_hectares: number
  commodity_types: string[]
  owner_company: string
  license_issued?: string
  license_expiry: string
  production_capacity?: number
  current_production?: number
  environmental_permit?: string
  environmental_status?: string
  status: 'active' | 'suspended' | 'expired' | 'revoked'
  notes?: string
  created_at: string
}

interface GeologicalSurvey {
  id: string
  concession_id: string
  survey_date: string
  survey_type: string
  findings: any
  estimated_reserves?: number
  grade_average: any
  surveyor_company: string
  report_file_path?: string
  created_at: string
}

interface EnvironmentalMonitoring {
  id: string
  concession_id: string
  monitoring_date: string
  water_quality: any
  air_quality: any
  noise_level?: number
  dust_level?: number
  compliance_status: string
  remediation_required: boolean
  remediation_plan?: string
  created_at: string
}

interface ConcessionForm {
  concession_name: string
  license_number: string
  concession_type: 'exploration' | 'exploitation' | 'processing'
  location: {
    province: string
    regency: string
    coordinates: string
  }
  area_hectares: number
  commodity_types: string[]
  owner_company: string
  license_issued?: string
  license_expiry: string
  production_capacity?: number
  environmental_permit?: string
  environmental_status?: string
  status: 'active' | 'suspended' | 'expired' | 'revoked'
  notes?: string
}

interface SurveyForm {
  concession_id: string
  survey_date: string
  survey_type: string
  findings: {
    geological_formation: string
    mineral_deposits: string
    exploration_method: string
  }
  estimated_reserves?: number
  grade_average: {
    primary_mineral: number
    secondary_minerals: string
  }
  surveyor_company: string
}

interface MonitoringForm {
  concession_id: string
  monitoring_date: string
  water_quality: {
    ph_level: number
    dissolved_oxygen: number
    turbidity: number
    heavy_metals: string
  }
  air_quality: {
    pm25: number
    pm10: number
    co2_level: number
    particulate_matter: number
  }
  noise_level?: number
  dust_level?: number
  compliance_status: string
  remediation_required: boolean
  remediation_plan?: string
}

export default function MiningOperationsPage() {
  const [activeTab, setActiveTab] = useState<'concessions' | 'surveys' | 'environmental' | 'reports'>('concessions')
  const [showConcessionForm, setShowConcessionForm] = useState(false)
  const [showSurveyForm, setShowSurveyForm] = useState(false)
  const [showMonitoringForm, setShowMonitoringForm] = useState(false)
  const [editingConcession, setEditingConcession] = useState<MiningConcession | null>(null)
  const [editingSurvey, setEditingSurvey] = useState<GeologicalSurvey | null>(null)
  const [editingMonitoring, setEditingMonitoring] = useState<EnvironmentalMonitoring | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  // Real-time data hooks
  const { data: concessions, loading: concessionsLoading, insert: insertConcession, update: updateConcession, remove: removeConcession } = useRealtimeTable<MiningConcession>({
    table: 'mining_concessions',
    orderBy: { column: 'created_at', ascending: false }
  })

  const { data: surveys, insert: insertSurvey, update: updateSurvey } = useRealtimeTable<GeologicalSurvey>({
    table: 'geological_surveys',
    orderBy: { column: 'survey_date', ascending: false }
  })

  const { data: monitoring, insert: insertMonitoring, update: updateMonitoring } = useRealtimeTable<EnvironmentalMonitoring>({
    table: 'environmental_monitoring',
    orderBy: { column: 'monitoring_date', ascending: false }
  })

  // Form states
  const [concessionForm, setConcessionForm] = useState<ConcessionForm>({
    concession_name: '',
    license_number: '',
    concession_type: 'exploration',
    location: {
      province: '',
      regency: '',
      coordinates: ''
    },
    area_hectares: 0,
    commodity_types: [],
    owner_company: '',
    license_issued: '',
    license_expiry: '',
    production_capacity: 0,
    environmental_permit: '',
    environmental_status: 'compliant',
    status: 'active',
    notes: ''
  })

  const [surveyForm, setSurveyForm] = useState<SurveyForm>({
    concession_id: '',
    survey_date: '',
    survey_type: 'exploration',
    findings: {
      geological_formation: '',
      mineral_deposits: '',
      exploration_method: ''
    },
    estimated_reserves: 0,
    grade_average: {
      primary_mineral: 0,
      secondary_minerals: ''
    },
    surveyor_company: ''
  })

  const [monitoringForm, setMonitoringForm] = useState<MonitoringForm>({
    concession_id: '',
    monitoring_date: '',
    water_quality: {
      ph_level: 7.0,
      dissolved_oxygen: 8.0,
      turbidity: 1.0,
      heavy_metals: ''
    },
    air_quality: {
      pm25: 15,
      pm10: 25,
      co2_level: 400,
      particulate_matter: 50
    },
    noise_level: 45,
    dust_level: 10,
    compliance_status: 'compliant',
    remediation_required: false,
    remediation_plan: ''
  })

  // Auto-generate license number
  useEffect(() => {
    if (!editingConcession && concessions && concessions.length > 0) {
      const maxId = Math.max(...concessions.map(con => 
        parseInt(con.license_number.replace(/\D/g, '')) || 0
      ))
      setConcessionForm(prev => ({
        ...prev,
        license_number: `IUP-${String(maxId + 1).padStart(6, '0')}`
      }))
    }
  }, [concessions, editingConcession])

  // Pre-fill forms for editing
  useEffect(() => {
    if (editingConcession) {
      setConcessionForm({
        concession_name: editingConcession.concession_name,
        license_number: editingConcession.license_number,
        concession_type: editingConcession.concession_type,
        location: editingConcession.location || { province: '', regency: '', coordinates: '' },
        area_hectares: editingConcession.area_hectares,
        commodity_types: editingConcession.commodity_types || [],
        owner_company: editingConcession.owner_company,
        license_issued: editingConcession.license_issued?.split('T')[0] || '',
        license_expiry: editingConcession.license_expiry.split('T')[0],
        production_capacity: editingConcession.production_capacity || 0,
        environmental_permit: editingConcession.environmental_permit || '',
        environmental_status: editingConcession.environmental_status || 'compliant',
        status: editingConcession.status,
        notes: editingConcession.notes || ''
      })
    }
  }, [editingConcession])

  const handleConcessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const concessionData = {
        ...concessionForm,
        commodity_types: Array.isArray(concessionForm.commodity_types) 
          ? concessionForm.commodity_types 
          : [concessionForm.commodity_types].filter(Boolean),
        license_issued: concessionForm.license_issued || undefined,
        production_capacity: concessionForm.production_capacity || undefined,
        environmental_permit: concessionForm.environmental_permit || undefined,
        environmental_status: concessionForm.environmental_status || undefined,
        notes: concessionForm.notes || undefined
      }

      if (editingConcession) {
        await updateConcession(editingConcession.id, concessionData)
        toast.success("Mining concession updated successfully")
      } else {
        await insertConcession(concessionData)
        toast.success("Mining concession created successfully")
      }

      setShowConcessionForm(false)
      setEditingConcession(null)
    } catch (error) {
      console.error('Error saving concession:', error)
      toast.error("Failed to save mining concession")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const surveyData = {
        ...surveyForm,
        estimated_reserves: surveyForm.estimated_reserves || undefined
      }

      if (editingSurvey) {
        await updateSurvey(editingSurvey.id, surveyData)
        toast.success("Geological survey updated successfully")
      } else {
        await insertSurvey(surveyData)
        toast.success("Geological survey recorded successfully")
      }

      setShowSurveyForm(false)
      setEditingSurvey(null)
    } catch (error) {
      console.error('Error saving survey:', error)
      toast.error("Failed to save geological survey")
    } finally {
      setSubmitting(false)
    }
  }

  const handleMonitoringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const monitoringData = {
        ...monitoringForm,
        noise_level: monitoringForm.noise_level || undefined,
        dust_level: monitoringForm.dust_level || undefined,
        remediation_plan: monitoringForm.remediation_plan || undefined
      }

      if (editingMonitoring) {
        await updateMonitoring(editingMonitoring.id, monitoringData)
        toast.success("Environmental monitoring updated successfully")
      } else {
        await insertMonitoring(monitoringData)
        toast.success("Environmental monitoring recorded successfully")
      }

      setShowMonitoringForm(false)
      setEditingMonitoring(null)
    } catch (error) {
      console.error('Error saving monitoring:', error)
      toast.error("Failed to save environmental monitoring")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter data
  const filteredConcessions = concessions?.filter(concession => {
    const matchesSearch = concession.concession_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         concession.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         concession.owner_company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || concession.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  // Calculate statistics
  const stats = {
    totalConcessions: concessions?.length || 0,
    activeConcessions: concessions?.filter(con => con.status === 'active').length || 0,
    totalArea: concessions?.reduce((sum, con) => sum + con.area_hectares, 0) || 0,
    totalProduction: concessions?.reduce((sum, con) => sum + (con.current_production || 0), 0) || 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'suspended': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'revoked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800'
      case 'non_compliant': return 'bg-red-100 text-red-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const commodityOptions = ['Coal', 'Nickel', 'Iron Ore', 'Bauxite', 'Copper', 'Gold', 'Silver', 'Tin', 'Lead', 'Zinc']
  const indonesianProvinces = [
    'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten', 'Yogyakarta',
    'Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Riau', 'Kepulauan Riau',
    'Jambi', 'Bengkulu', 'Lampung', 'Bangka Belitung', 'Aceh',
    'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
    'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
    'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
    'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan'
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mining Operations</h1>
          <p className="text-gray-600 mt-1">Manage concessions, surveys, and environmental monitoring</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {/* TODO: Export functionality */}}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button
            onClick={() => setShowConcessionForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Concession
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mountain className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Concessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConcessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Concessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeConcessions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Area</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalArea.toLocaleString()}</p>
              <p className="text-xs text-gray-500">hectares</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Gauge className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Production</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProduction.toLocaleString()}</p>
              <p className="text-xs text-gray-500">MT/month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'concessions', label: 'Concessions', icon: Mountain },
            { key: 'surveys', label: 'Geological Surveys', icon: Layers },
            { key: 'environmental', label: 'Environmental', icon: Shield },
            { key: 'reports', label: 'Reports & Analytics', icon: FileText }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'concessions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search concessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {/* Concessions Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Concession
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area & Commodities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Production
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {concessionsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Loading concessions...
                      </td>
                    </tr>
                  ) : filteredConcessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No concessions found
                      </td>
                    </tr>
                  ) : (
                    filteredConcessions.map((concession) => (
                      <tr key={concession.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {concession.concession_name}
                            </div>
                            <div className="text-sm text-gray-500">{concession.license_number}</div>
                            <div className="text-sm text-gray-500">{concession.owner_company}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                              {concession.concession_type}
                            </span>
                            <div className="text-sm text-gray-500 mt-1">
                              {typeof concession.location === 'string' 
                                ? JSON.parse(concession.location).province 
                                : concession.location?.province || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {concession.area_hectares.toLocaleString()} ha
                            </div>
                            <div className="text-xs text-gray-500">
                              {Array.isArray(concession.commodity_types) 
                                ? concession.commodity_types.join(', ')
                                : typeof concession.commodity_types === 'string'
                                ? JSON.parse(concession.commodity_types).join(', ')
                                : 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{(concession.current_production || 0).toLocaleString()} MT</div>
                            <div className="text-xs text-gray-500">
                              Cap: {(concession.production_capacity || 0).toLocaleString()} MT
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(concession.status)}`}>
                            {concession.status}
                          </span>
                          {concession.environmental_status && (
                            <div className="mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${getComplianceColor(concession.environmental_status)}`}>
                                {concession.environmental_status.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(concession.license_expiry).toLocaleDateString()}
                          {new Date(concession.license_expiry) < new Date() && (
                            <div className="text-xs text-red-600 font-medium">EXPIRED</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setEditingConcession(concession)
                                setShowConcessionForm(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Other tab contents would go here... */}

      {/* Concession Form Modal */}
      <Modal
        isOpen={showConcessionForm}
        onClose={() => {
          setShowConcessionForm(false)
          setEditingConcession(null)
        }}
        title={editingConcession ? 'Edit Mining Concession' : 'Add Mining Concession'}
      >
        <form onSubmit={handleConcessionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concession Name
              </label>
              <Input
                type="text"
                value={concessionForm.concession_name}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, concession_name: e.target.value }))}
                required
                placeholder="e.g., Kalimantan Coal Mine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <Input
                type="text"
                value={concessionForm.license_number}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, license_number: e.target.value }))}
                required
                disabled={!!editingConcession}
                placeholder="IUP-000001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concession Type
              </label>
              <select
                value={concessionForm.concession_type}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, concession_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="exploration">Exploration</option>
                <option value="exploitation">Exploitation</option>
                <option value="processing">Processing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select
                value={concessionForm.location.province}
                onChange={(e) => setConcessionForm(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, province: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Province</option>
                {indonesianProvinces.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regency/City
              </label>
              <Input
                type="text"
                value={concessionForm.location.regency}
                onChange={(e) => setConcessionForm(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, regency: e.target.value }
                }))}
                required
                placeholder="e.g., Kutai Kartanegara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinates
              </label>
              <Input
                type="text"
                value={concessionForm.location.coordinates}
                onChange={(e) => setConcessionForm(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, coordinates: e.target.value }
                }))}
                placeholder="e.g., -0.5317, 117.1536"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (Hectares)
              </label>
              <Input
                type="number"
                value={concessionForm.area_hectares}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, area_hectares: parseFloat(e.target.value) || 0 }))}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Company
              </label>
              <Input
                type="text"
                value={concessionForm.owner_company}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, owner_company: e.target.value }))}
                required
                placeholder="e.g., PT. Mining Indonesia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Issued
              </label>
              <Input
                type="date"
                value={concessionForm.license_issued}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, license_issued: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Expiry
              </label>
              <Input
                type="date"
                value={concessionForm.license_expiry}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, license_expiry: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Production Capacity (MT/month)
              </label>
              <Input
                type="number"
                value={concessionForm.production_capacity}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, production_capacity: parseFloat(e.target.value) || 0 }))}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={concessionForm.status}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commodity Types
              </label>
              <div className="grid grid-cols-3 gap-2 p-3 border border-gray-300 rounded-lg">
                {commodityOptions.map(commodity => (
                  <label key={commodity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={concessionForm.commodity_types.includes(commodity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConcessionForm(prev => ({
                            ...prev,
                            commodity_types: [...prev.commodity_types, commodity]
                          }))
                        } else {
                          setConcessionForm(prev => ({
                            ...prev,
                            commodity_types: prev.commodity_types.filter(c => c !== commodity)
                          }))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{commodity}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environmental Permit
              </label>
              <Input
                type="text"
                value={concessionForm.environmental_permit}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, environmental_permit: e.target.value }))}
                placeholder="Environmental permit number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={concessionForm.notes}
                onChange={(e) => setConcessionForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes or comments"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConcessionForm(false)
                setEditingConcession(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingConcession ? 'Update Concession' : 'Create Concession'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

