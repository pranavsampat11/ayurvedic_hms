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
import { type Patient } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

interface OpdIpdAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  patients: Patient[]
}

export default function OpdIpdAssignmentModal({ isOpen, onClose, patients }: OpdIpdAssignmentModalProps) {
  const [selectedPatientUhId, setSelectedPatientUhId] = useState<string>("")
  const [newPatientType, setNewPatientType] = useState<"OPD" | "IPD">("OPD")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPatients = (patients as any[]).filter((patient) => {
    const term = searchTerm.toLowerCase()
    return (
      (patient.uhid?.toLowerCase() || "").includes(term) ||
      (patient.first_name?.toLowerCase() || "").includes(term) ||
      (patient.last_name?.toLowerCase() || "").includes(term) ||
      (patient.contact?.toLowerCase() || "").includes(term)
    )
  })

  const handleSubmit = async () => {
    if (selectedPatientUhId && newPatientType) {
      try {
        // 1. Update patient_type
        const { data, error } = await supabase
          .from("patients")
          .update({ patient_type: newPatientType })
          .eq("uhid", selectedPatientUhId)
          .select()
          .single()
        if (error) throw error
        // 2. Auto-generate op_no or ip_no if needed
        let updateFields: any = {}
        if (newPatientType === "OPD" && (!data.op_no || data.op_no === "")) {
          updateFields.op_no = `OPD${Date.now()}`
        }
        if (newPatientType === "IPD" && (!data.ip_no || data.ip_no === "")) {
          updateFields.ip_no = `IPD${Date.now()}`
        }
        if (Object.keys(updateFields).length > 0) {
          const { error: numError } = await supabase
            .from("patients")
            .update(updateFields)
            .eq("uhid", selectedPatientUhId)
          if (numError) throw numError
        }
        toast({
          title: "Patient Type Updated",
          description: `Patient ${selectedPatientUhId} type updated to ${newPatientType}.`,
        })
        setSelectedPatientUhId("")
        setNewPatientType("OPD")
        onClose()
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message || "There was an error updating the patient type. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Patient Type</DialogTitle>
          <DialogDescription>Change a patient's type between OPD and IPD.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patient" className="text-right">
              Patient
            </Label>
            <div className="col-span-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Search by UHID, name, or number"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border rounded px-2 py-1"
              />
            <Select onValueChange={setSelectedPatientUhId} value={selectedPatientUhId}>
                <SelectTrigger>
                <SelectValue placeholder="Select a patient">
                  {selectedPatientUhId
                    ? (() => {
                        const patient = (patients as any[]).find(p => p.uhid === selectedPatientUhId)
                        return patient
                          ? `${patient.first_name} ${patient.last_name} (UHID: ${patient.uhid})`
                          : selectedPatientUhId
                      })()
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                  {(filteredPatients as any[]).map((patient) => (
                  <SelectItem key={patient.uhid} value={patient.uhid}>
                      {patient.first_name} {patient.last_name} (UHID: {patient.uhid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newType" className="text-right">
              New Type
            </Label>
            <Select onValueChange={(value: "OPD" | "IPD") => setNewPatientType(value)} value={newPatientType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select new type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPD">OPD</SelectItem>
                <SelectItem value="IPD">IPD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPatientUhId || !newPatientType}>
            Update Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
