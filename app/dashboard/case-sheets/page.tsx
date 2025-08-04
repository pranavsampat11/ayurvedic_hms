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
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PrintableCaseSheet from "@/components/printable-case-sheet";

async function exportCaseSheetToWord(cs) {
  // Map cs fields to template placeholders
  const data = {
    patient_name: `${cs.patients?.first_name || ''} ${cs.patients?.last_name || ''}`,
    uhid: cs.uhid,
    opd_no: cs.patients?.opd_no,
    age: cs.age,
    referral: cs.referral || '',
    gender: cs.gender,
    contact: cs.contact,
    address: cs.address,
    doctor_name: cs.doctor || '',
    department: cs.department,
    chief_complaints: cs.chief_complaints,
    associated_complaints: cs.associated_complaints,
    past_history: cs.past_history,
    personal_history: cs.personal_history,
    allergy_history: cs.allergy_history,
    family_history: cs.family_history,
    obs_gyn_history: cs.obs_gyn_history,
    height: cs.height,
    weight: cs.weight,
    bmi: cs.bmi,
    pulse: cs.pulse,
    rr: cs.rr,
    bp: cs.bp,
    respiratory_system: cs.respiratory_system,
    cvs: cs.cvs,
    cns: cs.cns,
    local_examination: cs.local_examination,
    pain_assessment: cs.pain_assessment,
    investigations: cs.investigations,
    diagnosis: cs.diagnosis,
    nutritional_status: cs.nutritional_status,
    treatment_plan: cs.treatment_plan,
    preventive_aspects: cs.preventive_aspects,
    rehabilitation: cs.rehabilitation,
    desired_outcome: cs.desired_outcome,
    date_time: cs.created_at?.slice(0, 16).replace('T', ' ') || '',
  };
  const response = await fetch("/templates/OPD_Case_Sheet_VARIABLES_TEMPLATE_FINAL.docx");
  const arrayBuffer = await response.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.setData(data);
  try {
    doc.render();
    const blob = doc.getZip().generate({ type: "blob" });
    saveAs(blob, `CaseSheet_${data.uhid || "patient"}.docx`);
  } catch (error) {
    console.error("Template render error", error);
    alert("Failed to generate Word document. See console for details.");
  }
}

export default function CaseSheetsPage() {
  const [caseSheets, setCaseSheets] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [editSheet, setEditSheet] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSheet, setPrintSheet] = useState<any | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);
  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null
  const router = useRouter()

  useEffect(() => {
    async function fetchCaseSheets() {
      if (!doctorId) return
      const { data, error } = await supabase
        .from("opd_case_sheets")
        .select("*")
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
      cs.patient_name?.toLowerCase().includes(s) ||
      cs.diagnosis?.toLowerCase().includes(s) ||
      (cs.uhid || cs.opd_no)?.toLowerCase().includes(s) ||
      cs.contact?.toLowerCase().includes(s)
    )
  })

  const handlePrint = async (cs: any) => {
    setPrintSheet(cs);
    setShowPrintModal(true);
    
    // Fetch procedures and internal medications for this case sheet
    const opdNo = cs.opd_no;
    
    // Fetch procedures
    const { data: procedures } = await supabase
      .from("procedure_entries")
      .select("*")
      .eq("opd_no", opdNo);
    
    // Fetch internal medications
    const { data: internalMedications } = await supabase
      .from("internal_medications")
      .select("*")
      .eq("opd_no", opdNo);
    
    // Prepare complete print data
    const completeData = {
      patient_name: cs.patient_name || '',
      uhid: cs.uhid,
      opd_no: cs.opd_no,
      age: cs.age,
      ref: cs.referral || '',
      gender: cs.gender,
      contact: cs.contact,
      address: cs.address,
      doctor: cs.doctor || '',
      department: cs.department,
      chief_complaints: cs.chief_complaints,
      associated_complaints: cs.associated_complaints,
      past_history: cs.past_history,
      personal_history: cs.personal_history,
      allergy_history: cs.allergy_history,
      family_history: cs.family_history,
      obs_gyn_history: cs.obs_gyn_history,
      // Individual examination fields
      height: cs.height,
      weight: cs.weight,
      bmi: cs.bmi,
      pulse: cs.pulse,
      rr: cs.rr,
      bp: cs.bp,
      respiratory_system: cs.respiratory_system,
      cvs: cs.cvs,
      cns: cs.cns,
      local_examination: cs.local_examination,
      pain_assessment: cs.pain_assessment,
      investigations: cs.investigations,
      diagnosis: cs.diagnosis,
      nutritional_status: cs.nutritional_status,
      treatment_plan: cs.treatment_plan,
      preventive_aspects: cs.preventive_aspects,
      rehabilitation: cs.rehabilitation,
      desired_outcome: cs.desired_outcome,
      created_at: cs.created_at,
      // Procedures and medications
      procedures: procedures || [],
      internal_medications: internalMedications || [],
    };
    
    setPrintData(completeData);
  };

  return (
    <DoctorDashboardLayout title="Case Sheets">
      <div>
        <h1 className="text-2xl font-bold mb-4">My Case Sheets</h1>
        <Input placeholder="Search by name, OPD number, or mobile..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4 max-w-md" />
        {loading ? <div>Loading...</div> : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 ? <div>No case sheets found.</div> : filtered.map(cs => (
              <Card key={cs.id}>
                <CardHeader>
                  <CardTitle>{cs.patient_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2"><b>UHID:</b> {cs.uhid || cs.opd_no}</div>
                  <div className="mb-2"><b>Diagnosis:</b> {cs.diagnosis}</div>
                  <div className="mb-2"><b>Date:</b> {cs.created_at?.slice(0, 16).replace('T', ' ')}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => { setEditSheet(cs); setShowEditModal(true); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrint(cs)}>Print</Button>
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
        {/* Print Case Sheet Modal */}
        <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Print Case Sheet</DialogTitle>
            </DialogHeader>
            {printData && (
              <PrintableCaseSheet data={printData} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DoctorDashboardLayout>
  )
} 