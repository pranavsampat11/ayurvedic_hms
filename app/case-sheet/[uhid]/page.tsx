"use client"

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Menu,
  LogOut,
  Users,
  Settings,
  UserPlus,
  Package,
  BarChart,
  Search,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CaseSheetForm from "@/components/case-sheet-form";
import { toast } from "@/hooks/use-toast";
import { type UserRole, type CaseSheet, type Patient } from "@/lib/data";
import { supabase } from "@/lib/supabaseClient";

// Add local CaseSheet type override for Supabase fields
interface SupabaseCaseSheet extends CaseSheet {
  created_at?: string;
  doctor?: string;
}

export default function CaseSheetPage({ params }: { params: any }) {
  const { uhid } = React.use(params as { uhid: string });
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>("doctor");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientName, setPatientName] = useState("Loading...");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCaseSheet, setCurrentCaseSheet] = useState<SupabaseCaseSheet | null>(null);
  const [caseSheets, setCaseSheets] = useState<SupabaseCaseSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatientAndCaseSheets() {
      setLoading(true);
      // Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("uhid", uhid)
        .single();
      if (patientError || !patientData) {
        setPatientName("Patient Not Found");
        toast({
          title: "Patient Not Found",
          description: `No patient found with UHID: ${uhid}.`,
          variant: "destructive",
        });
        router.push("/dashboard");
        setLoading(false);
        return;
      }
      setPatient(patientData);
      setPatientName(`${patientData.firstName} ${patientData.lastName}`);
      // Fetch case sheets
      const { data: caseSheetData, error: caseSheetError } = await supabase
        .from("opd_case_sheets")
        .select("*")
        .eq("uhid", uhid)
        .order("created_at", { ascending: false });
      setCaseSheets(caseSheetData || []);
      setLoading(false);
    }
    if (uhid) fetchPatientAndCaseSheets();
  }, [uhid, isAddModalOpen, isEditModalOpen]);

  const filteredCaseSheets = useMemo(() => {
    if (!searchTerm) return caseSheets;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return caseSheets.filter((sheet: SupabaseCaseSheet) =>
      (sheet.doctor || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      (sheet.diagnosis || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      (sheet.treatmentPlan || '').toLowerCase().includes(lowerCaseSearchTerm) ||
      (Array.isArray(sheet.medicationsAdvised) ? sheet.medicationsAdvised.map((m: any) => m.name).join(', ').toLowerCase() : '').includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, caseSheets]);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Stethoscope },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Staff', href: '/staff', icon: UserPlus },
    { name: 'Beds', href: '/beds', icon: Package },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleDeleteCaseSheet = async (id: string | undefined) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this case sheet?')) {
      const { error } = await supabase.from("opd_case_sheets").delete().eq("id", id);
      if (error) {
        toast({
          title: 'Failed to Delete Case Sheet',
          description: 'There was an error deleting the case sheet. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Case Sheet Deleted',
          description: 'The case sheet has been successfully deleted.',
        });
        // Refresh case sheets
        setCaseSheets((prev) => prev.filter((sheet) => sheet.id !== id));
      }
    }
  };

  const handleCaseSheetSaved = () => {
    toast({
      title: "Case Sheet Saved",
      description: `Case sheet for ${patient?.firstName} ${patient?.lastName} (${patient?.uhid || uhid}) has been saved.`,
    });
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{patientName}</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for larger screens */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Stethoscope className="h-6 w-6" />
              <span className="">Ayurvedic HMS</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          {/* User profile and logout in sidebar */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                <AvatarFallback>{currentRole.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="font-semibold capitalize">{currentRole}</div>
                <div className="text-xs text-muted-foreground">user@example.com</div>
              </div>
            </div>
            <Separator className="my-3" />
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 print:hidden">
          {/* Mobile navigation sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                  <Stethoscope className="h-6 w-6" />
                  <span className="sr-only">Ayurvedic HMS</span>
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
              </nav>
              {/* User profile and logout in mobile sheet */}
              <div className="mt-auto pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>{currentRole.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <div className="font-semibold capitalize">{currentRole}</div>
                    <div className="text-xs text-muted-foreground">user@example.com</div>
                  </div>
                </div>
                <Separator className="my-3" />
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold md:text-2xl capitalize">Case Sheets for {patient?.firstName} {patient?.lastName} (UHID: {patient?.uhid})</h1>
          {/* Remove Switch Role dropdown, just show current role */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground capitalize">{currentRole}</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Case Sheets Overview</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Case Sheet
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search case sheets by doctor, diagnosis, or treatment..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Treatment Plan</TableHead>
                      <TableHead>Medications</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCaseSheets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No case sheets found for this patient.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCaseSheets.map((sheet) => (
                        <TableRow key={sheet.id}>
                          <TableCell>{sheet.created_at ? new Date(sheet.created_at).toLocaleString() : 'N/A'}</TableCell>
                          <TableCell>{sheet.doctor || 'N/A'}</TableCell>
                          <TableCell>{sheet.diagnosis}</TableCell>
                          <TableCell>{sheet.treatmentPlan}</TableCell>
                          <TableCell>{Array.isArray(sheet.medicationsAdvised) ? sheet.medicationsAdvised.map(m => m.name).join(', ') : 'N/A'}</TableCell>
                          <TableCell>{sheet.followUpNotes || sheet.lifestyleAdvice || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCurrentCaseSheet(sheet)
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCaseSheet(sheet.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Case Sheet Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Case Sheet</DialogTitle>
            <DialogDescription>Create a new case sheet for {patient?.firstName} {patient?.lastName}.</DialogDescription>
          </DialogHeader>
          <CaseSheetForm patientUhId={uhid} onSave={handleCaseSheetSaved} />
        </DialogContent>
      </Dialog>

      {/* Edit Case Sheet Modal */}
      {currentCaseSheet && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Case Sheet</DialogTitle>
              <DialogDescription>Modify the case sheet details for {patient?.firstName} {patient?.lastName}.</DialogDescription>
            </DialogHeader>
            <CaseSheetForm initialCaseSheet={currentCaseSheet} onSave={handleCaseSheetSaved} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
