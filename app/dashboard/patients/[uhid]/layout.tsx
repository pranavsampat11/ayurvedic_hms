"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabaseClient";

interface PatientLayoutProps extends PropsWithChildren {
  params: { uhid: string };
}

export default function PatientLayout({ children, params }: PatientLayoutProps) {
  const { uhid } = React.use(params) as { uhid: string };
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patientType, setPatientType] = useState<string | null>(null);

  useEffect(() => {
    async function fetchType() {
      const { data } = await supabase.from("patients").select("uhid").eq("uhid", uhid).single();
      if (data) {
        // Check if patient has an IPD admission
        const { data: ipd } = await supabase.from("ipd_admissions").select("ipd_no").eq("uhid", uhid).maybeSingle();
        setPatientType(ipd ? "IPD" : "OPD");
      }
    }
    fetchType();
  }, [uhid]);

  const isOpdNo = typeof uhid === 'string' && uhid.startsWith('OPD-');
    const opdSections = [
     { label: "Initial Assessment", path: "initial-assessment" },
     { label: "OPD Follow Ups", path: "opd-follow-up" },
     { label: "Pain Assessment", path: "pain-assessment" },
     { label: "Medication Requests", path: "medication-requests" },
     { label: "Request Therapist", path: "request-therapist" },
     { label: "Request Investigation", path: "request-investigation" },
     { label: "Billing History", path: "billing-history" },
           { label: "Print OPD Case Sheet", path: "print-entire-case", isAction: true },
   ];
         const ipdSections = [
      { label: "Initial Assessment", path: "initial-assessment" },
      { label: "Daily Assessment", path: "daily-assessment" },
      { label: "Pain Assessment", path: "pain-assessment" },
      { label: "Pain Management and Monitoring", path: "pain-management" },
      { label: "BP and TPR Chart", path: "bp-tpr-chart" },
      { label: "Medication Chart", path: "medication-chart" },
      { label: "Diet Chart", path: "diet-chart" },
      { label: "Referred Doctors", path: "referred-doctors" },
      { label: "Nursing Round", path: "nursing-round" },
      { label: "Request Therapist", path: "request-therapist" },
      { label: "Request Investigation", path: "request-investigation" },
      { label: "Billing History", path: "billing-history" },
      { label: "Procedure Chart", path: "procedure-chart" },
      { label: "Discharge Summary", path: "discharge-summary" },
      { label: "Final Bill", path: "final-bill" },
      { label: "Print IPD Case Sheet", path: "print-entire-case", isAction: true },
    ];
  const sections = isOpdNo ? opdSections : ipdSections;

  // Role-aware view-only logic for nurses
  const [userRole, setUserRole] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole'));
    }
  }, []);

  // Sections nurses can edit
  const nurseEditable = new Set([
    'bp-tpr-chart',
    'diet-chart',
    'medication-chart',
    'nursing-round',
    'procedure-chart',
    'pain-management'
  ]);

  // Determine current section slug from pathname
  const sectionSlug = React.useMemo(() => {
    try {
      const base = `/dashboard/patients/${uhid}/`;
      if (!pathname.startsWith(base)) return '';
      const slug = pathname.slice(base.length);
      return slug || '';
    } catch {
      return '';
    }
  }, [pathname, uhid]);

  const isNurseViewOnly = userRole === 'nurse' && sectionSlug && !nurseEditable.has(sectionSlug);


  const handlePrintEntireCase = async () => {
    try {
      console.log("Starting Print Entire Case for:", uhid);
      console.log("isOpdNo:", isOpdNo);
      
      // First, determine the actual patient UHID and fetch patient data
      let actualPatientUhid = uhid;
      let patientData = null;

      if (isOpdNo) {
        // If this is an OPD number, fetch the patient UHID from OPD visits
        console.log("Fetching patient UHID from OPD visit:", uhid);
        const { data: opdVisit, error: opdError } = await supabase
          .from("opd_visits")
          .select("uhid")
          .eq("opd_no", uhid)
          .single();
        
        if (opdError) {
          console.error("Error fetching OPD visit:", opdError);
        }
        
        if (opdVisit?.uhid) {
          actualPatientUhid = opdVisit.uhid;
          console.log("Found patient UHID from OPD:", actualPatientUhid);
        } else {
          console.log("No patient UHID found in OPD visit");
        }
      } else if (uhid.startsWith('IPD-')) {
        // If this is an IPD number, fetch the patient UHID from IPD admissions
        console.log("Fetching patient UHID from IPD admission:", uhid);
        const { data: ipdAdmission, error: ipdError } = await supabase
          .from("ipd_admissions")
          .select("uhid")
          .eq("ipd_no", uhid)
          .single();
        
        if (ipdError) {
          console.error("Error fetching IPD admission:", ipdError);
        }
        
        if (ipdAdmission?.uhid) {
          actualPatientUhid = ipdAdmission.uhid;
          console.log("Found patient UHID from IPD:", actualPatientUhid);
        } else {
          console.log("No patient UHID found in IPD admission");
        }
      }

      // Now fetch the patient data using the actual UHID
      console.log("Fetching patient data for UHID:", actualPatientUhid);
      const { data: patientDataResult, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("uhid", actualPatientUhid)
        .single();

      if (patientError) {
        console.error("Error fetching patient data:", patientError);
      }

      if (!patientDataResult) {
        alert(`Patient data not found for UHID: ${actualPatientUhid}`);
        return;
      }
      
      patientData = patientDataResult;
      console.log("Patient data loaded:", patientData.full_name);

      // Fetch initial assessment/case sheet with ALL data
      let caseSheetData = null;
      let procedures = [];
      let internalMedications = [];
      let selectedInvestigations = [];
      
      if (isOpdNo) {
        const { data: opdCase } = await supabase
          .from("opd_case_sheets")
          .select("*")
          .eq("opd_no", uhid)
          .single();
        caseSheetData = opdCase;
        
        // Fetch procedures for this OPD
        const { data: proceduresData } = await supabase
          .from("procedure_entries")
          .select("*")
          .eq("opd_no", uhid);
        procedures = proceduresData || [];
        
        // Fetch internal medications for this OPD
        const { data: medicationsData } = await supabase
          .from("internal_medications")
          .select("*")
          .eq("opd_no", uhid);
        internalMedications = medicationsData || [];
        
        // Fetch investigations (if any)
        if (caseSheetData?.investigations) {
          selectedInvestigations = caseSheetData.investigations.split(',').map(i => i.trim());
        }
      } else if (uhid.startsWith('IPD-')) {
        const { data: ipdCase } = await supabase
          .from("ipd_case_sheets")
          .select("*")
          .eq("ipd_no", uhid)
          .single();
        caseSheetData = ipdCase;
      } else {
        // This is a direct patient UHID, try both OPD and IPD case sheets
        // For OPD case sheets, we need to find the OPD number first
        const { data: opdVisits } = await supabase
          .from("opd_visits")
          .select("opd_no")
          .eq("uhid", actualPatientUhid)
          .order("visit_date", { ascending: false });
        
        let opdCase = null;
        if (opdVisits && opdVisits.length > 0) {
          const { data: opdCaseData } = await supabase
            .from("opd_case_sheets")
            .select("*")
            .eq("opd_no", opdVisits[0].opd_no)
            .maybeSingle();
          opdCase = opdCaseData;
          
          // Fetch procedures and medications for this OPD
          const { data: proceduresData } = await supabase
            .from("procedure_entries")
            .select("*")
            .eq("opd_no", opdVisits[0].opd_no);
          procedures = proceduresData || [];
          
          const { data: medicationsData } = await supabase
            .from("internal_medications")
            .select("*")
            .eq("opd_no", opdVisits[0].opd_no);
          internalMedications = medicationsData || [];
          
          if (opdCase?.investigations) {
            selectedInvestigations = opdCase.investigations.split(',').map(i => i.trim());
          }
        }
        
        const { data: ipdCase } = await supabase
          .from("ipd_case_sheets")
          .select("*")
          .eq("uhid", actualPatientUhid)
          .maybeSingle();
        
        caseSheetData = opdCase || ipdCase;
      }

      // Fetch OPD follow-ups with procedures and medications
      let followUps = [];
      let opdNo = null;
      
      if (isOpdNo) {
        opdNo = uhid;
      } else if (caseSheetData?.opd_no) {
        opdNo = caseSheetData.opd_no;
      } else if (!uhid.startsWith('IPD-')) {
        // Try to find OPD visits for this patient
        const { data: opdVisits } = await supabase
          .from("opd_visits")
          .select("opd_no")
          .eq("uhid", actualPatientUhid)
          .order("visit_date", { ascending: false });
        
        if (opdVisits && opdVisits.length > 0) {
          opdNo = opdVisits[0].opd_no; // Use the most recent OPD visit
        }
      }
      
      if (opdNo) {
        const { data: followUpsData } = await supabase
          .from("opd_follow_up_sheets")
          .select("*")
          .eq("opd_no", opdNo)
          .order("date", { ascending: true });

        // Load procedures and medications for each follow-up
        followUps = await Promise.all(
          (followUpsData || []).map(async (item) => {
            // Load procedures for this follow-up date
            const { data: proceduresData } = await supabase
              .from("procedure_entries")
              .select("*")
              .eq("opd_no", opdNo)
              .eq("start_date", item.date);

            // Load medications for this follow-up date
            const { data: medicationsData } = await supabase
              .from("internal_medications")
              .select("*")
              .eq("opd_no", opdNo)
              .eq("start_date", item.date);

            return {
              ...item,
              procedures: proceduresData || [],
              medications: medicationsData || []
            };
          })
        );
      }

      // Fetch pain assessments
      let painAssessments = [];
      if (isOpdNo) {
        const { data: painData } = await supabase
          .from("pain_assessments")
          .select("*")
          .eq("opd_no", uhid)
          .order("created_at", { ascending: true });
        painAssessments = painData || [];
      } else if (uhid.startsWith('IPD-')) {
        const { data: painData } = await supabase
          .from("pain_assessments")
          .select("*")
          .eq("ipd_no", uhid)
          .order("created_at", { ascending: true });
        painAssessments = painAssessments || [];
      } else {
        // This is a direct patient UHID, fetch all pain assessments
        const { data: painData } = await supabase
          .from("pain_assessments")
          .select("*")
          .or(`opd_no.eq.${actualPatientUhid},ipd_no.eq.${actualPatientUhid}`)
          .order("created_at", { ascending: true });
        painAssessments = painData || [];
      }

      // Generate the comprehensive print content with EXACT format from both pages
      const printContent = generateComprehensiveCaseContent(
        patientData,
        caseSheetData,
        followUps,
        painAssessments,
        procedures,
        internalMedications,
        selectedInvestigations,
        isOpdNo
      );

      // Open print window
      const printWindow = window.open("", "_blank", "width=900,height=1200");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
      }
    } catch (error) {
      console.error("Error generating comprehensive case:", error);
      alert("Error generating comprehensive case. Please try again.");
    }
  };

  const generateComprehensiveCaseContent = (
    patient: any,
    caseSheet: any,
    followUps: any[],
    painAssessments: any[],
    procedures: any[],
    internalMedications: any[],
    selectedInvestigations: string[],
    isOPD: boolean
  ) => {
    const logoUrl = window.location.origin + "/my-logo.png";
    
    return `
      <html>
        <head>
          <title>Complete Case Summary - ${patient.full_name}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              background: #fff; 
              color: #000; 
              margin: 0;
              padding: 20px;
              font-size: 12pt;
              line-height: 1.4;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              display: flex; 
              align-items: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              margin-right: 20px;
            }
            .title { 
              flex: 1; 
              text-align: center; 
            }
            .title h1 {
              font-size: 18pt;
              font-weight: bold;
              margin: 0 0 5px 0;
              color: #000;
            }
            .title h2 {
              font-size: 16pt;
              font-weight: bold;
              margin: 0;
              text-decoration: underline;
              color: #000;
            }
            .patient-info {
              display: flex;
              flex-wrap: wrap;
              gap: 40px;
              margin-bottom: 20px;
            }
            .patient-info div {
              display: flex;
              align-items: baseline;
            }
            .patient-info b {
              font-weight: bold;
              margin-right: 5px;
            }
            .patient-info .value {
              border-bottom: 1px solid #000;
              min-width: 150px;
              padding-bottom: 2px;
            }
            /* Pain Assessment specific styling */
            .patient-info .column {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            .patient-info .field {
              display: flex;
              align-items: baseline;
            }
            .patient-info .underline {
              flex: 1;
              border-bottom: 1px solid #000;
              padding-bottom: 3px;
              min-height: 20px;
            }
            .section { 
              margin-bottom: 15px; 
            }
            .section b { 
              font-weight: bold; 
              margin-bottom: 5px; 
              color: #000; 
              font-size: 12pt;
            }
            .section .value { 
              margin-left: 20px; 
              font-weight: normal; 
              white-space: pre-wrap; 
              word-break: break-word; 
              font-size: 12pt;
              border-bottom: 1px solid #ccc;
              padding-bottom: 2px;
              min-height: 20px;
            }
            .examination-section {
              margin-left: 20px;
            }
            .examination-section b {
              font-weight: bold;
              color: #000;
            }
            .examination-table {
              margin-left: 20px;
              margin-top: 5px;
            }
            .examination-table table {
              width: 100%;
              border-collapse: collapse;
            }
            .examination-table td {
              padding: 2px 10px;
              font-size: 12pt;
            }
            .examination-table b {
              font-weight: bold;
            }
            .examination-list {
              margin-left: 20px;
              margin-top: 5px;
            }
            .examination-list ul {
              margin: 5px 0;
              padding-left: 20px;
            }
            .examination-list li {
              margin-bottom: 3px;
              font-size: 12pt;
            }
            .examination-list b {
              font-weight: bold;
            }
            .pain-scale {
              margin-top: 10px;
              text-align: center;
            }
            .pain-scale img {
              max-width: 400px;
              height: auto;
            }
            .procedures-section, .medications-section {
              margin-left: 20px;
              margin-top: 5px;
            }
            .procedure-item, .medication-item {
              margin-bottom: 10px;
              padding: 8px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .procedure-item b, .medication-item b {
              font-weight: bold;
              color: #000;
            }
            .page-break {
              page-break-before: always;
            }
            .section-title {
              font-size: 16pt;
              font-weight: bold;
              margin: 20px 0 15px 0;
              color: #000;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
            .procedures-section, .medications-section {
              margin-left: 20px;
              margin-top: 5px;
            }
            .procedure-item, .medication-item {
              margin-bottom: 10px;
              padding: 8px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .procedure-item b, .medication-item b {
              font-weight: bold;
              color: #000;
            }
            .follow-up-item {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .follow-up-date {
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .pain-assessment-item {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background-color: #f0f8ff;
            }
            .assessment-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000;
              margin-top: 15px;
            }
            .assessment-table td {
              padding: 15px 10px;
              vertical-align: top;
              border: 1px solid #000;
              min-height: 100px;
            }
            .assessment-table td:first-child {
              font-weight: bold;
              width: 35%;
              background-color: #f8f8f8;
              vertical-align: middle;
              text-align: left;
            }
            .assessment-table td:last-child {
              width: 65%;
              min-height: 100px;
              white-space: pre-wrap;
              word-break: break-word;
            }
            hr { 
              margin: 20px 0; 
              border: none; 
              border-top: 1.5px solid #333; 
            }
            .footer { 
              margin-top: 40px; 
              display: flex; 
              justify-content: space-between; 
              border-top: 1px solid #333;
              padding-top: 20px;
              font-size: 12pt;
            }
            .page-number {
              text-align: right;
              margin-top: 20px;
              font-size: 10pt;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Page 1: Initial Assessment -->
            <div class="header">
              <img src="${logoUrl}" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2>${isOPD ? 'OPD' : 'IPD'} COMPLETE CASE SUMMARY</h2>
              </div>
            </div>
            
            <div class="patient-info">
              <div><b>Patient Name:</b><span class="value">${patient.full_name || ''}</span></div>
              <div><b>UHID No:</b><span class="value">${patient.uhid || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Age:</b><span class="value">${patient.age || ''} yrs</span></div>
              <div><b>Gender:</b><span class="value">${patient.gender || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Contact No:</b><span class="value">${patient.mobile || ''}</span></div>
              <div><b>Address:</b><span class="value">${patient.address || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Department:</b><span class="value">${patient.department || ''}</span></div>
              <div><b>${isOPD ? 'OPD' : 'IPD'} No:</b><span class="value">${caseSheet?.opd_no || caseSheet?.ipd_no || ''}</span></div>
            </div>
            
            <hr />
            
            ${caseSheet ? `
            <div class="section-title">INITIAL ASSESSMENT</div>
            <div class="section"><b>• Chief Complaints:</b><div class="value">${caseSheet.chief_complaints || caseSheet.present_complaints || ''}</div></div>
            <div class="section"><b>• Associated Complaints:</b><div class="value">${caseSheet.associated_complaints || ''}</div></div>
            <div class="section"><b>• Past History:</b><div class="value">${caseSheet.past_history || ''}</div></div>
            <div class="section"><b>• Personal History:</b><div class="value">${caseSheet.personal_history || ''}</div></div>
            <div class="section"><b>• Allergy History:</b><div class="value">${caseSheet.allergy_history || ''}</div></div>
            <div class="section"><b>• Family History:</b><div class="value">${caseSheet.family_history || ''}</div></div>
            <div class="section"><b>• Obs & Gyn History: (Applicable for female patients only)</b><div class="value">${caseSheet.obs_gyn_history || ''}</div></div>
            
            <div class="section">
              <b>• Examination:</b>
              <div class="examination-section">
                <div class="examination-table">
                  <b>• General Examination</b>
                  <table>
                    <tr>
                      <td><b>Ht:</b> ${caseSheet.height || ''}</td>
                      <td><b>Wt:</b> ${caseSheet.weight || ''}</td>
                      <td><b>BMI:</b> ${caseSheet.bmi || ''}</td>
                      <td><b>Pulse:</b> ${caseSheet.pulse || ''}</td>
                      <td><b>RR:</b> ${caseSheet.rr || ''}</td>
                      <td><b>BP:</b> ${caseSheet.bp || ''}</td>
                    </tr>
                  </table>
                </div>
                <div class="examination-list">
                  <b>• Systemic Examination</b>
                  <ul>
                    <li><b>Respiratory System:</b> ${caseSheet.respiratory_system || ''}</li>
                    <li><b>CVS:</b> ${caseSheet.cvs || ''}</li>
                    <li><b>CNS:</b> ${caseSheet.cns || ''}</li>
                  </ul>
                </div>
                <div class="examination-list">
                  <b>• Local Examination</b>
                  <div class="value">${caseSheet.local_examination || ''}</div>
                </div>
              </div>
            </div>
            
            <div class="section"><b>• Investigations (if any):</b><div class="value">${selectedInvestigations.join(", ") || ''}</div></div>
            
            <div class="section"><b>• Provisional Diagnosis/Final Diagnosis:</b><div class="value">${caseSheet.diagnosis || ''}</div></div>
            <div class="section">
              <b>• Screening for Nutritional Needs:</b>
              <div class="examination-section">
                <b>o Nutritional Status:</b> Normal/mild malnutrition/moderate malnutrition/severe malnutrition
                <div class="value">${caseSheet.nutritional_status || ''}</div>
              </div>
            </div>
            <div class="section"><b>• Treatment Plan/Care of Plan:</b><div class="value">${caseSheet.treatment_plan || ''}</div></div>
            <div class="section"><b>• Preventive aspects Pathya Apathys Nidana Pariyarjana, (if any):</b><div class="value">${caseSheet.preventive_aspects || ''}</div></div>
            <div class="section"><b>• Rehabilitation-Physiotherapy/Basayana Apunarbhay:</b><div class="value">${caseSheet.rehabilitation || ''}</div></div>
            <div class="section"><b>• Desired outcome:</b><div class="value">${caseSheet.desired_outcome || ''}</div></div>
            ` : '<div class="section"><b>• Initial Assessment:</b><div class="value">No initial assessment data available</div></div>'}
            
            ${procedures && procedures.length > 0 ? `
            <div class="section">
              <b>• Procedures:</b>
              <div class="procedures-section">
                ${procedures.map(proc => `
                  <div class="procedure-item">
                    <b>${proc.procedure?.procedure_name || proc.procedure_name || 'Unknown Procedure'}</b><br>
                    ${proc.medicine ? `${proc.medicine.product_name}<br>` : ''}
                    ${proc.requirement ? `${proc.requirement.product_name}<br>` : ''}
                    ${proc.quantity ? `Quantity: ${proc.quantity}<br>` : ''}
                    ${proc.start_date ? `Start Date: ${proc.start_date}<br>` : ''}
                    ${proc.end_date ? `End Date: ${proc.end_date}<br>` : ''}
                    ${proc.therapist ? `Therapist: ${proc.therapist}` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            ${internalMedications && internalMedications.length > 0 ? `
            <div class="section">
              <b>• Internal Medications:</b>
              <div class="medications-section">
                ${internalMedications.map(med => `
                  <div class="medication-item">
                    <b>${med.medication?.product_name || med.medication_name || 'Unknown Medication'}</b><br>
                    ${med.dosage ? `Dosage: ${med.dosage}<br>` : ''}
                    ${med.frequency ? `Frequency: ${med.frequency}<br>` : ''}
                    ${med.start_date ? `Start Date: ${med.start_date}<br>` : ''}
                    ${med.end_date ? `End Date: ${med.end_date}<br>` : ''}
                    ${med.notes ? `Notes: ${med.notes}` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            ${followUps && followUps.length > 0 ? `
            <div class="page-break"></div>
            <div class="section-title">OPD FOLLOW-UPS</div>
            ${followUps.map(followUp => `
              <div class="follow-up-item">
                <div class="follow-up-date">Date: ${new Date(followUp.date).toLocaleDateString()}</div>
                <div class="section"><b>Notes:</b><div class="value">${followUp.notes || 'No notes provided'}</div></div>
                ${followUp.procedures && followUp.procedures.length > 0 ? `
                  <div class="section"><b>Procedures:</b><div class="value">${followUp.procedures.map(p => p.procedure_name || p.name || 'Unknown procedure').join(', ')}</div></div>
                ` : ''}
                ${followUp.medications && followUp.medications.length > 0 ? `
                  <div class="section"><b>Medications:</b><div class="value">${followUp.medications.map(m => m.medication_name || m.name || 'Unknown medication').join(', ')}</div></div>
                ` : ''}
              </div>
            `).join('')}
            ` : ''}
            
            ${painAssessments && painAssessments.length > 0 ? `
            <div class="page-break"></div>
            
            <!-- Pain Assessment Header with Logo and Title -->
            <div class="header">
              <img src="${logoUrl}" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE, RAICHUR</h1>
                <h2>PAIN ASSESSMENT SHEET</h2>
              </div>
            </div>
            
            <!-- Patient Info for Pain Assessment -->
            <div class="patient-info">
              <div class="column">
                <div class="field">
                  <b>Patient Name:</b>
                  <div class="underline">${patient.full_name || ''}</div>
                </div>
                <div class="field">
                  <b>Age:</b>
                  <div class="underline">${patient.age || ''}</div>
                </div>
                <div class="field">
                  <b>Gender:</b>
                  <div class="underline">${patient.gender || ''}</div>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <b>UHID No:</b>
                  <div class="underline">${patient.uhid || ''}</div>
                </div>
                <div class="field">
                  <b>Diagnosis:</b>
                  <div class="underline">${caseSheet?.diagnosis || ''}</div>
                </div>
                <div class="field">
                  <b>OP/IP No:</b>
                  <div class="underline">${caseSheet?.opd_no || caseSheet?.ipd_no || ''}</div>
                </div>
              </div>
            </div>
            
            <div class="section-title">INITIAL PAIN ASSESSMENT</div>
            
            ${painAssessments.map(assessment => `
              <div class="pain-assessment-item">
                <div class="section"><b>Date:</b><div class="value">${new Date(assessment.created_at).toLocaleDateString()}</div></div>
                
                <table class="assessment-table">
                  <tr>
                    <td>Pain Location</td>
                    <td>${assessment.location || ''}</td>
                  </tr>
                  <tr>
                    <td>Intensity</td>
                    <td>${assessment.intensity || ''}</td>
                  </tr>
                  <tr>
                    <td>Character</td>
                    <td>${assessment.character || ''}</td>
                  </tr>
                  <tr>
                    <td>Frequency</td>
                    <td>${assessment.frequency || ''}</td>
                  </tr>
                  <tr>
                    <td>Duration</td>
                    <td>${assessment.duration || ''}</td>
                  </tr>
                  <tr>
                    <td>Referral or Radiating pain</td>
                    <td>${assessment.radiation || ''}</td>
                  </tr>
                  <tr>
                    <td>Alleviating & aggravating factor</td>
                    <td>${assessment.triggers || ''}</td>
                  </tr>
                  <tr>
                    <td>Present Pain Management Regimen & effectiveness</td>
                    <td>${assessment.current_management || ''}</td>
                  </tr>
                </table>
              </div>
            `).join('')}
            ` : ''}
            
            <div class="footer">
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div><b>Doctor Name, Signature with date & Time</b></div>
            </div>
            
            <div class="page-number">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
  };

  const SidebarContent = (
    <div className="flex flex-col p-4 gap-4 min-h-full">
      <Button
        variant="outline"
        className="mb-2 w-full font-semibold"
        onClick={() => { setSidebarOpen(false); router.push("/dashboard"); }}
      >
        ← Back to Dashboard
      </Button>
      <nav className="flex-1">
        <ul className="space-y-1">
          {sections.map((section) => {
            if (section.isAction) {
              return (
                <li key={section.path}>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-medium text-sm"
                    onClick={() => { setSidebarOpen(false); router.push(`/dashboard/patients/${uhid}/print-entire-case`); }}
                  >
                    🖨️ {section.label}
                  </Button>
                </li>
              );
            }
            
            const href = `/dashboard/patients/${uhid}/${section.path}`;
            const isActive = pathname === href;
            return (
              <li key={section.path}>
                <Link
                  href={href}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors text-sm
                    ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-primary"}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col md:flex-row">
      {/* Hamburger for mobile */}
      <div className="md:hidden flex items-center p-2 bg-white border-b shadow-sm sticky top-0 z-20">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Patient Navigation</SheetTitle>
            {SidebarContent}
          </SheetContent>
        </Sheet>
        <span className="ml-2 font-semibold text-lg">Patient Details</span>
      </div>
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r shadow-sm flex-col min-h-screen">
        {SidebarContent}
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-4 md:p-8 w-full max-w-full overflow-x-auto">
        {isNurseViewOnly && (
          <div className="mb-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-900 p-2 text-sm">
            View Only (Nurse): Editing is disabled for this section.
          </div>
        )}
        <div className={isNurseViewOnly ? 'pointer-events-none opacity-95' : ''}>
          {children}
        </div>
      </main>
    </div>
  );
} 