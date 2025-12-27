"use client"

import { useState, useEffect } from "react"
import { attendanceStore } from "@/lib/attendance-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AlertsNotifications() {
  const [alerts, setAlerts] = useState(attendanceStore.getAlerts())
  const [filterType, setFilterType] = useState<"all" | "late" | "absent" | "overtime" | "early-departure">("all")
  const [unreadCount, setUnreadCount] = useState(0)
  const records = attendanceStore.getRecords()
  const users = attendanceStore.getUsers()

  const alertTypes = [
    { id: "all", label: "All Alerts", color: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300" },
    { id: "late", label: "Late Arrivals", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
    {
      id: "absent",
      label: "Absences",
      color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    },
    {
      id: "overtime",
      label: "Overtime",
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    },
    {
      id: "early-departure",
      label: "Early Departures",
      color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    },
  ]

  // Update alerts when data changes
  useEffect(() => {
    const updatedAlerts = attendanceStore.getAlerts()
    setAlerts(updatedAlerts)
    setUnreadCount(updatedAlerts.filter((a) => !a.read).length)
  }, [records.length])

  const handleMarkAsRead = (alertId: string) => {
    attendanceStore.markAlertRead(alertId)
    const updatedAlerts = attendanceStore.getAlerts()
    setAlerts(updatedAlerts)
    setUnreadCount(updatedAlerts.filter((a) => !a.read).length)
  }

  const handleMarkAllAsRead = () => {
    alerts.forEach((alert) => {
      if (!alert.read) {
        attendanceStore.markAlertRead(alert.id)
      }
    })
    const updatedAlerts = attendanceStore.getAlerts()
    setAlerts(updatedAlerts)
    setUnreadCount(0)
  }

  const filteredAlerts = filterType === "all" ? alerts : alerts.filter((a) => a.type === filterType)

  // Generate alerts for absent users
  const generateAbsentAlerts = () => {
    const today = new Date().toISOString().split("T")[0]
    users.forEach((user) => {
      const hasCheckIn = records.some((r) => r.userId === user.id && r.date === today)
      if (!hasCheckIn) {
        const existingAlert = alerts.find(
          (a) => a.userId === user.id && a.type === "absent" && a.timestamp.includes(today),
        )
        if (!existingAlert) {
          attendanceStore.createAlert(user.id, "absent", `${user.name} did not check in today`)
        }
      }
    })

    const updatedAlerts = attendanceStore.getAlerts()
    setAlerts(updatedAlerts)
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "late":
        return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
      case "absent":
        return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800"
      case "overtime":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
      case "early-departure":
        return "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
      default:
        return "bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800"
    }
  }

  const getAlertTextColor = (type: string) => {
    switch (type) {
      case "late":
        return "text-red-700 dark:text-red-300"
      case "absent":
        return "text-orange-700 dark:text-orange-300"
      case "overtime":
        return "text-yellow-700 dark:text-yellow-300"
      case "early-departure":
        return "text-purple-700 dark:text-purple-300"
      default:
        return "text-gray-700 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Alerts & Notifications</h2>
          {unreadCount > 0 && <p className="text-sm text-red-600">You have {unreadCount} unread alerts</p>}
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" className="text-xs bg-transparent">
            Mark All As Read
          </Button>
        )}
      </div>

      {/* Alert type filters */}
      <div className="flex flex-wrap gap-2">
        {alertTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id as any)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === type.id
                ? `${type.color} ring-2 ring-offset-2 dark:ring-offset-gray-900`
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={generateAbsentAlerts} variant="outline" className="text-xs bg-transparent">
          Check for Absences
        </Button>
        <Button onClick={() => setAlerts(attendanceStore.getAlerts())} variant="outline" className="text-xs">
          Refresh
        </Button>
      </div>

      {/* Alerts display */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {filterType === "all" ? "No alerts yet" : `No ${filterType} alerts`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-lg transition-colors ${getAlertColor(alert.type)} ${
                !alert.read ? "ring-1 ring-offset-1 dark:ring-offset-gray-950" : "opacity-75"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm ${getAlertTextColor(alert.type)}`}>
                      {alert.type === "late"
                        ? "Late Arrival"
                        : alert.type === "absent"
                          ? "Absence"
                          : alert.type === "overtime"
                            ? "Overtime"
                            : "Early Departure"}
                    </span>
                    {!alert.read && <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">New</span>}
                  </div>
                  <p className={`text-sm ${getAlertTextColor(alert.type)}`}>{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                {!alert.read && (
                  <Button onClick={() => handleMarkAsRead(alert.id)} variant="ghost" size="sm" className="ml-2 text-xs">
                    Read
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{alerts.filter((a) => a.type === "late").length}</p>
              <p className="text-xs text-muted-foreground">Late Arrivals</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{alerts.filter((a) => a.type === "absent").length}</p>
              <p className="text-xs text-muted-foreground">Absences</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{alerts.filter((a) => a.type === "overtime").length}</p>
              <p className="text-xs text-muted-foreground">Overtime</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {alerts.filter((a) => a.type === "early-departure").length}
              </p>
              <p className="text-xs text-muted-foreground">Early Departures</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
