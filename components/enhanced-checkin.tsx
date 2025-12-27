"use client"

import { useState, useRef, useEffect } from "react"
import { type User, attendanceStore } from "@/lib/attendance-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EnhancedCheckin() {
  const [users, setUsers] = useState<User[]>(attendanceStore.getUsers())
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [checkInMode, setCheckInMode] = useState<"manual" | "qr" | "geolocation">("manual")
  const [qrResult, setQrResult] = useState<string>("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string>("")
  const [sessionStatus, setSessionStatus] = useState<"none" | "checked-in" | "checked-out">("none")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoadingQR, setIsLoadingQR] = useState(false)

  // Generate QR code for user
  const generateQRCode = (userId: string) => {
    // Simple QR code representation (in production, use qrcode library)
    return `USER:${userId}`
  }

  // Request geolocation
  const requestLocation = () => {
    setLocationError("")
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported in your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`)
      },
    )
  }

  // Simulate QR code scanning (for demo)
  const simulateQRScan = async () => {
    setIsLoadingQR(true)
    // In production, integrate with jsQR or similar library
    const randomUser = users[Math.floor(Math.random() * users.length)]
    setQrResult(generateQRCode(randomUser.id))
    setSelectedUser(randomUser)
    setIsLoadingQR(false)
  }

  // Handle check-in
  const handleCheckIn = () => {
    if (!selectedUser) return

    const record = attendanceStore.checkIn(selectedUser)
    setSessionStatus("checked-in")

    // Store location if available
    if (location) {
      const records = attendanceStore.getRecords()
      const lastRecord = records[records.length - 1]
      if (lastRecord && !lastRecord.checkOutTime) {
        lastRecord.checkInLocation = location
        localStorage.setItem("attendance_records", JSON.stringify(records))
      }
    }

    setTimeout(() => {
      alert(`${selectedUser.name} checked in successfully at ${new Date().toLocaleTimeString()}`)
    }, 500)
  }

  // Handle check-out
  const handleCheckOut = () => {
    if (!selectedUser) return

    const session = attendanceStore.getTodaySession(selectedUser.id)
    if (!session) {
      alert("No active session found")
      return
    }

    const record = attendanceStore.checkOut(selectedUser.id, session.id)
    setSessionStatus("checked-out")

    // Store location if available
    if (location && record) {
      const records = attendanceStore.getRecords()
      const updated = records.find((r) => r.id === record.id)
      if (updated) {
        updated.checkOutLocation = location
        localStorage.setItem("attendance_records", JSON.stringify(records))
      }
    }

    setTimeout(() => {
      alert(
        `${selectedUser.name} checked out successfully at ${new Date().toLocaleTimeString()}\nSession duration: ${record?.duration || 0} minutes`,
      )
      setSelectedUser(null)
      setSessionStatus("none")
      setLocation(null)
    }, 500)
  }

  // Check current session status
  useEffect(() => {
    if (selectedUser) {
      const session = attendanceStore.getTodaySession(selectedUser.id)
      setSessionStatus(session ? "checked-in" : "none")
    }
  }, [selectedUser])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Check-In/Check-Out</CardTitle>
          <CardDescription>Multiple check-in methods with location tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Check-in mode selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Check-In Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(["manual", "qr", "geolocation"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCheckInMode(mode)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                    checkInMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {mode === "manual" ? "Manual" : mode === "qr" ? "QR Code" : "Geolocation"}
                </button>
              ))}
            </div>
          </div>

          {/* Manual selection */}
          {checkInMode === "manual" && (
            <div>
              <label className="block text-sm font-medium mb-2">Select User</label>
              <select
                value={selectedUser?.id || ""}
                onChange={(e) => setSelectedUser(users.find((u) => u.id === e.target.value) || null)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* QR Code mode */}
          {checkInMode === "qr" && (
            <div className="space-y-4">
              <div className="bg-muted p-8 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-4">Scan or simulate QR code</p>
                <Button onClick={simulateQRScan} disabled={isLoadingQR} className="w-full">
                  {isLoadingQR ? "Scanning..." : "Simulate QR Scan"}
                </Button>
              </div>
              {qrResult && selectedUser && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">QR Code Detected</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{selectedUser.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Geolocation mode */}
          {checkInMode === "geolocation" && (
            <div className="space-y-4">
              <Button onClick={requestLocation} className="w-full bg-transparent" variant="outline">
                Get Location
              </Button>
              {location && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Location Captured</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Latitude: {location.lat.toFixed(4)}, Longitude: {location.lng.toFixed(4)}
                  </p>
                </div>
              )}
              {locationError && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Select User</label>
                <select
                  value={selectedUser?.id || ""}
                  onChange={(e) => setSelectedUser(users.find((u) => u.id === e.target.value) || null)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selected user display */}
          {selectedUser && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-foreground">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.department} • {selectedUser.role}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sessionStatus === "checked-in"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {sessionStatus === "checked-in" ? "Checked In" : "Not Checked In"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleCheckIn}
                  disabled={sessionStatus === "checked-in"}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Check In
                </Button>
                <Button
                  onClick={handleCheckOut}
                  disabled={sessionStatus !== "checked-in"}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Check Out
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Manual Selection</p>
            <p className="text-sm font-medium">Dropdown menu based selection</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">QR Code Scanning</p>
            <p className="text-sm font-medium">Fast biometric-style check-in</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Geolocation</p>
            <p className="text-sm font-medium">Location-based verification</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
