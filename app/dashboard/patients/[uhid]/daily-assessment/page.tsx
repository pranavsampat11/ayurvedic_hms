"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle, X, Printer } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface DailyAssessment {
  id?: number;
  ipd_no: string;
  date: string;
  time: string;
  doctor_id: string;
  doctor_name: string;
  assessment: string;
  advice: string;
  created_at?: string;
  procedures?: Procedure[];
  medications?: InternalMedication[];
}

interface Procedure {
  id?: number;
  procedure: any;
  medicines: any[];
  requirements: any[];
  medicinesString: string;
  requirementsString: string;
  quantity: string;
  therapist: string;
  start_date: string;
  end_date: string;
}

interface InternalMedication {
  id?: number;
  medication: any;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export default function DailyAssessmentPage({ params }: { params: Promise<{ uhid: string }> }) {
  const [assessments, setAssessments] = useState<DailyAssessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<DailyAssessment | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [internalMedications, setInternalMedications] = useState<InternalMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [defaultDoctorName, setDefaultDoctorName] = useState<string>("Loading Doctor...");
  const [defaultDoctorId, setDefaultDoctorId] = useState<string>("");
  const [patientData, setPatientData] = useState<any>(null);
  
  // Procedure states
  const [showProcedureAdd, setShowProcedureAdd] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState("");
  const [procedureResults, setProcedureResults] = useState<any[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [selectedMedicines, setSelectedMedicines] = useState<any[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<any[]>([]);
  const [medicinesString, setMedicinesString] = useState("");
  const [requirementsString, setRequirementsString] = useState("");
  const [procedureQuantity, setProcedureQuantity] = useState("");
  const [procedureStartDate, setProcedureStartDate] = useState("");
  const [procedureEndDate, setProcedureEndDate] = useState("");
  const [procedureTherapist, setProcedureTherapist] = useState("");
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medicationResults, setMedicationResults] = useState<any[]>([]);
  const [requirementSearch, setRequirementSearch] = useState("");
  const [requirementResults, setRequirementResults] = useState<any[]>([]);

  // Internal medication states
  const [showInternalMedAdd, setShowInternalMedAdd] = useState(false);
  const [internalMedSearch, setInternalMedSearch] = useState("");
  const [internalMedResults, setInternalMedResults] = useState<any[]>([]);
  const [selectedInternalMed, setSelectedInternalMed] = useState<any>(null);
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("");
  const [medicationStartDate, setMedicationStartDate] = useState("");
  const [medicationEndDate, setMedicationEndDate] = useState("");
  const [medicationNotes, setMedicationNotes] = useState("");

  // Edit states
  const [editingProcedureIndex, setEditingProcedureIndex] = useState<number | null>(null);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);

  const { toast } = useToast();

  // Get IPD number from UHID - unwrap params Promise
  const resolvedParams = use(params);
  const ipdNo = resolvedParams.uhid;

  const loadPatientData = async () => {
    try {
      const { data: ipdAdmission, error } = await supabase
        .from("ipd_admissions")
        .select("*, patients(*)")
        .eq("ipd_no", ipdNo)
        .single();

      if (error) {
        console.error("Error loading patient data:", error);
        return;
      }

      setPatientData(ipdAdmission);
    } catch (error) {
      console.error("Error loading patient data:", error);
    }
  };

  useEffect(() => {
    loadDailyAssessments();
    loadPatientData();
    
         // Fetch doctor name from IPD admission (same logic as IPD case sheet)
     const fetchDoctorFromIpdAdmission = async () => {
       try {
         const { data: ipdAdmission, error } = await supabase
           .from("ipd_admissions")
           .select("*, doctor:doctor_id(full_name)")
           .eq("ipd_no", ipdNo)
           .single();

                   if (ipdAdmission && ipdAdmission.doctor?.full_name && ipdAdmission.doctor_id) {
            setDefaultDoctorName(ipdAdmission.doctor.full_name);
            setDefaultDoctorId(ipdAdmission.doctor_id);
          } else {
            // Fallback: get any staff member if no doctor found
            const { data: fallbackData } = await supabase
              .from('staff')
              .select('id, full_name')
              .limit(1)
              .single();
            
            if (fallbackData) {
              setDefaultDoctorName(fallbackData.full_name);
              setDefaultDoctorId(fallbackData.id);
            } else {
              // If no staff found, we need to handle this case
              console.error("No staff members found in database");
              toast({
                title: "Error",
                description: "No staff members found. Please add staff members first.",
                variant: "destructive",
              });
              setDefaultDoctorName("No Doctor Available");
              setDefaultDoctorId("");
            }
          }
       } catch (error) {
         console.error("Error fetching doctor from IPD admission:", error);
         setDefaultDoctorName("Dr. Default");
         setDefaultDoctorId("");
       }
     };

    fetchDoctorFromIpdAdmission();
  }, [ipdNo]);

  // Search effects for procedures, medications, and requirements
  useEffect(() => {
    if (procedureSearch.length < 2) { setProcedureResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("procedures").select("*").ilike("procedure_name", `%${procedureSearch}%`);
      setProcedureResults(data || []);
    };
    fetch();
  }, [procedureSearch]);

  useEffect(() => {
    if (medicationSearch.length < 2) { setMedicationResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${medicationSearch}%`);
      setMedicationResults(data || []);
    };
    fetch();
  }, [medicationSearch]);

  useEffect(() => {
    if (requirementSearch.length < 2) { setRequirementResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${requirementSearch}%`);
      setRequirementResults(data || []);
    };
    fetch();
  }, [requirementSearch]);

  useEffect(() => {
    if (internalMedSearch.length < 2) { setInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${internalMedSearch}%`);
      setInternalMedResults(data || []);
    };
    fetch();
  }, [internalMedSearch]);

  const loadDailyAssessments = async () => {
    try {
      setLoading(true);
      
      // Load daily assessments
      let { data: assessmentsData, error: assessmentsError } = await supabase
        .from('ipd_daily_assessments')
        .select(`
          *,
          staff(full_name)
        `)
        .eq('ipd_no', ipdNo)
        .order('date', { ascending: false });

      if (assessmentsError) {
        console.error('Error loading assessments:', assessmentsError);
        toast({
          title: "Error",
          description: "Failed to load daily assessments",
          variant: "destructive",
        });
        return;
      }

      // Removed auto-seeding; rely on real data only

      const formattedAssessments = await Promise.all((assessmentsData || []).map(async assessment => {
         // Use the assessment date to match procedures and medications
         const assessmentDate = assessment.date;
         
         // Load procedures created on the same date as this assessment
         const { data: proceduresData, error: proceduresError } = await supabase
           .from('procedure_entries')
           .select('*')
           .eq('ipd_no', ipdNo)
           .gte('created_at', `${assessmentDate}T00:00:00.000Z`)
           .lt('created_at', `${assessmentDate}T23:59:59.999Z`);

         if (proceduresError) {
           console.error('Error loading procedures for assessment:', proceduresError);
         }

         // Load medications created on the same date as this assessment
         const { data: medicationsData, error: medicationsError } = await supabase
           .from('internal_medications')
           .select('*')
           .eq('ipd_no', ipdNo)
           .gte('created_at', `${assessmentDate}T00:00:00.000Z`)
           .lt('created_at', `${assessmentDate}T23:59:59.999Z`);

         if (medicationsError) {
           console.error('Error loading medications for assessment:', medicationsError);
         }

         // Format procedures
         const formattedProcedures = proceduresData?.map(proc => ({
           id: proc.id,
           procedure: { procedure_name: proc.procedure_name },
           medicines: [],
           requirements: [],
           medicinesString: "",
           requirementsString: proc.requirements || "",
           quantity: proc.quantity || "",
           start_date: proc.start_date || "",
           end_date: proc.end_date || "",
           therapist: proc.therapist || ""
         })) || [];

         // Format medications
         const formattedMedications = medicationsData?.map(med => ({
           id: med.id,
           medication: { product_name: med.medication_name },
           dosage: med.dosage || "",
           frequency: med.frequency || "",
           start_date: med.start_date || "",
           end_date: med.end_date || "",
           notes: med.notes || ""
         })) || [];

         return {
           id: assessment.id,
           ipd_no: assessment.ipd_no,
           date: assessment.date,
           time: assessment.time || '',
           doctor_id: assessment.doctor_id,
           doctor_name: assessment.staff?.full_name || '',
           assessment: assessment.assessment,
           advice: assessment.advice,
           created_at: assessment.created_at,
           procedures: formattedProcedures,
           medications: formattedMedications
         };
       }) || []);

      setAssessments(formattedAssessments);
    } catch (error) {
      console.error('Error loading daily assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load daily assessments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

       const handleAddAssessment = () => {
    if (!defaultDoctorId) {
      toast({
        title: "Error",
        description: "No doctor available. Please ensure staff members are added to the system.",
        variant: "destructive",
      });
      return;
    }

    setCurrentAssessment({
      ipd_no: ipdNo,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      doctor_id: defaultDoctorId, // Pre-fill with default doctor ID
      doctor_name: defaultDoctorName, // Pre-fill with default doctor name
      assessment: '',
      advice: ''
    });
    setProcedures([]);
    setInternalMedications([]);
    setShowForm(true);
  };

  const handleEditAssessment = async (assessment: DailyAssessment) => {
    setCurrentAssessment(assessment);
    
    // Load related procedures and medications created on the same date as this assessment
    try {
      const { data: proceduresData } = await supabase
        .from('procedure_entries')
        .select('*')
        .eq('ipd_no', ipdNo)
        .gte('created_at', `${assessment.date}T00:00:00.000Z`)
        .lt('created_at', `${assessment.date}T23:59:59.999Z`);

      const { data: medicationsData } = await supabase
        .from('internal_medications')
        .select('*')
        .eq('ipd_no', ipdNo)
        .gte('created_at', `${assessment.date}T00:00:00.000Z`)
        .lt('created_at', `${assessment.date}T23:59:59.999Z`);

      // Format procedures to match the form structure
      const formattedProcedures = proceduresData?.map(proc => ({
        id: proc.id,
        procedure: { procedure_name: proc.procedure_name },
        medicines: [],
        requirements: [],
        medicinesString: "",
        requirementsString: proc.requirements || "",
        quantity: proc.quantity || "",
        start_date: proc.start_date || "",
        end_date: proc.end_date || "",
        therapist: proc.therapist || ""
      })) || [];

      // Format medications to match the form structure
      const formattedMedications = medicationsData?.map(med => ({
        id: med.id,
        medication: { product_name: med.medication_name },
        dosage: med.dosage || "",
        frequency: med.frequency || "",
        start_date: med.start_date || "",
        end_date: med.end_date || "",
        notes: med.notes || ""
      })) || [];

      setProcedures(formattedProcedures);
      setInternalMedications(formattedMedications);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
    
    setShowForm(true);
  };

  const handleAddProcedure = () => {
    if (!selectedProcedure || !procedureQuantity || !procedureStartDate || !procedureEndDate) {
      toast({ title: "Missing Information", description: "Please fill all procedure details", variant: "destructive" });
      return;
    }

    const newProcedure = {
      id: editingProcedureIndex !== null ? procedures[editingProcedureIndex].id : undefined,
      procedure: selectedProcedure,
      medicines: selectedMedicines,
      requirements: selectedRequirements,
      medicinesString: medicinesString,
      requirementsString: requirementsString,
      quantity: procedureQuantity,
      start_date: procedureStartDate,
      end_date: procedureEndDate,
      therapist: procedureTherapist
    };

    if (editingProcedureIndex !== null) {
      // Update existing procedure
      setProcedures(prev => prev.map((proc, idx) => 
        idx === editingProcedureIndex ? newProcedure : proc
      ));
      setEditingProcedureIndex(null);
    } else {
      // Add new procedure
      setProcedures(prev => [...prev, newProcedure]);
    }
    
    // Reset form
    setSelectedProcedure(null);
    setSelectedMedicines([]);
    setSelectedRequirements([]);
    setMedicinesString("");
    setRequirementsString("");
    setProcedureQuantity("");
    setProcedureStartDate("");
    setProcedureEndDate("");
    setProcedureTherapist("");
    setShowProcedureAdd(false);
  };

  const handleRemoveProcedure = async (idx: number) => {
    const procedure = procedures[idx];
    
    // If the procedure has an ID, it exists in the database and needs to be deleted
    if (procedure.id) {
      try {
        // First, delete related procedure_medicine_requirement_requests
        const { error: requestError } = await supabase
          .from('procedure_medicine_requirement_requests')
          .delete()
          .eq('procedure_entry_id', procedure.id);
        
        if (requestError) {
          console.error('Error deleting procedure requests:', requestError);
          toast({
            title: "Error",
            description: "Failed to delete procedure requests",
            variant: "destructive",
          });
          return;
        }
        
        // Then delete the procedure
        const { error } = await supabase
          .from('procedure_entries')
          .delete()
          .eq('id', procedure.id);
        
        if (error) {
          console.error('Error deleting procedure:', error);
          toast({
            title: "Error",
            description: "Failed to delete procedure",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Success",
          description: "Procedure deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting procedure:', error);
        toast({
          title: "Error",
          description: "Failed to delete procedure",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Remove from local state
    setProcedures(prev => prev.filter((_, i) => i !== idx));
  };

  const handleProcedureChange = (idx: number, field: keyof Procedure, value: string) => {
    setProcedures(prev => prev.map((proc, i) => 
      i === idx ? { ...proc, [field]: value } : proc
    ));
  };

  const handleAddInternalMed = () => {
    if (!selectedInternalMed || !medicationDosage || !medicationFrequency || !medicationStartDate || !medicationEndDate) {
      toast({ title: "Missing Information", description: "Please fill all medication details", variant: "destructive" });
      return;
    }

    const newMedication = {
      id: editingMedicationIndex !== null ? internalMedications[editingMedicationIndex].id : undefined,
      medication: selectedInternalMed,
      dosage: medicationDosage,
      frequency: medicationFrequency,
      start_date: medicationStartDate,
      end_date: medicationEndDate,
      notes: medicationNotes
    };

    if (editingMedicationIndex !== null) {
      // Update existing medication
      setInternalMedications(prev => prev.map((med, idx) => 
        idx === editingMedicationIndex ? newMedication : med
      ));
      setEditingMedicationIndex(null);
    } else {
      // Add new medication
      setInternalMedications(prev => [...prev, newMedication]);
    }
    
    // Reset form
    setSelectedInternalMed(null);
    setMedicationDosage("");
    setMedicationFrequency("");
    setMedicationStartDate("");
    setMedicationEndDate("");
    setMedicationNotes("");
    setShowInternalMedAdd(false);
  };

  const handleRemoveMedication = async (idx: number) => {
    const medication = internalMedications[idx];
    
    // If the medication has an ID, it exists in the database and needs to be deleted
    if (medication.id) {
      try {
        // First, delete related medication_dispense_requests
        const { error: requestError } = await supabase
          .from('medication_dispense_requests')
          .delete()
          .eq('medication_id', medication.id);
        
        if (requestError) {
          console.error('Error deleting medication requests:', requestError);
          toast({
            title: "Error",
            description: "Failed to delete medication requests",
            variant: "destructive",
          });
          return;
        }
        
        // Then delete the medication
        const { error } = await supabase
          .from('internal_medications')
          .delete()
          .eq('id', medication.id);
        
        if (error) {
          console.error('Error deleting medication:', error);
          toast({
            title: "Error",
            description: "Failed to delete medication",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Success",
          description: "Medication deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting medication:', error);
        toast({
          title: "Error",
          description: "Failed to delete medication",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Remove from local state
    setInternalMedications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMedicationChange = (idx: number, field: keyof InternalMedication, value: string) => {
    setInternalMedications(prev => prev.map((med, i) => 
      i === idx ? { ...med, [field]: value } : med
    ));
  };

  const handleEditProcedure = (idx: number) => {
    const procedure = procedures[idx];
    setSelectedProcedure(procedure.procedure);
    setSelectedMedicines(procedure.medicines || []);
    setSelectedRequirements(procedure.requirements || []);
    setMedicinesString(procedure.medicinesString || "");
    setRequirementsString(procedure.requirementsString || "");
    setProcedureQuantity(procedure.quantity || "");
    setProcedureStartDate(procedure.start_date || "");
    setProcedureEndDate(procedure.end_date || "");
    setProcedureTherapist(procedure.therapist || "");
    setEditingProcedureIndex(idx);
    setShowProcedureAdd(true);
  };

  const handleEditMedication = (idx: number) => {
    const medication = internalMedications[idx];
    setSelectedInternalMed(medication.medication);
    setMedicationDosage(medication.dosage || "");
    setMedicationFrequency(medication.frequency || "");
    setMedicationStartDate(medication.start_date || "");
    setMedicationEndDate(medication.end_date || "");
    setMedicationNotes(medication.notes || "");
    setEditingMedicationIndex(idx);
    setShowInternalMedAdd(true);
  };

  // Helper functions for adding/removing medicines and requirements
  const addMedicine = (medicine: any) => {
    if (!selectedMedicines.find(m => m.id === medicine.id)) {
      setSelectedMedicines(prev => [...prev, medicine]);
      setMedicinesString(prev => prev ? `${prev}, ${medicine.product_name}` : medicine.product_name);
    }
  };

  const removeMedicine = (medicineId: number) => {
    setSelectedMedicines(prev => {
      const filtered = prev.filter(m => m.id !== medicineId);
      setMedicinesString(filtered.map(m => m.product_name).join(", "));
      return filtered;
    });
  };

  const addRequirement = (requirement: any) => {
    if (!selectedRequirements.find(r => r.id === requirement.id)) {
      setSelectedRequirements(prev => [...prev, requirement]);
      setRequirementsString(prev => prev ? `${prev}, ${requirement.product_name}` : requirement.product_name);
    }
  };

  const removeRequirement = (requirementId: number) => {
    setSelectedRequirements(prev => {
      const filtered = prev.filter(r => r.id !== requirementId);
      setRequirementsString(filtered.map(r => r.product_name).join(", "));
      return filtered;
    });
  };

  const handleRequestRequirements = async (idx: number) => {
    const procedure = procedures[idx];
    if (!currentAssessment?.doctor_id) {
      toast({
        title: "Error",
        description: "Please select a doctor first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Only create procedure medicine requirement request (no main table insertion)
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          ipd_no: ipdNo,
          procedure_entry_id: null, // Will be set when assessment is saved
          requirements: procedure.requirementsString,
          quantity: procedure.quantity,
          requested_by: currentAssessment.doctor_id,
          status: "pending",
        });

      if (requestError) {
        console.error("Request insert error:", requestError);
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Requirements request submitted successfully",
      });

    } catch (error) {
      console.error("Error requesting requirements:", error);
      toast({
        title: "Error",
        description: "Failed to submit requirements request",
        variant: "destructive",
      });
    }
  };

  const handleRequestMedication = async (medication: InternalMedication) => {
    if (!currentAssessment?.doctor_id) {
      toast({
        title: "Error",
        description: "Please select a doctor first",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, check if this medication already exists for this IPD
      const { data: existingMedication, error: checkError } = await supabase
        .from("internal_medications")
        .select("id")
        .eq("ipd_no", ipdNo)
        .eq("medication_name", medication.medication.product_name)
        .eq("dosage", medication.dosage || null)
        .eq("frequency", medication.frequency || null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Medication check error:", checkError);
        throw checkError;
      }

      let medicationId;

      if (existingMedication) {
        // Medication already exists, use existing ID
        medicationId = existingMedication.id;
      } else {
        // Create new medication entry
        const { data: medicationData, error: medicationError } = await supabase
          .from("internal_medications")
          .insert({
            ipd_no: ipdNo,
            medication_name: medication.medication.product_name,
            dosage: medication.dosage || null,
            frequency: medication.frequency || null,
            start_date: medication.start_date || new Date().toISOString().split('T')[0],
            end_date: medication.end_date || null,
            notes: medication.notes || null,
            prescribed_by: currentAssessment.doctor_id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (medicationError) {
          console.error("Medication insert error:", medicationError);
          throw medicationError;
        }
        medicationId = medicationData.id;
      }

      // Check if a request already exists for this medication
      const { data: existingRequest, error: requestCheckError } = await supabase
        .from("medication_dispense_requests")
        .select("id")
        .eq("ipd_no", ipdNo)
        .eq("medication_id", medicationId)
        .eq("status", "pending")
        .single();

      if (requestCheckError && requestCheckError.code !== 'PGRST116') {
        console.error("Request check error:", requestCheckError);
        throw requestCheckError;
      }

      if (existingRequest) {
        toast({
          title: "Info",
          description: "A request for this medication is already pending",
        });
        return;
      }

      // Create the medication dispense request with the medication ID
      const { error: requestError } = await supabase
        .from("medication_dispense_requests")
        .insert({
          ipd_no: ipdNo,
          medication_id: medicationId,
          request_date: new Date().toISOString(),
          status: "pending",
        });

      if (requestError) {
        console.error("Request insert error:", requestError);
        throw requestError;
      }

      toast({
        title: "Success",
        description: "Medication request submitted successfully",
      });

    } catch (error) {
      console.error("Error requesting medication:", error);
      toast({
        title: "Error",
        description: "Failed to submit medication request",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!currentAssessment) return;

    try {
      setSaving(true);

      // Save daily assessment
      let assessmentId = currentAssessment.id;
      if (assessmentId) {
        // Update existing assessment
        const { error: updateError } = await supabase
          .from('ipd_daily_assessments')
          .update({
            date: currentAssessment.date,
            time: currentAssessment.time,
            doctor_id: currentAssessment.doctor_id,
            assessment: currentAssessment.assessment,
            advice: currentAssessment.advice
          })
          .eq('id', assessmentId);

        if (updateError) throw updateError;
      } else {
        // Create new assessment
        const { data: insertData, error: insertError } = await supabase
          .from('ipd_daily_assessments')
          .insert({
            ipd_no: ipdNo,
            date: currentAssessment.date,
            time: currentAssessment.time,
            doctor_id: currentAssessment.doctor_id,
            assessment: currentAssessment.assessment,
            advice: currentAssessment.advice
          })
          .select()
          .single();

        if (insertError) throw insertError;
        assessmentId = insertData.id;
      }

                    // Handle procedures - update existing, insert new, delete removed
       if (assessmentId) {
         // For existing assessments, we need to handle updates properly
         
         // Get existing procedures for this assessment date
         const { data: existingProcedures } = await supabase
           .from('procedure_entries')
           .select('id, procedure_name')
           .eq('ipd_no', ipdNo)
           .eq('start_date', currentAssessment.date);

         // Get existing medications for this assessment date
         const { data: existingMedications } = await supabase
           .from('internal_medications')
           .select('id, medication_name')
           .eq('ipd_no', ipdNo)
           .eq('start_date', currentAssessment.date);

         // Handle procedures
         const validProcedures = procedures.filter(proc => proc.procedure && proc.procedure.procedure_name);
         
         for (const proc of validProcedures) {
           if (proc.id) {
             // Update existing procedure
             const { error: updateError } = await supabase
               .from('procedure_entries')
               .update({
                 procedure_name: proc.procedure.procedure_name,
                 requirements: proc.medicinesString && proc.requirementsString 
                   ? `${proc.medicinesString}, ${proc.requirementsString}`
                   : proc.medicinesString || proc.requirementsString || "",
                 quantity: proc.quantity || "",
                 start_date: proc.start_date || null,
                 end_date: proc.end_date || null,
                 therapist: proc.therapist || ""
               })
               .eq('id', proc.id);
             
             if (updateError) {
               console.error("Error updating procedure:", updateError);
             }
           } else {
             // Insert new procedure
             const { error: insertError } = await supabase
               .from('procedure_entries')
               .insert({
                 ipd_no: ipdNo,
                 procedure_name: proc.procedure.procedure_name,
                 requirements: proc.medicinesString && proc.requirementsString 
                   ? `${proc.medicinesString}, ${proc.requirementsString}`
                   : proc.medicinesString || proc.requirementsString || "",
                 quantity: proc.quantity || "",
                 start_date: proc.start_date || null,
                 end_date: proc.end_date || null,
                 therapist: proc.therapist || "",
                 created_at: new Date().toISOString()
               });
             
             if (insertError) {
               console.error("Error inserting procedure:", insertError);
             }
           }
         }

         // Handle medications
         const validMedications = internalMedications.filter(med => med.medication && med.medication.product_name);
         
         for (const med of validMedications) {
           if (med.id) {
             // Update existing medication
             const { error: updateError } = await supabase
               .from('internal_medications')
               .update({
                 medication_name: med.medication.product_name,
                 dosage: med.dosage || "",
                 frequency: med.frequency || "",
                 start_date: med.start_date || null,
                 end_date: med.end_date || null,
                 notes: med.notes || "",
                 prescribed_by: currentAssessment.doctor_id
               })
               .eq('id', med.id);
             
             if (updateError) {
               console.error("Error updating medication:", updateError);
             }
           } else {
             // Insert new medication
             const { error: insertError } = await supabase
               .from('internal_medications')
               .insert({
                 ipd_no: ipdNo,
                 medication_name: med.medication.product_name,
                 dosage: med.dosage || "",
                 frequency: med.frequency || "",
                 start_date: med.start_date || null,
                 end_date: med.end_date || null,
                 notes: med.notes || "",
                 prescribed_by: currentAssessment.doctor_id,
                 created_at: new Date().toISOString()
               });
             
             if (insertError) {
               console.error("Error inserting medication:", insertError);
             }
           }
         }
       } else {
         // For new assessments, just insert everything
         
         // Save procedures individually to get IDs and update request records
         if (procedures.length > 0) {
           const validProcedures = procedures.filter(proc => proc.procedure && proc.procedure.procedure_name);
           
           for (const proc of validProcedures) {
             const { data: procedureData, error: procedureError } = await supabase
               .from("procedure_entries")
               .insert({
                 ipd_no: ipdNo,
                 procedure_name: proc.procedure.procedure_name,
                 requirements: proc.requirementsString || "",
                 quantity: proc.quantity || "",
                 start_date: proc.start_date || null,
                 end_date: proc.end_date || null,
                 therapist: proc.therapist || "",
                 created_at: new Date().toISOString()
               })
               .select()
               .single();

             if (procedureError) {
               console.error("Error saving procedure:", procedureError);
               continue;
             }

             // Update the corresponding request record with the procedure ID
             if (procedureData.id) {
               const { error: updateRequestError } = await supabase
                 .from("procedure_medicine_requirement_requests")
                 .update({ procedure_entry_id: procedureData.id })
                 .eq("ipd_no", ipdNo)
                 .eq("procedure_entry_id", null)
                 .eq("requirements", proc.requirementsString)
                 .eq("quantity", proc.quantity);

               if (updateRequestError) {
                 console.error("Error updating procedure request:", updateRequestError);
               }
             }
           }
         }

         // Save internal medications individually to get IDs and update request records
         if (internalMedications.length > 0) {
           const validMedications = internalMedications.filter(med => med.medication && med.medication.product_name);
           
           for (const med of validMedications) {
             const { data: medicationData, error: medicationError } = await supabase
               .from("internal_medications")
               .insert({
                 ipd_no: ipdNo,
                 medication_name: med.medication.product_name,
                 dosage: med.dosage || "",
                 frequency: med.frequency || "",
                 start_date: med.start_date || null,
                 end_date: med.end_date || null,
                 notes: med.notes || "",
                 prescribed_by: currentAssessment.doctor_id,
                 created_at: new Date().toISOString()
               })
               .select()
               .single();

             if (medicationError) {
               console.error("Error saving medication:", medicationError);
               continue;
             }

             // Update the corresponding request record with the medication ID
             if (medicationData.id) {
               const { error: updateRequestError } = await supabase
                 .from("medication_dispense_requests")
                 .update({ medication_id: medicationData.id })
                 .eq("ipd_no", ipdNo)
                 .eq("medication_id", null)
                 .eq("request_date", new Date().toISOString().split('T')[0]); // Match by date

               if (updateRequestError) {
                 console.error("Error updating medication request:", updateRequestError);
               }
             }
           }
         }
       }

      toast({
        title: "Success",
        description: "Daily assessment saved successfully",
      });

      setShowForm(false);
      setCurrentAssessment(null);
      setProcedures([]);
      setInternalMedications([]);
      loadDailyAssessments();

    } catch (error) {
      console.error("Error saving daily assessment:", error);
      toast({
        title: "Error",
        description: "Failed to save daily assessment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>IP Continuation Sheet - Daily Assessment</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              background: #fff; 
              color: #000; 
              margin: 0;
              padding: 15px;
              font-size: 11pt;
              line-height: 1.3;
            }
            .container { 
              max-width: 100%; 
              margin: 0 auto; 
            }
            .header { 
              display: flex;
              align-items: flex-start;
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin-right: 20px;
              flex-shrink: 0;
            }
            .header-content {
              flex: 1;
              text-align: center;
            }
            .institution-name {
              font-size: 14pt;
              font-weight: bold;
              margin: 0 0 8px 0;
              color: #000;
            }
            .chart-title {
              font-size: 16pt;
              font-weight: bold;
              margin: 0 0 15px 0;
              color: #000;
            }
            .patient-details {
              display: flex;
              flex-direction: column;
              gap: 8px;
              margin-bottom: 20px;
              font-size: 11pt;
            }
            .patient-details-row {
              display: flex;
              justify-content: space-between;
            }
            .patient-details div {
              display: flex;
              align-items: baseline;
            }
            .patient-details b {
              font-weight: bold;
              margin-right: 5px;
            }
            .table-container {
              margin-top: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 10pt;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .date-cell {
              text-align: center;
              font-weight: bold;
              width: 15%;
            }
            .progress-cell {
              width: 85%;
            }
            .assessment-entry {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .assessment-entry:last-child {
              border-bottom: none;
            }
            .doctor-info {
              font-size: 9pt;
              color: #666;
              margin-top: 5px;
            }
            .procedures-section, .medications-section {
              margin-top: 8px;
              font-size: 9pt;
            }
            .procedures-section h4, .medications-section h4 {
              font-weight: bold;
              margin: 5px 0;
              color: #333;
            }
            .procedure-item, .medication-item {
              margin-left: 15px;
              margin-bottom: 5px;
            }
            @media print {
              body { margin: 0; padding: 8px; }
              .container { border: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/my-logo.png" alt="Hospital Logo" class="logo">
              <div class="header-content">
                <h1 class="institution-name">POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2 class="chart-title">IP Continuation Sheet - Daily Assessment</h2>
                <div class="patient-details">
                  <div class="patient-details-row">
                    <div><b>Name:</b> ${patientData?.patients?.full_name || 'N/A'}</div>
                    <div><b>Age:</b> ${patientData?.patients?.age || 'N/A'}</div>
                    <div><b>Sex:</b> ${patientData?.patients?.gender || 'N/A'}</div>
                  </div>
                  <div class="patient-details-row">
                    <div><b>Bed No:</b> ${patientData?.bed_number || 'N/A'}</div>
                    <div><b>UHID No:</b> ${patientData?.uhid || 'N/A'}</div>
                    <div><b>IP No:</b> ${ipdNo}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th class="date-cell">Date</th>
                    <th class="progress-cell">Progress Notes & Advice</th>
                  </tr>
                </thead>
                <tbody>
                  ${assessments.map(assessment => {
                    const formattedDate = formatDate(assessment.date);
                    return `
                      <tr>
                        <td class="date-cell">${formattedDate}</td>
                        <td class="progress-cell">
                          <div class="assessment-entry">
                            <div><strong>Assessment:</strong> ${assessment.assessment || 'N/A'}</div>
                            ${assessment.advice ? `<div><strong>Advice:</strong> ${assessment.advice}</div>` : ''}
                            <div class="doctor-info">Time: ${assessment.time} | Doctor: ${assessment.doctor_name}</div>
                            
                            ${assessment.procedures && assessment.procedures.length > 0 ? `
                              <div class="procedures-section">
                                <h4>Procedures:</h4>
                                ${assessment.procedures.map(procedure => `
                                  <div class="procedure-item">
                                    • <strong>${procedure.procedure?.procedure_name || 'N/A'}</strong>
                                    ${procedure.requirementsString ? ` - Requirements: ${procedure.requirementsString}` : ''}
                                    ${procedure.quantity ? ` - Quantity: ${procedure.quantity}` : ''}
                                    ${procedure.therapist ? ` - Therapist: ${procedure.therapist}` : ''}
                                    - Duration: ${procedure.start_date} to ${procedure.end_date}
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                            
                            ${assessment.medications && assessment.medications.length > 0 ? `
                              <div class="medications-section">
                                <h4>Internal Medications:</h4>
                                ${assessment.medications.map(medication => `
                                  <div class="medication-item">
                                    • <strong>${medication.medication?.product_name || 'N/A'}</strong>
                                    ${medication.dosage ? ` - Dosage: ${medication.dosage}` : ''}
                                    ${medication.frequency ? ` - Frequency: ${medication.frequency}` : ''}
                                    ${medication.notes ? ` - Notes: ${medication.notes}` : ''}
                                    - Duration: ${medication.start_date} to ${medication.end_date}
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                  ${assessments.length === 0 ? `
                    <tr>
                      <td colspan="2" style="text-align: center; padding: 15px; color: #666;">
                        No daily assessments recorded
                      </td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="text-center">Loading daily assessments...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Daily Assessment</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Chart
          </Button>
          <Button onClick={handleAddAssessment} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Assessment
          </Button>
        </div>
      </div>

      {/* Assessment Form */}
      {showForm && currentAssessment && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Daily Assessment - {formatDate(currentAssessment.date)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={currentAssessment.date}
                  onChange={(e) => setCurrentAssessment(prev => prev ? { ...prev, date: e.target.value } : null)}
                  className="w-full"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={currentAssessment.time}
                  onChange={(e) => setCurrentAssessment(prev => prev ? { ...prev, time: e.target.value } : null)}
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <Label>Doctor</Label>
                <Input
                  placeholder="Doctor Name"
                  value={currentAssessment.doctor_name}
                  onChange={(e) => setCurrentAssessment(prev => prev ? { ...prev, doctor_name: e.target.value } : null)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Assessment and Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label>Assessment</Label>
                <Textarea
                  placeholder="Patient assessment..."
                  value={currentAssessment.assessment}
                  onChange={(e) => setCurrentAssessment(prev => prev ? { ...prev, assessment: e.target.value } : null)}
                  rows={4}
                  className="w-full"
                />
              </div>
              <div>
                <Label>Advice</Label>
                <Textarea
                  placeholder="Medical advice..."
                  value={currentAssessment.advice}
                  onChange={(e) => setCurrentAssessment(prev => prev ? { ...prev, advice: e.target.value } : null)}
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>

            {/* Procedures Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Label className="text-lg font-semibold">Procedures</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowProcedureAdd(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Procedure
                </Button>
              </div>
              
              {procedures.map((procedure, idx) => (
                <Card key={idx} className="p-3 sm:p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <b>Procedure:</b>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProcedure(idx)}
                          className="w-full sm:w-auto"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveProcedure(idx)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div><b>Procedure:</b> {procedure.procedure?.procedure_name}</div>
                    <div><b>Medicines:</b> {procedure.medicinesString || "None"}</div>
                    <div><b>Requirements:</b> {procedure.requirementsString || "None"}</div>
                    <div><b>Quantity:</b> {procedure.quantity}</div>
                    <div><b>Start Date:</b> {procedure.start_date}</div>
                    <div><b>End Date:</b> {procedure.end_date}</div>
                    <div><b>Therapist:</b> {procedure.therapist}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRequestRequirements(idx)}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Request Requirements
                    </Button>
                  </div>
                </Card>
              ))}

                             {/* Add Procedure Form */}
               {showProcedureAdd && (
                 <div className="p-4 bg-gray-50 rounded border space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <Label>Procedure</Label>
                       <Input
                         placeholder="Search procedures..."
                         value={procedureSearch || ""}
                         onChange={(e) => setProcedureSearch(e.target.value || "")}
                       />
                       {procedureResults.length > 0 && (
                         <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                           {procedureResults.map((proc) => (
                             <div
                               key={proc.id}
                               className="p-2 hover:bg-gray-100 cursor-pointer"
                               onClick={() => {
                                 setSelectedProcedure(proc);
                                 setProcedureSearch("");
                                 setProcedureResults([]);
                               }}
                             >
                               {proc.procedure_name}
                             </div>
                           ))}
                         </div>
                       )}
                       {selectedProcedure && (
                         <div className="mt-2 p-2 bg-blue-100 rounded">
                           Selected: {selectedProcedure.procedure_name}
                         </div>
                       )}
                     </div>
                     <div>
                       <Label>Medicines (Optional)</Label>
                       <Input
                         placeholder="Search medicines..."
                         value={medicationSearch || ""}
                         onChange={(e) => setMedicationSearch(e.target.value || "")}
                       />
                       {medicationResults.length > 0 && (
                         <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                           {medicationResults.map((med) => (
                             <div
                               key={med.id}
                               className="p-2 hover:bg-gray-100 cursor-pointer"
                               onClick={() => {
                                 addMedicine(med);
                                 setMedicationSearch("");
                                 setMedicationResults([]);
                               }}
                             >
                               {med.product_name}
                             </div>
                           ))}
                         </div>
                       )}
                       {selectedMedicines.length > 0 && (
                         <div className="mt-2 space-y-1">
                           <Label className="text-sm font-medium">Selected Medicines:</Label>
                           {selectedMedicines.map((med) => (
                             <div key={med.id} className="flex items-center justify-between p-2 bg-blue-100 rounded">
                               <span className="text-sm">{med.product_name}</span>
                               <button
                                 type="button"
                                 onClick={() => removeMedicine(med.id)}
                                 className="text-red-500 hover:text-red-700"
                               >
                                 <X className="h-3 w-3" />
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                     <div>
                       <Label>Requirements (Optional)</Label>
                       <Input
                         placeholder="Search requirements..."
                         value={requirementSearch || ""}
                         onChange={(e) => setRequirementSearch(e.target.value || "")}
                       />
                       {requirementResults.length > 0 && (
                         <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                           {requirementResults.map((req) => (
                             <div
                               key={req.id}
                               className="p-2 hover:bg-gray-100 cursor-pointer"
                               onClick={() => {
                                 addRequirement(req);
                                 setRequirementSearch("");
                                 setRequirementResults([]);
                               }}
                             >
                               {req.product_name}
                             </div>
                           ))}
                         </div>
                       )}
                       {selectedRequirements.length > 0 && (
                         <div className="mt-2 space-y-1">
                           <Label className="text-sm font-medium">Selected Requirements:</Label>
                           {selectedRequirements.map((req) => (
                             <div key={req.id} className="flex items-center justify-between p-2 bg-green-100 rounded">
                               <span className="text-sm">{req.product_name}</span>
                               <button
                                 type="button"
                                 onClick={() => removeRequirement(req.id)}
                                 className="text-red-500 hover:text-red-700"
                               >
                                 <X className="h-3 w-3" />
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                     <div>
                       <Label>Quantity</Label>
                       <Input
                         placeholder="e.g., 10 sessions"
                         value={procedureQuantity || ""}
                         onChange={(e) => setProcedureQuantity(e.target.value || "")}
                       />
                     </div>
                     <div>
                       <Label>Start Date</Label>
                       <Input
                         type="date"
                         value={procedureStartDate || ""}
                         onChange={(e) => setProcedureStartDate(e.target.value || "")}
                       />
                     </div>
                     <div>
                       <Label>End Date</Label>
                       <Input
                         type="date"
                         value={procedureEndDate || ""}
                         onChange={(e) => setProcedureEndDate(e.target.value || "")}
                       />
                     </div>
                     <div>
                       <Label>Therapist</Label>
                       <Input
                         placeholder="Therapist name"
                         value={procedureTherapist || ""}
                         onChange={(e) => setProcedureTherapist(e.target.value || "")}
                       />
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button type="button" onClick={handleAddProcedure}>
                       {editingProcedureIndex !== null ? "Update Procedure" : "Add Procedure"}
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => {
                         setShowProcedureAdd(false);
                         setEditingProcedureIndex(null);
                       }}
                     >
                       Cancel
                     </Button>
                   </div>
                 </div>
               )}
            </div>

            {/* Internal Medications Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Label className="text-lg font-semibold">Internal Medications</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInternalMedAdd(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>
              
              {internalMedications.map((medication, idx) => (
                <Card key={idx} className="p-3 sm:p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <b>Medication:</b>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMedication(idx)}
                          className="w-full sm:w-auto"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMedication(idx)}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div><b>Medication:</b> {medication.medication?.product_name}</div>
                    <div><b>Dosage:</b> {medication.dosage}</div>
                    <div><b>Frequency:</b> {medication.frequency}</div>
                    <div><b>Start Date:</b> {medication.start_date}</div>
                    <div><b>End Date:</b> {medication.end_date}</div>
                    <div><b>Notes:</b> {medication.notes || "None"}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRequestMedication(medication)}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Request Medication
                    </Button>
                  </div>
                </Card>
              ))}

                             {/* Add Medication Form */}
               {showInternalMedAdd && (
                 <div className="p-4 bg-gray-50 rounded border space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <Label>Medication</Label>
                       <Input
                         placeholder="Search medications..."
                         value={internalMedSearch || ""}
                         onChange={(e) => setInternalMedSearch(e.target.value || "")}
                       />
                       {internalMedResults.length > 0 && (
                         <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                           {internalMedResults.map((med) => (
                             <div
                               key={med.id}
                               className="p-2 hover:bg-gray-100 cursor-pointer"
                               onClick={() => {
                                 setSelectedInternalMed(med);
                                 setInternalMedSearch("");
                                 setInternalMedResults([]);
                               }}
                             >
                               {med.product_name}
                             </div>
                           ))}
                         </div>
                       )}
                       {selectedInternalMed && (
                         <div className="mt-2 p-2 bg-blue-100 rounded">
                           Selected: {selectedInternalMed.product_name}
                         </div>
                       )}
                     </div>
                     <div>
                       <Label>Dosage</Label>
                       <Input
                         placeholder="e.g., 500mg"
                         value={medicationDosage || ""}
                         onChange={(e) => setMedicationDosage(e.target.value || "")}
                       />
                     </div>
                     <div>
                       <Label>Frequency</Label>
                       <Input
                         placeholder="e.g., twice daily"
                         value={medicationFrequency || ""}
                         onChange={(e) => setMedicationFrequency(e.target.value || "")}
                       />
                     </div>
                     <div>
                       <Label>Start Date</Label>
                       <Input
                         type="date"
                         value={medicationStartDate || ""}
                         onChange={(e) => setMedicationStartDate(e.target.value || "")}
                       />
                     </div>
                     <div>
                       <Label>End Date</Label>
                       <Input
                         type="date"
                         value={medicationEndDate || ""}
                         onChange={(e) => setMedicationEndDate(e.target.value || "")}
                       />
                     </div>
                     <div className="md:col-span-2">
                       <Label>Notes</Label>
                       <Textarea
                         placeholder="Additional notes..."
                         value={medicationNotes || ""}
                         onChange={(e) => setMedicationNotes(e.target.value || "")}
                       />
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <Button type="button" onClick={handleAddInternalMed}>
                       {editingMedicationIndex !== null ? "Update Medication" : "Add Medication"}
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => {
                         setShowInternalMedAdd(false);
                         setEditingMedicationIndex(null);
                       }}
                     >
                       Cancel
                     </Button>
                   </div>
                 </div>
               )}
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Assessment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setCurrentAssessment(null);
                  setProcedures([]);
                  setInternalMedications([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment List */}
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <Card key={assessment.id} className="shadow">
          <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                  <CardTitle className="text-lg">{formatDate(assessment.date)}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {assessment.time} • {assessment.doctor_name}
            </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditAssessment(assessment)}
                  className="w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div><b>Assessment:</b> {assessment.assessment}</div>
                  {assessment.advice && <div><b>Advice:</b> {assessment.advice}</div>}
                </div>

                {/* Procedures Section */}
                {assessment.procedures && assessment.procedures.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-gray-700">Procedures:</div>
                    {assessment.procedures.map((procedure, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded border text-sm">
                        <div><b>Procedure:</b> {procedure.procedure?.procedure_name}</div>
                        {procedure.requirementsString && <div><b>Requirements:</b> {procedure.requirementsString}</div>}
                        {procedure.quantity && <div><b>Quantity:</b> {procedure.quantity}</div>}
                        {procedure.therapist && <div><b>Therapist:</b> {procedure.therapist}</div>}
                        <div><b>Duration:</b> {procedure.start_date} to {procedure.end_date}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medications Section */}
                {assessment.medications && assessment.medications.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-gray-700">Internal Medications:</div>
                    {assessment.medications.map((medication, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded border text-sm">
                        <div><b>Medication:</b> {medication.medication?.product_name}</div>
                        {medication.dosage && <div><b>Dosage:</b> {medication.dosage}</div>}
                        {medication.frequency && <div><b>Frequency:</b> {medication.frequency}</div>}
                        {medication.notes && <div><b>Notes:</b> {medication.notes}</div>}
                        <div><b>Duration:</b> {medication.start_date} to {medication.end_date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assessments.length === 0 && !showForm && (
        <Card className="text-center py-8">
          <div className="text-muted-foreground">No daily assessments found. Click "Add Assessment" to create one.</div>
        </Card>
      )}
    </div>
  );
} 