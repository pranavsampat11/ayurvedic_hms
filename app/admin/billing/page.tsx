"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { DollarSign, CreditCard, Receipt, TrendingUp } from "lucide-react";

export default function AdminBillingPage() {
  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Billing & Finance</h1>
            <p className="text-sm text-gray-600">Manage hospital billing, payments, and financial reports</p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Coming Soon</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Financial Management Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Invoice Management</h3>
                <p className="text-sm text-gray-600">Create and manage patient invoices</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Payment Processing</h3>
                <p className="text-sm text-gray-600">Process payments and track transactions</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Financial Reports</h3>
                <p className="text-sm text-gray-600">Generate financial reports and analytics</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Revenue Tracking</h3>
                <p className="text-sm text-gray-600">Track hospital revenue and expenses</p>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500">
              <p>Billing and finance functionality will be implemented in the next phase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
} 