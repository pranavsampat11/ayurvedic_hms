"use client"

import type React from "react"
import { useEffect } from "react"

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
import { toast } from "@/hooks/use-toast"
import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Stethoscope,
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

import { type Staff, getStaff, addStaff, updateStaff, deleteStaff, getNavigationLinks, type UserRole } from "@/lib/data"

export default function StaffPage() {
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null)

  const allStaff = useMemo(() => getStaff(), [])

  const filteredStaff = useMemo(() => {
    if (!searchTerm) {
      return allStaff
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allStaff.filter(
      (staff) =>
        staff.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.role.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.department.toLowerCase().includes(lowerCaseSearchTerm) ||
        staff.contact.includes(lowerCaseSearchTerm) ||
        staff.email.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [searchTerm, allStaff])

  const navLinks = getNavigationLinks(currentRole || "admin")

  const handleAddStaff = (formData: Partial<Staff>) => {
    if (!formData.firstName || !formData.lastName || !formData.role || !formData.email || !formData.contact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for staff registration.",
        variant: "destructive",
      })
      return
    }
    try {
      addStaff(formData as Staff)
      toast({
        title: "Staff Added",
        description: `${formData.firstName} ${formData.lastName} (${formData.role}) added successfully.`,
      })
      setIsAddModalOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Add Staff",
        description: "There was an error adding the staff member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStaff = (formData: Partial<Staff>) => {
    if (
      !currentStaff ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.role ||
      !formData.email ||
      !formData.contact
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for staff update.",
        variant: "destructive",
      })
      return
    }
    try {
      updateStaff({ ...currentStaff, ...formData } as Staff)
      toast({
        title: "Staff Updated",
        description: `${formData.firstName} ${formData.lastName} updated successfully.`,
      })
      setIsEditModalOpen(false)
      setCurrentStaff(null)
    } catch (error) {
      toast({
        title: "Failed to Update Staff",
        description: "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStaff = (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        deleteStaff(id)
        toast({
          title: "Staff Deleted",
          description: "The staff member has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Failed to Delete Staff",
          description: "There was an error deleting the staff member. Please try again.",
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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Staff Management</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Staff Directory</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search staff by name, role, department, or contact..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCurrentStaff(staff)
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(staff.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Staff Modal */}
      <StaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddStaff} />

      {/* Edit Staff Modal */}
      {currentStaff && (
        <StaffModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setCurrentStaff(null)
          }}
          onSave={handleUpdateStaff}
          initialData={currentStaff}
        />
      )}
    </div>
  )
}

interface StaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Partial<Staff>) => void
  initialData?: Staff | null
}

function StaffModal({ isOpen, onClose, onSave, initialData }: StaffModalProps) {
  const [formData, setFormData] = useState<Partial<Staff>>(
    initialData || {
      firstName: "",
      lastName: "",
      role: "doctor",
      department: "",
      contact: "",
      email: "",
      status: "Active",
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the staff member details." : "Fill in the details for the new staff member."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              First Name
            </Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Last Name
            </Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={(value) => handleSelectChange("role", value)} value={formData.role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="support staff">Support Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Input id="department" value={formData.department} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              Contact
            </Label>
            <Input id="contact" value={formData.contact} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Add Staff"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
