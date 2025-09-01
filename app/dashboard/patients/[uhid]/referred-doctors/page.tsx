"use client";

import React, { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Printer, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ReferredAssessment {
  id: number;
  opd_no?: string;
  ipd_no?: string;
  referred_by_id: string;
  referred_to_id: string;
  department: string;
  assessment_note: string;
  advice: string;
  recommended_procedures: string;
  recommended_meds: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled';
  response_at?: string;
  response_note?: string;
  response_assessment?: string;
  response_advice?: string;
  response_procedures?: string;
  response_medications?: string;
  follow_up_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reminder_sent_at?: string;
  reminder_count: number;
  created_at: string;
  referred_by_name?: string;
  referred_to_name?: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  department: string;
}

interface PatientData {
  full_name: string;
  age: number;
  sex: string;
  bed_number: string;
  uhid: string;
  ipd_no: string;
}

export default function ReferredDoctorsPage({ params }: { params: Promise<{ uhid: string }> }) {
  const resolvedParams = use(params);
  const [assessments, setAssessments] = useState<ReferredAssessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Partial<ReferredAssessment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>('');
  const { toast } = useToast();


    // Load patient data
  const loadPatientData = async () => {
    try {
      console.log('Loading patient data for IPD No:', resolvedParams.uhid);
      
      // First, let's check if this is actually an IPD number or a UHID
      // Try to find by IPD number first
      let { data, error } = await supabase
        .from('ipd_admissions')
        .select(`
          *,
          patients!ipd_admissions_uhid_fkey (
            full_name,
            age,
            gender
          ),
          staff!ipd_admissions_doctor_id_fkey (
            full_name
          )
        `)
        .eq('ipd_no', resolvedParams.uhid)
        .single();

      console.log('First query result:', { data, error });

      // If not found by IPD number, try by UHID
      if (error && error.code === 'PGRST116') {
        console.log('Not found by IPD number, trying by UHID...');
        const { data: uhidData, error: uhidError } = await supabase
          .from('ipd_admissions')
          .select(`
            *,
            patients!ipd_admissions_uhid_fkey (
              full_name,
              age,
              gender
            ),
            staff!ipd_admissions_doctor_id_fkey (
              full_name
            )
          `)
          .eq('uhid', resolvedParams.uhid)
          .single();
        
        console.log('Second query result:', { data: uhidData, error: uhidError });
        
        if (uhidError) {
          console.error('Also not found by UHID:', uhidError);
          throw uhidError;
        }
        
        data = uhidData;
        error = null;
      } else if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Final data:', data);

      if (data) {
        setPatientData({
          full_name: data.patients?.full_name || 'N/A',
          age: data.patients?.age || 0,
          sex: data.patients?.gender || 'N/A', // Changed from sex to gender
          bed_number: data.bed_number || 'N/A',
          uhid: data.uhid || 'N/A',
          ipd_no: data.ipd_no || 'N/A'
        });
        // Set the current doctor ID from the IPD admission
        console.log('IPD Data:', data);
        console.log('Doctor ID from IPD:', data.doctor_id);
        setCurrentDoctorId(data.doctor_id || '');
      } else {
        console.log('No data found for IPD No:', resolvedParams.uhid);
        toast({
          title: "Warning",
          description: `No IPD admission found for IPD No: ${resolvedParams.uhid}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading patient data:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      toast({
        title: "Error",
        description: `Failed to load patient data: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Load staff list
  const loadStaffList = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          full_name,
          role,
          departments!staff_department_id_fkey(name),
          sub_departments!staff_sub_department_id_fkey(name)
        `)
        .order('full_name');

      if (error) {
        console.error('Error loading staff:', error);
        toast({
          title: "Error",
          description: "Failed to load staff list. Please try again.",
          variant: "destructive",
        });
        return;
      }

             if (data) {
         const transformedData: StaffMember[] = data.map((staff: any) => ({
           id: staff.id,
           full_name: staff.full_name,
           role: staff.role,
           department: staff.departments?.name || staff.sub_departments?.name || staff.role
         }));
         setStaffList(transformedData);
       }
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff list. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load referred assessments
  const loadReferredAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('referred_assessments')
        .select(`
          *,
          referred_by:staff!referred_assessments_referred_by_id_fkey(full_name),
          referred_to:staff!referred_assessments_referred_to_id_fkey(full_name)
        `)
        .eq('ipd_no', resolvedParams.uhid)
        .order('created_at', { ascending: false });

      if (error) throw error;

             if (data) {
         const transformedData: ReferredAssessment[] = data.map((item: any) => ({
           ...item,
           referred_by_name: item.referred_by?.full_name,
           referred_to_name: item.referred_to?.full_name
         }));
         setAssessments(transformedData);
       }
    } catch (error) {
      console.error('Error loading referred assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load referred assessments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
    loadStaffList();
    loadReferredAssessments();
  }, [resolvedParams.uhid]);

  const handleAddAssessment = () => {
    if (staffList.length === 0) {
      toast({
        title: "Warning",
        description: "No staff members available. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    // Get the current doctor ID from IPD admission - this should be the doctor assigned to this patient
    if (!currentDoctorId) {
      toast({
        title: "Error",
        description: "Could not determine the doctor assigned to this patient. Please check the IPD admission record.",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentAssessment({
      ipd_no: resolvedParams.uhid,
      status: 'pending',
      priority: 'normal'
    });
    setSelectedDoctors([]);
  };

  const handleEditAssessment = (assessment: ReferredAssessment) => {
    setCurrentAssessment(assessment);
    setSelectedDoctors([assessment.referred_to_id]);
  };

  const handleRemoveAssessment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this referral?')) return;

    try {
      const { error } = await supabase
        .from('referred_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Referral removed successfully.",
      });
      loadReferredAssessments();
    } catch (error) {
      console.error('Error removing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to remove referral.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!currentAssessment) return;

    setSaving(true);
    try {
      if (selectedDoctors.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one doctor to refer to.",
          variant: "destructive",
        });
        return;
      }
      
             // Use the doctor ID from IPD admission - this is the doctor assigned to this patient
       if (!currentDoctorId) {
         toast({
           title: "Error",
           description: "Could not determine the doctor assigned to this patient. Please check the IPD admission record.",
           variant: "destructive",
         });
         return;
       }

      // If editing existing assessment
      if (currentAssessment.id) {
        const { error } = await supabase
          .from('referred_assessments')
          .update({
            referred_to_id: selectedDoctors[0], // For editing, we only allow one doctor
            department: currentAssessment.department,
            assessment_note: currentAssessment.assessment_note,
            advice: currentAssessment.advice,
            recommended_procedures: currentAssessment.recommended_procedures,
            recommended_meds: currentAssessment.recommended_meds,
            priority: currentAssessment.priority
          })
          .eq('id', currentAssessment.id);

        if (error) throw error;
      } else {
        // Create new referrals for each selected doctor
        console.log('Current Doctor ID:', currentDoctorId);
        console.log('Selected Doctors:', selectedDoctors);
        
        // Get patient UHID from IPD admission
        const { data: ipdData, error: ipdError } = await supabase
          .from('ipd_admissions')
          .select('uhid')
          .eq('ipd_no', resolvedParams.uhid)
          .single();

        if (ipdError) {
          console.error('Error fetching patient UHID:', ipdError);
          throw new Error('Could not fetch patient information');
        }

        const patientUhid = ipdData.uhid;
        
        const referrals = selectedDoctors.map(doctorId => {
          const doctor = staffList.find(s => s.id === doctorId);
          const referralData = {
            ipd_no: resolvedParams.uhid,
            referred_by_id: currentDoctorId, // Use the doctor ID from IPD admission
            referred_to_id: doctorId,
            department: doctor?.department || '',
            assessment_note: currentAssessment.assessment_note || '',
            advice: currentAssessment.advice || '',
            recommended_procedures: currentAssessment.recommended_procedures || '',
            recommended_meds: currentAssessment.recommended_meds || '',
            status: 'pending',
            priority: currentAssessment.priority || 'normal'
          };
          console.log('Creating referral with data:', referralData);
          return referralData;
        });

        const { error } = await supabase
          .from('referred_assessments')
          .insert(referrals);

        if (error) throw error;

        // Create appointments and OPD visits for each referred doctor
        console.log('Starting appointment and OPD visit creation for doctors:', selectedDoctors);
        console.log('Patient UHID:', patientUhid);
        
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const createdOpdVisits = [];

        for (const doctorId of selectedDoctors) {
          const doctor = staffList.find(s => s.id === doctorId);
          
          // 1. Create appointment for this doctor
          const appointmentPayload = {
            uhid: patientUhid,
            doctor_id: doctorId,
            department_id: null, // We don't have department info in referral context
            sub_department_id: null,
            appointment_date: today,
            reason: `Referred by ${staffList.find(s => s.id === currentDoctorId)?.full_name || 'Unknown'} - ${currentAssessment.assessment_note || 'No specific complaint'}`,
            status: "pending"
          };

          console.log(`Creating appointment for doctor ${doctorId}:`, appointmentPayload);
          
          const { data: appointmentData, error: appointmentError } = await supabase
            .from("appointments")
            .insert([appointmentPayload])
            .select()
            .single();

          if (appointmentError) {
            console.error(`Error creating appointment for doctor ${doctorId}:`, appointmentError);
            continue; // Skip this doctor but continue with others
          }

          // 2. Create OPD visit with correct format
          const opdPrefix = `OPD-${today.replace(/-/g, '')}-`;
          const { data: existingOpdData } = await supabase
            .from("opd_visits")
            .select("opd_no")
            .ilike("opd_no", `${opdPrefix}%`);

          let maxOpdNum = 0;
          if (existingOpdData && existingOpdData.length > 0) {
            existingOpdData.forEach((row: any) => {
              const match = row.opd_no.match(/(\d{4})$/)
              if (match) {
                const num = parseInt(match[1], 10)
                if (num > maxOpdNum) maxOpdNum = num
              }
            });
          }
          
          const nextOpdNum = (maxOpdNum + 1).toString().padStart(4, "0");
          const opd_no = `${opdPrefix}${nextOpdNum}`;

          const opdVisitPayload = {
            opd_no,
            uhid: patientUhid,
            appointment_id: appointmentData.id,
            visit_date: today
          };

          console.log(`Creating OPD visit for doctor ${doctorId}:`, opdVisitPayload);

          const { data: opdVisitData, error: opdVisitError } = await supabase
            .from("opd_visits")
            .insert([opdVisitPayload])
            .select()
            .single();

          if (opdVisitError) {
            console.error(`Error creating OPD visit for doctor ${doctorId}:`, opdVisitError);
            continue; // Skip this doctor but continue with others
          }

          createdOpdVisits.push({
            doctor: doctor?.full_name || 'Unknown Doctor',
            opd_no: opd_no,
            appointment_id: appointmentData.id
          });

          console.log(`Successfully created appointment and OPD visit for doctor ${doctorId}:`, { appointmentData, opdVisitData });
        }

        if (createdOpdVisits.length > 0) {
          console.log('Successfully created OPD visits:', createdOpdVisits);
          
          // Show success popup with OPD numbers for each referred doctor
          toast({
            title: "OPD Visits Created Successfully",
            description: (
              <div className="space-y-2">
                <p>New OPD visits have been created for the referred doctors:</p>
                <div className="bg-green-50 p-3 rounded border">
                  {createdOpdVisits.map((visit, index) => (
                    <div key={visit.opd_no} className="text-sm">
                      <strong>{visit.doctor}</strong>: {visit.opd_no}
                    </div>
                  ))}
                </div>
              </div>
            ),
            variant: "default",
          });
          
          // Show the general referral success toast after a longer delay
          // This gives user time to read the OPD details first
          setTimeout(() => {
            toast({
              title: "Success",
              description: currentAssessment.id ? "Referral updated successfully." : "Referrals created successfully.",
            });
          }, 4000); // 4 seconds delay - enough time to read OPD details
        } else {
          console.log('No OPD visits were created successfully');
          toast({
            title: "Warning",
            description: "Referral created but failed to create OPD visits. Please create OPD visits manually.",
            variant: "destructive",
          });
          
          // Show the general referral success toast after a delay
          setTimeout(() => {
            toast({
              title: "Success",
              description: currentAssessment.id ? "Referral updated successfully." : "Referrals created successfully.",
            });
          }, 3000); // 3 seconds delay for warning case
        }
      }

      setCurrentAssessment(null);
      setSelectedDoctors([]);
      loadReferredAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save referral.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Referred Doctors Assessment</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { width: 100px; height: auto; }
          .patient-info { margin-bottom: 20px; }
          .patient-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .assessment { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; }
          .assessment-header { font-weight: bold; margin-bottom: 10px; }
          .status-badge { 
            display: inline-block; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold; 
          }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-completed { background-color: #d1fae5; color: #065f46; }
          .status-declined { background-color: #fee2e2; color: #991b1b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/my-logo.png" alt="Logo" class="logo">
          <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE</h1>
          <h2>Referred Doctors Assessment</h2>
        </div>
        
        <div class="patient-info">
          <div class="patient-row">
            <strong>Patient Name:</strong> ${patientData?.full_name || 'N/A'}
            <strong>Age:</strong> ${patientData?.age || 'N/A'}
            <strong>Gender:</strong> ${patientData?.sex || 'N/A'}
          </div>
          <div class="patient-row">
            <strong>Bed No:</strong> ${patientData?.bed_number || 'N/A'}
            <strong>UHID No:</strong> ${patientData?.uhid || 'N/A'}
            <strong>IP No:</strong> ${patientData?.ipd_no || 'N/A'}
          </div>
        </div>

        ${assessments.map(assessment => `
          <div class="assessment">
            <div class="assessment-header">
              Referred to: ${assessment.referred_to_name || 'N/A'} (${assessment.department})
              <span class="status-badge status-${assessment.status}">${assessment.status.toUpperCase()}</span>
            </div>
            <p><strong>Referred by:</strong> ${assessment.referred_by_name || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(assessment.created_at).toLocaleDateString()}</p>
            <p><strong>Priority:</strong> ${assessment.priority.toUpperCase()}</p>
            
            <h4>Original Assessment:</h4>
            <p><strong>Assessment Note:</strong> ${assessment.assessment_note || 'N/A'}</p>
            <p><strong>Advice:</strong> ${assessment.advice || 'N/A'}</p>
            <p><strong>Recommended Procedures:</strong> ${assessment.recommended_procedures || 'N/A'}</p>
            <p><strong>Recommended Medications:</strong> ${assessment.recommended_meds || 'N/A'}</p>
            
            ${assessment.response_assessment ? `
              <h4>Response:</h4>
              <p><strong>Response Assessment:</strong> ${assessment.response_assessment}</p>
              <p><strong>Response Advice:</strong> ${assessment.response_advice || 'N/A'}</p>
              <p><strong>Response Procedures:</strong> ${assessment.response_procedures || 'N/A'}</p>
              <p><strong>Response Medications:</strong> ${assessment.response_medications || 'N/A'}</p>
              <p><strong>Follow-up Date:</strong> ${assessment.follow_up_date || 'N/A'}</p>
            ` : '<p><em>No response yet</em></p>'}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'accepted': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResponseTime = (createdAt: string, responseAt?: string) => {
    const created = new Date(createdAt);
    const responded = responseAt ? new Date(responseAt) : new Date();
    const diffHours = Math.floor((responded.getTime() - created.getTime()) / (1000 * 60 * 60));
    return diffHours;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Referred Doctors</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage patient referrals to other doctors</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleAddAssessment} disabled={staffList.length === 0} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Referral
          </Button>
          <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

             {/* Patient Info Card */}
       {patientData && (
         <Card className="mb-6">
           <CardHeader>
             <CardTitle>Patient Information</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
               <div>
                 <Label className="text-xs sm:text-sm font-medium">Name</Label>
                 <p className="text-xs sm:text-sm text-gray-600 break-words">{patientData.full_name}</p>
               </div>
               <div>
                 <Label className="text-xs sm:text-sm font-medium">Age</Label>
                 <p className="text-xs sm:text-sm text-gray-600">{patientData.age} years</p>
               </div>
               <div>
                 <Label className="text-xs sm:text-sm font-medium">Gender</Label>
                 <p className="text-xs sm:text-sm text-gray-600">{patientData.sex}</p>
               </div>
               <div>
                 <Label className="text-xs sm:text-sm font-medium">Bed No</Label>
                 <p className="text-xs sm:text-sm text-gray-600">{patientData.bed_number}</p>
               </div>
               <div>
                 <Label className="text-xs sm:text-sm font-medium">UHID</Label>
                 <p className="text-xs sm:text-sm text-gray-600 break-all">{patientData.uhid}</p>
               </div>
               <div>
                 <Label className="text-xs sm:text-sm font-medium">IP No</Label>
                 <p className="text-xs sm:text-sm text-gray-600 break-all">{patientData.ipd_no}</p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}

             {/* Form */}
       {currentAssessment && (
         <Card className="mb-6">
           <CardHeader>
             <CardTitle>
               {currentAssessment.id ? 'Edit Referral' : 'Add New Referral'}
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 gap-4">
               <div>
                 <Label htmlFor="doctors">Referred To Doctor(s)</Label>
                 <Select
                   value={selectedDoctors[0] || ''}
                   onValueChange={(value) => setSelectedDoctors([value])}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select doctor(s)" />
                   </SelectTrigger>
                   <SelectContent>
                     {staffList.map((staff) => (
                       <SelectItem key={staff.id} value={staff.id}>
                         {staff.full_name} ({staff.department})
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <p className="text-xs sm:text-sm text-gray-500 mt-1">
                   Note: For editing, only one doctor can be selected. For new referrals, you can create multiple by adding them one by one.
                 </p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="department">Department</Label>
                   <Input
                     id="department"
                     value={currentAssessment.department || ''}
                     onChange={(e) => setCurrentAssessment({
                       ...currentAssessment,
                       department: e.target.value
                     })}
                     placeholder="Department"
                   />
                 </div>

                 <div>
                   <Label htmlFor="priority">Priority</Label>
                   <Select
                     value={currentAssessment.priority || 'normal'}
                     onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                       setCurrentAssessment({...currentAssessment, priority: value})
                     }
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="low">Low</SelectItem>
                       <SelectItem value="normal">Normal</SelectItem>
                       <SelectItem value="high">High</SelectItem>
                       <SelectItem value="urgent">Urgent</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div>
                 <Label htmlFor="assessment_note">Assessment Note</Label>
                 <Textarea
                   id="assessment_note"
                   value={currentAssessment.assessment_note || ''}
                   onChange={(e) => setCurrentAssessment({
                     ...currentAssessment,
                     assessment_note: e.target.value
                   })}
                   placeholder="Enter assessment note"
                   rows={3}
                 />
               </div>

               <div>
                 <Label htmlFor="advice">Advice</Label>
                 <Textarea
                   id="advice"
                   value={currentAssessment.advice || ''}
                   onChange={(e) => setCurrentAssessment({
                     ...currentAssessment,
                     advice: e.target.value
                   })}
                   placeholder="Enter advice"
                   rows={2}
                 />
               </div>

               <div>
                 <Label htmlFor="recommended_procedures">Recommended Procedures</Label>
                 <Textarea
                   id="recommended_procedures"
                   value={currentAssessment.recommended_procedures || ''}
                   onChange={(e) => setCurrentAssessment({
                     ...currentAssessment,
                     recommended_procedures: e.target.value
                   })}
                   placeholder="Enter recommended procedures"
                   rows={2}
                 />
               </div>

               <div>
                 <Label htmlFor="recommended_meds">Recommended Medications</Label>
                 <Textarea
                   id="recommended_meds"
                   value={currentAssessment.recommended_meds || ''}
                   onChange={(e) => setCurrentAssessment({
                     ...currentAssessment,
                     recommended_meds: e.target.value
                   })}
                   placeholder="Enter recommended medications"
                   rows={2}
                 />
               </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-2 mt-4">
               <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                 {saving ? 'Saving...' : (currentAssessment.id ? 'Update' : 'Save')}
               </Button>
               <Button 
                 variant="outline" 
                 onClick={() => {
                   setCurrentAssessment(null);
                   setSelectedDoctors([]);
                 }}
                 className="w-full sm:w-auto"
               >
                 Cancel
               </Button>
             </div>
           </CardContent>
         </Card>
       )}

             {/* Warning if no staff available */}
       {staffList.length === 0 && (
         <Card className="mb-6 border-yellow-200 bg-yellow-50">
           <CardContent className="pt-6">
             <div className="flex items-center gap-2 text-yellow-800">
               <AlertCircle className="h-4 w-4 flex-shrink-0" />
               <p className="text-sm">No staff members available. Please check your database connection.</p>
             </div>
           </CardContent>
         </Card>
       )}

             {/* Assessments List */}
       <div className="space-y-4">
         {assessments.map((assessment) => (
           <Card key={assessment.id}>
             <CardHeader>
               <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                 <div className="flex-1 min-w-0">
                   <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                     {getStatusIcon(assessment.status)}
                     <span className="truncate">{assessment.referred_to_name || 'Unknown Doctor'}</span>
                     <div className="flex flex-wrap gap-1">
                       <Badge className={`${getStatusColor(assessment.status)} text-xs`}>
                         {assessment.status.toUpperCase()}
                       </Badge>
                       <Badge className={`${getPriorityColor(assessment.priority)} text-xs`}>
                         {assessment.priority.toUpperCase()}
                       </Badge>
                     </div>
                   </CardTitle>
                   <p className="text-xs sm:text-sm text-gray-600 mt-1">
                     Department: {assessment.department}
                   </p>
                 </div>
                 <div className="flex gap-2 flex-shrink-0">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleEditAssessment(assessment)}
                   >
                     <Edit className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleRemoveAssessment(assessment.id)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
                         <CardContent>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                 <div>
                   <Label className="text-xs sm:text-sm font-medium">Referred by:</Label>
                   <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.referred_by_name || 'N/A'}</p>
                 </div>
                 <div>
                   <Label className="text-xs sm:text-sm font-medium">Date:</Label>
                   <p className="text-xs sm:text-sm text-gray-600">
                     {new Date(assessment.created_at).toLocaleDateString()}
                   </p>
                 </div>
                 {assessment.status === 'pending' && (
                   <div>
                     <Label className="text-xs sm:text-sm font-medium">Awaiting Response:</Label>
                     <p className="text-xs sm:text-sm text-gray-600">
                       {getResponseTime(assessment.created_at)} hours
                     </p>
                   </div>
                 )}
                 {assessment.response_at && (
                   <div>
                     <Label className="text-xs sm:text-sm font-medium">Response Time:</Label>
                     <p className="text-xs sm:text-sm text-gray-600">
                       {getResponseTime(assessment.created_at, assessment.response_at)} hours
                     </p>
                   </div>
                 )}
               </div>

                             <div className="space-y-3">
                 <div>
                   <Label className="text-xs sm:text-sm font-medium">Assessment Note:</Label>
                   <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.assessment_note || 'N/A'}</p>
                 </div>
                 <div>
                   <Label className="text-xs sm:text-sm font-medium">Advice:</Label>
                   <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.advice || 'N/A'}</p>
                 </div>
                 <div>
                   <Label className="text-xs sm:text-sm font-medium">Recommended Procedures:</Label>
                   <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.recommended_procedures || 'N/A'}</p>
                 </div>
                 <div>
                   <Label className="text-xs sm:text-sm font-medium">Recommended Medications:</Label>
                   <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.recommended_meds || 'N/A'}</p>
                 </div>

                 {assessment.response_assessment && (
                   <>
                     <div className="border-t pt-3">
                       <h4 className="font-medium text-green-700 mb-2 text-sm sm:text-base">Response:</h4>
                       <div className="space-y-2">
                         <div>
                           <Label className="text-xs sm:text-sm font-medium">Response Assessment:</Label>
                           <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.response_assessment}</p>
                         </div>
                         <div>
                           <Label className="text-xs sm:text-sm font-medium">Response Advice:</Label>
                           <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.response_advice || 'N/A'}</p>
                         </div>
                         <div>
                           <Label className="text-xs sm:text-sm font-medium">Response Procedures:</Label>
                           <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.response_procedures || 'N/A'}</p>
                         </div>
                         <div>
                           <Label className="text-xs sm:text-sm font-medium">Response Medications:</Label>
                           <p className="text-xs sm:text-sm text-gray-600 break-words">{assessment.response_medications || 'N/A'}</p>
                         </div>
                         {assessment.follow_up_date && (
                           <div>
                             <Label className="text-xs sm:text-sm font-medium">Follow-up Date:</Label>
                             <p className="text-xs sm:text-sm text-gray-600">{assessment.follow_up_date}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </>
                 )}
               </div>
            </CardContent>
          </Card>
        ))}

                 {assessments.length === 0 && (
           <Card>
             <CardContent className="pt-6">
               <div className="text-center text-gray-500 text-sm sm:text-base">
                 No referrals found for this patient.
               </div>
             </CardContent>
           </Card>
         )}
      </div>
    </div>
  );
} 