"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getPatients } from "@/lib/data"

export default function OPDTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const opdPatients = useMemo(() => getPatients({ type: "OPD" }), [])

  const filteredPatients = useMemo(() => {
    if (!searchTerm) {
      return opdPatients
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return opdPatients.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.lastName.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.uhid.toLowerCase().includes(lowerCaseSearchTerm) ||
        patient.contact.includes(lowerCaseSearchTerm),
    )
  }, [searchTerm, opdPatients])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>OPD Patients</CardTitle>
        <CardDescription>List of all Outpatient Department (OPD) patients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients by name, UHID, or contact..."
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
                <TableHead>OPD No</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No OPD patients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
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
                    <TableCell>{patient.opdNo}</TableCell>
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
