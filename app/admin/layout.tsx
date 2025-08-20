"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Stethoscope, Users, UserPlus, Bed, DollarSign, Package, BarChart, Settings, Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminNavLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Patients", href: "/admin/patients", icon: Users },
  { name: "Staff", href: "/admin/staff", icon: UserPlus },
  { name: "Beds", href: "/admin/beds", icon: Bed },

  { name: "Billing", href: "/admin/billing", icon: DollarSign },
  { name: "Inventory", href: "/admin/inventory", icon: Package },
  { name: "Reports", href: "/admin/reports", icon: BarChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Ayurvedic HMS</span>
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
          <p className="text-xs text-gray-600 mt-1">Admin Panel</p>
        </div>
        
        <nav className="mt-4 md:mt-6">
          <div className="px-2 md:px-3 space-y-1">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-2 md:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === link.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 