"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import type { Bed, Patient } from "@/lib/data"

interface BedAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (patientId: string, bedId: string) => void
  patients: Patient[]
  availableBeds: Bed[]
}

export default function BedAssignmentModal({
  isOpen,
  onClose,
  onAssign,
  patients,
  availableBeds,
}: BedAssignmentModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [selectedBedId, setSelectedBedId] = useState<string>("")

  const handleSubmit = () => {
    if (selectedPatientId && selectedBedId) {
      onAssign(selectedPatientId, selectedBedId)
      setSelectedPatientId("")
      setSelectedBedId("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Bed to Patient</DialogTitle>
          <DialogDescription>Assign an available bed to a patient.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patient" className="text-right">
              Patient
            </Label>
            <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
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
            <Label htmlFor="bed" className="text-right">
              Bed
            </Label>
            <Select onValueChange={setSelectedBedId} value={selectedBedId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an available bed" />
              </SelectTrigger>
              <SelectContent>
                {availableBeds.map((bed) => (
                  <SelectItem key={bed.id} value={bed.id}>
                    Bed {bed.bedNumber} (Ward: {bed.ward}, Room: {bed.roomNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPatientId || !selectedBedId}>
            Assign Bed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
