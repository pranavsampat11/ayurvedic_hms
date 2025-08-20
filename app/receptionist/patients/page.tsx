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
  getNavigationLinks,
  departments,
} from "@/lib/data"
import { supabase } from "@/lib/supabaseClient"

export default function ReceptionistPatientsPage() {
  const router = useRouter()
  const [currentRole, setCurrentRole] = useState<UserRole>("receptionist")
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
  const [pagePatients, setPagePatients] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [availableBeds, setAvailableBeds] = useState<any[]>([]) // Disabled - beds table doesn't exist
  const [doctorIdToName, setDoctorIdToName] = useState<Record<string, string>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(20);

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase.from("patients").select("*")
      if (!error && data) setAllPatients(data)
    }
    fetchPatients()
  }, [])

  // Server-side pagination when no filters/search are active
  const canUseServerPagination =
    searchTerm.trim() === "" &&
    filterType === "All" &&
    filterDepartment === "All" &&
    filterSubDepartment === "All" &&
    filterGender === "All" &&
    filterStatus === "All" &&
    !filterFromDate &&
    !filterToDate

  useEffect(() => {
    async function loadServerPage() {
      if (!canUseServerPagination) return
      const from = (currentPage - 1) * patientsPerPage
      const to = from + patientsPerPage - 1
      const { data, count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)
      if (!error) {
        setPagePatients(data || [])
        setTotalCount(count || 0)
      }
    }
    loadServerPage()
  }, [canUseServerPagination, currentPage, patientsPerPage])

  // useEffect(() => {
  //   async function fetchAvailableBeds() {
  //     const { data, error } = await supabase.from("beds").select("*").eq("is_occupied", false)
  //     if (!error && data) setAvailableBeds(data)
  //   }
  //   fetchAvailableBeds()
  // }, [])
  // Disabled - beds table doesn't exist in database schema

  useEffect(() => {
    async function fetchDoctorNames() {
      const { data, error } = await supabase.from("staff").select("id, full_name")
      if (!error && data) {
        const doctorMap: Record<string, string> = {}
        data.forEach((doctor) => {
          doctorMap[doctor.id] = doctor.full_name
        })
        setDoctorIdToName(doctorMap)
      }
    }
    fetchDoctorNames()
  }, [])

  const handlePatientRegistered = () => {
    setIsRegistrationModalOpen(false)
    // Refresh the patients list
    window.location.reload()
  }

  const handleAssignBed = async (patientUhId: string, bedId: string) => {
    // Disabled - beds table doesn't exist in database schema
    toast({
      title: "Feature Disabled",
      description: "Bed assignment is not available - beds table not configured",
      variant: "destructive",
    })
  }

  const handleDischargePatient = (uhid: string) => {
    // Implementation for patient discharge
    console.log(`Discharging patient ${uhid}`)
  }

  const handleUpdatePatientStatus = (uhid: string, newStatus: string) => {
    // Implementation for status update
    console.log(`Updating patient ${uhid} status to ${newStatus}`)
  }

  const handleViewCaseSheet = (uhid: string) => {
    // Implementation for viewing case sheet
    console.log(`Viewing case sheet for patient ${uhid}`)
  }

  const handleClearFilters = () => {
    setFilterType("All")
    setFilterDepartment("All")
    setFilterSubDepartment("All")
    setFilterGender("All")
    setFilterStatus("All")
    setFilterFromDate(undefined)
    setFilterToDate(undefined)
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
          <title>Patient Bill - ${billPatient.full_name}</title>
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
              <div><b>Patient Name:</b> ${billPatient.full_name}</div>
              <div><b>UHID:</b> ${billPatient.uhid}</div>
              <div><b>Type:</b> ${billPatient.patient_type}</div>
              <div><b>Department:</b> ${billPatient.department || '-'}</div>
              <div><b>Sub Department:</b> ${billPatient.sub_department || '-'}</div>
              <div><b>Contact:</b> ${billPatient.mobile}</div>
              <div><b>Address:</b> ${billPatient.address || '-'}</div>
              <div><b>Date:</b> ${new Date().toLocaleDateString()}</div>
            </div>
            <table class="bill-table">
              <tr><td class="label">Registration Fee</td><td class="value">₹500.00</td></tr>
              <tr><td class="label">Consultation Fee</td><td class="value">₹200.00</td></tr>
            </table>
            <div class="bill-total">Total: ₹700.00</div>
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
  }

  const handleBillReady = async (patient: any) => {
    try {
      // Create a new billing record using the correct table name
      const { error } = await supabase.from("billing_records").insert([
        {
          opd_no: null, // Will be set when OPD visit is created
          ipd_no: null, // Will be set when IPD admission is created
          bill_date: new Date().toISOString(),
          description: `Bill for ${patient.full_name}`,
          amount: 0 // This will be calculated based on services
        }
      ])

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Success", description: "Bill generated successfully!" })
        setShowBillModal(false)
        setBillPatient(null)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate bill", variant: "destructive" })
    }
  }

  const filteredPatients = useMemo(() => {
    return allPatients.filter((patient) => {
      const matchesSearch = patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.uhid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.mobile?.includes(searchTerm)

      const matchesType = filterType === "All" || patient.patient_type === filterType
      const matchesDepartment = filterDepartment === "All" || patient.department === filterDepartment
      const matchesSubDepartment = filterSubDepartment === "All" || patient.sub_department === filterSubDepartment
      const matchesGender = filterGender === "All" || patient.gender === filterGender
      const matchesStatus = filterStatus === "All" || patient.status === filterStatus

      let matchesDate = true
      if (filterFromDate || filterToDate) {
        const registrationDate = new Date(patient.registration_date)
        if (filterFromDate && registrationDate < filterFromDate) matchesDate = false
        if (filterToDate && registrationDate > filterToDate) matchesDate = false
      }

      return matchesSearch && matchesType && matchesDepartment && matchesSubDepartment && matchesGender && matchesStatus && matchesDate
    })
  }, [allPatients, searchTerm, filterType, filterDepartment, filterSubDepartment, filterGender, filterStatus, filterFromDate, filterToDate])

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = canUseServerPagination
    ? pagePatients
    : filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil((canUseServerPagination ? totalCount : filteredPatients.length) / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterDepartment, filterSubDepartment, filterGender, filterStatus, filterFromDate, filterToDate]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Patients</h1>
          <p className="text-slate-600 mt-1">Manage patient registration, visits, and assignments</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsVisitModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Start Visit
          </Button>
          <Button onClick={() => setIsRegistrationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Register New Patient
          </Button>
          <Button variant="outline" onClick={() => setIsOpdIpdModalOpen(true)} className="border-slate-200 hover:bg-slate-50">
            Assign OPD/IPD Type
          </Button>
          <Button variant="outline" disabled className="border-slate-200 hover:bg-slate-50 opacity-50 cursor-not-allowed" title="Bed assignment not available - beds table not configured">
            <BedIcon className="mr-2 h-4 w-4" /> Assign Bed
          </Button>
          <Button variant="outline" onClick={() => setIsPrintReportModalOpen(true)} className="border-slate-200 hover:bg-slate-50">
            <FileText className="mr-2 h-4 w-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Patient Filters
          </CardTitle>
          <CardDescription>Filter patients by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Patient Type</Label>
              <Select value={filterType} onValueChange={(value: "All" | "OPD" | "IPD") => setFilterType(value)}>
                <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="OPD">OPD</SelectItem>
                  <SelectItem value="IPD">IPD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1 border-slate-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Consulted">Consulted</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Registration From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="mt-1 w-full justify-start text-left font-normal border-slate-200 hover:bg-slate-50">
                    {filterFromDate ? format(filterFromDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filterFromDate} onSelect={setFilterFromDate} />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Registration To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="mt-1 w-full justify-start text-left font-normal border-slate-200 hover:bg-slate-50">
                    {filterToDate ? format(filterToDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filterToDate} onSelect={setFilterToDate} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search patients by name, UHID, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleClearFilters} className="border-slate-200 hover:bg-slate-50">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details Section */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-slate-800">Patient Details</CardTitle>
          <CardDescription>Detailed list of all patients with filtering options</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">UHID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Age/Gender</TableHead>
                    <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Department</TableHead>
                    <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="text-slate-500">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">No patients found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPatients.map((patient) => (
                      <TableRow key={patient.uhid} className="hover:bg-slate-50">
                        <TableCell className="font-mono text-blue-600">{patient.uhid}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{patient.full_name}</TableCell>
                        <TableCell className="text-slate-600">{patient.age} / {patient.gender}</TableCell>
                        <TableCell className="text-slate-600">{patient.mobile}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            patient.patient_type === "IPD" 
                              ? "bg-purple-100 text-purple-800" 
                              : "bg-blue-100 text-blue-800"
                          )}>
                            {patient.patient_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">{patient.department || "-"}</TableCell>
                        <TableCell className="text-slate-600">{doctorIdToName[patient.assigned_doctor] || "-"}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            patient.status === "Admitted" ? "bg-green-100 text-green-800" :
                            patient.status === "Discharged" ? "bg-red-100 text-red-800" :
                            patient.status === "Consulted" ? "bg-yellow-100 text-yellow-800" :
                            "bg-slate-100 text-slate-800"
                          )}>
                            {patient.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewCaseSheet(patient.uhid)} className="border-slate-200 hover:bg-slate-50">
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleGenerateBill(patient)} className="border-slate-200 hover:bg-slate-50">
                              Bill
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {currentPatients.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-medium">No patients found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {currentPatients.map((patient) => (
                    <Card key={patient.uhid} className="bg-white border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Patient Info */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-slate-800 text-lg">{patient.full_name}</h3>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                patient.patient_type === "IPD" 
                                  ? "bg-purple-100 text-purple-800" 
                                  : "bg-blue-100 text-blue-800"
                              )}>
                                {patient.patient_type}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <div><strong>UHID:</strong> <span className="font-mono text-blue-600">{patient.uhid}</span></div>
                              <div><strong>Age/Gender:</strong> {patient.age} / {patient.gender}</div>
                              <div><strong>Contact:</strong> {patient.mobile}</div>
                              <div><strong>Department:</strong> {patient.department || "-"}</div>
                              <div><strong>Doctor:</strong> {doctorIdToName[patient.assigned_doctor] || "-"}</div>
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              patient.status === "Admitted" ? "bg-green-100 text-green-800" :
                              patient.status === "Discharged" ? "bg-red-100 text-red-800" :
                              patient.status === "Consulted" ? "bg-yellow-100 text-yellow-800" :
                              "bg-slate-100 text-slate-800"
                            )}>
                              {patient.status}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewCaseSheet(patient.uhid)} className="border-slate-200 hover:bg-slate-50 flex-1">
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleGenerateBill(patient)} className="border-slate-200 hover:bg-slate-50 flex-1">
                              Bill
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Pagination Controls */}
      {(canUseServerPagination ? totalCount : filteredPatients.length) > patientsPerPage && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {canUseServerPagination ? (
                  <>Showing {(currentPage - 1) * patientsPerPage + 1} to {Math.min(currentPage * patientsPerPage, totalCount)} of {totalCount} patients</>
                ) : (
                  <>Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients</>
                )}
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

      {/* Patient Registration Modal */}
      <Dialog open={isRegistrationModalOpen} onOpenChange={setIsRegistrationModalOpen}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>Fill out the form to register a new patient.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <PatientRegistrationForm onSave={handlePatientRegistered} onBillReady={handleBillReady} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Visit Modal */}
      <PatientVisitModal isOpen={isVisitModalOpen} onClose={() => setIsVisitModalOpen(false)} onBillReady={handleBillReady} />

      {/* OPD/IPD Assignment Modal */}
      <OpdIpdAssignmentModal
        isOpen={isOpdIpdModalOpen}
        onClose={() => setIsOpdIpdModalOpen(false)}
        patients={allPatients}
      />

      {/* Bed Assignment Modal - Disabled */}
      {/* <BedAssignmentModal
        isOpen={isBedAssignmentModalOpen}
        onClose={() => setIsBedAssignmentModalOpen(false)}
        onAssign={handleAssignBed}
        patients={allPatients.filter((p) => p.patient_type === "IPD" && !p.bed_id)}
        availableBeds={availableBeds}
      /> */}

      {/* Print Report Modal */}
      <Dialog open={isPrintReportModalOpen} onOpenChange={setIsPrintReportModalOpen}>
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Patient Report</DialogTitle>
            <DialogDescription>Select options to generate a printable patient report.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            <PrintablePatientReport
              patients={filteredPatients}
              beds={availableBeds}
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

      {/* Bill Modal */}
      <BillDialog open={showBillModal} onOpenChange={setShowBillModal}>
        <BillDialogContent className="max-w-lg w-full">
          <BillDialogHeader>
            <BillDialogTitle>Generate Bill</BillDialogTitle>
          </BillDialogHeader>
          <div className="space-y-4">
            {billPatient && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-800">{billPatient.full_name}</h3>
                <p className="text-sm text-slate-600">UHID: {billPatient.uhid}</p>
                <p className="text-sm text-slate-600">Type: {billPatient.patient_type}</p>
              </div>
            )}
            <div className="text-sm text-slate-600">
              This will create a new bill for the selected patient. You can add services and items to the bill after creation.
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowBillModal(false)} className="border-slate-200">
              Cancel
            </Button>
            <Button onClick={() => handleBillReady(billPatient)} className="bg-blue-600 hover:bg-blue-700">
              Generate Bill
            </Button>
            <Button onClick={handlePrintBill} variant="outline" className="border-slate-200">
              Print Bill
            </Button>
          </div>
        </BillDialogContent>
      </BillDialog>
    </div>
  )
} 