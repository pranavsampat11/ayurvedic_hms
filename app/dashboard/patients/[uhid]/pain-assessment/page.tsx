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
  ipd_no: string;
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

  // Auto-fetch patient data on component mount
  useEffect(() => {
    const loadPatientData = async () => {
      if (!uhid) return;
      
      try {
        setLoading(true);
        
        // Use IPD admission data instead of OPD visit
        const { data: ipdAdmission, error: ipdError } = await supabase
          .from("ipd_admissions")
          .select("*, patient:uhid(full_name, age, gender, mobile, address), doctor:doctor_id(full_name)")
          .eq("ipd_no", uhid)
          .single();

        if (ipdError || !ipdAdmission) {
          console.error("Error loading IPD admission:", ipdError);
          return;
        }

        // Check if pain assessment already exists
        const { data: existingData, error: existingError } = await supabase
          .from("pain_assessments")
          .select("*")
          .eq("ipd_no", uhid)
          .single();

        if (existingData && !existingError) {
          setExistingAssessment(existingData);
          setEditing(true);
          // Pre-fill form with existing data
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
          // Update form with fetched data (new assessment)
          setForm(prev => ({
            ...prev,
            patientName: ipdAdmission.patient?.full_name || "",
            uhid: ipdAdmission.uhid || "",
            age: ipdAdmission.patient?.age?.toString() || "",
            sex: ipdAdmission.patient?.gender || "",
            opipNo: ipdAdmission.ipd_no || "",
          }));
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
      const assessmentData = {
        ipd_no: uhid,
        location: form.location,
        intensity: form.intensity,
        character: form.character,
        frequency: form.frequency,
        duration: form.duration,
        radiation: form.radiation,
        triggers: form.triggers,
        current_management: form.current_management,
      };

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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                name="patientName" 
                placeholder="Patient Name" 
                value={form.patientName} 
                onChange={handleChange} 
                required 
                disabled
                className="bg-gray-50"
              />
              <Input 
                name="uhid" 
                placeholder="UHID No" 
                value={form.uhid} 
                onChange={handleChange} 
                required 
                disabled
                className="bg-gray-50"
              />
              <Input 
                name="age" 
                placeholder="Age" 
                value={form.age} 
                onChange={handleChange} 
                required 
                disabled
                className="bg-gray-50"
              />
              <Input 
                name="diagnosis" 
                placeholder="Diagnosis" 
                value={form.diagnosis} 
                onChange={handleChange} 
                required 
              />
              <Input 
                name="sex" 
                placeholder="Sex" 
                value={form.sex} 
                onChange={handleChange} 
                required 
                disabled
                className="bg-gray-50"
              />
              <Input 
                name="opipNo" 
                placeholder="OP/IP No" 
                value={form.opipNo} 
                onChange={handleChange} 
                required 
                disabled
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
              />
              <Textarea 
                name="intensity" 
                placeholder="Intensity" 
                value={form.intensity} 
                onChange={handleChange} 
                required
              />
              <Textarea 
                name="character" 
                placeholder="Character" 
                value={form.character} 
                onChange={handleChange} 
                required
              />
              <Textarea 
                name="frequency" 
                placeholder="Frequency" 
                value={form.frequency} 
                onChange={handleChange} 
                required
              />
              <Textarea 
                name="duration" 
                placeholder="Duration" 
                value={form.duration} 
                onChange={handleChange} 
                required
              />
              <Textarea 
                name="radiation" 
                placeholder="Referral or Radiating pain" 
                value={form.radiation} 
                onChange={handleChange} 
                required
              />
              <Textarea 
                name="triggers" 
                placeholder="Alleviating & aggravating factor" 
                value={form.triggers} 
                onChange={handleChange} 
                required
              />
              <Textarea 
                name="current_management" 
                placeholder="Present Pain Management Regimen & effectiveness" 
                value={form.current_management} 
                onChange={handleChange} 
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Pain Assessment" : "Save Pain Assessment"}
              </Button>
              <Button type="button" onClick={handlePrint} className="flex-1">Print Pain Assessment</Button>
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