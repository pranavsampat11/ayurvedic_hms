import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  CalendarIcon as CalendarIconLucide,
  Users,
  ClipboardList,
  LogOut,
  X,
  Menu,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface DoctorDashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Stethoscope,
  },
  {
    title: "Referred Patients",
    href: "/dashboard/doctor/referred-patients",
    icon: MessageSquare,
  },
  {
    title: "My Patients",
    href: "/dashboard/patients",
    icon: Users,
  },
  {
    title: "IPD Patients",
    href: "/dashboard/ipd-patients",
    icon: Users,
  },
  {
    title: "Case Sheets",
    href: "/dashboard/case-sheets",
    icon: ClipboardList,
  },
];

export default function DoctorDashboardLayout({ children, title }: DoctorDashboardLayoutProps) {
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDoctorName(localStorage.getItem("userName"));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoleId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    window.location.href = "/signin";
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 md:p-6">
                           <div className="flex items-center justify-between">
                   <div>
                     <h1 className="text-xl md:text-2xl font-bold text-white">Doctor</h1>
                     <p className="text-xs md:text-sm text-slate-300">Hospital Management System</p>
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
                               ? "bg-blue-500 text-white shadow-md"
                               : "text-slate-300 hover:bg-slate-700 hover:text-white"
                           )}
                >
                  <Icon className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-600 text-white">{doctorName ? doctorName[0] : "D"}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
              <div className="font-semibold text-sm capitalize text-white">Doctor</div>
              <div className="text-xs text-slate-300">{doctorName}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 mt-4" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="text-xs md:text-sm">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden md:pl-0">
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
            <h1 className="text-lg font-semibold capitalize">{title || "Doctor Dashboard"}</h1>
            <p className="text-xs text-muted-foreground capitalize">{doctorName}</p>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <h1 className="text-lg font-semibold md:text-2xl capitalize">{title || "Doctor Dashboard"}</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{doctorName}</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
          {children}
        </main>
      </div>
    </div>
  );
} 