"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUp, ArrowDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NurseOPDPatientsPage() {
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
  const [showTodaysAppointments, setShowTodaysAppointments] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchPatients() {
      // All appointments (no doctor filter)
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`*,
          patient:uhid(full_name, age, gender, mobile, address),
          department:department_id(name),
          sub_department:sub_department_id(name)
        `);
      if (error) {
        console.error("Error fetching appointments:", error);
        setLoading(false);
        return;
      }

      // Enrich with OPD visit
      const enriched = await Promise.all(
        (appointments || []).map(async (appointment) => {
          const { data: opdVisit } = await supabase
            .from("opd_visits")
            .select("opd_no, visit_date")
            .eq("appointment_id", appointment.id)
            .maybeSingle();

          let hasCaseSheet = false;
          if (opdVisit?.opd_no) {
            const { data: caseSheet } = await supabase
              .from("opd_case_sheets")
              .select("id")
              .eq("opd_no", opdVisit.opd_no)
              .maybeSingle();
            hasCaseSheet = !!caseSheet;
          }

          return {
            ...appointment,
            opd_visit: opdVisit,
            has_case_sheet: hasCaseSheet,
            status: hasCaseSheet ? "seen" : appointment.status,
          };
        })
      );

      // Only OPD patients
      const onlyOPD = enriched.filter((p) => !!p.opd_visit?.opd_no);
      setAllPatients(onlyOPD);
      setPatients(onlyOPD);
      setLoading(false);
    }
    fetchPatients();
  }, []);

  const filtered = patients
    .filter(p => {
      if (!search && !fromDate && !toDate && !filterStatus && !filterGender) return true;
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
      return matchesSearch && matchesStatus && matchesGender && matchesFrom && matchesTo;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortKey === "patient.full_name") { aVal = a.patient?.full_name || ""; bVal = b.patient?.full_name || ""; }
      else if (sortKey === "patient.age") { aVal = a.patient?.age || 0; bVal = b.patient?.age || 0; }
      else if (sortKey === "patient.mobile") { aVal = a.patient?.mobile || ""; bVal = b.patient?.mobile || ""; }
      else if (sortKey === "department.name") { aVal = a.department?.name || ""; bVal = b.department?.name || ""; }
      else if (sortKey === "sub_department.name") { aVal = a.sub_department?.name || ""; bVal = b.sub_department?.name || ""; }
      else { aVal = a[sortKey] || ""; bVal = b[sortKey] || ""; }
      if (typeof aVal === "string" && typeof bVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">OPD Patients</h1>
        <Button 
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            if (showTodaysAppointments) { setPatients(allPatients); setShowTodaysAppointments(false); }
            else { setPatients(allPatients.filter(p => p.appointment_date === today)); setShowTodaysAppointments(true); }
          }}
          variant={showTodaysAppointments ? "default" : "outline"}
          className="bg-black hover:bg-gray-800 text-white"
        >
          {showTodaysAppointments ? "Show All Patients" : "Today's Appointments"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <Input placeholder="Search by name, UHID, OPD No, or contact..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <div className="flex flex-col">
          <label className="text-xs mb-1">From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1">To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1" />
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
        <Button variant="outline" onClick={() => { setSearch(""); setFromDate(""); setToDate(""); setFilterStatus(""); setFilterGender(""); setShowTodaysAppointments(false); setPatients(allPatients); }} className="text-sm">Clear Filters</Button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="overflow-auto border border-slate-200 rounded-lg shadow-sm bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <TableHead onClick={() => handleSort("patient.full_name")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">
                  <div className="flex items-center gap-1">Patient Name {sortKey === "patient.full_name" && (sortDir === "asc" ? <ArrowUp className="inline w-4 h-4 text-blue-600" /> : <ArrowDown className="inline w-4 h-4 text-blue-600" />)}</div>
                </TableHead>
                <TableHead onClick={() => handleSort("patient.age")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">
                  <div className="flex items-center gap-1">Age / Gender {sortKey === "patient.age" && (sortDir === "asc" ? <ArrowUp className="inline w-4 h-4 text-blue-600" /> : <ArrowDown className="inline w-4 h-4 text-blue-600" />)}</div>
                </TableHead>
                <TableHead onClick={() => handleSort("patient.mobile")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">Contact Number</TableHead>
                <TableHead onClick={() => handleSort("department.name")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">Department</TableHead>
                <TableHead onClick={() => handleSort("sub_department.name")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">Sub-Department</TableHead>
                <TableHead onClick={() => handleSort("status")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">Status</TableHead>
                <TableHead onClick={() => handleSort("appointment_date")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">
                  <div className="flex items-center gap-1">Consultation Date {sortKey === "appointment_date" && (sortDir === "asc" ? <ArrowUp className="inline w-4 h-4 text-blue-600" /> : <ArrowDown className="inline w-4 h-4 text-blue-600" />)}</div>
                </TableHead>
                <TableHead onClick={() => handleSort("reason")} className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3">Complaint</TableHead>
                <TableHead className="font-semibold text-slate-700 px-4 py-3">OPD Number</TableHead>
                <TableHead className="font-semibold text-slate-700 px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-500">No OPD patients found</TableCell>
                </TableRow>
              ) : (
                filtered.map((p, index) => (
                  <TableRow key={p.id} className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`} onClick={() => router.push(`/dashboard/patients/${p.opd_visit?.opd_no || 'opd'}/initial-assessment`)}>
                    <TableCell className="px-4 py-4"><div className="font-semibold text-slate-900">{p.patient?.full_name}</div></TableCell>
                    <TableCell className="px-4 py-4"><div className="text-slate-700"><span className="font-semibold">{p.patient?.age}</span><span className="text-slate-500 ml-1">/ {p.patient?.gender}</span></div></TableCell>
                    <TableCell className="px-4 py-4"><div className="text-slate-700 font-mono text-sm">{p.patient?.mobile}</div></TableCell>
                    <TableCell className="px-4 py-4"><div className="text-slate-700 font-medium">{p.department?.name || '-'}</div></TableCell>
                    <TableCell className="px-4 py-4"><div className="text-slate-700">{p.sub_department?.name || '-'}</div></TableCell>
                    <TableCell className="px-4 py-4"><span className={`font-semibold ${p.has_case_sheet ? "text-emerald-600" : p.status === 'pending' ? "text-amber-600" : p.status === 'seen' ? "text-blue-600" : "text-slate-600"}`}>{p.status}</span></TableCell>
                    <TableCell className="px-4 py-4"><div className="text-slate-700 font-medium">{p.appointment_date}</div></TableCell>
                    <TableCell className="px-4 py-4"><div className="text-slate-700 max-w-xs truncate" title={p.reason}>{p.reason || '-'}</div></TableCell>
                    <TableCell className="px-4 py-4"><div className="font-mono text-sm text-slate-700 font-medium">{p.opd_visit?.opd_no || '-'}</div></TableCell>
                    <TableCell className="px-4 py-4"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/patients/${p.opd_visit?.opd_no || 'opd'}/initial-assessment`); }}>View</Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 