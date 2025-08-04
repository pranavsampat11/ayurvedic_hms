"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type Patient, type Bed } from "@/lib/data"
import { useReactToPrint } from "react-to-print"
import { PrinterIcon } from "lucide-react"

interface PrintablePatientReportProps {
  patients: Patient[]
  beds?: Bed[]
  tableType: "OPD" | "IPD" | "All"
  filters?: {
    department?: string
    subDepartment?: string
    fromDate?: string
    toDate?: string
    searchTerm?: string
    gender?: string
    status?: string
  }
}

export default function PrintablePatientReport({ patients, beds = [], tableType, filters }: PrintablePatientReportProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Patient Report - ${tableType} Patients`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      body {
        font-family: sans-serif;
        -webkit-print-color-adjust: exact;
      }
      .print-header {
        text-align: center;
        margin-bottom: 20px;
      }
      .print-header h1 {
        font-size: 24px;
        margin-bottom: 5px;
      }
      .print-header p {
        font-size: 14px;
        color: #555;
      }
      .report-filters {
        margin-bottom: 20px;
        border: 1px solid #eee;
        padding: 10px;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      .report-filters p {
        margin: 5px 0;
        font-size: 13px;
      }
      .report-filters strong {
        color: #333;
      }
      .report-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      .report-table th, .report-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        font-size: 12px;
      }
      .report-table th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .report-table tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .report-table tr:hover {
        background-color: #f1f1f1;
      }
      .print-footer {
        margin-top: 30px;
        text-align: center;
        font-size: 12px;
        color: #777;
      }
    `,
  })

  const getBedDetails = (uhid: string): Bed | undefined => {
    return beds.find((bed: Bed) => bed.patientUhId === uhid)
  }

  return (
    <Card className="w-full max-w-full mx-auto print:shadow-none print:border-0">
      <CardHeader className="print:hidden">
        <CardTitle>Printable Patient Report</CardTitle>
        <CardDescription>Generate a printable report for {tableType} patients.</CardDescription>
        <Button onClick={handlePrint} className="mt-4 self-end">
          <PrinterIcon className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </CardHeader>
      <CardContent className="p-4 md:p-6 print:p-0">
        <div ref={componentRef} className="print:w-full print:h-auto print:p-0">
          <div className="print-header">
            <h1>Ayurvedic Hospital Patient Report</h1>
            <p>Report Type: {tableType} Patients</p>
            <p>Date Generated: {new Date().toLocaleDateString()}</p>
          </div>

          {filters && (
            <div className="report-filters">
              <h3>Filters Applied:</h3>
              <p>
                <strong>Department:</strong> {filters.department || "All"}
              </p>
              <p>
                <strong>Sub-Department:</strong> {filters.subDepartment || "All"}
              </p>
              <p>
                <strong>Date Range:</strong> {filters.fromDate || "N/A"} to {filters.toDate || "N/A"}
              </p>
              <p>
                <strong>Search Term:</strong> {filters.searchTerm || "N/A"}
              </p>
              <p>
                <strong>Gender:</strong> {filters.gender || "All"}
              </p>
              <p>
                <strong>Status:</strong> {filters.status || "All"}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table className="report-table">
              <TableHeader>
                <TableRow>
                  <TableHead>UHID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  {tableType === "IPD" || tableType === "All" ? (
                    <>
                      <TableHead>Bed No.</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Room</TableHead>
                    </>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableType === "IPD" || tableType === "All" ? 10 : 7}
                      className="h-24 text-center"
                    >
                      No patients found for this report.
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => {
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
                        {(tableType === "IPD" || tableType === "All") && (
                          <>
                            <TableCell>{bedDetails?.bedNumber || "N/A"}</TableCell>
                            <TableCell>{bedDetails?.ward || "N/A"}</TableCell>
                            <TableCell>{bedDetails?.roomNumber || "N/A"}</TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="print-footer">
            <p>&copy; {new Date().getFullYear()} Ayurvedic Hospital. All rights reserved.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
