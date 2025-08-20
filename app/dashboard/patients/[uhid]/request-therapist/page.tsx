"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { getDummyPatient, getDummyProcedures, getDummyTherapists, getDummyTherapistAssignments } from "@/lib/dummy";

interface PageProps {
  params: any;
}

export default function RequestTherapistPage({ params }: PageProps) {
  const paramsObj = React.use(params) as { uhid: string };
  const visitId = paramsObj.uhid; // can be OPD-... or IPD-...
  const isOPD = typeof visitId === "string" && visitId.startsWith("OPD-");

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [doctorId, setDoctorId] = useState<string>("");

  const [procedures, setProcedures] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);

  const [selectedProcedureId, setSelectedProcedureId] = useState<string>("");
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [therapistSchedule, setTherapistSchedule] = useState<any[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const visitFilter = useMemo(() => (isOPD ? { column: "opd_no", value: visitId } : { column: "ipd_no", value: visitId }), [isOPD, visitId]);

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

        // Load procedures for this visit
        const { data: procData } = await supabase
          .from("procedure_entries")
          .select("*")
          .eq(visitFilter.column, visitFilter.value)
          .order("start_date", { ascending: true });
        setProcedures((procData && procData.length > 0) ? procData : getDummyProcedures(visitId));

        // Load therapists (role = 'therapist')
        const { data: staffData } = await supabase
          .from("staff")
          .select("id, full_name, role")
          .eq("role", "therapist")
          .order("full_name", { ascending: true });
        setTherapists((staffData && staffData.length > 0) ? staffData : getDummyTherapists());

        // Load existing assignments for this visit
        const { data: assignmentData } = await supabase
          .from("therapist_assignments")
          .select("*")
          .eq(visitFilter.column, visitFilter.value)
          .order("created_at", { ascending: false });
        setAssignments((assignmentData && assignmentData.length > 0) ? assignmentData : getDummyTherapistAssignments(visitId));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOPD, visitFilter, visitId]);

  async function loadTherapistSchedule() {
    if (!selectedTherapistId || !scheduledDate) return;
    
    setLoadingSchedule(true);
    try {
      const { data: scheduleData } = await supabase
        .from("therapist_assignments")
        .select(`
          *,
          patient:opd_no(uhid(full_name)),
          patient_ipd:ipd_no(uhid(full_name))
        `)
        .eq("therapist_id", selectedTherapistId)
        .eq("scheduled_date", scheduledDate)
        .order("scheduled_time", { ascending: true });
      
      setTherapistSchedule(scheduleData || []);
    } finally {
      setLoadingSchedule(false);
    }
  }

  async function handleCreateAssignment() {
    if (!selectedProcedureId || !selectedTherapistId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        procedure_entry_id: Number(selectedProcedureId),
        therapist_id: selectedTherapistId,
        doctor_id: doctorId || null,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        notes: notes || null,
        status: "pending",
      };
      payload[visitFilter.column] = visitFilter.value;

      const { error } = await supabase.from("therapist_assignments").insert(payload);
      if (!error) {
        // Refresh list
        const { data: assignmentData } = await supabase
          .from("therapist_assignments")
          .select("*")
          .eq(visitFilter.column, visitFilter.value)
          .order("created_at", { ascending: false });
        setAssignments(assignmentData ?? []);

        // Reset fields
        setSelectedProcedureId("");
        setSelectedTherapistId("");
        setScheduledDate("");
        setScheduledTime("");
        setNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function markCompleted(id: number) {
    const { error } = await supabase
      .from("therapist_assignments")
      .update({ status: "completed" })
      .eq("id", id);
    if (!error) {
      const { data: assignmentData } = await supabase
        .from("therapist_assignments")
        .select("*")
        .eq(visitFilter.column, visitFilter.value)
        .order("created_at", { ascending: false });
      setAssignments(assignmentData ?? []);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Request Therapist</CardTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Procedure</Label>
                  <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select procedure" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.length === 0 ? (
                        <SelectItem value="no-procedures" disabled>
                          No procedures found
                        </SelectItem>
                      ) : (
                        procedures.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.procedure_name ?? "Procedure"}{p.start_date ? ` • ${p.start_date}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Therapist</Label>
                  <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.length === 0 ? (
                        <SelectItem value="no-therapists" disabled>
                          No therapists found
                        </SelectItem>
                      ) : (
                        therapists.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.full_name ?? t.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                    placeholder="e.g. 6:00–6:15 am"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Notes for therapist"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleCreateAssignment} disabled={submitting || !selectedProcedureId || !selectedTherapistId}>
                  {submitting ? "Saving..." : "Create Assignment"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    loadTherapistSchedule();
                    setShowScheduleDialog(true);
                  }}
                  disabled={!selectedTherapistId || !scheduledDate}
                >
                  Show Schedule
                </Button>
              </div>

              <hr className="my-4" />

              <div className="space-y-2">
                <h3 className="font-semibold">Existing Assignments</h3>
                {assignments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No assignments yet.</div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div key={a.id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-sm">
                          <div>
                            <span className="font-medium">Therapist:</span> {a.therapist_id}
                          </div>
                          <div>
                            <span className="font-medium">Procedure Entry:</span> #{a.procedure_entry_id}
                          </div>
                          <div>
                            <span className="font-medium">Scheduled Date:</span> {a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString() : "—"}
                          </div>
                          <div>
                            <span className="font-medium">Scheduled Time:</span> {a.scheduled_time ?? "—"}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {a.status}
                          </div>
                          {a.notes && (
                            <div className="mt-1">
                              <span className="font-medium">Notes:</span> {a.notes}
                            </div>
                          )}
                        </div>
                        {a.status === "pending" && (
                          <Button variant="outline" onClick={() => markCompleted(a.id)}>Mark Completed</Button>
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

      {/* Therapist Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Therapist Schedule - {scheduledDate ? new Date(scheduledDate).toLocaleDateString() : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingSchedule ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading schedule...</p>
              </div>
            ) : therapistSchedule.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No appointments scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {therapistSchedule.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">
                        {appointment.scheduled_time || 'No time specified'}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Patient: {appointment.patient?.full_name || appointment.patient_ipd?.full_name || 'Unknown'}</div>
                      <div>Procedure: #{appointment.procedure_entry_id}</div>
                      {appointment.notes && (
                        <div className="mt-1 text-xs">Notes: {appointment.notes}</div>
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