"use client"

import type React from "react"

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
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
  Edit,
  Trash2,
} from "lucide-react"

import {
  type UserRole,
  type Consultation,
  type Patient,
  type Staff,
  getConsultations,
  getPatients,
  getStaff,
  addConsultation,
  updateConsultation,
  deleteConsultation,
  getNavigationLinks,
} from "@/lib/data"

export default function ConsultationsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("doctor") // Default role for this page demo
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null)

  const allConsultations = useMemo(() => getConsultations(), [])
  const allPatients = useMemo(() => getPatients(), [])
  const allDoctors = useMemo(() => getStaff().filter((s) => s.role === "doctor"), [])

  const filteredConsultations = useMemo(() => {
    if (!searchTerm) {
      return allConsultations
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allConsultations.filter(
      (consultation) =>
        consultation.patientUhId.toLowerCase().includes(lowerCaseSearchTerm) ||
        consultation.doctorName.toLowerCase().includes(lowerCaseSearchTerm) ||
        consultation.reason.toLowerCase().includes(lowerCaseSearchTerm) ||
        consultation.status.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [searchTerm, allConsultations])

  const navLinks = getNavigationLinks(currentRole || "doctor")

  const handleAddConsultation = (formData: Partial<Consultation>) => {
    if (!formData.patientUhId || !formData.doctorName || !formData.consultationDate || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the consultation.",
        variant: "destructive",
      })
      return
    }
    try {
      addConsultation(formData as Consultation)
      toast({
        title: "Consultation Added",
        description: `Consultation for UHID ${formData.patientUhId} with Dr. ${formData.doctorName} added successfully.`,
      })
      setIsAddModalOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Add Consultation",
        description: "There was an error adding the consultation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateConsultation = (formData: Partial<Consultation>) => {
    if (
      !currentConsultation ||
      !formData.patientUhId ||
      !formData.doctorName ||
      !formData.consultationDate ||
      !formData.reason
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the consultation.",
        variant: "destructive",
      })
      return
    }
    try {
      updateConsultation({ ...currentConsultation, ...formData } as Consultation)
      toast({
        title: "Consultation Updated",
        description: `Consultation for UHID ${formData.patientUhId} updated successfully.`,
      })
      setIsEditModalOpen(false)
      setCurrentConsultation(null)
    } catch (error) {
      toast({
        title: "Failed to Update Consultation",
        description: "There was an error updating the consultation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConsultation = (id: string) => {
    if (window.confirm("Are you sure you want to delete this consultation?")) {
      try {
        deleteConsultation(id)
        toast({
          title: "Consultation Deleted",
          description: "The consultation has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Failed to Delete Consultation",
          description: "There was an error deleting the consultation. Please try again.",
          variant: "destructive",
        })
      }
    }
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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Consultations</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Consultations Overview</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Consultation
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search consultations by patient UHID, doctor, or reason..."
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
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No consultations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConsultations.map((consultation) => {
                        const patient = allPatients.find((p) => p.uhid === consultation.patientUhId)
                        return (
                          <TableRow key={consultation.id}>
                            <TableCell className="font-mono">{consultation.patientUhId}</TableCell>
                            <TableCell>{patient ? `${patient.firstName} ${patient.lastName}` : "N/A"}</TableCell>
                            <TableCell>{consultation.doctorName}</TableCell>
                            <TableCell>{consultation.consultationDate}</TableCell>
                            <TableCell>{consultation.reason}</TableCell>
                            <TableCell>{consultation.status}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentConsultation(consultation)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteConsultation(consultation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Consultation Modal */}
      <ConsultationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddConsultation}
        patients={allPatients}
        doctors={allDoctors}
      />

      {/* Edit Consultation Modal */}
      {currentConsultation && (
        <ConsultationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setCurrentConsultation(null)
          }}
          onSave={handleUpdateConsultation}
          initialData={currentConsultation}
          patients={allPatients}
          doctors={allDoctors}
        />
      )}
    </div>
  )
}

interface ConsultationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Partial<Consultation>) => void
  initialData?: Consultation | null
  patients: Patient[]
  doctors: Staff[]
}

function ConsultationModal({ isOpen, onClose, onSave, initialData, patients, doctors }: ConsultationModalProps) {
  const [formData, setFormData] = useState<Partial<Consultation>>(
    initialData || {
      patientUhId: "",
      doctorName: "",
      consultationDate: format(new Date(), "yyyy-MM-dd"),
      reason: "",
      status: "Scheduled",
      notes: "",
    },
  )
  const [selectedConsultationDate, setSelectedConsultationDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.consultationDate) : new Date(),
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedConsultationDate(new Date(initialData.consultationDate))
    } else {
      setFormData({
        patientUhId: "",
        doctorName: "",
        consultationDate: format(new Date(), "yyyy-MM-dd"),
        reason: "",
        status: "Scheduled",
        notes: "",
      })
      setSelectedConsultationDate(new Date())
    }
  }, [initialData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleConsultationDateSelect = (date: Date | undefined) => {
    setSelectedConsultationDate(date)
    setFormData((prev) => ({ ...prev, consultationDate: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Consultation" : "Add New Consultation"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the consultation details." : "Fill in the details for the new consultation."}
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
            <Label htmlFor="doctorName" className="text-right">
              Doctor
            </Label>
            <Select onValueChange={(value) => handleSelectChange("doctorName", value)} value={formData.doctorName}>
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
            <Label htmlFor="consultationDate" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !selectedConsultationDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {selectedConsultationDate ? format(selectedConsultationDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedConsultationDate}
                  onSelect={handleConsultationDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Input id="reason" value={formData.reason} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select onValueChange={(value) => handleSelectChange("status", value)} value={formData.status}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input id="notes" value={formData.notes} onChange={handleChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Add Consultation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
