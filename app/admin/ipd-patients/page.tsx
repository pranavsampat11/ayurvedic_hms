"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bed, Search, User, Calendar, MapPin, Phone, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminIpdPatientsPage() {
  const [ipdPatients, setIpdPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all | active | discharged | admission_status
  const [genderFilter, setGenderFilter] = useState<string>("all"); // all | Male | Female | Other
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(25);

  useEffect(() => {
    async function fetchIpdPatients() {
      try {
        const { data, error } = await supabase
          .from("ipd_admissions")
          .select(`
            *,
            patients!inner(
              full_name,
              age,
              gender,
              mobile,
              address,
              uhid
            ),
            staff!inner(full_name),
            beds!inner(bed_number, room_number, ward)
          `)
          .order('admission_date', { ascending: false });

        if (error) throw error;

        setIpdPatients(data || []);
        setFilteredPatients(data || []);
      } catch (error) {
        console.error("Error fetching IPD patients:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchIpdPatients();
  }, []);

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const text = search.trim().toLowerCase();
    let result = ipdPatients.filter((row) => {
      // Search across name/ipd/uhid/doctor
      const matchesSearch =
        text === "" ||
        row.patients?.full_name?.toLowerCase().includes(text) ||
        row.ipd_no?.toLowerCase().includes(text) ||
        row.patients?.uhid?.toLowerCase().includes(text) ||
        row.staff?.full_name?.toLowerCase().includes(text) ||
        row.patients?.mobile?.includes(text);

      if (!matchesSearch) return false;

      // Date range on admission_date
      if (fromDate) {
        if (new Date(row.admission_date) < new Date(fromDate)) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(row.admission_date) > to) return false;
      }

      // Status filter: prefer explicit row.status else infer via discharge_date
      if (statusFilter !== "all") {
        const inferred = row.status || (row.discharge_date ? "discharged" : "active");
        if (inferred.toLowerCase() !== statusFilter) return false;
      }

      // Gender filter from patients.gender
      if (genderFilter !== "all") {
        if ((row.patients?.gender || "").toLowerCase() !== genderFilter.toLowerCase()) return false;
      }

      return true;
    });

    setFilteredPatients(result);
    setCurrentPage(1);
  }, [search, fromDate, toDate, statusFilter, genderFilter, ipdPatients]);

  const getStatusBadge = (dischargeDate: string | null) => {
    if (dischargeDate) {
      return <Badge variant="secondary">Discharged</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading IPD patients...</div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Total IPD Patients</h1>
            <p className="text-sm text-gray-600">Manage and view all IPD patient records</p>
          </div>
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Total: {ipdPatients.length}</span>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, UHID, IPD No, or contact..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-600">From</span>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">To</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="discharged">Discharged</option>
                </select>
              </div>

              <div>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                onClick={() => { setSearch(""); setFromDate(""); setToDate(""); setStatusFilter("all"); setGenderFilter("all"); }}
                className="border rounded px-3 py-2 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IPD Patient Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Info</TableHead>
                    <TableHead>IPD Details</TableHead>
                    <TableHead>Bed Assignment</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No IPD patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPatients.map((ipdPatient) => (
                      <TableRow key={ipdPatient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{ipdPatient.patients?.full_name}</div>
                              <div className="text-sm text-gray-500">UHID: {ipdPatient.patients?.uhid}</div>
                              <div className="text-sm text-gray-500">{ipdPatient.patients?.age} years • {ipdPatient.patients?.gender}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">IPD No: {ipdPatient.ipd_no}</div>
                            <div className="text-sm text-gray-500">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Admitted: {new Date(ipdPatient.admission_date).toLocaleDateString()}
                            </div>
                            {ipdPatient.discharge_date && (
                              <div className="text-sm text-gray-500">
                                <Calendar className="inline h-3 w-3 mr-1" />
                                Discharged: {new Date(ipdPatient.discharge_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                {ipdPatient.beds?.bed_number || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Room: {ipdPatient.beds?.room_number || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Ward: {ipdPatient.beds?.ward || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{ipdPatient.staff?.full_name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ipdPatient.discharge_date)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Pagination Controls */}
        {filteredPatients.length > patientsPerPage && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} IPD patients
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
    </AdminDashboardLayout>
  );
}
