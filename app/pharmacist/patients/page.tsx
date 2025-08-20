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
  Users,
  AlertCircle,
  RefreshCw,
  Pill,
  FileText
} from "lucide-react";
import Link from "next/link";

interface Patient {
  uhid: string;
  full_name: string;
  gender: string;
  age: number;
  mobile: string;
  aadhaar: string;
  address: string;
  created_at: string;
  opd_count?: number;
  ipd_count?: number;
  medication_count?: number;
}

export default function PharmacistPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagePatients, setPagePatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(20);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);

      // Get all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (patientsError) throw patientsError;

      // Enrich patient data with counts
      const enrichedPatients = await Promise.all(
        (patientsData || []).map(async (patient) => {
          // Get OPD visit count
          const { data: opdData } = await supabase
            .from("opd_visits")
            .select("opd_no")
            .eq("uhid", patient.uhid);

          // Get IPD admission count
          const { data: ipdData } = await supabase
            .from("ipd_admissions")
            .select("ipd_no")
            .eq("uhid", patient.uhid);

          // Get medication count
          const { data: medicationData } = await supabase
            .from("internal_medications")
            .select("id")
            .or(`opd_no.in.(${opdData?.map(o => o.opd_no).join(',') || ''}),ipd_no.in.(${ipdData?.map(i => i.ipd_no).join(',') || ''})`);

          return {
            ...patient,
            opd_count: opdData?.length || 0,
            ipd_count: ipdData?.length || 0,
            medication_count: medicationData?.length || 0,
          };
        })
      );

      setPatients(enrichedPatients);
    } catch (error) {
      console.error("Error loading patients:", error);
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

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = 
      patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.uhid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mobile?.includes(searchTerm) ||
      patient.aadhaar?.includes(searchTerm);
    
    const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
    
    return matchesSearch && matchesGender;
  });

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  // Server-side pagination when no filters/search are active
  const canUseServerPagination = searchTerm.trim() === "" && genderFilter === "all";

  useEffect(() => {
    async function loadServerPage() {
      if (!canUseServerPagination) return;
      setLoading(true);
      const from = (currentPage - 1) * patientsPerPage;
      const to = from + patientsPerPage - 1;
      try {
        const { data, count, error } = await supabase
          .from("patients")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);
        if (error) throw error;
        setPagePatients((data || []) as Patient[]);
        setTotalCount(count || 0);
      } finally {
        setLoading(false);
      }
    }
    loadServerPage();
  }, [canUseServerPagination, currentPage, patientsPerPage]);

  const currentPatients = canUseServerPagination
    ? pagePatients
    : filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil((canUseServerPagination ? totalCount : filteredPatients.length) / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Patients</h1>
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
        <h1 className="text-3xl font-bold">Patients</h1>
        <Button onClick={loadPatients} variant="outline" size="sm">
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
                  placeholder="Search by name, UHID, mobile, or Aadhaar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-40">
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

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Patients ({canUseServerPagination ? totalCount : filteredPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(canUseServerPagination ? pagePatients.length === 0 : filteredPatients.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Patient</th>
                    <th className="text-left p-3 font-medium">Contact</th>
                    <th className="text-left p-3 font-medium">Age/Gender</th>
                    <th className="text-left p-3 font-medium">Visits</th>
                    <th className="text-left p-3 font-medium">Medications</th>
                    <th className="text-left p-3 font-medium">Registered Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((patient) => (
                    <tr key={patient.uhid} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{patient.full_name}</div>
                        <div className="text-sm text-gray-500 font-mono">{patient.uhid}</div>
                        <div className="text-sm text-gray-500">{patient.address}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{patient.mobile}</div>
                        <div className="text-sm text-gray-500">{patient.aadhaar}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{patient.age} years</span>
                          {getGenderBadge(patient.gender)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            OPD: {patient.opd_count}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            IPD: {patient.ipd_count}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          {patient.medication_count} medications
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(patient.created_at)}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/pharmacist/patients/${patient.uhid}/profile`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Profile
                            </Button>
                          </Link>
                          <Link href={`/pharmacist/patients/${patient.uhid}/medications`}>
                            <Button size="sm" variant="outline">
                              <Pill className="h-4 w-4 mr-1" />
                              Medications
                            </Button>
                          </Link>
                          <Link href={`/pharmacist/patients/${patient.uhid}/case-sheets`}>
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-1" />
                              Case Sheets
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
      
      {/* Pagination Controls */}
      {(canUseServerPagination ? totalCount : filteredPatients.length) > patientsPerPage && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {canUseServerPagination ? (
                  <>Showing {(currentPage - 1) * patientsPerPage + 1} to {Math.min(currentPage * patientsPerPage, totalCount)} of {totalCount} patients</>
                ) : (
                  <>Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients</>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1"
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className="px-3 py-1 min-w-[40px]"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 