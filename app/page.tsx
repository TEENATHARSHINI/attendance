"use client"

import { useState, useEffect } from "react"
import { CheckInInterface } from "@/components/check-in-interface"
import { AttendanceHistory } from "@/components/attendance-history"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UserManagement } from "@/components/user-management"
import { ReportsExport } from "@/components/reports-export"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { EnhancedCheckin } from "@/components/enhanced-checkin"
import { AlertsNotifications } from "@/components/alerts-notifications"

type View = "checkin" | "history" | "admin" | "users" | "reports" | "analytics" | "enhanced-checkin" | "alerts"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("checkin")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("dark-mode")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedMode ? savedMode === "true" : prefersDark
    setIsDarkMode(shouldBeDark)
    applyDarkMode(shouldBeDark)
  }, [])

  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem("dark-mode", newMode.toString())
    applyDarkMode(newMode)
  }

  const navItems = [
    { id: "checkin" as View, label: "Check In/Out", icon: "🔐" },
    { id: "enhanced-checkin" as View, label: "Advanced Check-In", icon: "⚡" },
    { id: "history" as View, label: "History", icon: "📋" },
    { id: "alerts" as View, label: "Alerts", icon: "🔔" },
    { id: "analytics" as View, label: "Analytics", icon: "📊" },
    { id: "reports" as View, label: "Reports", icon: "📄" },
    { id: "users" as View, label: "Users", icon: "👥" },
    { id: "admin" as View, label: "Admin", icon: "⚙️" },
  ]

  return (
    <main className={`min-h-screen bg-background text-foreground transition-colors ${isDarkMode ? "dark" : ""}`}>
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Attendance System</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? "☀️" : "🌙"}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg md:hidden bg-muted text-muted-foreground hover:bg-muted/80"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          <div
            className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 ${isMobileMenuOpen ? "block" : "hidden md:grid"}`}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                  currentView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === "checkin" && <CheckInInterface />}
        {currentView === "enhanced-checkin" && <EnhancedCheckin />}
        {currentView === "history" && <AttendanceHistory />}
        {currentView === "alerts" && <AlertsNotifications />}
        {currentView === "analytics" && <AnalyticsDashboard />}
        {currentView === "reports" && <ReportsExport />}
        {currentView === "users" && <UserManagement />}
        {currentView === "admin" && <AdminDashboard />}
      </div>
    </main>
  )
}
