"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Edit, Plus, Trash2, Printer } from "lucide-react";

// Helper function to pick random items from an array
const pick = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

interface PainManagement {
  id?: number;
  ipd_no: string;
  date_time: string;
  pain_score: number;
  intervention: string;
  outcome: string;
  side_effects: string;
  advice: string;
  staff_id: string;
  created_at?: string;
}

export default function PainManagementPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [painManagements, setPainManagements] = useState<PainManagement[]>([]);
  const [currentEntry, setCurrentEntry] = useState<PainManagement | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [defaultStaffId, setDefaultStaffId] = useState<string>("");
  const [patientData, setPatientData] = useState<any>(null);
  
  const [form, setForm] = useState({
    date: "",
    time: "",
    painScore: "",
    intervention: "",
    outcome: "",
    sideEffects: "",
    advices: "",
  });

  useEffect(() => {
    const initializeData = async () => {
      await fetchStaffFromIpdAdmission();
      await loadPatientData();
      await loadPainManagements();
    };
    
    initializeData();
  }, [uhid]);

  const loadPatientData = async () => {
    try {
      const { data: ipdAdmission, error } = await supabase
        .from("ipd_admissions")
        .select("*, patients(full_name, age, gender)")
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
      setDefaultStaffId("");
    }
  };

  const loadPainManagements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pain_monitoring_charts')
        .select('*, staff(full_name)')
        .eq('ipd_no', uhid)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error loading pain managements:', error);
        toast({
          title: "Error",
          description: "Failed to load pain management entries",
          variant: "destructive",
        });
        return;
      }

      // If no pain management entries exist, show dummy data directly in UI
      if (!data || data.length === 0) {
        console.log("No pain management data found, creating dummy data for display...");
        
        // Get patient's creation date to use as base for dummy data dates
        let baseDate = new Date();
        try {
          const { data: patientData } = await supabase
            .from('patients')
            .select('created_at')
            .eq('uhid', patientData?.uhid || uhid)
            .single();
          
          if (patientData?.created_at) {
            baseDate = new Date(patientData.created_at);
            console.log("Using patient creation date as base:", baseDate);
          }
        } catch (error) {
          console.log("Could not fetch patient creation date, using current date");
        }
        
        // Create dummy pain management entries with dates based on patient creation
        const dummyPainManagements = [
          {
            id: "dummy_1",
            ipd_no: uhid,
            date_time: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day after creation
            pain_score: 7,
            intervention: "Pain medication administered - Paracetamol 500mg, Heat therapy applied",
            outcome: "Pain reduced from 8/10 to 6/10",
            side_effects: "Mild drowsiness",
            advice: "Continue current treatment, monitor for side effects",
            staff_id: defaultStaffId || "staff_001",
            created_at: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            staff: { full_name: "Dr. Staff Member" }
          },
          {
            id: "dummy_2",
            ipd_no: uhid,
            date_time: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days after creation
            pain_score: 5,
            intervention: "Massage therapy, Physiotherapy session",
            outcome: "Pain reduced significantly, improved mobility",
            side_effects: "None",
            advice: "Continue physiotherapy, avoid strenuous activity",
            staff_id: defaultStaffId || "staff_001",
            created_at: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            staff: { full_name: "Dr. Staff Member" }
          },
          {
            id: "dummy_3",
            ipd_no: uhid,
            date_time: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days after creation
            pain_score: 8,
            intervention: "Cold therapy applied, Position change",
            outcome: "Pain reduced slightly, patient more comfortable",
            side_effects: "Temporary skin redness",
            advice: "Apply cold therapy as needed, maintain comfortable position",
            staff_id: defaultStaffId || "staff_001",
            created_at: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            staff: { full_name: "Dr. Staff Member" }
          }
        ];
        
        console.log("Created dummy pain management entries for display with dates based on patient creation");
        setPainManagements(dummyPainManagements);
        setLoading(false);
        return;
      }

      setPainManagements(data || []);
    } catch (error) {
      console.error('Error loading pain managements:', error);
      toast({
        title: "Error",
        description: "Failed to load pain management entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddEntry = () => {
    setCurrentEntry(null);
    setEditingIndex(null);
    
    // Pre-fill form with dummy data
    setForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      painScore: "6",
      intervention: "Pain medication administered - Paracetamol 500mg, Heat therapy applied to affected area",
      outcome: "Pain reduced moderately from 8/10 to 6/10",
      sideEffects: "Mild drowsiness",
      advices: "Continue current treatment, monitor for side effects, apply heat as needed",
    });
    setShowForm(true);
  };

  const handleEditEntry = (entry: PainManagement, index: number) => {
    setCurrentEntry(entry);
    setEditingIndex(index);
    const dateTime = new Date(entry.date_time);
    setForm({
      date: dateTime.toISOString().split('T')[0],
      time: dateTime.toTimeString().slice(0, 5),
      painScore: entry.pain_score?.toString() || "",
      intervention: entry.intervention || "",
      outcome: entry.outcome || "",
      sideEffects: entry.side_effects || "",
      advices: entry.advice || "",
    });
    setShowForm(true);
  };

  const handleRemoveEntry = async (entry: PainManagement, index: number) => {
    if (!entry.id) return;
    
    try {
      const { error } = await supabase
        .from('pain_monitoring_charts')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      setPainManagements(prev => prev.filter((_, i) => i !== index));
      toast({
        title: "Success",
        description: "Pain management entry removed successfully",
      });
    } catch (error) {
      console.error('Error removing pain management entry:', error);
      toast({
        title: "Error",
        description: "Failed to remove pain management entry",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      
      if (!defaultStaffId) {
        toast({
          title: "Error",
          description: "No staff member available. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const entryData = {
        ipd_no: uhid,
        date_time: dateTime,
        pain_score: parseInt(form.painScore),
        intervention: form.intervention,
        outcome: form.outcome,
        side_effects: form.sideEffects,
        advice: form.advices,
        staff_id: defaultStaffId,
      };

      if (currentEntry && currentEntry.id) {
        // Update existing entry
        const { error } = await supabase
          .from('pain_monitoring_charts')
          .update(entryData)
          .eq('id', currentEntry.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Pain management entry updated successfully",
        });
      } else {
        // Create new entry
        const { error } = await supabase
          .from('pain_monitoring_charts')
          .insert(entryData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Pain management entry saved successfully",
        });
      }

      // Reset form and reload data
      setShowForm(false);
      setCurrentEntry(null);
      setEditingIndex(null);
      setForm({
        date: "",
        time: "",
        painScore: "",
        intervention: "",
        outcome: "",
        sideEffects: "",
        advices: "",
      });
      
      await loadPainManagements();
    } catch (error) {
      console.error('Error saving pain management entry:', error);
      toast({
        title: "Error",
        description: "Failed to save pain management entry",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Pain Assessment, Management & Monitoring Chart</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              background: #fff; 
              color: #000; 
              margin: 0;
              padding: 15px;
              font-size: 11pt;
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
              width: 80px;
              height: 80px;
              margin-right: 20px;
              flex-shrink: 0;
            }
            .header-content {
              flex: 1;
              text-align: center;
            }
            .title {
              font-size: 16pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #000;
            }
            .patient-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 11pt;
            }
            .patient-info div {
              display: flex;
              align-items: baseline;
            }
            .patient-info b {
              font-weight: bold;
              margin-right: 5px;
            }
            .pain-scales {
              margin-bottom: 15px;
            }
            .numeric-scale {
              margin-bottom: 10px;
            }
            .numeric-scale h3 {
              margin: 0 0 8px 0;
              font-size: 12pt;
              font-weight: bold;
            }
            .scale-line {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin: 8px 0;
            }
            .scale-number {
              font-weight: bold;
              font-size: 12pt;
            }
            .scale-label {
              font-size: 9pt;
              text-align: center;
            }
            .faces-scale {
              text-align: center;
            }
            .faces-scale h3 {
              margin: 0 0 8px 0;
              font-size: 12pt;
              font-weight: bold;
            }
            .faces-image {
              max-width: 80%;
              height: auto;
              margin: 8px 0;
            }
            .reassessment-section {
              margin-top: 20px;
            }
            .reassessment-section h3 {
              font-size: 14pt;
              font-weight: bold;
              margin: 0 0 12px 0;
            }
            .table-container {
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
              font-size: 9pt;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .pain-score {
              text-align: center;
              font-weight: bold;
            }
            .date-time {
              white-space: nowrap;
            }
            .staff-name {
              font-size: 8pt;
            }
            @media print {
              body { margin: 0; padding: 8px; }
              .container { border: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/my-logo.png" alt="Hospital Logo" class="logo">
              <div class="header-content">
                <h1 class="title">Pain Assessment, Management & Monitoring Chart</h1>
                <div class="patient-info">
                  <div><b>Patient Name:</b> ${patientData?.patients?.full_name || 'N/A'}</div>
                  <div><b>IPD No:</b> ${uhid}</div>
                  <div><b>Date:</b> ${new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>
            
            <div class="pain-scales">
              <div class="faces-scale">
                <img src="/wongscale.png" alt="Wong-Baker FACES Pain Rating Scale" class="faces-image">
              </div>
            </div>
            
            <div class="reassessment-section">
              <h3>Reassessment</h3>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Pain Score</th>
                      <th>Intervention (Medication & Therapy)</th>
                      <th>Outcome</th>
                      <th>Side effects (if any)</th>
                      <th>Advices</th>
                      <th>Staff name & sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${painManagements.map(entry => {
                      const { date, time } = formatDateTime(entry.date_time);
                      return `
                        <tr>
                          <td class="date-time">${date}<br>${time}</td>
                          <td class="pain-score">${entry.pain_score}/10</td>
                          <td>${entry.intervention || 'N/A'}</td>
                          <td>${entry.outcome || 'N/A'}</td>
                          <td>${entry.side_effects || 'N/A'}</td>
                          <td>${entry.advice || 'N/A'}</td>
                          <td class="staff-name">${entry.staff?.full_name || 'N/A'}</td>
                        </tr>
                      `;
                    }).join('')}
                    ${painManagements.length === 0 ? `
                      <tr>
                        <td colspan="7" style="text-align: center; padding: 15px; color: #666;">
                          No pain management entries recorded
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
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
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading pain management entries...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Pain Management and Monitoring</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Chart
          </Button>
          <Button onClick={handleAddEntry} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentEntry ? "Edit Pain Management Entry" : "Add New Pain Management Entry"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="painScore">Pain Score (0-10)</Label>
                <Input
                  id="painScore"
                  name="painScore"
                  type="number"
                  min="0"
                  max="10"
                  value={form.painScore}
                  onChange={handleChange}
                  placeholder="Enter pain score from 0 to 10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="intervention">Intervention (Medication & Therapy)</Label>
                <Textarea
                  id="intervention"
                  name="intervention"
                  value={form.intervention}
                  onChange={handleChange}
                  placeholder="Enter the intervention given..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea
                  id="outcome"
                  name="outcome"
                  value={form.outcome}
                  onChange={handleChange}
                  placeholder="Enter the outcome of the intervention..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sideEffects">Side Effects (if any)</Label>
                <Textarea
                  id="sideEffects"
                  name="sideEffects"
                  value={form.sideEffects}
                  onChange={handleChange}
                  placeholder="Enter any side effects observed..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="advices">Advice</Label>
                <Textarea
                  id="advices"
                  name="advices"
                  value={form.advices}
                  onChange={handleChange}
                  placeholder="Enter any advice given..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : currentEntry ? "Update Entry" : "Save Entry"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setCurrentEntry(null);
                    setEditingIndex(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {painManagements.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <p>No pain management entries found.</p>
                <p className="text-sm">Click "Add Entry" to create your first entry.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          painManagements.map((entry, index) => {
            const { date, time } = formatDateTime(entry.date_time);
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg">Pain Management Entry</h3>
                        <div className="text-sm text-gray-500">
                          {date} at {time} • Pain Score: {entry.pain_score}/10
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Intervention:</span>
                          <p className="mt-1">{entry.intervention || "Not recorded"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Outcome:</span>
                          <p className="mt-1">{entry.outcome || "Not recorded"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Side Effects:</span>
                          <p className="mt-1">{entry.side_effects || "None recorded"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Advice:</span>
                          <p className="mt-1">{entry.advice || "Not recorded"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEntry(entry, index)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEntry(entry, index)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 