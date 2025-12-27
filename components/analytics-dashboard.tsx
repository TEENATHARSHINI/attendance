"use client"

import { useState, useMemo } from "react"
import { attendanceStore } from "@/lib/attendance-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const records = attendanceStore.getRecords()
  const users = attendanceStore.getUsers()

  const getDateRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] }
  }

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    return getDateRange(days)
  }, [timeRange])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => r.date >= rangeStart && r.date <= rangeEnd)
  }, [records, rangeStart, rangeEnd])

  // Daily attendance trend
  const dailyTrend = useMemo(() => {
    const days: { [key: string]: { date: string; total: number; late: number; onTime: number } } = {}

    filteredRecords.forEach((r) => {
      if (!days[r.date]) {
        days[r.date] = { date: r.date, total: 0, late: 0, onTime: 0 }
      }
      days[r.date].total++
      if (r.isLate) days[r.date].late++
      else days[r.date].onTime++
    })

    return Object.values(days)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // Last 14 days
  }, [filteredRecords])

  // Department-wise attendance
  const departmentStats = useMemo(() => {
    const depts: { [key: string]: { dept: string; total: number; present: number; late: number; absent: number } } = {}

    const allDepartments = [...new Set(users.map((u) => u.department))]
    allDepartments.forEach((dept) => {
      depts[dept] = { dept, total: 0, present: 0, late: 0, absent: 0 }
    })

    filteredRecords.forEach((r) => {
      if (depts[r.department]) {
        depts[r.department].total++
        if (r.isLate) depts[r.department].late++
        else depts[r.department].present++
      }
    })

    return Object.values(depts)
  }, [filteredRecords, users])

  // Attendance status distribution
  const statusDistribution = useMemo(() => {
    const status = { present: 0, late: 0, overtime: 0, "early-departure": 0, absent: 0 }

    filteredRecords.forEach((r) => {
      status[r.status as keyof typeof status]++
    })

    return [
      { name: "Present", value: status.present, fill: "#10b981" },
      { name: "Late", value: status.late, fill: "#ef4444" },
      { name: "Overtime", value: status.overtime, fill: "#f59e0b" },
      { name: "Early Departure", value: status["early-departure"], fill: "#8b5cf6" },
    ].filter((s) => s.value > 0)
  }, [filteredRecords])

  // User type distribution
  const userTypeStats = useMemo(() => {
    const stats: { [key: string]: { type: string; count: number; onTime: number; late: number } } = {
      employee: { type: "Employee", count: 0, onTime: 0, late: 0 },
      student: { type: "Student", count: 0, onTime: 0, late: 0 },
    }

    filteredRecords.forEach((r) => {
      if (stats[r.userType]) {
        stats[r.userType].count++
        if (r.isLate) stats[r.userType].late++
        else stats[r.userType].onTime++
      }
    })

    return Object.values(stats)
  }, [filteredRecords])

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalRecords = filteredRecords.length
    const lateArrivals = filteredRecords.filter((r) => r.isLate).length
    const overtime = filteredRecords.filter((r) => r.status === "overtime").length
    const avgDuration =
      filteredRecords.filter((r) => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) /
        filteredRecords.filter((r) => r.duration).length || 0

    return { totalRecords, lateArrivals, overtime, avgDuration: Math.round(avgDuration) }
  }, [filteredRecords])

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["7d", "30d", "90d"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              timeRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-primary">{overallStats.totalRecords}</p>
            <p className="text-sm text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-red-600">{overallStats.lateArrivals}</p>
            <p className="text-sm text-muted-foreground">Late Arrivals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-yellow-600">{overallStats.overtime}</p>
            <p className="text-sm text-muted-foreground">Overtime Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-blue-600">{overallStats.avgDuration}m</p>
            <p className="text-sm text-muted-foreground">Avg Session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trend</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTime" stackId="a" fill="#10b981" name="On Time" />
                <Bar dataKey="late" stackId="a" fill="#ef4444" name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Status</CardTitle>
            <CardDescription>Distribution of attendance statuses</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department-wise Statistics</CardTitle>
          <CardDescription>Attendance by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Department</th>
                  <th className="text-right py-2 px-2 font-semibold">Total</th>
                  <th className="text-right py-2 px-2 font-semibold">On Time</th>
                  <th className="text-right py-2 px-2 font-semibold">Late</th>
                  <th className="text-right py-2 px-2 font-semibold">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept) => (
                  <tr key={dept.dept} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{dept.dept}</td>
                    <td className="text-right py-2 px-2">{dept.total}</td>
                    <td className="text-right py-2 px-2 text-green-600">{dept.present}</td>
                    <td className="text-right py-2 px-2 text-red-600">{dept.late}</td>
                    <td className="text-right py-2 px-2">
                      {dept.total > 0 ? `${Math.round((dept.present / dept.total) * 100)}%` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Type Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userTypeStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" fill="#10b981" name="On Time" />
              <Bar dataKey="late" fill="#ef4444" name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
