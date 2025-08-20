"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { Package, Plus, BarChart3, AlertTriangle, Pill, CheckCircle2, CalendarDays } from "lucide-react";

export default function AdminInventoryPage() {
  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-sm text-gray-600">Manage hospital supplies, medications, and equipment</p>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Coming Soon</span>
          </div>
        </div>

        {/* Inventory Stats (UI-only placeholders) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-700 text-xs">
                  <Pill className="h-4 w-4" /> Total Medications
                </div>
                <div className="mt-1 text-3xl font-bold text-blue-900">1,280</div>
              </div>
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-700 text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Dispensed (All-time)
                </div>
                <div className="mt-1 text-3xl font-bold text-green-900">8,642</div>
              </div>
              <div className="rounded-md bg-purple-50 p-4">
                <div className="flex items-center gap-2 text-purple-700 text-xs">
                  <CalendarDays className="h-4 w-4" /> Dispensed Today
                </div>
                <div className="mt-1 text-3xl font-bold text-purple-900">37</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Management Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Stock Management</h3>
                <p className="text-sm text-gray-600">Track inventory levels and stock movements</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Plus className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Add Items</h3>
                <p className="text-sm text-gray-600">Add new items to inventory</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Reports</h3>
                <p className="text-sm text-gray-600">Generate inventory reports and analytics</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Low Stock Alerts</h3>
                <p className="text-sm text-gray-600">Get notified when items are running low</p>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500">
              <p>Inventory management functionality will be implemented in the next phase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
} 