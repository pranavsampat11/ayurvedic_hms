"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  FileText, 
  LogOut,
  Menu,
  X,
  Activity,
  Plus,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

const therapistNavLinks = [
  { name: "Today's Assignments", href: "/therapist/assignments", icon: Calendar },
  { name: "Add Therapy", href: "/therapist/add-therapy", icon: Plus },
  { name: "Schedule", href: "/therapist/schedule", icon: Clock },
  { name: "Sessions", href: "/therapist/sessions", icon: Activity },
  { name: "Total Therapies", href: "/therapist/total-therapies", icon: FileText },
];

export default function TherapistDashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [therapistName, setTherapistName] = useState<string>("Therapist");
  const pathname = usePathname();
  const router = useRouter();

  // Get current therapist name from localStorage
  useEffect(() => {
    const name = typeof window !== 'undefined' ? localStorage.getItem("userName") : null;
    if (name) {
      setTherapistName(name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    router.push("/signin");
  };

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
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Therapist Panel</span>
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
          <p className="text-xs text-gray-600 mt-1">Ayurvedic HMS</p>
          <p className="text-sm font-medium text-gray-800 mt-2">{therapistName}</p>
        </div>
        
        <nav className="mt-4 md:mt-6">
          <div className="px-2 md:px-3 space-y-1">
            {therapistNavLinks.map((link) => {
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

        {/* Logout Button */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-4 border-b bg-white px-4 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Therapist Panel</h1>
            <p className="text-xs text-muted-foreground">{therapistName}</p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 