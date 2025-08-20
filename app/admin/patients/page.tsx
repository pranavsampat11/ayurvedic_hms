"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, User, Calendar, MapPin, Phone } from "lucide-react";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [pagePatients, setPagePatients] = useState<any[]>([]); // server-side page data
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [uhidToDeptId, setUhidToDeptId] = useState<Record<string, number>>({});
  const [uhidToSubDeptId, setUhidToSubDeptId] = useState<Record<string, number>>({});
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>("all");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all"); // all | opd | ipd
  const [sortBy, setSortBy] = useState<string>("date_desc"); // date_desc | date_asc | name_asc | name_desc
  const [opdUhids, setOpdUhids] = useState<string[]>([]);
  const [ipdUhids, setIpdUhids] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0); // server-side total
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(20);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPatients(data || []);
        setFilteredPatients(data || []);
      } catch (error: any) {
        console.error("Error fetching patients:", error?.message || error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  // Load departments and OPD/IPD sets
  useEffect(() => {
    async function fetchFiltersMeta() {
      try {
        const [
          { data: deptData },
          { data: subDeptData },
          { data: opdData },
          { data: ipdData },
          { data: apptData }
        ] = await Promise.all([
          supabase.from('departments').select('id, name').order('name', { ascending: true }),
          supabase.from('sub_departments').select('id, name, department_id'),
          supabase.from('opd_visits').select('uhid'),
          supabase.from('ipd_admissions').select('uhid'),
          supabase.from('appointments').select('uhid, department_id, sub_department_id, appointment_date').order('appointment_date', { ascending: false })
        ]);
        setDepartments(deptData || []);
        setSubDepartments(subDeptData || []);
        setOpdUhids((opdData || []).map((r: any) => r.uhid));
        setIpdUhids((ipdData || []).map((r: any) => r.uhid));

        // Build UHID -> latest department/sub-department map from appointments
        const deptMap: Record<string, number> = {};
        const subDeptMap: Record<string, number> = {};
        (apptData || []).forEach((row: any) => {
          // Since results are ordered desc by date, first occurrence per UHID is latest
          if (row?.uhid && deptMap[row.uhid] === undefined) {
            if (row.department_id != null) deptMap[row.uhid] = row.department_id;
            if (row.sub_department_id != null) subDeptMap[row.uhid] = row.sub_department_id;
          }
        });
        setUhidToDeptId(deptMap);
        setUhidToSubDeptId(subDeptMap);
      } catch (e) {
        console.warn('Failed loading filter metadata', e);
      }
    }

    fetchFiltersMeta();
  }, []);

  // Determine if we can use server-side pagination (no filters/search, default sort)
  const canUseServerPagination =
    search.trim() === "" &&
    filterDepartmentId === "all" &&
    filterFromDate === "" &&
    filterToDate === "" &&
    filterType === "all" &&
    sortBy === "date_desc";

  // Server-side pagination
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
        setPagePatients(data || []);
        setTotalCount(count || 0);
      } catch (e) {
        console.warn("Server pagination failed", e);
        setPagePatients([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }
    loadServerPage();
  }, [canUseServerPagination, currentPage, patientsPerPage]);

  // Client-side pagination fallback
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = canUseServerPagination
    ? pagePatients
    : filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil((canUseServerPagination ? totalCount : filteredPatients.length) / patientsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const searchText = search.trim().toLowerCase();
    const opdSet = new Set(opdUhids);
    const ipdSet = new Set(ipdUhids);

    let result = patients.filter((patient) => {
      // Search text match
      const matchesSearch =
        searchText === "" ||
        patient.full_name?.toLowerCase().includes(searchText) ||
        patient.uhid?.toLowerCase().includes(searchText) ||
        patient.mobile?.includes(searchText) ||
        patient.departments?.name?.toLowerCase().includes(searchText);

      if (!matchesSearch) return false;

      // Department filter
      if (filterDepartmentId !== "all") {
        const deptId = uhidToDeptId[patient.uhid];
        if (String(deptId || '') !== filterDepartmentId) return false;
      }

      // Date range filter on created_at
      if (filterFromDate) {
        if (new Date(patient.created_at) < new Date(filterFromDate)) return false;
      }
      if (filterToDate) {
        // include the day by adding 1 day to toDate end-of-day
        const toDate = new Date(filterToDate);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(patient.created_at) > toDate) return false;
      }

      // Type filter
      if (filterType === 'opd') {
        return opdSet.has(patient.uhid);
      }
      if (filterType === 'ipd') {
        return ipdSet.has(patient.uhid);
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'name_desc':
          return (b.full_name || '').localeCompare(a.full_name || '');
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredPatients(result);
    setCurrentPage(1);
  }, [search, patients, filterDepartmentId, filterFromDate, filterToDate, filterType, sortBy, opdUhids, ipdUhids]);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patients...</div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Total Patients</h1>
            <p className="text-sm text-gray-600">Manage and view all patient records</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Total: {canUseServerPagination ? totalCount : filteredPatients.length}</span>
            </div>
            {filterType !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {filterType.toUpperCase()} only
              </span>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, UHID, mobile, or department..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="w-48">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patients</SelectItem>
                      <SelectItem value="opd">OPD Patients</SelectItem>
                      <SelectItem value="ipd">IPD Patients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-56">
                  <Select value={filterDepartmentId} onValueChange={setFilterDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">From</span>
                  <Input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">To</span>
                  <Input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} />
                </div>
                <div className="w-48 ml-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest first</SelectItem>
                      <SelectItem value="date_asc">Oldest first</SelectItem>
                      <SelectItem value="name_asc">Name A→Z</SelectItem>
                      <SelectItem value="name_desc">Name Z→A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setFilterDepartmentId("all");
                    setFilterFromDate("");
                    setFilterToDate("");
                    setFilterType("all");
                    setSortBy("date_desc");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Info</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(canUseServerPagination ? pagePatients.length === 0 : filteredPatients.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No patients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPatients.map((patient) => (
                      <TableRow key={patient.uhid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{patient.full_name}</div>
                              <div className="text-sm text-gray-500">UHID: {patient.uhid}</div>
                              <div className="text-sm text-gray-500">{patient.age} years • {patient.gender}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {patient.mobile}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {patient.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {departments.find((d) => String(d.id) === String(uhidToDeptId[patient.uhid]))?.name || 'N/A'}
                            </div>
                            {uhidToSubDeptId[patient.uhid] && (
                              <div className="text-sm text-gray-500">
                                {subDepartments.find((sd) => String(sd.id) === String(uhidToSubDeptId[patient.uhid]))?.name || ''}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {new Date(patient.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            patient.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {patient.status || 'Active'}
                          </span>
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
    </AdminDashboardLayout>
  );
} 