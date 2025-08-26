"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"

// import { supabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { useToast } from "@/hooks/useToast"
import { createUserWithProfile, seedInitialData, bulkCreateUsers, CreateUserData } from "@/lib/adminActions"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_sign_in_at?: string
}

interface UserForm {
  email: string
  password: string
  full_name: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
}

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalSales: number
  totalOrders: number
  totalFiles: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; data?: unknown } | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { toast } = useToast()

  // Mock users data - in real app this would come from Supabase auth.users
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'ilhamyahyaaji@infinitytrademineral.id',
      full_name: 'Ilham Yahya Aji',
      role: 'superadmin',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-12-26T08:00:00Z'
    },
    {
      id: '2',
      email: 'admin@infinitytrademineral.id',
      full_name: 'Admin ITM',
      role: 'admin',
      status: 'active',
      created_at: '2024-01-02T00:00:00Z',
      last_sign_in_at: '2024-12-25T14:30:00Z'
    },
    {
      id: '3',
      email: 'staff1@infinitytrademineral.id',
      full_name: 'Staff Mining',
      role: 'staff',
      status: 'active',
      created_at: '2024-01-03T00:00:00Z',
      last_sign_in_at: '2024-12-24T10:15:00Z'
    }
  ])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserForm>({
    defaultValues: {
      status: 'active',
      role: 'staff'
    }
  })

  // Get system metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // This would normally fetch real data from Supabase
        // For demo, using mock data
        const mockMetrics: SystemMetrics = {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          totalSales: 25,
          totalOrders: 18,
          totalFiles: 42,
          systemHealth: 'healthy'
        }
        
        setMetrics(mockMetrics)
      } catch {
        console.error('Error fetching metrics')
      }
    }

    fetchMetrics()
  }, [users])

  const onSubmit = async (data: UserForm) => {
    try {
      if (editingUser) {
        // Update user
        const updatedUsers = users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...data, password: undefined } // Don't include password in update
            : user
        )
        setUsers(updatedUsers)
        toast.success("User updated successfully")
        setEditingUser(null)
      } else {
        // Create new user
        const newUser: User = {
          id: Date.now().toString(),
          ...data,
          created_at: new Date().toISOString()
        }
        setUsers([...users, newUser])
        toast.success("User created successfully")
      }

      reset({ status: 'active', role: 'staff' })
      setShowUserForm(false)
          } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setValue('email', user.email)
    setValue('full_name', user.full_name)
    setValue('role', user.role)
    setValue('status', user.status)
    setShowUserForm(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    
    try {
      const updatedUsers = users.filter(user => user.id !== userToDelete.id)
      setUsers(updatedUsers)
      
      toast.success("User deleted successfully")
      setShowDeleteModal(false)
      setUserToDelete(null)
          } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const handleStatusToggle = async (userId: string, newStatus: User['status']) => {
    try {
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      )
      setUsers(updatedUsers)
      
      toast.success("User status updated")
          } catch {
      toast.error("Failed to update user status")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      case 'staff': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleCreateSuperAdmin = async () => {
    setLoading(true)
    try {
      const result = await createUserWithProfile({
        email: 'ilhamyahyaaji@infinitytrademineral.id',
        password: '@Bcdefg23',
        full_name: 'Ilham Yahya Aji',
        role: 'superadmin'
      })
      setResult(result)
      toast.success("Superadmin created successfully")
    } catch {
      setResult({ success: false, message: 'Failed to create superadmin' })
      toast.error("Failed to create superadmin")
    }
    setLoading(false)
  }

  const handleCreateSampleUsers = async () => {
    setLoading(true)
    try {
      const sampleUsers: CreateUserData[] = [
        {
          email: 'admin@infinitytrademineral.id',
          password: 'admin123',
          full_name: 'Admin ITM',
          role: 'admin'
        },
        {
          email: 'staff1@infinitytrademineral.id',
          password: 'staff123',
          full_name: 'Staff Mining',
          role: 'staff'
        },
        {
          email: 'staff2@infinitytrademineral.id',
          password: 'staff123',
          full_name: 'Staff Trading',
          role: 'staff'
        }
      ]

      const results = await bulkCreateUsers(sampleUsers)
      setResult({ success: true, data: results })
      toast.success("Sample users created successfully")
    } catch {
      setResult({ success: false, message: 'Failed to create sample users' })
      toast.error("Failed to create sample users")
    }
    setLoading(false)
  }

  const handleSeedInitialData = async () => {
    setLoading(true)
    try {
      const result = await seedInitialData()
      setResult(result)
      toast.success("Initial data seeded successfully")
    } catch {
      setResult({ success: false, message: 'Failed to seed data' })
      toast.error("Failed to seed initial data")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">System Administration</h1>
          <p className="text-gray-600">Manage users, system settings, and data</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setEditingUser(null)
              setShowUserForm(true)
              reset({ status: 'active', role: 'staff' })
            }}
          >
            + Add User
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{metrics.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{metrics.totalSales}</div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{metrics.totalOrders}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">{metrics.totalFiles}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className={`text-2xl font-bold ${metrics.systemHealth === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.systemHealth === 'healthy' ? '✅' : '⚠️'}
            </div>
            <div className="text-sm text-gray-600">System Health</div>
          </div>
        </div>
      )}

      {/* Quick Setup Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">🚀 Quick Setup</h2>
          <div className="space-y-3">
            <Button
              onClick={handleSeedInitialData}
              loading={loading}
              variant="success"
              className="w-full"
            >
              🌱 Seed Basic Data
            </Button>
            <p className="text-sm text-gray-600">
              Initialize basic system data and sample records
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">👤 User Management</h2>
          <div className="space-y-3">
            <Button
              onClick={handleCreateSuperAdmin}
              loading={loading}
              className="w-full"
            >
              👑 Create Superadmin
            </Button>
            <Button
              onClick={handleCreateSampleUsers}
              loading={loading}
              variant="outline"
              className="w-full"
            >
              👥 Create Sample Users
            </Button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">💻 Code-based Management</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Edit data directly in code:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>src/lib/adminActions.ts</code></li>
              <li><code>src/app/(protected)/admin/page.tsx</code></li>
            </ul>
            <p className="text-blue-600 mt-3">
              💡 Changes auto-sync to database!
            </p>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">User Management ({filteredUsers.length})</h2>
            <div className="text-sm text-green-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live user data
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-500">User</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Last Sign In</th>
                <th className="p-3 text-left text-sm font-medium text-gray-500">Created</th>
                <th className="p-3 text-center text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">👤</div>
                    <p>No users found</p>
                    <p className="text-sm">
                      {searchTerm || roleFilter !== 'all' 
                        ? 'Try adjusting your filters'
                        : 'Click "Add User" to create your first user'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusToggle(user.id, e.target.value as User['status'])}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-none ${getStatusColor(user.status)}`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          ✏️ Edit
                        </Button>
                        {user.role !== 'superadmin' && (
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => {
                              setUserToDelete(user)
                              setShowDeleteModal(true)
                            }}
                          >
                            🗑️ Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full border rounded px-3 py-2"
              placeholder="user@infinitytrademineral.id"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              {...register("full_name", { required: "Full name is required" })}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter full name"
            />
            {errors.full_name && (
              <p className="text-red-600 text-sm mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select
              {...register("role", { required: "Role is required" })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
            {errors.role && (
              <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              {...register("status")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUserForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this user?</p>
          {userToDelete && (
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>User:</strong> {userToDelete.full_name}</p>
              <p><strong>Email:</strong> {userToDelete.email}</p>
              <p><strong>Role:</strong> {userToDelete.role}</p>
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

      {/* Result Display */}
      {result && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Operation Result</h3>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
