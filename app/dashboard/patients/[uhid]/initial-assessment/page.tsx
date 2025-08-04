"use client";
import { useEffect, useState } from "react";
import React from "react";
import CaseSheetForm from "@/components/case-sheet-form";
import IpdCaseSheetForm from "@/components/ipd-case-sheet-form";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

export default function InitialAssessmentPage({ params }: { params: any }) {
  const paramsObj = React.use(params) as { uhid: string };
  const patientId = paramsObj.uhid; // This could be OPD No or IPD No
  const [patient, setPatient] = useState<any>(null);
  const [caseSheet, setCaseSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isIpd, setIsIpd] = useState(false);

  useEffect(() => {
    async function fetchPatientAndCaseSheet() {
      setLoading(true);
      
      // First try to find as OPD visit
      const { data: opdVisit, error: opdError } = await supabase
        .from("opd_visits")
        .select("*, patient:uhid(full_name, age, gender, mobile, address), appointment:appointment_id(doctor_id, doctor:doctor_id(full_name))")
        .eq("opd_no", patientId)
        .single();
      
      if (opdVisit) {
        // This is an OPD patient
        setIsIpd(false);
        setPatient({
          ...opdVisit.patient,
          uhid: opdVisit.uhid,
          opd_no: opdVisit.opd_no,
          doctor_id: opdVisit.appointment?.doctor_id,
          doctor_name: opdVisit.appointment?.doctor?.full_name
        });
        
        // Fetch OPD case sheet
        const { data: opdCaseSheet } = await supabase
          .from("opd_case_sheets")
          .select("*")
          .eq("opd_no", patientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        setCaseSheet(opdCaseSheet || null);
      } else {
        // Try to find as IPD admission
        const { data: ipdAdmission, error: ipdError } = await supabase
          .from("ipd_admissions")
          .select("*, patient:uhid(full_name, age, gender, mobile, address), doctor:doctor_id(full_name)")
          .eq("ipd_no", patientId)
          .single();
        
        if (ipdAdmission) {
          // This is an IPD patient
          setIsIpd(true);
          setPatient({
            ...ipdAdmission.patient,
            uhid: ipdAdmission.uhid,
            ipd_no: ipdAdmission.ipd_no,
            opd_no: ipdAdmission.opd_no,
            doctor_id: ipdAdmission.doctor_id,
            doctor_name: ipdAdmission.doctor?.full_name,
            ward: ipdAdmission.ward,
            bed_number: ipdAdmission.bed_number,
            admission_date: ipdAdmission.admission_date,
            admission_reason: ipdAdmission.admission_reason
          });
          
          // Fetch IPD case sheet
          const { data: ipdCaseSheet } = await supabase
            .from("ipd_case_sheets")
            .select("*")
            .eq("ipd_no", patientId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          setCaseSheet(ipdCaseSheet || null);
        } else {
          // Neither OPD nor IPD found
          setPatient(null);
        }
      }
      
      setLoading(false);
    }
    
    fetchPatientAndCaseSheet();
  }, [patientId]);

  const handleSave = () => {
    toast({ 
      title: "Case Sheet Saved", 
      description: `${isIpd ? 'IPD' : 'OPD'} initial assessment saved successfully.` 
    });
  };

  if (loading) return <div>Loading...</div>;
  if (!patient) return <div className="text-center text-muted-foreground mt-8">Patient not found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {isIpd ? (
        <IpdCaseSheetForm
          initialCaseSheet={caseSheet || undefined}
          patientUhId={patient.uhid}
          doctorId={patient.doctor_id}
          doctorName={patient.doctor_name}
          patientName={patient.full_name}
          ipdNo={patient.ipd_no}
          opdNo={patient.opd_no}
          age={patient.age}
          gender={patient.gender}
          contact={patient.mobile}
          address={patient.address}
          ward={patient.ward}
          bedNo={patient.bed_number}
          admissionDate={patient.admission_date}
          admissionReason={patient.admission_reason}
          onSave={handleSave}
        />
      ) : (
        <CaseSheetForm
          initialCaseSheet={caseSheet || undefined}
          patientUhId={patient.uhid}
          doctorId={patient.doctor_id}
          doctorName={patient.doctor_name}
          patientName={patient.full_name}
          opNo={patient.opd_no}
          age={patient.age}
          gender={patient.gender}
          contact={patient.mobile}
          address={patient.address}
          onSave={handleSave}
        />
      )}
    </div>
  );
} 