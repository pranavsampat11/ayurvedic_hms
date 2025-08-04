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

interface Patient {
  uhid: string;
  full_name: string;
  age: number;
  gender: string;
  mobile: string;
  address: string;
}

interface ProcedureRequest {
  id: number;
  opd_no: string;
  ipd_no: string | null;
  procedure_entry_id: number;
  requirements: string;
  quantity: string;
  request_date: string;
  status: string;
  requested_by: string;
  notes: string;
  patient_name?: string;
  procedure_name?: string;
}

export default function PatientProcedureRequestsPage({ params }: { params: any }) {
  const paramsObj = React.use(params) as { uhid: string };
  const opdNo = paramsObj.uhid; // Actually OPD No
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [requests, setRequests] = useState<ProcedureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Form state
  const [requirements, setRequirements] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;

  useEffect(() => {
    loadData();
  }, [opdNo]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load patient data
      const { data: patientData, error: patientError } = await supabase
        .from("opd_visits")
        .select(`
          uhid,
          patients!inner (
            uhid,
            full_name,
            age,
            gender,
            mobile,
            address
          )
        `)
        .eq("opd_no", opdNo)
        .single();

      if (patientError) {
        console.error("Error loading patient:", patientError);
        return;
      }

      setPatient({
        uhid: patientData.uhid,
        full_name: patientData.patients.full_name,
        age: patientData.patients.age,
        gender: patientData.patients.gender,
        mobile: patientData.patients.mobile,
        address: patientData.patients.address,
      });

      // Load requests
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
      const { data, error } = await supabase
        .from("procedure_medicine_requirement_requests")
        .select(`
          *,
          procedure_entries!inner (
            procedure_name,
            opd_visits!inner (
              patients!inner (
                full_name
              )
            )
          )
        `)
        .eq("opd_no", opdNo)
        .order("request_date", { ascending: false });

      if (error) {
        console.error("Error loading requests:", error);
        return;
      }

      const formattedRequests = data.map((request: any) => ({
        id: request.id,
        opd_no: request.opd_no,
        ipd_no: request.ipd_no,
        procedure_entry_id: request.procedure_entry_id,
        requirements: request.requirements,
        quantity: request.quantity,
        request_date: request.request_date,
        status: request.status,
        requested_by: request.requested_by,
        notes: request.notes,
        patient_name: request.procedure_entries?.opd_visits?.patients?.full_name,
        procedure_name: request.procedure_entries?.procedure_name,
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requirements || !quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // First, create procedure entry
      const { data: procedureData, error: procedureError } = await supabase
        .from("procedure_entries")
        .insert({
          opd_no: opdNo,
          procedure_name: "Procedure Requirements Request",
          requirements: requirements,
          quantity: quantity,
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (procedureError) {
        console.error("Procedure insert error:", procedureError);
        throw procedureError;
      }

      // Then create procedure medicine requirement request
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          opd_no: opdNo,
          procedure_entry_id: procedureData.id,
          requirements: requirements,
          quantity: quantity,
          requested_by: doctorId,
          notes: notes,
          status: "pending",
        });

      if (requestError) {
        console.error("Request insert error:", requestError);
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Procedure requirements request submitted successfully",
      });

      // Reset form
      setRequirements("");
      setQuantity("");
      setNotes("");

      // Reload requests
      await loadRequests();

    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit procedure requirements request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to delete this procedure requirements request?")) {
      return;
    }

    try {
      // Delete the procedure medicine requirement request
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .delete()
        .eq("id", requestId);

      if (requestError) throw requestError;

      toast({
        title: "Success",
        description: "Procedure requirements request deleted successfully",
      });

      // Reload requests
      await loadRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Error",
        description: "Failed to delete procedure requirements request",
        variant: "destructive",
      });
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
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Rejected</Badge>;
      case "dispensed":
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Dispensed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requirements.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.procedure_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Procedure Requirements Requests</h1>
        {patient && (
          <div className="text-gray-600">
            <p><strong>Patient:</strong> {patient.full_name} ({patient.age} years, {patient.gender})</p>
            <p><strong>OPD No:</strong> {opdNo}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="requirements">Requirements (Medicines & Materials)</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Enter medicines and materials required..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 20 ml of oil, 1 tablet, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Requests History</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="dispensed">Dispensed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No procedure requirements requests found.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {request.procedure_name || "Procedure Requirements"}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Requirements:</strong> {request.requirements}
                          </p>
                          {request.quantity && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Quantity:</strong> {request.quantity}
                            </p>
                          )}
                          {request.notes && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Notes:</strong> {request.notes}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Requested on: {formatDate(request.request_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 