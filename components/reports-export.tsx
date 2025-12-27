"use client"

import { useState } from "react"
import { attendanceStore } from "@/lib/attendance-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ReportsExport() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")

  const records = attendanceStore.getRecords()
  const departments = [...new Set(records.map((r) => r.department))]

  const getDateRange = () => {
    const today = new Date(selectedDate)
    const startDate = new Date(today)
    const endDate = new Date(today)

    if (reportType === "daily") {
      // Already set correctly
    } else if (reportType === "weekly") {
      const day = startDate.getDay()
      startDate.setDate(startDate.getDate() - day)
      endDate.setDate(startDate.getDate() + 6)
    } else if (reportType === "monthly") {
      startDate.setDate(1)
      endDate.setDate(0)
      endDate.setMonth(endDate.getMonth() + 1)
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    }
  }

  const getFilteredRecords = () => {
    const { start, end } = getDateRange()
    return records.filter((r) => {
      const inDateRange = r.date >= start && r.date <= end
      const inDepartment = selectedDepartment === "all" || r.department === selectedDepartment
      return inDateRange && inDepartment
    })
  }

  const exportToCSV = () => {
    const filtered = getFilteredRecords()
    const headers = [
      "Date",
      "Name",
      "Type",
      "Department",
      "Check-In Time",
      "Check-Out Time",
      "Duration (mins)",
      "Status",
      "Late",
    ]
    const rows = filtered.map((r) => [
      r.date,
      r.userName,
      r.userType,
      r.department,
      new Date(r.checkInTime).toLocaleTimeString(),
      r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "No",
      r.duration || "0",
      r.status,
      r.isLate ? "Yes" : "No",
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    downloadFile(csv, "attendance-report.csv", "text/csv")
  }

  const exportToJSON = () => {
    const filtered = getFilteredRecords()
    const data = {
      reportDate: new Date().toISOString(),
      reportType,
      dateRange: getDateRange(),
      department: selectedDepartment,
      totalRecords: filtered.length,
      records: filtered,
    }
    downloadFile(JSON.stringify(data, null, 2), "attendance-report.json", "application/json")
  }

  const generatePDF = () => {
    const filtered = getFilteredRecords()
    const { start, end } = getDateRange()

    const pdfContent = `
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #007bff; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .late { color: #dc3545; font-weight: bold; }
            .present { color: #28a745; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <div class="summary">
            <p><strong>Report Type:</strong> ${reportType}</p>
            <p><strong>Date Range:</strong> ${start} to ${end}</p>
            <p><strong>Department:</strong> ${selectedDepartment}</p>
            <p><strong>Total Records:</strong> ${filtered.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Department</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  (r) => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.userName}</td>
                  <td>${r.department}</td>
                  <td>${new Date(r.checkInTime).toLocaleTimeString()}</td>
                  <td>${r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "No"}</td>
                  <td>${r.duration || 0} min</td>
                  <td class="${r.isLate ? "late" : "present"}">${r.status}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open("", "", "height=700,width=900")
    if (printWindow) {
      printWindow.document.write(pdfContent)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 250)
    }
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filtered = getFilteredRecords()
  const lateCount = filtered.filter((r) => r.isLate).length
  const presentCount = filtered.filter((r) => r.status === "present").length
  const overtimeCount = filtered.filter((r) => r.status === "overtime").length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports & Export</CardTitle>
          <CardDescription>Generate and export attendance reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Button onClick={exportToCSV} variant="outline" className="w-full bg-transparent">
              Export CSV
            </Button>
            <Button onClick={exportToJSON} variant="outline" className="w-full bg-transparent">
              Export JSON
            </Button>
            <Button onClick={generatePDF} variant="outline" className="w-full bg-transparent">
              Print PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary">{filtered.length}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
            <div className="bg-green-500/10 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-muted-foreground">On Time</p>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late Arrivals</p>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{overtimeCount}</p>
              <p className="text-xs text-muted-foreground">Overtime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
