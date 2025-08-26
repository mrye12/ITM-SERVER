'use client'

import { useState, useEffect } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'

import { 
  Users, 
  UserPlus, 
  Calendar, 
  DollarSign, 
  Clock,
  TrendingUp,
  Download,
  Edit2,
  Trash2,
  Search,

} from 'lucide-react'

interface Employee {
  id: string
  employee_id: string
  full_name: string
  email: string
  phone?: string
  department_id?: string
  position?: string
  hire_date?: string
  salary?: number
  status: 'active' | 'inactive' | 'terminated'
  emergency_contact?: any
  created_at: string
}

interface Department {
  id: string
  name: string
  code: string
  manager_id?: string
  budget_limit?: number
  cost_center?: string
  location?: string
}

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  total_hours?: number
  overtime_hours?: number
  status: 'present' | 'absent' | 'late' | 'sick' | 'leave' | 'holiday'
  notes?: string
}

interface EmployeeForm {
  employee_id: string
  full_name: string
  email: string
  phone?: string
  department_id?: string
  position?: string
  hire_date?: string
  salary?: number
  status: 'active' | 'inactive' | 'terminated'
}

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll' | 'leaves'>('employees')
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  // Real-time data hooks
  const { data: employees, loading: employeesLoading, insert: insertEmployee, update: updateEmployee, remove: removeEmployee } = useRealtimeTable<Employee>({
    table: 'employee_profiles',
    orderBy: { column: 'created_at', ascending: false }
  })

  const { data: departments } = useRealtimeTable<Department>({
    table: 'departments',
    orderBy: { column: 'name', ascending: true }
  })

  const { data: attendanceRecords } = useRealtimeTable<AttendanceRecord>({
    table: 'attendance_records',
    orderBy: { column: 'date', ascending: false }
  })

  // Form handling
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    hire_date: '',
    salary: 0,
    status: 'active'
  })

  // Auto-generate employee ID
  useEffect(() => {
    if (!editingEmployee && employees && employees.length > 0) {
      const maxId = Math.max(...employees.map(emp => 
        parseInt(emp.employee_id.replace('EMP-', '')) || 0
      ))
      setEmployeeForm(prev => ({
        ...prev,
        employee_id: `EMP-${String(maxId + 1).padStart(4, '0')}`
      }))
    }
  }, [employees, editingEmployee])

  // Pre-fill form for editing
  useEffect(() => {
    if (editingEmployee) {
      setEmployeeForm({
        employee_id: editingEmployee.employee_id,
        full_name: editingEmployee.full_name,
        email: editingEmployee.email,
        phone: editingEmployee.phone || '',
        department_id: editingEmployee.department_id || '',
        position: editingEmployee.position || '',
        hire_date: editingEmployee.hire_date?.split('T')[0] || '',
        salary: editingEmployee.salary || 0,
        status: editingEmployee.status
      })
    }
  }, [editingEmployee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const employeeData = {
        ...employeeForm,
        salary: employeeForm.salary ? parseFloat(employeeForm.salary.toString()) : undefined,
        hire_date: employeeForm.hire_date || undefined
      }

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData)
        toast.success("Employee updated successfully")
      } else {
        await insertEmployee(employeeData)
        toast.success("Employee added successfully")
      }

      setShowEmployeeForm(false)
      setEditingEmployee(null)
      setEmployeeForm({
        employee_id: '',
        full_name: '',
        email: '',
        phone: '',
        department_id: '',
        position: '',
        hire_date: '',
        salary: 0,
        status: 'active'
      })
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error("Failed to save employee")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowEmployeeForm(true)
  }

  const handleDelete = async () => {
    if (!employeeToDelete) return

    try {
      await removeEmployee(employeeToDelete.id)
      toast.success("Employee deleted successfully")
      setShowDeleteModal(false)
      setEmployeeToDelete(null)
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error("Failed to delete employee")
    }
  }

  const handleStatusUpdate = async (employee: Employee, newStatus: string) => {
    try {
      await updateEmployee(employee.id, { status: newStatus as 'active' | 'inactive' | 'terminated' })
      toast.success("Employee status updated")
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error("Failed to update status")
    }
  }

  // Filter employees
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  // Calculate statistics
  const stats = {
    totalEmployees: employees?.length || 0,
    activeEmployees: employees?.filter(emp => emp.status === 'active').length || 0,
    totalDepartments: departments?.length || 0,
    presentToday: attendanceRecords?.filter(att => 
      att.date === new Date().toISOString().split('T')[0] && att.status === 'present'
    ).length || 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-yellow-100 text-yellow-800'
      case 'terminated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Employee ID', 'Full Name', 'Email', 'Position', 'Department', 'Status', 'Hire Date'],
      ...filteredEmployees.map(emp => [
        emp.employee_id,
        emp.full_name,
        emp.email,
        emp.position || '',
        departments?.find(dept => dept.id === emp.department_id)?.name || '',
        emp.status,
        emp.hire_date?.split('T')[0] || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Human Resources</h1>
          <p className="text-gray-600 mt-1">Manage employees, attendance, and payroll</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowEmployeeForm(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'employees', label: 'Employees', icon: Users },
            { key: 'attendance', label: 'Attendance', icon: Clock },
            { key: 'payroll', label: 'Payroll', icon: DollarSign },
            { key: 'leaves', label: 'Leave Management', icon: Calendar }
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
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search employees..."
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
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hire Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading employees...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{employee.employee_id}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.position || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {departments?.find(dept => dept.id === employee.department_id)?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={employee.status}
                            onChange={(e) => handleStatusUpdate(employee, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(employee.status)}`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="terminated">Terminated</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(employee)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => {
                                setEmployeeToDelete(employee)
                                setShowDeleteModal(true)
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
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

      {/* Employee Form Modal */}
      <Modal
        isOpen={showEmployeeForm}
        onClose={() => {
          setShowEmployeeForm(false)
          setEditingEmployee(null)
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <Input
                type="text"
                value={employeeForm.employee_id}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, employee_id: e.target.value }))}
                required
                disabled={!!editingEmployee}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                value={employeeForm.full_name}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                type="text"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={employeeForm.department_id}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, department_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments?.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Input
                type="text"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date
              </label>
              <Input
                type="date"
                value={employeeForm.hire_date}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, hire_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Salary (USD)
              </label>
              <Input
                type="number"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEmployeeForm(false)
                setEditingEmployee(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Employee"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete employee &quot;{employeeToDelete?.full_name}&quot;? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Employee
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

