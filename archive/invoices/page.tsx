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
  Download,
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
  type Invoice,
  type Patient,
  getInvoices,
  getPatients,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  getNavigationLinks,
} from "@/lib/data"

export default function InvoicesPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin") // Default role for this page demo
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)

  const allInvoices = useMemo(() => getInvoices(), [])
  const allPatients = useMemo(() => getPatients(), [])

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) {
      return allInvoices
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allInvoices.filter(
      (invoice) =>
        invoice.patientUhId.toLowerCase().includes(lowerCaseSearchTerm) ||
        invoice.service.toLowerCase().includes(lowerCaseSearchTerm) ||
        invoice.status.toLowerCase().includes(lowerCaseSearchTerm) ||
        invoice.invoiceNumber.toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [searchTerm, allInvoices])

  const navLinks = getNavigationLinks(currentRole || "admin")

  const handleAddInvoice = (formData: Partial<Invoice>) => {
    if (!formData.patientUhId || !formData.service || !formData.amount || !formData.invoiceDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the invoice.",
        variant: "destructive",
      })
      return
    }
    try {
      addInvoice(formData as Invoice)
      toast({
        title: "Invoice Added",
        description: `Invoice for UHID ${formData.patientUhId} added successfully.`,
      })
      setIsAddModalOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Add Invoice",
        description: "There was an error adding the invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateInvoice = (formData: Partial<Invoice>) => {
    if (!currentInvoice || !formData.patientUhId || !formData.service || !formData.amount || !formData.invoiceDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the invoice.",
        variant: "destructive",
      })
      return
    }
    try {
      updateInvoice({ ...currentInvoice, ...formData } as Invoice)
      toast({
        title: "Invoice Updated",
        description: `Invoice ${formData.invoiceNumber} updated successfully.`,
      })
      setIsEditModalOpen(false)
      setCurrentInvoice(null)
    } catch (error) {
      toast({
        title: "Failed to Update Invoice",
        description: "There was an error updating the invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        deleteInvoice(id)
        toast({
          title: "Invoice Deleted",
          description: "The invoice has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Failed to Delete Invoice",
          description: "There was an error deleting the invoice. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    // In a real application, this would generate a PDF or similar.
    // For this demo, we'll just simulate a download.
    const invoiceDetails = `
      Invoice Number: ${invoice.invoiceNumber}
      Patient UHID: ${invoice.patientUhId}
      Service: ${invoice.service}
      Amount: $${invoice.amount.toFixed(2)}
      Invoice Date: ${invoice.invoiceDate}
      Due Date: ${invoice.dueDate}
      Status: ${invoice.status}
      Notes: ${invoice.notes || "N/A"}
    `
    const blob = new Blob([invoiceDetails], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice_${invoice.invoiceNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Invoice Downloaded",
      description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
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
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Invoices</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Invoices Overview</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices by UHID, service, or invoice number..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>UHID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const patient = allPatients.find((p) => p.uhid === invoice.patientUhId)
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                            <TableCell className="font-mono">{invoice.patientUhId}</TableCell>
                            <TableCell>{patient ? `${patient.firstName} ${patient.lastName}` : "N/A"}</TableCell>
                            <TableCell>{invoice.service}</TableCell>
                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>{invoice.invoiceDate}</TableCell>
                            <TableCell>{invoice.dueDate}</TableCell>
                            <TableCell>{invoice.status}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadInvoice(invoice)}
                                title="Download Invoice"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentInvoice(invoice)
                                  setIsEditModalOpen(true)
                                }}
                                title="Edit Invoice"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                title="Delete Invoice"
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

      {/* Add Invoice Modal */}
      <InvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddInvoice}
        patients={allPatients}
      />

      {/* Edit Invoice Modal */}
      {currentInvoice && (
        <InvoiceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setCurrentInvoice(null)
          }}
          onSave={handleUpdateInvoice}
          initialData={currentInvoice}
          patients={allPatients}
        />
      )}
    </div>
  )
}

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Partial<Invoice>) => void
  initialData?: Invoice | null
  patients: Patient[]
}

function InvoiceModal({ isOpen, onClose, onSave, initialData, patients }: InvoiceModalProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>(
    initialData || {
      patientUhId: "",
      service: "",
      amount: 0,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(), "yyyy-MM-dd"),
      status: "Pending",
      notes: "",
    },
  )
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.invoiceDate) : new Date(),
  )
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.dueDate) : new Date(),
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedInvoiceDate(new Date(initialData.invoiceDate))
      setSelectedDueDate(new Date(initialData.dueDate))
    } else {
      setFormData({
        patientUhId: "",
        service: "",
        amount: 0,
        invoiceDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: format(new Date(), "yyyy-MM-dd"),
        status: "Pending",
        notes: "",
      })
      setSelectedInvoiceDate(new Date())
      setSelectedDueDate(new Date())
    }
  }, [initialData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: id === "amount" ? Number.parseFloat(value) : value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleInvoiceDateSelect = (date: Date | undefined) => {
    setSelectedInvoiceDate(date)
    setFormData((prev) => ({ ...prev, invoiceDate: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleDueDateSelect = (date: Date | undefined) => {
    setSelectedDueDate(date)
    setFormData((prev) => ({ ...prev, dueDate: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the invoice details." : "Fill in the details for the new invoice."}
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
            <Label htmlFor="service" className="text-right">
              Service
            </Label>
            <Input id="service" value={formData.service} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount ($)
            </Label>
            <Input id="amount" type="number" value={formData.amount} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceDate" className="text-right">
              Invoice Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !selectedInvoiceDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {selectedInvoiceDate ? format(selectedInvoiceDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedInvoiceDate}
                  onSelect={handleInvoiceDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              Due Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !selectedDueDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {selectedDueDate ? format(selectedDueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDueDate} onSelect={handleDueDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
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
          <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Create Invoice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
