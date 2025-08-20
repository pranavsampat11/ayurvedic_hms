"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = [
    { label: "Patients", href: "/nurse/patients" },
    { label: "OPD Patients", href: "/nurse/opd-patients" },
    { label: "IPD Patients", href: "/nurse/ipd-patients" },
  ];

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 bg-white border-r shadow-sm flex-col min-h-screen">
        <div className="p-4 font-semibold">Nurse Dashboard</div>
        <nav className="flex-1">
          <ul className="space-y-1 p-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors text-sm ${
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-2 sm:p-4 md:p-8 w-full max-w-full overflow-x-auto">
        {children}
      </main>
    </div>
  );
} 