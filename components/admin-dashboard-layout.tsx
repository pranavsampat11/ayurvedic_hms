"use client";

import React from "react";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-[1400px] p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
