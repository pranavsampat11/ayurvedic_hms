"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { Settings, Database, Shield, Bell, Palette, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-sm text-gray-600">Configure hospital management system settings and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Coming Soon</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <Database className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Database Settings</h3>
                <p className="text-sm text-gray-600">Configure database connections and backup settings</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Security Settings</h3>
                <p className="text-sm text-gray-600">Configure security policies and access controls</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Bell className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Notification Settings</h3>
                <p className="text-sm text-gray-600">Configure system notifications and alerts</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Palette className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Appearance</h3>
                <p className="text-sm text-gray-600">Customize system appearance and themes</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Globe className="h-12 w-12 mx-auto mb-4 text-red-600" />
                <h3 className="font-semibold mb-2">Regional Settings</h3>
                <p className="text-sm text-gray-600">Configure timezone, language, and regional preferences</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Settings className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                <h3 className="font-semibold mb-2">Advanced Settings</h3>
                <p className="text-sm text-gray-600">Advanced system configuration options</p>
              </div>
            </div>
            <div className="mt-8 text-center text-gray-500">
              <p>System settings functionality will be implemented in the next phase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
} 