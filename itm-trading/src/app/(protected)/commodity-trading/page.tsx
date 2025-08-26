'use client'

import { useState, useEffect } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Package,

  Target,
  Activity,

  RefreshCw,
  Plus,
  Edit2,

  Search,

} from 'lucide-react'

interface CommodityPrice {
  id: string
  commodity_code: string
  commodity_name: string
  exchange: string
  price_usd: number
  price_change: number
  price_change_percent: number
  volume: number
  price_date: string
  session: string
  currency: string
  unit: string
  grade?: string
  source: string
}

interface TradingPosition {
  id: string
  position_id: string
  commodity_id: string
  contract_type: 'spot' | 'forward' | 'futures'
  position_type: 'long' | 'short'
  quantity: number
  entry_price: number
  current_price?: number
  unrealized_pnl?: number
  margin_required?: number
  delivery_month?: string
  delivery_location?: string
  counterparty?: string
  trader_id?: string
  status: 'open' | 'closed' | 'delivered' | 'settled'
  opened_at: string
}

interface QualityTest {
  id: string
  sample_id: string
  commodity_id: string
  shipment_id?: string
  lot_number?: string
  test_date: string
  lab_name: string
  lab_certificate_number?: string
  test_type: string
  test_results: Record<string, unknown>
  moisture_content?: number
  passed: boolean
  grade_achieved?: string
  remarks?: string
}

interface PriceForm {
  commodity_code: string
  commodity_name: string
  exchange: string
  price_usd: number
  volume: number
  session: string
  grade?: string
}

interface PositionForm {
  position_id: string
  commodity_id: string
  contract_type: 'spot' | 'forward' | 'futures'
  position_type: 'long' | 'short'
  quantity: number
  entry_price: number
  delivery_month?: string
  delivery_location?: string
  counterparty?: string
}

export default function CommodityTradingPage() {
  const [activeTab, setActiveTab] = useState<'prices' | 'positions' | 'quality' | 'analysis'>('prices')
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [showPositionForm, setShowPositionForm] = useState(false)
  const [editingPrice, setEditingPrice] = useState<CommodityPrice | null>(null)
  const [editingPosition, setEditingPosition] = useState<TradingPosition | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [exchangeFilter, setExchangeFilter] = useState<string>('all')
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  // Real-time data hooks
  const { data: commodityPrices, loading: pricesLoading, insert: insertPrice, update: updatePrice } = useRealtimeTable<CommodityPrice>({
    table: 'commodity_prices',
    orderBy: { column: 'price_date', ascending: false }
  })

  const { data: tradingPositions, loading: positionsLoading, insert: insertPosition, update: updatePosition } = useRealtimeTable<TradingPosition>({
    table: 'trading_positions',
    orderBy: { column: 'opened_at', ascending: false }
  })

  const { data: qualityTests } = useRealtimeTable<QualityTest>({
    table: 'quality_tests',
    orderBy: { column: 'test_date', ascending: false }
  })

  const { data: commodities } = useRealtimeTable({
    table: 'commodities',
    orderBy: { column: 'name', ascending: true }
  })

  // Form states
  const [priceForm, setPriceForm] = useState<PriceForm>({
    commodity_code: '',
    commodity_name: '',
    exchange: 'LME',
    price_usd: 0,
    volume: 0,
    session: 'Close',
    grade: ''
  })

  const [positionForm, setPositionForm] = useState<PositionForm>({
    position_id: '',
    commodity_id: '',
    contract_type: 'spot',
    position_type: 'long',
    quantity: 0,
    entry_price: 0,
    delivery_month: '',
    delivery_location: '',
    counterparty: ''
  })

  // Auto-generate position ID
  useEffect(() => {
    if (!editingPosition && tradingPositions && tradingPositions.length > 0) {
      const maxId = Math.max(...tradingPositions.map(pos => 
        parseInt(pos.position_id.replace('POS-', '')) || 0
      ))
      setPositionForm(prev => ({
        ...prev,
        position_id: `POS-${String(maxId + 1).padStart(6, '0')}`
      }))
    }
  }, [tradingPositions, editingPosition])

  // Pre-fill forms for editing
  useEffect(() => {
    if (editingPrice) {
      setPriceForm({
        commodity_code: editingPrice.commodity_code,
        commodity_name: editingPrice.commodity_name,
        exchange: editingPrice.exchange,
        price_usd: editingPrice.price_usd,
        volume: editingPrice.volume,
        session: editingPrice.session,
        grade: editingPrice.grade || ''
      })
    }
  }, [editingPrice])

  useEffect(() => {
    if (editingPosition) {
      setPositionForm({
        position_id: editingPosition.position_id,
        commodity_id: editingPosition.commodity_id,
        contract_type: editingPosition.contract_type,
        position_type: editingPosition.position_type,
        quantity: editingPosition.quantity,
        entry_price: editingPosition.entry_price,
        delivery_month: editingPosition.delivery_month || '',
        delivery_location: editingPosition.delivery_location || '',
        counterparty: editingPosition.counterparty || ''
      })
    }
  }, [editingPosition])

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const priceData = {
        ...priceForm,
        price_date: new Date().toISOString(),
        currency: 'USD',
        unit: 'MT',
        source: 'Manual Entry',
        price_change: 0,
        price_change_percent: 0
      }

      if (editingPrice) {
        await updatePrice(editingPrice.id, priceData)
        toast.success("Commodity price updated successfully")
      } else {
        await insertPrice(priceData)
        toast.success("Commodity price added successfully")
      }

      setShowPriceForm(false)
      setEditingPrice(null)
    } catch (error) {
      console.error('Error saving price:', error)
      toast.error("Failed to save commodity price")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const positionData = {
        ...positionForm,
        opened_at: new Date().toISOString(),
        status: 'open' as const
      }

      if (editingPosition) {
        await updatePosition(editingPosition.id, positionData)
        toast.success("Trading position updated successfully")
      } else {
        await insertPosition(positionData)
        toast.success("Trading position created successfully")
      }

      setShowPositionForm(false)
      setEditingPosition(null)
    } catch (error) {
      console.error('Error saving position:', error)
      toast.error("Failed to save trading position")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter data
  const filteredPrices = commodityPrices?.filter(price => {
    const matchesSearch = price.commodity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.commodity_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesExchange = exchangeFilter === 'all' || price.exchange === exchangeFilter
    return matchesSearch && matchesExchange
  }) || []

  const filteredPositions = tradingPositions?.filter(position => {
    const commodity = commodities?.find(c => c.id === position.commodity_id)
    const matchesSearch = commodity?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.position_id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  // Calculate statistics
  const stats = {
    totalPrices: commodityPrices?.length || 0,
    activePositions: tradingPositions?.filter(pos => pos.status === 'open').length || 0,
    totalVolume: commodityPrices?.reduce((sum, price) => sum + price.volume, 0) || 0,
    passedTests: qualityTests?.filter(test => test.passed).length || 0
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPositionTypeColor = (type: string) => {
    return type === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const exchanges = ['LME', 'SHFE', 'CME', 'COMEX', 'ICE']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commodity Trading</h1>
          <p className="text-gray-600 mt-1">Real-time pricing, positions, and quality management</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Prices
          </Button>
          <Button
            onClick={() => setShowPriceForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Price
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Prices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPrices}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Positions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activePositions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVolume.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Passed Tests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.passedTests}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'prices', label: 'Market Prices', icon: DollarSign },
            { key: 'positions', label: 'Trading Positions', icon: Target },
            { key: 'quality', label: 'Quality Tests', icon: Package },
            { key: 'analysis', label: 'Market Analysis', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'pricing' | 'positions' | 'quality' | 'analysis')}
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
      {activeTab === 'prices' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search commodities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={exchangeFilter}
                onChange={(e) => setExchangeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Exchanges</option>
                {exchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prices Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commodity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exchange
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Update
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pricesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Loading prices...
                      </td>
                    </tr>
                  ) : filteredPrices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No prices found
                      </td>
                    </tr>
                  ) : (
                    filteredPrices.map((price) => (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {price.commodity_name}
                            </div>
                            <div className="text-sm text-gray-500">{price.commodity_code}</div>
                            {price.grade && (
                              <div className="text-xs text-gray-400">{price.grade}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {price.exchange}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                            {price.price_usd.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">per {price.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center text-sm ${getPriceChangeColor(price.price_change)}`}>
                            {price.price_change > 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : price.price_change < 0 ? (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            ) : null}
                            <span>
                              {price.price_change > 0 ? '+' : ''}{price.price_change.toFixed(2)}
                            </span>
                          </div>
                          <div className={`text-xs ${getPriceChangeColor(price.price_change_percent)}`}>
                            ({price.price_change_percent > 0 ? '+' : ''}{price.price_change_percent.toFixed(2)}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {price.volume.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(price.price_date).toLocaleDateString()}
                          <div className="text-xs text-gray-500">{price.session}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setEditingPrice(price)
                                setShowPriceForm(true)
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

      {activeTab === 'positions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowPositionForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Position
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commodity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positionsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Loading positions...
                      </td>
                    </tr>
                  ) : filteredPositions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No positions found
                      </td>
                    </tr>
                  ) : (
                    filteredPositions.map((position) => {
                      const commodity = commodities?.find(c => c.id === position.commodity_id)
                      return (
                        <tr key={position.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {position.position_id}
                            </div>
                            <div className="text-sm text-gray-500">{position.contract_type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {commodity?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPositionTypeColor(position.position_type)}`}>
                              {position.position_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {position.quantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${position.entry_price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={position.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setEditingPosition(position)
                                  setShowPositionForm(true)
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
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Price Form Modal */}
      <Modal
        isOpen={showPriceForm}
        onClose={() => {
          setShowPriceForm(false)
          setEditingPrice(null)
        }}
        title={editingPrice ? 'Edit Commodity Price' : 'Add Commodity Price'}
      >
        <form onSubmit={handlePriceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commodity Code
              </label>
              <Input
                type="text"
                value={priceForm.commodity_code}
                onChange={(e) => setPriceForm(prev => ({ ...prev, commodity_code: e.target.value }))}
                required
                placeholder="e.g., NI-3M"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commodity Name
              </label>
              <Input
                type="text"
                value={priceForm.commodity_name}
                onChange={(e) => setPriceForm(prev => ({ ...prev, commodity_name: e.target.value }))}
                required
                placeholder="e.g., Nickel 3-Month"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exchange
              </label>
              <select
                value={priceForm.exchange}
                onChange={(e) => setPriceForm(prev => ({ ...prev, exchange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {exchanges.map(exchange => (
                  <option key={exchange} value={exchange}>{exchange}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD)
              </label>
              <Input
                type="number"
                value={priceForm.price_usd}
                onChange={(e) => setPriceForm(prev => ({ ...prev, price_usd: parseFloat(e.target.value) || 0 }))}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume
              </label>
              <Input
                type="number"
                value={priceForm.volume}
                onChange={(e) => setPriceForm(prev => ({ ...prev, volume: parseFloat(e.target.value) || 0 }))}
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value={priceForm.session}
                onChange={(e) => setPriceForm(prev => ({ ...prev, session: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AM">AM Session</option>
                <option value="PM">PM Session</option>
                <option value="Close">Close</option>
                <option value="Settlement">Settlement</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade (Optional)
              </label>
              <Input
                type="text"
                value={priceForm.grade}
                onChange={(e) => setPriceForm(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="e.g., Grade A, 99.9% purity"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPriceForm(false)
                setEditingPrice(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingPrice ? 'Update Price' : 'Add Price'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Position Form Modal */}
      <Modal
        isOpen={showPositionForm}
        onClose={() => {
          setShowPositionForm(false)
          setEditingPosition(null)
        }}
        title={editingPosition ? 'Edit Trading Position' : 'Create Trading Position'}
      >
        <form onSubmit={handlePositionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position ID
              </label>
              <Input
                type="text"
                value={positionForm.position_id}
                onChange={(e) => setPositionForm(prev => ({ ...prev, position_id: e.target.value }))}
                required
                disabled={!!editingPosition}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commodity
              </label>
              <select
                value={positionForm.commodity_id}
                onChange={(e) => setPositionForm(prev => ({ ...prev, commodity_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Commodity</option>
                {commodities?.map(commodity => (
                  <option key={commodity.id} value={commodity.id}>{commodity.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Type
              </label>
              <select
                value={positionForm.contract_type}
                onChange={(e) => setPositionForm(prev => ({ ...prev, contract_type: e.target.value as 'spot' | 'forward' | 'futures' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="spot">Spot</option>
                <option value="forward">Forward</option>
                <option value="futures">Futures</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Type
              </label>
              <select
                value={positionForm.position_type}
                onChange={(e) => setPositionForm(prev => ({ ...prev, position_type: e.target.value as 'long' | 'short' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <Input
                type="number"
                value={positionForm.quantity}
                onChange={(e) => setPositionForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Price (USD)
              </label>
              <Input
                type="number"
                value={positionForm.entry_price}
                onChange={(e) => setPositionForm(prev => ({ ...prev, entry_price: parseFloat(e.target.value) || 0 }))}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Month (Optional)
              </label>
              <Input
                type="month"
                value={positionForm.delivery_month}
                onChange={(e) => setPositionForm(prev => ({ ...prev, delivery_month: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Location (Optional)
              </label>
              <Input
                type="text"
                value={positionForm.delivery_location}
                onChange={(e) => setPositionForm(prev => ({ ...prev, delivery_location: e.target.value }))}
                placeholder="e.g., LME Warehouse, Shanghai"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Counterparty (Optional)
              </label>
              <Input
                type="text"
                value={positionForm.counterparty}
                onChange={(e) => setPositionForm(prev => ({ ...prev, counterparty: e.target.value }))}
                placeholder="e.g., JP Morgan, Goldman Sachs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPositionForm(false)
                setEditingPosition(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingPosition ? 'Update Position' : 'Create Position'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

