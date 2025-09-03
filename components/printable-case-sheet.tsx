"use client";
import React from "react";
import { Button } from "@/components/ui/button";

// Define the type for the case sheet data (expand as needed)
type CaseSheetData = {
  patient_name: string;
  uhid: string;
  opd_no: string; // Fixed column name
  age: string | number;
  ref?: string;
  gender: string;
  contact: string;
  address: string;
  doctor: string;
  department: string;
  chief_complaints?: string;
  associated_complaints?: string;
  past_history?: string;
  personal_history?: string;
  allergy_history?: string;
  family_history?: string;
  obs_gyn_history?: string;
  // Individual examination fields
  height?: string;
  weight?: string;
  bmi?: string;
  pulse?: string;
  rr?: string;
  bp?: string;
  respiratory_system?: string;
  cvs?: string;
  cns?: string;
  local_examination?: string;
  pain_assessment?: string;
  investigations?: string;
  diagnosis?: string;
  nutritional_status?: string;
  treatment_plan?: string;
  preventive_aspects?: string;
  rehabilitation?: string;
  desired_outcome?: string;
  OPD_NEXT_FOLLOW_UP?: string;
  created_at?: string;
  // Procedures and medications
  procedures?: any[];
  internal_medications?: any[];
};

export default function PrintableCaseSheet({ data }: { data: CaseSheetData }) {
  const handlePrint = () => {
    // Build the printable HTML with the exact format from the screenshots
    const printContent = `
      <html>
        <head>
          <title>Case Sheet - ${data.patient_name}</title>
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
              <img src="public\my-logo.png" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2>OPD SHEET</h2>
              </div>
            </div>
            
            <div class="patient-info">
              <div><b>Patient Name:</b><span class="value">${data.patient_name || ''}</span></div>
              <div><b>UHID No:</b><span class="value">${data.uhid || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Age:</b><span class="value">${data.age || ''} yrs</span></div>
              <div><b>Ref:</b><span class="value">${data.ref || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Gender:</b><span class="value">${data.gender || ''}</span></div>
              <div><b>Contact No:</b><span class="value">${data.contact || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Address:</b><span class="value">${data.address || ''}</span></div>
              <div><b>Doctor:</b><span class="value">${data.doctor || ''}</span></div>
            </div>
            <div class="patient-info">
              <div><b>Department:</b><span class="value">${data.department || ''}</span></div>
              <div><b>OP No:</b><span class="value">${data.opd_no || ''}</span></div>
            </div>
            
            <hr />
            
            <div class="section"><b>• Chief Complaints:</b><div class="value">${data.chief_complaints || ''}</div></div>
            <div class="section"><b>• Associated Complaints:</b><div class="value">${data.associated_complaints || ''}</div></div>
            <div class="section"><b>• Past History:</b><div class="value">${data.past_history || ''}</div></div>
            <div class="section"><b>• Personal History:</b><div class="value">${data.personal_history || ''}</div></div>
            <div class="section"><b>• Allergy History:</b><div class="value">${data.allergy_history || ''}</div></div>
            <div class="section"><b>• Family History:</b><div class="value">${data.family_history || ''}</div></div>
            <div class="section"><b>• Obs & Gyn History: (Applicable for female patients only)</b><div class="value">${data.obs_gyn_history || ''}</div></div>
            
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
                <div class="examination-list">
                  <b>• Systemic Examination</b>
                  <ul>
                    <li><b>Respiratory System-</b> ${data.respiratory_system || ''}</li>
                    <li><b>CVS:</b> ${data.cvs || ''}</li>
                    <li><b>CNS:</b> ${data.cns || ''}</li>
                  </ul>
                </div>
                <div class="examination-list">
                  <b>• Local Examination</b>
                  <div class="value">${data.local_examination || ''}</div>
                </div>
              </div>
            </div>
            
            <div class="page-number">Page 1 of 2</div>
            
            <!-- Page 2 -->
            <div style="page-break-before: always;">
              <div class="section">
                <b>• Pain Assessment (applicable only for pain predominant cases):</b>
                <div class="value">${data.pain_assessment || ''}</div>
                <div class="pain-scale">
                  <img src="/pain-scale.png" alt="Pain Scale" />
                </div>
              </div>
              
              <div class="section"><b>• Investigations (if any):</b><div class="value">${data.investigations || ''}</div></div>
              
              ${data.procedures && data.procedures.length > 0 ? `
              <div class="section">
                <b>• Procedures:</b>
                <div class="procedures-section">
                  ${data.procedures.map(proc => `
                    <div class="procedure-item">
                      <b>${proc.procedure_name || 'Unknown Procedure'}</b><br>
                      ${proc.requirements ? `Requirements: ${proc.requirements}<br>` : ''}
                      ${proc.quantity ? `Quantity: ${proc.quantity}<br>` : ''}
                      ${proc.start_date ? `Start Date: ${proc.start_date}<br>` : ''}
                      ${proc.end_date ? `End Date: ${proc.end_date}<br>` : ''}
                      ${proc.therapist ? `Therapist: ${proc.therapist}` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              ${data.internal_medications && data.internal_medications.length > 0 ? `
              <div class="section">
                <b>• Internal Medications:</b>
                <div class="medications-section">
                  ${data.internal_medications.map(med => `
                    <div class="medication-item">
                      <b>${med.medication_name || 'Unknown Medication'}</b><br>
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
              
              <div class="section"><b>• Provisional Diagnosis/Final Diagnosis:</b><div class="value">${data.diagnosis || ''}</div></div>
              <div class="section">
                <b>• Screening for Nutritional Needs:</b>
                <div class="examination-section">
                  <b>o Nutritional Status:</b> Normal/mild malnutrition/moderate malnutrition/severe malnutrition
                  <div class="value">${data.nutritional_status || ''}</div>
                </div>
              </div>
              <div class="section"><b>• Treatment Plan/Care of Plan:</b><div class="value">${data.treatment_plan || ''}</div></div>
              <div class="section"><b>• Preventive aspects Pathya Apathys Nidana Pariyarjana, (if any):</b><div class="value">${data.preventive_aspects || ''}</div></div>
              <div class="section"><b>• Rehabilitation-Physiotherapy/Basayana Apunarbhay:</b><div class="value">${data.rehabilitation || ''}</div></div>
              <div class="section"><b>• Desired outcome:</b><div class="value">${data.desired_outcome || ''}</div></div>
              <div class="section"><b>• Next OPD Follow-up:</b><div class="value">${data.OPD_NEXT_FOLLOW_UP || ''}</div></div>
              
              <div class="footer">
                <div>Date: ${data.created_at ? new Date(data.created_at).toLocaleDateString() : ""}</div>
                <div><b>Doctor Name, Signature with date & Time</b></div>
              </div>
              
              <div class="page-number">Page 2 of 2</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `;

    // Open a new window and print
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4">Print Case Sheet</Button>
      <div className="bg-white p-8 rounded shadow max-w-3xl mx-auto border-2 border-gray-800">
        {/* Header with logo and title */}
        <div className="flex items-center mb-6 border-b-2 border-gray-800 pb-4">
          <img src="/my-logo.png" alt="Logo" className="w-20 h-20 mr-5" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-black mb-1">POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
            <h2 className="text-base font-bold underline text-black">OPD SHEET</h2>
          </div>
        </div>
        
        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-baseline">
            <b className="mr-2">Patient Name:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.patient_name}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">UHID No:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.uhid}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Age:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.age} yrs</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Ref:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.ref || ""}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Gender:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.gender}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Contact No:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.contact}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Address:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.address}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Doctor:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.doctor}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">Department:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.department}</span>
          </div>
          <div className="flex items-baseline">
            <b className="mr-2">OP No:</b>
            <span className="border-b border-gray-400 min-w-[150px] pb-1">{data.opd_no}</span>
          </div>
        </div>
        
        <hr className="my-4 border-gray-800" />
        
        {/* Medical History Sections */}
        <div className="mb-3">
          <b className="text-black text-sm">• Chief Complaints:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.chief_complaints || ""}</div>
        </div>
        <div className="mb-3">
          <b className="text-black text-sm">• Associated Complaints:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.associated_complaints || ""}</div>
        </div>
        <div className="mb-3">
          <b className="text-black text-sm">• Past History:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.past_history || ""}</div>
        </div>
        <div className="mb-3">
          <b className="text-black text-sm">• Personal History:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.personal_history || ""}</div>
        </div>
        <div className="mb-3">
          <b className="text-black text-sm">• Allergy History:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.allergy_history || ""}</div>
        </div>
        <div className="mb-3">
          <b className="text-black text-sm">• Family History:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.family_history || ""}</div>
        </div>
        <div className="mb-3">
          <b className="text-black text-sm">• Obs & Gyn History: (Applicable for female patients only)</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.obs_gyn_history || ""}</div>
        </div>
        
        {/* Examination Section */}
        <div className="mb-4">
          <b className="text-black text-sm">• Examination:</b>
          <div className="ml-5 mt-2">
            <div className="mb-2">
              <b className="text-black text-xs">• General Examination</b>
              <div className="ml-4 mt-1">
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="px-2 py-1"><b>Ht:</b> {data.height || ''}</td>
                      <td className="px-2 py-1"><b>Wt:</b> {data.weight || ''}</td>
                      <td className="px-2 py-1"><b>BMI:</b> {data.bmi || ''}</td>
                      <td className="px-2 py-1"><b>Pulse:</b> {data.pulse || ''}</td>
                      <td className="px-2 py-1"><b>RR:</b> {data.rr || ''}</td>
                      <td className="px-2 py-1"><b>BP:</b> {data.bp || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mb-2">
              <b className="text-black text-xs">• Systemic Examination</b>
              <ul className="ml-4 list-disc text-xs">
                <li><b>Respiratory System-</b> {data.respiratory_system || ''}</li>
                <li><b>CVS:</b> {data.cvs || ''}</li>
                <li><b>CNS:</b> {data.cns || ''}</li>
              </ul>
            </div>
            <div className="mb-2">
              <b className="text-black text-xs">• Local Examination</b>
              <div className="ml-4 border-b border-gray-300 pb-1 min-h-[20px]">{data.local_examination || ""}</div>
            </div>
          </div>
        </div>
        
        {/* Pain Assessment */}
        <div className="mb-3">
          <b className="text-black text-sm">• Pain Assessment (applicable only for pain predominant cases):</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.pain_assessment || ""}</div>
          <div className="ml-5 mt-2 text-center">
            <img src="/pain-scale.png" alt="Pain Scale" className="max-w-[400px] h-auto" />
          </div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Investigations (if any):</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.investigations || ""}</div>
        </div>
        
        {/* Procedures Section */}
        {data.procedures && data.procedures.length > 0 && (
          <div className="mb-4">
            <b className="text-black text-sm">• Procedures:</b>
            <div className="ml-5 mt-2">
              {data.procedures.map((proc, index) => (
                <div key={index} className="mb-2 p-2 border border-gray-300 rounded bg-gray-50 text-xs">
                  <div className="font-semibold">{proc.procedure_name}</div>
                  {proc.requirements && <div>Requirements: {proc.requirements}</div>}
                  {proc.quantity && <div>Quantity: {proc.quantity}</div>}
                  {proc.start_date && <div>Start Date: {proc.start_date}</div>}
                  {proc.end_date && <div>End Date: {proc.end_date}</div>}
                  {proc.therapist && <div>Therapist: {proc.therapist}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Internal Medications Section */}
        {data.internal_medications && data.internal_medications.length > 0 && (
          <div className="mb-4">
            <b className="text-black text-sm">• Internal Medications:</b>
            <div className="ml-5 mt-2">
              {data.internal_medications.map((med, index) => (
                <div key={index} className="mb-2 p-2 border border-gray-300 rounded bg-gray-50 text-xs">
                  <div className="font-semibold">{med.medication_name}</div>
                  {med.dosage && <div>Dosage: {med.dosage}</div>}
                  {med.frequency && <div>Frequency: {med.frequency}</div>}
                  {med.start_date && <div>Start Date: {med.start_date}</div>}
                  {med.end_date && <div>End Date: {med.end_date}</div>}
                  {med.notes && <div>Notes: {med.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-3">
          <b className="text-black text-sm">• Provisional Diagnosis/Final Diagnosis:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.diagnosis || ""}</div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Screening for Nutritional Needs:</b>
          <div className="ml-5">
            <b className="text-black text-xs">o Nutritional Status:</b> Normal/mild malnutrition/moderate malnutrition/severe malnutrition
            <div className="border-b border-gray-300 pb-1 min-h-[20px]">{data.nutritional_status || ""}</div>
          </div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Treatment Plan/Care of Plan:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.treatment_plan || ""}</div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Preventive aspects:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.preventive_aspects || ""}</div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Rehabilitation:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.rehabilitation || ""}</div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Desired outcome:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.desired_outcome || ""}</div>
        </div>
        
        <div className="mb-3">
          <b className="text-black text-sm">• Next OPD Follow-up:</b>
          <div className="ml-5 border-b border-gray-300 pb-1 min-h-[20px]">{data.OPD_NEXT_FOLLOW_UP || ""}</div>
        </div>
        
        <div className="mt-8 flex justify-between border-t border-gray-800 pt-4 text-xs">
          <div>Date: {data.created_at ? new Date(data.created_at).toLocaleDateString() : ""}</div>
          <div><b>Doctor Name, Signature with date & Time</b></div>
        </div>
      </div>
    </div>
  );
}