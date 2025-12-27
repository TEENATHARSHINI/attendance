"use client"

import { useState, useEffect } from "react"
import { attendanceStore, type User, type AttendanceRecord } from "@/lib/attendance-store"
import { formatTime } from "@/lib/utils"

export function CheckInInterface() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const loadedUsers = attendanceStore.getUsers()
    setUsers(loadedUsers)
  }, [])

  useEffect(() => {
    if (selectedUser) {
      const today = new Date().toISOString().split("T")[0]
      const records = attendanceStore.getRecords()
      const session = records.find((r) => r.userId === selectedUser.id && r.date === today && !r.checkOutTime) || null
      setCurrentSession(session)
    }
  }, [selectedUser])

  const handleCheckIn = () => {
    if (!selectedUser) return
    setLoading(true)

    setTimeout(() => {
      const record = attendanceStore.checkIn(selectedUser)
      setCurrentSession(record)
      setMessage(`✓ Checked in at ${formatTime(record.checkInTime)}`)
      setLoading(false)

      setTimeout(() => setMessage(""), 3000)
    }, 300)
  }

  const handleCheckOut = () => {
    if (!selectedUser || !currentSession) return
    setLoading(true)

    setTimeout(() => {
      const record = attendanceStore.checkOut(selectedUser.id, currentSession.id)
      setCurrentSession(null)
      setMessage(`✓ Checked out at ${formatTime(record?.checkOutTime || "")}`)
      setLoading(false)

      setTimeout(() => setMessage(""), 3000)
    }, 300)
  }

  return (
    <div className="py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* User Selection */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Select User</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedUser?.id === user.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-foreground border-border hover:bg-muted"
                }`}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm opacity-75 capitalize">{user.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Check In/Out Panel */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {selectedUser ? `Check In/Out - ${selectedUser.name}` : "Select a user to continue"}
          </h2>

          {selectedUser && (
            <div className="space-y-6">
              {currentSession && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <div className="font-semibold mb-2">Active Session</div>
                    <div>Checked in: {formatTime(currentSession.checkInTime)}</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleCheckIn}
                  disabled={!!currentSession || loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Check In"}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!currentSession || loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Check Out"}
                </button>
              </div>

              {message && (
                <div className="bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800 rounded-lg p-3 text-green-900 dark:text-green-100 text-sm">
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
