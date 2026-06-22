'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { formatError } from '@/lib/errors'
import { Users, Plus, Search, Shield, UserCheck, UserX, Key, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AdminUser } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function UsersPage() {
  const { data: session, status } = useSession()
  const { data, mutate, isLoading } = useSWR('/api/admin/users', fetcher)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const { toast } = useToast()
  const router = useRouter()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'INSTRUCTOR' as 'ADMIN' | 'INSTRUCTOR',
    isActive: true,
  })

  const [resetFormData, setResetFormData] = useState({
    newPassword: '',
  })

  const isAdmin = session?.user?.role === 'ADMIN'

  const filteredUsers = data?.admins?.filter((u: AdminUser) => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  }) || []

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'User created successfully' })
        setIsAddDialogOpen(false)
        setFormData({ email: '', name: '', password: '', role: 'INSTRUCTOR', isActive: true })
        mutate()
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create user' })
    }
  }

  const handleUpdate = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/admin/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'User updated successfully' })
        setIsEditDialogOpen(false)
        setCurrentUser(null)
        mutate()
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user' })
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.email}?`)) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'User deleted successfully' })
        mutate()
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user' })
    }
  }

  const handleResetPassword = async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/admin/users/${currentUser.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, newPassword: resetFormData.newPassword }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Password reset successfully' })
        setIsResetDialogOpen(false)
        setCurrentUser(null)
        setResetFormData({ newPassword: '' })
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reset password' })
    }
  }

  const handleToggleActive = async (user: AdminUser) => {
    if (user.id === session?.user?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot deactivate your own account' })
      return
    }
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully` })
        mutate()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user' })
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-4 md:p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-500 mt-4">Loading...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-500">Only administrators can access user management.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium mt-1 md:mt-2 text-sm md:text-base">Manage admin and instructor accounts</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ email: '', name: '', password: '', role: 'INSTRUCTOR', isActive: true })
            setIsAddDialogOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40 h-11">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-3 md:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 md:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left p-3 md:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-left p-3 md:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                  <th className="text-left p-3 md:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="text-right p-3 md:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((user: AdminUser) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-3 md:p-4">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm md:text-base">{user.email}</p>
                          {user.name && <p className="text-xs md:text-sm text-slate-500">{user.name}</p>}
                          <div className="flex gap-2 mt-1 sm:hidden">
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                              {user.role}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 md:p-4 hidden sm:table-cell">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3 md:p-4 hidden md:table-cell">
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 md:p-4 text-sm text-slate-500 hidden lg:table-cell">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-3 md:p-4 text-sm text-slate-500 hidden lg:table-cell">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 md:p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentUser(user)
                                setFormData({
                                  email: user.email,
                                  name: user.name || '',
                                  password: '',
                                  role: user.role,
                                  isActive: user.isActive,
                                })
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentUser(user)
                                setResetFormData({ newPassword: '' })
                                setIsResetDialogOpen(true)
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                              {user.isActive ? (
                                <><UserX className="w-4 h-4 mr-2" />Deactivate</>
                              ) : (
                                <><UserCheck className="w-4 h-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new admin or instructor account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'ADMIN' | 'INSTRUCTOR') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'ADMIN' | 'INSTRUCTOR') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset the password for {currentUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={resetFormData.newPassword}
                onChange={(e) => setResetFormData({ newPassword: e.target.value })}
                placeholder="Min. 8 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}