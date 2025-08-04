import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { departments } from "@/lib/data";

export default function PatientDetailsPage() {
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [doctorIdToName, setDoctorIdToName] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "OPD" | "IPD">("All");
  const [filterDepartment, setFilterDepartment] = useState<string>("All");
  const [filterSubDepartment, setFilterSubDepartment] = useState<string>("All");
  const [filterGender, setFilterGender] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>(undefined);
  const [filterToDate, setFilterToDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase.from("patients").select("*");
      if (!error && data) setAllPatients(data);
      // Fetch doctor names for all unique doctor_ids
      const uniqueDoctorIds = Array.from(new Set((data || []).map((p: any) => p.doctor_id).filter(Boolean)));
      if (uniqueDoctorIds.length > 0) {
        const { data: staffData } = await supabase.from("staff").select("id, name").in("id", uniqueDoctorIds);
        if (staffData) {
          const map: Record<string, string> = {};
          staffData.forEach((doc: any) => { map[doc.id] = doc.name; });
          setDoctorIdToName(map);
        }
      }
    }
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    let patients = [...allPatients];
    if (filterType !== "All") patients = patients.filter((p) => p.patient_type === filterType);
    if (filterDepartment !== "All") patients = patients.filter((p) => p.department === filterDepartment);
    if (filterSubDepartment !== "All") patients = patients.filter((p) => p.sub_department === filterSubDepartment);
    if (filterGender !== "All") patients = patients.filter((p) => p.gender === filterGender);
    if (filterStatus !== "All") patients = patients.filter((p) => p.status === filterStatus);
    if (filterFromDate) patients = patients.filter((p) => new Date(p.registered_at) >= filterFromDate);
    if (filterToDate) patients = patients.filter((p) => new Date(p.registered_at) <= filterToDate);
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      patients = patients.filter(
        (patient) =>
          (patient.first_name?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
          (patient.last_name?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
          (patient.uhid?.toLowerCase() || "").includes(lowerCaseSearchTerm) ||
          (patient.contact?.toLowerCase() || "").includes(lowerCaseSearchTerm)
      );
    }
    return patients;
  }, [allPatients, searchTerm, filterType, filterDepartment, filterSubDepartment, filterGender, filterStatus, filterFromDate, filterToDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPatients.length / pageSize);
  const paginatedPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  const handleClearFilters = () => {
    setFilterType("All");
    setFilterDepartment("All");
    setFilterSubDepartment("All");
    setFilterGender("All");
    setFilterStatus("All");
    setFilterFromDate(undefined);
    setFilterToDate(undefined);
    setSearchTerm("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">All Patient Details</h1>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Patient Filters
          </CardTitle>
          <CardDescription>Filter patients by various criteria.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <label>Patient Type</label>
              <Select value={filterType} onValueChange={(value: "All" | "OPD" | "IPD") => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="OPD">OPD</SelectItem>
                  <SelectItem value="IPD">IPD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Department</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Sub-department</label>
              <Select value={filterSubDepartment} onValueChange={setFilterSubDepartment} disabled={filterDepartment === "All"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sub-departments</SelectItem>
                  {(departments.find((d) => d.name === filterDepartment)?.subDepartments || []).map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Gender</label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Registration From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    {filterFromDate ? format(filterFromDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterFromDate}
                    onSelect={setFilterFromDate}
                    initialFocus
                    toDate={filterToDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label>Registration To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    {filterToDate ? format(filterToDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterToDate}
                    onSelect={setFilterToDate}
                    initialFocus
                    fromDate={filterFromDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2 col-span-full sm:col-span-2 md:col-span-3 lg:col-span-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
          <CardDescription>Paginated, filterable, and searchable patient details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients by name, UHID, or contact..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UHID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>OPD No</TableHead>
                  <TableHead>IPD No</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No patients found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPatients.map((patient) => (
                    <TableRow key={patient.uhid}>
                      <TableCell className="font-mono">{patient.uhid}</TableCell>
                      <TableCell>{patient.first_name} {patient.last_name}</TableCell>
                      <TableCell>{patient.age} / {patient.gender}</TableCell>
                      <TableCell>{patient.contact}</TableCell>
                      <TableCell>{patient.patient_type}</TableCell>
                      <TableCell>{patient.op_no || "-"}</TableCell>
                      <TableCell>{patient.ip_no || "-"}</TableCell>
                      <TableCell>{patient.department}</TableCell>
                      <TableCell>{doctorIdToName[patient.doctor_id] || patient.doctor_id || "-"}</TableCell>
                      <TableCell>{patient.status || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 