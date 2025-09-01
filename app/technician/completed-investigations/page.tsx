"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, CheckCircle, User, Clock, Microscope } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Investigation {
  id: number;
  opd_no: string | null;
  ipd_no: string | null;
  requested_investigations: string;
  doctor_id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  notes: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
}

export default function CompletedInvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagePatients, setPagePatients] = useState<Investigation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const patientsPerPage = 20;

  useEffect(() => {
    loadCompletedInvestigations();
  }, []);

  useEffect(() => {
    filterInvestigations();
  }, [investigations, searchTerm, priorityFilter, startDate, endDate]);

  const loadCompletedInvestigations = async () => {
    try {
      setLoading(true);

      // Get all completed investigations
      const { data: investigationsData, error: investigationsError } = await supabase
        .from("requested_investigations")
        .select("*")
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      if (investigationsError) throw investigationsError;

      // Get patient names for OPD visits
      const opdNumbers = investigationsData?.filter(item => item.opd_no && item.opd_no !== "ULL").map(item => item.opd_no) || [];
      let opdData: any[] = [];
      if (opdNumbers.length > 0) {
        const { data, error: opdError } = await supabase
          .from("opd_visits")
          .select(`
            opd_no,
            uhid,
            patients(full_name)
          `)
          .in("opd_no", opdNumbers);
        
        if (opdError) console.error("Error fetching OPD data:", opdError);
        else opdData = data || [];
      }

      // Get patient names for IPD admissions
      const ipdNumbers = investigationsData?.filter(item => item.ipd_no && item.ipd_no !== "ULL").map(item => item.ipd_no) || [];
      let ipdData: any[] = [];
      if (ipdNumbers.length > 0) {
        const { data, error: ipdError } = await supabase
          .from("ipd_admissions")
          .select(`
            ipd_no,
            uhid,
            patients(full_name)
          `)
          .in("ipd_no", ipdNumbers);
        
        if (ipdError) console.error("Error fetching IPD data:", ipdError);
        else ipdData = data || [];
      }

      // Get doctor names
      const doctorIds = investigationsData?.map(item => item.doctor_id).filter(Boolean) || [];
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, full_name")
        .in("id", doctorIds);

      if (staffError) console.error("Error fetching staff data:", staffError);

      // Create lookup maps
      const opdMap = new Map();
      opdData?.forEach(opd => {
        opdMap.set(opd.opd_no, opd);
      });

      const ipdMap = new Map();
      ipdData?.forEach(ipd => {
        ipdMap.set(ipd.ipd_no, ipd);
      });

      const staffMap = new Map();
      staffData?.forEach(staff => {
        staffMap.set(staff.id, staff);
      });

      // Transform data to include patient and doctor names
      const transformedData = investigationsData?.map(item => {
        let patientName = "Unknown Patient";
        
        if (item.opd_no && opdMap.has(item.opd_no)) {
          const opd = opdMap.get(item.opd_no);
          patientName = opd.patients?.full_name || "Unknown Patient";
        } else if (item.ipd_no && ipdMap.has(item.ipd_no)) {
          const ipd = ipdMap.get(item.ipd_no);
          patientName = ipd.patients?.full_name || "Unknown Patient";
        }

        const doctorName = staffMap.get(item.doctor_id)?.full_name || "Unknown Doctor";

        return {
          ...item,
          patient_name: patientName,
          doctor_name: doctorName,
        };
      }) || [];

      setInvestigations(transformedData);
    } catch (error) {
      console.error("Error loading completed investigations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvestigations = () => {
    let filtered = investigations;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(investigation =>
        investigation.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investigation.requested_investigations.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investigation.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (investigation.opd_no && investigation.opd_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (investigation.ipd_no && investigation.ipd_no.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(investigation => investigation.priority === priorityFilter);
    }

    // Filter by date range (scheduled date)
    if (startDate) {
      filtered = filtered.filter(investigation => {
        if (!investigation.scheduled_date) return false;
        const scheduledDate = new Date(investigation.scheduled_date);
        const start = new Date(startDate);
        return scheduledDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter(investigation => {
        if (!investigation.scheduled_date) return false;
        const scheduledDate = new Date(investigation.scheduled_date);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        return scheduledDate <= end;
      });
    }

    setFilteredInvestigations(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVisitType = (investigation: Investigation) => {
    return investigation.opd_no ? "OPD" : "IPD";
  };

  const getVisitId = (investigation: Investigation) => {
    return investigation.opd_no || investigation.ipd_no;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredInvestigations.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredInvestigations.length / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, startDate, endDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Completed Investigations</h1>
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
        <h1 className="text-3xl font-bold">Completed Investigations</h1>
        <Badge variant="outline" className="text-sm">
          {filteredInvestigations.length} completed
        </Badge>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by patient name, investigation type, doctor, or visit ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-4 py-2"
                >
                  Clear Dates
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Investigations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Completed Investigations ({filteredInvestigations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvestigations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Microscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                {investigations.length === 0 ? "No Completed Investigations" : "No Results Found"}
              </h3>
              <p className="text-gray-600">
                {investigations.length === 0 
                  ? "No investigations have been completed yet."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Patient</th>
                    <th className="text-left p-3 font-medium">Investigation</th>
                    <th className="text-left p-3 font-medium">Visit ID</th>
                    <th className="text-left p-3 font-medium">Doctor</th>
                    <th className="text-left p-3 font-medium">Scheduled Date</th>
                    <th className="text-left p-3 font-medium">Priority</th>
                    <th className="text-left p-3 font-medium">Completed Date</th>
                    <th className="text-left p-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((investigation) => (
                    <tr key={investigation.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{investigation.patient_name || "Unknown Patient"}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm max-w-xs">
                          {investigation.requested_investigations}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <Badge variant="outline" className="text-xs">
                            {getVisitType(investigation)}: {getVisitId(investigation)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">Dr. {investigation.doctor_name || "Unknown"}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>{investigation.scheduled_date ? new Date(investigation.scheduled_date).toLocaleDateString() : "-"}</div>
                          {investigation.scheduled_time && (
                            <div className="text-xs text-gray-500">{investigation.scheduled_time}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getPriorityColor(investigation.priority)} text-xs`}>
                          {investigation.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-green-600 font-medium">
                          {formatDate(investigation.updated_at)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {investigation.notes || "-"}
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
      {filteredInvestigations.length > patientsPerPage && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredInvestigations.length)} of {filteredInvestigations.length} investigations
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
