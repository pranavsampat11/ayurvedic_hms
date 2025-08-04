"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Filter, Calendar, User, Phone, MapPin } from "lucide-react";

export default function IPDRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    ward: "",
    bed_number: "",
    admission_reason: "",
    deposit_amount: "",
    notes: ""
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("opd_to_ipd_requests")
      .select(`
        *,
        patient:uhid(full_name, age, gender, mobile, address),
        doctor:doctor_id(full_name),
        opd_visit:opd_no(opd_no, visit_date)
      `)
      .order("requested_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleApproveRequest = async (request: any) => {
    setSelectedRequest(request);
    setShowAdmissionModal(true);
  };

  const handleRejectRequest = async (requestId: number) => {
    const { error } = await supabase
      .from("opd_to_ipd_requests")
      .update({ 
        status: "rejected",
        approved_by: localStorage.getItem("userId"),
        approved_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Rejected", description: "IPD admission request has been rejected." });
      loadRequests();
    }
  };

  const handleCreateAdmission = async () => {
    if (!selectedRequest) return;

    const receptionistId = localStorage.getItem("userId");
    const ipdNo = `IPD-${Date.now()}`;

    // Create IPD admission
    const { error: admissionError } = await supabase
      .from("ipd_admissions")
      .insert([{
        ipd_no: ipdNo,
        opd_no: selectedRequest.opd_no,
        uhid: selectedRequest.uhid,
        admission_date: new Date().toISOString().split('T')[0],
        ward: admissionForm.ward,
        bed_number: admissionForm.bed_number,
        admission_reason: admissionForm.admission_reason,
        doctor_id: selectedRequest.doctor_id,
        deposit_amount: parseFloat(admissionForm.deposit_amount) || 0,
        status: "active"
      }]);

    if (admissionError) {
      toast({ title: "Error", description: admissionError.message, variant: "destructive" });
      return;
    }

    // Update request status
    const { error: requestError } = await supabase
      .from("opd_to_ipd_requests")
      .update({ 
        status: "approved",
        approved_by: receptionistId,
        approved_at: new Date().toISOString(),
        notes: admissionForm.notes
      })
      .eq("id", selectedRequest.id);

    if (requestError) {
      toast({ title: "Error", description: requestError.message, variant: "destructive" });
    } else {
      toast({ title: "Request Processed", description: `IPD admission processed with number: ${ipdNo}` });
      setShowAdmissionModal(false);
      setSelectedRequest(null);
      setAdmissionForm({
        ward: "",
        bed_number: "",
        admission_reason: "",
        deposit_amount: "",
        notes: ""
      });
      loadRequests();
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !search || 
      request.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      request.opd_no?.toLowerCase().includes(search.toLowerCase()) ||
      request.doctor?.full_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)); // Convert UTC to IST
    return {
      date: istDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">IPD Admission Requests</h1>
          <p className="text-slate-600 mt-1">Review and process IPD admission requests from doctors</p>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search patients, OPD no, doctors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full sm:w-64 bg-white border-slate-200 focus:border-blue-500"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200 focus:border-blue-500">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" defaultValue="all" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-800">{requests.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-800">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <CardTitle className="text-slate-800">IPD Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading requests...</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Patient</TableHead>
                      <TableHead className="font-semibold text-slate-700">OPD No</TableHead>
                      <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Requested At</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Notes</TableHead>
                      <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="text-slate-500">
                            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-lg font-medium">No requests found</p>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => {
                        const { date, time } = formatDateTime(request.requested_at);
                        return (
                          <TableRow key={request.id} className="hover:bg-slate-50">
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-800">{request.patient?.full_name}</div>
                                <div className="text-sm text-slate-600 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {request.patient?.age} / {request.patient?.gender}
                                </div>
                                <div className="text-sm text-slate-600 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {request.patient?.mobile}
                                </div>
                                {request.patient?.address && (
                                  <div className="text-sm text-slate-600 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-32">{request.patient.address}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-blue-600">{request.opd_no}</TableCell>
                            <TableCell className="font-medium text-slate-700">{request.doctor?.full_name}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-slate-800">{date}</div>
                                <div className="text-xs text-slate-600">{time}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm text-slate-600 truncate" title={request.notes || '-'}>
                                {request.notes || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {request.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleApproveRequest(request)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {request.status === "approved" && (
                                <Badge variant="default" className="bg-green-100 text-green-800">Admitted</Badge>
                              )}
                              {request.status === "rejected" && (
                                <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-slate-500">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-medium">No requests found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {filteredRequests.map((request) => {
                      const { date, time } = formatDateTime(request.requested_at);
                      return (
                        <Card key={request.id} className="bg-white border-slate-200 shadow-sm">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Patient Info */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-slate-800 text-lg">{request.patient?.full_name}</h3>
                                  {getStatusBadge(request.status)}
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {request.patient?.age} / {request.patient?.gender}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {request.patient?.mobile}
                                  </div>
                                  {request.patient?.address && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span className="truncate">{request.patient.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Request Details */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-slate-500">OPD No:</span>
                                  <div className="font-mono text-blue-600 font-medium">{request.opd_no}</div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Doctor:</span>
                                  <div className="font-medium text-slate-700">{request.doctor?.full_name}</div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Date:</span>
                                  <div className="font-medium text-slate-700">{date}</div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Time:</span>
                                  <div className="font-medium text-slate-700">{time}</div>
                                </div>
                              </div>

                              {/* Notes */}
                              {request.notes && (
                                <div>
                                  <span className="text-slate-500 text-sm">Notes:</span>
                                  <div className="text-sm text-slate-700 mt-1">{request.notes}</div>
                                </div>
                              )}

                              {/* Actions */}
                              {request.status === "pending" && (
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleApproveRequest(request)}
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="flex-1"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admission Modal */}
      <Dialog open={showAdmissionModal} onOpenChange={setShowAdmissionModal}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-slate-800">Process IPD Admission Request</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {/* Patient Info Section */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <Label className="text-sm font-medium text-slate-700">Patient</Label>
                <div className="text-sm text-slate-600 mt-1">
                  {selectedRequest?.patient?.full_name} ({selectedRequest?.patient?.age} / {selectedRequest?.patient?.gender})
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg">
                <Label className="text-sm font-medium text-slate-700">OPD No</Label>
                <div className="text-sm text-slate-600 mt-1 font-mono">{selectedRequest?.opd_no}</div>
              </div>
              
              {/* Form Fields */}
              <div>
                <Label htmlFor="ward" className="text-sm font-medium text-slate-700">Ward *</Label>
                <Input
                  id="ward"
                  value={admissionForm.ward}
                  onChange={(e) => setAdmissionForm(prev => ({ ...prev, ward: e.target.value }))}
                  placeholder="Enter ward"
                  className="mt-1 border-slate-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="bed_number" className="text-sm font-medium text-slate-700">Bed Number *</Label>
                <Input
                  id="bed_number"
                  value={admissionForm.bed_number}
                  onChange={(e) => setAdmissionForm(prev => ({ ...prev, bed_number: e.target.value }))}
                  placeholder="Enter bed number"
                  className="mt-1 border-slate-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="admission_reason" className="text-sm font-medium text-slate-700">Admission Reason *</Label>
                <Textarea
                  id="admission_reason"
                  value={admissionForm.admission_reason}
                  onChange={(e) => setAdmissionForm(prev => ({ ...prev, admission_reason: e.target.value }))}
                  placeholder="Enter admission reason"
                  className="mt-1 border-slate-200 focus:border-blue-500"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="deposit_amount" className="text-sm font-medium text-slate-700">Deposit Amount</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  value={admissionForm.deposit_amount}
                  onChange={(e) => setAdmissionForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                  placeholder="Enter deposit amount"
                  className="mt-1 border-slate-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-slate-700">Notes</Label>
                <Textarea
                  id="notes"
                  value={admissionForm.notes}
                  onChange={(e) => setAdmissionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  className="mt-1 border-slate-200 focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-shrink-0 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setShowAdmissionModal(false)} className="border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleCreateAdmission} className="bg-blue-600 hover:bg-blue-700">
              Process & Admit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 