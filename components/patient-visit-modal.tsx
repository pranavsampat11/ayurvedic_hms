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
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import PatientRegistrationForm from "@/components/patient-registration-form"

export default function PatientVisitModal({ isOpen, onClose, onBillReady }: { isOpen: boolean; onClose: () => void; onBillReady?: (patient: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResult, setSearchResult] = useState<any | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [visitForm, setVisitForm] = useState({
    department: "",
    subDepartment: "",
    doctor: "",
    visitType: "OPD",
    notes: "",
    scheduledAt: new Date().toISOString().slice(0, 16), // ISO string for datetime-local input
  })
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [visitStarted, setVisitStarted] = useState(false)

  // Provided department and sub_department data (same as registration form)
  const departments = [
    { id: 1, name: "Kayachikitsa" },
    { id: 2, name: "Panchakarma" },
    { id: 3, name: "Shalya" },
    { id: 4, name: "Shalakya" },
    { id: 5, name: "Stree Roga and Prasuti Tantra" },
    { id: 6, name: "Kaumarabhritya" },
    { id: 7, name: "SwasthaVrutta" },
    { id: 8, name: "Agada Tantra" },
    { id: 9, name: "Other" },
  ]
  const sub_departments = [
    { id: 1, department_id: 4, name: "Netra" },
    { id: 2, department_id: 4, name: "Karna Nasa Mukha" },
  ]

  // Search patient by mobile or UHID
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({ title: "Search Term Required", description: "Please enter a mobile number or UHID to search.", variant: "destructive" })
      return
    }
    
    console.log("Searching for:", searchTerm.trim())
    setLoading(true)
    try {
      // Let's see what mobile numbers are in the database
      const { data: samplePatients } = await supabase
        .from("patients")
        .select("mobile, full_name")
        .limit(3)
      
      console.log("Sample patients from DB:", samplePatients)
      
      // Search by mobile number first
      let { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("mobile", searchTerm.trim())
        .maybeSingle()
      
      console.log("Mobile search result:", { data, error })
      
      // If not found by mobile, try with +91 prefix
      if (!data) {
        console.log("Mobile not found, trying with +91 prefix...")
        const { data: dataWithPrefix } = await supabase
          .from("patients")
          .select("*")
          .eq("mobile", `+91${searchTerm.trim()}`)
          .maybeSingle()
        
        if (dataWithPrefix) {
          data = dataWithPrefix
          console.log("Found with +91 prefix")
        }
      }
      
      // If still not found by mobile, search by UHID
      if (!data) {
        console.log("Mobile not found, searching by UHID...")
        const { data: uhidData, error: uhidError } = await supabase
          .from("patients")
          .select("*")
          .eq("uhid", searchTerm.trim())
          .maybeSingle()
        
        console.log("UHID search result:", { uhidData, uhidError })
        
        if (uhidData) {
          data = uhidData
          console.log("Found by UHID")
        }
      }
      
      // Handle the final result
      console.log("Final data check:", { data, hasData: !!data, dataType: typeof data })
      
      if (data) {
        console.log("Setting search result:", data)
        setSearchResult(data)
        toast({ title: "Patient Found", description: `Found patient: ${data.full_name}`, variant: "default" })
      } else {
        console.log("No data found, setting search result to null")
        setSearchResult(null)
        toast({ title: "Patient Not Found", description: "No patient found with this mobile number or UHID. You can register a new patient.", variant: "destructive" })
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResult(null)
      toast({ title: "Search Error", description: "An error occurred while searching.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Fetch doctors when department/subDepartment changes
  const fetchDoctors = async (departmentId: string, subDepartmentId: string) => {
    if (!departmentId) {
      setDoctors([])
      return
    }
    let query = supabase
      .from("staff")
      .select("id, full_name, department_id, sub_department_id")
      .eq("role", "doctor")
      .eq("department_id", departmentId)
    
    if (subDepartmentId) {
      query = query.eq("sub_department_id", subDepartmentId)
    }
    
    const { data, error } = await query
    if (!error && data) {
      setDoctors(data)
    } else {
      setDoctors([])
    }
  }

  // Handle visit form changes
  const handleVisitFormChange = (id: string, value: string) => {
    setVisitForm((prev) => ({ ...prev, [id]: value }))
    if (id === "department") {
      setVisitForm((prev) => ({ ...prev, subDepartment: "", doctor: "" }))
      fetchDoctors(value, "")
    }
    if (id === "subDepartment") {
      setVisitForm((prev) => ({ ...prev, doctor: "" }))
      fetchDoctors(visitForm.department, value)
    }
  }

  // Start new visit for existing patient
  const handleStartVisit = async () => {
    if (!searchResult || !visitForm.department || !visitForm.doctor || !visitForm.visitType || !visitForm.scheduledAt) {
      toast({ title: "Missing Information", description: "Please fill all required visit details (Department, Doctor, Visit Type, Scheduled Date).", variant: "destructive" })
      return
    }
    setLoading(true)
    
    try {
      // 1. Create appointment first
      const appointmentPayload = {
        uhid: searchResult.uhid,
        doctor_id: visitForm.doctor,
        department_id: visitForm.department,
        sub_department_id: visitForm.subDepartment || null,
        appointment_date: new Date(visitForm.scheduledAt).toISOString().split('T')[0], // Just the date part
        reason: visitForm.notes || "Visit",
        status: "pending",
      };
      
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert([appointmentPayload])
        .select()
        .single();
        
      if (appointmentError || !appointmentData) {
        setLoading(false)
        toast({ title: "Appointment Creation Failed", description: appointmentError?.message, variant: "destructive" })
        return
      }
      
      // 2. Create OPD visit (only for OPD visits)
      if (visitForm.visitType === "OPD") {
        const opdVisitPayload = {
          opd_no: `OPD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
          uhid: searchResult.uhid,
          appointment_id: appointmentData.id,
          visit_date: new Date(visitForm.scheduledAt).toISOString().split('T')[0], // Just the date part
        };
        
        const { error: opdVisitError } = await supabase
          .from("opd_visits")
          .insert([opdVisitPayload]);
          
        if (opdVisitError) {
          setLoading(false)
          toast({ title: "OPD Visit Creation Failed", description: opdVisitError.message, variant: "destructive" })
          return
        }
      }
      
      setLoading(false)
      setVisitStarted(true);
      toast({ title: "Visit Created", description: `${visitForm.visitType} visit created for ${searchResult.full_name}.` });
      
      if (onBillReady) {
        // Fetch the latest patient data from Supabase to ensure all fields are up to date
        const { data: patientData2 } = await supabase.from("patients").select("*").eq("uhid", searchResult.uhid).single();
        if (patientData2) onBillReady(patientData2);
      }
      onClose();
      
    } catch (error) {
      setLoading(false)
      console.error("Error creating visit:", error)
      toast({ title: "Visit Creation Failed", description: "An unexpected error occurred.", variant: "destructive" })
    }
  }

  // After new patient registration, start visit for that patient
  const handlePatientRegistered = () => {
    setShowRegistration(false)
    // Refresh the search or close modal
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] w-full max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Patient Visit</DialogTitle>
          <DialogDescription>Search for a patient or register a new one, then start a new visit.</DialogDescription>
        </DialogHeader>
        {!showRegistration ? (
          <>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Enter Mobile Number or UHID"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                disabled={loading}
              />
              <Button onClick={handleSearch} disabled={loading || !searchTerm}>Search</Button>
            </div>
            {console.log("UI render - searchResult:", searchResult)}
            {searchResult ? (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="border rounded p-3 mb-2">
                  <div><b>Name:</b> {searchResult.full_name}</div>
                  <div><b>Age:</b> {searchResult.age}</div>
                  <div><b>Gender:</b> {searchResult.gender}</div>
                  <div><b>UHID:</b> {searchResult.uhid}</div>
                  <div><b>Contact:</b> {searchResult.mobile}</div>
                  <Button className="mt-2" onClick={() => setVisitStarted(false)}>Start New Visit</Button>
                  {!visitStarted && (
                    <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Department</Label>
                      <Select value={visitForm.department} onValueChange={v => handleVisitFormChange("department", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sub-Department</Label>
                      <Select value={visitForm.subDepartment} onValueChange={v => handleVisitFormChange("subDepartment", v)} disabled={!visitForm.department}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose sub department" />
                        </SelectTrigger>
                        <SelectContent>
                          {sub_departments.filter(sd => sd.department_id.toString() === visitForm.department).map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Doctor</Label>
                      <Select value={visitForm.doctor} onValueChange={v => handleVisitFormChange("doctor", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>{doc.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Visit Type</Label>
                      <Select value={visitForm.visitType} onValueChange={v => handleVisitFormChange("visitType", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose visit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPD">OPD</SelectItem>
                          <SelectItem value="IPD">IPD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Scheduled At</Label>
                      <Input
                        type="datetime-local"
                        value={visitForm.scheduledAt}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={e => handleVisitFormChange("scheduledAt", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Notes</Label>
                      <Input
                        value={visitForm.notes || ""}
                        onChange={e => handleVisitFormChange("notes", e.target.value)}
                        placeholder="Optional notes for this visit"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button className="mt-2" onClick={e => { e.preventDefault(); handleStartVisit(); }} disabled={loading}>Start Visit</Button>
                    </div>
                  </form>
                )}
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Button onClick={() => setShowRegistration(true)} variant="outline">Register New Patient</Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <PatientRegistrationForm onSave={handlePatientRegistered} />
          </div>
        )}
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onClose()}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 