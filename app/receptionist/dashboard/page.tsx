"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ClipboardList, DollarSign, Stethoscope } from "lucide-react";

export default function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Receptionist Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to the Hospital Management System</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-800">Patients</CardTitle>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">Register new patients, start visits, and manage patient details.</p>
                          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                <Link href="/receptionist/patients">Go to Patients</Link>
              </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-800">IPD Requests</CardTitle>
              <ClipboardList className="h-8 w-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">Review and process IPD admission requests from doctors.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white w-full">
              <Link href="/receptionist/ipd-requests">View Requests</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-purple-800">Billing</CardTitle>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">Manage IPD billing for admitted patients.</p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white w-full">
              <Link href="/billing">Go to Billing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-slate-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
              <Link href="/receptionist/patients">
                <Users className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Register Patient</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
              <Link href="/receptionist/patients">
                <Stethoscope className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Start Visit</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
              <Link href="/receptionist/ipd-requests">
                <ClipboardList className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">IPD Requests</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50">
              <Link href="/billing">
                <DollarSign className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium">Generate Bill</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 