"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  Users,
  Stethoscope,
  CalendarIcon as CalendarIconLucide,
  Settings,
  Menu,
  UserPlus,
  Package,
  BarChart,
  LogOut,
  Bed,
  ClipboardList,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import DashboardCharts from "@/components/dashboard-charts"
import { supabase } from "@/lib/supabaseClient"

import CaseSheetForm from "@/components/case-sheet-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DoctorDashboardLayout from "@/components/doctor-dashboard-layout";
import { getNavigationLinks } from "@/lib/data";

function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCaseSheetModal, setShowCaseSheetModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [totalPatients, setTotalPatients] = useState(0)
  const [totalCaseSheets, setTotalCaseSheets] = useState(0)
  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null
  const doctorName = typeof window !== 'undefined' ? localStorage.getItem("userName") || '' : ''

  useEffect(() => {
    async function fetchAppointments() {
      if (!doctorId) return
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients:uhid(first_name, last_name, age, gender, contact, address, op_no)")
        .eq("doctor_id", doctorId)
        .gte("scheduled_at", today)
        .lte("scheduled_at", today + 'T23:59:59')
        .order("scheduled_at", { ascending: true })
      if (!error && data) setAppointments(data)
      setLoading(false)
    }
    async function fetchDoctorStats() {
      if (!doctorId) return
      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
      setTotalPatients(patientCount || 0)
      const { count: caseSheetCount } = await supabase
        .from("opd_case_sheets")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
      setTotalCaseSheets(caseSheetCount || 0)
    }
    fetchAppointments()
    fetchDoctorStats()
  }, [doctorId])

  function handleOpenCaseSheet(app: any) {
    setSelectedAppointment(app)
    setShowCaseSheetModal(true)
  }

  function handleCaseSheetSaved() {
    setShowCaseSheetModal(false)
    setSelectedAppointment(null)
  }

  return (
    <DoctorDashboardLayout title="Doctor Dashboard">
      <div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Patients</div>
            <div className="text-xl sm:text-2xl font-bold">{totalPatients}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-muted-foreground mb-1">Today's Appointments</div>
            <div className="text-xl sm:text-2xl font-bold">{appointments.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:col-span-2 lg:col-span-1">
            <div className="text-sm text-muted-foreground mb-1">Case Sheets Created</div>
            <div className="text-xl sm:text-2xl font-bold">{totalCaseSheets}</div>
          </div>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Today's Appointments</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No appointments for today.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map(app => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">{app.patients?.first_name} {app.patients?.last_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm"><span className="font-medium">Age/Gender:</span> {app.patients?.age} / {app.patients?.gender}</div>
                  <div className="text-sm"><span className="font-medium">Contact:</span> {app.patients?.contact}</div>
                  <div className="text-sm"><span className="font-medium">Department:</span> {app.department}</div>
                  <div className="text-sm"><span className="font-medium">Sub-Department:</span> {app.sub_department}</div>
                  <div className="text-sm"><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      app.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="text-sm"><span className="font-medium">Scheduled:</span> {app.scheduled_at?.slice(0, 16).replace('T', ' ')}</div>
                  <Button className="mt-3 w-full text-sm" onClick={() => handleOpenCaseSheet(app)}>
                    Fill/View Case Sheet
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={showCaseSheetModal} onOpenChange={setShowCaseSheetModal}>
          <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fill/View Case Sheet</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <CaseSheetForm
                patientUhId={selectedAppointment.uhid}
                opNo={selectedAppointment.patients?.op_no}
                doctorId={selectedAppointment.doctor_id}
                doctorName={doctorName}
                patientName={`${selectedAppointment.patients?.first_name} ${selectedAppointment.patients?.last_name}`}
                age={selectedAppointment.patients?.age}
                gender={selectedAppointment.patients?.gender}
                contact={selectedAppointment.patients?.contact}
                address={selectedAppointment.patients?.address}
                department={selectedAppointment.department}
                onSave={handleCaseSheetSaved}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DoctorDashboardLayout>
  )
}

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<any | null>(null)
  const [totalPatients, setTotalPatients] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [occupiedBeds, setOccupiedBeds] = useState(0)
  const [totalBeds, setTotalBeds] = useState(0)
  const [pendingInvoices, setPendingInvoices] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalStaff, setTotalStaff] = useState(0)
  const [chartStartDate, setChartStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [chartEndDate, setChartEndDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as any | null
    if (storedRole) {
      setCurrentRole(storedRole)
    } else {
      window.location.href = "/signin"
    }
  }, [])

  useEffect(() => {
    async function fetchDashboardMetrics() {
      // Patients
      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
      setTotalPatients(patientCount || 0)
      // Appointments
      const { count: appointmentCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
      setTotalAppointments(appointmentCount || 0)
      // Beds
      const { data: bedsData } = await supabase
        .from("beds")
        .select("isOccupied")
      setTotalBeds(bedsData ? bedsData.length : 0)
      setOccupiedBeds(bedsData ? bedsData.filter(b => b.isOccupied).length : 0)
      // Invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("status, totalAmount")
      setPendingInvoices(invoicesData ? invoicesData.filter(inv => inv.status === "Pending").length : 0)
      setTotalRevenue(invoicesData ? invoicesData.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) : 0)
      // Staff
      const { count: staffCount } = await supabase
        .from("staff")
        .select("*", { count: "exact", head: true })
      setTotalStaff(staffCount || 0)
    }
    fetchDashboardMetrics()
  }, [])

  const newPatientsData = useMemo(
    () => (chartStartDate && chartEndDate ? [] : []),
    [chartStartDate, chartEndDate],
  )
  const bedOccupancyData = useMemo(
    () => (chartStartDate && chartEndDate ? [] : []),
    [chartStartDate, chartEndDate],
  )
  const staffDistributionData = useMemo(() => [], [])
  const bedCategoryDistributionData = useMemo(() => [], [])

  if (!currentRole) {
    return <div className="flex items-center justify-center h-screen text-lg">Loading...</div>
  }

  if (currentRole === "doctor") {
    return <DoctorDashboard />
  }

  if (currentRole === "pharmacist") {
    // Redirect to pharmacist dashboard
    window.location.href = "/pharmacist/dashboard"
    return <div className="flex items-center justify-center h-screen text-lg">Redirecting to Pharmacist Dashboard...</div>
  }

  if (currentRole === "receptionist") {
    // Redirect to receptionist dashboard with proper layout
    window.location.href = "/receptionist/dashboard"
    return <div className="flex items-center justify-center h-screen text-lg">Redirecting to Receptionist Dashboard...</div>
  }

  function handleLogout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRoleId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    window.location.href = "/signin";
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for larger screens */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Stethoscope className="h-6 w-6" />
              <span className="">Ayurvedic HMS</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {/* navLinks.map((link) => ( */}
                <Link
                  key="dashboard"
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Users className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  key="appointments"
                  href="/appointments"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <CalendarIconLucide className="h-4 w-4" />
                  <span>Appointments</span>
                </Link>
                <Link
                  key="patients"
                  href="/patients"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Users className="h-4 w-4" />
                  <span>Patients</span>
                </Link>
                <Link
                  key="case-sheets"
                  href="/case-sheets"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Case Sheets</span>
                </Link>
                <Link
                  key="invoices"
                  href="/invoices"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Invoices</span>
                </Link>
                <Link
                  key="settings"
                  href="/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              {/* ))} */}
            </nav>
          </div>
          {/* User profile and logout in sidebar */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                <AvatarFallback>{currentRole.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="font-semibold capitalize">{currentRole}</div>
                <div className="text-xs text-muted-foreground">user@example.com</div>
              </div>
            </div>
            <Separator className="my-3" />
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile navigation sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                  <Stethoscope className="h-6 w-6" />
                  <span className="sr-only">Ayurvedic HMS</span>
                </Link>
                {/* navLinks.map((link) => ( */}
                  <Link
                    key="dashboard"
                    href="/dashboard"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    key="appointments"
                    href="/appointments"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <CalendarIconLucide className="h-5 w-5" />
                    <span>Appointments</span>
                  </Link>
                  <Link
                    key="patients"
                    href="/patients"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    <span>Patients</span>
                  </Link>
                  <Link
                    key="case-sheets"
                    href="/case-sheets"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <ClipboardList className="h-5 w-5" />
                    <span>Case Sheets</span>
                  </Link>
                  <Link
                    key="invoices"
                    href="/invoices"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>Invoices</span>
                  </Link>
                  <Link
                    key="settings"
                    href="/settings"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                {/* ))} */}
              </nav>
              {/* User profile and logout in mobile sheet */}
              <div className="mt-auto pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>{currentRole.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <div className="font-semibold capitalize">{currentRole}</div>
                    <div className="text-xs text-muted-foreground">user@example.com</div>
                  </div>
                </div>
                <Separator className="my-3" />
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Dashboard</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatients}</div>
                <p className="text-xs text-muted-foreground">Registered patients</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <CalendarIconLucide className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">Total scheduled</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bed Occupancy</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {occupiedBeds} / {totalBeds}
                </div>
                <p className="text-xs text-muted-foreground">Currently occupied beds</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingInvoices}</div>
                <p className="text-xs text-muted-foreground">Unpaid invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From all payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStaff}</div>
                <p className="text-xs text-muted-foreground">Hospital employees</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Hospital Metrics Overview</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !chartStartDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIconLucide className="mr-2 h-4 w-4" />
                      {chartStartDate ? format(chartStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={chartStartDate}
                      onSelect={setChartStartDate}
                      initialFocus
                      toDate={chartEndDate} // Prevent selecting a start date after end date
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !chartEndDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIconLucide className="mr-2 h-4 w-4" />
                      {chartEndDate ? format(chartEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={chartEndDate}
                      onSelect={setChartEndDate}
                      initialFocus
                      fromDate={chartStartDate} // Prevent selecting an end date before start date
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DashboardCharts
              newPatientsData={newPatientsData}
              bedOccupancyData={bedOccupancyData}
              staffDistributionData={staffDistributionData}
              bedCategoryDistributionData={bedCategoryDistributionData}
              startDate={chartStartDate}
              endDate={chartEndDate}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
