"use client";

import { useState, useEffect } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Eye,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDummyPatient, getDummyMedications, getDummyMedicationRequests } from "@/lib/dummy";

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
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export default function PatientMedicationRequestsPage({ params }: { params: any }) {
  const paramsObj = React.use(params) as { uhid: string };
  const opdNo = paramsObj.uhid; // Actually OPD No
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Form state
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medicationResults, setMedicationResults] = useState<Medication[]>([]);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;

  useEffect(() => {
    loadData();
  }, [opdNo]);

  // Debounced search for medications
  useEffect(() => {
    if (medicationSearch.length < 2) { 
      setMedicationResults([]); 
      return; 
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("medications")
        .select("*")
        .ilike("product_name", `%${medicationSearch}%`)
        .order("product_name");
      setMedicationResults(data || []);
    };
    fetch();
  }, [medicationSearch]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Use the same pattern as other pages - single query with joins
      const { data: opdVisit, error: opdError } = await supabase
        .from("opd_visits")
        .select("*, patient:uhid(full_name, age, gender, mobile, address), appointment:appointment_id(doctor_id, doctor:doctor_id(full_name))")
        .eq("opd_no", opdNo)
        .single();

      if (opdError || !opdVisit) {
        const dummy = getDummyPatient(opdNo);
        setPatient(dummy as any);
      } else {
        setPatient({
          ...opdVisit.patient,
          uhid: opdVisit.uhid,
          opd_no: opdVisit.opd_no,
          doctor_id: opdVisit.appointment?.doctor_id,
          doctor_name: opdVisit.appointment?.doctor?.full_name
        });
      }

      // Load available medications
      const { data: medicationsData, error: medicationsError } = await supabase
        .from("medications")
        .select("*")
        .order("product_name");

      if (medicationsError) {
        setMedications(getDummyMedications());
      } else {
        setMedications(medicationsData || getDummyMedications());
      }

      // Load existing requests for this patient
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
      // Get requests for this specific patient
      const { data: requestsData, error: requestsError } = await supabase
        .from("medication_dispense_requests")
        .select(`
          *,
          internal_medication:medication_id(
            medication_name,
            dosage,
            frequency,
            start_date,
            end_date,
            notes
          )
        `)
        .eq("opd_no", opdNo)
        .order("request_date", { ascending: false });

      if (requestsError) {
        console.error("Requests error:", requestsError);
        throw requestsError;
      }

      // Process and enrich the data
      const enrichedRequests = (requestsData || []).map((request) => ({
        ...request,
        patient_name: patient?.full_name || "",
        medication_name: request.internal_medication?.medication_name || "",
        dosage: request.internal_medication?.dosage || "",
        frequency: request.internal_medication?.frequency || "",
        start_date: request.internal_medication?.start_date || "",
        end_date: request.internal_medication?.end_date || "",
        notes: request.internal_medication?.notes || "",
      }));

      setRequests((enrichedRequests && enrichedRequests.length > 0) ? enrichedRequests : getDummyMedicationRequests(opdNo));
    } catch (error) {
      console.error("Error loading requests:", error);
      setRequests(getDummyMedicationRequests(opdNo));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMedication || !dosage || !frequency || !startDate || !endDate) {
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
          opd_no: opdNo,
          medication_name: selectedMedication?.product_name,
          dosage,
          frequency,
          start_date: startDate,
          end_date: endDate,
          notes,
          prescribed_by: doctorId,
        })
        .select()
        .single();

      if (medicationError) {
        console.error("Medication insert error:", medicationError);
        throw medicationError;
      }

      // Then create medication dispense request
      const { error: requestError } = await supabase
        .from("medication_dispense_requests")
        .insert({
          opd_no: opdNo,
          medication_id: medicationData.id,
          status: "pending",
        });

      if (requestError) {
        console.error("Request insert error:", requestError);
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Medication request submitted successfully",
      });

      // Reset form
      setSelectedMedication(null);
      setMedicationSearch("");
      setDosage("");
      setFrequency("");
      setStartDate("");
      setEndDate("");
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

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to delete this medication request?")) {
      return;
    }

    try {
      // Delete the medication dispense request
      const { error: requestError } = await supabase
        .from("medication_dispense_requests")
        .delete()
        .eq("id", requestId);

      if (requestError) throw requestError;

      toast({
        title: "Success",
        description: "Medication request deleted successfully",
      });

      // Reload requests
      await loadRequests();

    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Error",
        description: "Failed to delete medication request",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Convert UTC to IST (UTC + 5:30)
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    
    return istDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
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
      request.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.dosage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.frequency?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Medication Requests</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medication Requests</h1>
          <p className="text-gray-600 mt-1">
            Patient: {patient?.full_name} ({opdNo})
          </p>
        </div>
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
                <Label htmlFor="patient">Patient</Label>
                                  <Input
                    id="patient"
                    value={`${patient?.full_name} (${opdNo})`}
                    disabled
                    className="bg-gray-50"
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medication">Medication *</Label>
                <Input 
                  value={medicationSearch} 
                  onChange={e => setMedicationSearch(e.target.value)} 
                  placeholder="Type to search medication..." 
                />
                {medicationResults.length > 0 && (
                  <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                    {medicationResults.map(med => (
                      <li 
                        key={med.id} 
                        className="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-b-0" 
                        onClick={() => { 
                          setSelectedMedication(med); 
                          setMedicationSearch(med.product_name); 
                          setMedicationResults([]); 
                        }}
                      >
                        {med.product_name}
                      </li>
                    ))}
                  </ul>
                )}
                {selectedMedication && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <span className="text-sm font-medium text-blue-800">
                      Selected: {selectedMedication.product_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g., 20 ml"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Input
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g., twice a day before food"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional instructions or notes..."
                rows={3}
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
                  placeholder="Search by medication, dosage, or frequency..."
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
              <p>No medication requests found for this patient</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Medication</th>
                      <th className="text-left p-3 font-medium">Dosage</th>
                      <th className="text-left p-3 font-medium">Frequency</th>
                      <th className="text-left p-3 font-medium">Start Date</th>
                      <th className="text-left p-3 font-medium">End Date</th>
                      <th className="text-left p-3 font-medium">Request Date</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{request.medication_name}</div>
                          {request.notes && (
                            <div className="text-sm text-gray-500 mt-1">{request.notes}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.dosage}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.frequency}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.start_date}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.end_date}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{formatDate(request.request_date)}</div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === "pending" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteRequest(request.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
                        <div className="font-medium">{request.medication_name}</div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Dosage: {request.dosage}</div>
                        <div>Frequency: {request.frequency}</div>
                        <div>Start Date: {request.start_date}</div>
                        <div>End Date: {request.end_date}</div>
                        <div>Request Date: {formatDate(request.request_date)}</div>
                        {request.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium text-xs text-gray-500">Notes:</div>
                            <div className="text-sm">{request.notes}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {request.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteRequest(request.id)}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
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
  );
} 