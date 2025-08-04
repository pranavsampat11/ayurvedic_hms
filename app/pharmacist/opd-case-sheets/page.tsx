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

interface OPDCaseSheet {
  id: number;
  opd_no: string;
  doctor_id: string;
  patient_name: string;
  age: number;
  gender: string;
  contact: string;
  address: string;
  doctor: string;
  department: string;
  chief_complaints: string;
  diagnosis: string;
  treatment_plan: string;
  created_at: string;
  doctor_name?: string;
  patient_uhid?: string;
}

export default function OPDCaseSheetsPage() {
  const [caseSheets, setCaseSheets] = useState<OPDCaseSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  useEffect(() => {
    loadOPDCaseSheets();
  }, []);

  const loadOPDCaseSheets = async () => {
    try {
      setLoading(true);

      // Get OPD case sheets with doctor information
      const { data: caseSheetsData, error: caseSheetsError } = await supabase
        .from("opd_case_sheets")
        .select(`
          *,
          doctor:doctor_id(full_name)
        `)
        .order("created_at", { ascending: false });

      if (caseSheetsError) throw caseSheetsError;

      // Process and enrich the data
      const enrichedCaseSheets = await Promise.all(
        (caseSheetsData || []).map(async (caseSheet) => {
          // Get patient UHID from OPD visit
          const { data: opdData } = await supabase
            .from("opd_visits")
            .select("uhid")
            .eq("opd_no", caseSheet.opd_no)
            .single();

          return {
            ...caseSheet,
            doctor_name: (caseSheet.doctor as any)?.full_name || "",
            patient_uhid: opdData?.uhid || "",
          };
        })
      );

      setCaseSheets(enrichedCaseSheets);
    } catch (error) {
      console.error("Error loading OPD case sheets:", error);
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

  const filteredCaseSheets = caseSheets.filter((caseSheet) => {
    const matchesSearch = 
      caseSheet.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.opd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseSheet.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || caseSheet.department === departmentFilter;
    const matchesGender = genderFilter === "all" || caseSheet.gender === genderFilter;
    
    return matchesSearch && matchesDepartment && matchesGender;
  });

  const departments = Array.from(new Set(caseSheets.map(cs => cs.department).filter(Boolean)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">OPD Case Sheets</h1>
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
        <h1 className="text-3xl font-bold">OPD Case Sheets</h1>
        <Button onClick={loadOPDCaseSheets} variant="outline" size="sm">
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
                  placeholder="Search by patient name, OPD number, doctor, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
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
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Case Sheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            OPD Case Sheets ({filteredCaseSheets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCaseSheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No OPD case sheets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Patient</th>
                      <th className="text-left p-3 font-medium">OPD No</th>
                      <th className="text-left p-3 font-medium">Age/Gender</th>
                      <th className="text-left p-3 font-medium">Doctor</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Diagnosis</th>
                      <th className="text-left p-3 font-medium">Created Date</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCaseSheets.map((caseSheet) => (
                      <tr key={caseSheet.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{caseSheet.patient_name}</div>
                          <div className="text-sm text-gray-500">{caseSheet.patient_uhid}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-mono">{caseSheet.opd_no}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{caseSheet.age} years</span>
                            {getGenderBadge(caseSheet.gender)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{caseSheet.doctor_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{caseSheet.department}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm max-w-xs truncate" title={caseSheet.diagnosis}>
                            {caseSheet.diagnosis || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{formatDate(caseSheet.created_at)}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Link href={`/pharmacist/opd-case-sheets/${caseSheet.id}`}>
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredCaseSheets.map((caseSheet) => (
                  <Card key={caseSheet.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{caseSheet.patient_name}</div>
                        {getGenderBadge(caseSheet.gender)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>UHID: {caseSheet.patient_uhid}</div>
                        <div>OPD No: {caseSheet.opd_no}</div>
                        <div>Age: {caseSheet.age} years</div>
                        <div>Doctor: {caseSheet.doctor_name}</div>
                        <div>Department: {caseSheet.department}</div>
                        <div>Diagnosis: {caseSheet.diagnosis || "N/A"}</div>
                        <div>Created: {formatDate(caseSheet.created_at)}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link href={`/pharmacist/opd-case-sheets/${caseSheet.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/pharmacist/patients/${caseSheet.patient_uhid}/medications`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Pill className="h-4 w-4 mr-1" />
                            Medications
                          </Button>
                        </Link>
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