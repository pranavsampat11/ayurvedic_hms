"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CaseSheetForm from "@/components/case-sheet-form"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import DoctorDashboardLayout from "@/components/doctor-dashboard-layout";

export default function CaseSheetsPage() {
  const [caseSheets, setCaseSheets] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [editSheet, setEditSheet] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null
  const router = useRouter()

  useEffect(() => {
    async function fetchCaseSheets() {
      if (!doctorId) return
      const { data, error } = await supabase
        .from("opd_case_sheets")
        .select("*, patients:uhid(first_name, last_name, op_no)")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false })
      if (!error && data) setCaseSheets(data)
      setLoading(false)
    }
    fetchCaseSheets()
  }, [doctorId, showEditModal])

  const filtered = caseSheets.filter(cs => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      cs.patients?.first_name?.toLowerCase().includes(s) ||
      cs.patients?.last_name?.toLowerCase().includes(s) ||
      cs.diagnosis?.toLowerCase().includes(s) ||
      cs.patients?.op_no?.toLowerCase().includes(s)
    )
  })

  return (
    <DoctorDashboardLayout title="Case Sheets">
      <div>
        <h1 className="text-2xl font-bold mb-4">My Case Sheets</h1>
        <Input placeholder="Search case sheets..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4 max-w-md" />
        {loading ? <div>Loading...</div> : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? <div>No case sheets found.</div> : filtered.map(cs => (
              <Card key={cs.id}>
                <CardHeader>
                  <CardTitle>{cs.patients?.first_name} {cs.patients?.last_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2"><b>OPD No:</b> {cs.patients?.op_no}</div>
                  <div className="mb-2"><b>Diagnosis:</b> {cs.diagnosis}</div>
                  <div className="mb-2"><b>Date:</b> {cs.created_at?.slice(0, 16).replace('T', ' ')}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => { setEditSheet(cs); setShowEditModal(true); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/case-sheet/${cs.uhid}`)}>View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Case Sheet</DialogTitle>
            </DialogHeader>
            {editSheet && (
              <CaseSheetForm initialCaseSheet={editSheet} onSave={() => setShowEditModal(false)} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DoctorDashboardLayout>
  )
} 