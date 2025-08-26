"use client"
import { useState, useEffect } from "react"
import { Plus, Search, Play, Pause, Settings, GitBranch, Clock, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useToast } from "@/hooks/useToast"

interface WorkflowStep {
  id: string
  step_order: number
  step_name: string
  step_type: string
  assigned_to_type: string
  assigned_to: string
  duration_hours: number
  is_required: boolean
}

interface Workflow {
  id: string
  name: string
  description?: string
  category: string
  trigger_type: string
  trigger_conditions: Record<string, unknown>
  is_active: boolean
  version: number
  created_at: string
  workflow_steps: WorkflowStep[]
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchWorkflows()
  }, [categoryFilter])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      
      params.append('active', 'true')

      const response = await fetch(`/api/workflows?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }

      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
      toast.error('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflowStatus = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow')
      }

      toast.success(`Workflow ${!isActive ? 'activated' : 'deactivated'}`)
      fetchWorkflows()
    } catch (error) {
      console.error('Error updating workflow:', error)
      toast.error('Failed to update workflow')
    }
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'approval': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-green-100 text-green-800'
      case 'automation': return 'bg-purple-100 text-purple-800'
      case 'notification': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'automatic': return <Play className="h-4 w-4" />
      case 'manual': return <Settings className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'approval': return <CheckCircle className="h-4 w-4" />
      case 'review': return <Search className="h-4 w-4" />
      case 'action': return <Play className="h-4 w-4" />
      case 'notification': return <Settings className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Workflow Management</h1>
          <p className="text-gray-600">Design and manage automated business processes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="approval">Approval</option>
              <option value="review">Review</option>
              <option value="automation">Automation</option>
              <option value="notification">Notification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-6">
        {filteredWorkflows.length === 0 ? (
          <Card className="p-8 text-center">
            <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "No workflows match your search criteria." : "Get started by creating your first workflow."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Workflow
            </button>
          </Card>
        ) : (
          filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                    <Badge className={getCategoryColor(workflow.category)}>
                      {workflow.category}
                    </Badge>
                    <Badge className={workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getTriggerIcon(workflow.trigger_type)}
                      <span className="capitalize">{workflow.trigger_type}</span>
                    </div>
                  </div>
                  
                  {workflow.description && (
                    <p className="text-gray-600 mb-3">{workflow.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Version {workflow.version}</span>
                    <span>{workflow.workflow_steps?.length || 0} steps</span>
                    <span>Created {new Date(workflow.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleWorkflowStatus(workflow.id, workflow.is_active)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      workflow.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {workflow.is_active ? (
                      <>
                        <Pause className="h-4 w-4 inline mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 inline mr-1" />
                        Activate
                      </>
                    )}
                  </button>
                  
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                    <Settings className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                </div>
              </div>

              {/* Workflow Steps */}
              {workflow.workflow_steps && workflow.workflow_steps.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Workflow Steps:</h4>
                  <div className="flex flex-wrap gap-2">
                    {workflow.workflow_steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                            <span className="text-xs font-medium text-gray-600">{step.step_order}</span>
                            {getStepTypeIcon(step.step_type)}
                            <span className="text-sm text-gray-900">{step.step_name}</span>
                            <span className="text-xs text-gray-500">
                              ({step.duration_hours}h)
                            </span>
                          </div>
                          {index < workflow.workflow_steps.length - 1 && (
                            <div className="w-4 h-px bg-gray-300 mx-1"></div>
                          )}
                        </div>
                      ))}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Total estimated time: {workflow.workflow_steps.reduce((total, step) => total + step.duration_hours, 0)} hours
                  </div>
                </div>
              )}

              {/* Trigger Conditions */}
              {workflow.trigger_conditions && Object.keys(workflow.trigger_conditions).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Trigger Conditions:</h5>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(workflow.trigger_conditions, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
