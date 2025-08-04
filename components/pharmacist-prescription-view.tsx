"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getPrescriptions } from "@/lib/data"

export default function PharmacistPrescriptionView() {
  const [searchTerm, setSearchTerm] = useState("")
  const allPrescriptions = useMemo(() => getPrescriptions(), [])

  const filteredPrescriptions = useMemo(() => {
    if (!searchTerm) {
      return allPrescriptions
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allPrescriptions.filter(
      (prescription) =>
        prescription.patientUhId.toLowerCase().includes(lowerCaseSearchTerm) ||
        prescription.doctorName.toLowerCase().includes(lowerCaseSearchTerm) ||
        prescription.medications.some((med) => med.name.toLowerCase().includes(lowerCaseSearchTerm)),
    )
  }, [searchTerm, allPrescriptions])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Prescription Management</CardTitle>
        <CardDescription>View and manage patient prescriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by patient UHID, doctor, or medication..."
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
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Medications</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No prescriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-mono">{prescription.patientUhId}</TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>{prescription.date}</TableCell>
                    <TableCell>{prescription.medications.map((med) => med.name).join(", ")}</TableCell>
                    <TableCell>{prescription.medications.map((med) => med.dosage).join(", ")}</TableCell>
                    <TableCell>{prescription.medications.map((med) => med.frequency).join(", ")}</TableCell>
                    <TableCell>{prescription.medications.map((med) => med.duration).join(", ")}</TableCell>
                    <TableCell>{prescription.notes || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
