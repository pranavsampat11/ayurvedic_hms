"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getDummyPatient, getDummyInvestigations } from "@/lib/dummy";

interface PageProps {
  params: any;
}

export default function RequestInvestigationPage({ params }: PageProps) {
  const paramsObj = React.use(params) as { uhid: string };
  const visitId = paramsObj.uhid; // can be OPD-... or IPD-...
  const isOPD = typeof visitId === "string" && visitId.startsWith("OPD-");

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [doctorId, setDoctorId] = useState<string>("");

  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [notes, setNotes] = useState<string>("");

  const [investigations, setInvestigations] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [investigationSchedule, setInvestigationSchedule] = useState<any[]>([]);

  const visitFilter = useMemo(() => (isOPD ? { column: "opd_no", value: visitId } : { column: "ipd_no", value: visitId }), [isOPD, visitId]);

  // Diagnostic services data structure (same as case sheet)
  const diagnosticServices = {
    "Laboratory Services": {
      "HAEMATOLOGY": [
        "Complete Haemogram", "C.B.C.", "C.B.C. with ESR", "Hb%", "TC / DC", "P.S. Study",
        "Hb, TC, DC. ESR", "Platelet Count", "Absolute Eosinophil Count", "Retic Count",
        "MP by QBC", "BT & CT", "P.S. for M.P.", "Coagulation profile", "Prothrombin Time (PT)",
        "APTT", "Blood Group / Rh factor", "Coomb's test", "Clot retraction time",
        "Osmotic fragility", "Bone marrow study", "D. Dimer", "Du Test", "CD4 / CD8",
        "Vit B 12 assay", "Folic acid assay", "Iron studies"
      ],
      "BIOCHEMISTRY": [
        "Glucose - F, PP, R", "GTT", "Mini GTT", "Urea / BUN", "S. Creatinine",
        "S. Bilirubin (T/D/I)", "SGOT", "SGPT", "S.G-glutamyl transferase",
        "S. Alkaline Phosphatase", "Total Protein / Alb/Glo, A/G", "Total Cholesterol",
        "S. Triglyceride", "HDL Cholesterol", "LDL Cholesterol", "VLDL",
        "S. Electrolytes: NA, K, CI", "Calcium", "Phosphorous", "Magnesium",
        "S. Amylase", "S. Lipase", "HbA1c", "S. Cholinesterase", "S. Uric Acid"
      ],
      "SEROLOGY": [
        "Tuberculin test / Mantoux test", "HIV Screening test", "HBsAg Screening test",
        "HCV Test", "VDRL test", "Widal", "Rapid Malaria Screen (Antigen)",
        "Rapid Malaria Screen (Antibody)", "Dengue serology", "CRP Qualitative",
        "CRP (Immunoturbidometry)", "ASO Qualitative", "ASO (Immunoturbidometry)",
        "RA test Qualitative"
      ],
      "URINE": [
        "Routine", "Complete", "Pregnancy test", "Micro albumin", "B.J. Protein",
        "24 Hrs. Urinary Protein", "24 Hrs. Urine electrolytes (Na/K/Ca)/Spot"
      ],
      "PROFILES": [
        "LFT I", "LFT II", "LFT III", "Lipid Profile", "Renal Function Tests (RFT) I",
        "RFT II", "Diabetic Profile - I", "Diabetic Profile - II", "Fever Profile-I",
        "Fever Profile-II", "ANC Profile", "Surgical Profile", "Sepsis Screen",
        "Hypertension Profile", "Iron Profile", "Master Health Checkup"
      ]
    },
    "Imaging Services": {
      "MRI (1.5 Tesla)": [
        "Brain", "Brain with contrast", "Brain with MRA", "Brain with MRV",
        "Intracranial", "Neck", "Tumour Protocol", "Epilepsy Protocol", "Stroke Protocol",
        "Posterior fossa / inner ear", "M.R. Angio - Intracranial/Neck", "M.R. Angio - Renal",
        "M.R. Angio - Peripheral", "M.R. Angio - Aorta", "M.R. Angio - Thoracic",
        "M.R. Angio - Abdominal", "Spine - Cervical", "Spine - Thoracic", "Spine - Lumbo-Sacral",
        "Spine with Survey", "Shoulder", "Elbow", "Wrist", "Hip", "Knee", "Ankle",
        "Body - Neck", "Body - Thorax", "Body - Pelvis", "Body - Breast", "Body - Abdomen",
        "Cardiac", "MRCP", "MR Spectroscopy", "MR Perfusion", "MR Tractography",
        "WHOLE BODY", "Functional MRI", "MR Neurography"
      ],
      "CT Scan (128 Slice)": [
        "Coronary Angiogram", "Post CABG/Stenting", "Calcium Scoring",
        "Brain Plain", "Brain contrast", "Stroke Protocol", "Orbit", "Temporal Bone",
        "Paranasal Sinuses", "Neck", "Chest", "HRCT Lungs", "Upper Abdomen",
        "Pelvis", "Whole Abdomen", "Spine", "Bony Pelvis", "3D", "Virtual Bronchoscopy",
        "Virtual Colonoscopy", "Cerebral Angio", "Pulmonary Angio", "Renal Angio",
        "Neck Angio", "Aortogram", "Peripheral Angio", "Dental", "Biopsy/Aspiration"
      ],
      "Ultrasound (3D/4D)": [
        "Complete Abdomen", "KUB", "Pelvis", "I Trimester - Confirmation",
        "I Trimester - Ectopic", "I Trimester - NT Scan", "II Trimester - Anomaly",
        "II Trimester - 3D/4D Images", "III Trimester - Bio Physical Profile",
        "III Trimester - Doppler", "Down's Screening", "Transvaginal US",
        "Transrectal US", "Ovulation Study", "4D Sonohysterosalphingography",
        "Shoulder", "Soft Tissues", "Infant hip", "Thyroid", "Breast", "Scrotum US",
        "Chest", "Orbit", "Parotid", "Neurosonogram", "Peripheral Vascular",
        "Carotid & Vertebral", "Portal", "Obstetric", "Renal", "Scrotum Doppler", "ECHO",
        "Guided Aspiration/Biopsy", "Amniocentesis", "CVS"
      ],
      "Other Imaging": [
        "Digital Mammogram with Ultrasound", "DEXA - BMD Scan"
      ]
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle investigation selection
  const toggleInvestigation = (investigation: string) => {
    setSelectedInvestigations(prev => 
      prev.includes(investigation)
        ? prev.filter(i => i !== investigation)
        : [...prev, investigation]
    );
  };

  // Toggle all investigations in a subcategory
  const toggleSubcategory = (subcategory: string, investigations: string[]) => {
    const allSelected = investigations.every(inv => selectedInvestigations.includes(inv));
    if (allSelected) {
      setSelectedInvestigations(prev => prev.filter(inv => !investigations.includes(inv)));
    } else {
      setSelectedInvestigations(prev => [...new Set([...prev, ...investigations])]);
    }
  };

  // Remove investigation
  const removeInvestigation = (investigation: string) => {
    setSelectedInvestigations(prev => prev.filter(i => i !== investigation));
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      try {
        if (isOPD) {
          const { data: opdVisit } = await supabase
            .from("opd_visits")
            .select("*, patient:uhid(full_name, age, gender, mobile, address), appointment:appointment_id(doctor_id, doctor:doctor_id(full_name))")
            .eq("opd_no", visitId)
            .single();

          if (opdVisit) {
            setPatient({
              ...opdVisit.patient,
              uhid: opdVisit.uhid,
              opd_no: opdVisit.opd_no,
              doctor_name: opdVisit.appointment?.doctor?.full_name ?? "",
            });
            setDoctorId(opdVisit.appointment?.doctor_id ?? "");
          } else {
            setPatient(getDummyPatient(visitId));
          }
        } else {
          const { data: ipdAdmission } = await supabase
            .from("ipd_admissions")
            .select("*, patient:uhid(full_name, age, gender, mobile, address), doctor:doctor_id(full_name)")
            .eq("ipd_no", visitId)
            .single();

          if (ipdAdmission) {
            setPatient({
              ...ipdAdmission.patient,
              uhid: ipdAdmission.uhid,
              ipd_no: ipdAdmission.ipd_no,
              opd_no: ipdAdmission.opd_no,
              doctor_name: ipdAdmission.doctor?.full_name ?? "",
            });
            setDoctorId(ipdAdmission.doctor_id ?? "");
          } else {
            setPatient(getDummyPatient(visitId));
          }
        }

        // Load existing investigations for this visit
        const { data: investigationData } = await supabase
          .from("requested_investigations")
          .select("*")
          .eq(visitFilter.column, visitFilter.value)
          .order("created_at", { ascending: false });
        setInvestigations((investigationData && investigationData.length > 0) ? investigationData : getDummyInvestigations(visitId));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOPD, visitFilter, visitId]);

  async function loadInvestigationSchedule() {
    if (!scheduledDate) return;
    
    setLoadingSchedule(true);
    try {
      const { data: scheduleData } = await supabase
        .from("requested_investigations")
        .select(`
          *,
          patient:opd_no(uhid(full_name)),
          patient_ipd:ipd_no(uhid(full_name))
        `)
        .eq("scheduled_date", scheduledDate)
        .order("scheduled_time", { ascending: true });
      
      setInvestigationSchedule(scheduleData || []);
    } finally {
      setLoadingSchedule(false);
    }
  }

  async function handleCreateInvestigation() {
    if (selectedInvestigations.length === 0) return;
    setSubmitting(true);
    try {
      const payload: any = {
        requested_investigations: selectedInvestigations.join(", "),
        doctor_id: doctorId || null,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        priority: priority,
        notes: notes || null,
        status: "pending",
      };
      payload[visitFilter.column] = visitFilter.value;

      const { error } = await supabase.from("requested_investigations").insert(payload);
      if (!error) {
        // Refresh list
        const { data: investigationData } = await supabase
          .from("requested_investigations")
          .select("*")
          .eq(visitFilter.column, visitFilter.value)
          .order("created_at", { ascending: false });
        setInvestigations(investigationData ?? []);

        // Reset fields
        setSelectedInvestigations([]);
        setScheduledDate("");
        setScheduledTime("");
        setPriority("normal");
        setNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function markCompleted(id: number) {
    const { error } = await supabase
      .from("requested_investigations")
      .update({ status: "completed" })
      .eq("id", id);
    if (!error) {
      const { data: investigationData } = await supabase
        .from("requested_investigations")
        .select("*")
        .eq(visitFilter.column, visitFilter.value)
        .order("created_at", { ascending: false });
      setInvestigations(investigationData ?? []);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Request Investigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {patient && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Patient Name</Label>
                    <Input value={patient.full_name ?? ""} disabled />
                  </div>
                  <div>
                    <Label>{isOPD ? "OPD No" : "IPD No"}</Label>
                    <Input value={(isOPD ? patient.opd_no : patient.ipd_no) ?? ""} disabled />
                  </div>
                  <div>
                    <Label>UHID</Label>
                    <Input value={patient.uhid ?? ""} disabled />
                  </div>
                  <div>
                    <Label>Doctor</Label>
                    <Input value={patient.doctor_name ?? ""} disabled />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Requested Investigations</Label>
                  
                  {/* Selected Investigations Display */}
                  {selectedInvestigations.length > 0 && (
                    <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                      <Label className="text-sm font-medium mb-2">Selected Investigations:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedInvestigations.filter(inv =>
                          Object.values(diagnosticServices["Laboratory Services"]).flat().includes(inv)
                        ).map((investigation, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {investigation}
                            <button
                              type="button"
                              onClick={() => removeInvestigation(investigation)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {selectedInvestigations
                          .filter(inv => Object.values(diagnosticServices["Imaging Services"]).flat().includes(inv))
                          .map((investigation, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {investigation}
                              <button
                                type="button"
                                onClick={() => removeInvestigation(investigation)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Investigation Categories */}
                  <div className="space-y-2">
                    {Object.entries(diagnosticServices).map(([mainCategory, subcategories]) => (
                      <Collapsible key={mainCategory}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-2 h-auto"
                            onClick={() => toggleCategory(mainCategory)}
                          >
                            <span className="font-medium">{mainCategory}</span>
                            {expandedCategories.includes(mainCategory) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 space-y-2">
                          {Object.entries(subcategories).map(([subcategory, investigations]) => (
                            <div key={subcategory} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSubcategory(subcategory, investigations)}
                                  className="text-sm font-medium"
                                >
                                  {subcategory}
                                </Button>
                                <Checkbox
                                  checked={investigations.every(inv => selectedInvestigations.includes(inv))}
                                  onCheckedChange={() => toggleSubcategory(subcategory, investigations)}
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 pl-4">
                                {investigations.map((investigation) => (
                                  <div key={investigation} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={selectedInvestigations.includes(investigation)}
                                      onCheckedChange={() => toggleInvestigation(investigation)}
                                    />
                                    <Label className="text-sm">{investigation}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Scheduled Date (optional)</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Scheduled Time (optional)</Label>
                  <Input
                    placeholder="e.g. 9:00–10:00 am"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes (e.g., fasting required, special instructions)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleCreateInvestigation} disabled={submitting || selectedInvestigations.length === 0}>
                  {submitting ? "Saving..." : "Create Investigation Request"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    loadInvestigationSchedule();
                    setShowScheduleDialog(true);
                  }}
                  disabled={!scheduledDate}
                >
                  Show Schedule
                </Button>
              </div>

              <hr className="my-4" />

              <div className="space-y-2">
                <h3 className="font-semibold">Existing Investigation Requests</h3>
                {investigations.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No investigation requests yet.</div>
                ) : (
                  <div className="space-y-2">
                    {investigations.map((inv) => (
                      <div key={inv.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-sm">
                          <div>
                            <span className="font-medium">Investigations:</span> {inv.requested_investigations}
                          </div>
                          <div>
                            <span className="font-medium">Scheduled Date:</span> {inv.scheduled_date ? new Date(inv.scheduled_date).toLocaleDateString() : "—"}
                          </div>
                          <div>
                            <span className="font-medium">Scheduled Time:</span> {inv.scheduled_time ?? "—"}
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                              inv.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              inv.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              inv.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {inv.priority}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                              inv.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          {inv.notes && (
                            <div className="mt-1">
                              <span className="font-medium">Notes:</span> {inv.notes}
                            </div>
                          )}
                        </div>
                        {inv.status === "pending" && (
                          <Button variant="outline" onClick={() => markCompleted(inv.id)}>Mark Completed</Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Investigation Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Investigation Schedule - {scheduledDate ? new Date(scheduledDate).toLocaleDateString() : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingSchedule ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading schedule...</p>
              </div>
            ) : investigationSchedule.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No investigations scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {investigationSchedule.map((investigation) => (
                  <div key={investigation.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">
                        {investigation.scheduled_time || 'No time specified'}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        investigation.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {investigation.status}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Patient: {investigation.patient?.full_name || investigation.patient_ipd?.full_name || 'Unknown'}</div>
                      <div>Investigations: {investigation.requested_investigations}</div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        investigation.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        investigation.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        investigation.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {investigation.priority} priority
                      </div>
                      {investigation.notes && (
                        <div className="mt-1 text-xs">Notes: {investigation.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 