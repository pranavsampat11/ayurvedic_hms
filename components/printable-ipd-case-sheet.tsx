"use client";
import React from "react";
import { Button } from "@/components/ui/button";

// Define the type for the IPD case sheet data
type IpdCaseSheetData = {
  patient_name: string;
  uhid: string;
  ipd_no: string;
  opd_no: string;
  age: string | number;
  gender: string;
  contact: string;
  address: string;
  doctor: string;
  department: string;
  ward: string;
  bed_no: string;
  admission_at: string;
  discharge_at: string;

  present_complaints: string;
  associated_complaints: string;
  past_history: string;
  personal_history: string;
  obs_gyn_history: string;
  previous_medicine_history: string;
  family_history: string;
  // Individual examination fields
  height: string;
  weight: string;
  bmi: string;
  pulse: string;
  rr: string;
  bp: string;
  respiratory_system: string;
  cvs: string;
  cns: string;
  local_examination: string;
  pain_assessment: string;
  investigations: string;
  diagnosis: string;
  nutritional_status: string;
  treatment_plan: string;
  preventive_aspects: string;
  rehabilitation: string;
  desired_outcome: string;
  created_at: string;
  // JSON fields that need to be parsed
  general_examination: any;
  dasavidha_pariksha: any;
  asthasthana_pariksha: any;
  systemic_examination: any;
  sampraptighataka: any;
  // Procedures and medications
  procedures?: any[];
  internal_medications?: any[];
};

export default function PrintableIpdCaseSheet({ data }: { data: IpdCaseSheetData }) {
  const handlePrint = () => {
    // Parse JSON fields
    const generalExam = typeof data.general_examination === 'string' 
      ? JSON.parse(data.general_examination || '{}') 
      : data.general_examination || {};
    
    const dasavidha = typeof data.dasavidha_pariksha === 'string' 
      ? JSON.parse(data.dasavidha_pariksha || '{}') 
      : data.dasavidha_pariksha || {};
    
    const asthasthana = typeof data.asthasthana_pariksha === 'string' 
      ? JSON.parse(data.asthasthana_pariksha || '{}') 
      : data.asthasthana_pariksha || {};
    
    const systemicExam = typeof data.systemic_examination === 'string' 
      ? JSON.parse(data.systemic_examination || '{}') 
      : data.systemic_examination || {};
    
    const samprapti = typeof data.sampraptighataka === 'string' 
      ? JSON.parse(data.sampraptighataka || '{}') 
      : data.sampraptighataka || {};

    // Build the printable HTML with the exact format from the screenshots
    const printContent = `
      <html>
        <head>
          <title>IPD Case Sheet - ${data.patient_name}</title>
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
            .pariksha-section {
              margin-left: 20px;
              margin-top: 10px;
            }
            .pariksha-section b {
              font-weight: bold;
              color: #000;
              font-size: 12pt;
            }
            .pariksha-item {
              margin-left: 20px;
              margin-bottom: 5px;
              font-size: 12pt;
            }
            .pariksha-item b {
              font-weight: bold;
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
            .pain-scale {
              width: 200px;
              height: auto;
              margin: 10px 0;
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
            <!-- Page 1 -->
            <div class="header">
              <img src="/my-logo.png" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2>IPD CASE SHEET</h2>
              </div>
            </div>
            
            <div class="patient-info">
              <div><b>Patient Name:</b><span class="value">${data.patient_name || ''}</span></div>
              <div><b>UHID No:</b><span class="value">${data.uhid || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Age:</b><span class="value">${data.age || ''} yrs</span></div>
              <div><b>Gender:</b><span class="value">${data.gender || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Contact No:</b><span class="value">${data.contact || ''}</span></div>
              <div><b>Address:</b><span class="value">${data.address || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Doctor:</b><span class="value">${data.doctor || ''}</span></div>
              <div><b>Department:</b><span class="value">${data.department || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>IPD No:</b><span class="value">${data.ipd_no || ''}</span></div>
              <div><b>OPD No:</b><span class="value">${data.opd_no || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Ward:</b><span class="value">${data.ward || ''}</span></div>
              <div><b>Bed No:</b><span class="value">${data.bed_no || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Admission Date:</b><span class="value">${data.admission_at || ''}</span></div>
              <div><b>Discharge Date:</b><span class="value">${data.discharge_at || ''}</span></div>
            </div>
            
            <hr />
            
            <div class="section"><b>• Present Complaints:</b><div class="value">${data.present_complaints || ''}</div></div>
            <div class="section"><b>• Associated Complaints:</b><div class="value">${data.associated_complaints || ''}</div></div>
            <div class="section"><b>• Past History:</b><div class="value">${data.past_history || ''}</div></div>
            <div class="section"><b>• Personal History:</b><div class="value">${data.personal_history || ''}</div></div>
            <div class="section"><b>• Obs & Gyn History: (Applicable for female patients only)</b><div class="value">${data.obs_gyn_history || ''}</div></div>
            <div class="section"><b>• Previous Medicine History:</b><div class="value">${data.previous_medicine_history || ''}</div></div>
            <div class="section"><b>• Family History:</b><div class="value">${data.family_history || ''}</div></div>
            
            <div class="section">
              <b>• Examination:</b>
              <div class="examination-section">
                <div class="examination-table">
                  <b>• General Examination</b>
                  <table>
                    <tr>
                      <td><b>Ht:</b> ${data.height || ''}</td>
                      <td><b>Wt:</b> ${data.weight || ''}</td>
                      <td><b>BMI:</b> ${data.bmi || ''}</td>
                      <td><b>Pulse:</b> ${data.pulse || ''}</td>
                      <td><b>RR:</b> ${data.rr || ''}</td>
                      <td><b>BP:</b> ${data.bp || ''}</td>
                    </tr>
                  </table>
                </div>
                
                <div class="pariksha-section">
                  <b>• Pariksha - Dasavidha Pariksha</b>
                  <div class="pariksha-item"><b>Prakriti:</b> ${dasavidha.Prakriti || ''}</div>
                  <div class="pariksha-item"><b>Vikruti:</b> ${dasavidha.Vikruti || ''}</div>
                  <div class="pariksha-item"><b>Sara:</b> ${dasavidha.Sara || ''}</div>
                  <div class="pariksha-item"><b>Samhanana:</b> ${dasavidha.Samhanana || ''}</div>
                  <div class="pariksha-item"><b>Pramana:</b> ${dasavidha.Pramana || ''}</div>
                  <div class="pariksha-item"><b>Satmya:</b> ${dasavidha.Satmya || ''}</div>
                  <div class="pariksha-item"><b>Satva:</b> ${dasavidha.Satva || ''}</div>
                  <div class="pariksha-item"><b>Ahara Shakti:</b> ${dasavidha.AharaShakti || ''}</div>
                  <div class="pariksha-item"><b>Vyayam Shakti:</b> ${dasavidha.VyayamShakti || ''}</div>
                  <div class="pariksha-item"><b>Vaya:</b> ${dasavidha.Vaya || ''}</div>
                </div>
                
                <div class="pariksha-section">
                  <b>• Pariksha - Asthasthana Pariksha</b>
                  <div class="pariksha-item"><b>Nadi:</b> ${asthasthana.Nadi || ''}</div>
                  <div class="pariksha-item"><b>Mootra:</b> ${asthasthana.Mootra || ''}</div>
                  <div class="pariksha-item"><b>Mala:</b> ${asthasthana.Mala || ''}</div>
                  <div class="pariksha-item"><b>Jivha:</b> ${asthasthana.Jivha || ''}</div>
                  <div class="pariksha-item"><b>Shabda:</b> ${asthasthana.Shabda || ''}</div>
                  <div class="pariksha-item"><b>Sparsha:</b> ${asthasthana.Sparsha || ''}</div>
                  <div class="pariksha-item"><b>Drika:</b> ${asthasthana.Drika || ''}</div>
                  <div class="pariksha-item"><b>Akruti:</b> ${asthasthana.Akruti || ''}</div>
                </div>
                
                <div class="examination-list">
                  <b>• Systemic Examination</b>
                  <ul>
                    <li><b>Respiratory System:</b> ${data.respiratory_system || ''}</li>
                    <li><b>CVS:</b> ${data.cvs || ''}</li>
                    <li><b>CNS:</b> ${data.cns || ''}</li>
                  </ul>
                </div>
                
                <div class="examination-list">
                  <b>• Local Examination</b>
                  <div class="value">${data.local_examination || ''}</div>
                </div>
                
                <div class="pariksha-section">
                  <b>• Sampraptighataka</b>
                  <div class="pariksha-item"><b>Dosha:</b> ${samprapti.Dosha || ''}</div>
                  <div class="pariksha-item"><b>Srotho dushti:</b> ${samprapti.SrothoDushti || ''}</div>
                  <div class="pariksha-item"><b>Vyaktasthana:</b> ${samprapti.Vyaktasthana || ''}</div>
                  <div class="pariksha-item"><b>Dushya:</b> ${samprapti.Dushya || ''}</div>
                  <div class="pariksha-item"><b>Udhabavasthana:</b> ${samprapti.Udhabavasthana || ''}</div>
                  <div class="pariksha-item"><b>Vyadibheda:</b> ${samprapti.Vyadibheda || ''}</div>
                  <div class="pariksha-item"><b>Srothas:</b> ${samprapti.Srothas || ''}</div>
                  <div class="pariksha-item"><b>Sancharastana:</b> ${samprapti.Sancharastana || ''}</div>
                  <div class="pariksha-item"><b>Sadhyaasadhyatha:</b> ${samprapti.Sadhyaasadhyatha || ''}</div>
                </div>
              </div>
            </div>
            
            <div class="page-number">Page 1 of 3</div>
            
            <!-- Page 2 -->
            <div style="page-break-before: always;">
              <div class="section">
                <b>• Pain Assessment (applicable only for pain predominant cases):</b>
                <div class="value">${data.pain_assessment || ''}</div>
                ${data.pain_assessment ? '<img src="/pain-scale.png" alt="Pain Scale" class="pain-scale" />' : ''}
              </div>
              
              <div class="section">
                <b>• Investigations:</b>
                <div class="value">${data.investigations || ''}</div>
              </div>
              
              <div class="section">
                <b>• Diagnosis:</b>
                <div class="value">${data.diagnosis || ''}</div>
              </div>
              
              <div class="section">
                <b>• Nutritional Status:</b>
                <div class="value">${data.nutritional_status || ''}</div>
              </div>
              
              ${data.procedures && data.procedures.length > 0 ? `
              <div class="section">
                <b>• Procedures:</b>
                <div class="procedures-section">
                  ${data.procedures.map((proc, index) => `
                    <div class="procedure-item">
                      <b>Procedure ${index + 1}:</b> ${proc.procedure?.procedure_name || ''}<br>
                      ${proc.medicinesString ? `<b>Medicines:</b> ${proc.medicinesString}<br>` : ''}
                      ${proc.requirementsString ? `<b>Requirements:</b> ${proc.requirementsString}<br>` : ''}
                      <b>Quantity:</b> ${proc.quantity || ''}<br>
                      <b>Duration:</b> ${proc.start_date || ''} to ${proc.end_date || ''}<br>
                      ${proc.therapist ? `<b>Therapist:</b> ${proc.therapist}` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              ${data.internal_medications && data.internal_medications.length > 0 ? `
              <div class="section">
                <b>• Internal Medications:</b>
                <div class="medications-section">
                  ${data.internal_medications.map((med, index) => `
                    <div class="medication-item">
                      <b>Medication ${index + 1}:</b> ${med.medication?.product_name || ''}<br>
                      <b>Dosage:</b> ${med.dosage || ''}<br>
                      <b>Frequency:</b> ${med.frequency || ''}<br>
                      <b>Duration:</b> ${med.start_date || ''} to ${med.end_date || ''}<br>
                      ${med.notes ? `<b>Notes:</b> ${med.notes}` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <div class="page-number">Page 2 of 3</div>
            </div>
            
            <!-- Page 3 -->
            <div style="page-break-before: always;">
              <div class="section">
                <b>• Treatment Plan:</b>
                <div class="value">${data.treatment_plan || ''}</div>
              </div>
              
              <div class="section">
                <b>• Preventive Aspects:</b>
                <div class="value">${data.preventive_aspects || ''}</div>
              </div>
              
              <div class="section">
                <b>• Rehabilitation:</b>
                <div class="value">${data.rehabilitation || ''}</div>
              </div>
              
              <div class="section">
                <b>• Desired Outcome:</b>
                <div class="value">${data.desired_outcome || ''}</div>
              </div>
              
              <hr />
              
              <div class="footer">
                <div>
                  <b>Doctor's Signature:</b><br>
                  <span style="border-bottom: 1px solid #000; min-width: 200px; display: inline-block; margin-top: 20px;"></span>
                </div>
                <div>
                  <b>Date:</b> ${new Date().toLocaleDateString()}<br>
                  <b>Time:</b> ${new Date().toLocaleTimeString()}
                </div>
              </div>
              
              <div class="page-number">Page 3 of 3</div>
            </div>
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

  return (
    <Button onClick={handlePrint} variant="outline" className="w-full">
      Print IPD Case Sheet
    </Button>
  );
} 