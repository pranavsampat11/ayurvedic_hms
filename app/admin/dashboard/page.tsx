import React from "react";
import StatCard from "@/components/admin/StatCard";
import ChartCard from "@/components/admin/ChartCard";

const stats = [
  { label: "Total Patients", value: 1240 },
  { label: "Total Staff", value: 85 },
  { label: "Total Beds", value: 120 },
  { label: "Occupied Beds", value: 90 },
  { label: "Available Beds", value: 30 },
  { label: "Total Revenue", value: "₹ 12,50,000" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Patient Registrations (Last 6 Months)"
          type="line"
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                label: "Registrations",
                data: [120, 150, 180, 200, 170, 210],
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.1)",
                tension: 0.4,
              },
            ],
          }}
        />
        <ChartCard
          title="Bed Occupancy (Last 6 Months)"
          type="bar"
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                label: "Occupied Beds",
                data: [80, 85, 90, 95, 92, 90],
                backgroundColor: "#16a34a",
              },
            ],
          }}
        />
      </div>
    </div>
  );
} 