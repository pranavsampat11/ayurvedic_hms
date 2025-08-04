// lib/data.ts
import { format, subDays, addDays, parseISO } from "date-fns"
import {
  Home,
  Stethoscope,
  Package,
  DollarSign,
  BarChart,
  Settings,
  UserPlus,
  Users,
  CalendarIcon as CalendarIconLucide,
  FileText,
  Pill,
} from "lucide-react"

export type UserRole = "admin" | "receptionist" | "doctor" | "pharmacist" | "accountant"

export interface Patient {
  uhid: string
  firstName: string
  lastName: string
  age: number
  gender: "Male" | "Female" | "Other"
  contact: string
  address: string
  registrationDate: string // YYYY-MM-DD
  consultationDate?: string // YYYY-MM-DD
  department: string
  subDepartment?: string
  assignedDoctor: string
  status: "Registered" | "Consulted" | "Admitted" | "Discharged"
  assignedBedId?: string // ID of the assigned bed
  opdNo?: string // OPD number, assigned if OPD
  ipdNo?: string // IPD number, assigned if IPD
  patient_type: "OPD" | "IPD" // <-- Added for Supabase schema compatibility
}

export type BedCategory =
  | "General Ward"
  | "Semi-Private"
  | "Private"
  | "ICU"
  | "Emergency"
  | "Panchakarma Unit"
  | "Special Treatment Room"
  | "Post-operative Ward"

export interface Bed {
  id: string // Unique ID for the bed, e.g., "B-A-001"
  bedNumber: string // e.g., "001"
  roomNumber: string // e.g., "A101"
  ward: string // e.g., "Ward A"
  category: BedCategory
  isOccupied: boolean
  patientUhId?: string
  admissionDate?: string // YYYY-MM-DD
  dischargeDate?: string // YYYY-MM-DD
}

export interface Staff {
  id: string
  firstName: string
  lastName: string
  role: "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "Accountant" | "Admin"
  department?: string
  contact: string
  email: string
  status: "Active" | "On Leave" | "Inactive"
}

export interface Appointment {
  id: string
  patientUhId: string
  doctor: string
  date: string // YYYY-MM-DD
  department: string
  subDepartment?: string
  status?: "pending" | "seen" | "cancelled" // <-- Added for Supabase schema compatibility
}

export interface CaseSheet {
  id?: string
  uhid: string
  patientName: string
  diagnosis: string
  previousMedicalHistory: string
  medicationsAdvised: {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
  }[]
  treatmentPlan: string
  lifestyleAdvice: string
  followUpNotes: string
  created_at?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: "Medicine" | "Equipment" | "Supplies" | "Other"
  quantity: number
  unit: string // e.g., "pills", "ml", "units", "pieces"
  pricePerUnit: number
  lastRestocked: string // YYYY-MM-DD
  expiryDate?: string // YYYY-MM-DD
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  patientUhId: string
  patientName: string
  dateIssued: string // YYYY-MM-DD
  items: InvoiceItem[]
  totalAmount: number
  status: "Paid" | "Pending" | "Overdue"
  dueDate: string // YYYY-MM-DD
}

export interface Payment {
  id: string
  invoiceId: string
  patientUhId: string
  patientName: string
  datePaid: string // YYYY-MM-DD
  amount: number
  method: "Cash" | "Card" | "Online" | "Cheque"
}

export interface Consultation {
  id: string
  uhid: string
  patientName: string
  doctorName: string
  consultationDate: string // YYYY-MM-DD
  diagnosisSummary: string
  notes: string
  status: "Completed" | "Follow-up"
}

// All mock data arrays and functions that reference them have been removed. Only type/interface definitions, department/sub-department arrays, and utility functions that do not depend on mock data remain. This file is now ready for Supabase-only usage.

export const departments = [
  { name: "Kayachikitsa", subDepartments: ["General Medicine", "Neurology", "Cardiology"] },
  { name: "Panchakarma", subDepartments: ["Vamana", "Virechana", "Basti"] },
  { name: "Shalya Tantra", subDepartments: ["General Surgery", "Orthopedics"] },
  { name: "Shalakya Tantra", subDepartments: ["Ophthalmology", "ENT"] },
  { name: "Kaumarabhritya", subDepartments: ["Pediatrics"] },
  { name: "Prasuti Tantra & Stree Roga", subDepartments: ["Obstetrics", "Gynecology"] },
]

export const addAppointment = (appointment: Omit<Appointment, "id">) => {
  // This function will now rely on Supabase for appointment creation
  // For now, it will just return a placeholder object
  console.warn("addAppointment is not yet implemented for Supabase")
  return { ...appointment, id: "TEMP_ID" }
}

export const getAppointmentsByDate = (date: string): Appointment[] => {
  // This function will now rely on Supabase for appointment retrieval
  // For now, it will return an empty array
  console.warn("getAppointmentsByDate is not yet implemented for Supabase")
  return []
}

export const getAppointments = (): Appointment[] => {
  // This function will now rely on Supabase for appointment retrieval
  // For now, it will return an empty array
  console.warn("getAppointments is not yet implemented for Supabase")
  return []
}

export const getPrescriptions = () => {
  // Mock prescription data (not implemented in detail yet)
  return []
}

// Case Sheet Functions
export const addCaseSheet = (newCaseSheet: CaseSheet) => {
  // This function will now rely on Supabase for case sheet creation
  // For now, it will just log a warning
  console.warn("addCaseSheet is not yet implemented for Supabase")
}

export const getCaseSheet = (uhid: string): CaseSheet | undefined => {
  // This function will now rely on Supabase for case sheet retrieval
  // For now, it will return undefined
  console.warn("getCaseSheet is not yet implemented for Supabase")
  return undefined
}

// Inventory Functions
export const getInventoryItems = (): InventoryItem[] => {
  // This function will now rely on Supabase for inventory retrieval
  // For now, it will return an empty array
  console.warn("getInventoryItems is not yet implemented for Supabase")
  return []
}

export const addInventoryItem = (item: InventoryItem) => {
  // This function will now rely on Supabase for inventory item creation
  // For now, it will just log a warning
  console.warn("addInventoryItem is not yet implemented for Supabase")
}

export const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
  // This function will now rely on Supabase for inventory item update
  // For now, it will just log a warning
  console.warn("updateInventoryItem is not yet implemented for Supabase")
}

export const deleteInventoryItem = (id: string) => {
  // This function will now rely on Supabase for inventory item deletion
  // For now, it will just log a warning
  console.warn("deleteInventoryItem is not yet implemented for Supabase")
}

// Invoice Functions
export const getInvoices = (): Invoice[] => {
  // This function will now rely on Supabase for invoice retrieval
  // For now, it will return an empty array
  console.warn("getInvoices is not yet implemented for Supabase")
  return []
}

export const addInvoice = (invoice: Invoice) => {
  // This function will now rely on Supabase for invoice creation
  // For now, it will just log a warning
  console.warn("addInvoice is not yet implemented for Supabase")
}

export const updateInvoice = (id: string, updates: Partial<Invoice>) => {
  // This function will now rely on Supabase for invoice update
  // For now, it will just log a warning
  console.warn("updateInvoice is not yet implemented for Supabase")
}

// Payment Functions
export const getPayments = (): Payment[] => {
  // This function will now rely on Supabase for payment retrieval
  // For now, it will return an empty array
  console.warn("getPayments is not yet implemented for Supabase")
  return []
}

export const addPayment = (payment: Payment) => {
  // This function will now rely on Supabase for payment creation
  // For now, it will just log a warning
  console.warn("addPayment is not yet implemented for Supabase")
}

// Consultation Functions
export const getConsultations = (): Consultation[] => {
  // This function will now rely on Supabase for consultation retrieval
  // For now, it will return an empty array
  console.warn("getConsultations is not yet implemented for Supabase")
  return []
}

export const addConsultation = (consultation: Consultation) => {
  // This function will now rely on Supabase for consultation creation
  // For now, it will just log a warning
  console.warn("addConsultation is not yet implemented for Supabase")
}

export const getConsultationsByDoctor = (doctorName: string): Consultation[] => {
  // This function will now rely on Supabase for consultation retrieval by doctor
  // For now, it will return an empty array
  console.warn("getConsultationsByDoctor is not yet implemented for Supabase")
  return []
}

// Dashboard Metrics
export const getDashboardMetrics = () => {
  // This function will now rely on Supabase for patient and bed counts
  // For now, it will return placeholder values
  console.warn("getDashboardMetrics is not yet implemented for Supabase")
  return {
    totalPatients: 0,
    newPatientsToday: 0,
    occupiedBedsCount: 0,
    totalBedsCount: 0,
    upcomingAppointmentsToday: 0,
    totalStaffCount: 0,
  }
}

// Chart Data Functions
export function getDailyNewPatients(startDate: Date, endDate: Date) {
  // This function will now rely on Supabase for patient registration dates
  // For now, it will return an empty array
  console.warn("getDailyNewPatients is not yet implemented for Supabase")
  return []
}

export function getDailyBedOccupancy(startDate: Date, endDate: Date) {
  // This function will now rely on Supabase for bed occupancy dates
  // For now, it will return an empty array
  console.warn("getDailyBedOccupancy is not yet implemented for Supabase")
  return []
}

export function getStaffCountByRole() {
  // This function will now rely on Supabase for staff roles
  // For now, it will return an empty array
  console.warn("getStaffCountByRole is not yet implemented for Supabase")
  return []
}

export function getBedCategoryDistribution() {
  // This function will now rely on Supabase for bed categories
  // For now, it will return an empty array
  console.warn("getBedCategoryDistribution is not yet implemented for Supabase")
  return []
}

// Navigation Links
export const getNavigationLinks = (role: UserRole) => {
  const baseLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["admin", "receptionist", "doctor", "pharmacist", "accountant"],
    },
    {
      name: "Patients",
      href: "/patients",
      icon: Users,
      roles: ["admin", "receptionist", "doctor", "pharmacist"],
    },
  ]

  const roleSpecificLinks = {
    admin: [
      { name: "Staff Management", href: "/staff", icon: Stethoscope, roles: ["admin"] },
      { name: "Inventory", href: "/inventory", icon: Package, roles: ["admin", "pharmacist"] },
      { name: "Billing", href: "/billing", icon: DollarSign, roles: ["admin", "accountant"] },
      { name: "Reports", href: "/reports", icon: BarChart, roles: ["admin"] },
      { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
    ],
    receptionist: [
      { name: "IPD Requests", href: "/receptionist/ipd-requests", icon: Users, roles: ["receptionist"] },
      { name: "Billing", href: "/billing", icon: DollarSign, roles: ["receptionist"] },
    ],
    doctor: [
      { name: "Appointments", href: "/appointments", icon: CalendarIconLucide, roles: ["doctor"] },
    ],
    pharmacist: [
      { name: "Prescriptions", href: "/dashboard#prescriptions", icon: Pill, roles: ["pharmacist"] },
      { name: "Inventory Management", href: "/inventory", icon: Package, roles: ["pharmacist"] },
    ],
    accountant: [
      { name: "Invoices", href: "/invoices", icon: FileText, roles: ["accountant"] },
      { name: "Payments", href: "/payments", icon: DollarSign, roles: ["accountant"] },
    ],
  }

  // Receptionist: Only show Dashboard, Patients, IPD Requests, Billing
  if (role === "receptionist") {
    return [
      baseLinks[0], // Dashboard
      baseLinks[1], // Patients
      { name: "IPD Requests", href: "/receptionist/ipd-requests", icon: Users, roles: ["receptionist"] },
      { name: "Billing", href: "/billing", icon: DollarSign, roles: ["receptionist"] },
    ];
  }

  const allLinks = [...baseLinks, ...(roleSpecificLinks[role] || [])]
  return allLinks.filter((link) => link.roles.includes(role))
}

// Department and sub-department to doctor mapping
export const departmentDoctorMap: Record<string, Record<string, string[]>> = {
  'Kayachikitsa': {
    'General Medicine': ['Dr. Sharma', 'Dr. Santosh'],
    'Neurology': ['Dr. Santosh', 'Dr. Sharma'],
    'Cardiology': ['Dr. Sharma', 'Dr. Manpreet'],
  },
  'Panchakarma': {
    'Vamana': ['Dr. Gupta', 'Dr. Manpreet'],
    'Virechana': ['Dr. Gupta', 'Dr. Manpreet'],
    'Basti': ['Dr. Manpreet', 'Dr. Rao'],
  },
  'Shalya Tantra': {
    'General Surgery': ['Dr. Singh', 'Dr. Kumar'],
    'Orthopedics': ['Dr. Singh', 'Dr. Santosh'],
  },
  'Shalakya Tantra': {
    'Ophthalmology': ['Dr. Kumar', 'Dr. Devi'],
    'ENT': ['Dr. Kumar', 'Dr. Rao'],
  },
  'Kaumarabhritya': {
    'Pediatrics': ['Dr. Devi', 'Dr. Manpreet'],
  },
  'Prasuti Tantra & Stree Roga': {
    'Obstetrics': ['Dr. Rao', 'Dr. Santosh'],
    'Gynecology': ['Dr. Rao', 'Dr. Devi'],
  },
}

export function generateOPDNo(): string {
  // This function will now rely on Supabase for OPD number generation
  // For now, it will return a placeholder
  console.warn("generateOPDNo is not yet implemented for Supabase")
  return "OPD0000"
}
export function generateIPDNo(): string {
  // This function will now rely on Supabase for IPD number generation
  // For now, it will return a placeholder
  console.warn("generateIPDNo is not yet implemented for Supabase")
  return "IPD0000"
}

export const assignIPD = (uhid: string) => {
  // This function will now rely on Supabase for IPD assignment
  // For now, it will just log a warning
  console.warn("assignIPD is not yet implemented for Supabase")
}
