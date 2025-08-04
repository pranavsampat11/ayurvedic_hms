"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import DoctorDashboardLayout from "@/components/doctor-dashboard-layout";
import { 
  ArrowLeft,
  User, 
  Bed, 
  FileText, 
  Calendar,
  Heart,
  Pill,
  Stethoscope,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface PatientData {
  uhid: string;
  full_name: string;
  age: number;
  gender: string;
  mobile: string;
  address: string;
  created_at: string;
}

interface IPDAdmission {
  ipd_no: string;
  admission_date: string;
  discharge_date?: string;
  ward: string;
  bed_number: string;
  admission_reason: string;
  doctor_id: string;
  deposit_amount: number;
  status: string;
}

interface IPDCaseSheet {
  id: number;
  ipd_no: string;
  doctor_id: string;
  department: string;
  ward: string;
  bed_no: string;
  admission_at: string;
  discharge_at?: string;
  doa_time?: string;
  dod_time?: string;
  op_no?: string;
  ip_no?: string;
  age?: string;
  gender?: string;
  occupation?: string;
  address?: string;
  contact?: string;
  present_complaints: string;
  associated_complaints?: string;
  past_history: string;
  personal_history?: string;
  obs_gyn_history?: string;
  previous_medicine_history?: string;
  family_history?: string;
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
  general_examination: any;
  dasavidha_pariksha?: any;
  asthasthana_pariksha?: any;
  systemic_examination: any;
  local_examination?: string;
  sampraptighataka?: any;
  pain_assessment?: string;
  investigations?: string;
  diagnosis: string;
  nutritional_status?: string;
  treatment_plan: string;
  preventive_aspects?: string;
  rehabilitation?: string;
  desired_outcome?: string;
  created_at: string;
  updated_at: string;
}

interface DailyAssessment {
  id: number;
  date: string;
  time?: string;
  assessment: string;
  advice: string;
}

interface VitalSigns {
  id: number;
  date_time: string;
  temperature: number;
  pulse: number;
  respiratory_rate: number;
  bp: string;
}

interface Medication {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  prescribed_by?: string;
  created_at?: string;
}

interface Procedure {
  id: number;
  ipd_no: string;
  procedure_name: string;
  requirements?: string;
  quantity?: string;
  start_date?: string;
  end_date?: string;
  therapist?: string;
  created_at?: string;
}

interface ReferralInfo {
  id: number;
  referred_by_id: string;
  referred_to_id: string;
  department: string;
  assessment_note: string;
  advice: string;
  status: string;
  created_at: string;
  referred_by_name?: string;
  referred_to_name?: string;
}

export default function ViewOnlyIPDPatientPage() {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [ipdAdmission, setIpdAdmission] = useState<IPDAdmission | null>(null);
  const [caseSheet, setCaseSheet] = useState<IPDCaseSheet | null>(null);
  const [dailyAssessments, setDailyAssessments] = useState<DailyAssessment[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>('');
  
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const uhid = params.uhid as string;

  useEffect(() => {
    const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
    if (doctorId) {
      setCurrentDoctorId(doctorId);
    }
  }, []);

  useEffect(() => {
    if (currentDoctorId && uhid) {
      checkAccessAndLoadData();
    }
  }, [currentDoctorId, uhid]);

  const checkAccessAndLoadData = async () => {
    try {
      // Check if the current doctor has access to this patient via referral
      // Allow access if doctor is either the referred_to OR referred_by
      const { data: referralData, error: referralError } = await supabase
        .from('referred_assessments')
        .select(`
          *,
          referred_by:staff!referred_assessments_referred_by_id_fkey(full_name),
          referred_to:staff!referred_assessments_referred_to_id_fkey(full_name)
        `)
        .or(`referred_to_id.eq.${currentDoctorId},referred_by_id.eq.${currentDoctorId}`)
        .maybeSingle();

      console.log('Access check - Current Doctor ID:', currentDoctorId);
      console.log('Access check - Patient UHID:', uhid);
      console.log('Access check - Referral Data:', referralData);
      console.log('Access check - Referral Error:', referralError);

      // If no referral found, check if this doctor has any referral for this patient
      if (!referralData || referralError) {
        // Try to find any referral for this patient where the current doctor is involved
        const { data: patientReferralData, error: patientReferralError } = await supabase
          .from('referred_assessments')
          .select(`
            *,
            referred_by:staff!referred_assessments_referred_by_id_fkey(full_name),
            referred_to:staff!referred_assessments_referred_to_id_fkey(full_name)
          `)
          .or(`ipd_no.eq.${uhid},opd_no.eq.${uhid}`)
          .or(`referred_to_id.eq.${currentDoctorId},referred_by_id.eq.${currentDoctorId}`)
          .maybeSingle();

        console.log('Patient referral check - Data:', patientReferralData);
        console.log('Patient referral check - Error:', patientReferralError);

        if (patientReferralData && !patientReferralError) {
          setReferralInfo({
            ...patientReferralData,
            referred_by_name: patientReferralData.referred_by?.full_name,
            referred_to_name: patientReferralData.referred_to?.full_name
          });
          setAccessGranted(true);
          await logAccess(patientReferralData.id);
          await loadPatientData();
          return;
        }
      }

      if (referralError || !referralData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this patient's details.",
          variant: "destructive",
        });
        router.push('/dashboard/doctor/referred-patients');
        return;
      }

      setReferralInfo({
        ...referralData,
        referred_by_name: referralData.referred_by?.full_name,
        referred_to_name: referralData.referred_to?.full_name
      });
      setAccessGranted(true);

      // Log access for audit trail
      await logAccess(referralData.id);

      // Load patient data
      await loadPatientData();
    } catch (error) {
      console.error('Error checking access:', error);
      toast({
        title: "Error",
        description: "Failed to verify access permissions.",
        variant: "destructive",
      });
      router.push('/dashboard/doctor/referred-patients');
    }
  };

  const logAccess = async (referralId: number) => {
    try {
      // Log the access in the referral record
      await supabase
        .from('referred_assessments')
        .update({
          response_at: new Date().toISOString(), // Update last access time
        })
        .eq('id', referralId);
    } catch (error) {
      console.error('Error logging access:', error);
      // Don't show error to user, just log it
    }
  };

  const loadPatientData = async () => {
    try {
      // Load patient basic info
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('uhid', uhid)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Load IPD admission details
      const { data: ipdData, error: ipdError } = await supabase
        .from('ipd_admissions')
        .select('*')
        .eq('uhid', uhid)
        .eq('status', 'active')
        .single();

      if (!ipdError && ipdData) {
        setIpdAdmission(ipdData);

        // Load IPD case sheet
        const { data: caseSheetData, error: caseSheetError } = await supabase
          .from('ipd_case_sheets')
          .select('*')
          .eq('ipd_no', ipdData.ipd_no)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!caseSheetError && caseSheetData) {
          setCaseSheet(caseSheetData);
        }

        // Load daily assessments
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('ipd_daily_assessments')
          .select('*')
          .eq('ipd_no', ipdData.ipd_no)
          .order('date', { ascending: false });

        if (!assessmentsError && assessmentsData) {
          setDailyAssessments(assessmentsData);
        }

        // Load vital signs
        const { data: vitalsData, error: vitalsError } = await supabase
          .from('bp_tpr_charts')
          .select('*')
          .eq('ipd_no', ipdData.ipd_no)
          .order('date_time', { ascending: false })
          .limit(10);

        if (!vitalsError && vitalsData) {
          setVitalSigns(vitalsData);
        }

        // Load medications
        const { data: medsData, error: medsError } = await supabase
          .from('internal_medications')
          .select('*')
          .eq('ipd_no', ipdData.ipd_no)
          .order('start_date', { ascending: false });

        if (!medsError && medsData) {
          setMedications(medsData);
        }

        // Load procedures
        const { data: procData, error: procError } = await supabase
          .from('procedure_entries')
          .select('*')
          .eq('ipd_no', ipdData.ipd_no)
          .order('start_date', { ascending: false });

        if (!procError && procData) {
          setProcedures(procData);
        }
      }

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast({
        title: "Error",
        description: "Failed to load patient data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'discharged': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getReferralStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderJsonData = (data: any, title: string) => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <label className="text-sm font-medium text-gray-600">{title}</label>
        <div className="bg-white p-3 rounded border">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="mb-2">
              <span className="font-medium text-gray-700">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: </span>
              <span className="text-gray-900">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DoctorDashboardLayout title="Patient Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patient details...</div>
        </div>
      </DoctorDashboardLayout>
    );
  }

  if (!accessGranted || !patient) {
    return (
      <DoctorDashboardLayout title="Access Denied">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to view this patient's details.</p>
            <Button onClick={() => router.push('/dashboard/doctor/referred-patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Referrals
            </Button>
          </div>
        </div>
      </DoctorDashboardLayout>
    );
  }

  return (
    <DoctorDashboardLayout title="Patient Details - View Only">
      <div className="space-y-6">
        {/* Header with Access Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">View-Only Access</span>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/doctor/referred-patients')}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Referrals
            </Button>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            You are viewing this patient's details as a referred doctor. All data is read-only.
          </p>
        </div>

        {/* Patient Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-lg font-semibold">{patient.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">UHID</label>
                <p className="font-mono text-lg">{patient.uhid}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Age/Gender</label>
                <p className="text-lg">{patient.age} years, {patient.gender}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Contact</label>
                <p className="text-lg">{patient.mobile}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-lg">{patient.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Registration Date</label>
                <p className="text-lg">{new Date(patient.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Information */}
        {referralInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Referral Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Referred By</label>
                  <p className="text-lg">{referralInfo.referred_by_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Referred To</label>
                  <p className="text-lg">{referralInfo.referred_to_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-lg">{referralInfo.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getReferralStatusColor(referralInfo.status)}>
                    {referralInfo.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Assessment Note</label>
                  <p className="text-lg">{referralInfo.assessment_note || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Advice</label>
                  <p className="text-lg">{referralInfo.advice || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* IPD Admission Details */}
        {ipdAdmission && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                IPD Admission Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">IPD Number</label>
                  <p className="font-mono text-lg">{ipdAdmission.ipd_no}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ward</label>
                  <p className="text-lg">{ipdAdmission.ward}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Bed Number</label>
                  <p className="text-lg">{ipdAdmission.bed_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Admission Date</label>
                  <p className="text-lg">{new Date(ipdAdmission.admission_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(ipdAdmission.status)}>
                    {ipdAdmission.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Deposit Amount</label>
                  <p className="text-lg">₹{ipdAdmission.deposit_amount}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-gray-600">Admission Reason</label>
                  <p className="text-lg">{ipdAdmission.admission_reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="case-sheet" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="case-sheet">Case Sheet</TabsTrigger>
            <TabsTrigger value="assessments">Daily Assessments</TabsTrigger>
            <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="procedures">Procedures</TabsTrigger>
          </TabsList>

          <TabsContent value="case-sheet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  IPD Case Sheet - Complete Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseSheet ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Department</label>
                        <p className="text-lg font-semibold">{caseSheet.department}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Created Date</label>
                        <p className="text-lg">{new Date(caseSheet.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Occupation</label>
                        <p className="text-lg">{caseSheet.occupation || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Complaints Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Complaints & History</h3>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Present Complaints</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.present_complaints || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Associated Complaints</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.associated_complaints || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Past History</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.past_history || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Personal History</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.personal_history || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Family History</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.family_history || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Previous Medicine History</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.previous_medicine_history || 'N/A'}</p>
                      </div>
                      
                      {caseSheet.obs_gyn_history && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Obstetric & Gynecological History</label>
                          <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.obs_gyn_history}</p>
                        </div>
                      )}
                    </div>

                    {/* Examination Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Examination</h3>
                      
                      {/* Vital Signs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Height</label>
                          <p className="text-lg">{caseSheet.height || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Weight</label>
                          <p className="text-lg">{caseSheet.weight || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">BMI</label>
                          <p className="text-lg">{caseSheet.bmi || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Pulse</label>
                          <p className="text-lg">{caseSheet.pulse || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Respiratory Rate</label>
                          <p className="text-lg">{caseSheet.rr || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Blood Pressure</label>
                          <p className="text-lg">{caseSheet.bp || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Respiratory System</label>
                          <p className="text-lg">{caseSheet.respiratory_system || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Cardiovascular System</label>
                          <p className="text-lg">{caseSheet.cvs || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Central Nervous System</label>
                          <p className="text-lg">{caseSheet.cns || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Nutritional Status</label>
                          <p className="text-lg capitalize">{caseSheet.nutritional_status || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Local Examination</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.local_examination || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Pain Assessment</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.pain_assessment || 'N/A'}</p>
                      </div>

                      {/* JSON Examination Data */}
                      {renderJsonData(caseSheet.general_examination, 'General Examination')}
                      {renderJsonData(caseSheet.systemic_examination, 'Systemic Examination')}
                      {renderJsonData(caseSheet.dasavidha_pariksha, 'Dasavidha Pariksha')}
                      {renderJsonData(caseSheet.asthasthana_pariksha, 'Asthasthana Pariksha')}
                      {renderJsonData(caseSheet.sampraptighataka, 'Sampraptighataka')}
                    </div>

                    {/* Investigations & Diagnosis */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Investigations & Diagnosis</h3>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Investigations</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.investigations || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Diagnosis</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.diagnosis || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Treatment Plan */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Treatment Plan</h3>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Treatment Plan</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.treatment_plan || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preventive Aspects</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.preventive_aspects || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Rehabilitation</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.rehabilitation || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Desired Outcome</label>
                        <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{caseSheet.desired_outcome || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No case sheet available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyAssessments.length > 0 ? (
                  <div className="space-y-4">
                    {dailyAssessments.map((assessment) => (
                      <div key={assessment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {new Date(assessment.date).toLocaleDateString()}
                          </span>
                          {assessment.time && (
                            <span className="text-sm text-gray-600">{assessment.time}</span>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Assessment</label>
                          <p className="whitespace-pre-wrap">{assessment.assessment}</p>
                        </div>
                        {assessment.advice && (
                          <div className="mt-2">
                            <label className="text-sm font-medium text-gray-600">Advice</label>
                            <p className="whitespace-pre-wrap">{assessment.advice}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No daily assessments available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vitalSigns.length > 0 ? (
                  <div className="space-y-4">
                    {vitalSigns.map((vital) => (
                      <div key={vital.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {new Date(vital.date_time).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(vital.date_time).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Temperature</label>
                            <p className="text-lg">{vital.temperature}°C</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Pulse</label>
                            <p className="text-lg">{vital.pulse} bpm</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Respiratory Rate</label>
                            <p className="text-lg">{vital.respiratory_rate} /min</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Blood Pressure</label>
                            <p className="text-lg">{vital.bp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No vital signs recorded.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medications.length > 0 ? (
                  <div className="space-y-4">
                    {medications.map((medication) => (
                      <div key={medication.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Medication</label>
                            <p className="text-lg font-medium">{medication.medication_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Dosage</label>
                            <p className="text-lg">{medication.dosage}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Frequency</label>
                            <p className="text-lg">{medication.frequency}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Start Date</label>
                            <p className="text-lg">{new Date(medication.start_date).toLocaleDateString()}</p>
                          </div>
                          {medication.end_date && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">End Date</label>
                              <p className="text-lg">{new Date(medication.end_date).toLocaleDateString()}</p>
                            </div>
                          )}
                          {medication.notes && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-600">Notes</label>
                              <p className="whitespace-pre-wrap">{medication.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No medications prescribed.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedures" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Procedures
                </CardTitle>
              </CardHeader>
              <CardContent>
                {procedures.length > 0 ? (
                  <div className="space-y-4">
                    {procedures.map((procedure) => (
                      <div key={procedure.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Procedure Name</label>
                            <p className="text-lg font-semibold">{procedure.procedure_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Quantity</label>
                            <p className="text-lg">{procedure.quantity || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Therapist</label>
                            <p className="text-lg">{procedure.therapist || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Start Date</label>
                            <p className="text-lg">{procedure.start_date ? new Date(procedure.start_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">End Date</label>
                            <p className="text-lg">{procedure.end_date ? new Date(procedure.end_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Created Date</label>
                            <p className="text-lg">{procedure.created_at ? new Date(procedure.created_at).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {procedure.requirements && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-600">Requirements</label>
                            <p className="text-lg whitespace-pre-wrap bg-white p-3 rounded border">{procedure.requirements}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No procedures prescribed.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorDashboardLayout>
  );
}