"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Edit, Plus, Trash2, Printer, Save, Calculator, Receipt } from "lucide-react";
import Link from "next/link";

interface DischargeSummary {
  id?: number;
  ipd_no: string;
  department: string;
  doctor_name: string;
  patient_name: string;
  age: string;
  sex: string;
  uhid_no: string;
  ip_no: string;
  ward_bed_no: string;
  date_of_admission: string;
  time_of_admission: string;
  date_of_discharge: string;
  time_of_discharge: string;
  complaints: string;
  history_brief: string;
  significant_findings: string;
  investigation_results: string;
  diagnosis: string;
  condition_at_discharge: string;
  course_in_hospital: string;
  procedures_performed: string;
  medications_administered: string;
  other_treatment: string;
  discharge_medications: string;
  other_instructions: string;
  follow_up_period: string;
  urgent_care_instructions: string;
  doctor_signature: string;
  patient_signature: string;
  summary_prepared_by: string;
  created_at?: string;
}

interface BillCharges {
  diet_charges_per_day: number;
  doctor_charges_per_day: number;
  nursing_charges_per_day: number;
  room_type: 'AC' | 'Non-AC';
}

interface BillCalculation {
  total_days: number;
  bed_charges: number;
  procedure_charges: number;
  diet_charges: number;
  doctor_charges: number;
  nursing_charges: number;
  total_amount: number;
}

export default function DischargeSummaryPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dischargeSummary, setDischargeSummary] = useState<DischargeSummary | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [billCharges, setBillCharges] = useState<BillCharges>({
    diet_charges_per_day: 0,
    doctor_charges_per_day: 0,
    nursing_charges_per_day: 0,
    room_type: 'Non-AC'
  });
  const [billCalculation, setBillCalculation] = useState<BillCalculation | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  
  const [form, setForm] = useState({
    department: "",
    doctor_name: "",
    patient_name: "",
    age: "",
    sex: "",
    uhid_no: "",
    ip_no: "",
    ward_bed_no: "",
    date_of_admission: "",
    time_of_admission: "",
    date_of_discharge: "",
    time_of_discharge: "",
    complaints: "",
    history_brief: "",
    significant_findings: "",
    investigation_results: "",
    diagnosis: "",
    condition_at_discharge: "",
    course_in_hospital: "",
    procedures_performed: "",
    medications_administered: "",
    other_treatment: "",
    discharge_medications: "",
    other_instructions: "",
    follow_up_period: "",
    urgent_care_instructions: "",
    doctor_signature: "",
    patient_signature: "",
    summary_prepared_by: "",
  });

  useEffect(() => {
    loadPatientData();
    loadProcedures();
    loadMedications();
    loadDischargeSummary();
  }, [uhid]);

  const loadPatientData = async () => {
    try {
      const { data: ipdAdmission, error } = await supabase
        .from("ipd_admissions")
        .select("*, patients(*), staff(full_name)")
        .eq("ipd_no", uhid)
        .single();

      if (error) {
        console.error("Error loading patient data:", error);
        return;
      }

      setPatientData(ipdAdmission);
      
             // Pre-fill form with patient data
       if (ipdAdmission) {
         setForm(prev => ({
           ...prev,
           patient_name: ipdAdmission.patients?.full_name || "",
           age: ipdAdmission.patients?.age?.toString() || "",
           sex: ipdAdmission.patients?.gender || "",
           uhid_no: ipdAdmission.patients?.uhid || "",
           ip_no: ipdAdmission.ipd_no || "",
           ward_bed_no: `${ipdAdmission.ward || ""} / ${ipdAdmission.bed_number || ""}`,
           date_of_admission: ipdAdmission.admission_date ? new Date(ipdAdmission.admission_date).toISOString().split('T')[0] : "",
           time_of_admission: ipdAdmission.admission_time || "",
           doctor_name: ipdAdmission.staff?.full_name || "",
         }));
       }
    } catch (error) {
      console.error("Error loading patient data:", error);
    }
  };

  const loadProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from("procedure_entries")
        .select("*")
        .eq("ipd_no", uhid);

      if (error) {
        console.error("Error loading procedures:", error);
        return;
      }

      setProcedures(data || []);
      
      // Auto-populate procedures_performed field
      if (data && data.length > 0) {
        const proceduresText = data.map(proc => 
          `${proc.procedure_name} (${proc.start_date} to ${proc.end_date})${proc.therapist ? ` - ${proc.therapist}` : ''}`
        ).join('\n');
        
        setForm(prev => ({
          ...prev,
          procedures_performed: proceduresText
        }));
      }
    } catch (error) {
      console.error("Error loading procedures:", error);
    }
  };

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from("internal_medications")
        .select("*")
        .eq("ipd_no", uhid);

      if (error) {
        console.error("Error loading medications:", error);
        return;
      }

      setMedications(data || []);
      
      // Auto-populate medications_administered field
      if (data && data.length > 0) {
        const medicationsText = data.map(med => 
          `${med.medication_name} - ${med.dosage} ${med.frequency} (${med.start_date} to ${med.end_date})`
        ).join('\n');
        
        setForm(prev => ({
          ...prev,
          medications_administered: medicationsText
        }));
      }
    } catch (error) {
      console.error("Error loading medications:", error);
    }
  };

  const loadDischargeSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("discharge_summaries")
        .select("*")
        .eq("ipd_no", uhid)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error loading discharge summary:", error);
        return;
      }

             if (data) {
         setDischargeSummary(data);
         setForm({
           department: data.department || "",
           doctor_name: data.doctor_name || "",
           patient_name: data.patient_name || "",
           age: data.age || "",
           sex: data.sex || "",
           uhid_no: data.uhid_no || "",
           ip_no: data.ip_no || "",
           ward_bed_no: data.ward_bed_no || "",
           date_of_admission: data.date_of_admission ? new Date(data.date_of_admission).toISOString().split('T')[0] : "",
           time_of_admission: data.time_of_admission || "",
           date_of_discharge: data.date_of_discharge ? new Date(data.date_of_discharge).toISOString().split('T')[0] : "",
           time_of_discharge: data.time_of_discharge || "",
           complaints: data.complaints || "",
           history_brief: data.history_brief || "",
           significant_findings: data.significant_findings || "",
           investigation_results: data.investigation_results || "",
           diagnosis: data.diagnosis || "",
           condition_at_discharge: data.condition_at_discharge || "",
           course_in_hospital: data.course_in_hospital || "",
           procedures_performed: data.procedures_performed || "",
           medications_administered: data.medications_administered || "",
           other_treatment: data.other_treatment || "",
           discharge_medications: data.discharge_medications || "",
           other_instructions: data.other_instructions || "",
           follow_up_period: data.follow_up_period || "",
           urgent_care_instructions: data.urgent_care_instructions || "",
           doctor_signature: data.doctor_signature || "",
           patient_signature: data.patient_signature || "",
           summary_prepared_by: data.summary_prepared_by || "",
         });
       }
    } catch (error) {
      console.error("Error loading discharge summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Clean up date fields - convert empty strings to null
      const cleanedForm = {
        ...form,
        date_of_admission: form.date_of_admission || null,
        date_of_discharge: form.date_of_discharge || null,
        time_of_admission: form.time_of_admission || null,
        time_of_discharge: form.time_of_discharge || null,
      };

      const summaryData = {
        ipd_no: patientData?.ipd_no || uhid, // Use actual IPD number from patient data
        ...cleanedForm
      };

      console.log("Saving discharge summary data:", summaryData);
      console.log("Patient data:", patientData);
      console.log("UHID from URL:", uhid);

      let result;
      if (dischargeSummary) {
        // Update existing
        console.log("Updating existing discharge summary with ID:", dischargeSummary.id);
        result = await supabase
          .from("discharge_summaries")
          .update(summaryData)
          .eq("id", dischargeSummary.id);
      } else {
        // Create new
        console.log("Creating new discharge summary");
        result = await supabase
          .from("discharge_summaries")
          .insert([summaryData]);
      }

      console.log("Supabase result:", result);

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Success",
        description: dischargeSummary ? "Discharge summary updated successfully!" : "Discharge summary saved successfully!",
      });

      // Reload the data
      await loadDischargeSummary();
    } catch (error) {
      console.error("Error saving discharge summary:", error);
      toast({
        title: "Error",
        description: "Failed to save discharge summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Discharge Summary - ${form.patient_name}</title>
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
            .bullet-point {
              font-weight: bold;
              margin: 15px 0 8px 0;
              font-size: 12pt;
              color: #000;
            }
            .signature-section { 
              margin-top: 40px; 
              display: flex; 
              justify-content: space-between; 
            }
            .signature-box { 
              width: 45%; 
            }
            .patient-acknowledgment {
              margin: 30px 0;
              font-style: italic;
              text-align: justify;
              line-height: 1.6;
              font-size: 12pt;
            }
            .footer { 
              text-align: center; 
              margin-top: 50px; 
              font-weight: bold;
              font-size: 14pt;
              color: #2E7D32;
            }
            hr { 
              margin: 20px 0; 
              border: none; 
              border-top: 1.5px solid #333; 
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/my-logo.png" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2>DISCHARGE SUMMARY/CARD</h2>
              </div>
            </div>
            
            <div class="patient-info">
              <div><b>Department:</b><span class="value">${form.department}</span></div>
              <div><b>Doctor Name:</b><span class="value">${form.doctor_name}</span></div>
              <div><b>Patient Name:</b><span class="value">${form.patient_name}</span></div>
              <div><b>Age:</b><span class="value">${form.age}</span></div>
              <div><b>Sex:</b><span class="value">${form.sex}</span></div>
              <div><b>UHID No/MR No:</b><span class="value">${form.uhid_no}</span></div>
              <div><b>IP No:</b><span class="value">${form.ip_no}</span></div>
              <div><b>Ward/Bed No:</b><span class="value">${form.ward_bed_no}</span></div>
              <div><b>Date of Admission:</b><span class="value">${form.date_of_admission}</span></div>
              <div><b>Time:</b><span class="value">${form.time_of_admission}</span></div>
              <div><b>Date of Discharge:</b><span class="value">${form.date_of_discharge}</span></div>
              <div><b>Time:</b><span class="value">${form.time_of_discharge}</span></div>
            </div>
            
            <div class="section">
              <b>Complaints:</b>
              <div class="value">${form.complaints}</div>
            </div>
            
            <div class="section">
              <b>History Brief:</b>
              <div class="value">${form.history_brief}</div>
            </div>
            
            <div class="section">
              <b>Significant findings:</b>
              <div class="value">${form.significant_findings}</div>
            </div>
            
            <div class="section">
              <b>Investigation results:</b>
              <div class="value">${form.investigation_results}</div>
            </div>
            
            <div class="section">
              <b>Diagnosis:</b>
              <div class="value">${form.diagnosis}</div>
            </div>
            
            <div class="section">
              <b>Condition at discharge:</b>
              <div class="value">${form.condition_at_discharge}</div>
            </div>
            
            <div class="section">
              <b>Course in the hospital:</b>
              <div class="value">${form.course_in_hospital}</div>
            </div>
            
            <div class="section">
              <b>Treatment Given:</b>
              <div class="bullet-point">• Procedures Performed:</div>
              <div class="value">${form.procedures_performed}</div>
              <div class="bullet-point">• Medications administered:</div>
              <div class="value">${form.medications_administered}</div>
              <div class="bullet-point">• Other treatment (if any):</div>
              <div class="value">${form.other_treatment}</div>
            </div>
            
            <div class="section">
              <b>Advice at Discharge:</b>
              <div class="bullet-point">• Medications:</div>
              <div class="value">${form.discharge_medications}</div>
              <div class="bullet-point">• Other instructions:</div>
              <div class="value">${form.other_instructions}</div>
            </div>
            
            <div class="section">
              <b>Follow up period:</b>
              <div class="value">${form.follow_up_period}</div>
            </div>
            
            <div class="section">
              <b>When & how to obtain urgent care:</b>
              <div class="value">${form.urgent_care_instructions}</div>
            </div>
            
            <hr>
            
            <div class="signature-section">
              <div class="signature-box">
                <b>Sign & name of doctor with date & time:</b>
                <div class="value">${form.doctor_signature}</div>
              </div>
            </div>
            
            <div class="patient-acknowledgment">
              Received discharge summary and clearly understood instructions which were explained to me in my vernacular language upto my satisfaction.
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <b>Signature of the patient:</b>
                <div class="value">${form.patient_signature}</div>
              </div>
              <div class="signature-box">
                <b>Summary prepared by:</b>
                <div class="value">${form.summary_prepared_by}</div>
              </div>
            </div>
            
            <div class="footer">WISH YOU SPEEDY RECOVERY</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const calculateBill = async () => {
    if (!form.date_of_admission || !form.date_of_discharge) {
      toast({
        title: "Error",
        description: "Please fill in admission and discharge dates first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate total days
      const admissionDate = new Date(form.date_of_admission);
      const dischargeDate = new Date(form.date_of_discharge);
      const totalDays = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Calculate bed charges
      const bedRate = billCharges.room_type === 'AC' ? 750 : 500;
      const bedCharges = totalDays * bedRate;

      // Calculate procedure charges
      let procedureCharges = 0;
      for (const procedure of procedures) {
        const startDate = new Date(procedure.start_date);
        const endDate = new Date(procedure.end_date);
        const procedureDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Get procedure charges from database
        const { data: procedureData } = await supabase
          .from('procedures')
          .select('charges_per_day')
          .eq('procedure_name', procedure.procedure_name)
          .single();
        
        if (procedureData && procedureData.charges_per_day) {
          const dailyCharge = parseFloat(procedureData.charges_per_day);
          procedureCharges += procedureDays * dailyCharge;
        }
      }

      // Calculate other charges
      const dietCharges = totalDays * billCharges.diet_charges_per_day;
      const doctorCharges = totalDays * billCharges.doctor_charges_per_day;
      const nursingCharges = totalDays * billCharges.nursing_charges_per_day;

      const totalAmount = bedCharges + procedureCharges + dietCharges + doctorCharges + nursingCharges;

      setBillCalculation({
        total_days: totalDays,
        bed_charges: bedCharges,
        procedure_charges: procedureCharges,
        diet_charges: dietCharges,
        doctor_charges: doctorCharges,
        nursing_charges: nursingCharges,
        total_amount: totalAmount
      });

      setShowBillModal(true);
    } catch (error) {
      console.error('Error calculating bill:', error);
      toast({
        title: "Error",
        description: "Failed to calculate bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const printBill = () => {
    if (!billCalculation) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Final Bill - ${form.patient_name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              border: 2px solid #333; 
              padding: 20px; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              margin-bottom: 10px; 
            }
            .title h1 { 
              margin: 0; 
              font-size: 18pt; 
              font-weight: bold; 
              color: #2E7D32; 
            }
            .title h2 { 
              margin: 5px 0; 
              font-size: 16pt; 
              font-weight: bold; 
              color: #333; 
            }
            .patient-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 10px; 
              margin-bottom: 20px; 
              font-size: 12pt; 
            }
            .patient-info div { 
              display: flex; 
              justify-content: space-between; 
              border-bottom: 1px solid #eee; 
              padding: 2px 0; 
            }
            .patient-info b { 
              font-weight: bold; 
              min-width: 120px; 
            }
            .value { 
              font-weight: normal; 
              text-align: right; 
              word-break: break-word; 
            }
            .bill-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12pt;
            }
            .bill-table th, .bill-table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
            }
            .bill-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .bill-table .total-row {
              font-weight: bold;
              background-color: #e8f5e8;
            }
            .total-amount {
              text-align: center;
              margin-top: 30px;
              font-size: 16pt;
              font-weight: bold;
              color: #2E7D32;
              border: 2px solid #2E7D32;
              padding: 15px;
              background-color: #f0f8f0;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/my-logo.png" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2>FINAL BILL</h2>
              </div>
            </div>
            
            <div class="patient-info">
              <div><b>Patient Name:</b><span class="value">${form.patient_name}</span></div>
              <div><b>IP No:</b><span class="value">${form.ip_no}</span></div>
              <div><b>UHID No:</b><span class="value">${form.uhid_no}</span></div>
              <div><b>Ward/Bed No:</b><span class="value">${form.ward_bed_no}</span></div>
              <div><b>Date of Admission:</b><span class="value">${form.date_of_admission}</span></div>
              <div><b>Date of Discharge:</b><span class="value">${form.date_of_discharge}</span></div>
              <div><b>Total Days:</b><span class="value">${billCalculation.total_days}</span></div>
              <div><b>Room Type:</b><span class="value">${billCharges.room_type}</span></div>
            </div>
            
            <table class="bill-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Days</th>
                  <th>Rate per Day</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Bed Charges (${billCharges.room_type})</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.room_type === 'AC' ? '750' : '500'}</td>
                  <td>₹${billCalculation.bed_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Procedure Charges</td>
                  <td>-</td>
                  <td>-</td>
                  <td>₹${billCalculation.procedure_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Diet Charges</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.diet_charges_per_day}</td>
                  <td>₹${billCalculation.diet_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Doctor Charges</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.doctor_charges_per_day}</td>
                  <td>₹${billCalculation.doctor_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Nursing Charges</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.nursing_charges_per_day}</td>
                  <td>₹${billCalculation.nursing_charges.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL AMOUNT</strong></td>
                  <td><strong>₹${billCalculation.total_amount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="total-amount">
              Total Amount: ₹${billCalculation.total_amount.toLocaleString()}
            </div>
            
            <div style="margin-top: 40px; text-align: center; font-size: 12pt;">
              <p><strong>Authorized Signature:</strong></p>
              <div style="border-top: 1px solid #333; width: 200px; margin: 20px auto;"></div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading discharge summary...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discharge Summary</h1>
          <p className="text-muted-foreground">
            Complete discharge summary for IPD patient
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { loadProcedures(); loadMedications(); }} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Refresh Procedures & Medications
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print Summary
          </Button>
          <Link href={`/dashboard/patients/${uhid}/final-bill`}>
            <Button variant="outline">
              <Calculator className="h-4 w-4 mr-2" />
              Generate Final Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Current Procedures and Medications Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Procedures ({procedures.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {procedures.length > 0 ? (
              <div className="space-y-2">
                {procedures.map((proc, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-semibold">{proc.procedure_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {proc.start_date} to {proc.end_date}
                      {proc.therapist && ` • ${proc.therapist}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No procedures found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Medications ({medications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <div className="space-y-2">
                {medications.map((med, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-semibold">{med.medication_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {med.dosage} {med.frequency} • {med.start_date} to {med.end_date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No medications found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Discharge Summary Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <Label htmlFor="doctor_name">Doctor Name</Label>
                <Input
                  id="doctor_name"
                  name="doctor_name"
                  value={form.doctor_name}
                  onChange={handleChange}
                  placeholder="Enter doctor name"
                />
              </div>
              <div>
                <Label htmlFor="patient_name">Patient Name</Label>
                <Input
                  id="patient_name"
                  name="patient_name"
                  value={form.patient_name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                />
              </div>
              <div>
                <Label htmlFor="sex">Sex</Label>
                <Input
                  id="sex"
                  name="sex"
                  value={form.sex}
                  onChange={handleChange}
                  placeholder="Enter sex"
                />
              </div>
              <div>
                <Label htmlFor="uhid_no">UHID No/MR No</Label>
                <Input
                  id="uhid_no"
                  name="uhid_no"
                  value={form.uhid_no}
                  onChange={handleChange}
                  placeholder="Enter UHID number"
                />
              </div>
              <div>
                <Label htmlFor="ip_no">IP No</Label>
                <Input
                  id="ip_no"
                  name="ip_no"
                  value={form.ip_no}
                  onChange={handleChange}
                  placeholder="Enter IP number"
                />
              </div>
              <div>
                <Label htmlFor="ward_bed_no">Ward/Bed No</Label>
                <Input
                  id="ward_bed_no"
                  name="ward_bed_no"
                  value={form.ward_bed_no}
                  onChange={handleChange}
                  placeholder="Enter ward/bed number"
                />
              </div>
            </div>

            {/* Admission/Discharge Dates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="date_of_admission">Date of Admission</Label>
                <Input
                  id="date_of_admission"
                  name="date_of_admission"
                  type="date"
                  value={form.date_of_admission}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="time_of_admission">Time of Admission</Label>
                <Input
                  id="time_of_admission"
                  name="time_of_admission"
                  type="time"
                  value={form.time_of_admission}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="date_of_discharge">Date of Discharge</Label>
                <Input
                  id="date_of_discharge"
                  name="date_of_discharge"
                  type="date"
                  value={form.date_of_discharge}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="time_of_discharge">Time of Discharge</Label>
                <Input
                  id="time_of_discharge"
                  name="time_of_discharge"
                  type="time"
                  value={form.time_of_discharge}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="complaints">Complaints</Label>
                <Textarea
                  id="complaints"
                  name="complaints"
                  value={form.complaints}
                  onChange={handleChange}
                  placeholder="Enter patient complaints"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="history_brief">History Brief</Label>
                <Textarea
                  id="history_brief"
                  name="history_brief"
                  value={form.history_brief}
                  onChange={handleChange}
                  placeholder="Enter history brief"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="significant_findings">Significant Findings</Label>
                <Textarea
                  id="significant_findings"
                  name="significant_findings"
                  value={form.significant_findings}
                  onChange={handleChange}
                  placeholder="Enter significant findings"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="investigation_results">Investigation Results</Label>
                <Textarea
                  id="investigation_results"
                  name="investigation_results"
                  value={form.investigation_results}
                  onChange={handleChange}
                  placeholder="Enter investigation results"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleChange}
                  placeholder="Enter diagnosis"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="condition_at_discharge">Condition at Discharge</Label>
                <Textarea
                  id="condition_at_discharge"
                  name="condition_at_discharge"
                  value={form.condition_at_discharge}
                  onChange={handleChange}
                  placeholder="Enter condition at discharge"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="course_in_hospital">Course in the Hospital</Label>
                <Textarea
                  id="course_in_hospital"
                  name="course_in_hospital"
                  value={form.course_in_hospital}
                  onChange={handleChange}
                  placeholder="Enter course in hospital"
                  rows={3}
                />
              </div>
            </div>

            {/* Treatment Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="procedures_performed">Procedures Performed</Label>
                <Textarea
                  id="procedures_performed"
                  name="procedures_performed"
                  value={form.procedures_performed}
                  onChange={handleChange}
                  placeholder="Enter procedures performed (auto-populated from procedure entries)"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This field is automatically populated from the patient's procedure entries. Click "Refresh Procedures & Medications" to update.
                </p>
              </div>
              <div>
                <Label htmlFor="medications_administered">Medications Administered</Label>
                <Textarea
                  id="medications_administered"
                  name="medications_administered"
                  value={form.medications_administered}
                  onChange={handleChange}
                  placeholder="Enter medications administered (auto-populated from internal medications)"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This field is automatically populated from the patient's internal medications. Click "Refresh Procedures & Medications" to update.
                </p>
              </div>
              <div>
                <Label htmlFor="other_treatment">Other Treatment (if any)</Label>
                <Textarea
                  id="other_treatment"
                  name="other_treatment"
                  value={form.other_treatment}
                  onChange={handleChange}
                  placeholder="Enter other treatment"
                  rows={3}
                />
              </div>
            </div>

            {/* Discharge Advice */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="discharge_medications">Discharge Medications</Label>
                <Textarea
                  id="discharge_medications"
                  name="discharge_medications"
                  value={form.discharge_medications}
                  onChange={handleChange}
                  placeholder="Enter discharge medications"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="other_instructions">Other Instructions</Label>
                <Textarea
                  id="other_instructions"
                  name="other_instructions"
                  value={form.other_instructions}
                  onChange={handleChange}
                  placeholder="Enter other instructions"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="follow_up_period">Follow Up Period</Label>
                <Input
                  id="follow_up_period"
                  name="follow_up_period"
                  value={form.follow_up_period}
                  onChange={handleChange}
                  placeholder="Enter follow up period"
                />
              </div>
              <div>
                <Label htmlFor="urgent_care_instructions">When & How to Obtain Urgent Care</Label>
                <Textarea
                  id="urgent_care_instructions"
                  name="urgent_care_instructions"
                  value={form.urgent_care_instructions}
                  onChange={handleChange}
                  placeholder="Enter urgent care instructions"
                  rows={3}
                />
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="doctor_signature">Doctor Signature</Label>
                <Input
                  id="doctor_signature"
                  name="doctor_signature"
                  value={form.doctor_signature}
                  onChange={handleChange}
                  placeholder="Enter doctor signature"
                />
              </div>
              <div>
                <Label htmlFor="patient_signature">Patient Signature</Label>
                <Input
                  id="patient_signature"
                  name="patient_signature"
                  value={form.patient_signature}
                  onChange={handleChange}
                  placeholder="Enter patient signature"
                />
              </div>
              <div>
                <Label htmlFor="summary_prepared_by">Summary Prepared By</Label>
                <Input
                  id="summary_prepared_by"
                  name="summary_prepared_by"
                  value={form.summary_prepared_by}
                  onChange={handleChange}
                  placeholder="Enter preparer name"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : dischargeSummary ? "Update Summary" : "Save Summary"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bill Generation Modal */}
      <Dialog open={showBillModal} onOpenChange={setShowBillModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Generate Final Bill
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Charges Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Charges Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room_type">Room Type</Label>
                    <select
                      id="room_type"
                      value={billCharges.room_type}
                      onChange={(e) => setBillCharges(prev => ({ ...prev, room_type: e.target.value as 'AC' | 'Non-AC' }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Non-AC">Non-AC (₹500/day)</option>
                      <option value="AC">AC (₹750/day)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="diet_charges">Diet Charges per Day (₹)</Label>
                    <Input
                      id="diet_charges"
                      type="number"
                      value={billCharges.diet_charges_per_day}
                      onChange={(e) => setBillCharges(prev => ({ ...prev, diet_charges_per_day: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter daily diet charges"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor_charges">Doctor Charges per Day (₹)</Label>
                    <Input
                      id="doctor_charges"
                      type="number"
                      value={billCharges.doctor_charges_per_day}
                      onChange={(e) => setBillCharges(prev => ({ ...prev, doctor_charges_per_day: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter daily doctor charges"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nursing_charges">Nursing Charges per Day (₹)</Label>
                    <Input
                      id="nursing_charges"
                      type="number"
                      value={billCharges.nursing_charges_per_day}
                      onChange={(e) => setBillCharges(prev => ({ ...prev, nursing_charges_per_day: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter daily nursing charges"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bill Calculation Display */}
            {billCalculation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Bill Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Total Days:</strong> {billCalculation.total_days}</div>
                      <div><strong>Room Type:</strong> {billCharges.room_type}</div>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span>Bed Charges ({billCharges.room_type}):</span>
                        <span>₹{billCalculation.bed_charges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Procedure Charges:</span>
                        <span>₹{billCalculation.procedure_charges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diet Charges:</span>
                        <span>₹{billCalculation.diet_charges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Doctor Charges:</span>
                        <span>₹{billCalculation.doctor_charges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nursing Charges:</span>
                        <span>₹{billCalculation.nursing_charges.toLocaleString()}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between text-lg font-bold text-green-600">
                        <span>TOTAL AMOUNT:</span>
                        <span>₹{billCalculation.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button onClick={calculateBill} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Bill
              </Button>
              {billCalculation && (
                <Button onClick={printBill} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bill
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 