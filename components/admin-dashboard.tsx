"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { attendanceStore, type User, type AttendanceRecord } from "@/lib/attendance-store"
import { formatTime, formatDate } from "@/lib/utils"

export function AdminDashboard() {
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filterType, setFilterType] = useState<"all" | "employee" | "student">("all")
  const [newUserName, setNewUserName] = useState("")
  const [newUserType, setNewUserType] = useState<"employee" | "student">("employee")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const records = attendanceStore.getRecords()
    setAllRecords(records.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()))

    const loadedUsers = attendanceStore.getUsers()
    setUsers(loadedUsers)
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim()) return

    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      name: newUserName,
      type: newUserType,
    }

    attendanceStore.addUser(newUser)
    setNewUserName("")
    loadData()
  }

  const handleDeleteRecord = (recordId: string) => {
    if (confirm("Delete this record?")) {
      attendanceStore.deleteRecord(recordId)
      loadData()
    }
  }

  const handleClearAll = () => {
    if (confirm("This will delete all records and reset to default users. Continue?")) {
      attendanceStore.clearAll()
      loadData()
    }
  }

  const filteredRecords = allRecords.filter((r) => filterType === "all" || r.userType === filterType)

  const stats = {
    total: filteredRecords.length,
    checkedIn: filteredRecords.filter((r) => !r.checkOutTime).length,
    checkedOut: filteredRecords.filter((r) => r.checkOutTime).length,
  }

  return (
    <div className="py-8 space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Records</div>
          <div className="text-3xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Checked In</div>
          <div className="text-3xl font-bold text-green-600">{stats.checkedIn}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-sm text-muted-foreground mb-1">Checked Out</div>
          <div className="text-3xl font-bold text-blue-600">{stats.checkedOut}</div>
        </div>
      </div>

      {/* Add User Form */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add New User</h3>
        <form onSubmit={handleAddUser} className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="User name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="flex-1 min-w-48 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground"
          />
          <select
            value={newUserType}
            onChange={(e) => setNewUserType(e.target.value as "employee" | "student")}
            className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
          >
            <option value="employee">Employee</option>
            <option value="student">Student</option>
          </select>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Add User
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Users ({users.length})</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((user) => (
            <div key={user.id} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="font-medium text-foreground">{user.name}</div>
              <div className="text-sm text-muted-foreground capitalize">{user.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h3 className="text-lg font-semibold text-foreground">All Records</h3>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
            >
              <option value="all">All Users</option>
              <option value="employee">Employees</option>
              <option value="student">Students</option>
            </select>
            <button
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Check In</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Check Out</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{record.userName}</td>
                    <td className="py-3 px-4 capitalize text-muted-foreground">{record.userType}</td>
                    <td className="py-3 px-4">{formatDate(record.date)}</td>
                    <td className="py-3 px-4">{formatTime(record.checkInTime)}</td>
                    <td className="py-3 px-4">{record.checkOutTime ? formatTime(record.checkOutTime) : "-"}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No records found</div>
        )}
      </div>
    </div>
  )
}
