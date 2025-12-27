"use client"

import { useState, useEffect } from "react"
import { attendanceStore, type User, type AttendanceRecord } from "@/lib/attendance-store"
import { formatTime, formatDate } from "@/lib/utils"

export function AttendanceHistory() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    const loadedUsers = attendanceStore.getUsers()
    setUsers(loadedUsers)
  }, [])

  useEffect(() => {
    if (selectedUser) {
      const userRecords = attendanceStore.getUserRecords(selectedUser.id)
      setRecords(userRecords.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()))
    } else {
      setRecords([])
    }
  }, [selectedUser])

  const calculateDuration = (checkIn: string, checkOut: string | null): string => {
    if (!checkOut) return "Ongoing"
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="py-8">
      <div className="grid md:grid-cols-4 gap-6">
        {/* User List Sidebar */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">Users</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left p-2 text-sm rounded-lg border transition-colors ${
                  selectedUser?.id === user.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-foreground border-border hover:bg-muted"
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Records Table */}
        <div className="md:col-span-3 bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {selectedUser ? `${selectedUser.name}'s Attendance` : "Select a user to view history"}
          </h2>

          {selectedUser && records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Check In</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Check Out</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{formatDate(record.date)}</td>
                      <td className="py-3 px-4">{formatTime(record.checkInTime)}</td>
                      <td className="py-3 px-4">{record.checkOutTime ? formatTime(record.checkOutTime) : "-"}</td>
                      <td className="py-3 px-4">{calculateDuration(record.checkInTime, record.checkOutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedUser ? (
            <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
