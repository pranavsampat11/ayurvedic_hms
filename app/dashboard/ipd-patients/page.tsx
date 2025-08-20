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

export default function IPDPatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState("patient.full_name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null
  const router = useRouter();

  useEffect(() => {
    async function fetchIPDPatients() {
      if (!doctorId) return;
      
      // Get IPD admissions for the doctor
      const { data: ipdAdmissions, error: ipdError } = await supabase
        .from("ipd_admissions")
        .select(`*,
          patient:uhid(full_name, age, gender, mobile, address),
          opd_visit:opd_no(opd_no, visit_date),
          doctor:doctor_id(full_name)
        `)
        .eq("doctor_id", doctorId);

      if (ipdError) {
        console.error("Error fetching IPD admissions:", ipdError);
        setLoading(false);
        return;
      }

      console.log("IPD patients data:", ipdAdmissions);
      setPatients(ipdAdmissions || []);
      setLoading(false);
    }
    fetchIPDPatients();
  }, [doctorId]);

  const filtered = patients
    .filter(p => {
      if (!search && !filterStatus && !filterGender && !fromDate && !toDate) return true;
      const s = search.toLowerCase();
      const matchesSearch =
        p.patient?.full_name?.toLowerCase().includes(s) ||
        p.uhid?.toLowerCase().includes(s) ||
        p.ipd_no?.toLowerCase().includes(s) ||
        p.patient?.mobile?.toLowerCase().includes(s) ||
        p.admission_reason?.toLowerCase().includes(s);
      const matchesStatus = !filterStatus || p.status === filterStatus;
      const matchesGender = !filterGender || p.patient?.gender === filterGender;
      const matchesFrom = !fromDate || new Date(p.admission_date) >= new Date(fromDate);
      const matchesTo = !toDate || new Date(p.admission_date) <= new Date(new Date(toDate).setHours(23,59,59,999));
      return matchesSearch && matchesStatus && matchesGender && matchesFrom && matchesTo;
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
      } else if (sortKey === "doctor.full_name") {
        aVal = a.doctor?.full_name || "";
        bVal = b.doctor?.full_name || "";
      } else if (sortKey === "admission_reason") {
        aVal = a.admission_reason || "";
        bVal = b.admission_reason || "";
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

  return (
    <DoctorDashboardLayout title="IPD Patients">
      <div>
        <h1 className="text-2xl font-bold mb-4">IPD Patients</h1>
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <Input
            placeholder="Search patients by name, UHID, IPD No, or contact..."
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
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Status</option>
            <option value="admitted">Admitted</option>
            <option value="discharged">Discharged</option>
            <option value="transferred">Transferred</option>
          </select>
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <Button
            variant="outline"
            onClick={() => { setSearch(""); setFromDate(""); setToDate(""); setFilterStatus(""); setFilterGender(""); }}
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
                    onClick={() => handleSort("doctor.full_name")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Doctor
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("admission_reason")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Admission Reason
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("status")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    Status
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort("admission_date")}
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors px-4 py-3"
                  >
                    <div className="flex items-center gap-1">
                      Admission Date
                      {sortKey === "admission_date" && (
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
                    Reason
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 px-4 py-3">
                    UHID
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 px-4 py-3">
                    IPD Number
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 px-4 py-3">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-lg">No IPD patients found</p>
                          <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p, index) => (
                    <TableRow 
                      key={p.ipd_no} 
                      className={`cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}
                      onClick={() => router.push(`/dashboard/patients/${p.ipd_no}/initial-assessment`)}
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
                        <div className="text-slate-700 font-medium">{p.doctor?.full_name || '-'}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 max-w-xs truncate" title={p.admission_reason}>
                          {p.admission_reason || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          p.status === 'admitted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          p.status === 'discharged' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 font-medium">{p.admission_date}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-slate-700 max-w-xs truncate" title={p.admission_reason}>
                          {p.admission_reason || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="font-mono text-sm text-slate-700 font-medium">{p.uhid}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="font-mono text-sm text-slate-700 font-medium">{p.ipd_no}</div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/patients/${p.ipd_no}/initial-assessment`);
                          }}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                        >
                          View Details
                        </Button>
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