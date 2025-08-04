"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"
import OPDFollowUpForm from "@/components/opd-follow-up-form"

interface OPDFollowUp {
  id: number
  opd_no: string
  date: string
  doctor_id: string
  notes: string
  created_at: string
  patient_name?: string
  doctor_name?: string
  procedures?: any[]
  medications?: any[]
}

export default function PatientOPDFollowUpsPage() {
  const params = useParams()
  const opdNo = params.uhid as string // Actually OPD No
  
  const [followUps, setFollowUps] = useState<OPDFollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<OPDFollowUp | null>(null)
  const [deletingFollowUp, setDeletingFollowUp] = useState<number | null>(null)

  useEffect(() => {
    loadFollowUps()
  }, [opdNo])

  const loadFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from("opd_follow_up_sheets")
        .select("*, created_at")
        .eq("opd_no", opdNo)
        .order("created_at", { ascending: false })

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
            ...item,
            procedures: proceduresData || [],
            medications: medicationsData || []
          }
        }) || []
      )

      setFollowUps(formattedData)
    } catch (error) {
      console.error("Error loading follow-ups:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (followUpId: number) => {
    if (!confirm("Are you sure you want to delete this follow-up?")) {
      return
    }

    setDeletingFollowUp(followUpId)

    try {
      const { error } = await supabase
        .from("opd_follow_up_sheets")
        .delete()
        .eq("id", followUpId)

      if (error) throw error

      toast({ title: "Success", description: "Follow-up deleted successfully" })
      loadFollowUps()
    } catch (error) {
      console.error("Error deleting follow-up:", error)
      toast({ title: "Error", description: "Failed to delete follow-up", variant: "destructive" })
    } finally {
      setDeletingFollowUp(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/dashboard/patients`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Patients
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">OPD Follow-ups</h1>
          <p className="text-muted-foreground">
            OPD: <span className="font-medium">{opdNo}</span>
          </p>
        </div>
        <Button onClick={() => {
          setShowForm(true)
          setEditingFollowUp(null)
        }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Follow-up
        </Button>
      </div>

      {/* OPD Follow-up Form */}
      {showForm && (
        <OPDFollowUpForm
          onClose={() => {
            setShowForm(false)
            setEditingFollowUp(null)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingFollowUp(null)
            loadFollowUps()
          }}
          initialData={editingFollowUp}
          initialOpdNo={opdNo}
        />
      )}

      {/* Follow-ups List */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Follow-ups ({followUps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No follow-ups found. Add your first follow-up!
            </div>
          ) : (
            <div className="space-y-4">
              {followUps.map((followUp) => (
                <Card key={followUp.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-base font-semibold text-blue-600">
                            {formatDateTime(followUp.date).date}
                          </div>
                          <div className="text-base text-muted-foreground">
                            {followUp.created_at ? formatDateTime(followUp.created_at).time : formatDateTime(followUp.date).time}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingFollowUp(followUp)
                              setShowForm(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(followUp.id)}
                            disabled={deletingFollowUp === followUp.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingFollowUp === followUp.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                      <div className="text-base">
                        <p className="whitespace-pre-wrap">{followUp.notes}</p>
                      </div>
                      
                      {/* Display Procedures */}
                      {followUp.procedures && followUp.procedures.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Procedures:</h4>
                          <div className="space-y-2">
                            {followUp.procedures.map((proc, idx) => (
                              <div key={idx} className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                <div className="font-medium text-blue-900">{proc.procedure_name}</div>
                                <div className="text-sm text-blue-700 grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                  {proc.requirements && <div>Requirements: {proc.requirements}</div>}
                                  {proc.quantity && <div>Quantity: {proc.quantity}</div>}
                                  {proc.start_date && <div>Start: {proc.start_date}</div>}
                                  {proc.end_date && <div>End: {proc.end_date}</div>}
                                  {proc.therapist && <div>Therapist: {proc.therapist}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Display Medications */}
                      {followUp.medications && followUp.medications.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-green-800 mb-2">Internal Medications:</h4>
                          <div className="space-y-2">
                            {followUp.medications.map((med, idx) => (
                              <div key={idx} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                                <div className="font-medium text-green-900">{med.medication_name}</div>
                                <div className="text-sm text-green-700 grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                  {med.dosage && <div>Dosage: {med.dosage}</div>}
                                  {med.frequency && <div>Frequency: {med.frequency}</div>}
                                  {med.start_date && <div>Start: {med.start_date}</div>}
                                  {med.end_date && <div>End: {med.end_date}</div>}
                                </div>
                                {med.notes && (
                                  <div className="text-sm text-green-600 mt-1">
                                    Notes: {med.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 