"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Filter, 
  Eye, 
  FileText,
  AlertCircle,
  RefreshCw,
  Calendar,
  User,
  Pill
} from "lucide-react";
import Link from "next/link";

interface IPDCaseSheet {
  id: number;
  ipd_no: string;
  opd_no: string;
  doctor_id: string;
  department: string;
  ward: string;
  bed_no: string;
  admission_at: string;
  discharge_at: string | null;
  op_no: string;
  ip_no: string;
  age: number;
  gender: string;
  occupation: string;
  address: string;
  contact: string;
  present_complaints: string;
  diagnosis: string;
  treatment_plan: string;
  created_at: string;
  doctor_name?: string;
  patient_name?: string;
  patient_uhid?: string;
  status?: string;
}

export default function IPDCaseSheetsPage() {
  const [caseSheets, setCaseSheets] = useState<IPDCaseSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadIPDCaseSheets();
  }, []);

  const loadIPDCaseSheets = async () => {
    try {
      setLoading(true);

      // Get IPD case sheets with doctor information
      const { data: caseSheetsData, error: caseSheetsError } = await supabase
        .from("ipd_case_sheets")
        .select(`
          *,
          doctor:doctor_id(full_name)
        `)
        .order("created_at", { ascending: false });

      if (caseSheetsError) throw caseSheetsError;

      // Process and enrich the data
      const enrichedCaseSheets = await Promise.all(
        (caseSheetsData || []).map(async (caseSheet) => {
          // Get patient information from IPD admission
          const { data: ipdData } = await supabase
            .from("ipd_admissions")
            .select("uhid, patient:uhid(full_name)")
            .eq("ipd_no", caseSheet.ipd_no)
            .single();

          const status = caseSheet.discharge_at ? "Discharged" : "Admitted";

          return {
            ...caseSheet,
            doctor_name: (caseSheet.doctor as any)?.full_name || "",
            patient_name: (ipdData?.patient as any)?.full_name || "",
            patient_uhid: ipdData?.uhid || "",
            status,
          };
        })
      );

      setCaseSheets(enrichedCaseSheets);
    } catch (error) {
      console.error("Error loading IPD case sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getGenderBadge = (gender: string) => {
    switch (gender) {
      case "Male":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Male</Badge>;
      case "Female":
        return <Badge variant="secondary" className="bg-pink-100 text-pink-800">Female</Badge>;
      case "Other":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Other</Badge>;
      default:
        return <Badge variant="outline">{gender}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Admitted":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Admitted</Badge>;
      case "Discharged":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Discharged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCaseSheets = caseSheets.filter((caseSheet) => {
    const matchesSearch = 
      caseSheet.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.ipd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.opd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || caseSheet.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || caseSheet.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = Array.from(new Set(caseSheets.map(cs => cs.department).filter(Boolean)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">IPD Case Sheets</h1>
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
        <h1 className="text-3xl font-bold">IPD Case Sheets</h1>
        <Button onClick={loadIPDCaseSheets} variant="outline" size="sm">
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
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, IPD/OPD number, doctor, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="Discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Case Sheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            IPD Case Sheets ({filteredCaseSheets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCaseSheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No IPD case sheets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Patient</th>
                    <th className="text-left p-3 font-medium">IPD/OPD No</th>
                    <th className="text-left p-3 font-medium">Ward/Bed</th>
                    <th className="text-left p-3 font-medium">Doctor</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Admission Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaseSheets.map((caseSheet) => (
                    <tr key={caseSheet.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{caseSheet.patient_name}</div>
                        <div className="text-sm text-gray-500">{caseSheet.patient_uhid}</div>
                        <div className="text-sm text-gray-500">{caseSheet.age} years</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-mono">{caseSheet.ip_no}</div>
                        <div className="text-sm text-gray-500">{caseSheet.op_no}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{caseSheet.ward}</div>
                        <div className="text-sm text-gray-500">Bed {caseSheet.bed_no}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{caseSheet.doctor_name}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{caseSheet.department}</div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(caseSheet.status || "")}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(caseSheet.admission_at)}</div>
                        {caseSheet.discharge_at && (
                          <div className="text-sm text-gray-500">
                            Discharged: {formatDate(caseSheet.discharge_at)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/pharmacist/ipd-case-sheets/${caseSheet.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/pharmacist/patients/${caseSheet.patient_uhid}/medications`}>
                            <Button size="sm" variant="outline">
                              <Pill className="h-4 w-4 mr-1" />
                              Medications
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 