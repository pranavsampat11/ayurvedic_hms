"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface PainAssessment {
  id: number;
  opd_no?: string;
  ipd_no?: string;
  location: string;
  intensity: string;
  character: string;
  frequency: string;
  duration: string;
  radiation: string;
  triggers: string;
  current_management: string;
  created_at: string;
}

export default function PainAssessmentPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [form, setForm] = useState({
    patientName: "",
    uhid: "",
    age: "",
    diagnosis: "",
    sex: "",
    opipNo: "",
    location: "",
    intensity: "",
    character: "",
    frequency: "",
    duration: "",
    radiation: "",
    triggers: "",
    current_management: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [existingAssessment, setExistingAssessment] = useState<PainAssessment | null>(null);
  const [showOpdVisitMessage, setShowOpdVisitMessage] = useState(false);

  // Auto-fetch patient data on component mount
  useEffect(() => {
    const loadPatientData = async () => {
      if (!uhid) return;
      
      console.log("Loading patient data for UHID:", uhid);
      
      try {
        setLoading(true);
        
        // First try to find IPD admission
        const { data: ipdAdmission, error: ipdError } = await supabase
          .from("ipd_admissions")
          .select("*, patient:uhid(full_name, age, gender, mobile, address), doctor:doctor_id(full_name)")
          .eq("ipd_no", uhid)
          .single();

        console.log("IPD Admission result:", ipdAdmission, "Error:", ipdError);

        if (ipdAdmission && !ipdError) {
          // This is an IPD patient
          const { data: existingData, error: existingError } = await supabase
            .from("pain_assessments")
            .select("*")
            .eq("ipd_no", uhid)
            .single();

          if (existingData && !existingError) {
            setExistingAssessment(existingData);
            setEditing(true);
            setForm(prev => ({
              ...prev,
              patientName: ipdAdmission.patient?.full_name || "",
              uhid: ipdAdmission.uhid || "",
              age: ipdAdmission.patient?.age?.toString() || "",
              sex: ipdAdmission.patient?.gender || "",
              opipNo: ipdAdmission.ipd_no || "",
              location: existingData.location || "",
              intensity: existingData.intensity || "",
              character: existingData.character || "",
              frequency: existingData.frequency || "",
              duration: existingData.duration || "",
              radiation: existingData.radiation || "",
              triggers: existingData.triggers || "",
              current_management: existingData.current_management || "",
            }));
          } else {
            // Auto-seed pain assessment data if none exists
            if (!existingData || existingError) {
              try {
                const { getDummyPainAssessments } = await import('@/lib/dummy');
                const dummyPainAssessment = getDummyPainAssessments(ipdAdmission.ipd_no, ipdAdmission.admission_date)[0];
                
                if (dummyPainAssessment) {
                  // Insert the dummy pain assessment
                  const { data: seededAssessment } = await supabase
                    .from("pain_assessments")
                    .insert({
                      ipd_no: ipdAdmission.ipd_no,
                      location: dummyPainAssessment.pain_location,
                      intensity: dummyPainAssessment.pain_intensity,
                      character: dummyPainAssessment.pain_quality,
                      frequency: dummyPainAssessment.pain_duration,
                      duration: dummyPainAssessment.pain_duration,
                      radiation: dummyPainAssessment.aggravating_factors,
                      triggers: dummyPainAssessment.aggravating_factors,
                      current_management: dummyPainAssessment.treatment_effectiveness,
                      created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                  
                  if (seededAssessment) {
                    setExistingAssessment(seededAssessment);
                    setEditing(true);
                    setForm(prev => ({
                      ...prev,
                      patientName: ipdAdmission.patient?.full_name || "",
                      uhid: ipdAdmission.uhid || "",
                      age: ipdAdmission.patient?.age?.toString() || "",
                      sex: ipdAdmission.patient?.gender || "",
                      opipNo: ipdAdmission.ipd_no || "",
                      location: seededAssessment.location || "",
                      intensity: seededAssessment.intensity || "",
                      character: seededAssessment.character || "",
                      frequency: seededAssessment.frequency || "",
                      duration: seededAssessment.duration || "",
                      radiation: seededAssessment.radiation || "",
                      triggers: seededAssessment.triggers || "",
                      current_management: seededAssessment.current_management || "",
                    }));
                    console.log("Auto-seeded pain assessment for IPD patient");
                    return;
                  }
                }
              } catch (seedError) {
                console.error("Error seeding pain assessment:", seedError);
              }
            }
            
            setForm(prev => ({
              ...prev,
              patientName: ipdAdmission.patient?.full_name || "",
              uhid: ipdAdmission.uhid || "",
              age: ipdAdmission.patient?.age?.toString() || "",
              sex: ipdAdmission.patient?.gender || "",
              opipNo: ipdAdmission.ipd_no || "",
            }));
          }
        } else {
          // Try to find OPD visit - the uhid parameter is actually the OPD number
          const { data: opdVisit, error: opdError } = await supabase
            .from("opd_visits")
            .select("*, patient:uhid(full_name, age, gender, mobile, address)")
            .eq("opd_no", uhid)
            .single();

          console.log("OPD Visit result:", opdVisit, "Error:", opdError);

          if (opdVisit && !opdError) {
            // This is an OPD patient
            const { data: existingData, error: existingError } = await supabase
              .from("pain_assessments")
              .select("*")
              .eq("opd_no", uhid)
              .single();

            if (existingData && !existingError) {
              setExistingAssessment(existingData);
              setEditing(true);
              setForm(prev => ({
                ...prev,
                patientName: opdVisit.patient?.full_name || "",
                uhid: opdVisit.uhid || "",
                age: opdVisit.patient?.age?.toString() || "",
                sex: opdVisit.patient?.gender || "",
                opipNo: opdVisit.opd_no || "",
                location: existingData.location || "",
                intensity: existingData.intensity || "",
                character: existingData.character || "",
                frequency: existingData.frequency || "",
                duration: existingData.duration || "",
                radiation: existingData.radiation || "",
                triggers: existingData.triggers || "",
                current_management: existingData.current_management || "",
              }));
            } else {
              // Auto-seed pain assessment data if none exists for OPD patient
              try {
                const { getDummyPainAssessments } = await import('@/lib/dummy');
                const dummyPainAssessment = getDummyPainAssessments(opdVisit.opd_no, opdVisit.visit_date)[0];
                
                if (dummyPainAssessment) {
                  // Insert the dummy pain assessment
                  const { data: seededAssessment } = await supabase
                    .from("pain_assessments")
                    .insert({
                      opd_no: opdVisit.opd_no,
                      location: dummyPainAssessment.pain_location,
                      intensity: dummyPainAssessment.pain_intensity,
                      character: dummyPainAssessment.pain_quality,
                      frequency: dummyPainAssessment.pain_duration,
                      duration: dummyPainAssessment.pain_duration,
                      radiation: dummyPainAssessment.aggravating_factors,
                      triggers: dummyPainAssessment.aggravating_factors,
                      current_management: dummyPainAssessment.treatment_effectiveness,
                      created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                  
                  if (seededAssessment) {
                    setExistingAssessment(seededAssessment);
                    setEditing(true);
                    setForm(prev => ({
                      ...prev,
                      patientName: opdVisit.patient?.full_name || "",
                      uhid: opdVisit.uhid || "",
                      age: opdVisit.patient?.age?.toString() || "",
                      sex: opdVisit.patient?.gender || "",
                      opipNo: opdVisit.opd_no || "",
                      location: seededAssessment.location || "",
                      intensity: seededAssessment.intensity || "",
                      character: seededAssessment.character || "",
                      frequency: seededAssessment.frequency || "",
                      duration: seededAssessment.duration || "",
                      radiation: seededAssessment.radiation || "",
                      triggers: seededAssessment.triggers || "",
                      current_management: seededAssessment.current_management || "",
                    }));
                    console.log("Auto-seeded pain assessment for OPD patient");
                    return;
                  }
                }
              } catch (seedError) {
                console.error("Error seeding pain assessment:", seedError);
              }
              
              const formData = {
                ...form,
                patientName: opdVisit.patient?.full_name || "",
                uhid: opdVisit.uhid || "",
                age: opdVisit.patient?.age?.toString() || "",
                sex: opdVisit.patient?.gender || "",
                opipNo: opdVisit.opd_no || "",
              };
              console.log("Setting form data for OPD patient:", formData);
              setForm(formData);
            }
          } else {
            // If neither IPD nor OPD found, try to get patient data directly
            console.log("No IPD or OPD record found, trying direct patient lookup");
            
            // For OPD patients, the UHID parameter might be the OPD number
            // Let's try to extract the patient UHID from the OPD number format
            let patientUhId = uhid;
            
            // If it's an OPD number format (OPD-YYYYMMDD-XXXX), try to find the patient
            if (uhid.startsWith('OPD-')) {
              // Try to find the OPD visit to get the patient UHID
              const { data: opdVisitForPatient, error: opdErrorForPatient } = await supabase
                .from("opd_visits")
                .select("uhid")
                .eq("opd_no", uhid)
                .single();
              
              if (opdVisitForPatient && !opdErrorForPatient) {
                patientUhId = opdVisitForPatient.uhid;
                console.log("Found patient UHID from OPD visit:", patientUhId);
              }
            }
            
            const { data: patientData, error: patientError } = await supabase
              .from("patients")
              .select("*")
              .eq("uhid", patientUhId)
              .single();

            console.log("Direct patient lookup result:", patientData, "Error:", patientError);

            if (patientData && !patientError) {
              const formData = {
                ...form,
                patientName: patientData.full_name || "",
                uhid: patientData.uhid || "",
                age: patientData.age?.toString() || "",
                sex: patientData.gender || "",
                opipNo: uhid, // Use the original parameter as OPD number
              };
              console.log("Setting form data from direct patient lookup:", formData);
              setForm(formData);
                      } else {
            console.error("No patient data found for:", uhid);
            
            // If this is an OPD number but no OPD visit exists, we might need to create it
            if (uhid.startsWith('OPD-')) {
              console.log("OPD visit not found, showing error message");
              setShowOpdVisitMessage(true);
            } else {
              toast({ 
                title: "Error", 
                description: "Patient data not found. Please check if the patient exists.", 
                variant: "destructive" 
              });
            }
          }
          }
        }

      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [uhid]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Determine if this is an OPD or IPD patient based on the opipNo format
      const isOPD = form.opipNo && form.opipNo.startsWith('OPD-');
      const isIPD = form.opipNo && form.opipNo.startsWith('IPD-');
      
      const assessmentData: any = {
        location: form.location,
        intensity: form.intensity,
        character: form.character,
        frequency: form.frequency,
        duration: form.duration,
        radiation: form.radiation,
        triggers: form.triggers,
        current_management: form.current_management,
      };

      // Add the appropriate reference based on patient type
      if (isOPD) {
        assessmentData.opd_no = form.opipNo;
        assessmentData.ipd_no = null;
      } else if (isIPD) {
        assessmentData.ipd_no = form.opipNo;
        assessmentData.opd_no = null;
      } else {
        // Fallback: try to determine from the uhid parameter
        if (uhid.startsWith('OPD-')) {
          assessmentData.opd_no = uhid;
          assessmentData.ipd_no = null;
        } else if (uhid.startsWith('IPD-')) {
          assessmentData.ipd_no = uhid;
          assessmentData.opd_no = null;
        } else {
          throw new Error("Unable to determine if patient is OPD or IPD");
        }
      }

      if (editing && existingAssessment) {
        // Update existing assessment
        const { error } = await supabase
          .from("pain_assessments")
          .update(assessmentData)
          .eq("id", existingAssessment.id);

        if (error) throw error;
        toast({ title: "Success", description: "Pain assessment updated successfully" });
      } else {
        // Create new assessment
        const { error } = await supabase
          .from("pain_assessments")
          .insert(assessmentData);

        if (error) throw error;
        toast({ title: "Success", description: "Pain assessment saved successfully" });
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error saving pain assessment:", error);
      toast({ title: "Error", description: "Failed to save pain assessment", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pain Assessment Sheet - ${form.patientName}</title>
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
                margin-bottom: 25px; 
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
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
                font-size: 14pt;
                font-weight: bold;
                margin: 0 0 5px 0;
                color: #000;
              }
              .title h2 {
                font-size: 16pt;
                font-weight: bold;
                margin: 0;
                color: #000;
                text-decoration: underline;
              }
              .patient-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
              }
              .patient-info .column {
                display: flex;
                flex-direction: column;
                gap: 15px;
              }
              .patient-info .field {
                display: flex;
                align-items: baseline;
              }
              .patient-info b {
                font-weight: bold;
                margin-right: 10px;
                min-width: 80px;
              }
              .patient-info .underline {
                flex: 1;
                border-bottom: 1px solid #000;
                padding-bottom: 3px;
                min-height: 20px;
              }
              .assessment-title {
                font-size: 16pt;
                font-weight: bold;
                text-align: center;
                margin-bottom: 20px;
                text-decoration: underline;
              }
              .assessment-table {
                width: 100%;
                border-collapse: collapse;
                border: 2px solid #000;
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
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10pt;
              }
              @media print {
                body { margin: 0; }
                .container { max-width: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="/my-logo.png" alt="Logo" class="logo" />
                <div class="title">
                  <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE, RAICHUR</h1>
                  <h2>PAIN ASSESSMENT SHEET</h2>
                </div>
              </div>
              
              <div class="patient-info">
                <div class="column">
                  <div class="field">
                    <b>Patient Name:</b>
                    <div class="underline">${form.patientName}</div>
                  </div>
                  <div class="field">
                    <b>Age:</b>
                    <div class="underline">${form.age}</div>
                  </div>
                  <div class="field">
                    <b>Gender:</b>
                    <div class="underline">${form.sex}</div>
                  </div>
                </div>
                <div class="column">
                  <div class="field">
                    <b>UHID No:</b>
                    <div class="underline">${form.uhid}</div>
                  </div>
                  <div class="field">
                    <b>Diagnosis:</b>
                    <div class="underline">${form.diagnosis}</div>
                  </div>
                  <div class="field">
                    <b>OP/IP No:</b>
                    <div class="underline">${form.opipNo}</div>
                  </div>
                </div>
              </div>
              
              <div class="assessment-title">INITIAL PAIN ASSESSMENT</div>
              
              <table class="assessment-table">
                <tr>
                  <td>Pain Location</td>
                  <td>${form.location}</td>
                </tr>
                <tr>
                  <td>Intensity</td>
                  <td>${form.intensity}</td>
                </tr>
                <tr>
                  <td>Character</td>
                  <td>${form.character}</td>
                </tr>
                <tr>
                  <td>Frequency</td>
                  <td>${form.frequency}</td>
                </tr>
                <tr>
                  <td>Duration</td>
                  <td>${form.duration}</td>
                </tr>
                <tr>
                  <td>Referral or Radiating pain</td>
                  <td>${form.radiation}</td>
                </tr>
                <tr>
                  <td>Alleviating & aggravating factor</td>
                  <td>${form.triggers}</td>
                </tr>
                <tr>
                  <td>Present Pain Management Regimen & effectiveness</td>
                  <td>${form.current_management}</td>
                </tr>
              </table>
              
              <div class="footer">
                <div>Date: ${new Date().toLocaleDateString()}</div>
                <div><b>Doctor Name, Signature with date & Time</b></div>
              </div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading patient data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-base md:text-lg">
            POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE, RAICHUR
            <br />
            <span className="text-lg font-bold block mt-2">PAIN ASSESSMENT SHEET</span>
            {editing && (
              <div className="text-sm text-blue-600 mt-2">
                Editing existing pain assessment
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showOpdVisitMessage && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    OPD Visit Not Found
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      The OPD visit <strong>{uhid}</strong> does not exist in the database. 
                      This usually means the patient hasn't been registered for an OPD visit yet.
                    </p>
                    <p className="mt-2">
                      To create a pain assessment, you need to:
                    </p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Go to the Receptionist Dashboard</li>
                      <li>Use "Start Visit" to create an OPD visit for the patient</li>
                      <li>Then return to this pain assessment page</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                name="patientName" 
                placeholder="Patient Name" 
                value={form.patientName} 
                onChange={handleChange} 
                required 
                disabled={showOpdVisitMessage}
                className="bg-gray-50"
              />
              <Input 
                name="uhid" 
                placeholder="UHID No" 
                value={form.uhid} 
                onChange={handleChange} 
                required 
                disabled={showOpdVisitMessage}
                className="bg-gray-50"
              />
              <Input 
                name="age" 
                placeholder="Age" 
                value={form.age} 
                onChange={handleChange} 
                required 
                disabled={showOpdVisitMessage}
                className="bg-gray-50"
              />
              <Input 
                name="diagnosis" 
                placeholder="Diagnosis" 
                value={form.diagnosis} 
                onChange={handleChange} 
                required 
                disabled={showOpdVisitMessage}
              />
              <Input 
                name="sex" 
                placeholder="Sex" 
                value={form.sex} 
                onChange={handleChange} 
                required 
                disabled={showOpdVisitMessage}
                className="bg-gray-50"
              />
              <Input 
                name="opipNo" 
                placeholder="OP/IP No" 
                value={form.opipNo} 
                onChange={handleChange} 
                required 
                disabled={showOpdVisitMessage}
                className="bg-gray-50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea 
                name="location" 
                placeholder="Pain Location" 
                value={form.location} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="intensity" 
                placeholder="Intensity" 
                value={form.intensity} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="character" 
                placeholder="Character" 
                value={form.character} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="frequency" 
                placeholder="Frequency" 
                value={form.frequency} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="duration" 
                placeholder="Duration" 
                value={form.duration} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="radiation" 
                placeholder="Referral or Radiating pain" 
                value={form.radiation} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="triggers" 
                placeholder="Alleviating & aggravating factor" 
                value={form.triggers} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
              <Textarea 
                name="current_management" 
                placeholder="Present Pain Management Regimen & effectiveness" 
                value={form.current_management} 
                onChange={handleChange} 
                required
                disabled={showOpdVisitMessage}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={saving || showOpdVisitMessage}>
                {saving ? "Saving..." : editing ? "Update Pain Assessment" : "Save Pain Assessment"}
              </Button>
              <Button type="button" onClick={handlePrint} className="flex-1" disabled={showOpdVisitMessage}>Print Pain Assessment</Button>
            </div>
            {submitted && !editing && (
              <div className="text-green-600 text-center mt-2">
                Pain assessment saved successfully!
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 