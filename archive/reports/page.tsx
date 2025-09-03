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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import DashboardCharts from "@/components/dashboard-charts" // Corrected import
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import PrintablePatientReport from "@/components/printable-patient-report"

import {
  getNavigationLinks,
  type UserRole,
  getDailyNewPatients,
  getDailyBedOccupancy,
  getStaffCountByRole,
  getBedCategoryDistribution,
  getStaff,
  getPatients,
  getBeds,
} from "@/lib/data"

export default function ReportsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin")
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") as UserRole | null
    if (storedRole) {
      setCurrentRole(storedRole)
    } else {
      window.location.href = "/signin"
    }
  }, [])

  // State for chart date filters
  const [chartStartDate, setChartStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [chartEndDate, setChartEndDate] = useState<Date | undefined>(new Date())

  // Data for charts (re-fetch on date range change)
  const newPatientsData = useMemo(
    () => (chartStartDate && chartEndDate ? getDailyNewPatients(chartStartDate, chartEndDate) : []),
    [chartStartDate, chartEndDate],
  )
  const bedOccupancyData = useMemo(
    () => (chartStartDate && chartEndDate ? getDailyBedOccupancy(chartStartDate, chartEndDate) : []),
    [chartStartDate, chartEndDate],
  )
  const staffDistributionData = useMemo(() => getStaffCountByRole(), [])
  const bedCategoryDistributionData = useMemo(() => getBedCategoryDistribution(), [])

  // Data for tables
  const [staffTableSearchTerm, setStaffTableSearchTerm] = useState("")
  const [patientTableSearchTerm, setPatientTableSearchTerm] = useState("")
  const [bedTableSearchTerm, setBedTableSearchTerm] = useState("")

  const filteredStaff = useMemo(() => {
    const allStaff = getStaff()
    if (!staffTableSearchTerm) return allStaff
    const lowerCaseSearchTerm = staffTableSearchTerm.toLowerCase()
    return allStaff.filter(
      (staff) =>
        staff.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.role.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.id.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [staffTableSearchTerm])

  const filteredPatients = useMemo(() => {
    const allPatients = getPatients()
    if (!patientTableSearchTerm) return allPatients
    const lowerCaseSearchTerm = patientTableSearchTerm.toLowerCase()
    return allPatients.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.uhid.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.contact.includes(lowerCaseSearchTerm),
    )
  }, [patientTableSearchTerm])

  // Pagination state for patients table
  const [currentPatientsPage, setCurrentPatientsPage] = useState(1);
  const [patientsPerPage] = useState(20);

  // Pagination logic for patients
  const indexOfLastPatient = currentPatientsPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPatientsPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handlePatientsPageChange = (pageNumber: number) => {
    setCurrentPatientsPage(pageNumber);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPatientsPage(1);
  }, [patientTableSearchTerm]);

  const filteredBeds = useMemo(() => {
    const allBeds = getBeds()
    if (!bedTableSearchTerm) return allBeds
    const lowerCaseSearchTerm = bedTableSearchTerm.toLowerCase()
    return allBeds.filter(
      (bed) =>
        bed.bedNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
        bed.ward.toLowerCase().includes(lowerCaseSearchTerm) ||
        bed.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        bed.id.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [bedTableSearchTerm])

  // Pagination state for beds table
  const [currentBedsPage, setCurrentBedsPage] = useState(1);
  const [bedsPerPage] = useState(20);

  // Pagination logic for beds
  const indexOfLastBed = currentBedsPage * bedsPerPage;
  const indexOfFirstBed = indexOfLastBed - bedsPerPage;
  const currentBeds = filteredBeds.slice(indexOfFirstBed, indexOfLastBed);
  const totalBedsPages = Math.ceil(filteredBeds.length / bedsPerPage);

  const handleBedsPageChange = (pageNumber: number) => {
    setCurrentBedsPage(pageNumber);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentBedsPage(1);
  }, [bedTableSearchTerm]);

  const navLinks = getNavigationLinks(currentRole || "admin")

  // Example usage: get all patients for the report
  const allPatients = getPatients({ type: "All" })

  // Default filters for the report preview (can be adjusted or made dynamic)
  const defaultFilters = {
    department: "All Departments",
    subDepartment: "All Sub-departments",
    fromDate: "N/A",
    toDate: "N/A",
    searchTerm: "N/A",
    gender: "All",
    status: "All",
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
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 print:hidden">
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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Reports</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
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

            {/* Tables for detailed data */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Directory</CardTitle>
                  <CardDescription>Overview of all hospital staff members.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search staff by name, role, or ID..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={staffTableSearchTerm}
                      onChange={(e) => setStaffTableSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No staff found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStaff.map((staff) => (
                            <TableRow key={staff.id}>
                              <TableCell className="font-mono">{staff.id}</TableCell>
                              <TableCell>
                                {staff.firstName} {staff.lastName}
                              </TableCell>
                              <TableCell>{staff.role}</TableCell>
                              <TableCell>{staff.department || "N/A"}</TableCell>
                              <TableCell>{staff.contact}</TableCell>
                              <TableCell>{staff.email}</TableCell>
                              <TableCell>{staff.status}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Directory</CardTitle>
                  <CardDescription>Comprehensive list of all registered patients.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search patients by name, UHID, or contact..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={patientTableSearchTerm}
                      onChange={(e) => setPatientTableSearchTerm(e.target.value)}
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
                          <TableHead>Department</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPatients.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No patients found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentPatients.map((patient) => (
                            <TableRow key={patient.uhid}>
                              <TableCell className="font-mono">{patient.uhid}</TableCell>
                              <TableCell>
                                {patient.firstName} {patient.lastName}
                              </TableCell>
                              <TableCell>
                                {patient.age} / {patient.gender}
                              </TableCell>
                              <TableCell>{patient.contact}</TableCell>
                              <TableCell>{patient.department}</TableCell>
                              <TableCell>{patient.assignedDoctor}</TableCell>
                              <TableCell>{patient.status}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination Controls for Patients */}
                  {filteredPatients.length > patientsPerPage && (
                    <div className="flex items-center justify-between mt-4 px-4 pb-4">
                      <div className="text-sm text-gray-700">
                        Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePatientsPageChange(currentPatientsPage - 1)}
                          disabled={currentPatientsPage === 1}
                          className="px-3 py-1"
                        >
                          Previous
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPatientsPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPatientsPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPatientsPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPatientsPage >= totalPatientsPages - 2) {
                              pageNumber = totalPatientsPages - 4 + i;
                            } else {
                              pageNumber = currentPatientsPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPatientsPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePatientsPageChange(pageNumber)}
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
                          onClick={() => handlePatientsPageChange(currentPatientsPage + 1)}
                          disabled={currentPatientsPage === totalPatientsPages}
                          className="px-3 py-1"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bed Status</CardTitle>
                  <CardDescription>Current occupancy and availability of hospital beds.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search beds by number, ward, or category..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={bedTableSearchTerm}
                      onChange={(e) => setBedTableSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bed ID</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Ward</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Occupied</TableHead>
                          <TableHead>Patient UHID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentBeds.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No beds found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentBeds.map((bed) => (
                            <TableRow key={bed.id}>
                              <TableCell className="font-mono">{bed.id}</TableCell>
                              <TableCell>{bed.roomNumber}</TableCell>
                              <TableCell>{bed.ward}</TableCell>
                              <TableCell>{bed.category}</TableCell>
                              <TableCell>{bed.isOccupied ? "Yes" : "No"}</TableCell>
                              <TableCell>{bed.patientUhId || "N/A"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination Controls for Beds */}
                  {filteredBeds.length > bedsPerPage && (
                    <div className="flex items-center justify-between mt-4 px-4 pb-4">
                      <div className="text-sm text-gray-700">
                        Showing {indexOfFirstBed + 1} to {Math.min(indexOfLastBed, filteredBeds.length)} of {filteredBeds.length} beds
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBedsPageChange(currentBedsPage - 1)}
                          disabled={currentBedsPage === 1}
                          className="px-3 py-1"
                        >
                          Previous
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalBedsPages) }, (_, i) => {
                            let pageNumber;
                            if (totalBedsPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentBedsPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentBedsPage >= totalBedsPages - 2) {
                              pageNumber = totalBedsPages - 4 + i;
                            } else {
                              pageNumber = currentBedsPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNumber}
                                variant={currentBedsPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleBedsPageChange(pageNumber)}
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
                          onClick={() => handleBedsPageChange(currentBedsPage + 1)}
                          disabled={currentBedsPage === totalBedsPages}
                          className="px-3 py-1"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Printable Patient Report */}
            <div className="flex flex-col items-center justify-center p-4 md:p-6">
              <PrintablePatientReport patients={allPatients} tableType="All" filters={defaultFilters} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
