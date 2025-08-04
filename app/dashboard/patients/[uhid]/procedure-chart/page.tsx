"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Edit, Plus, Trash2, Printer } from "lucide-react";

interface ProcedureSession {
  id?: number;
  ipd_no: string;
  procedure_entry_id: number;
  session_date: string;
  pre_vitals: string;
  post_vitals: string;
  procedure_note: string;
  performed_by: string;
  session_duration_minutes?: number;
  complications?: string;
  patient_response?: string;
  next_session_date?: string;
  created_at?: string;
  procedure_name?: string;
  performed_by_name?: string;
}

interface ProcedureEntry {
  id: number;
  procedure_name: string;
  start_date: string;
  end_date: string;
  requirements?: string;
  therapist?: string;
}

export default function ProcedureChartPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [procedureSessions, setProcedureSessions] = useState<ProcedureSession[]>([]);
  const [procedureEntries, setProcedureEntries] = useState<ProcedureEntry[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [currentEntry, setCurrentEntry] = useState<ProcedureSession | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [defaultStaffId, setDefaultStaffId] = useState<string>("");
  const [patientData, setPatientData] = useState<any>(null);
  
  const [form, setForm] = useState({
    procedure_entry_id: "",
    session_date: "",
    pre_temperature: "",
    pre_pulse: "",
    pre_bp: "",
    pre_rr: "",
    pre_other_vitals: "",
    post_temperature: "",
    post_pulse: "",
    post_bp: "",
    post_rr: "",
    post_other_vitals: "",
    procedure_note: "",
    performed_by: "",
    session_duration_minutes: "",
    complications: "",
    patient_response: "",
    next_session_date: ""
  });

  useEffect(() => {
    const loadData = async () => {
      await loadProcedureEntries();
      await loadStaffMembers();
      await fetchStaffFromIpdAdmission();
      await loadPatientData();
    };
    loadData();
  }, [uhid]);

  // Separate useEffect to reload sessions when procedure entries are available
  useEffect(() => {
    if (procedureEntries.length > 0) {
      loadProcedureSessions();
    }
  }, [procedureEntries, uhid]);

  const loadPatientData = async () => {
    try {
      const { data: ipdAdmission, error } = await supabase
        .from("ipd_admissions")
        .select("*, patients(*)")
        .eq("ipd_no", uhid)
        .single();

      if (error) {
        console.error("Error loading patient data:", error);
        return;
      }

      setPatientData(ipdAdmission);
    } catch (error) {
      console.error("Error loading patient data:", error);
    }
  };

  const fetchStaffFromIpdAdmission = async () => {
    try {
      const { data: ipdAdmission, error } = await supabase
        .from("ipd_admissions")
        .select("*, doctor:doctor_id(full_name)")
        .eq("ipd_no", uhid)
        .single();

      if (ipdAdmission && ipdAdmission.doctor_id) {
        setDefaultStaffId(ipdAdmission.doctor_id);
      } else {
        // Fallback: get any staff member if no doctor found
        const { data: fallbackData } = await supabase
          .from('staff')
          .select('id, full_name')
          .limit(1)
          .single();
        
        if (fallbackData) {
          setDefaultStaffId(fallbackData.id);
        } else {
          console.error("No staff members found in database");
          toast({
            title: "Error",
            description: "No staff members found. Please add staff members first.",
            variant: "destructive",
          });
          setDefaultStaffId("");
        }
      }
    } catch (error) {
      console.error("Error fetching staff from IPD admission:", error);
    }
  };

  const loadProcedureSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("procedure_sessions")
        .select('*, staff(full_name)')
        .eq("ipd_no", uhid)
        .order("session_date", { ascending: false });

      if (error) {
        console.error("Error loading procedure sessions:", error);
        toast({
          title: "Error",
          description: "Failed to load procedure sessions.",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to include procedure name and performer name
      const transformedSessions = (data || []).map(session => {
        const procedureEntry = procedureEntries.find(p => p.id === session.procedure_entry_id);
        console.log('Session procedure_entry_id:', session.procedure_entry_id);
        console.log('Available procedure entries:', procedureEntries);
        console.log('Found procedure entry:', procedureEntry);
        return {
          ...session,
          procedure_name: procedureEntry?.procedure_name || 'Unknown Procedure',
          performed_by_name: session.staff?.full_name
        };
      });

      setProcedureSessions(transformedSessions);
    } catch (error) {
      console.error("Error loading procedure sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load procedure sessions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProcedureEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("procedure_entries")
        .select("*")
        .eq("ipd_no", uhid)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error loading procedure entries:", error);
        return;
      }

      setProcedureEntries(data || []);
    } catch (error) {
      console.error("Error loading procedure entries:", error);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, full_name, role")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error loading staff members:", error);
        return;
      }

      setStaffMembers(data || []);
    } catch (error) {
      console.error("Error loading staff members:", error);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const formatVitalsText = (vitals: any, type: 'pre' | 'post') => {
    const parts = [];
    
    if (type === 'pre') {
      if (vitals.pre_temperature) parts.push(`Temperature: ${vitals.pre_temperature}°C`);
      if (vitals.pre_pulse) parts.push(`Pulse: ${vitals.pre_pulse} bpm`);
      if (vitals.pre_bp) parts.push(`BP: ${vitals.pre_bp} mmHg`);
      if (vitals.pre_rr) parts.push(`RR: ${vitals.pre_rr}/min`);
      if (vitals.pre_other_vitals) parts.push(`Notes: ${vitals.pre_other_vitals}`);
    } else {
      if (vitals.post_temperature) parts.push(`Temperature: ${vitals.post_temperature}°C`);
      if (vitals.post_pulse) parts.push(`Pulse: ${vitals.post_pulse} bpm`);
      if (vitals.post_bp) parts.push(`BP: ${vitals.post_bp} mmHg`);
      if (vitals.post_rr) parts.push(`RR: ${vitals.post_rr}/min`);
      if (vitals.post_other_vitals) parts.push(`Notes: ${vitals.post_other_vitals}`);
    }
    
    return parts.join(', ');
  };

  const handleAddEntry = () => {
    setCurrentEntry(null);
    setEditingIndex(null);
    setForm({
      procedure_entry_id: "",
      session_date: new Date().toISOString().split('T')[0],
      pre_temperature: "",
      pre_pulse: "",
      pre_bp: "",
      pre_rr: "",
      pre_other_vitals: "",
      post_temperature: "",
      post_pulse: "",
      post_bp: "",
      post_rr: "",
      post_other_vitals: "",
      procedure_note: "",
      performed_by: defaultStaffId,
      session_duration_minutes: "",
      complications: "",
      patient_response: "",
      next_session_date: ""
    });
    setShowForm(true);
  };

  const handleEditEntry = (entry: ProcedureSession, index: number) => {
    setCurrentEntry(entry);
    setEditingIndex(index);
    
    // Parse vitals data
    const preVitals = parseVitalsText(entry.pre_vitals);
    const postVitals = parseVitalsText(entry.post_vitals);
    
    setForm({
      procedure_entry_id: entry.procedure_entry_id.toString(),
      session_date: entry.session_date,
      pre_temperature: preVitals.temperature || "",
      pre_pulse: preVitals.pulse || "",
      pre_bp: preVitals.bp || "",
      pre_rr: preVitals.rr || "",
      pre_other_vitals: preVitals.notes || "",
      post_temperature: postVitals.temperature || "",
      post_pulse: postVitals.pulse || "",
      post_bp: postVitals.bp || "",
      post_rr: postVitals.rr || "",
      post_other_vitals: postVitals.notes || "",
      procedure_note: entry.procedure_note || "",
      performed_by: entry.performed_by,
      session_duration_minutes: entry.session_duration_minutes?.toString() || "",
      complications: entry.complications || "",
      patient_response: entry.patient_response || "",
      next_session_date: entry.next_session_date || ""
    });
    setShowForm(true);
  };

  const parseVitalsText = (vitalsText: string) => {
    const result: { temperature?: string; pulse?: string; bp?: string; rr?: string; notes?: string } = {};
    
    if (!vitalsText) return result;

    // Parse temperature
    const tempMatch = vitalsText.match(/Temperature: ([^,]+)/);
    if (tempMatch) result.temperature = tempMatch[1].replace('°C', '').trim();

    // Parse pulse
    const pulseMatch = vitalsText.match(/Pulse: ([^,]+)/);
    if (pulseMatch) result.pulse = pulseMatch[1].replace(' bpm', '').trim();

    // Parse BP
    const bpMatch = vitalsText.match(/BP: ([^,]+)/);
    if (bpMatch) result.bp = bpMatch[1].replace(' mmHg', '').trim();

    // Parse RR
    const rrMatch = vitalsText.match(/RR: ([^,]+)/);
    if (rrMatch) result.rr = rrMatch[1].replace('/min', '').trim();

    // Parse notes
    const notesMatch = vitalsText.match(/Notes: (.+)/);
    if (notesMatch) result.notes = notesMatch[1].trim();

    return result;
  };

  const handleRemoveEntry = async (entry: ProcedureSession, index: number) => {
    if (!confirm("Are you sure you want to delete this procedure session?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("procedure_sessions")
        .delete()
        .eq("id", entry.id);

      if (error) {
        console.error("Error deleting procedure session:", error);
        toast({
          title: "Error",
          description: "Failed to delete procedure session.",
          variant: "destructive",
        });
        return;
      }

      const updatedSessions = [...procedureSessions];
      updatedSessions.splice(index, 1);
      setProcedureSessions(updatedSessions);

      toast({
        title: "Success",
        description: "Procedure session deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting procedure session:", error);
      toast({
        title: "Error",
        description: "Failed to delete procedure session.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!form.procedure_entry_id || !form.session_date || !form.performed_by) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const preVitalsText = formatVitalsText(form, 'pre');
      const postVitalsText = formatVitalsText(form, 'post');

      const sessionData = {
        ipd_no: uhid,
        procedure_entry_id: parseInt(form.procedure_entry_id),
        session_date: form.session_date,
        pre_vitals: preVitalsText,
        post_vitals: postVitalsText,
        procedure_note: form.procedure_note,
        performed_by: form.performed_by,
        session_duration_minutes: form.session_duration_minutes ? parseInt(form.session_duration_minutes) : null,
        complications: form.complications || null,
        patient_response: form.patient_response || null,
        next_session_date: form.next_session_date || null
      };

      if (currentEntry && editingIndex !== null) {
        // Update existing entry
        const { error } = await supabase
          .from("procedure_sessions")
          .update(sessionData)
          .eq("id", currentEntry.id);

        if (error) {
          console.error("Error updating procedure session:", error);
          toast({
            title: "Error",
            description: "Failed to update procedure session.",
            variant: "destructive",
          });
          return;
        }

        const updatedSessions = [...procedureSessions];
        updatedSessions[editingIndex] = { ...currentEntry, ...sessionData };
        setProcedureSessions(updatedSessions);

        toast({
          title: "Success",
          description: "Procedure session updated successfully.",
        });
      } else {
        // Add new entry
        const { data, error } = await supabase
          .from("procedure_sessions")
          .insert(sessionData)
          .select();

        if (error) {
          console.error("Error adding procedure session:", error);
          toast({
            title: "Error",
            description: "Failed to add procedure session.",
            variant: "destructive",
          });
          return;
        }

        if (data && data[0]) {
          const newSession = {
            ...data[0],
            procedure_name: procedureEntries.find(p => p.id === parseInt(form.procedure_entry_id))?.procedure_name,
            performed_by_name: staffMembers.find(s => s.id === form.performed_by)?.full_name
          };
          setProcedureSessions([newSession, ...procedureSessions]);
        }

        toast({
          title: "Success",
          description: "Procedure session added successfully.",
        });
      }

      setShowForm(false);
      setCurrentEntry(null);
      setEditingIndex(null);
      setForm({
        procedure_entry_id: "",
        session_date: new Date().toISOString().split('T')[0],
        pre_temperature: "",
        pre_pulse: "",
        pre_bp: "",
        pre_rr: "",
        pre_other_vitals: "",
        post_temperature: "",
        post_pulse: "",
        post_bp: "",
        post_rr: "",
        post_other_vitals: "",
        procedure_note: "",
        performed_by: defaultStaffId,
        session_duration_minutes: "",
        complications: "",
        patient_response: "",
        next_session_date: ""
      });
    } catch (error) {
      console.error("Error saving procedure session:", error);
      toast({
        title: "Error",
        description: "Failed to save procedure session.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Treatment/Procedure Chart</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              background: #fff; 
              color: #000; 
              margin: 0;
              padding: 15px;
              font-size: 10pt;
              line-height: 1.3;
            }
            .container { 
              max-width: 100%; 
              margin: 0 auto; 
            }
            .header { 
              display: flex;
              align-items: flex-start;
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .logo {
              width: 97px;
              height: 97px;
              margin-right: 20px;
              flex-shrink: 0;
            }
            .header-content {
              flex: 1;
              text-align: center;
            }
            .institution-name {
              font-size: 10pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #000;
            }
            .chart-title {
              font-size: 12pt;
              font-weight: bold;
              margin: 0 0 15px 0;
              color: #000;
              text-align: center;
            }
            .patient-details {
              margin-bottom: 20px;
              font-size: 12pt;
            }
            .patient-details p {
              margin: 5px 0;
            }
            .table-container {
              margin-top: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              border: 0.75pt solid #000;
            }
            th, td {
              border: 0.75pt solid #000;
              padding: 5px;
              text-align: left;
              font-size: 12pt;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .date-cell {
              width: 89.35pt;
              text-align: left;
            }
            .procedure-note-cell {
              width: 277.2pt;
            }
            .performed-by-cell {
              width: 66pt;
              text-align: center;
            }
            .vitals-section {
              margin: 5px 0;
            }
            .vitals-label {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .procedure-block {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; padding: 8px; }
              .container { border: none; }
              .no-print { display: none; }
              .procedure-block {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/my-logo.png" alt="Hospital Logo" class="logo">
              <div class="header-content">
                <h1 class="institution-name">POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2 class="chart-title">Treatment/Procedure Chart</h2>
                <div class="patient-details">
                  <p><strong>Patient Name:</strong> ${patientData?.patients?.full_name || 'N/A'}</p>
                  <p><strong>UHID No:</strong> ${patientData?.patients?.uhid || 'N/A'}</p>
                  <p><strong>Sex/Age:</strong> ${patientData?.patients?.gender || 'N/A'}/${patientData?.patients?.age || 'N/A'} years</p>
                  <p><strong>OP/IP No:</strong> ${uhid}</p>
                </div>
              </div>
            </div>
            
            <div class="table-container">
              ${procedureSessions.map(session => {
                    const sessionDate = new Date(session.session_date).toLocaleDateString('en-GB');
                    const preVitals = session.pre_vitals || 'N/A';
                    const postVitals = session.post_vitals || 'N/A';
                    const procedureNote = session.procedure_note || 'N/A';
                    const performedBy = session.performed_by_name || 'N/A';
                    
                    // Find the procedure entry for this session
                    const procedureEntry = procedureEntries.find(p => p.id === session.procedure_entry_id);
                    const procedureName = procedureEntry?.procedure_name || 'Unknown Procedure';
                    const startDate = procedureEntry?.start_date ? new Date(procedureEntry.start_date).toLocaleDateString('en-GB') : 'N/A';
                    const endDate = procedureEntry?.end_date ? new Date(procedureEntry.end_date).toLocaleDateString('en-GB') : 'N/A';
                    
                    return `
                      <div class="procedure-block">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                          <tr>
                            <th colspan="3">Procedure Details: ${procedureName}</th>
                          </tr>
                          <tr>
                            <th colspan="3">Procedure Start Date: ${startDate}</th>
                          </tr>
                          <tr>
                            <th colspan="3">Procedure End Date: ${endDate}</th>
                          </tr>
                          <tr>
                            <td class="date-cell">
                              <div><strong>Date:</strong> ${sessionDate}</div>
                              <div class="vitals-section">
                                <div class="vitals-label">Pre Vitals:</div>
                                <div>${preVitals}</div>
                              </div>
                              <div class="vitals-section">
                                <div class="vitals-label">Post Vitals:</div>
                                <div>${postVitals}</div>
                              </div>
                            </td>
                            <td class="procedure-note-cell">
                              <div><strong>Procedure Note:</strong></div>
                              <div>${procedureNote}</div>
                            </td>
                            <td class="performed-by-cell">
                              <div><strong>Performed by</strong></div>
                              <div>${performedBy}</div>
                            </td>
                          </tr>
                        </table>
                      </div>
                    `;
                  }).join('')}
                  ${procedureSessions.length === 0 ? `
                    <div style="text-align: center; padding: 15px; color: #666;">
                      No procedure sessions recorded
                    </div>
                  ` : ''}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading procedure sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Procedure Chart</h1>
          <p className="text-gray-600">Track and manage procedure sessions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddEntry}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Chart
          </Button>
        </div>
      </div>

      {/* Patient Info Card */}
      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Patient Name</Label>
                <p className="text-lg font-semibold">{patientData.patients?.full_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">UHID</Label>
                <p className="font-mono text-lg">{patientData.patients?.uhid}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">IPD Number</Label>
                <p className="font-mono text-lg">{patientData.ipd_no}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Age/Gender</Label>
                <p className="text-lg">{patientData.patients?.age} years, {patientData.patients?.gender}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Ward/Bed</Label>
                <p className="text-lg">{patientData.ward} - Bed {patientData.bed_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Sessions</Label>
                <p className="text-lg font-semibold">{procedureSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentEntry ? "Edit Procedure Session" : "Add Procedure Session"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Session Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="procedure_entry_id">Procedure *</Label>
                    <Select
                      value={form.procedure_entry_id}
                      onValueChange={(value) => handleSelectChange('procedure_entry_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a procedure" />
                      </SelectTrigger>
                      <SelectContent>
                        {procedureEntries.map((procedure) => (
                          <SelectItem key={procedure.id} value={procedure.id.toString()}>
                            {procedure.procedure_name} ({new Date(procedure.start_date).toLocaleDateString()} - {new Date(procedure.end_date).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="session_date">Session Date *</Label>
                    <Input
                      type="date"
                      name="session_date"
                      value={form.session_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="performed_by">Performed By *</Label>
                    <Select
                      value={form.performed_by}
                      onValueChange={(value) => handleSelectChange('performed_by', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.full_name} ({staff.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="session_duration_minutes">Duration (minutes)</Label>
                    <Input
                      type="number"
                      name="session_duration_minutes"
                      value={form.session_duration_minutes}
                      onChange={handleChange}
                      placeholder="e.g., 30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="next_session_date">Next Session Date</Label>
                    <Input
                      type="date"
                      name="next_session_date"
                      value={form.next_session_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Vitals Section */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Pre-Procedure Vitals</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="pre_temperature">Temperature (°C)</Label>
                        <Input
                          name="pre_temperature"
                          value={form.pre_temperature}
                          onChange={handleChange}
                          placeholder="e.g., 98.6"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pre_pulse">Pulse (bpm)</Label>
                        <Input
                          name="pre_pulse"
                          value={form.pre_pulse}
                          onChange={handleChange}
                          placeholder="e.g., 72"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pre_bp">Blood Pressure (mmHg)</Label>
                        <Input
                          name="pre_bp"
                          value={form.pre_bp}
                          onChange={handleChange}
                          placeholder="e.g., 120/80"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pre_rr">Respiratory Rate (/min)</Label>
                        <Input
                          name="pre_rr"
                          value={form.pre_rr}
                          onChange={handleChange}
                          placeholder="e.g., 16"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label htmlFor="pre_other_vitals">Additional Notes</Label>
                      <Textarea
                        name="pre_other_vitals"
                        value={form.pre_other_vitals}
                        onChange={handleChange}
                        placeholder="Any additional pre-procedure observations..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Post-Procedure Vitals</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="post_temperature">Temperature (°C)</Label>
                        <Input
                          name="post_temperature"
                          value={form.post_temperature}
                          onChange={handleChange}
                          placeholder="e.g., 98.8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="post_pulse">Pulse (bpm)</Label>
                        <Input
                          name="post_pulse"
                          value={form.post_pulse}
                          onChange={handleChange}
                          placeholder="e.g., 75"
                        />
                      </div>
                      <div>
                        <Label htmlFor="post_bp">Blood Pressure (mmHg)</Label>
                        <Input
                          name="post_bp"
                          value={form.post_bp}
                          onChange={handleChange}
                          placeholder="e.g., 118/78"
                        />
                      </div>
                      <div>
                        <Label htmlFor="post_rr">Respiratory Rate (/min)</Label>
                        <Input
                          name="post_rr"
                          value={form.post_rr}
                          onChange={handleChange}
                          placeholder="e.g., 18"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label htmlFor="post_other_vitals">Additional Notes</Label>
                      <Textarea
                        name="post_other_vitals"
                        value={form.post_other_vitals}
                        onChange={handleChange}
                        placeholder="Any additional post-procedure observations..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="procedure_note">Procedure Note</Label>
                  <Textarea
                    name="procedure_note"
                    value={form.procedure_note}
                    onChange={handleChange}
                    placeholder="Detailed notes about the procedure performed..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complications">Complications</Label>
                    <Textarea
                      name="complications"
                      value={form.complications}
                      onChange={handleChange}
                      placeholder="Any complications during the procedure..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="patient_response">Patient Response</Label>
                    <Textarea
                      name="patient_response"
                      value={form.patient_response}
                      onChange={handleChange}
                      placeholder="Patient's response to the procedure..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex items-center gap-2">
                  {saving ? 'Saving...' : (currentEntry ? 'Update Session' : 'Save Session')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setCurrentEntry(null);
                    setEditingIndex(null);
                  }}
                  className="flex items-center gap-2"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Procedure Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {procedureSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No procedure sessions found.</p>
              <p className="text-gray-400">Click "Add Entry" to create your first entry.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {procedureSessions.map((session, index) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{session.procedure_name}</h3>
                      <p className="text-gray-600">
                        {new Date(session.session_date).toLocaleDateString()} • 
                        Performed by: {session.performed_by_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEntry(session, index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveEntry(session, index)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Pre-Procedure Vitals:</Label>
                      <p className="text-gray-700 mt-1">{session.pre_vitals || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Post-Procedure Vitals:</Label>
                      <p className="text-gray-700 mt-1">{session.post_vitals || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="font-medium">Procedure Note:</Label>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{session.procedure_note || 'N/A'}</p>
                    </div>
                    {session.complications && (
                      <div>
                        <Label className="font-medium">Complications:</Label>
                        <p className="text-gray-700 mt-1">{session.complications}</p>
                      </div>
                    )}
                    {session.patient_response && (
                      <div>
                        <Label className="font-medium">Patient Response:</Label>
                        <p className="text-gray-700 mt-1">{session.patient_response}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 