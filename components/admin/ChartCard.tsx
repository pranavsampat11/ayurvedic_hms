import React from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function ChartCard({ title, type, data }: { title: string; type: "line" | "bar"; data: any }) {
  return (
    <div className="bg-white rounded shadow p-6 border">
      <div className="font-semibold mb-2">{title}</div>
      <div className="h-64">
        {type === "line" ? <Line data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} /> : <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
      </div>
    </div>
  );
} 