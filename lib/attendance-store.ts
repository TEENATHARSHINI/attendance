export interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  userType: "employee" | "student"
  department: string
  checkInTime: string
  checkInLocation?: { lat: number; lng: number }
  checkOutTime: string | null
  checkOutLocation?: { lat: number; lng: number }
  date: string
  status: "present" | "absent" | "late" | "early-departure" | "overtime"
  isLate: boolean
  duration?: number // in minutes
}

export interface User {
  id: string
  name: string
  type: "employee" | "student"
  department: string
  role: "user" | "manager" | "admin"
  email?: string
  phone?: string
}

export interface AlertNotification {
  id: string
  userId: string
  type: "late" | "absent" | "overtime" | "early-departure"
  message: string
  timestamp: string
  read: boolean
}

const STORAGE_KEY = "attendance_records"
const USERS_STORAGE_KEY = "attendance_users"
const ALERTS_STORAGE_KEY = "attendance_alerts"
const SETTINGS_STORAGE_KEY = "attendance_settings"

export const attendanceSettings = {
  workStartTime: "11:30",
  workEndTime: "17:00",
  lateThreshold: 15, // minutes
  overtimeThreshold: 1, // hours
}

export const attendanceStore = {
  // Get all attendance records
  getRecords: (): AttendanceRecord[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },

  // Add check-in record
  checkIn: (user: User): AttendanceRecord => {
    const records = attendanceStore.getRecords()
    const today = new Date().toISOString().split("T")[0]

    // Check if already checked in today
    const existingRecord = records.find((r) => r.userId === user.id && r.date === today && !r.checkOutTime)

    if (existingRecord) return existingRecord

    const now = new Date()
    const [hours, minutes] = attendanceSettings.workStartTime.split(":").map(Number)
    const workStart = new Date(now)
    workStart.setHours(hours, minutes, 0, 0)
    const isLate = now.getTime() > workStart.getTime()

    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substring(7),
      userId: user.id,
      userName: user.name,
      userType: user.type,
      department: user.department,
      checkInTime: now.toISOString(),
      date: today,
      checkOutTime: null,
      isLate,
      status: isLate ? "late" : "present",
    }

    records.push(newRecord)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))

    if (isLate) {
      attendanceStore.createAlert(user.id, "late", `Marked as late at ${now.toLocaleTimeString()}`)
    }

    return newRecord
  },

  // Check out
  checkOut: (userId: string, recordId: string): AttendanceRecord | null => {
    const records = attendanceStore.getRecords()
    const record = records.find((r) => r.id === recordId)
    if (!record) return null

    const checkOutTime = new Date()
    record.checkOutTime = checkOutTime.toISOString()

    // Calculate session duration
    const checkIn = new Date(record.checkInTime)
    const duration = Math.round((checkOutTime.getTime() - checkIn.getTime()) / 60000)
    record.duration = duration

    // Check for overtime
    const [, , endHours, endMinutes] = attendanceSettings.workEndTime.split(":").map(Number)
    const workEnd = new Date(checkOutTime)
    workEnd.setHours(endHours, endMinutes, 0, 0)

    if (checkOutTime.getTime() > workEnd.getTime()) {
      const overtimeHours = (checkOutTime.getTime() - workEnd.getTime()) / 3600000
      if (overtimeHours >= attendanceSettings.overtimeThreshold) {
        record.status = "overtime"
      }
    } else if (checkOutTime.getTime() < workEnd.getTime()) {
      record.status = "early-departure"
      attendanceStore.createAlert(userId, "early-departure", `Left early at ${checkOutTime.toLocaleTimeString()}`)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return record
  },

  // Get records for specific user
  getUserRecords: (userId: string): AttendanceRecord[] => {
    return attendanceStore.getRecords().filter((r) => r.userId === userId)
  },

  // Get today's active session
  getTodaySession: (userId: string): AttendanceRecord | null => {
    const today = new Date().toISOString().split("T")[0]
    const records = attendanceStore.getRecords()
    return records.find((r) => r.userId === userId && r.date === today && !r.checkOutTime) || null
  },

  // Get all users with enhanced fields
  getUsers: (): User[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(USERS_STORAGE_KEY)
    return data ? JSON.parse(data) : getDefaultUsers()
  },

  // Add user
  addUser: (user: User): void => {
    const users = attendanceStore.getUsers()
    if (!users.find((u) => u.id === user.id)) {
      users.push(user)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }
  },

  // Create alerts for various events
  createAlert: (userId: string, type: AlertNotification["type"], message: string): void => {
    const alerts: AlertNotification[] = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || "[]")
    alerts.push({
      id: Math.random().toString(36).substring(7),
      userId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    })
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
  },

  // Get all alerts for a user
  getAlerts: (userId?: string): AlertNotification[] => {
    const alerts: AlertNotification[] = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || "[]")
    return userId ? alerts.filter((a) => a.userId === userId) : alerts
  },

  // Mark alert as read
  markAlertRead: (alertId: string): void => {
    const alerts: AlertNotification[] = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || "[]")
    const alert = alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.read = true
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
    }
  },

  // Delete record
  deleteRecord: (recordId: string): void => {
    const records = attendanceStore.getRecords()
    const filtered = records.filter((r) => r.id !== recordId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },

  // Clear all data
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(USERS_STORAGE_KEY)
    localStorage.removeItem(ALERTS_STORAGE_KEY)
  },
}

function getDefaultUsers(): User[] {
  return [
    {
      id: "1",
      name: "John Smith",
      type: "employee",
      department: "Engineering",
      role: "admin",
      email: "john@company.com",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      type: "employee",
      department: "Marketing",
      role: "manager",
      email: "sarah@company.com",
    },
    { id: "3", name: "Mike Wilson", type: "employee", department: "Sales", role: "user", email: "mike@company.com" },
    { id: "4", name: "Emma Davis", type: "student", department: "Computer Science", role: "user" },
    { id: "5", name: "Alex Brown", type: "employee", department: "HR", role: "user", email: "alex@company.com" },
    { id: "6", name: "Lisa Anderson", type: "student", department: "Business", role: "user" },
  ]
}
