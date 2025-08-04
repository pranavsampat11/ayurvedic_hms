"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Settings,
  LogOut
} from "lucide-react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [doctorName, setDoctorName] = useState<string>("Doctor");

  // Get current doctor name from localStorage
  useEffect(() => {
    const name = typeof window !== 'undefined' ? localStorage.getItem("userName") : null;
    if (name) {
      setDoctorName(name);
    }
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard/doctor",
      icon: Home,
      current: pathname === "/dashboard/doctor"
    },
    {
      name: "Referred Patients",
      href: "/dashboard/doctor/referred-patients",
      icon: MessageSquare,
      current: pathname === "/dashboard/doctor/referred-patients"
    },
    {
      name: "My Patients",
      href: "/dashboard/patients",
      icon: Users,
      current: pathname.startsWith("/dashboard/patients")
    },
    {
      name: "Schedule",
      href: "/dashboard/schedule",
      icon: Calendar,
      current: pathname === "/dashboard/schedule"
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      current: pathname === "/dashboard/reports"
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: pathname === "/dashboard/settings"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content - no sidebar here */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
} 