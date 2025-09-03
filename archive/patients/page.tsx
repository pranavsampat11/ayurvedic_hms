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
  Search,
  PlusCircle,
  Filter,
  FileText,
  BedIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import PatientRegistrationForm from "@/components/patient-registration-form"
import OpdIpdAssignmentModal from "@/components/opd-ipd-assignment-modal"
import BedAssignmentModal from "@/components/bed-assignment-modal"
import PrintablePatientReport from "@/components/printable-patient-report"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import PatientVisitModal from "@/components/patient-visit-modal"
import PrintableCaseSheet from "@/components/printable-case-sheet";
import { Dialog as BillDialog, DialogContent as BillDialogContent, DialogHeader as BillDialogHeader, DialogTitle as BillDialogTitle } from "@/components/ui/dialog";

import {
  type UserRole,
  getPatients,
  getAvailableBeds,
  assignBedToPatient,
  dischargePatientFromBed,
  updatePatientStatus,
  getNavigationLinks,
  departments,
} from "@/lib/data"
import { supabase } from "@/lib/supabaseClient"

export default function PatientsPage() {
  const router = useRouter()
  const [currentRole, setCurrentRole] = useState<UserRole>("admin")
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as UserRole | null
    if (storedRole) {
      setCurrentRole(storedRole)
    } else {
      window.location.href = "/signin"
    }
  }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isOpdIpdModalOpen, setIsOpdIpdModalOpen] = useState(false)
  const [isBedAssignmentModalOpen, setIsBedAssignmentModalOpen] = useState(false)
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false);
  const [billPatient, setBillPatient] = useState<any | null>(null);

  // Filter states
  const [filterType, setFilterType] = useState<"All" | "OPD" | "IPD">("All")
  const [filterDepartment, setFilterDepartment] = useState<string>("All")
  const [filterSubDepartment, setFilterSubDepartment] = useState<string>("All")
  const [filterGender, setFilterGender] = useState<string>("All")
  const [filterStatus, setFilterStatus] = useState<string>("All")
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>(undefined)
  const [filterToDate, setFilterToDate] = useState<Date | undefined>(undefined)

  const [allPatients, setAllPatients] = useState<any[]>([])
  const [availableBeds, setAvailableBeds] = useState<any[]>([])
  const [doctorIdToName, setDoctorIdToName] = useState<Record<string, string>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(5); // TEMP: smaller page size for testing pagination

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase.from("patients").select("*")
      if (!error && data) setAllPatients(data)
      // Fetch doctor names for all unique doctor_ids
      const uniqueDoctorIds = Array.from(new Set((data || []).map((p: any) => p.doctor_id).filter(Boolean)));
      if (uniqueDoctorIds.length > 0) {
        const { data: staffData } = await supabase.from("staff").select("id, name").in("id", uniqueDoctorIds);
        if (staffData) {
          const map: Record<string, string> = {};
          staffData.forEach((doc: any) => { map[doc.id] = doc.name; });
          setDoctorIdToName(map);
        }
      }
    }
    fetchPatients()
  }, [])

  useEffect(() => {
    async function fetchAvailableBeds() {
      const { data, error } = await supabase.from("beds").select("*").eq("status", "Available")
      if (!error && data) setAvailableBeds(data)
    }
    fetchAvailableBeds()
  }, [])

  const filteredPatients = useMemo(() => {
    let patients = [...allPatients]

    if (filterType !== "All") {
      patients = patients.filter((p) => p.type === filterType)
    }
    if (filterDepartment !== "All") {
      patients = patients.filter((p) => p.department === filterDepartment)
    }
    if (filterSubDepartment !== "All") {
      patients = patients.filter((p) => p.subDepartment === filterSubDepartment)
    }
    if (filterGender !== "All") {
      patients = patients.filter((p) => p.gender === filterGender)
    }
    if (filterStatus !== "All") {
      patients = patients.filter((p) => p.status === filterStatus)
    }
    if (filterFromDate) {
      patients = patients.filter((p) => new Date(p.registrationDate) >= filterFromDate)
    }
    if (filterToDate) {
      patients = patients.filter((p) => new Date(p.registrationDate) <= filterToDate)
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      patients = patients.filter(
        (patient) =>
          (patient.first_name?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
          (patient.last_name?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
          (patient.uhid?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
          (patient.contact?.toLowerCase() || "").includes(lowerCaseSearchTerm)
      )
    }
    return patients
  }, [allPatients, searchTerm, filterType, filterDepartment, filterSubDepartment, filterGender, filterStatus, filterFromDate, filterToDate])

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterDepartment, filterSubDepartment, filterGender, filterStatus, filterFromDate, filterToDate]);

  const navLinks = getNavigationLinks(currentRole || "admin")

  const handlePatientRegistered = () => {
    setIsRegistrationModalOpen(false);
    toast({
      title: "Registration & Appointment Successful",
      description: "Patient registered and appointment scheduled.",
    });
    // Optionally, refresh patient list here
  }

  const handleAssignBed = (patientUhId: string, bedId: string) => {
    try {
      assignBedToPatient(patientUhId, bedId)
      toast({
        title: "Bed Assigned",
        description: `Bed ${bedId} assigned to patient ${patientUhId} successfully.`,
      })
      setIsBedAssignmentModalOpen(false)
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning the bed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDischargePatient = (uhid: string) => {
    if (window.confirm(`Are you sure you want to discharge patient ${uhid} from their bed?`)) {
      try {
        dischargePatientFromBed(uhid)
        toast({
          title: "Patient Discharged",
          description: `Patient ${uhid} discharged from bed successfully.`,
        })
      } catch (error) {
        toast({
          title: "Discharge Failed",
          description: "There was an error discharging the patient. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleUpdatePatientStatus = (uhid: string, newStatus: string) => {
    try {
      updatePatientStatus(uhid, newStatus)
      toast({
        title: "Patient Status Updated",
        description: `Patient ${uhid} status updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: "There was an error updating the patient status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewCaseSheet = (uhid: string) => {
    router.push(`/case-sheet/${uhid}`)
  }

  const handleClearFilters = () => {
    setFilterType("All")
    setFilterDepartment("All")
    setFilterSubDepartment("All")
    setFilterGender("All")
    setFilterStatus("All")
    setFilterFromDate(undefined)
    setFilterToDate(undefined)
    setSearchTerm("")
  }

  const handleGenerateBill = (patient: any) => {
    setBillPatient(patient);
    setShowBillModal(true);
  };

  const handlePrintBill = () => {
    if (!billPatient) return;
    const logoUrl = window.location.origin + "/my-logo.png";
    const billHtml = `
      <html>
        <head>
          <title>Patient Bill - ${billPatient.patient_name}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Times New Roman', serif; background: #fff; color: #000; }
            .a4 { width: 210mm; min-height: 297mm; padding: 32px 24px; margin: 0 auto; background: #fff; box-sizing: border-box; }
            .bill-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
            .bill-logo { height: 64px; }
            .bill-title { text-align: right; }
            .bill-title .main { font-size: 2rem; font-weight: bold; }
            .bill-title .sub { font-size: 1rem; color: #666; }
            .bill-details { margin-bottom: 24px; }
            .bill-details b { font-weight: bold; }
            .bill-table { width: 100%; margin-top: 24px; border-collapse: collapse; }
            .bill-table td { padding: 8px 0; font-size: 1.1rem; }
            .bill-table .label { text-align: left; }
            .bill-table .value { text-align: right; }
            .bill-total { font-size: 1.3rem; font-weight: bold; border-top: 2px solid #000; margin-top: 12px; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="a4">
            <div class="bill-header">
              <img src="${logoUrl}" alt="Logo" class="bill-logo" />
              <div class="bill-title">
                <div class="main">Ayurvedic Hospital</div>
                <div class="sub">Patient Bill</div>
              </div>
            </div>
            <div class="bill-details">
              <div><b>Patient Name:</b> ${billPatient.patient_name}</div>
              <div><b>UHID:</b> ${billPatient.uhid}</div>
              <div><b>OPD No:</b> ${billPatient.opd_no}</div>
              <div><b>Type:</b> ${billPatient.type}</div>
              <div><b>Department:</b> ${billPatient.department}</div>
              <div><b>Doctor:</b> ${billPatient.doctor}</div>
              <div><b>Date:</b> ${billPatient.date}</div>
              <div><b>Contact:</b> ${billPatient.contact}</div>
              <div><b>Address:</b> ${billPatient.address}</div>
            </div>
            <table class="bill-table">
              <tr><td class="label">Visit Charge</td><td class="value">₹${billPatient.bill_amount}</td></tr>
            </table>
            <div class="bill-total">Total: ₹${billPatient.bill_amount}</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (printWindow) {
      printWindow.document.write(billHtml);
      printWindow.document.close();
    }
  };

  const handleBillReady = async (patient: any) => {
    // Fetch latest OPD visit for this patient
    const { data: opdVisits } = await supabase
      .from("opd_visits")
      .select("*")
      .eq("uhid", patient.uhid)
      .order("visit_date", { ascending: false })
      .limit(1)
    const opdVisit = opdVisits && opdVisits.length > 0 ? opdVisits[0] : null
    // Fetch appointment for this OPD visit
    let appointment = null
    if (opdVisit && opdVisit.appointment_id) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", opdVisit.appointment_id)
        .single()
      appointment = appt || null
    }
    // Fetch department name
    let departmentName = "-"
    if (appointment && appointment.department_id) {
      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", appointment.department_id)
        .single()
      departmentName = dept?.name || "-"
    }
    // Fetch bill for this OPD visit
    let bill = null
    if (opdVisit) {
      const { data: bills } = await supabase
        .from("billing_records")
        .select("*")
        .eq("opd_no", opdVisit.opd_no)
        .order("bill_date", { ascending: false })
        .limit(1)
      bill = bills && bills.length > 0 ? bills[0] : null
    }
    // Fetch doctor name
    let doctorName = "-"
    if (appointment && appointment.doctor_id) {
      const { data: doc } = await supabase
        .from("staff")
        .select("full_name")
        .eq("id", appointment.doctor_id)
        .single()
      doctorName = doc?.full_name || appointment.doctor_id || "-"
    }
    // Combine all data for the bill modal
    const billModalData = {
      patient_name: patient.full_name || "-",
      uhid: patient.uhid || "-",
      opd_no: opdVisit?.opd_no || "-",
      type: "OPD",
      department: departmentName,
      doctor: doctorName,
      date: opdVisit?.visit_date || appointment?.appointment_date || "-",
      contact: patient.mobile || "-",
      address: patient.address || "-",
      bill_amount: bill?.amount || 0,
      bill_date: bill?.bill_date || "-",
      bill_description: bill?.description || "-",
    }
    console.log('Bill Modal Data:', billModalData)
    setBillPatient(billModalData)
    setShowBillModal(true)
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
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
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
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary">
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
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
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
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Patients</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Patients List</h2>
            <div className="flex gap-2">
              <Button onClick={() => setIsVisitModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Start Visit
              </Button>
              <Button onClick={() => setIsRegistrationModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Register New Patient
              </Button>
              <Button variant="outline" onClick={() => setIsOpdIpdModalOpen(true)}>
                Assign OPD/IPD Type
              </Button>
              <Button variant="outline" onClick={() => setIsBedAssignmentModalOpen(true)}>
                <BedIcon className="mr-2 h-4 w-4" /> Assign Bed
              </Button>
              <Button variant="outline" onClick={() => setIsPrintReportModalOpen(true)}>
                <FileText className="mr-2 h-4 w-4" /> Print Report
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" /> Patient Filters
              </CardTitle>
              <CardDescription>Filter patients by various criteria.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="filterType">Patient Type</Label>
                  <Select value={filterType} onValueChange={(value: "All" | "OPD" | "IPD") => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="OPD">OPD</SelectItem>
                      <SelectItem value="IPD">IPD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterDepartment">Department</Label>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterSubDepartment">Sub-department</Label>
                  <Select value={filterSubDepartment} onValueChange={setFilterSubDepartment} disabled={filterDepartment === "All"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Sub-departments</SelectItem>
                      {(departments.find((d) => d.name === filterDepartment)?.subDepartments || []).map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterGender">Gender</Label>
                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterStatus">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Discharged">Discharged</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterFromDate">Registration From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filterFromDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {filterFromDate ? format(filterFromDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filterFromDate}
                        onSelect={setFilterFromDate}
                        initialFocus
                        toDate={filterToDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterToDate">Registration To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filterToDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {filterToDate ? format(filterToDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filterToDate}
                        onSelect={setFilterToDate}
                        initialFocus
                        fromDate={filterFromDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2 col-span-full sm:col-span-2 md:col-span-3 lg:col-span-4">
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Table */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
              <CardDescription>Detailed list of all patients with filtering options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients by name, UHID, or contact..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UHID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No patients found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPatients.map((patient) => (
                        <TableRow key={patient.uhid}>
                          <TableCell className="font-mono">{patient.uhid}</TableCell>
                          <TableCell>
                            {patient.first_name} {patient.last_name}
                          </TableCell>
                          <TableCell>
                            {patient.age} / {patient.gender}
                          </TableCell>
                          <TableCell>{patient.contact}</TableCell>
                          <TableCell>{patient.patient_type}</TableCell>
                          <TableCell>{patient.department}</TableCell>
                          <TableCell>{doctorIdToName[patient.doctor_id] || patient.doctor_id || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={patient.status}
                              onValueChange={(value) => handleUpdatePatientStatus(patient.uhid, value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Discharged">Discharged</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewCaseSheet(patient.uhid)}
                              title="View Case Sheet"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View Case Sheet</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleGenerateBill(patient)}
                            >
                              Generate Bill
                            </Button>
                            {patient.type === "IPD" && patient.bedId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDischargePatient(patient.uhid)}
                                title="Discharge from Bed"
                              >
                                <BedIcon className="h-4 w-4" />
                                <span className="sr-only">Discharge from Bed</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Pagination Controls */}
          {filteredPatients.length > patientsPerPage && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1"
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="px-3 py-1 min-w-[40px]"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Patient Registration Modal */}
      <Dialog open={isRegistrationModalOpen} onOpenChange={setIsRegistrationModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>Fill out the form to register a new patient.</DialogDescription>
          </DialogHeader>
          <PatientRegistrationForm onSave={handlePatientRegistered} onBillReady={handleBillReady} />
        </DialogContent>
      </Dialog>

      {/* OPD/IPD Assignment Modal */}
      <OpdIpdAssignmentModal
        isOpen={isOpdIpdModalOpen}
        onClose={() => setIsOpdIpdModalOpen(false)}
        patients={allPatients}
      />

      {/* Bed Assignment Modal */}
      <BedAssignmentModal
        isOpen={isBedAssignmentModalOpen}
        onClose={() => setIsBedAssignmentModalOpen(false)}
        onAssign={handleAssignBed}
        patients={allPatients.filter((p) => p.type === "IPD" && !p.bedId)} // Only show IPD patients without a bed
        availableBeds={availableBeds}
      />

      {/* Print Report Modal */}
      <Dialog open={isPrintReportModalOpen} onOpenChange={setIsPrintReportModalOpen}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Patient Report</DialogTitle>
            <DialogDescription>Select options to generate a printable patient report.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            <PrintablePatientReport
              patients={filteredPatients} // Use currently filtered patients for the report
              tableType={filterType}
              filters={{
                department: filterDepartment,
                subDepartment: filterSubDepartment,
                gender: filterGender,
                status: filterStatus,
                fromDate: filterFromDate ? format(filterFromDate, "yyyy-MM-dd") : undefined,
                toDate: filterToDate ? format(filterToDate, "yyyy-MM-dd") : undefined,
                searchTerm: searchTerm,
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintReportModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Visit Modal */}
      <PatientVisitModal isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} onBillReady={handleBillReady} />

      {/* Patient Bill Modal */}
      <BillDialog open={showBillModal} onOpenChange={setShowBillModal}>
        <BillDialogContent className="max-w-lg w-full">
          <BillDialogHeader>
            <BillDialogTitle>Patient Bill</BillDialogTitle>
          </BillDialogHeader>
          {billPatient && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <img src="/my-logo.png" alt="Logo" className="h-12" />
                <div className="text-right">
                  <div className="font-bold text-lg">Ayurvedic Hospital</div>
                  <div className="text-xs text-muted-foreground">Patient Bill</div>
                </div>
              </div>
              <div className="mb-2"><b>Patient Name:</b> {billPatient.patient_name}</div>
              <div className="mb-2"><b>UHID:</b> {billPatient.uhid}</div>
              <div className="mb-2"><b>OPD No:</b> {billPatient.opd_no}</div>
              <div className="mb-2"><b>Type:</b> {billPatient.type}</div>
              <div className="mb-2"><b>Department:</b> {billPatient.department}</div>
              <div className="mb-2"><b>Doctor:</b> {billPatient.doctor}</div>
              <div className="mb-2"><b>Date:</b> {billPatient.date}</div>
              <div className="mb-2"><b>Contact:</b> {billPatient.contact}</div>
              <div className="mb-2"><b>Address:</b> {billPatient.address}</div>
              <hr className="my-4" />
              <div className="flex justify-between mb-2">
                <span>Visit Charge</span>
                <span>₹{billPatient.bill_amount}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{billPatient.bill_amount}</span>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handlePrintBill} variant="default" className="no-print">Print Bill</Button>
              </div>
            </div>
          )}
        </BillDialogContent>
      </BillDialog>
    </div>
  )
}
