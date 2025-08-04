"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { type Patient, getPatients, departments, getBeds } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { OPDIPDAssignmentModal } from "./opd-ipd-assignment-modal"
import { BedAssignmentModal } from "./bed-assignment-modal"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface AllPatientsTableProps {
  initialPatients: Patient[]
}

export function AllPatientsTable({ initialPatients }: AllPatientsTableProps) {
  const [patients, setPatients] = React.useState<Patient[]>(initialPatients)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedGender, setSelectedGender] = React.useState<"Male" | "Female" | "Other" | "All">("All")
  const [selectedDepartment, setSelectedDepartment] = React.useState("All Departments")
  const [selectedSubDepartment, setSelectedSubDepartment] = React.useState("All Sub-departments")
  const [selectedStatus, setSelectedStatus] = React.useState<Patient["status"] | "All">("All")
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({})
  const [isOPDIPDAssignmentModalOpen, setIsOPDIPDAssignmentModalOpen] = React.useState(false)
  const [isBedAssignmentModalOpen, setIsBedAssignmentModalOpen] = React.useState(false)
  const [selectedPatientForAssignment, setSelectedPatientForAssignment] = React.useState<Patient | null>(null)

  const availableSubDepartments =
    selectedDepartment !== "All Departments"
      ? departments.find((d) => d.name === selectedDepartment)?.subDepartments || []
      : []

  const refreshPatients = React.useCallback(() => {
    const filters = {
      type: "All" as const, // Filter for all types
      searchTerm,
      gender: selectedGender,
      department: selectedDepartment,
      subDepartment: selectedSubDepartment,
      fromDate: dateRange.from,
      toDate: dateRange.to,
      status: selectedStatus,
    }
    setPatients(getPatients(filters))
  }, [searchTerm, selectedGender, selectedDepartment, selectedSubDepartment, dateRange, selectedStatus])

  React.useEffect(() => {
    refreshPatients()
  }, [refreshPatients])

  const handleOpenOPDIPDAssignmentModal = (patient: Patient) => {
    setSelectedPatientForAssignment(patient)
    setIsOPDIPDAssignmentModalOpen(true)
  }

  const handleOpenBedAssignmentModal = (patient: Patient) => {
    setSelectedPatientForAssignment(patient)
    setIsBedAssignmentModalOpen(true)
  }

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "uhid",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            UHID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      accessorKey: "age",
      header: "Age",
    },
    {
      accessorKey: "gender",
      header: "Gender",
    },
    {
      accessorKey: "contact",
      header: "Contact",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "assignedDoctor",
      header: "Assigned Doctor",
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "assignedBedId",
      header: "Bed ID",
      cell: ({ row }) => row.original.assignedBedId || "N/A",
    },
    {
      id: "bedCategory",
      header: "Bed Category",
      cell: ({ row }) => {
        const bed = getBeds().find((b) => b.id === row.original.assignedBedId)
        return bed ? bed.category : "N/A"
      },
    },
    {
      accessorKey: "registrationDate",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Reg. Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => format(new Date(row.original.registrationDate), "PPP"),
    },
    {
      accessorKey: "opdNo",
      header: "OPD No",
      cell: ({ row }) => row.original.opdNo || "N/A",
    },
    {
      accessorKey: "ipdNo",
      header: "IPD No",
      cell: ({ row }) => row.original.ipdNo || "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const patient = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(patient.uhid)}>Copy UHID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleOpenOPDIPDAssignmentModal(patient)}>
                Assign OPD/IPD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenBedAssignmentModal(patient)}>Assign Bed</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/case-sheet/${patient.uhid}`}>View Case Sheet</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const currentFilters = {
    searchTerm,
    gender: selectedGender,
    department: selectedDepartment,
    subDepartment: selectedSubDepartment,
    fromDate: dateRange.from?.toISOString().split("T")[0],
    toDate: dateRange.to?.toISOString().split("T")[0],
    status: selectedStatus,
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>All Patients Directory</CardTitle>
        <CardDescription>View and manage all registered patients (OPD & IPD).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="max-w-sm"
            />
            <Select
              value={selectedGender}
              onValueChange={(value: "Male" | "Female" | "Other" | "All") => setSelectedGender(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Departments">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.name} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSubDepartment}
              onValueChange={setSelectedSubDepartment}
              disabled={availableSubDepartments.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Sub-department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Sub-departments">All Sub-departments</SelectItem>
                {availableSubDepartments.map((subDept) => (
                  <SelectItem key={subDept} value={subDept}>
                    {subDept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(value: Patient["status"] | "All") => setSelectedStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Consulted">Consulted</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="Discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DataTable columns={columns} data={patients} />

          {selectedPatientForAssignment && (
            <>
              <OPDIPDAssignmentModal
                isOpen={isOPDIPDAssignmentModalOpen}
                onClose={() => setIsOPDIPDAssignmentModalOpen(false)}
                patientUhId={selectedPatientForAssignment.uhid}
                onAssignmentSuccess={refreshPatients}
              />
              <BedAssignmentModal
                isOpen={isBedAssignmentModalOpen}
                onClose={() => setIsBedAssignmentModalOpen(false)}
                patient={selectedPatientForAssignment}
                onAssignmentSuccess={refreshPatients}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
