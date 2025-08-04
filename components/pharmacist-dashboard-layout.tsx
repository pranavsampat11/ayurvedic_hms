"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Pill,
  FileText,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  Calendar,
  Activity,
  X,
  Menu,
  CheckCircle,
  Package,
  Archive,
} from "lucide-react";

interface PharmacistDashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/pharmacist/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Medication Requests",
    href: "/pharmacist/medication-requests",
    icon: Pill,
  },
  {
    title: "Procedure Requirements",
    href: "/pharmacist/procedure-requirements",
    icon: Package,
  },
  {
    title: "Dispensed Procedure Requirements",
    href: "/pharmacist/dispensed-procedure-requirements",
    icon: Archive,
  },
  {
    title: "Dispensed Medications",
    href: "/pharmacist/dispensed-medications",
    icon: CheckCircle,
  },
  {
    title: "OPD Case Sheets",
    href: "/pharmacist/opd-case-sheets",
    icon: FileText,
  },
  {
    title: "IPD Case Sheets",
    href: "/pharmacist/ipd-case-sheets",
    icon: ClipboardList,
  },
  {
    title: "Patients",
    href: "/pharmacist/patients",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/pharmacist/reports",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/pharmacist/settings",
    icon: Settings,
  },
];

export default function PharmacistDashboardLayout({
  children,
}: PharmacistDashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Pharmacist</h1>
              <p className="text-xs md:text-sm text-gray-600">Hospital Management System</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <nav className="mt-4 md:mt-6">
          <div className="px-2 md:px-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-2 md:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-2 md:p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-xs md:text-sm"
            onClick={() => {
              localStorage.removeItem("userId");
              window.location.href = "/signin";
            }}
          >
            <LogOut className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Pharmacist Dashboard</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 