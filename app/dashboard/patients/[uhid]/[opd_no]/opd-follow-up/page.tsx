"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Search, Filter, ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"
import OPDFollowUpForm from "@/components/opd-follow-up-form"
import Link from "next/link"

interface OPDFollowUp {
  id: number
  opd_no: string
  date: string
  doctor_id: string
  notes: string
  patient_name?: string
  doctor_name?: string
  procedures?: any[]
  medications?: any[]
}

export default function PatientOPDFollowUpsPage() {
  const params = useParams()
  const uhid = params.uhid as string
  const opdNo = params.opd_no as string
  
  const [followUps, setFollowUps] = useState<OPDFollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterDoctor, setFilterDoctor] = useState("")
  const [doctors, setDoctors] = useState<any[]>([])
  const [patientInfo, setPatientInfo] = useState<any>(null)

  // Load follow-ups and doctors
  useEffect(() => {
    loadFollowUps()
    loadDoctors()
    loadPatientInfo()
  }, [opdNo])

  const loadPatientInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("opd_visits")
        .select("patient_name, created_at, uhid")
        .eq("opd_no", opdNo)
        .single()

      if (error) throw error
      setPatientInfo(data)
    } catch (error) {
      console.error("Error loading patient info:", error)
    }
  }

  const loadFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from("opd_follow_up_sheets")
        .select(`
          *,
          opd_visits!inner(patient_name),
          staff!inner(name)
        `)
        .eq("opd_no", opdNo)
        .order("date", { ascending: false })

      if (error) throw error

      // Load procedures and medications for each follow-up
      const formattedData = await Promise.all(
        data?.map(async (item) => {
          // Load procedures for this follow-up date
          const { data: proceduresData } = await supabase
            .from("procedure_entries")
            .select("*")
            .eq("opd_no", opdNo)
            .eq("start_date", item.date)

          // Load medications for this follow-up date
          const { data: medicationsData } = await supabase
            .from("internal_medications")
            .select("*")
            .eq("opd_no", opdNo)
            .eq("start_date", item.date)

          return {
            id: item.id,
            opd_no: item.opd_no,
            date: item.date,
            doctor_id: item.doctor_id,
            notes: item.notes,
            patient_name: item.opd_visits?.patient_name,
            doctor_name: item.staff?.name,
            procedures: proceduresData || [],
            medications: medicationsData || []
          }
        }) || []
      )

      setFollowUps(formattedData)
    } catch (error) {
      console.error("Error loading follow-ups:", error)
      toast({ title: "Error", description: "Failed to load follow-ups", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name")
        .eq("role", "doctor")
        .order("name")

      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error("Error loading doctors:", error)
    }
  }

  const handleAddFollowUp = () => {
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingFollowUp(null)
  }

  const handleFormSave = () => {
    setShowForm(false)
    setEditingFollowUp(null)
    loadFollowUps() // Reload the list
    toast({ title: "Success", description: editingFollowUp ? "Follow-up updated successfully" : "Follow-up added successfully" })
  }

  const handleEditFollowUp = (followUp: any) => {
    setEditingFollowUp(followUp)
    setShowForm(true)
  }

  const filteredFollowUps = followUps.filter(followUp => {
    const matchesSearch = 
      followUp.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.notes.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !filterDate || followUp.date === filterDate
    const matchesDoctor = !filterDoctor || followUp.doctor_id === filterDoctor

    return matchesSearch && matchesDate && matchesDoctor
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading follow-ups...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/dashboard/patients/${uhid}`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Patient
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">OPD Follow-ups</h1>
          <p className="text-muted-foreground">
            {patientInfo?.patient_name && (
              <>Patient: <span className="font-medium">{patientInfo.patient_name}</span> • </>
            )}
            OPD: <span className="font-medium">{opdNo}</span>
          </p>
        </div>
        <Button onClick={handleAddFollowUp} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Follow-up
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by doctor or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Doctor</label>
              <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="All doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All doctors</SelectItem>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setFilterDate("")
                setFilterDoctor("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Follow-ups ({filteredFollowUps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFollowUps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterDate || filterDoctor ? 
                "No follow-ups match your filters" : 
                "No follow-ups found for this OPD visit. Add your first follow-up!"
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFollowUps.map((followUp) => (
                <Card key={followUp.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-sm">
                            {formatDate(followUp.date)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Dr. {followUp.doctor_name || "Unknown"}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                            {followUp.notes || "No notes provided"}
                          </p>
                        </div>

                        {/* Procedures */}
                        {followUp.procedures && followUp.procedures.length > 0 && (
                          <div className="text-sm mt-3">
                            <span className="font-medium text-blue-600">Procedures:</span>
                            <div className="mt-1 space-y-1">
                              {followUp.procedures.map((proc, idx) => (
                                <div key={idx} className="bg-blue-50 p-2 rounded text-xs">
                                  <div className="font-medium">{proc.procedure_name}</div>
                                  {proc.requirements && <div>Requirements: {proc.requirements}</div>}
                                  {proc.quantity && <div>Quantity: {proc.quantity}</div>}
                                  {proc.start_date && <div>Start: {proc.start_date}</div>}
                                  {proc.end_date && <div>End: {proc.end_date}</div>}
                                  {proc.therapist && <div>Therapist: {proc.therapist}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Medications */}
                        {followUp.medications && followUp.medications.length > 0 && (
                          <div className="text-sm mt-3">
                            <span className="font-medium text-green-600">Medications:</span>
                            <div className="mt-1 space-y-1">
                              {followUp.medications.map((med, idx) => (
                                <div key={idx} className="bg-green-50 p-2 rounded text-xs">
                                  <div className="font-medium">{med.medication_name}</div>
                                  {med.dosage && <div>Dosage: {med.dosage}</div>}
                                  {med.frequency && <div>Frequency: {med.frequency}</div>}
                                  {med.start_date && <div>Start: {med.start_date}</div>}
                                  {med.end_date && <div>End: {med.end_date}</div>}
                                  {med.notes && <div>Notes: {med.notes}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditFollowUp(followUp)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Follow-up Form Modal */}
      {showForm && (
        <OPDFollowUpForm
          onClose={handleFormClose}
          onSave={handleFormSave}
          initialOpdNo={opdNo}
          initialData={editingFollowUp}
        />
      )}
    </div>
  )
} 