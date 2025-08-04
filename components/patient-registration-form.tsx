"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type Patient, departmentDoctorMap } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { format } from "date-fns"

// Replace firstName/lastName with full_name, add aadhaar
export default function PatientRegistrationForm({ onSave, onBillReady }: { onSave?: () => void, onBillReady?: (patient: any) => void }) {
  const [formData, setFormData] = useState<any>({
    full_name: "",
    age: "",
    gender: "Male",
    mobile: "",
    aadhaar: "",
    address: "",
    department_id: "",
    sub_department_id: "",
    doctor_id: "",
    complaint: "",
    consultationDate: "",
    patient_type: "OPD",
  })
  const [touched, setTouched] = useState<{[k:string]:boolean}>({})
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Provided department and sub_department data
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

  // Fetch doctors filtered by department/sub_department
  React.useEffect(() => {
    async function fetchDoctors() {
      let query = supabase.from("staff").select("id, full_name, department_id, sub_department_id").eq("role", "doctor")
      if (formData.department_id) query = query.eq("department_id", formData.department_id)
      if (formData.sub_department_id) query = query.eq("sub_department_id", formData.sub_department_id)
      const { data, error } = await query
      setDoctors(!error && data ? data : [])
    }
    fetchDoctors()
  }, [formData.department_id, formData.sub_department_id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev: any) => ({ ...prev, [id]: value }))
  }
  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }))
    if (id === "department_id") {
      setFormData((prev: any) => ({ ...prev, sub_department_id: "", doctor_id: "" }))
    }
  }
  const handleReset = () => {
    setFormData({
      full_name: "",
      age: "",
      gender: "Male",
      mobile: "",
      aadhaar: "",
      address: "",
      department_id: "",
      sub_department_id: "",
      doctor_id: "",
      complaint: "",
      consultationDate: "",
      patient_type: "OPD",
    })
    setTouched({})
  }
  const handleBlur = (id: string) => setTouched((prev) => ({ ...prev, [id]: true }))

  const requiredFields = [
    "full_name", "age", "gender", "mobile", "aadhaar", "address", "department_id", "doctor_id", "complaint", "consultationDate", "patient_type"
  ]
  const isValid = requiredFields.every((field) => formData[field])

  // Generate UHID in format PAMCH-25-MONTH-0001
  async function generateUHID() {
    const now = new Date()
    const month = format(now, "MMM").toUpperCase()
    const prefix = `PAMCH-25-${month}-`
    // Query for max uhid for this month
    const { data, error } = await supabase
      .from("patients")
      .select("uhid")
      .ilike("uhid", `${prefix}%`)
    let maxNum = 0
    if (data && data.length > 0) {
      data.forEach((row: any) => {
        const match = row.uhid.match(/(\d{4})$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNum) maxNum = num
        }
      })
    }
    const nextNum = (maxNum + 1).toString().padStart(4, "0")
    return `${prefix}${nextNum}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(Object.fromEntries(requiredFields.map(f => [f, true])))
    if (!isValid) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    setLoading(true)
    const uhid = await generateUHID()
    const patientPayload = {
      uhid,
      full_name: formData.full_name,
      gender: formData.gender,
      age: Number(formData.age),
      mobile: formData.mobile,
      aadhaar: formData.aadhaar,
      address: formData.address,
      created_at: new Date().toISOString(),
    }
    const { data: patientData, error: patientError } = await supabase.from("patients").insert([patientPayload]).select().single()
    if (patientError) {
      console.error("Patient registration error:", patientError)
      setLoading(false)
      toast({ title: "Patient Registration Failed", description: patientError.message, variant: "destructive" })
      return
    }
    // 1. Create appointment
    const appointmentPayload = {
      uhid,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      sub_department_id: formData.sub_department_id ? Number(formData.sub_department_id) : null,
      doctor_id: formData.doctor_id,
      appointment_date: formData.consultationDate,
      reason: formData.complaint,
      status: "pending"
    }
    const { data: appointmentData, error: appointmentError } = await supabase.from("appointments").insert([appointmentPayload]).select().single()
    if (appointmentError) {
      console.error("Appointment creation error:", appointmentError)
      setLoading(false)
      toast({ title: "Appointment Creation Failed", description: appointmentError.message, variant: "destructive" })
      return
    }
    // 2. Create OPD visit
    // Generate OPD number: OPD-YYYYMMDD-XXXX (increment per day)
    const today = new Date()
    const opdPrefix = `OPD-${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2,'0')}${today.getDate().toString().padStart(2,'0')}-`
    const { data: opdDataList, error: opdQueryError } = await supabase
      .from("opd_visits")
      .select("opd_no")
      .ilike("opd_no", `${opdPrefix}%`)
    let maxOpdNum = 0
    if (opdDataList && opdDataList.length > 0) {
      opdDataList.forEach((row: any) => {
        const match = row.opd_no.match(/(\d{4})$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxOpdNum) maxOpdNum = num
        }
      })
    }
    const nextOpdNum = (maxOpdNum + 1).toString().padStart(4, "0")
    const opd_no = `${opdPrefix}${nextOpdNum}`
    const opdVisitPayload = {
      opd_no,
      uhid,
      appointment_id: appointmentData.id,
      visit_date: formData.consultationDate || today.toISOString().slice(0,10)
    }
    const { data: opdVisitData, error: opdVisitError } = await supabase.from("opd_visits").insert([opdVisitPayload]).select().single()
    if (opdVisitError) {
      console.error("OPD visit creation error:", opdVisitError)
      setLoading(false)
      toast({ title: "OPD Visit Creation Failed", description: opdVisitError.message, variant: "destructive" })
      return
    }
    // 3. Create bill for this OPD visit
    const billPayload = {
      opd_no,
      bill_date: today.toISOString(),
      description: "OPD Visit Charge",
      amount: 100
    }
    const { data: billData, error: billError } = await supabase.from("billing_records").insert([billPayload]).select().single()
    setLoading(false)
    if (billError) {
      console.error("Bill creation error:", billError)
      toast({ title: "Bill Creation Failed", description: billError.message, variant: "destructive" })
      return
    }
    
    console.log("Registration successful:", { patientData, appointmentData, opdVisitData, billData })
    
    setTimeout(() => {
      handleReset();
      if (onSave) onSave();
      if (onBillReady && patientData) onBillReady(patientData);
    }, 300);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Type toggle */}
          <div className="col-span-full">
            <Label>Patient Type: <span className="text-red-500">*</span></Label>
            <RadioGroup id="patient_type" value={formData.patient_type} onValueChange={v => setFormData((prev: any) => ({ ...prev, patient_type: v }))} className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OPD" id="type-opd" />
                <Label htmlFor="type-opd">OPD</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IPD" id="type-ipd" />
                <Label htmlFor="type-ipd">IPD</Label>
              </div>
            </RadioGroup>
          </div>
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="full_name">Full name: <span className="text-red-500">*</span></Label>
              <Input id="full_name" value={formData.full_name} onChange={handleChange} onBlur={() => handleBlur("full_name")} required />
              {touched.full_name && !formData.full_name && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="age">Age: <span className="text-red-500">*</span></Label>
              <Input id="age" type="number" value={formData.age} onChange={handleChange} onBlur={() => handleBlur("age")} required />
              {touched.age && !formData.age && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="mobile">Mobile: <span className="text-red-500">*</span></Label>
              <Input id="mobile" value={formData.mobile} onChange={handleChange} onBlur={() => handleBlur("mobile")} required />
              {touched.mobile && !formData.mobile && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="aadhaar">Aadhaar: <span className="text-red-500">*</span></Label>
              <Input id="aadhaar" value={formData.aadhaar} onChange={handleChange} onBlur={() => handleBlur("aadhaar")} required />
              {touched.aadhaar && !formData.aadhaar && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="department_id">Department: <span className="text-red-500">*</span></Label>
              <Select value={formData.department_id} onValueChange={(v) => handleSelectChange("department_id", v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.department_id && !formData.department_id && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="doctor_id">Doctor: <span className="text-red-500">*</span></Label>
              <Select value={formData.doctor_id} onValueChange={(v) => handleSelectChange("doctor_id", v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length > 0
                    ? doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.full_name}</SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div>
              <Label>Gender: <span className="text-red-500">*</span></Label>
              <RadioGroup id="gender" value={formData.gender} onValueChange={(v) => handleSelectChange("gender", v)} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="gender-male" />
                  <Label htmlFor="gender-male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="gender-female" />
                  <Label htmlFor="gender-female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="gender-other" />
                  <Label htmlFor="gender-other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="address">Address: <span className="text-red-500">*</span></Label>
              <Textarea id="address" value={formData.address} onChange={handleChange} onBlur={() => handleBlur("address")} required />
              {touched.address && !formData.address && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="sub_department_id">Sub department: </Label>
              <Select value={formData.sub_department_id} onValueChange={(v) => handleSelectChange("sub_department_id", v)} disabled={!formData.department_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose sub department" />
                </SelectTrigger>
                <SelectContent>
                  {sub_departments.filter(sd => sd.department_id.toString() === formData.department_id).map((sub) => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="complaint">Complaint: <span className="text-red-500">*</span></Label>
              <Textarea id="complaint" value={formData.complaint} onChange={handleChange} onBlur={() => handleBlur("complaint")} required />
              {touched.complaint && !formData.complaint && <span className="text-xs text-red-500">Required</span>}
            </div>
            <div>
              <Label htmlFor="consultationDate">Consultation date: <span className="text-red-500">*</span></Label>
              <Input id="consultationDate" type="date" value={formData.consultationDate} onChange={handleChange} onBlur={() => handleBlur("consultationDate")} required />
              {touched.consultationDate && !formData.consultationDate && <span className="text-xs text-red-500">Required</span>}
            </div>
          </div>
          {/* Buttons */}
          <div className="col-span-full flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
            <Button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</Button>
          </div>
        </form>
      </div>
  )
}
