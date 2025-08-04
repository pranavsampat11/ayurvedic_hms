"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"
import OPDFollowUpForm from "@/components/opd-follow-up-form"

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

export default function OPDFollowUpsPage() {
  const [followUps, setFollowUps] = useState<OPDFollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterDoctor, setFilterDoctor] = useState("")
  const [doctors, setDoctors] = useState<any[]>([])

  // Load follow-ups and doctors
  useEffect(() => {
    loadFollowUps()
    loadDoctors()
  }, [])

  const loadFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from("opd_follow_up_sheets")
        .select(`
          *,
          opd_visits!inner(patient_name),
          staff!inner(name)
        `)
        .order("date", { ascending: false })

      if (error) throw error

      // Load procedures and medications for each follow-up
      const followUpsWithDetails = await Promise.all(
        data?.map(async (item) => {
          // Load procedures for this follow-up date
          const { data: procedures } = await supabase
            .from("procedure_entries")
            .select("*")
            .eq("opd_no", item.opd_no)
            .gte("created_at", item.date + "T00:00:00.000Z")
            .lt("created_at", item.date + "T23:59:59.999Z")

          // Load medications for this follow-up date
          const { data: medications } = await supabase
            .from("internal_medications")
            .select("*")
            .eq("opd_no", item.opd_no)
            .gte("created_at", item.date + "T00:00:00.000Z")
            .lt("created_at", item.date + "T23:59:59.999Z")

          return {
            id: item.id,
            opd_no: item.opd_no,
            date: item.date,
            doctor_id: item.doctor_id,
            notes: item.notes,
            patient_name: item.opd_visits?.patient_name,
            doctor_name: item.staff?.name,
            procedures: procedures || [],
            medications: medications || []
          }
        }) || []
      )

      setFollowUps(followUpsWithDetails)
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
  }

  const handleFormSave = () => {
    setShowForm(false)
    loadFollowUps() // Reload the list
    toast({ title: "Success", description: "Follow-up added successfully" })
  }

  const handleRequestRequirements = async (procedure: any, followUp: OPDFollowUp) => {
    if (!procedure || !followUp.opd_no) {
      toast({
        title: "Error",
        description: "Unable to request requirements for this procedure",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, ensure the procedure is saved to procedure_entries
      const { data: procedureData, error: procedureError } = await supabase
        .from("procedure_entries")
        .insert({
          opd_no: followUp.opd_no,
          ipd_no: null,
          procedure_name: procedure.procedure_name,
          requirements: procedure.requirements,
          quantity: procedure.quantity || null,
          start_date: procedure.start_date || new Date().toISOString().split('T')[0],
          end_date: procedure.end_date || null,
          therapist: procedure.therapist || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (procedureError) {
        console.error("Procedure insert error:", procedureError);
        throw procedureError;
      }

      // Then create the procedure medicine requirement request
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          opd_no: followUp.opd_no,
          procedure_entry_id: procedureData.id,
          requirements: procedure.requirements,
          quantity: procedure.quantity || null,
          requested_by: followUp.doctor_id,
          status: "pending",
        });

      if (requestError) {
        console.error("Request insert error:", requestError);
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Requirements request submitted successfully",
      });

    } catch (error) {
      console.error("Error requesting requirements:", error);
      toast({
        title: "Error",
        description: "Failed to submit requirements request",
        variant: "destructive",
      });
    }
  };

  const handleRequestMedication = async (medication: any, followUp: OPDFollowUp) => {
    if (!medication || !followUp.opd_no) {
      toast({
        title: "Error",
        description: "Unable to request medication",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, ensure the medication is saved to internal_medications
      const { data: medicationData, error: medicationError } = await supabase
        .from("internal_medications")
        .insert({
          opd_no: followUp.opd_no,
          medication_name: medication.medication_name,
          dosage: medication.dosage || null,
          frequency: medication.frequency || null,
          start_date: medication.start_date || new Date().toISOString().split('T')[0],
          end_date: medication.end_date || null,
          notes: medication.notes || null,
          prescribed_by: followUp.doctor_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (medicationError) {
        console.error("Medication insert error:", medicationError);
        throw medicationError;
      }

      // Then create the medication dispense request
      const { error: requestError } = await supabase
        .from("medication_dispense_requests")
        .insert({
          opd_no: followUp.opd_no,
          medication_id: medicationData.id,
          status: "pending",
        });

      if (requestError) {
        console.error("Request insert error:", requestError);
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Medication request submitted successfully",
      });

    } catch (error) {
      console.error("Error requesting medication:", error);
      toast({
        title: "Error",
        description: "Failed to submit medication request",
        variant: "destructive",
      });
    }
  };

  const filteredFollowUps = followUps.filter(followUp => {
    const matchesSearch = 
      followUp.opd_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="text-3xl font-bold">OPD Follow-ups</h1>
          <p className="text-muted-foreground">Manage patient follow-up records</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by OPD, patient, doctor, or notes..."
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterDate("")
                  setFilterDoctor("")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
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
                "No follow-ups found. Add your first follow-up!"
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
                            {followUp.opd_no}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(followUp.date)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-medium">
                            Patient: {followUp.patient_name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Doctor: {followUp.doctor_name || "Unknown"}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                            {followUp.notes || "No notes provided"}
                          </p>
                        </div>
                        
                        {/* Procedures Section */}
                        {followUp.procedures && followUp.procedures.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Procedures:</span>
                            <div className="mt-1 space-y-1">
                                                             {followUp.procedures.map((proc, idx) => (
                                 <div key={idx} className="bg-blue-50 p-2 rounded text-xs">
                                   <div className="flex justify-between items-start">
                                     <div className="flex-1">
                                       <div className="font-medium">{proc.procedure_name}</div>
                                       {proc.requirements && (
                                         <div className="text-muted-foreground">Requirements: {proc.requirements}</div>
                                       )}
                                       {proc.quantity && (
                                         <div className="text-muted-foreground">Quantity: {proc.quantity}</div>
                                       )}
                                       {proc.therapist && (
                                         <div className="text-muted-foreground">Therapist: {proc.therapist}</div>
                                       )}
                                     </div>
                                     <Button
                                       type="button"
                                       size="sm"
                                       variant="secondary"
                                       className="ml-2 text-xs"
                                       onClick={() => handleRequestRequirements(proc, followUp)}
                                     >
                                       Request Requirements
                                     </Button>
                                   </div>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Medications Section */}
                        {followUp.medications && followUp.medications.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Internal Medications:</span>
                            <div className="mt-1 space-y-1">
                              {followUp.medications.map((med, idx) => (
                                <div key={idx} className="bg-green-50 p-2 rounded text-xs">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium">{med.medication_name}</div>
                                      {med.dosage && (
                                        <div className="text-muted-foreground">Dosage: {med.dosage}</div>
                                      )}
                                      {med.frequency && (
                                        <div className="text-muted-foreground">Frequency: {med.frequency}</div>
                                      )}
                                      {med.notes && (
                                        <div className="text-muted-foreground">Notes: {med.notes}</div>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      className="ml-2 text-xs"
                                      onClick={() => handleRequestMedication(med, followUp)}
                                    >
                                      Request Medication
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
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

      {/* Add Follow-up Form Modal */}
      {showForm && (
        <OPDFollowUpForm
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  )
} 