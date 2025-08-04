"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import DoctorDashboardLayout from "@/components/doctor-dashboard-layout";
import { supabase } from "@/lib/supabaseClient"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function MyPatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [allPatients, setAllPatients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState("patient.full_name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const [filterType, setFilterType] = useState(""); // OPD/IPD filter
  const [showTodaysAppointments, setShowTodaysAppointments] = useState(false);
  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null
  const router = useRouter();

  useEffect(() => {
    async function fetchPatients() {
      if (!doctorId) return;
      
      // First, get all appointments for the doctor
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`*,
          patient:uhid(full_name, age, gender, mobile, address),
          department:department_id(name),
          sub_department:sub_department_id(name)
        `)
        .eq("doctor_id", doctorId);

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        setLoading(false);
        return;
      }

      // For each appointment, get the OPD visit and check if case sheet exists
      const enrichedPatients = await Promise.all(
        (appointments || []).map(async (appointment) => {
          // Get OPD visit for this appointment
          const { data: opdVisit } = await supabase
            .from("opd_visits")
            .select("opd_no, visit_date")
            .eq("appointment_id", appointment.id)
            .single();

          // Check if case sheet exists for this OPD
          let hasCaseSheet = false;
          if (opdVisit?.opd_no) {
            const { data: caseSheet } = await supabase
              .from("opd_case_sheets")
              .select("id")
              .eq("opd_no", opdVisit.opd_no)
              .single();
            hasCaseSheet = !!caseSheet;
          }

          // Update appointment status to "seen" if case sheet exists
          if (hasCaseSheet && appointment.status !== "seen") {
            await supabase
              .from("appointments")
              .update({ status: "seen" })
              .eq("id", appointment.id);
          }

          return {
            ...appointment,
            opd_visit: opdVisit,
            has_case_sheet: hasCaseSheet,
            status: hasCaseSheet ? "seen" : appointment.status
          };
        })
      );

      console.log("Enriched patients data:", enrichedPatients);
      setAllPatients(enrichedPatients);
      setPatients(enrichedPatients);
      setLoading(false);
    }
    fetchPatients();
  }, [doctorId]);

  const filtered = patients
    .filter(p => {
      if (!search && !fromDate && !toDate && !filterStatus && !filterGender && !filterType) return true;
      const s = search.toLowerCase();
      const matchesSearch =
        p.patient?.full_name?.toLowerCase().includes(s) ||
        p.uhid?.toLowerCase().includes(s) ||
        p.opd_visit?.opd_no?.toLowerCase().includes(s) ||
        p.patient?.mobile?.toLowerCase().includes(s) ||
        p.patient?.address?.toLowerCase().includes(s) ||
        p.reason?.toLowerCase().includes(s);
      const matchesStatus = !filterStatus || p.status === filterStatus;
      const matchesGender = !filterGender || p.patient?.gender === filterGender;
      const scheduled = p.appointment_date ? p.appointment_date : "";
      const matchesFrom = !fromDate || scheduled >= fromDate;
      const matchesTo = !toDate || scheduled <= toDate;
      
      // Filter by OPD/IPD type
      let matchesType = true;
      if (filterType === "opd") {
        matchesType = !!p.opd_visit?.opd_no;
      } else if (filterType === "ipd") {
        matchesType = !p.opd_visit?.opd_no; // IPD patients won't have OPD visits
      }
      
      return matchesSearch && matchesStatus && matchesGender && matchesFrom && matchesTo && matchesType;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      // Handle nested properties for sorting
      if (sortKey === "patient.full_name") {
        aVal = a.patient?.full_name || "";
        bVal = b.patient?.full_name || "";
      } else if (sortKey === "patient.age") {
        aVal = a.patient?.age || 0;
        bVal = b.patient?.age || 0;
      } else if (sortKey === "patient.mobile") {
        aVal = a.patient?.mobile || "";
        bVal = b.patient?.mobile || "";
      } else if (sortKey === "department.name") {
        aVal = a.department?.name || "";
        bVal = b.department?.name || "";
      } else if (sortKey === "sub_department.name") {
        aVal = a.sub_department?.name || "";
        bVal = b.sub_department?.name || "";
      } else {
        aVal = a[sortKey] || "";
        bVal = b[sortKey] || "";
      }
      
      // Handle string vs number comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const handleTodaysAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    if (showTodaysAppointments) {
      setPatients(allPatients);
      setShowTodaysAppointments(false);
    } else {
      const todaysPatients = allPatients.filter(p => p.appointment_date === today);
      setPatients(todaysPatients);
      setShowTodaysAppointments(true);
    }
  }

  const handleSuggestIPD = async (p: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    console.log("Full patient data:", p);
    const opdNo = p.opd_visit?.opd_no;
    const uhid = p.uhid; // UHID is the foreign key in appointments table
    if (!opdNo || !uhid || !doctorId) {
      console.log("Debug info:", { opdNo, uhid, doctorId });
      toast({ title: "Missing Data", description: "Cannot suggest IPD admission without OPD No, patient, or doctor info.", variant: "destructive" });
      return;
    }
    
    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("opd_to_ipd_requests")
      .select("*")
      .eq("opd_no", opdNo)
      .eq("status", "pending")
      .single();
    
    if (existingRequest) {
      toast({ title: "Request Already Exists", description: "An IPD admission request is already pending for this patient.", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase.from("opd_to_ipd_requests").insert([
      {
        opd_no: opdNo,
        uhid: uhid,
        doctor_id: doctorId,
        status: "pending",
        notes: `IPD admission requested by doctor for patient ${p.patient.full_name}`
      }
    ]);
    
    if (error) {
      toast({ title: "Request Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Sent", description: "IPD admission request sent to receptionist." });
    }
  };

  return (
    <DoctorDashboardLayout title="My Patients">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">My Patients</h1>
          <Button 
            onClick={handleTodaysAppointments}
            variant={showTodaysAppointments ? "default" : "outline"}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {showTodaysAppointments ? "Show All Patients" : "Today's Appointments"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <Input
            placeholder="Search by name, UHID, OPD No, or contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex flex-col">
            <label className="text-xs mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="From Date"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="To Date"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="seen">Seen</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Types</option>
            <option value="opd">OPD Patients</option>
            <option value="ipd">IPD Patients</option>
          </select>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearch("");
              setFromDate("");
              setToDate("");
              setFilterStatus("");
              setFilterGender("");
              setFilterType("");
              setShowTodaysAppointments(false);
              setPatients(allPatients);
            }}
            className="text-sm"
          >
            Clear Filters
          </Button>
        </div>
        {loading ? <div>Loading...</div> : (
          <div className="overflow-auto border border-slate-200 rounded-lg shadow-sm bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <TableHead 
                    onClick={() => handleSort("patient.full_name")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    <div className="flex items-center gap-1">
                      Patient Name
                      {sortKey === "patient.full_name" && (
                        sortDir === "asc" ? 
                        <ArrowUp className="inline w-4 h-4 text-blue-600" /> : 
                        <ArrowDown className="inline w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("patient.age")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    <div className="flex items-center gap-1">
                      Age / Gender
                      {sortKey === "patient.age" && (
                        sortDir === "asc" ? 
                        <ArrowUp className="inline w-4 h-4 text-blue-600" /> : 
                        <ArrowDown className="inline w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("patient.mobile")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Contact Number
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("department.name")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Department
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("sub_department.name")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Sub-Department
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("status")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Status
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("appointment_date")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    <div className="flex items-center gap-1">
                      Consultation Date
                      {sortKey === "appointment_date" && (
                        sortDir === "asc" ? 
                        <ArrowUp className="inline w-4 h-4 text-blue-600" /> : 
                        <ArrowDown className="inline w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("reason")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Complaint
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 px-4 py-3">
                    OPD Number
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 px-4 py-3">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">No patients found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p, index) => (
                    <TableRow 
                      key={p.id} 
                      className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}
                      onClick={() => router.push(`/dashboard/patients/${p.opd_visit?.opd_no || 'opd'}/initial-assessment`)}
                    >
                      <TableCell className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{p.patient?.full_name}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700">
                          <span className="font-semibold">{p.patient?.age}</span>
                          <span className="text-slate-500 ml-1">/ {p.patient?.gender}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 font-mono text-sm">{p.patient?.mobile}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 font-medium">{p.department?.name || '-'}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700">{p.sub_department?.name || '-'}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            p.has_case_sheet ? "text-emerald-600" : 
                            p.status === 'pending' ? "text-amber-600" : 
                            p.status === 'seen' ? "text-blue-600" : 
                            "text-slate-600"
                          }`}>
                            {p.status}
                          </span>
                          {p.has_case_sheet && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full border border-emerald-200 font-medium">
                              Case Sheet
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 font-medium">{p.appointment_date}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 max-w-xs truncate" title={p.reason}>
                          {p.reason || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="font-mono text-sm text-slate-700 font-medium">{p.opd_visit?.opd_no || '-'}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {p.status !== 'admitted' && p.opd_visit?.opd_no && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => handleSuggestIPD(p, e)}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                          >
                            Suggest IPD Admission
                          </Button>
                        )}
                        {!p.opd_visit?.opd_no && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            No OPD Visit
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DoctorDashboardLayout>
  )
} 