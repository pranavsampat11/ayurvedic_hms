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
import { Edit, Plus, Trash2 } from "lucide-react";

interface NursingRound {
  id?: number;
  ipd_no: string;
  date_time: string;
  nurse_id: string;
  notes: string;
  created_at?: string;
}

export default function NursingRoundPage() {
  const params = useParams();
  const uhid = params.uhid as string;
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nursingRounds, setNursingRounds] = useState<NursingRound[]>([]);
  const [currentEntry, setCurrentEntry] = useState<NursingRound | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [defaultNurseId, setDefaultNurseId] = useState<string>("");
  
  const [form, setForm] = useState({
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    loadNursingRounds();
    fetchNurseFromIpdAdmission();
  }, [uhid]);

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

  const loadNursingRounds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nursing_rounds')
        .select('*')
        .eq('ipd_no', uhid)
        .order('date_time', { ascending: false });

      if (error) {
        console.error('Error loading nursing rounds:', error);
        toast({
          title: "Error",
          description: "Failed to load nursing round entries",
          variant: "destructive",
        });
        return;
      }

      setNursingRounds(data || []);
    } catch (error) {
      console.error('Error loading nursing rounds:', error);
      toast({
        title: "Error",
        description: "Failed to load nursing round entries",
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
    setForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: "",
    });
    setShowForm(true);
  };

  const handleEditEntry = (entry: NursingRound, index: number) => {
    setCurrentEntry(entry);
    setEditingIndex(index);
    const dateTime = new Date(entry.date_time);
    setForm({
      date: dateTime.toISOString().split('T')[0],
      time: dateTime.toTimeString().slice(0, 5),
      notes: entry.notes || "",
    });
    setShowForm(true);
  };

  const handleRemoveEntry = async (entry: NursingRound, index: number) => {
    if (!entry.id) return;
    
    try {
      const { error } = await supabase
        .from('nursing_rounds')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      setNursingRounds(prev => prev.filter((_, i) => i !== index));
      toast({
        title: "Success",
        description: "Nursing round entry removed successfully",
      });
    } catch (error) {
      console.error('Error removing nursing round entry:', error);
      toast({
        title: "Error",
        description: "Failed to remove nursing round entry",
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
        nurse_id: defaultNurseId,
        notes: form.notes,
      };

      if (currentEntry && currentEntry.id) {
        // Update existing entry
        const { error } = await supabase
          .from('nursing_rounds')
          .update(entryData)
          .eq('id', currentEntry.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Nursing round entry updated successfully",
        });
      } else {
        // Create new entry
        const { error } = await supabase
          .from('nursing_rounds')
          .insert(entryData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Nursing round entry saved successfully",
        });
      }

      // Reset form and reload data
      setShowForm(false);
      setCurrentEntry(null);
      setEditingIndex(null);
      setForm({
        date: "",
        time: "",
        notes: "",
      });
      
      await loadNursingRounds();
    } catch (error) {
      console.error('Error saving nursing round entry:', error);
      toast({
        title: "Error",
        description: "Failed to save nursing round entry",
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading nursing round entries...</p>
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
        <h1 className="text-2xl font-bold">Nursing Round</h1>
        <Button onClick={handleAddEntry} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentEntry ? "Edit Nursing Round Entry" : "Add New Nursing Round Entry"}
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
                <Label htmlFor="notes">Nursing Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Enter nursing observations, patient condition, medications given, procedures done, etc..."
                  rows={6}
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
        {nursingRounds.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center text-gray-500">
                <p>No nursing round entries found.</p>
                <p className="text-sm">Click "Add Entry" to create your first entry.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          nursingRounds.map((entry, index) => {
            const { date, time } = formatDateTime(entry.date_time);
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg">Nursing Round</h3>
                        <div className="text-sm text-gray-500">
                          {date} at {time}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-600">Notes:</span>
                        <p className="mt-1 whitespace-pre-wrap">{entry.notes || "No notes recorded"}</p>
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