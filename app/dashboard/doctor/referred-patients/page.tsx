"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import DoctorDashboardLayout from "@/components/doctor-dashboard-layout";
import { useRouter } from "next/navigation";
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  Calendar,
  Bed,
  FileText,
  Printer,
  Eye,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ReferredPatient {
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
  patient_name?: string;
  patient_age?: number;
  patient_sex?: string;
  bed_number?: string;
  uhid?: string;
  referral_type?: 'incoming' | 'outgoing';
}

interface DoctorStats {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  average_response_time: number;
}

export default function DoctorReferredPatientsPage() {
  const [referredPatients, setReferredPatients] = useState<ReferredPatient[]>([]);
  const [currentResponse, setCurrentResponse] = useState<Partial<ReferredPatient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorStats, setDoctorStats] = useState<DoctorStats>({
    total_referrals: 0,
    pending_referrals: 0,
    completed_referrals: 0,
    average_response_time: 0
  });
  const [currentDoctorId, setCurrentDoctorId] = useState<string>(''); // Will be set from localStorage
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'declined'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<ReferredPatient | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'patient_name' | 'status' | 'priority'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const router = useRouter();

  // Get current doctor ID from localStorage
  useEffect(() => {
    const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
    console.log("Current doctor ID from localStorage:", doctorId);
    if (doctorId) {
      setCurrentDoctorId(doctorId);
    }
  }, []);

  // Load referred patients for this doctor (both incoming and outgoing)
  const loadReferredPatients = async () => {
    try {
      // Fetch referrals where this doctor is the referred_to (incoming referrals)
      const { data: incomingData, error: incomingError } = await supabase
        .from('referred_assessments')
        .select(`
          *,
          referred_by:staff!referred_assessments_referred_by_id_fkey(full_name),
          referred_to:staff!referred_assessments_referred_to_id_fkey(full_name),
          ipd_admissions!referred_assessments_ipd_no_fkey(
            bed_number,
            uhid,
            patients!ipd_admissions_uhid_fkey(
              full_name,
              age,
              gender
            )
          ),
          opd_visits!referred_assessments_opd_no_fkey(
            patients!opd_visits_uhid_fkey(
              full_name,
              age,
              gender
            )
          )
        `)
        .eq('referred_to_id', currentDoctorId)
        .order('created_at', { ascending: false });

      // Fetch referrals where this doctor is the referred_by (outgoing referrals)
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('referred_assessments')
        .select(`
          *,
          referred_by:staff!referred_assessments_referred_by_id_fkey(full_name),
          referred_to:staff!referred_assessments_referred_to_id_fkey(full_name),
          ipd_admissions!referred_assessments_ipd_no_fkey(
            bed_number,
            uhid,
            patients!ipd_admissions_uhid_fkey(
              full_name,
              age,
              gender
            )
          ),
          opd_visits!referred_assessments_opd_no_fkey(
            patients!opd_visits_uhid_fkey(
              full_name,
              age,
              gender
            )
          )
        `)
        .eq('referred_by_id', currentDoctorId)
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;
      if (outgoingError) throw outgoingError;

      // Combine and transform the data
      const incomingReferrals = (incomingData || []).map((item: any) => ({
        ...item,
        patient_name: item.ipd_admissions?.patients?.full_name || item.opd_visits?.patients?.full_name,
        patient_age: item.ipd_admissions?.patients?.age || item.opd_visits?.patients?.age,
        patient_sex: item.ipd_admissions?.patients?.gender || item.opd_visits?.patients?.gender,
        bed_number: item.ipd_admissions?.bed_number,
        uhid: item.ipd_admissions?.uhid || item.opd_visits?.uhid,
        referral_type: 'incoming'
      }));

      const outgoingReferrals = (outgoingData || []).map((item: any) => ({
        ...item,
        patient_name: item.ipd_admissions?.patients?.full_name || item.opd_visits?.patients?.full_name,
        patient_age: item.ipd_admissions?.patients?.age || item.opd_visits?.patients?.age,
        patient_sex: item.ipd_admissions?.patients?.gender || item.opd_visits?.patients?.gender,
        bed_number: item.ipd_admissions?.bed_number,
        uhid: item.ipd_admissions?.uhid || item.opd_visits?.uhid,
        referral_type: 'outgoing'
      }));

      // Combine incoming and outgoing referrals
      const allReferrals = [...incomingReferrals, ...outgoingReferrals];
      
      // Add referred_by_name and referred_to_name to all referrals
      const allReferralsWithNames = allReferrals.map((item: any) => ({
        ...item,
        referred_by_name: item.referred_by?.full_name,
        referred_to_name: item.referred_to?.full_name
      }));

      setReferredPatients(allReferralsWithNames);

      // Calculate stats
      const stats: DoctorStats = {
        total_referrals: allReferralsWithNames.length,
        pending_referrals: allReferralsWithNames.filter(p => p.status === 'pending').length,
        completed_referrals: allReferralsWithNames.filter(p => p.status === 'completed').length,
        average_response_time: calculateAverageResponseTime(allReferralsWithNames)
      };
      setDoctorStats(stats);
    } catch (error) {
      console.error('Error loading referred patients:', error);
      toast({
        title: "Error",
        description: "Failed to load referred patients.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageResponseTime = (patients: ReferredPatient[]): number => {
    const completedReferrals = patients.filter(p => p.response_at);
    if (completedReferrals.length === 0) return 0;

    const totalHours = completedReferrals.reduce((sum, patient) => {
      const created = new Date(patient.created_at);
      const responded = new Date(patient.response_at!);
      const diffHours = Math.floor((responded.getTime() - created.getTime()) / (1000 * 60 * 60));
      return sum + diffHours;
    }, 0);

    return Math.round(totalHours / completedReferrals.length);
  };

  useEffect(() => {
    if (currentDoctorId) {
      loadReferredPatients();
    }
  }, [currentDoctorId]);

  const handleRespondToReferral = (patient: ReferredPatient) => {
    // Pre-populate the form with existing response data if available
    setCurrentResponse({
      id: patient.id,
      ipd_no: patient.ipd_no,
      opd_no: patient.opd_no,
      status: patient.status === 'pending' ? 'accepted' : patient.status,
      response_note: patient.response_note || '',
      response_assessment: patient.response_assessment || '',
      response_advice: patient.response_advice || '',
      response_procedures: patient.response_procedures || '',
      response_medications: patient.response_medications || '',
      follow_up_date: patient.follow_up_date || ''
    });
  };

  const handleSaveResponse = async () => {
    if (!currentResponse) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('referred_assessments')
        .update({
          status: currentResponse.status,
          response_at: new Date().toISOString(),
          response_note: currentResponse.response_note,
          response_assessment: currentResponse.response_assessment,
          response_advice: currentResponse.response_advice,
          response_procedures: currentResponse.response_procedures,
          response_medications: currentResponse.response_medications,
          follow_up_date: currentResponse.follow_up_date
        })
        .eq('id', currentResponse.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: currentResponse.response_assessment || currentResponse.response_advice ? 
          "Response updated successfully." : 
          "Response submitted successfully.",
      });

      setCurrentResponse(null);
      loadReferredPatients();
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Error",
        description: "Failed to save response.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAction = async (patientId: number, action: 'accept' | 'decline') => {
    try {
      const { error } = await supabase
        .from('referred_assessments')
        .update({
          status: action === 'accept' ? 'accepted' : 'declined',
          response_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Referral ${action}ed successfully.`,
      });

      loadReferredPatients();
    } catch (error) {
      console.error('Error updating referral:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} referral.`,
        variant: "destructive",
      });
    }
  };

  const handleViewPatientDetails = (patient: ReferredPatient) => {
    if (!patient.uhid) {
      toast({
        title: "Error",
        description: "Patient UHID not available for viewing details.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to view-only patient details page
    router.push(`/dashboard/doctor/referred-patients/${patient.uhid}/view`);
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

  // Filter and sort patients
  const filteredAndSortedPatients = referredPatients
    .filter(patient => {
      const matchesFilter = filterType === 'all' || patient.referral_type === filterType;
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        patient.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.referred_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.referred_to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.ipd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.opd_no?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'patient_name':
          aValue = a.patient_name || '';
          bValue = b.patient_name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: 'created_at' | 'patient_name' | 'status' | 'priority') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRowClick = (patient: ReferredPatient) => {
    setSelectedPatient(selectedPatient?.id === patient.id ? null : patient);
  };

  if (loading) {
    return (
      <DoctorDashboardLayout title="Referred Patients">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading referred patients...</div>
        </div>
      </DoctorDashboardLayout>
    );
  }

  return (
    <DoctorDashboardLayout title="Referred Patients">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Referred Patients</h1>
            <p className="text-sm sm:text-base text-gray-600">Incoming and outgoing patient referrals</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold">{doctorStats.total_referrals}</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{doctorStats.pending_referrals}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{doctorStats.completed_referrals}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold">{doctorStats.average_response_time}h</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by patient name, doctor name, department, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                All Referrals
              </Button>
              <Button
                variant={filterType === 'incoming' ? 'default' : 'outline'}
                onClick={() => setFilterType('incoming')}
                size="sm"
              >
                Incoming
              </Button>
              <Button
                variant={filterType === 'outgoing' ? 'default' : 'outline'}
                onClick={() => setFilterType('outgoing')}
                size="sm"
              >
                Outgoing
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All Status
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'accepted' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('accepted')}
                size="sm"
              >
                Accepted
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                size="sm"
              >
                Completed
              </Button>
            </div>
          </div>
        </div>

        {/* Response Form */}
        {currentResponse && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {currentResponse.response_assessment || currentResponse.response_advice ? 
                  'Update Response to Referral' : 
                  'Respond to Referral'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={currentResponse.status || 'accepted'}
                    onValueChange={(value: 'accepted' | 'completed' | 'declined') => 
                      setCurrentResponse({...currentResponse, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accepted">Accept</SelectItem>
                      <SelectItem value="completed">Complete</SelectItem>
                      <SelectItem value="declined">Decline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    type="date"
                    value={currentResponse.follow_up_date || ''}
                    onChange={(e) => setCurrentResponse({
                      ...currentResponse,
                      follow_up_date: e.target.value
                    })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="response_assessment">Assessment</Label>
                  <Textarea
                    value={currentResponse.response_assessment || ''}
                    onChange={(e) => setCurrentResponse({
                      ...currentResponse,
                      response_assessment: e.target.value
                    })}
                    placeholder="Your assessment of the patient"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="response_advice">Advice</Label>
                  <Textarea
                    value={currentResponse.response_advice || ''}
                    onChange={(e) => setCurrentResponse({
                      ...currentResponse,
                      response_advice: e.target.value
                    })}
                    placeholder="Your advice and recommendations"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="response_procedures">Recommended Procedures</Label>
                  <Textarea
                    value={currentResponse.response_procedures || ''}
                    onChange={(e) => setCurrentResponse({
                      ...currentResponse,
                      response_procedures: e.target.value
                    })}
                    placeholder="Procedures you recommend"
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="response_medications">Recommended Medications</Label>
                  <Textarea
                    value={currentResponse.response_medications || ''}
                    onChange={(e) => setCurrentResponse({
                      ...currentResponse,
                      response_medications: e.target.value
                    })}
                    placeholder="Medications you recommend"
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="response_note">Additional Notes</Label>
                  <Textarea
                    value={currentResponse.response_note || ''}
                    onChange={(e) => setCurrentResponse({
                      ...currentResponse,
                      response_note: e.target.value
                    })}
                    placeholder="Any additional notes or comments"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button onClick={handleSaveResponse} disabled={saving} className="w-full sm:w-auto">
                  {saving ? 'Saving...' : (currentResponse.response_assessment || currentResponse.response_advice ? 'Update Response' : 'Submit Response')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentResponse(null)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referred Patients Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('patient_name')}>
                      <div className="flex items-center gap-1">
                        Patient
                        {sortField === 'patient_name' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('priority')}>
                      <div className="flex items-center gap-1">
                        Priority
                        {sortField === 'priority' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === 'created_at' && (
                          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleRowClick(patient)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {getStatusIcon(patient.status)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.patient_name || 'Unknown Patient'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.patient_age} years, {patient.patient_sex}
                              {patient.bed_number && ` • Bed ${patient.bed_number}`}
                            </div>
                            <div className="text-xs text-gray-400">
                              {patient.ipd_no || patient.opd_no}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${
                          patient.referral_type === 'incoming' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-green-100 text-green-800 border-green-200'
                        } text-xs`}>
                          {patient.referral_type === 'incoming' ? 'INCOMING' : 'OUTGOING'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {patient.department}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge className={`${getStatusColor(patient.status)} text-xs`}>
                            {patient.status.toUpperCase()}
                          </Badge>
                          {patient.status === 'pending' && (
                            <span className="text-xs text-gray-500">
                              {getResponseTime(patient.created_at)}h ago
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${getPriorityColor(patient.priority)} text-xs`}>
                          {patient.priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPatientDetails(patient);
                            }}
                            disabled={!patient.uhid}
                            className="h-7 px-2 text-xs"
                          >
                            View Case Sheet
                          </Button>
                          
                          {patient.referred_to_id === currentDoctorId && patient.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(patient.id, 'accept');
                                }}
                                className="h-7 px-2 bg-green-600 hover:bg-green-700 text-xs"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAction(patient.id, 'decline');
                                }}
                                className="h-7 px-2 text-red-600 border-red-600 hover:bg-red-50 text-xs"
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                          
                          {patient.referred_to_id === currentDoctorId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespondToReferral(patient);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              Write Response
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Selected Patient Details Card */}
        {selectedPatient && (
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(selectedPatient.status)}
                  {selectedPatient.patient_name || 'Unknown Patient'} - Details
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPatient(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Referred by:</Label>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{selectedPatient.referred_by_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Referred to:</Label>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{selectedPatient.referred_to_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Department:</Label>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedPatient.department}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Date:</Label>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {new Date(selectedPatient.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedPatient.status === 'pending' && (
                  <div>
                    <Label className="text-sm font-medium">Awaiting Response:</Label>
                    <p className="text-sm text-gray-600">
                      {getResponseTime(selectedPatient.created_at)} hours
                    </p>
                  </div>
                )}
                {selectedPatient.response_at && (
                  <div>
                    <Label className="text-sm font-medium">Response Time:</Label>
                    <p className="text-sm text-gray-600">
                      {getResponseTime(selectedPatient.created_at, selectedPatient.response_at)} hours
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Assessment Note:</Label>
                  <p className="text-sm text-gray-600">{selectedPatient.assessment_note || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Advice:</Label>
                  <p className="text-sm text-gray-600">{selectedPatient.advice || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recommended Procedures:</Label>
                  <p className="text-sm text-gray-600">{selectedPatient.recommended_procedures || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recommended Medications:</Label>
                  <p className="text-sm text-gray-600">{selectedPatient.recommended_meds || 'N/A'}</p>
                </div>

                {selectedPatient.response_assessment && (
                  <>
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-green-700 mb-2">Your Response:</h4>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Assessment:</Label>
                          <p className="text-sm text-gray-600">{selectedPatient.response_assessment}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Advice:</Label>
                          <p className="text-sm text-gray-600">{selectedPatient.response_advice || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Procedures:</Label>
                          <p className="text-sm text-gray-600">{selectedPatient.response_procedures || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Medications:</Label>
                          <p className="text-sm text-gray-600">{selectedPatient.response_medications || 'N/A'}</p>
                        </div>
                        {selectedPatient.follow_up_date && (
                          <div>
                            <Label className="text-sm font-medium">Follow-up Date:</Label>
                            <p className="text-sm text-gray-600">{selectedPatient.follow_up_date}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

                 {/* Empty State */}
         {filteredAndSortedPatients.length === 0 && (
           <Card>
             <CardContent className="pt-6">
               <div className="text-center text-gray-500">
                 <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                 <p className="text-lg font-medium">No referrals found</p>
                 <p className="text-sm">
                   {filterType === 'all' 
                     ? 'No referrals found. Referrals from other doctors and your referrals to others will appear here.'
                     : filterType === 'incoming'
                     ? 'No incoming referrals found. Referrals from other doctors will appear here.'
                     : 'No outgoing referrals found. Your referrals to other doctors will appear here.'
                   }
                 </p>
               </div>
             </CardContent>
           </Card>
         )}
       </div>
     </DoctorDashboardLayout>
   );
 }  