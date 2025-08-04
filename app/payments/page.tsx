"use client"

import type React from "react"

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
  Receipt,
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
  type Payment,
  type Patient,
  getPayments,
  getPatients,
  addPayment,
  updatePayment,
  deletePayment,
} from "@/lib/data"

// Declare the getNavigationLinks function
function getNavigationLinks(role: UserRole) {
  return [
    { name: "Dashboard", href: "/dashboard", icon: Stethoscope },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Staff", href: "/staff", icon: UserPlus },
    { name: "Beds", href: "/beds", icon: Package },
    { name: "Reports", href: "/reports", icon: BarChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ]
}

export default function PaymentsPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin") // Default role for this page demo
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null)

  const allPayments = useMemo(() => getPayments(), [])
  const allPatients = useMemo(() => getPatients(), [])

  const filteredPayments = useMemo(() => {
    if (!searchTerm) {
      return allPayments
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allPayments.filter(
      (payment) =>
        payment.patientUhId.toLowerCase().includes(lowerCaseSearchTerm) ||
        payment.paymentMethod.toLowerCase().includes(lowerCaseSearchTerm) ||
        payment.status.toLowerCase().includes(lowerCaseSearchTerm) ||
        payment.transactionId.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [searchTerm, allPayments])

  const navLinks = getNavigationLinks(currentRole)

  const handleAddPayment = (formData: Partial<Payment>) => {
    if (!formData.patientUhId || !formData.amount || !formData.paymentDate || !formData.paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the payment.",
        variant: "destructive",
      })
      return
    }
    try {
      addPayment(formData as Payment)
      toast({
        title: "Payment Added",
        description: `Payment for UHID ${formData.patientUhId} added successfully.`,
      })
      setIsAddModalOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Add Payment",
        description: "There was an error adding the payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePayment = (formData: Partial<Payment>) => {
    if (
      !currentPayment ||
      !formData.patientUhId ||
      !formData.amount ||
      !formData.paymentDate ||
      !formData.paymentMethod
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the payment.",
        variant: "destructive",
      })
      return
    }
    try {
      updatePayment({ ...currentPayment, ...formData } as Payment)
      toast({
        title: "Payment Updated",
        description: `Payment ${formData.transactionId} updated successfully.`,
      })
      setIsEditModalOpen(false)
      setCurrentPayment(null)
    } catch (error) {
      toast({
        title: "Failed to Update Payment",
        description: "There was an error updating the payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePayment = (id: string) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        deletePayment(id)
        toast({
          title: "Payment Deleted",
          description: "The payment has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Failed to Delete Payment",
          description: "There was an error deleting the payment. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleGenerateReceipt = (payment: Payment) => {
    // In a real application, this would generate a PDF receipt.
    // For this demo, we'll just simulate a receipt.
    const receiptDetails = `
      --- Payment Receipt ---
      Transaction ID: ${payment.transactionId}
      Patient UHID: ${payment.patientUhId}
      Amount: $${payment.amount.toFixed(2)}
      Payment Date: ${payment.paymentDate}
      Payment Method: ${payment.paymentMethod}
      Status: ${payment.status}
      Notes: ${payment.notes || "N/A"}
      -----------------------
    `
    const blob = new Blob([receiptDetails], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt_${payment.transactionId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Receipt Generated",
      description: `Receipt for transaction ${payment.transactionId} has been generated.`,
    })
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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Payments</h1>
          {/* Role Selector for Demo */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Switch Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Payments Overview</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Record New Payment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search payments by UHID, transaction ID, or method..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>UHID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No payments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => {
                        const patient = allPatients.find((p) => p.uhid === payment.patientUhId)
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono">{payment.transactionId}</TableCell>
                            <TableCell className="font-mono">{payment.patientUhId}</TableCell>
                            <TableCell>{patient ? `${patient.firstName} ${patient.lastName}` : "N/A"}</TableCell>
                            <TableCell>${payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{payment.paymentDate}</TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>{payment.status}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleGenerateReceipt(payment)}
                                title="Generate Receipt"
                              >
                                <Receipt className="h-4 w-4" />
                                <span className="sr-only">Generate Receipt</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentPayment(payment)
                                  setIsEditModalOpen(true)
                                }}
                                title="Edit Payment"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePayment(payment.id)}
                                title="Delete Payment"
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

      {/* Add Payment Modal */}
      <PaymentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddPayment}
        patients={allPatients}
      />

      {/* Edit Payment Modal */}
      {currentPayment && (
        <PaymentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setCurrentPayment(null)
          }}
          onSave={handleUpdatePayment}
          initialData={currentPayment}
          patients={allPatients}
        />
      )}
    </div>
  )
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Partial<Payment>) => void
  initialData?: Payment | null
  patients: Patient[]
}

function PaymentModal({ isOpen, onClose, onSave, initialData, patients }: PaymentModalProps) {
  const [formData, setFormData] = useState<Partial<Payment>>(
    initialData || {
      patientUhId: "",
      amount: 0,
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "",
      status: "Completed",
      notes: "",
    },
  )
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.paymentDate) : new Date(),
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedPaymentDate(new Date(initialData.paymentDate))
    } else {
      setFormData({
        patientUhId: "",
        amount: 0,
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        paymentMethod: "",
        status: "Completed",
        notes: "",
      })
      setSelectedPaymentDate(new Date())
    }
  }, [initialData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: id === "amount" ? Number.parseFloat(value) : value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handlePaymentDateSelect = (date: Date | undefined) => {
    setSelectedPaymentDate(date)
    setFormData((prev) => ({ ...prev, paymentDate: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Payment" : "Record New Payment"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the payment details." : "Fill in the details for the new payment."}
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
            <Label htmlFor="amount" className="text-right">
              Amount ($)
            </Label>
            <Input id="amount" type="number" value={formData.amount} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentDate" className="text-right">
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !selectedPaymentDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {selectedPaymentDate ? format(selectedPaymentDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedPaymentDate}
                  onSelect={handlePaymentDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentMethod" className="text-right">
              Method
            </Label>
            <Select
              onValueChange={(value) => handleSelectChange("paymentMethod", value)}
              value={formData.paymentMethod}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
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
          <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Record Payment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
