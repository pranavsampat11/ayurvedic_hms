import React from "react";

export default function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 flex flex-col items-center border hover:shadow-md transition-shadow">
      <div className="text-xl sm:text-2xl font-bold mb-2 text-center">{value}</div>
      <div className="text-gray-500 text-xs sm:text-sm font-medium text-center">{label}</div>
    </div>
  );
} 