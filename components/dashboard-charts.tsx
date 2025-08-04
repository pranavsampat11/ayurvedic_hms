"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { getDailyNewPatients, getDailyBedOccupancy, getStaffCountByRole, getBedCategoryDistribution } from "@/lib/data"
import { subDays } from "date-fns"

export default function DashboardCharts({
  newPatientsData: propNewPatientsData,
  bedOccupancyData: propBedOccupancyData,
  staffDistributionData: propStaffDistributionData,
  bedCategoryDistributionData: propBedCategoryDistributionData,
  startDate = subDays(new Date(), 30),
  endDate = new Date(),
}: {
  newPatientsData?: { date: string; count: number }[]
  bedOccupancyData?: { date: string; occupied: number; available: number }[]
  staffDistributionData?: { name: string; value: number }[]
  bedCategoryDistributionData?: { name: string; value: number }[]
  startDate?: Date
  endDate?: Date
}) {
  const defaultNewPatientsData = React.useMemo(() => getDailyNewPatients(startDate, endDate), [startDate, endDate])
  const defaultBedOccupancyData = React.useMemo(() => getDailyBedOccupancy(startDate, endDate), [startDate, endDate])
  const defaultStaffDistributionData = React.useMemo(() => getStaffCountByRole(), [])
  const defaultBedCategoryDistributionData = React.useMemo(() => getBedCategoryDistribution(), [])

  const newPatientsData = propNewPatientsData || defaultNewPatientsData
  const bedOccupancyData = propBedOccupancyData || defaultBedOccupancyData
  const staffDistributionData = propStaffDistributionData || defaultStaffDistributionData
  const bedCategoryDistributionData = propBedCategoryDistributionData || defaultBedCategoryDistributionData

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>New Patient Registrations</CardTitle>
          <CardDescription>Daily new patient registrations over the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Patients",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newPatientsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="count" fill="var(--color-count)" name="New Patients" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bed Occupancy Trend</CardTitle>
          <CardDescription>Daily bed occupancy and availability over the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              occupied: {
                label: "Occupied",
                color: "hsl(var(--chart-2))",
              },
              available: {
                label: "Available",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bedOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="occupied" stroke="var(--color-occupied)" name="Occupied Beds" />
                <Line type="monotone" dataKey="available" stroke="var(--color-available)" name="Available Beds" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Distribution by Role</CardTitle>
          <CardDescription>Breakdown of staff members across different roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={staffDistributionData.reduce((acc, curr, idx) => {
              acc[curr.name.toLowerCase().replace(/\s/g, "-")] = {
                label: curr.name,
                color: COLORS[idx % COLORS.length],
              }
              return acc
            }, {})}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={staffDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {staffDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bed Category Distribution</CardTitle>
          <CardDescription>Distribution of beds across different categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={bedCategoryDistributionData.reduce((acc, curr, idx) => {
              acc[curr.name.toLowerCase().replace(/\s/g, "-")] = {
                label: curr.name,
                color: COLORS[idx % COLORS.length],
              }
              return acc
            }, {})}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bedCategoryDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {bedCategoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
