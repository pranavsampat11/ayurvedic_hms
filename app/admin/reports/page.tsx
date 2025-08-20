"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { BarChart3, FileText, TrendingUp, Users, Bed, DollarSign } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-sm text-gray-600">Generate comprehensive reports and analytics for hospital operations</p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Coming Soon</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Patient Reports</h3>
                <p className="text-sm text-gray-600">Patient demographics, registration trends, and outcomes</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Bed className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">IPD Reports</h3>
                <p className="text-sm text-gray-600">Admission trends, bed occupancy, and discharge summaries</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Financial Reports</h3>
                <p className="text-sm text-gray-600">Revenue analysis, billing reports, and financial metrics</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                <p className="text-sm text-gray-600">Hospital performance indicators and KPIs</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <FileText className="h-12 w-12 mx-auto mb-4 text-red-600" />
                <h3 className="font-semibold mb-2">Custom Reports</h3>
                <p className="text-sm text-gray-600">Generate custom reports based on specific criteria</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-sm text-gray-600">Interactive charts and data visualization</p>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500">
              <p>Reports and analytics functionality will be implemented in the next phase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
} 