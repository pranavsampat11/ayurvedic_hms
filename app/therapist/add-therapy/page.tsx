"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, User, Calendar, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AddTherapyPage() {
  const [searchType, setSearchType] = useState<"opd" | "ipd">("opd");
  const [searchNumber, setSearchNumber] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [therapists, setTherapists] = useState<any[]>([]);
  
  // Therapy session form states
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [therapyType, setTherapyType] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadTherapists();
  }, []);

  const loadTherapists = async () => {
    try {
      const { data } = await supabase
        .from("staff")
        .select("id, full_name")
        .eq("role", "therapist");
      setTherapists(data || []);
    } catch (error) {
      console.error("Error loading therapists:", error);
    }
  };

  const searchPatient = async () => {
    if (!searchNumber.trim()) return;

    setLoading(true);
    try {
      let query;
      if (searchType === "opd") {
        query = supabase
          .from("opd_visits")
          .select(`
            *,
            patient:uhid(full_name, age, gender, mobile),
            case_sheet:opd_case_sheets(*)
          `)
          .eq("opd_no", searchNumber)
          .single();
      } else {
        query = supabase
          .from("ipd_admissions")
          .select(`
            *,
            patient:uhid(full_name, age, gender, mobile),
            case_sheet:ipd_case_sheets(*)
          `)
          .eq("ipd_no", searchNumber)
          .single();
      }

      const { data, error } = await query;
      
      if (error) {
        alert("Patient not found. Please check the number.");
        setPatientData(null);
      } else {
        setPatientData(data);
        loadPatientSessions(data);
      }
    } catch (error) {
      console.error("Error searching patient:", error);
      alert("Error searching patient");
    } finally {
      setLoading(false);
    }
  };

  const loadPatientSessions = async (patient: any) => {
    try {
      const { data } = await supabase
        .from("therapist_assignments")
        .select(`
          *,
          therapist:therapist_id(full_name)
        `)
        .eq(searchType === "opd" ? "opd_no" : "ipd_no", searchNumber)
        .order("scheduled_date", { ascending: false });

      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const addTherapySession = async () => {
    if (!selectedTherapist || !therapyType || !sessionDate || !sessionTime) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("therapist_assignments")
        .insert({
          opd_no: searchType === "opd" ? searchNumber : null,
          ipd_no: searchType === "ipd" ? searchNumber : null,
          therapist_id: selectedTherapist,
          doctor_id: localStorage.getItem("userId"),
          scheduled_date: sessionDate,
          scheduled_time: sessionTime,
          notes: `Therapy Type: ${therapyType}${duration ? ` | Duration: ${duration}` : ""}${notes ? ` | Notes: ${notes}` : ""}`,
          status: "pending"
        });

      if (!error) {
        // Reset form
        setSelectedTherapist("");
        setTherapyType("");
        setSessionDate("");
        setSessionTime("");
        setDuration("");
        setNotes("");
        
        // Refresh sessions
        loadPatientSessions(patientData);
        alert("Therapy session added successfully!");
      } else {
        alert("Error adding therapy session: " + error.message);
      }
    } catch (error) {
      console.error("Error adding therapy session:", error);
      alert("Error adding therapy session");
    }
  };

  const getPatientName = () => {
    if (!patientData) return "";
    return patientData.patient?.full_name || "Unknown Patient";
  };

  const getPatientInfo = () => {
    if (!patientData) return "";
    const patient = patientData.patient;
    if (!patient) return "";
    
    return `${patient.age || "N/A"} years, ${patient.gender || "N/A"}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Therapy Session</h1>
          <p className="text-gray-600">Search for a patient and add therapy sessions</p>
        </div>
      </div>

      {/* Search Patient Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search Type</Label>
              <Select value={searchType} onValueChange={(value: "opd" | "ipd") => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opd">OPD Number</SelectItem>
                  <SelectItem value="ipd">IPD Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{searchType.toUpperCase()} Number</Label>
              <Input
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                placeholder={`Enter ${searchType.toUpperCase()} number`}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchPatient} disabled={loading} className="w-full">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search Patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Information */}
      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Patient Name</Label>
                <p className="text-lg font-semibold">{getPatientName()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Age & Gender</Label>
                <p className="text-lg">{getPatientInfo()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{searchType.toUpperCase()} Number</Label>
                <p className="text-lg font-mono">{searchNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Contact</Label>
                <p className="text-lg">{patientData.patient?.mobile || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Therapy Session Form */}
      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Therapy Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Select Therapist</Label>
                <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapists.map((therapist) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Therapy Type</Label>
                <Input
                  value={therapyType}
                  onChange={(e) => setTherapyType(e.target.value)}
                  placeholder="e.g., Abhyanga, Swedana, etc."
                />
              </div>
              <div>
                <Label>Session Date</Label>
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Session Time</Label>
                <Input
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  placeholder="e.g., 6:00-6:30 PM"
                />
              </div>
              <div>
                <Label>Duration (Optional)</Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30 minutes"
                />
              </div>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional instructions or notes..."
                rows={3}
              />
            </div>
            <Button onClick={addTherapySession} className="w-full md:w-auto">
              Add Therapy Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Patient's Therapy Sessions */}
      {patientData && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Patient's Therapy Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{session.therapist?.full_name || "Unknown Therapist"}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.scheduled_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Time:</strong> {session.scheduled_time || "Not specified"}</div>
                    {session.notes && (
                      <div><strong>Notes:</strong> {session.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 