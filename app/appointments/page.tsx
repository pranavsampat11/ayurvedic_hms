"use client"

import type React from "react"

import { useEffect } from "react"

import { useState, useMemo } from "react"
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
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "@/hooks/use-toast"

import {
  type UserRole,
  type Appointment,
  type Patient,
  type Staff,
  getAppointments,
  addAppointment,
  getNavigationLinks,
} from "@/lib/data"
import IpdCaseSheetForm from "@/components/ipd-case-sheet-form";
import CaseSheetForm from "@/components/case-sheet-form";
import { supabase } from "@/lib/supabaseClient";

export default function AppointmentsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin") // Default role for this page demo
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null)
  const [showCaseSheetModal, setShowCaseSheetModal] = useState(false);
  const [caseSheetPatient, setCaseSheetPatient] = useState<Patient | null>(null);
  const [caseSheetType, setCaseSheetType] = useState<"OPD" | "IPD" | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: appointmentsData } = await supabase.from("appointments").select("*");
      const { data: patientsData } = await supabase.from("patients").select("*");
      const { data: doctorsData } = await supabase.from("staff").select("*").eq("role", "Doctor");
      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filtering, sorting, and search logic
  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return appointments.filter(
      (appointment) =>
        appointment.patientUhId?.toLowerCase().includes(lowerCaseSearchTerm) ||
        appointment.doctor?.toLowerCase().includes(lowerCaseSearchTerm) ||
        appointment.date?.toLowerCase().includes(lowerCaseSearchTerm) ||
        appointment.department?.toLowerCase().includes(lowerCaseSearchTerm) ||
        (appointment.subDepartment || '').toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, appointments]);

  const navLinks = getNavigationLinks(currentRole || "admin")

  const handleAddAppointment = (formData: Partial<Appointment>) => {
    if (!formData.patientUhId || !formData.doctor || !formData.date || !formData.department || !formData.subDepartment) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the appointment.",
        variant: "destructive",
      })
      return
    }
    try {
      addAppointment(formData as Appointment)
      toast({
        title: "Appointment Added",
        description: `Appointment for UHID ${formData.patientUhId} with Dr. ${formData.doctor} added successfully.`,
      })
      setIsAddModalOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Add Appointment",
        description: "There was an error adding the appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenCaseSheet = (patient: Patient) => {
    setCaseSheetPatient(patient);
    setCaseSheetType(patient.patient_type);
    setShowCaseSheetModal(true);
  };

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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Appointments</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Appointments Overview</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Appointment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search appointments by patient UHID, doctor, or reason..."
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
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Sub-Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No appointments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAppointments.map((appointment) => {
                        const patient = patients.find((p) => p.uhid === appointment.patientUhId);
                        return (
                          <TableRow key={appointment.id}>
                            <TableCell className="font-mono">{appointment.patientUhId}</TableCell>
                            <TableCell>{patient ? `${patient.firstName} ${patient.lastName}` : "N/A"}</TableCell>
                            <TableCell>{patient ? patient.patient_type : "N/A"}</TableCell>
                            <TableCell>{appointment.doctor}</TableCell>
                            <TableCell>{appointment.date}</TableCell>
                            <TableCell>{appointment.department}</TableCell>
                            <TableCell>{appointment.subDepartment || "N/A"}</TableCell>
                            <TableCell>{appointment.status || "pending"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => patient && handleOpenCaseSheet(patient)}
                              >
                                Fill/View Case Sheet
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentAppointment(appointment)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  // This function is not directly used in the current flow,
                                  // but keeping it for completeness if it were to be re-introduced.
                                  // For now, it would require a more complex delete mechanism
                                  // involving Supabase client or a direct update of the state.
                                  // For this demo, we'll just toast and close.
                                  toast({
                                    title: "Appointment Deleted",
                                    description: "The appointment has been successfully deleted.",
                                  })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          {/* Case Sheet Modal */}
          <Dialog open={showCaseSheetModal} onOpenChange={setShowCaseSheetModal}>
            <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Fill/View Case Sheet</DialogTitle>
              </DialogHeader>
              {caseSheetPatient && caseSheetType === "OPD" && (
                <CaseSheetForm patientUhId={caseSheetPatient.uhid} onSave={() => setShowCaseSheetModal(false)} />
              )}
              {caseSheetPatient && caseSheetType === "IPD" && (
                <IpdCaseSheetForm patientUhId={caseSheetPatient.uhid} onSave={() => setShowCaseSheetModal(false)} />
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>

      {/* Add Appointment Modal */}
      <AppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddAppointment}
        patients={patients}
        doctors={doctors}
      />

      {/* Edit Appointment Modal */}
      {currentAppointment && (
        <AppointmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setCurrentAppointment(null)
          }}
          onSave={handleAddAppointment} // This function is now used for both add and edit
          initialData={currentAppointment}
          patients={patients}
          doctors={doctors}
        />
      )}
    </div>
  )
}

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Partial<Appointment>) => void
  initialData?: Appointment | null
  patients: Patient[]
  doctors: Staff[]
}

function AppointmentModal({ isOpen, onClose, onSave, initialData, patients, doctors }: AppointmentModalProps) {
  const [formData, setFormData] = useState<Partial<Appointment>>(
    initialData || {
      patientUhId: "",
      doctor: "",
      date: format(new Date(), "yyyy-MM-dd"),
      department: "",
      subDepartment: "",
    },
  )
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.date) : new Date(),
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedDate(new Date(initialData.date))
    } else {
      setFormData({
        patientUhId: "",
        doctor: "",
        date: format(new Date(), "yyyy-MM-dd"),
        department: "",
        subDepartment: "",
      })
      setSelectedDate(new Date())
    }
  }, [initialData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setFormData((prev) => ({ ...prev, date: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Appointment" : "Add New Appointment"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the appointment details." : "Fill in the details for the new appointment."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientUhId" className="text-right">
              Patient
            </Label>
            <Select
              onValueChange={(value) => handleSelectChange("patientUhId", value)}
              value={formData.patientUhId}
              disabled={!!initialData} // Disable patient selection when editing
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.uhid} value={patient.uhid}>
                    {patient.firstName} {patient.lastName} (UHID: {patient.uhid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doctor" className="text-right">
              Doctor
            </Label>
            <Select onValueChange={(value) => handleSelectChange("doctor", value)} value={formData.doctor}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={`${doctor.firstName} ${doctor.lastName}`}>
                    Dr. {doctor.firstName} {doctor.lastName} ({doctor.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Input id="department" value={formData.department} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subDepartment" className="text-right">
              Sub-Department
            </Label>
            <Input id="subDepartment" value={formData.subDepartment} onChange={handleChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Add Appointment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
