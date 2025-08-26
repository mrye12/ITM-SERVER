"use client"
import { useState, useEffect } from "react"
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, Users, Calendar } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useToast } from "@/hooks/useToast"

interface Task {
  id: string
  title: string
  description?: string
  task_type: string
  status: string
  priority: string
  assigned_to?: string
  due_date?: string
  completion_percentage: number
  tags?: string[]
  created_at: string
  assigned_user?: {
    id: string
    email: string
    profiles: { full_name: string }[]
  }
  task_comments?: {
    id: string
    content: string
    created_at: string
  }[]
}

interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
  high_priority: number
  urgent: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    high_priority: 0,
    urgent: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, priorityFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter)
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data.tasks || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      toast.success('Task status updated')
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'overdue': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Task Management</h1>
          <p className="text-gray-600">Manage your tasks and workflows efficiently</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{stats.high_priority}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "No tasks match your search criteria." : "Get started by creating your first task."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
            </button>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                        {task.status.replace('_', ' ')}
                      </div>
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    {task.assigned_user && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {task.assigned_user.profiles?.[0]?.full_name || task.assigned_user.email}
                      </div>
                    )}
                    
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(task.due_date)}
                      </div>
                    )}
                    
                    <div>
                      Progress: {task.completion_percentage}%
                    </div>
                    
                    {task.task_comments && task.task_comments.length > 0 && (
                      <div>
                        {task.task_comments.length} comment{task.task_comments.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  
                  <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
