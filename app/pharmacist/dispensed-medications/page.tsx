"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Eye, Filter } from "lucide-react";

interface DispensedMedication {
  id: number;
  request_id: number;
  dispensed_by: string;
  dispensed_date: string;
  patient_name?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  doctor_name?: string;
  pharmacist_name?: string;
  opd_no?: string;
  ipd_no?: string;
}

export default function DispensedMedicationsPage() {
  const [dispensedMedications, setDispensedMedications] = useState<DispensedMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadDispensedMedications();
  }, []);

  const loadDispensedMedications = async () => {
    try {
      setLoading(true);

      // Get dispensed medications with related data
      const { data: dispensedData, error: dispensedError } = await supabase
        .from("dispensed_medications")
        .select(`
          *,
          medication_request:request_id(
            opd_no,
            ipd_no,
            internal_medication:medication_id(
              medication_name,
              dosage,
              frequency,
              prescribed_by
            )
          )
        `)
        .order("dispensed_date", { ascending: false });

      if (dispensedError) throw dispensedError;

      // Process and enrich the data
      const enrichedDispensed = await Promise.all(
        (dispensedData || []).map(async (dispensed) => {
          let patientName = "";
          let doctorName = "";

          // Get patient name from OPD or IPD
          if (dispensed.medication_request?.opd_no) {
            const { data: opdData } = await supabase
              .from("opd_visits")
              .select("uhid, patient:uhid(full_name)")
              .eq("opd_no", dispensed.medication_request.opd_no)
              .single();
            
            patientName = (opdData?.patient as any)?.full_name || "";
          } else if (dispensed.medication_request?.ipd_no) {
            const { data: ipdData } = await supabase
              .from("ipd_admissions")
              .select("uhid, patient:uhid(full_name)")
              .eq("ipd_no", dispensed.medication_request.ipd_no)
              .single();
            
            patientName = (ipdData?.patient as any)?.full_name || "";
          }

          // Get doctor name
          if (dispensed.medication_request?.internal_medication?.prescribed_by) {
            const { data: doctorData } = await supabase
              .from("staff")
              .select("full_name")
              .eq("id", dispensed.medication_request.internal_medication.prescribed_by)
              .single();
            
            doctorName = doctorData?.full_name || "";
          }

          // Get pharmacist name
          let pharmacistName = "";
          if (dispensed.dispensed_by) {
            const { data: pharmacistData } = await supabase
              .from("staff")
              .select("full_name")
              .eq("id", dispensed.dispensed_by)
              .single();
            
            pharmacistName = pharmacistData?.full_name || "";
          }

          return {
            ...dispensed,
            patient_name: patientName,
            medication_name: dispensed.medication_request?.internal_medication?.medication_name || "",
            dosage: dispensed.medication_request?.internal_medication?.dosage || "",
            frequency: dispensed.medication_request?.internal_medication?.frequency || "",
            doctor_name: doctorName,
            pharmacist_name: pharmacistName,
            opd_no: dispensed.medication_request?.opd_no || "",
            ipd_no: dispensed.medication_request?.ipd_no || "",
          };
        })
      );

      setDispensedMedications(enrichedDispensed);
    } catch (error) {
      console.error("Error loading dispensed medications:", error);
      toast({
        title: "Error",
        description: "Failed to load dispensed medications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const filteredDispensed = dispensedMedications.filter((medication) => {
    const matchesSearch = 
      medication.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.opd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.ipd_no?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "today" && isToday(new Date(medication.dispensed_date))) ||
      (dateFilter === "week" && isThisWeek(new Date(medication.dispensed_date)));
    
    return matchesSearch && matchesDate;
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dispensed Medications</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
        <h1 className="text-3xl font-bold">Dispensed Medications</h1>
        <Button onClick={loadDispensedMedications} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, medication, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dispensed Medications List */}
      <Card>
        <CardHeader>
          <CardTitle>Dispensed Medications ({filteredDispensed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDispensed.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No dispensed medications found
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Patient</th>
                      <th className="text-left p-3 font-medium">OPD/IPD No</th>
                      <th className="text-left p-3 font-medium">Medication</th>
                      <th className="text-left p-3 font-medium">Dosage</th>
                      <th className="text-left p-3 font-medium">Frequency</th>
                      <th className="text-left p-3 font-medium">Doctor</th>
                      <th className="text-left p-3 font-medium">Pharmacist</th>
                      <th className="text-left p-3 font-medium">Dispensed Date</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDispensed.map((medication) => (
                      <tr key={medication.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{medication.patient_name || "N/A"}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{medication.opd_no || medication.ipd_no || "N/A"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{medication.medication_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{medication.dosage}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{medication.frequency}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{medication.doctor_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{medication.pharmacist_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{formatDate(medication.dispensed_date)}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "View Details",
                                  description: `Viewing details for dispensed medication #${medication.id}`,
                                });
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredDispensed.map((medication) => (
                  <Card key={medication.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{medication.patient_name || "N/A"}</div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Dispensed
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>OPD/IPD: {medication.opd_no || medication.ipd_no || "N/A"}</div>
                        <div>Medication: {medication.medication_name}</div>
                        <div>Dosage: {medication.dosage}</div>
                        <div>Frequency: {medication.frequency}</div>
                        <div>Doctor: {medication.doctor_name}</div>
                        <div>Pharmacist: {medication.pharmacist_name}</div>
                        <div>Dispensed: {formatDate(medication.dispensed_date)}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            toast({
                              title: "View Details",
                              description: `Viewing details for dispensed medication #${medication.id}`,
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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