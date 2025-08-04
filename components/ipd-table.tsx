"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
// import { type Bed, getPatients, getBeds } from "@/lib/data"
// TODO: Replace with Supabase fetch for patients and beds
import PrintableIpdCaseSheet from "./printable-ipd-case-sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

export default function IPDTable() {
  const [searchTerm, setSearchTerm] = useState("")
  // TODO: Fetch IPD patients and beds from Supabase
  const ipdPatients: any[] = [] // Placeholder, replace with Supabase data
  const beds: any[] = [] // Placeholder, replace with Supabase data

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printCaseSheet, setPrintCaseSheet] = useState<any | null>(null)
  const [printPatient, setPrintPatient] = useState<any | null>(null)
  const [loadingPrint, setLoadingPrint] = useState(false)
  const [printError, setPrintError] = useState("")

  const filteredPatients = useMemo(() => {
    if (!searchTerm) {
      return ipdPatients
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return ipdPatients.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.uhid.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.contact.includes(lowerCaseSearchTerm) ||
        (beds.find((bed) => bed.patientUhId === patient.uhid)?.bedNumber || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (beds.find((bed) => bed.patientUhId === patient.uhid)?.ward || "").toLowerCase().includes(lowerCaseSearchTerm),
    )
  }, [searchTerm, ipdPatients, beds])

  const getBedDetails = (uhid: string): any | undefined => {
    return beds.find((bed: any) => bed.patientUhId === uhid)
  }

  const handlePrint = async (patient: any) => {
    setLoadingPrint(true)
    setPrintError("")
    setPrintCaseSheet(null)
    setPrintPatient(patient)
    setShowPrintModal(true)
    // Fetch latest IPD case sheet for this patient
    const { data, error } = await supabase
      .from("ipd_case_sheets")
      .select("*")
      .eq("uhid", patient.uhid)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    setLoadingPrint(false)
    if (error || !data) {
      setPrintError("No IPD case sheet found for this patient.")
      setPrintCaseSheet(null)
    } else {
      setPrintCaseSheet(data)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>IPD Patients</CardTitle>
        <CardDescription>List of all Inpatient Department (IPD) patients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients by name, UHID, contact, bed, or ward..."
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
                <TableHead>Name</TableHead>
                <TableHead>Age/Gender</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bed No.</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>IPD No.</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    No IPD patients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => {
                  const bedDetails = getBedDetails(patient.uhid)
                  return (
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
                      <TableCell>{bedDetails?.bedNumber || "N/A"}</TableCell>
                      <TableCell>{bedDetails?.ward || "N/A"}</TableCell>
                      <TableCell>{bedDetails?.roomNumber || "N/A"}</TableCell>
                      <TableCell>{patient.ipdNo || "N/A"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handlePrint(patient)}>
                          Print Case Sheet
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
      {/* Print Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Print IPD Case Sheet</DialogTitle>
          </DialogHeader>
          {loadingPrint ? (
            <div>Loading...</div>
          ) : printError ? (
            <div className="text-red-500">{printError}</div>
          ) : printCaseSheet ? (
            <PrintableIpdCaseSheet ipdCaseSheet={printCaseSheet} />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
