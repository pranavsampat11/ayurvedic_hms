// "use client";

// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Calendar, Clock, User, Activity, CheckCircle, AlertCircle, Search, Plus } from "lucide-react";
// import { supabase } from "@/lib/supabaseClient";

// export default function TherapistDashboard() {
//   const [therapistName, setTherapistName] = useState<string>("");
//   const [allAssignments, setAllAssignments] = useState<any[]>([]);
//   const [therapists, setTherapists] = useState<any[]>([]);
//   const [procedures, setProcedures] = useState<any[]>([]);
//   const [stats, setStats] = useState({
//     totalToday: 0,
//     completed: 0,
//     pending: 0,
//     totalPatients: 0,
//     totalTherapists: 0
//   });
//   const [loading, setLoading] = useState(true);
  
//   // Search and assignment states
//   // Avoid TSX generic parsing issues in some build environments
//   const [searchType, setSearchType] = useState("opd" as "opd" | "ipd");
//   const [searchNumber, setSearchNumber] = useState("");
//   const [patientProcedures, setPatientProcedures] = useState<any[]>([]);
//   const [selectedProcedure, setSelectedProcedure] = useState("");
//   const [selectedTherapist, setSelectedTherapist] = useState("");
//   const [scheduledDate, setScheduledDate] = useState("");
//   const [scheduledTime, setScheduledTime] = useState("");
//   const [notes, setNotes] = useState("");

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const [assignmentsPerPage] = useState(20); // Show 20 assignments per page

//   useEffect(() => {
//     // Get master therapist info from localStorage
//     const userName = localStorage.getItem("userName");
//     setTherapistName(userName || "Master Therapist");
    
//     loadAllData();
//   }, []);

//   const loadAllData = async () => {
//     setLoading(true);
//     try {
//       const today = new Date().toISOString().split('T')[0];
      
//       // Get all today's assignments
//       const { data: assignments } = await supabase
//         .from("therapist_assignments")
//         .select(`
//           *,
//           patient_opd:opd_no(uhid(full_name)),
//           patient_ipd:ipd_no(uhid(full_name)),
//           procedure:procedure_entry_id(procedure_name),
//           therapist:therapist_id(full_name)
//         `)
//         .eq("scheduled_date", today)
//         .order("scheduled_time", { ascending: true });

//       // Get all therapists
//       const { data: therapistData } = await supabase
//         .from("staff")
//         .select("id, full_name")
//         .eq("role", "therapist");

//       // Get all procedures
//       const { data: procedureData } = await supabase
//         .from("procedure_entries")
//         .select("id, procedure_name, opd_no, ipd_no");

//       setAllAssignments(assignments || []);
//       setTherapists(therapistData || []);
//       setProcedures(procedureData || []);

//       // Calculate stats
//       const totalToday = assignments?.length || 0;
//       const completed = assignments?.filter(a => a.status === 'completed').length || 0;
//       const pending = totalToday - completed;

//       // Get total unique patients
//       const uniquePatients = new Set();
//       assignments?.forEach(a => {
//         if (a.patient_opd?.full_name) uniquePatients.add(a.patient_opd.full_name);
//         if (a.patient_ipd?.full_name) uniquePatients.add(a.patient_ipd.full_name);
//       });

//       setStats({
//         totalToday,
//         completed,
//         pending,
//         totalPatients: uniquePatients.size,
//         totalTherapists: therapistData?.length || 0
//       });
//     } catch (error) {
//       console.error("Error loading data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const searchPatientProcedures = async () => {
//     if (!searchNumber.trim()) return;

//     try {
//       let query = supabase
//         .from("procedure_entries")
//         .select("id, procedure_name, opd_no, ipd_no, start_date, end_date");

//       if (searchType === "opd") {
//         query = query.eq("opd_no", searchNumber);
//       } else {
//         query = query.eq("ipd_no", searchNumber);
//       }

//       const { data } = await query;
//       setPatientProcedures(data || []);
//     } catch (error) {
//       console.error("Error searching procedures:", error);
//     }
//   };

//   const assignTherapist = async () => {
//     if (!selectedProcedure || !selectedTherapist || !scheduledDate) {
//       alert("Please fill in all required fields");
//       return;
//     }

//     try {
//       const procedure = procedures.find(p => p.id.toString() === selectedProcedure);
//       if (!procedure) return;

//       const { error } = await supabase
//         .from("therapist_assignments")
//         .insert({
//           opd_no: procedure.opd_no,
//           ipd_no: procedure.ipd_no,
//           procedure_entry_id: selectedProcedure,
//           therapist_id: selectedTherapist,
//           doctor_id: localStorage.getItem("userId"), // Master therapist as doctor
//           scheduled_date: scheduledDate,
//           scheduled_time: scheduledTime,
//           notes: notes,
//           status: "pending"
//         });

//       if (!error) {
//         // Reset form
//         setSelectedProcedure("");
//         setSelectedTherapist("");
//         setScheduledDate("");
//         setScheduledTime("");
//         setNotes("");
//         setPatientProcedures([]);
        
//         // Refresh data
//         loadAllData();
//         alert("Therapist assigned successfully!");
//       } else {
//         alert("Error assigning therapist: " + error.message);
//       }
//     } catch (error) {
//       console.error("Error assigning therapist:", error);
//       alert("Error assigning therapist");
//     }
//   };

//   const markCompleted = async (assignmentId: number) => {
//     try {
//       const { error } = await supabase
//         .from("therapist_assignments")
//         .update({ status: "completed" })
//         .eq("id", assignmentId);
      
//       if (!error) {
//         loadAllData();
//       }
//     } catch (error) {
//       console.error("Error marking completed:", error);
//     }
//   };

//   const getPatientName = (assignment: any) => {
//     return assignment.patient_opd?.full_name || assignment.patient_ipd?.full_name || "Unknown Patient";
//   };

//   // Pagination logic
//   const indexOfLastAssignment = currentPage * assignmentsPerPage;
//   const indexOfFirstAssignment = indexOfLastAssignment - assignmentsPerPage;
//   const currentAssignments = allAssignments.slice(indexOfFirstAssignment, indexOfLastAssignment);
//   const totalPages = Math.ceil(allAssignments.length / assignmentsPerPage);

//   const handlePageChange = (pageNumber: number) => {
//     setCurrentPage(pageNumber);
//   };

//   const getVisitType = (assignment: any) => {
//     return assignment.opd_no ? "OPD" : "IPD";
//   };

//   // Safer handler to avoid TSX generic parsing quirks in some build envs
//   const onSearchType = (v: string) => setSearchType(v === 'ipd' ? 'ipd' : 'opd');

//   return (
//     <div className="space-y-6">
//       {/* Welcome Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Master Therapist Dashboard</h1>
//           <p className="text-gray-600">Welcome back, {therapistName}!</p>
//         </div>
//         <div className="mt-4 md:mt-0">
//           <Button onClick={loadAllData}>
//             Refresh
//           </Button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Today's Assignments</CardTitle>
//             <Calendar className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalToday}</div>
//             <p className="text-xs text-muted-foreground">Total procedures</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Completed</CardTitle>
//             <CheckCircle className="h-4 w-4 text-green-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
//             <p className="text-xs text-muted-foreground">Procedures done</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pending</CardTitle>
//             <AlertCircle className="h-4 w-4 text-orange-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
//             <p className="text-xs text-muted-foreground">Procedures remaining</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Patients Today</CardTitle>
//             <User className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalPatients}</div>
//             <p className="text-xs text-muted-foreground">Unique patients</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
//             <Activity className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{stats.totalTherapists}</div>
//             <p className="text-xs text-muted-foreground">Available therapists</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Assign Therapist Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Plus className="h-5 w-5" />
//             Assign Therapist to Patient
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Search Patient */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label>Search Type</Label>
//               <Select value={searchType} onValueChange={onSearchType}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="opd">OPD Number</SelectItem>
//                   <SelectItem value="ipd">IPD Number</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>{searchType.toUpperCase()} Number</Label>
//               <Input
//                 value={searchNumber}
//                 onChange={(e) => setSearchNumber(e.target.value)}
//                 placeholder={`Enter ${searchType.toUpperCase()} number`}
//               />
//             </div>
//             <div className="flex items-end">
//               <Button onClick={searchPatientProcedures} className="w-full">
//                 <Search className="h-4 w-4 mr-2" />
//                 Search Procedures
//               </Button>
//             </div>
//           </div>

//           {/* Patient Procedures */}
//           {patientProcedures.length > 0 && (
//             <div className="space-y-4">
//               <h3 className="font-medium">Patient Procedures</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {patientProcedures.map((procedure) => (
//                   <div key={procedure.id} className="border rounded-lg p-3">
//                     <div className="font-medium">{procedure.procedure_name}</div>
//                     <div className="text-sm text-gray-600">
//                       ID: {procedure.id} | {procedure.opd_no ? `OPD: ${procedure.opd_no}` : `IPD: ${procedure.ipd_no}`}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Assignment Form */}
//           {patientProcedures.length > 0 && (
//             <div className="border-t pt-4 space-y-4">
//               <h3 className="font-medium">Assign Therapist</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                 <div>
//                   <Label>Select Procedure</Label>
//                   <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose procedure" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {patientProcedures.map((procedure) => (
//                         <SelectItem key={procedure.id} value={procedure.id.toString()}>
//                           {procedure.procedure_name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Select Therapist</Label>
//                   <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Choose therapist" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {therapists.map((therapist) => (
//                         <SelectItem key={therapist.id} value={therapist.id}>
//                           {therapist.full_name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>Scheduled Date</Label>
//                   <Input
//                     type="date"
//                     value={scheduledDate}
//                     onChange={(e) => setScheduledDate(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <Label>Scheduled Time</Label>
//                   <Input
//                     value={scheduledTime}
//                     onChange={(e) => setScheduledTime(e.target.value)}
//                     placeholder="e.g., 6:00-6:15 AM"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>Notes</Label>
//                 <Input
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder="Additional notes..."
//                 />
//               </div>
//               <Button onClick={assignTherapist} className="w-full md:w-auto">
//                 Assign Therapist
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* All Today's Assignments */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Clock className="h-5 w-5" />
//             All Today's Assignments
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="text-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
//               <p>Loading assignments...</p>
//             </div>
//           ) : allAssignments.length === 0 ? (
//             <div className="text-center py-8">
//               <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments today</h3>
//               <p className="text-gray-600">No procedures are scheduled for today.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {currentAssignments.map((assignment) => (
//                 <div key={assignment.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-2">
//                       <h3 className="font-medium">{getPatientName(assignment)}</h3>
//                       <Badge variant="outline">{getVisitType(assignment)}</Badge>
//                       <Badge variant={assignment.status === 'completed' ? 'default' : 'secondary'}>
//                         {assignment.status}
//                       </Badge>
//                     </div>
//                     <div className="text-sm text-gray-600 space-y-1">
//                       <div><strong>Procedure:</strong> {assignment.procedure?.procedure_name || `#${assignment.procedure_entry_id}`}</div>
//                       <div><strong>Therapist:</strong> {assignment.therapist?.full_name || "Unassigned"}</div>
//                       <div><strong>Time:</strong> {assignment.scheduled_time || "Not specified"}</div>
//                       {assignment.notes && (
//                         <div><strong>Notes:</strong> {assignment.notes}</div>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     {assignment.status === 'pending' && (
//                       <Button 
//                         size="sm" 
//                         onClick={() => markCompleted(assignment.id)}
//                       >
//                         Mark Completed
//                       </Button>
//                     )}
//                     <Button variant="outline" size="sm">
//                       View Details
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
            
//             {/* Pagination Controls */}
//             {allAssignments.length > assignmentsPerPage && (
//               <div className="flex items-center justify-between mt-6 pt-4 border-t">
//                 <div className="text-sm text-gray-700">
//                   Showing {indexOfFirstAssignment + 1} to {Math.min(indexOfLastAssignment, allAssignments.length)} of {allAssignments.length} assignments
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handlePageChange(currentPage - 1)}
//                     disabled={currentPage === 1}
//                     className="px-3 py-1"
//                   >
//                     Previous
//                   </Button>
                  
//                   {/* Page Numbers */}
//                   <div className="flex items-center gap-1">
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                       let pageNumber;
//                       if (totalPages <= 5) {
//                         pageNumber = i + 1;
//                       } else if (currentPage <= 3) {
//                         pageNumber = i + 1;
//                       } else if (currentPage >= totalPages - 2) {
//                         pageNumber = totalPages - 4 + i;
//                       } else {
//                         pageNumber = currentPage - 2 + i;
//                       }
                      
//                       return (
//                         <Button
//                           key={pageNumber}
//                           variant={currentPage === pageNumber ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handlePageChange(pageNumber)}
//                           className="px-3 py-1 min-w-[40px]"
//                         >
//                           {pageNumber}
//                         </Button>
//                       );
//                     })}
//                   </div>
                  
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handlePageChange(currentPage + 1)}
//                     disabled={currentPage === totalPages}
//                     className="px-3 py-1"
//                   >
//                     Next
//                   </Button>
//                 </div>
//               </div>
//             )}
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// } 

"use client";
import React from "react";

export default function TherapistDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Therapist Dashboard</h1>
      <p>Module coming soon.</p>
    </div>
  );
}