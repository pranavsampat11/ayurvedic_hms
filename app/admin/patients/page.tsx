import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AdminPatientsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from("opd_to_ipd_requests")
        .select("*, patient:uhid(full_name, age, gender, mobile), doctor:doctor_id(full_name)")
        .eq("status", "pending");
      setRequests(data || []);
    }
    fetchRequests();
  }, []);

  const handleApprove = async (req: any) => {
    // Create IPD admission (minimal fields for now)
    const { error: ipdError } = await supabase.from("ipd_admissions").insert([
      {
        opd_no: req.opd_no,
        uhid: req.uhid,
        doctor_id: req.doctor_id,
        admission_date: new Date().toISOString().slice(0, 10),
        status: "active"
      }
    ]);
    if (ipdError) {
      toast({ title: "Admission Failed", description: ipdError.message, variant: "destructive" });
      return;
    }
    // Update request status
    await supabase.from("opd_to_ipd_requests").update({ status: "approved" }).eq("id", req.id);
    toast({ title: "Admission Approved", description: "Patient admitted as IPD." });
    setRequests(requests.filter(r => r.id !== req.id));
  };
  const handleReject = async (req: any) => {
    await supabase.from("opd_to_ipd_requests").update({ status: "rejected" }).eq("id", req.id);
    toast({ title: "Request Rejected" });
    setRequests(requests.filter(r => r.id !== req.id));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">OPD to IPD Admission Requests</h2>
      {requests.length === 0 ? (
        <div>No pending requests.</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th>OPD No</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Requested At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{req.opd_no}</td>
                <td>{req.patient?.full_name}</td>
                <td>{req.doctor?.full_name}</td>
                <td>{new Date(req.requested_at).toLocaleString()}</td>
                <td>
                  <Button size="sm" onClick={() => handleApprove(req)}>Approve</Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleReject(req)}>Reject</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 