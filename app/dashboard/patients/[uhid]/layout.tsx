"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabaseClient";

interface PatientLayoutProps extends PropsWithChildren {
  params: { uhid: string };
}

export default function PatientLayout({ children, params }: PatientLayoutProps) {
  const { uhid } = React.use(params) as { uhid: string };
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patientType, setPatientType] = useState<string | null>(null);

  useEffect(() => {
    async function fetchType() {
      const { data } = await supabase.from("patients").select("uhid").eq("uhid", uhid).single();
      if (data) {
        // Check if patient has an IPD admission
        const { data: ipd } = await supabase.from("ipd_admissions").select("ipd_no").eq("uhid", uhid).maybeSingle();
        setPatientType(ipd ? "IPD" : "OPD");
      }
    }
    fetchType();
  }, [uhid]);

  const isOpdNo = typeof uhid === 'string' && uhid.startsWith('OPD-');
  const opdSections = [
    { label: "Initial Assessment", path: "initial-assessment" },
    { label: "OPD Follow Ups", path: "opd-follow-up" },
    { label: "Pain Assessment", path: "pain-assessment" },
    { label: "Medication Requests", path: "medication-requests" },
    { label: "Billing History", path: "billing-history" },
  ];
  const ipdSections = [
    { label: "Initial Assessment", path: "initial-assessment" },
    { label: "Daily Assessment", path: "daily-assessment" },
    { label: "Pain Assessment", path: "pain-assessment" },
    { label: "Pain Management and Monitoring", path: "pain-management" },
    { label: "BP and TPR Chart", path: "bp-tpr-chart" },
    { label: "Medication Chart", path: "medication-chart" },
    { label: "Diet Chart", path: "diet-chart" },
    { label: "Referred Doctors", path: "referred-doctors" },
    { label: "Nursing Round", path: "nursing-round" },
    { label: "Billing History", path: "billing-history" },
    { label: "Procedure Chart", path: "procedure-chart" },
    { label: "Discharge Summary", path: "discharge-summary" },
  ];
  const sections = isOpdNo ? opdSections : ipdSections;

  const SidebarContent = (
    <div className="flex flex-col p-4 gap-4 min-h-full">
      <Button
        variant="outline"
        className="mb-2 w-full font-semibold"
        onClick={() => { setSidebarOpen(false); router.push("/dashboard"); }}
      >
        ← Back to Dashboard
      </Button>
      <nav className="flex-1">
        <ul className="space-y-1">
          {sections.map((section) => {
            const href = `/dashboard/patients/${uhid}/${section.path}`;
            const isActive = pathname === href;
            return (
              <li key={section.path}>
                <Link
                  href={href}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors text-sm
                    ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-primary"}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col md:flex-row">
      {/* Hamburger for mobile */}
      <div className="md:hidden flex items-center p-2 bg-white border-b shadow-sm sticky top-0 z-20">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Patient Navigation</SheetTitle>
            {SidebarContent}
          </SheetContent>
        </Sheet>
        <span className="ml-2 font-semibold text-lg">Patient Details</span>
      </div>
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r shadow-sm flex-col min-h-screen">
        {SidebarContent}
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-4 md:p-8 w-full max-w-full overflow-x-auto">
        {children}
      </main>
    </div>
  );
} 