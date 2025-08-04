"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DoctorDashboardLayout from "@/components/doctor-dashboard-layout";

interface Patient {
  uhid: string;
  full_name: string;
  age: number;
  gender: string;
  mobile: string;
  address: string;
}

interface Medication {
  id: number;
  product_name: string;
  current_stock: number;
  mrp: number;
}

interface MedicationRequest {
  id: number;
  opd_no: string;
  ipd_no: string | null;
  medication_id: number;
  request_date: string;
  status: string;
  patient_name?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
}

export default function MedicationRequestsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Form state
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedMedication, setSelectedMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load doctor's patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("opd_visits")
        .select(`
          uhid,
          patient:uhid(full_name, age, gender, mobile, address)
        `)
        .eq("appointment:appointment_id(doctor_id)", doctorId);

      if (patientsError) throw patientsError;

      const formattedPatients = (patientsData || []).map(p => ({
        uhid: p.uhid,
        full_name: (p.patient as any)?.full_name || "",
        age: (p.patient as any)?.age || 0,
        gender: (p.patient as any)?.gender || "",
        mobile: (p.patient as any)?.mobile || "",
        address: (p.patient as any)?.address || "",
      }));

      setPatients(formattedPatients);

      // Load available medications
      const { data: medicationsData, error: medicationsError } = await supabase
        .from("medications")
        .select("*")
        .order("product_name");

      if (medicationsError) throw medicationsError;
      setMedications(medicationsData || []);

      // Load existing requests
      await loadRequests();

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      // Get requests for doctor's patients
      const { data: requestsData, error: requestsError } = await supabase
        .from("medication_dispense_requests")
        .select(`
          *,
          internal_medication:medication_id(
            medication_name,
            dosage,
            frequency
          )
        `)
        .in("opd_no", patients.map(p => p.uhid))
        .order("request_date", { ascending: false });

      if (requestsError) throw requestsError;

      // Process and enrich the data
      const enrichedRequests = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Get patient name from OPD visit
          const { data: opdData } = await supabase
            .from("opd_visits")
            .select("uhid, patient:uhid(full_name)")
            .eq("opd_no", request.opd_no)
            .single();

          return {
            ...request,
            patient_name: (opdData?.patient as any)?.full_name || "",
            medication_name: request.internal_medication?.medication_name || "",
            dosage: request.internal_medication?.dosage || "",
            frequency: request.internal_medication?.frequency || "",
          };
        })
      );

      setRequests(enrichedRequests);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedMedication || !dosage || !frequency) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // First, create internal medication entry
      const { data: medicationData, error: medicationError } = await supabase
        .from("internal_medications")
        .insert({
          opd_no: selectedPatient,
          medication_name: medications.find(m => m.id.toString() === selectedMedication)?.product_name,
          dosage,
          frequency,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          notes,
          prescribed_by: doctorId,
        })
        .select()
        .single();

      if (medicationError) throw medicationError;

      // Then create medication dispense request
      const { error: requestError } = await supabase
        .from("medication_dispense_requests")
        .insert({
          opd_no: selectedPatient,
          medication_id: medicationData.id,
          status: "pending",
        });

      if (requestError) throw requestError;

      toast({
        title: "Success",
        description: "Medication request submitted successfully",
      });

      // Reset form
      setSelectedPatient("");
      setSelectedMedication("");
      setDosage("");
      setFrequency("");
      setNotes("");

      // Reload requests
      await loadRequests();

    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit medication request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.opd_no?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DoctorDashboardLayout title="Medication Requests">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Medication Requests</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DoctorDashboardLayout>
    );
  }

  return (
    <DoctorDashboardLayout title="Medication Requests">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Medication Requests</h1>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* New Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Medication Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.uhid} value={patient.uhid}>
                          {patient.full_name} ({patient.uhid})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medication">Medication *</Label>
                  <Select value={selectedMedication} onValueChange={setSelectedMedication}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {medications.map((medication) => (
                        <SelectItem key={medication.id} value={medication.id.toString()}>
                          {medication.product_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Input
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="e.g., Twice daily"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional instructions..."
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by patient name, medication, or OPD number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Medication Requests ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No medication requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Patient</th>
                        <th className="text-left p-3 font-medium">OPD No</th>
                        <th className="text-left p-3 font-medium">Medication</th>
                        <th className="text-left p-3 font-medium">Dosage</th>
                        <th className="text-left p-3 font-medium">Frequency</th>
                        <th className="text-left p-3 font-medium">Request Date</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{request.patient_name}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-mono">{request.opd_no}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{request.medication_name}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">{request.dosage}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">{request.frequency}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">{formatDate(request.request_date)}</div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{request.patient_name}</div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>OPD No: {request.opd_no}</div>
                          <div>Medication: {request.medication_name}</div>
                          <div>Dosage: {request.dosage}</div>
                          <div>Frequency: {request.frequency}</div>
                          <div>Date: {formatDate(request.request_date)}</div>
                        </div>
                        <div className="pt-2">
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DoctorDashboardLayout>
  );
} 