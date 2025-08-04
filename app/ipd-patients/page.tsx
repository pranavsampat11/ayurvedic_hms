"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Users, Stethoscope, Settings, Menu, UserPlus, Package, BarChart, LogOut, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PatientRegistrationForm from "@/components/patient-registration-form"
import IPDTable from "@/components/ipd-table"
import BedAssignmentModal from "@/components/bed-assignment-modal"
import { toast } from "@/hooks/use-toast"

import { getNavigationLinks, type UserRole, getPatients, getAvailableBeds, assignBedToPatient, dischargePatientFromBed } from "@/lib/data"

export default function IPDPatientsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin") // Default role for this page demo
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [isBedAssignmentModalOpen, setIsBedAssignmentModalOpen] = useState(false)

  const ipdPatients = useMemo(() => getPatients({ type: "IPD" }), [])
  const availableBedsList = useMemo(() => getAvailableBeds(), [])

  const navLinks = getNavigationLinks(currentRole || "doctor")

  const handlePatientRegistered = () => {
    setIsRegistrationModalOpen(false)
    // Optionally refresh patient list if needed
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

  const handleDischargePatient = (patientUhId: string) => {
    if (window.confirm(`Are you sure you want to discharge patient ${patientUhId} from their bed?`)) {
      try {
        dischargePatientFromBed(patientUhId)
        toast({
          title: "Patient Discharged",
          description: `Patient ${patientUhId} discharged from bed successfully.`,
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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">IPD Patients</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">IPD Patient List</h2>
            <div className="flex gap-2">
              <Button onClick={() => setIsRegistrationModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Register New Patient
              </Button>
              <Button variant="outline" onClick={() => setIsBedAssignmentModalOpen(true)}>
                Assign Bed
              </Button>
            </div>
          </div>
          <IPDTable />
        </main>
      </div>

      {/* Patient Registration Modal */}
      <Dialog open={isRegistrationModalOpen} onOpenChange={setIsRegistrationModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
            <DialogDescription>Fill out the form to register a new inpatient.</DialogDescription>
          </DialogHeader>
          <PatientRegistrationForm onSave={handlePatientRegistered} />
        </DialogContent>
      </Dialog>

      {/* Bed Assignment Modal */}
      <BedAssignmentModal
        isOpen={isBedAssignmentModalOpen}
        onClose={() => setIsBedAssignmentModalOpen(false)}
        onAssign={handleAssignBed}
        patients={ipdPatients}
        availableBeds={availableBedsList}
      />
    </div>
  )
}
