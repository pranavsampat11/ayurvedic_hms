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

interface BPTPRChart {
  id?: number;
  ipd_no: string;
  date_time: string;
  temperature: number;
  pulse: number;
  respiratory_rate: number;
  bp: string;
  nurse_id: string;
  created_at?: string;
}

export default function BPTPRChartPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bpTprCharts, setBpTprCharts] = useState<BPTPRChart[]>([]);
  const [currentEntry, setCurrentEntry] = useState<BPTPRChart | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [defaultNurseId, setDefaultNurseId] = useState<string>("");
  const [patientData, setPatientData] = useState<any>(null);
  
  const [form, setForm] = useState({
    date: "",
    time: "",
    temperature: "",
    pulse: "",
    respiratoryRate: "",
    bp: "",
  });

  useEffect(() => {
    loadBpTprCharts();
    fetchNurseFromIpdAdmission();
    loadPatientData();
  }, [uhid]);

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

  const fetchNurseFromIpdAdmission = async () => {
    try {
      const { data: ipdAdmission, error } = await supabase
        .from("ipd_admissions")
        .select("*, doctor:doctor_id(full_name)")
        .eq("ipd_no", uhid)
        .single();

      if (ipdAdmission && ipdAdmission.doctor_id) {
        setDefaultNurseId(ipdAdmission.doctor_id);
      } else {
        // Fallback: get any staff member if no doctor found
        const { data: fallbackData } = await supabase
          .from('staff')
          .select('id, full_name')
          .limit(1)
          .single();
        
        if (fallbackData) {
          setDefaultNurseId(fallbackData.id);
        } else {
          console.error("No staff members found in database");
          toast({
            title: "Error",
            description: "No staff members found. Please add staff members first.",
            variant: "destructive",
          });
          setDefaultNurseId("");
        }
      }
    } catch (error) {
      console.error("Error fetching nurse from IPD admission:", error);
      setDefaultNurseId("");
    }
  };

  const loadBpTprCharts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bp_tpr_charts')
        .select('*, staff(full_name)')
        .eq('ipd_no', uhid)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error loading BP-TPR charts:', error);
        toast({
          title: "Error",
          description: "Failed to load BP-TPR chart entries",
          variant: "destructive",
        });
        return;
      }

      // No dummy fallback; rely on real data only

      setBpTprCharts(data || []);
    } catch (error) {
      console.error('Error loading BP-TPR charts:', error);
      toast({
        title: "Error",
        description: "Failed to load BP-TPR chart entries",
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
    
    // Open empty form; no dummy prefill
    setForm({ date: "", time: "", temperature: "", pulse: "", respiratoryRate: "", bp: "" });
    setShowForm(true);
  };

  const handleEditEntry = (entry: BPTPRChart, index: number) => {
    setCurrentEntry(entry);
    setEditingIndex(index);
    const dateTime = new Date(entry.date_time);
    setForm({
      date: dateTime.toISOString().split('T')[0],
      time: dateTime.toTimeString().slice(0, 5),
      temperature: entry.temperature?.toString() || "",
      pulse: entry.pulse?.toString() || "",
      respiratoryRate: entry.respiratory_rate?.toString() || "",
      bp: entry.bp || "",
    });
    setShowForm(true);
  };

  const handleRemoveEntry = async (entry: BPTPRChart, index: number) => {
    if (!entry.id) return;
    
    try {
      const { error } = await supabase
        .from('bp_tpr_charts')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      setBpTprCharts(prev => prev.filter((_, i) => i !== index));
      toast({
        title: "Success",
        description: "BP-TPR chart entry removed successfully",
      });
    } catch (error) {
      console.error('Error removing BP-TPR chart entry:', error);
      toast({
        title: "Error",
        description: "Failed to remove BP-TPR chart entry",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      
      if (!defaultNurseId) {
        toast({
          title: "Error",
          description: "No nurse available. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const entryData = {
        ipd_no: uhid,
        date_time: dateTime,
        temperature: parseFloat(form.temperature) || null,
        pulse: parseInt(form.pulse) || null,
        respiratory_rate: parseInt(form.respiratoryRate) || null,
        bp: form.bp,
        nurse_id: defaultNurseId,
      };

      if (currentEntry && currentEntry.id) {
        // Update existing entry
        const { error } = await supabase
          .from('bp_tpr_charts')
          .update(entryData)
          .eq('id', currentEntry.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "BP-TPR chart entry updated successfully",
        });
      } else {
        // Create new entry
        const { error } = await supabase
          .from('bp_tpr_charts')
          .insert(entryData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "BP-TPR chart entry saved successfully",
        });
      }

      // Reset form and reload data
      setShowForm(false);
      setCurrentEntry(null);
      setEditingIndex(null);
      setForm({
        date: "",
        time: "",
        temperature: "",
        pulse: "",
        respiratoryRate: "",
        bp: "",
      });
      
      await loadBpTprCharts();
    } catch (error) {
      console.error('Error saving BP-TPR chart entry:', error);
      toast({
        title: "Error",
        description: "Failed to save BP-TPR chart entry",
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
          <title>T.P.R and BP Chart</title>
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
            .institution-name {
              font-size: 14pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #000;
            }
            .chart-title {
              font-size: 16pt;
              font-weight: bold;
              margin: 0 0 15px 0;
              color: #000;
            }
            .patient-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 11pt;
            }
            .patient-details div {
              display: flex;
              align-items: baseline;
            }
            .patient-details b {
              font-weight: bold;
              margin-right: 5px;
            }
            .table-container {
              margin-top: 20px;
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
            .date-cell {
              text-align: center;
              font-weight: bold;
            }
            .time-cell {
              text-align: center;
            }
            .vital-signs {
              text-align: center;
            }
            .nurse-sign {
              text-align: center;
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
                 <h1 class="institution-name">POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                 <h2 class="chart-title">T.P.R and BP Chart</h2>
                 <div class="patient-details">
                   <div><b>Name:</b> ${patientData?.patients?.full_name || 'N/A'}</div>
                   <div><b>Age:</b> ${patientData?.patients?.age || 'N/A'}</div>
                   <div><b>Sex:</b> ${patientData?.patients?.gender || 'N/A'}</div>
                   <div><b>Bed No:</b> ${patientData?.bed_number || 'N/A'}</div>
                   <div><b>UHID No:</b> ${patientData?.uhid || 'N/A'}</div>
                   <div><b>OP/IP No:</b> ${uhid}</div>
                 </div>
               </div>
             </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Temperature (°F)</th>
                    <th>Pulse (per minute)</th>
                    <th>RR (per minute)</th>
                    <th>BP (mm of Hg)</th>
                    <th>Nurse Sign</th>
                  </tr>
                </thead>
                <tbody>
                  ${bpTprCharts.map(entry => {
                    const { date, time } = formatDateTime(entry.date_time);
                    return `
                      <tr>
                        <td class="date-cell">${date}</td>
                        <td class="time-cell">${time}</td>
                        <td class="vital-signs">${entry.temperature ? `${entry.temperature}°F` : 'N/A'}</td>
                        <td class="vital-signs">${entry.pulse || 'N/A'}</td>
                        <td class="vital-signs">${entry.respiratory_rate || 'N/A'}</td>
                        <td class="vital-signs">${entry.bp || 'N/A'}</td>
                        <td class="nurse-sign">${entry.staff?.full_name || 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')}
                  ${bpTprCharts.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; padding: 15px; color: #666;">
                        No BP-TPR chart entries recorded
                      </td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
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
              <p>Loading BP-TPR chart entries...</p>
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
        <h1 className="text-2xl font-bold">BP and TPR Chart</h1>
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
              {currentEntry ? "Edit BP-TPR Chart Entry" : "Add New BP-TPR Chart Entry"}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    name="temperature"
                    type="number"
                    step="0.1"
                    value={form.temperature}
                    onChange={handleChange}
                    placeholder="e.g., 98.6"
                  />
                </div>
                <div>
                  <Label htmlFor="pulse">Pulse (bpm)</Label>
                  <Input
                    id="pulse"
                    name="pulse"
                    type="number"
                    value={form.pulse}
                    onChange={handleChange}
                    placeholder="e.g., 72"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="respiratoryRate">Respiratory Rate (breaths/min)</Label>
                  <Input
                    id="respiratoryRate"
                    name="respiratoryRate"
                    type="number"
                    value={form.respiratoryRate}
                    onChange={handleChange}
                    placeholder="e.g., 16"
                  />
                </div>
                <div>
                  <Label htmlFor="bp">Blood Pressure</Label>
                  <Input
                    id="bp"
                    name="bp"
                    type="text"
                    value={form.bp}
                    onChange={handleChange}
                    placeholder="e.g., 120/80"
                  />
                </div>
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
        {bpTprCharts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <p>No BP-TPR chart entries found.</p>
                <p className="text-sm">Click "Add Entry" to create your first entry.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          bpTprCharts.map((entry, index) => {
            const { date, time } = formatDateTime(entry.date_time);
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg">BP-TPR Reading</h3>
                        <div className="text-sm text-gray-500">
                          {date} at {time}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Temperature:</span>
                          <p className="font-semibold">{entry.temperature ? `${entry.temperature}°C` : "Not recorded"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Pulse:</span>
                          <p className="font-semibold">{entry.pulse ? `${entry.pulse} bpm` : "Not recorded"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Respiratory Rate:</span>
                          <p className="font-semibold">{entry.respiratory_rate ? `${entry.respiratory_rate} breaths/min` : "Not recorded"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Blood Pressure:</span>
                          <p className="font-semibold">{entry.bp || "Not recorded"}</p>
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