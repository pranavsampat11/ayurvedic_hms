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

interface DietChart {
  id?: number;
  ipd_no: string;
  date: string;
  time: string;
  diet: string;
  notes: string;
  created_at?: string;
}

export default function DietChartPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dietCharts, setDietCharts] = useState<DietChart[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DietChart | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  
  const [form, setForm] = useState({
    date: "",
    time: "",
    diet: "",
    notes: "",
  });

  useEffect(() => {
    loadDietCharts();
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

  const loadDietCharts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diet_sheets')
        .select('*')
        .eq('ipd_no', uhid)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading diet charts:', error);
        toast({
          title: "Error",
          description: "Failed to load diet chart entries",
          variant: "destructive",
        });
        return;
      }

      // No dummy fallback; rely on real data only

      setDietCharts(data || []);
    } catch (error) {
      console.error('Error loading diet charts:', error);
      toast({
        title: "Error",
        description: "Failed to load diet chart entries",
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
    setForm({ date: "", time: "", diet: "", notes: "" });
    setShowForm(true);
  };

  const handleEditEntry = (entry: DietChart, index: number) => {
    setCurrentEntry(entry);
    setEditingIndex(index);
    setForm({
      date: entry.date,
      time: entry.time,
      diet: entry.diet || "",
      notes: entry.notes || "",
    });
    setShowForm(true);
  };

  const handleRemoveEntry = async (entry: DietChart, index: number) => {
    if (!entry.id) return;
    
    try {
      const { error } = await supabase
        .from('diet_sheets')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      setDietCharts(prev => prev.filter((_, i) => i !== index));
      toast({
        title: "Success",
        description: "Diet chart entry removed successfully",
      });
    } catch (error) {
      console.error('Error removing diet chart entry:', error);
      toast({
        title: "Error",
        description: "Failed to remove diet chart entry",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const entryData = {
        ipd_no: uhid,
        date: form.date,
        time: form.time,
        diet: form.diet,
        notes: form.notes,
      };

      if (currentEntry && currentEntry.id) {
        // Update existing entry
        const { error } = await supabase
          .from('diet_sheets')
          .update(entryData)
          .eq('id', currentEntry.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Diet chart entry updated successfully",
        });
      } else {
        // Create new entry
        const { error } = await supabase
          .from('diet_sheets')
          .insert(entryData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Diet chart entry saved successfully",
        });
      }

      // Reset form and reload data
      setShowForm(false);
      setCurrentEntry(null);
      setEditingIndex(null);
      setForm({
        date: "",
        time: "",
        diet: "",
        notes: "",
      });
      
      await loadDietCharts();
    } catch (error) {
      console.error('Error saving diet chart entry:', error);
      toast({
        title: "Error",
        description: "Failed to save diet chart entry",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>IPD Diet Chart</title>
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
              flex-direction: column;
              gap: 8px;
              margin-bottom: 20px;
              font-size: 11pt;
            }
            .patient-details-row {
              display: flex;
              justify-content: space-between;
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
              padding: 8px;
              text-align: left;
              font-size: 10pt;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .date-column {
              width: 12%;
            }
            .time-column {
              width: 10%;
            }
            .diet-column {
              width: 50%;
            }
            .notes-column {
              width: 28%;
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
                <h2 class="chart-title">IPD Diet Chart</h2>
                <div class="patient-details">
                  <div class="patient-details-row">
                    <div><b>Name:</b> ${patientData?.patients?.full_name || 'N/A'}</div>
                    <div><b>Age:</b> ${patientData?.patients?.age || 'N/A'}</div>
                    <div><b>Sex:</b> ${patientData?.patients?.gender || 'N/A'}</div>
                  </div>
                  <div class="patient-details-row">
                    <div><b>Bed No:</b> ${patientData?.bed_number || 'N/A'}</div>
                    <div><b>UHID No:</b> ${patientData?.uhid || 'N/A'}</div>
                    <div><b>IP No:</b> ${uhid}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th class="date-column">Date</th>
                    <th class="time-column">Time</th>
                    <th class="diet-column">Diet Plan</th>
                    <th class="notes-column">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${dietCharts.map(entry => `
                    <tr>
                      <td class="date-column">${formatDate(entry.date)}</td>
                      <td class="time-column">${entry.time}</td>
                      <td class="diet-column">${entry.diet || 'N/A'}</td>
                      <td class="notes-column">${entry.notes || 'N/A'}</td>
                    </tr>
                  `).join('')}
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
              <p>Loading diet chart entries...</p>
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
        <h1 className="text-2xl font-bold">Diet Chart</h1>
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
              {currentEntry ? "Edit Diet Chart Entry" : "Add New Diet Chart Entry"}
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
                <Label htmlFor="diet">Diet Plan</Label>
                <Textarea
                  id="diet"
                  name="diet"
                  value={form.diet}
                  onChange={handleChange}
                  placeholder="Enter the diet plan for this meal..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes or instructions..."
                  rows={3}
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
        {dietCharts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <p>No diet chart entries found.</p>
                <p className="text-sm">Click "Add Entry" to create your first entry.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          dietCharts.map((entry, index) => {
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg">Diet Plan</h3>
                        <div className="text-sm text-gray-500">
                          {formatDate(entry.date)} at {entry.time}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Diet Plan:</span>
                          <p className="mt-1 whitespace-pre-wrap">{entry.diet || "No diet plan specified"}</p>
                        </div>
                        
                        {entry.notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Notes:</span>
                            <p className="mt-1 whitespace-pre-wrap text-gray-700">{entry.notes}</p>
                          </div>
                        )}
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