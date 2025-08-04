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
  type Patient,
  getNavigationLinks,
} from "@/lib/data"
import IPDBillingForm from "@/components/ipd-billing-form";

export default function BillingPage() {
  // Sidebar and role logic can remain if you want to keep the sidebar and user info
  const [currentRole, setCurrentRole] = useState<UserRole>("receptionist");
  const navLinks = getNavigationLinks(currentRole);
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      setCurrentRole(storedRole as UserRole);
    } else {
      window.location.href = "/signin";
    }
  }, []);
  // Navigation links for sidebar
  // You may want to keep this for sidebar navigation
  // If not needed, you can remove navLinks and related sidebar code
  // import getNavigationLinks from data if needed
  // const navLinks = getNavigationLinks(currentRole || "receptionist");

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
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile navigation sheet and header */}
          {/* ... existing header code ... */}
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Billing Management</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* IPD Billing Form for Receptionist */}
          <IPDBillingForm onSubmit={(data) => console.log("IPD Billing Data:", data)} />
        </main>
      </div>
    </div>
  );
}

interface BillingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: Partial<any>) => void
  initialData?: any | null
  patients: Patient[]
}

function BillingModal({ isOpen, onClose, onSave, initialData, patients }: BillingModalProps) {
  const [formData, setFormData] = useState<Partial<any>>(
    initialData || {
      patientUhId: "",
      service: "",
      amount: 0,
      billingDate: format(new Date(), "yyyy-MM-dd"),
      status: "Pending",
      notes: "",
    },
  )
  const [selectedBillingDate, setSelectedBillingDate] = useState<Date | undefined>(
    initialData ? new Date(initialData.billingDate) : new Date(),
  )

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setSelectedBillingDate(new Date(initialData.billingDate))
    } else {
      setFormData({
        patientUhId: "",
        service: "",
        amount: 0,
        billingDate: format(new Date(), "yyyy-MM-dd"),
        status: "Pending",
        notes: "",
      })
      setSelectedBillingDate(new Date())
    }
  }, [initialData, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: id === "amount" ? Number.parseFloat(value) : value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleBillingDateSelect = (date: Date | undefined) => {
    setSelectedBillingDate(date)
    setFormData((prev) => ({ ...prev, billingDate: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Billing Entry" : "Add New Billing Entry"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Modify the billing entry details." : "Fill in the details for the new billing entry."}
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
            <Label htmlFor="billingDate" className="text-right">
              Billing Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !selectedBillingDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  {selectedBillingDate ? format(selectedBillingDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedBillingDate}
                  onSelect={handleBillingDateSelect}
                  initialFocus
                />
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
          <Button onClick={handleSubmit}>{initialData ? "Save Changes" : "Add Billing Entry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
