"use client"

import { useState } from "react"
import { type User, attendanceStore } from "@/lib/attendance-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(attendanceStore.getUsers())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<User>>({})
  const [bulkImportText, setBulkImportText] = useState("")

  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Computer Science",
    "Business",
  ]
  const roles = ["user", "manager", "admin"] as const

  const handleAddUser = () => {
    if (!formData.name || !formData.department || !formData.type) {
      alert("Please fill in all required fields")
      return
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      name: formData.name,
      type: formData.type,
      department: formData.department,
      role: formData.role || "user",
      email: formData.email,
      phone: formData.phone,
    }

    attendanceStore.addUser(newUser)
    setUsers(attendanceStore.getUsers())
    setFormData({})
    setShowAddForm(false)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      const updatedUsers = users.filter((u) => u.id !== userId)
      localStorage.setItem("attendance_users", JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
    }
  }

  const handleBulkImport = () => {
    const lines = bulkImportText
      .trim()
      .split("\n")
      .filter((line) => line.trim())
    const newUsers: User[] = []

    lines.forEach((line) => {
      const [name, type, department, role] = line.split(",").map((s) => s.trim())
      if (name && type && department) {
        const newUser: User = {
          id: Math.random().toString(36).substring(7),
          name,
          type: type as "employee" | "student",
          department,
          role: (role || "user") as "user" | "manager" | "admin",
        }
        newUsers.push(newUser)
      }
    })

    newUsers.forEach((user) => attendanceStore.addUser(user))
    setUsers(attendanceStore.getUsers())
    setBulkImportText("")
    alert(`Imported ${newUsers.length} users`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add, edit, and manage users with departments and roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(!showAddForm)} variant="default">
              {showAddForm ? "Cancel" : "Add User"}
            </Button>
            <Button onClick={() => setEditingId(editingId === "bulk" ? null : "bulk")} variant="outline">
              {editingId === "bulk" ? "Cancel Bulk Import" : "Bulk Import"}
            </Button>
          </div>

          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-card">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <select
                value={formData.type || ""}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "employee" | "student" })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select Type</option>
                <option value="employee">Employee</option>
                <option value="student">Student</option>
              </select>
              <select
                value={formData.department || ""}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <select
                value={formData.role || "user"}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <Button onClick={handleAddUser} className="w-full">
                Add User
              </Button>
            </div>
          )}

          {editingId === "bulk" && (
            <div className="border rounded-lg p-4 space-y-4 bg-card">
              <p className="text-sm text-muted-foreground">
                Format: Name, Type (employee/student), Department, Role (optional, default: user)
              </p>
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder="John Doe, employee, Engineering, manager&#10;Jane Smith, employee, Marketing, user&#10;Alex Brown, student, Computer Science"
                className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm min-h-32"
              />
              <Button onClick={handleBulkImport} className="w-full">
                Import Users
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold">Type</th>
                  <th className="text-left py-2 px-2 font-semibold">Department</th>
                  <th className="text-left py-2 px-2 font-semibold">Role</th>
                  <th className="text-left py-2 px-2 font-semibold">Email</th>
                  <th className="text-left py-2 px-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{user.name}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {user.type}
                      </span>
                    </td>
                    <td className="py-2 px-2">{user.department}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">{user.email || "-"}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:underline text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
