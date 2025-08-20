"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus, X, Edit, Trash2 } from "lucide-react";
import PrintableIpdCaseSheet from "./printable-ipd-case-sheet";
import { 
  getDummyIpdCaseSheet, 
  getDummyDailyAssessments, 
  getDummyPainAssessments, 
  getDummyBpTprCharts, 
  getDummyDietSheets, 
  getDummyMedicationAdministrationCharts,
  buildSeedIpdProcedures,
  buildSeedIpdMedications,
  getDummyProcedures,
  getDummyMedications
} from "@/lib/dummy";

interface IpdCaseSheetFormProps {
  initialCaseSheet?: any;
  patientUhId?: string;
  doctorId?: string;
  doctorName?: string;
  patientName?: string;
  age?: number | string;
  gender?: string;
  contact?: string;
  address?: string;
  department?: string;
  ipdNo?: string;
  opdNo?: string;
  ward?: string;
  bedNo?: string;
  admissionDate?: string;
  onSave?: () => void;
}

export default function IpdCaseSheetForm({ initialCaseSheet, patientUhId, doctorId, doctorName, patientName, age, gender, contact, address, department, ipdNo, opdNo, ward, bedNo, admissionDate, onSave }: IpdCaseSheetFormProps) {
  console.log("IpdCaseSheetForm received ipdNo:", ipdNo);
  const [formData, setFormData] = useState<any>(
    initialCaseSheet || {
      ipd_no: ipdNo ?? "",
      opd_no: opdNo ?? "",
      uhid: patientUhId ?? "",
      doctor_id: doctorId ?? "",
      department: department ?? "",
      ward: ward ?? "",
      bed_no: bedNo ?? "",
      admission_at: admissionDate ?? "",
      discharge_at: "",
      doa_time: "",
      dod_time: "",
      op_no: opdNo ?? "",
      ip_no: ipdNo ?? "",
      age: age ?? "",
      gender: gender ?? "Male",
      occupation: "",
      address: address ?? "",
      contact: contact ?? "",
      present_complaints: "",
      associated_complaints: "",
      past_history: "",
      personal_history: "",
      obs_gyn_history: "",
      previous_medicine_history: "",
      family_history: "",
      // Individual examination fields instead of nested objects
      height: "",
      weight: "",
      bmi: "",
      pulse: "",
      rr: "",
      bp: "",
      respiratory_system: "",
      cvs: "",
      cns: "",
      general_examination: {},
      dasavidha_pariksha: {},
      asthasthana_pariksha: {},
      systemic_examination: {},
      local_examination: "",
      sampraptighataka: {},
      pain_assessment: "",
      investigations: "",
      diagnosis: "",
      nutritional_status: "normal",
      treatment_plan: "",
      preventive_aspects: "",
      rehabilitation: "",
      desired_outcome: "",
    }
  );
  const [loading, setLoading] = useState(false);
  
  // Parse JSONB fields when initialCaseSheet is loaded
  useEffect(() => {
    if (initialCaseSheet) {
      console.log("Initial case sheet received:", initialCaseSheet);
      
      // Helper function to convert null values to empty strings for input fields
      const convertNullToString = (value: any) => {
        return value === null || value === undefined ? "" : value;
      };
      
      // First, create a clean version of initialCaseSheet with all null values converted to empty strings
      const cleanInitialData = Object.keys(initialCaseSheet).reduce((acc, key) => {
        acc[key] = convertNullToString(initialCaseSheet[key]);
        return acc;
      }, {} as any);
      
      // Parse JSONB fields that come as strings from the database
      const parsedData = {
        ...cleanInitialData,
        // Convert all potential null values to empty strings for input fields
        admission_at: convertNullToString(initialCaseSheet.admission_at),
        discharge_at: convertNullToString(initialCaseSheet.discharge_at),
        ward: convertNullToString(initialCaseSheet.ward),
        bed_no: convertNullToString(initialCaseSheet.bed_no),
        doctor_id: convertNullToString(initialCaseSheet.doctor_id),
        department: convertNullToString(initialCaseSheet.department),
        uhid: convertNullToString(initialCaseSheet.uhid),
        patient_name: convertNullToString(initialCaseSheet.patient_name),
        age: convertNullToString(initialCaseSheet.age),
        gender: convertNullToString(initialCaseSheet.gender),
        occupation: convertNullToString(initialCaseSheet.occupation),
        address: convertNullToString(initialCaseSheet.address),
        contact: convertNullToString(initialCaseSheet.contact),
        present_complaints: convertNullToString(initialCaseSheet.present_complaints),
        associated_complaints: convertNullToString(initialCaseSheet.associated_complaints),
        past_history: convertNullToString(initialCaseSheet.past_history),
        personal_history: convertNullToString(initialCaseSheet.personal_history),
        obs_gyn_history: convertNullToString(initialCaseSheet.obs_gyn_history),
        previous_medicine_history: convertNullToString(initialCaseSheet.previous_medicine_history),
        family_history: convertNullToString(initialCaseSheet.family_history),
        height: convertNullToString(initialCaseSheet.height),
        weight: convertNullToString(initialCaseSheet.weight),
        bmi: convertNullToString(initialCaseSheet.bmi),
        pulse: convertNullToString(initialCaseSheet.pulse),
        rr: convertNullToString(initialCaseSheet.rr),
        bp: convertNullToString(initialCaseSheet.bp),
        respiratory_system: convertNullToString(initialCaseSheet.respiratory_system),
        cvs: convertNullToString(initialCaseSheet.cvs),
        cns: convertNullToString(initialCaseSheet.cns),
        local_examination: convertNullToString(initialCaseSheet.local_examination),
        pain_assessment: convertNullToString(initialCaseSheet.pain_assessment),
        investigations: convertNullToString(initialCaseSheet.investigations),
        diagnosis: convertNullToString(initialCaseSheet.diagnosis),
        nutritional_status: convertNullToString(initialCaseSheet.nutritional_status) || "normal",
        treatment_plan: convertNullToString(initialCaseSheet.treatment_plan),
        preventive_aspects: convertNullToString(initialCaseSheet.preventive_aspects),
        rehabilitation: convertNullToString(initialCaseSheet.rehabilitation),
        desired_outcome: convertNullToString(initialCaseSheet.desired_outcome),
        general_examination: (() => {
          try {
            return typeof initialCaseSheet.general_examination === 'string' 
              ? JSON.parse(initialCaseSheet.general_examination || '{}') 
              : initialCaseSheet.general_examination || {};
          } catch (error) {
            console.error("Error parsing general_examination:", error);
            return {};
          }
        })(),
        dasavidha_pariksha: (() => {
          try {
            return typeof initialCaseSheet.dasavidha_pariksha === 'string' 
              ? JSON.parse(initialCaseSheet.dasavidha_pariksha || '{}') 
              : initialCaseSheet.dasavidha_pariksha || {};
          } catch (error) {
            console.error("Error parsing dasavidha_pariksha:", error);
            return {};
          }
        })(),
        asthasthana_pariksha: (() => {
          try {
            return typeof initialCaseSheet.asthasthana_pariksha === 'string' 
              ? JSON.parse(initialCaseSheet.asthasthana_pariksha || '{}') 
              : initialCaseSheet.asthasthana_pariksha || {};
          } catch (error) {
            console.error("Error parsing asthasthana_pariksha:", error);
            return {};
          }
        })(),
        systemic_examination: (() => {
          try {
            return typeof initialCaseSheet.systemic_examination === 'string' 
              ? JSON.parse(initialCaseSheet.systemic_examination || '{}') 
              : initialCaseSheet.systemic_examination || {};
          } catch (error) {
            console.error("Error parsing systemic_examination:", error);
            return {};
          }
        })(),
        sampraptighataka: (() => {
          try {
            return typeof initialCaseSheet.sampraptighataka === 'string' 
              ? JSON.parse(initialCaseSheet.sampraptighataka || '{}') 
              : initialCaseSheet.sampraptighataka || {};
          } catch (error) {
            console.error("Error parsing sampraptighataka:", error);
            return {};
          }
        })(),
      };
      
      setFormData(parsedData);
      console.log("Parsed form data:", parsedData);
      console.log("Dasavidha pariksha data:", parsedData.dasavidha_pariksha);
    }
  }, [initialCaseSheet]);

  // Safety check to ensure formData never contains null values
  useEffect(() => {
    const hasNullValues = Object.values(formData).some(value => value === null);
    if (hasNullValues) {
      console.warn("Found null values in formData, converting to empty strings");
      const cleanFormData = Object.keys(formData).reduce((acc, key) => {
        acc[key] = formData[key] === null ? "" : formData[key];
        return acc;
      }, {} as any);
      setFormData(cleanFormData);
    }
  }, [formData]);
  
  // State for procedures and medications
  const [procedures, setProcedures] = useState<any[]>([]);
  const [showProcedureAdd, setShowProcedureAdd] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState("");
  const [procedureResults, setProcedureResults] = useState<any[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  
  // Multiple medicines and requirements for procedures
  const [selectedMedicines, setSelectedMedicines] = useState<any[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<any[]>([]);
  const [medicinesString, setMedicinesString] = useState("");
  const [requirementsString, setRequirementsString] = useState("");
  
  // Search states for medicines and requirements
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medicationResults, setMedicationResults] = useState<any[]>([]);
  const [requirementSearch, setRequirementSearch] = useState("");
  const [requirementResults, setRequirementResults] = useState<any[]>([]);
  
  // Edit search states
  const [editMedicationSearch, setEditMedicationSearch] = useState("");
  const [editMedicationResults, setEditMedicationResults] = useState<any[]>([]);
  const [editRequirementSearch, setEditRequirementSearch] = useState("");
  const [editRequirementResults, setEditRequirementResults] = useState<any[]>([]);
  
  const [procedureQuantity, setProcedureQuantity] = useState("");
  const [procedureStartDate, setProcedureStartDate] = useState("");
  const [procedureEndDate, setProcedureEndDate] = useState("");
  const [procedureTherapist, setProcedureTherapist] = useState("");
  
  // Edit states for procedures
  const [editingProcedureIndex, setEditingProcedureIndex] = useState<number | null>(null);
  const [editProcedureSearch, setEditProcedureSearch] = useState("");
  const [editProcedureResults, setEditProcedureResults] = useState<any[]>([]);
  const [editSelectedProcedure, setEditSelectedProcedure] = useState<any>(null);
  
  // Edit states for multiple medicines and requirements
  const [editSelectedMedicines, setEditSelectedMedicines] = useState<any[]>([]);
  const [editSelectedRequirements, setEditSelectedRequirements] = useState<any[]>([]);
  const [editMedicinesString, setEditMedicinesString] = useState("");
  const [editRequirementsString, setEditRequirementsString] = useState("");
  
  const [editProcedureQuantity, setEditProcedureQuantity] = useState("");
  const [editProcedureStartDate, setEditProcedureStartDate] = useState("");
  const [editProcedureEndDate, setEditProcedureEndDate] = useState("");
  const [editProcedureTherapist, setEditProcedureTherapist] = useState("");

  const [internalMedications, setInternalMedications] = useState<any[]>([]);
  const [showInternalMedAdd, setShowInternalMedAdd] = useState(false);
  const [internalMedSearch, setInternalMedSearch] = useState("");
  const [internalMedResults, setInternalMedResults] = useState<any[]>([]);
  const [selectedInternalMed, setSelectedInternalMed] = useState<any>(null);
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("");
  const [medicationStartDate, setMedicationStartDate] = useState("");
  const [medicationEndDate, setMedicationEndDate] = useState("");
  const [medicationNotes, setMedicationNotes] = useState("");
  
  // Edit states for internal medications
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);
  const [editInternalMedSearch, setEditInternalMedSearch] = useState("");
  const [editInternalMedResults, setEditInternalMedResults] = useState<any[]>([]);
  const [editSelectedInternalMed, setEditSelectedInternalMed] = useState<any>(null);
  const [editMedicationDosage, setEditMedicationDosage] = useState("");
  const [editMedicationFrequency, setEditMedicationFrequency] = useState("");
  const [editMedicationStartDate, setEditMedicationStartDate] = useState("");
  const [editMedicationEndDate, setEditMedicationEndDate] = useState("");
  const [editMedicationNotes, setEditMedicationNotes] = useState("");
  
  // State for previously saved data (read-only view)
  const [savedProcedures, setSavedProcedures] = useState<any[]>([]);
  const [savedMedications, setSavedMedications] = useState<any[]>([]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>(
    (initialCaseSheet as any)?.investigations ? (initialCaseSheet as any).investigations.split(", ").filter(Boolean) : []
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Function to seed all IPD dashboard sections with dummy data
  const seedAllIpdSections = async () => {
    if (!ipdNo) return;
    
    try {
      let baseISO = initialCaseSheet?.created_at ? new Date(initialCaseSheet.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
      
      // Seed case sheet if it doesn't exist
      if (!initialCaseSheet) {
        const dummyCaseSheet = getDummyIpdCaseSheet(ipdNo);
        const { data: insertedCaseSheet, error: insertError } = await supabase
          .from("ipd_case_sheets")
          .insert({
            ...dummyCaseSheet,
            ipd_no: ipdNo,
            uhid: patientUhId,
            doctor_id: doctorId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertedCaseSheet && !insertError) {
          console.log("Seeded IPD case sheet");
          // Update the form data with the seeded case sheet
          setFormData(prev => ({
            ...prev,
            ...insertedCaseSheet
          }));
        }
      }
      
      // Seed daily assessments
      const { data: existingDailyAssessments } = await supabase
        .from("ipd_daily_assessments")
        .select("id")
        .eq("ipd_no", ipdNo);
      
      if (!existingDailyAssessments || existingDailyAssessments.length === 0) {
        const dailyAssessments = getDummyDailyAssessments(ipdNo, baseISO);
        await supabase.from("ipd_daily_assessments").insert(dailyAssessments);
        console.log("Seeded daily assessments");
      }
      
      // Seed pain assessments
      const { data: existingPainAssessments } = await supabase
        .from("pain_assessments")
        .select("id")
        .eq("ipd_no", ipdNo);
      
      if (!existingPainAssessments || existingPainAssessments.length === 0) {
        const painAssessments = getDummyPainAssessments(ipdNo, baseISO);
        await supabase.from("pain_assessments").insert(painAssessments);
        console.log("Seeded pain assessments");
      }
      
      // Seed BP/TPR charts
      const { data: existingBpTpr } = await supabase
        .from("bp_tpr_charts")
        .select("id")
        .eq("ipd_no", ipdNo);
      
      if (!existingBpTpr || existingBpTpr.length === 0) {
        const bpTprCharts = getDummyBpTprCharts(ipdNo, baseISO);
        await supabase.from("bp_tpr_charts").insert(bpTprCharts);
        console.log("Seeded BP/TPR charts");
      }
      
      // Seed diet sheets
      const { data: existingDietSheets } = await supabase
        .from("diet_sheets")
        .select("id")
        .eq("ipd_no", ipdNo);
      
      if (!existingDietSheets || existingDietSheets.length === 0) {
        const dietSheets = getDummyDietSheets(ipdNo, baseISO);
        await supabase.from("diet_sheets").insert(dietSheets);
        console.log("Seeded diet sheets");
      }
      
      // Seed medication administration charts
      const { data: existingMedAdmin } = await supabase
        .from("medication_administration_charts")
        .select("id")
        .eq("ipd_no", ipdNo);
      
      if (!existingMedAdmin || existingMedAdmin.length === 0) {
        const medAdminCharts = getDummyMedicationAdministrationCharts(ipdNo, baseISO);
        await supabase.from("medication_administration_charts").insert(medAdminCharts);
        console.log("Seeded medication administration charts");
      }
      
      // Seed discharge summary
      const { data: existingDischargeSummary } = await supabase
        .from("discharge_summaries")
        .select("id")
        .eq("ipd_no", ipdNo);
      
      if (!existingDischargeSummary || existingDischargeSummary.length === 0) {
        const dischargeSummary = {
          ipd_no: ipdNo,
          date_of_discharge: new Date().toISOString().slice(0, 10),
          discharge_diagnosis: "Lumbar disc herniation L4-L5 with left L5 radiculopathy",
          treatment_given: "Conservative management with Panchakarma therapy, pain management",
          condition_on_discharge: "Improved",
          advice_on_discharge: "Continue medications, follow-up in 2 weeks, avoid heavy lifting",
          created_at: new Date().toISOString(),
        };
        await supabase.from("discharge_summaries").insert(dischargeSummary);
        console.log("Seeded discharge summary");
      }
      
      toast({
        title: "Success",
        description: "All IPD sections seeded with dummy data",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error seeding IPD sections:", error);
      toast({
        title: "Error",
        description: "Failed to seed some IPD sections",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchPatientAndDoctorDetails = async () => {
      // Fetch patient details
      if (patientUhId) {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("full_name, age, gender, mobile, address")
          .eq("uhid", patientUhId)
          .single();
        
        if (patientData) {
          setFormData((prev: any) => ({
            ...prev,
            patient_name: patientData.full_name || "",
            age: patientData.age || "",
            gender: patientData.gender || "Male",
            contact: patientData.mobile || "",
            address: patientData.address || "",
          }));
        }
      }

      // Fetch doctor details and department
      if (doctorId) {
        const { data: doctorData, error: doctorError } = await supabase
          .from("staff")
          .select("full_name, department_id")
          .eq("id", doctorId)
          .single();
        
        if (doctorData) {
          // Fetch department name separately
          let departmentName = "";
          if (doctorData.department_id) {
            const { data: deptData } = await supabase
              .from("departments")
              .select("name")
              .eq("id", doctorData.department_id)
              .single();
            departmentName = deptData?.name || "";
          }
          
          setFormData((prev: any) => ({
            ...prev,
            doctor_name: doctorData.full_name || "",
            department: departmentName,
          }));
        }
      }

      // Fetch IPD admission details for pre-filling
      if (ipdNo) {
        console.log("Fetching IPD admission details for IPD No:", ipdNo);
        const { data: ipdData, error: ipdError } = await supabase
          .from("ipd_admissions")
          .select("*")
          .eq("ipd_no", ipdNo)
          .single();
        
        if (ipdError) {
          console.error("Error fetching IPD admission details:", ipdError);
        }
        
        if (ipdData) {
          console.log("IPD admission data found:", ipdData);
          // Format admission date for datetime-local input
          let formattedAdmissionDate = "";
          if (ipdData.admission_date) {
            // Convert date to datetime-local format (YYYY-MM-DDTHH:MM)
            const date = new Date(ipdData.admission_date);
            formattedAdmissionDate = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
          }
          
          // Format discharge date for datetime-local input
          let formattedDischargeDate = "";
          if (ipdData.discharge_date) {
            // Convert date to datetime-local format (YYYY-MM-DDTHH:MM)
            const date = new Date(ipdData.discharge_date);
            formattedDischargeDate = date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
          }
          
          console.log("Formatted dates - Admission:", formattedAdmissionDate, "Discharge:", formattedDischargeDate);
          
          setFormData((prev: any) => ({
            ...prev,
            admission_at: formattedAdmissionDate,
            discharge_at: formattedDischargeDate,
            ward: ipdData.ward || "",
            bed_no: ipdData.bed_number || "",
            // Add other fields from ipd_admissions if they exist in the form
            // admission_reason: ipdData.admission_reason || "",
            // deposit_amount: ipdData.deposit_amount || "",
          }));
          console.log("Form data updated with IPD admission details");
        } else {
          console.log("No IPD admission data found for IPD No:", ipdNo);
        }
      }
      
      // If no case sheet exists, seed a basic one
      if (ipdNo && !initialCaseSheet) {
        try {
          const dummyCaseSheet = getDummyIpdCaseSheet(ipdNo);
          const { data: insertedCaseSheet, error: insertError } = await supabase
            .from("ipd_case_sheets")
            .insert({
              ...dummyCaseSheet,
              ipd_no: ipdNo,
              uhid: patientUhId,
              doctor_id: doctorId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (insertedCaseSheet && !insertError) {
            console.log("Seeded basic IPD case sheet");
            // Update the form data with the seeded case sheet
            setFormData(prev => ({
              ...prev,
              ...insertedCaseSheet
            }));
          }
        } catch (error) {
          console.error("Error seeding IPD case sheet:", error);
        }
      }
    };

    fetchPatientAndDoctorDetails();
  }, [initialCaseSheet, patientUhId, doctorId, ipdNo]);



  // Load previously saved procedures and internal medications
  useEffect(() => {
    const loadSavedData = async () => {
      if (ipdNo) {
        console.log("Loading saved data for IPD:", ipdNo);
        
        // Get the case sheet creation date to filter procedures and medications
        let caseSheetDate = null;
        if (initialCaseSheet && initialCaseSheet.created_at) {
          caseSheetDate = new Date(initialCaseSheet.created_at).toISOString().split('T')[0];
          console.log("Case sheet date:", caseSheetDate);
        } else {
          console.log("No created_at date found, will load all data for this IPD");
        }

        // Load procedures - match case sheet created_at with procedure created_at date
        let proceduresQuery = supabase
          .from("procedure_entries")
          .select("*")
          .eq("ipd_no", ipdNo);
        
        if (caseSheetDate) {
          // Match case sheet creation date with procedure created_at date (date only)
          proceduresQuery = proceduresQuery
            .gte("created_at", `${caseSheetDate}T00:00:00.000Z`)
            .lt("created_at", `${caseSheetDate}T23:59:59.999Z`);
        }
        
        proceduresQuery = proceduresQuery.order("created_at", { ascending: false });
        
        let { data: proceduresData, error: proceduresError } = await proceduresQuery;
        console.log("Procedures data:", proceduresData, "Error:", proceduresError);
        console.log("IPD No being searched:", ipdNo);
        
        // If no procedures exist, seed dummy data
        if ((!proceduresData || proceduresData.length === 0) && ipdNo) {
          try {
            let baseISO = initialCaseSheet?.created_at ? new Date(initialCaseSheet.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
            const seed = buildSeedIpdProcedures(ipdNo, baseISO);
            await supabase.from("procedure_entries").insert(seed);
            const { data: seeded } = await supabase.from("procedure_entries").select("*").eq("ipd_no", ipdNo);
            proceduresData = seeded || [];
          } catch (e) { 
            console.warn("Seeding IPD procedures failed, using dummy overlay only", e); 
          }
        }
        
        if (proceduresData && proceduresData.length > 0) {
          const formattedProcedures = proceduresData.map(proc => {
            // Since the database only stores combined requirements, we need to handle this properly
            // For now, we'll show the combined requirements in both fields for display purposes
            const combinedRequirements = proc.requirements || "";
            
            return {
              procedure: { procedure_name: proc.procedure_name },
              medicinesString: "", // We can't separate medicines from requirements in saved data
              requirementsString: combinedRequirements, // Show the combined requirements
              quantity: proc.quantity,
              start_date: proc.start_date,
              end_date: proc.end_date,
              therapist: proc.therapist
            };
          });
          
          // For existing case sheets, show in read-only view
          setSavedProcedures(formattedProcedures);
          console.log("Set saved procedures:", formattedProcedures);
        }

        // Load internal medications - match case sheet created_at with medication created_at date
        let medicationsQuery = supabase
          .from("internal_medications")
          .select("*")
          .eq("ipd_no", ipdNo);
        
        if (caseSheetDate) {
          // Match case sheet creation date with medication created_at date (date only)
          medicationsQuery = medicationsQuery
            .gte("created_at", `${caseSheetDate}T00:00:00.000Z`)
            .lt("created_at", `${caseSheetDate}T23:59:59.999Z`);
        }
        
        medicationsQuery = medicationsQuery.order("created_at", { ascending: false });
        
        let { data: medicationsData, error: medicationsError } = await medicationsQuery;
        console.log("Medications data:", medicationsData, "Error:", medicationsError);
        
        // If no medications exist, seed dummy data
        if ((!medicationsData || medicationsData.length === 0) && ipdNo) {
          try {
            let baseISO = initialCaseSheet?.created_at ? new Date(initialCaseSheet.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
            const seed = buildSeedIpdMedications(ipdNo, baseISO);
            await supabase.from("internal_medications").insert(seed);
            const { data: seeded } = await supabase.from("internal_medications").select("*").eq("ipd_no", ipdNo);
            medicationsData = seeded || [];
          } catch (e) { 
            console.warn("Seeding IPD medications failed, using dummy overlay only", e); 
          }
        }
        
        if (medicationsData && medicationsData.length > 0) {
          const formattedMedications = medicationsData.map(med => ({
            medication: { product_name: med.medication_name },
            dosage: med.dosage,
            frequency: med.frequency,
            start_date: med.start_date,
            end_date: med.end_date,
            notes: med.notes
          }));
          
          // For existing case sheets, show in read-only view
          setSavedMedications(formattedMedications);
          console.log("Set saved medications:", formattedMedications);
        }
      } else {
        console.log("No IPD number provided, not loading saved data");
      }
    };
    
    loadSavedData();
  }, [ipdNo, initialCaseSheet]);

  // Auto-seed other IPD sections if they don't exist
  useEffect(() => {
    const seedOtherIpdSections = async () => {
      if (!ipdNo) return;
      
      try {
        let baseISO = initialCaseSheet?.created_at ? new Date(initialCaseSheet.created_at).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
        
        // Check and seed daily assessments
        const { data: existingDailyAssessments } = await supabase
          .from("ipd_daily_assessments")
          .select("id")
          .eq("ipd_no", ipdNo);
        
        if (!existingDailyAssessments || existingDailyAssessments.length === 0) {
          const dailyAssessments = getDummyDailyAssessments(ipdNo, baseISO);
          await supabase.from("ipd_daily_assessments").insert(dailyAssessments);
          console.log("Auto-seeded daily assessments");
        }
        
        // Check and seed pain assessments
        const { data: existingPainAssessments } = await supabase
          .from("pain_assessments")
          .select("id")
          .eq("ipd_no", ipdNo);
        
        if (!existingPainAssessments || existingPainAssessments.length === 0) {
          const painAssessments = getDummyPainAssessments(ipdNo, baseISO);
          await supabase.from("pain_assessments").insert(painAssessments);
          console.log("Auto-seeded pain assessments");
        }
        
        // Check and seed BP/TPR charts
        const { data: existingBpTpr } = await supabase
          .from("bp_tpr_charts")
          .select("id")
          .eq("ipd_no", ipdNo);
        
        if (!existingBpTpr || existingBpTpr.length === 0) {
          const bpTprCharts = getDummyBpTprCharts(ipdNo, baseISO);
          await supabase.from("bp_tpr_charts").insert(bpTprCharts);
          console.log("Auto-seeded BP/TPR charts");
        }
        
        // Check and seed diet sheets
        const { data: existingDietSheets } = await supabase
          .from("diet_sheets")
          .select("id")
          .eq("ipd_no", ipdNo);
        
        if (!existingDietSheets || existingDietSheets.length === 0) {
          const dietSheets = getDummyDietSheets(ipdNo, baseISO);
          await supabase.from("diet_sheets").insert(dietSheets);
          console.log("Auto-seeded diet sheets");
        }
        
        // Check and seed medication administration charts
        const { data: existingMedAdmin } = await supabase
          .from("medication_administration_charts")
          .select("id")
          .eq("ipd_no", ipdNo);
        
        if (!existingMedAdmin || existingMedAdmin.length === 0) {
          const medAdminCharts = getDummyMedicationAdministrationCharts(ipdNo, baseISO);
          await supabase.from("medication_administration_charts").insert(medAdminCharts);
          console.log("Auto-seeded medication administration charts");
        }
        
        // Check and seed discharge summary
        const { data: existingDischargeSummary } = await supabase
          .from("discharge_summaries")
          .select("id")
          .eq("ipd_no", ipdNo);
        
        if (!existingDischargeSummary || existingDischargeSummary.length === 0) {
          const dischargeSummary = {
            ipd_no: ipdNo,
            date_of_discharge: new Date().toISOString().slice(0, 10),
            discharge_diagnosis: "Lumbar disc herniation L4-L5 with left L5 radiculopathy",
            treatment_given: "Conservative management with Panchakarma therapy, pain management",
            condition_on_discharge: "Improved",
            advice_on_discharge: "Continue medications, follow-up in 2 weeks, avoid heavy lifting",
            created_at: new Date().toISOString(),
          };
          await supabase.from("discharge_summaries").insert(dischargeSummary);
          console.log("Auto-seeded discharge summary");
        }
        
      } catch (error) {
        console.error("Error auto-seeding IPD sections:", error);
      }
    };
    
    // Add a small delay to ensure initial data is loaded first
    const timer = setTimeout(() => {
      seedOtherIpdSections();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [ipdNo, initialCaseSheet]);

  // Pre-fill form with dummy data if fields are empty
  useEffect(() => {
    if (ipdNo && formData) {
      const hasEmptyFields = !formData.present_complaints || !formData.height || !formData.weight || !formData.pulse || !formData.bp;
      
      if (hasEmptyFields) {
        const dummyData = getDummyIpdCaseSheet(ipdNo);
        
        setFormData(prev => ({
          ...prev,
          present_complaints: prev.present_complaints || dummyData.present_complaints,
          associated_complaints: prev.associated_complaints || dummyData.associated_complaints,
          past_history: prev.past_history || dummyData.past_history,
          personal_history: prev.personal_history || dummyData.personal_history,
          obs_gyn_history: prev.obs_gyn_history || dummyData.obs_gyn_history,
          previous_medicine_history: prev.previous_medicine_history || dummyData.previous_medicine_history,
          family_history: prev.family_history || dummyData.family_history,
          height: prev.height || dummyData.height,
          weight: prev.weight || dummyData.weight,
          bmi: prev.bmi || dummyData.bmi,
          pulse: prev.pulse || dummyData.pulse,
          rr: prev.rr || dummyData.rr,
          bp: prev.bp || dummyData.bp,
          respiratory_system: prev.respiratory_system || dummyData.respiratory_system,
          cvs: prev.cvs || dummyData.cvs,
          cns: prev.cns || dummyData.cns,
          local_examination: prev.local_examination || dummyData.local_examination,
          sampraptighataka: prev.sampraptighataka || dummyData.sampraptighataka,
          pain_assessment: prev.pain_assessment || dummyData.pain_assessment,
          investigations: prev.investigations || dummyData.investigations,
          diagnosis: prev.diagnosis || dummyData.diagnosis,
          nutritional_status: prev.nutritional_status || dummyData.nutritional_status,
          treatment_plan: prev.treatment_plan || dummyData.treatment_plan,
          preventive_aspects: prev.preventive_aspects || dummyData.preventive_aspects,
          rehabilitation: prev.rehabilitation || dummyData.rehabilitation,
          desired_outcome: prev.desired_outcome || dummyData.desired_outcome,
        }));
        
        // Also pre-fill selected investigations
        if (!selectedInvestigations || selectedInvestigations.length === 0) {
          const dummyInvestigations = dummyData.investigations.split(", ").filter(Boolean);
          setSelectedInvestigations(dummyInvestigations);
        }
      }
    }
  }, [ipdNo, formData, selectedInvestigations]);

  // Diagnostic services data structure
  const diagnosticServices = {
    "Laboratory Services": {
      "HAEMATOLOGY": [
        "Complete Haemogram", "C.B.C.", "C.B.C. with ESR", "Hb%", "TC / DC", "P.S. Study",
        "Hb, TC, DC. ESR", "Platelet Count", "Absolute Eosinophil Count", "Retic Count",
        "MP by QBC", "BT & CT", "P.S. for M.P.", "Coagulation profile", "Prothrombin Time (PT)",
        "APTT", "Blood Group / Rh factor", "Coomb's test", "Clot retraction time",
        "Osmotic fragility", "Bone marrow study", "D. Dimer", "Du Test", "CD4 / CD8",
        "Vit B 12 assay", "Folic acid assay", "Iron studies"
      ],
      "BIOCHEMISTRY": [
        "Glucose - F, PP, R", "GTT", "Mini GTT", "Urea / BUN", "S. Creatinine",
        "S. Bilirubin (T/D/I)", "SGOT", "SGPT", "S.G-glutamyl transferase",
        "S. Alkaline Phosphatase", "Total Protein / Alb/Glo, A/G", "Total Cholesterol",
        "S. Triglyceride", "HDL Cholesterol", "LDL Cholesterol", "VLDL",
        "S. Electrolytes: NA, K, CI", "Calcium", "Phosphorous", "Magnesium",
        "S. Amylase", "S. Lipase", "HbA1c", "S. Cholinesterase", "S. Uric Acid"
      ],
      "SEROLOGY": [
        "Tuberculin test / Mantoux test", "HIV Screening test", "HBsAg Screening test",
        "HCV Test", "VDRL test", "Widal", "Rapid Malaria Screen (Antigen)",
        "Rapid Malaria Screen (Antibody)", "Dengue serology", "CRP Qualitative",
        "CRP (Immunoturbidometry)", "ASO Qualitative", "ASO (Immunoturbidometry)",
        "RA test Qualitative"
      ],
      "URINE": [
        "Routine", "Complete", "Pregnancy test", "Micro albumin", "B.J. Protein",
        "24 Hrs. Urinary Protein", "24 Hrs. Urine electrolytes (Na/K/Ca)/Spot"
      ],
      "PROFILES": [
        "LFT I", "LFT II", "LFT III", "Lipid Profile", "Renal Function Tests (RFT) I",
        "RFT II", "Diabetic Profile - I", "Diabetic Profile - II", "Fever Profile-I",
        "Fever Profile-II", "ANC Profile", "Surgical Profile", "Sepsis Screen",
        "Hypertension Profile", "Iron Profile", "Master Health Checkup"
      ]
    },
    "Imaging Services": {
      "MRI (1.5 Tesla)": [
        "Brain", "Brain with contrast", "Brain with MRA", "Brain with MRV",
        "Intracranial", "Neck", "Tumour Protocol", "Epilepsy Protocol", "Stroke Protocol",
        "Posterior fossa / inner ear", "M.R. Angio - Intracranial/Neck", "M.R. Angio - Renal",
        "M.R. Angio - Peripheral", "M.R. Angio - Aorta", "M.R. Angio - Thoracic",
        "M.R. Angio - Abdominal", "Spine - Cervical", "Spine - Thoracic", "Spine - Lumbo-Sacral",
        "Spine with Survey", "Shoulder", "Elbow", "Wrist", "Hip", "Knee", "Ankle",
        "Body - Neck", "Body - Thorax", "Body - Pelvis", "Body - Breast", "Body - Abdomen",
        "Cardiac", "MRCP", "MR Spectroscopy", "MR Perfusion", "MR Tractography",
        "WHOLE BODY", "Functional MRI", "MR Neurography"
      ],
      "CT Scan (128 Slice)": [
        "Coronary Angiogram", "Post CABG/Stenting", "Calcium Scoring",
        "Brain Plain", "Brain contrast", "Stroke Protocol", "Orbit", "Temporal Bone",
        "Paranasal Sinuses", "Neck", "Chest", "HRCT Lungs", "Upper Abdomen",
        "Pelvis", "Whole Abdomen", "Spine", "Bony Pelvis", "3D", "Virtual Bronchoscopy",
        "Virtual Colonoscopy", "Cerebral Angio", "Pulmonary Angio", "Renal Angio",
        "Neck Angio", "Aortogram", "Peripheral Angio", "Dental", "Biopsy/Aspiration"
      ],
      "Ultrasound (3D/4D)": [
        "Complete Abdomen", "KUB", "Pelvis", "I Trimester - Confirmation",
        "I Trimester - Ectopic", "I Trimester - NT Scan", "II Trimester - Anomaly",
        "II Trimester - 3D/4D Images", "III Trimester - Bio Physical Profile",
        "III Trimester - Doppler", "Down's Screening", "Transvaginal US",
        "Transrectal US", "Ovulation Study", "4D Sonohysterosalphingography",
        "Shoulder", "Soft Tissues", "Infant hip", "Thyroid", "Breast", "Scrotum US",
        "Chest", "Orbit", "Parotid", "Neurosonogram", "Peripheral Vascular",
        "Carotid & Vertebral", "Portal", "Obstetric", "Renal", "Scrotum Doppler", "ECHO",
        "Guided Aspiration/Biopsy", "Amniocentesis", "CVS"
      ],
      "Other Imaging": [
        "Digital Mammogram with Ultrasound", "DEXA - BMD Scan"
      ]
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle investigation selection
  const toggleInvestigation = (investigation: string) => {
    setSelectedInvestigations(prev => 
      prev.includes(investigation)
        ? prev.filter(i => i !== investigation)
        : [...prev, investigation]
    );
  };

  // Toggle all investigations in a subcategory
  const toggleSubcategory = (subcategory: string, investigations: string[]) => {
    const allSelected = investigations.every(inv => selectedInvestigations.includes(inv));
    if (allSelected) {
      setSelectedInvestigations(prev => prev.filter(inv => !investigations.includes(inv)));
    } else {
      setSelectedInvestigations(prev => [...new Set([...prev, ...investigations])]);
    }
  };

  // Remove selected investigation
  const removeInvestigation = (investigation: string) => {
    setSelectedInvestigations(prev => prev.filter(i => i !== investigation));
  };

  // Debounced search for procedures
  useEffect(() => {
    if (procedureSearch.length < 2) { setProcedureResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("procedures").select("*").ilike("procedure_name", `%${procedureSearch}%`);
      setProcedureResults(data || []);
    };
    fetch();
    }, [procedureSearch]);

  // Debounced search for medications and requirements
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

  // Edit search effects
  useEffect(() => {
    if (editMedicationSearch.length < 2) { setEditMedicationResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editMedicationSearch}%`);
      setEditMedicationResults(data || []);
    };
    fetch();
  }, [editMedicationSearch]);

  useEffect(() => {
    if (editRequirementSearch.length < 2) { setEditRequirementResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editRequirementSearch}%`);
      setEditRequirementResults(data || []);
    };
    fetch();
  }, [editRequirementSearch]);

  
  // Debounced search for internal medications
  useEffect(() => {
    if (internalMedSearch.length < 2) { setInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${internalMedSearch}%`);
      setInternalMedResults(data || []);
    };
    fetch();
  }, [internalMedSearch]);

  // Edit search effects
  useEffect(() => {
    if (editProcedureSearch.length < 2) { setEditProcedureResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("procedures").select("*").ilike("procedure_name", `%${editProcedureSearch}%`);
      setEditProcedureResults(data || []);
    };
    fetch();
  }, [editProcedureSearch]);



  useEffect(() => {
    if (editInternalMedSearch.length < 2) { setEditInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editInternalMedSearch}%`);
      setEditInternalMedResults(data || []);
    };
    fetch();
  }, [editInternalMedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    // Ensure value is never null
    const safeValue = value === null || value === undefined ? "" : value;
    
    setFormData((prev: any) => {
      const updatedData = { ...prev, [id]: safeValue };
      
      // Auto-calculate BMI when height or weight changes
      if (id === 'height' || id === 'weight') {
        const height = id === 'height' ? safeValue : prev.height;
        const weight = id === 'weight' ? safeValue : prev.weight;
        
        if (height && weight) {
          const heightInMeters = parseFloat(height) / 100; // Convert cm to meters
          const weightInKg = parseFloat(weight);
          
          if (heightInMeters > 0 && weightInKg > 0) {
            const bmi = weightInKg / (heightInMeters * heightInMeters);
            updatedData.bmi = bmi.toFixed(1);
          } else {
            updatedData.bmi = "";
          }
        } else {
          updatedData.bmi = "";
        }
      }
      
      return updatedData;
    });
  };

  const handleSelectChange = (id: string, value: string) => {
    // Ensure value is never null
    const safeValue = value === null || value === undefined ? "" : value;
    setFormData((prev: any) => ({ ...prev, [id]: safeValue }));
  };

  // Add handlers for nested JSONB fields
  const handleGeneralExamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const safeValue = value === null || value === undefined ? "" : value;
    setFormData((prev: any) => ({
      ...prev,
      general_examination: {
        ...prev.general_examination,
        [id]: safeValue,
      },
    }));
  };
  const handleSystemicExamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const safeValue = value === null || value === undefined ? "" : value;
    setFormData((prev: any) => ({
      ...prev,
      systemic_examination: {
        ...prev.systemic_examination,
        [id]: safeValue,
      },
    }));
  };
  const handleDasavidhaChange = (id: string, value: string) => {
    const safeValue = value === null || value === undefined ? "" : value;
    setFormData((prev: any) => ({
      ...prev,
      dasavidha_pariksha: {
        ...prev.dasavidha_pariksha,
        [id]: safeValue,
      },
    }));
  };
  const handleAsthasthanaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const safeValue = value === null || value === undefined ? "" : value;
    setFormData((prev: any) => ({
      ...prev,
      asthasthana_pariksha: {
        ...prev.asthasthana_pariksha,
        [id]: safeValue,
      },
    }));
  };
  const handleSampraptiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const safeValue = value === null || value === undefined ? "" : value;
    setFormData((prev: any) => ({
      ...prev,
      sampraptighataka: {
        ...prev.sampraptighataka,
        [id]: safeValue,
      },
    }));
  };

  // Procedure handling functions
  const handleAddProcedure = () => {
    if (!selectedProcedure || !procedureQuantity || !procedureStartDate || !procedureEndDate) {
      toast({ title: "Missing Information", description: "Please fill all procedure details", variant: "destructive" });
      return;
    }

    const newProcedure = {
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

    setProcedures(prev => [...prev, newProcedure]);
    
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

  const handleRemoveProcedure = (idx: number) => {
    setProcedures(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddInternalMed = () => {
    if (!selectedInternalMed || !medicationDosage || !medicationFrequency || !medicationStartDate || !medicationEndDate) {
      toast({ title: "Missing Information", description: "Please fill all medication details", variant: "destructive" });
      return;
    }

    const newMedication = {
      medication: selectedInternalMed,
      dosage: medicationDosage,
      frequency: medicationFrequency,
      start_date: medicationStartDate,
      end_date: medicationEndDate,
      notes: medicationNotes
    };

    setInternalMedications(prev => [...prev, newMedication]);
    
    // Reset form
    setSelectedInternalMed(null);
    setMedicationDosage("");
    setMedicationFrequency("");
    setMedicationStartDate("");
    setMedicationEndDate("");
    setMedicationNotes("");
    setShowInternalMedAdd(false);
  };

  const handleRemoveInternalMed = (idx: number) => {
    setInternalMedications(prev => prev.filter((_, i) => i !== idx));
  };

  // Edit functions for procedures
  const handleEditProcedure = (idx: number) => {
    const proc = procedures[idx];
    setEditingProcedureIndex(idx);
    setEditSelectedProcedure(proc.procedure);
    setEditSelectedMedicines(proc.medicines || []);
    setEditSelectedRequirements(proc.requirements || []);
    setEditMedicinesString(proc.medicinesString || "");
    setEditRequirementsString(proc.requirementsString || "");
    setEditProcedureQuantity(proc.quantity);
    setEditProcedureStartDate(proc.start_date);
    setEditProcedureEndDate(proc.end_date);
    setEditProcedureTherapist(proc.therapist);
  };

  const handleSaveEditedProcedure = () => {
    if (!editSelectedProcedure || !editProcedureQuantity || !editProcedureStartDate || !editProcedureEndDate) {
      toast({ title: "Missing Information", description: "Please fill all procedure details", variant: "destructive" });
      return;
    }

    const updatedProcedure = {
      procedure: editSelectedProcedure,
      medicines: editSelectedMedicines,
      requirements: editSelectedRequirements,
      medicinesString: editMedicinesString,
      requirementsString: editRequirementsString,
      quantity: editProcedureQuantity,
      start_date: editProcedureStartDate,
      end_date: editProcedureEndDate,
      therapist: editProcedureTherapist
    };

    setProcedures(prev => prev.map((proc, i) => i === editingProcedureIndex ? updatedProcedure : proc));
    
    // Reset edit form
    setEditingProcedureIndex(null);
    setEditSelectedProcedure(null);
    setEditSelectedMedicines([]);
    setEditSelectedRequirements([]);
    setEditMedicinesString("");
    setEditRequirementsString("");
    setEditProcedureQuantity("");
    setEditProcedureStartDate("");
    setEditProcedureEndDate("");
    setEditProcedureTherapist("");
  };

  const handleCancelEditProcedure = () => {
    setEditingProcedureIndex(null);
    setEditSelectedProcedure(null);
    setEditSelectedMedicines([]);
    setEditSelectedRequirements([]);
    setEditMedicinesString("");
    setEditRequirementsString("");
    setEditProcedureQuantity("");
    setEditProcedureStartDate("");
    setEditProcedureEndDate("");
    setEditProcedureTherapist("");
  };

  // Helper functions for multiple medicines and requirements
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

  // Edit helper functions
  const addEditMedicine = (medicine: any) => {
    if (!editSelectedMedicines.find(m => m.id === medicine.id)) {
      setEditSelectedMedicines(prev => [...prev, medicine]);
      setEditMedicinesString(prev => prev ? `${prev}, ${medicine.product_name}` : medicine.product_name);
    }
  };

  const removeEditMedicine = (medicineId: number) => {
    setEditSelectedMedicines(prev => {
      const filtered = prev.filter(m => m.id !== medicineId);
      setEditMedicinesString(filtered.map(m => m.product_name).join(", "));
      return filtered;
    });
  };

  const addEditRequirement = (requirement: any) => {
    if (!editSelectedRequirements.find(r => r.id === requirement.id)) {
      setEditSelectedRequirements(prev => [...prev, requirement]);
      setEditRequirementsString(prev => prev ? `${prev}, ${requirement.product_name}` : requirement.product_name);
    }
  };

  const removeEditRequirement = (requirementId: number) => {
    setEditSelectedRequirements(prev => {
      const filtered = prev.filter(r => r.id !== requirementId);
      setEditRequirementsString(filtered.map(r => r.product_name).join(", "));
      return filtered;
    });
  };

  // Edit functions for internal medications
  const handleEditInternalMed = (idx: number) => {
    const med = internalMedications[idx];
    setEditingMedicationIndex(idx);
    setEditSelectedInternalMed(med.medication);
    setEditMedicationDosage(med.dosage);
    setEditMedicationFrequency(med.frequency);
    setEditMedicationStartDate(med.start_date);
    setEditMedicationEndDate(med.end_date);
    setEditMedicationNotes(med.notes);
  };

  const handleSaveEditedMedication = () => {
    if (!editSelectedInternalMed || !editMedicationDosage || !editMedicationFrequency || !editMedicationStartDate || !editMedicationEndDate) {
      toast({ title: "Missing Information", description: "Please fill all medication details", variant: "destructive" });
      return;
    }

    const updatedMedication = {
      medication: editSelectedInternalMed,
      dosage: editMedicationDosage,
      frequency: editMedicationFrequency,
      start_date: editMedicationStartDate,
      end_date: editMedicationEndDate,
      notes: editMedicationNotes
    };

    setInternalMedications(prev => prev.map((med, i) => i === editingMedicationIndex ? updatedMedication : med));
    
    // Reset edit form
    setEditingMedicationIndex(null);
    setEditSelectedInternalMed(null);
    setEditMedicationDosage("");
    setEditMedicationFrequency("");
    setEditMedicationStartDate("");
    setEditMedicationEndDate("");
    setEditMedicationNotes("");
  };

  const handleCancelEditMedication = () => {
    setEditingMedicationIndex(null);
    setEditSelectedInternalMed(null);
    setEditMedicationDosage("");
    setEditMedicationFrequency("");
    setEditMedicationStartDate("");
    setEditMedicationEndDate("");
    setEditMedicationNotes("");
  };

  // Request Requirements function for procedures
  const handleRequestRequirements = async (idx: number) => {
    const procedure = procedures[idx];
    if (!procedure || !ipdNo) {
      toast({
        title: "Error",
        description: "Unable to request requirements for this procedure",
        variant: "destructive",
      });
      return;
    }

    try {
      // Combine medicines and requirements
      const medicinesString = procedure.medicinesString || "";
      const requirementsString = procedure.requirementsString || "";
      
      // Create combined string with both medicines and requirements
      let combinedRequirements = "";
      if (medicinesString && requirementsString) {
        combinedRequirements = `${medicinesString}, ${requirementsString}`;
      } else if (medicinesString) {
        combinedRequirements = medicinesString;
      } else if (requirementsString) {
        combinedRequirements = requirementsString;
      }

      console.log('🔍 Combined requirements for request:', combinedRequirements);

      // Only create the procedure medicine requirement request (no main table insertion)
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          ipd_no: ipdNo,
          procedure_entry_id: null, // Will be set when case sheet is saved
          requirements: combinedRequirements,
          quantity: procedure.quantity || null,
          requested_by: doctorId,
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

  // Request Requirements function for saved procedures
  const handleRequestRequirementsFromSaved = async (savedProcedure: any) => {
    if (!savedProcedure || !ipdNo) {
      toast({
        title: "Error",
        description: "Unable to request requirements for this procedure",
        variant: "destructive",
      });
      return;
    }

    try {
      // Combine medicines and requirements for saved procedures
      const medicinesString = savedProcedure.medicinesString || "";
      const requirementsString = savedProcedure.requirementsString || "";
      
      // Create combined string with both medicines and requirements
      let combinedRequirements = "";
      if (medicinesString && requirementsString) {
        combinedRequirements = `${medicinesString}, ${requirementsString}`;
      } else if (medicinesString) {
        combinedRequirements = medicinesString;
      } else if (requirementsString) {
        combinedRequirements = requirementsString;
      }

      console.log('🔍 Combined requirements for saved procedure request:', combinedRequirements);

      // First, check if a procedure entry already exists for this IPD and procedure
      let procedureEntryId = null;
      
      // Try to find existing procedure entry
      const { data: existingProcedure, error: findError } = await supabase
        .from("procedure_entries")
        .select("id")
        .eq("ipd_no", ipdNo)
        .eq("procedure_name", savedProcedure.procedure?.procedure_name || "Procedure Requirements Request")
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error finding existing procedure entry:", findError);
        throw findError;
      }

      if (existingProcedure) {
        // Use existing procedure entry
        procedureEntryId = existingProcedure.id;
        console.log('🔍 Using existing procedure entry with ID:', procedureEntryId);
      } else {
        // Create new procedure entry only if one doesn't exist
        console.log('🔍 Creating new procedure entry for saved procedure...');
        const { data: procedureData, error: procedureError } = await supabase
          .from("procedure_entries")
          .insert({
            ipd_no: ipdNo,
            opd_no: null,
            procedure_name: savedProcedure.procedure?.procedure_name || "Procedure Requirements Request",
            requirements: combinedRequirements,
            quantity: savedProcedure.quantity || null,
            start_date: new Date().toISOString().split('T')[0],
            end_date: savedProcedure.end_date || null,
            therapist: savedProcedure.therapist || null,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (procedureError) {
          console.error("Procedure insert error:", procedureError);
          throw procedureError;
        }

        procedureEntryId = procedureData.id;
        console.log('🔍 Created new procedure entry with ID:', procedureEntryId);
      }

      // Create the procedure medicine requirement request
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          ipd_no: ipdNo,
          procedure_entry_id: procedureEntryId,
          requirements: combinedRequirements,
          quantity: savedProcedure.quantity || null,
          requested_by: doctorId,
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

  // Request Medication function
  const handleRequestMedication = async (medication: any) => {
    if (!medication || !ipdNo) {
      toast({
        title: "Error",
        description: "Unable to request medication",
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
            prescribed_by: doctorId,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { id, doctor_name, ...dataToSave } = formData; // Remove doctor_name from data sent to Supabase
      
      // Add investigations to form data
      dataToSave.investigations = selectedInvestigations.join(", ");
      
      // Handle date fields - convert empty strings to null for database
      if (!dataToSave.admission_at || dataToSave.admission_at === "") {
        dataToSave.admission_at = null;
      } else if (dataToSave.admission_at) {
        try {
          // Convert datetime-local format to ISO string for database
          const admissionDate = new Date(dataToSave.admission_at);
          if (isNaN(admissionDate.getTime())) {
            console.warn("Invalid admission date:", dataToSave.admission_at);
            dataToSave.admission_at = null;
          } else {
            dataToSave.admission_at = admissionDate.toISOString();
          }
        } catch (error) {
          console.error("Error parsing admission date:", error);
          dataToSave.admission_at = null;
        }
      }
      
      if (!dataToSave.discharge_at || dataToSave.discharge_at === "") {
        dataToSave.discharge_at = null;
      } else if (dataToSave.discharge_at) {
        try {
          // Convert datetime-local format to ISO string for database
          const dischargeDate = new Date(dataToSave.discharge_at);
          if (isNaN(dischargeDate.getTime())) {
            console.warn("Invalid discharge date:", dataToSave.discharge_at);
            dataToSave.discharge_at = null;
          } else {
            dataToSave.discharge_at = dischargeDate.toISOString();
          }
        } catch (error) {
          console.error("Error parsing discharge date:", error);
          dataToSave.discharge_at = null;
        }
      }
      // Ensure key identifiers are present even if initialCaseSheet missed them
      if (!dataToSave.ipd_no) dataToSave.ipd_no = ipdNo || dataToSave.ip_no || null;
      if (!dataToSave.ip_no) dataToSave.ip_no = ipdNo || null;
      if (!dataToSave.opd_no) dataToSave.opd_no = opdNo || null;
      if (!dataToSave.uhid) dataToSave.uhid = patientUhId || null;
      if (!dataToSave.patient_name) dataToSave.patient_name = patientName || null;

      // Whitelist only columns that exist in public.ipd_case_sheets
      const allowedKeys = [
        "ipd_no","opd_no","doctor_id","department","ward","bed_no",
        "admission_at","discharge_at","doa_time","dod_time","op_no","ip_no",
        "age","gender","occupation","address","contact","present_complaints",
        "associated_complaints","past_history","personal_history","obs_gyn_history",
        "previous_medicine_history","family_history","general_examination",
        "dasavidha_pariksha","asthasthana_pariksha","systemic_examination",
        "local_examination","sampraptighataka","pain_assessment","investigations",
        "diagnosis","nutritional_status","treatment_plan","preventive_aspects",
        "rehabilitation","desired_outcome","height","weight","bmi","pulse","rr",
        "bp","respiratory_system","cvs","cns","patient_name","uhid"
      ];
      const payload: any = {};
      for (const key of allowedKeys) {
        if (key in dataToSave) {
          payload[key] = (dataToSave as any)[key];
        }
      }
      // Type/constraint normalizations
      payload.age = payload.age ? Number(payload.age) : null;
      const allowedGenders = ["Male","Female","Other"];
      if (payload.gender && !allowedGenders.includes(payload.gender)) {
        payload.gender = null;
      }
      const allowedNutrition = [
        "normal","mild malnutrition","moderate malnutrition","severe malnutrition"
      ];
      if (payload.nutritional_status && !allowedNutrition.includes(payload.nutritional_status)) {
        payload.nutritional_status = "normal";
      }
      
      console.log("IPD payload to save:", payload);
      
      let caseSheetId = null;
      
      if (initialCaseSheet && initialCaseSheet.id) {
        // Update existing IPD case sheet
        const { data: updateData, error: updateError } = await supabase
          .from("ipd_case_sheets")
          .update({
            ...payload,
            general_examination: payload.general_examination || null,
            dasavidha_pariksha: payload.dasavidha_pariksha || null,
            asthasthana_pariksha: payload.asthasthana_pariksha || null,
            systemic_examination: payload.systemic_examination || null,
            sampraptighataka: payload.sampraptighataka || null,
          })
          .eq("id", initialCaseSheet.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("IPD case sheet update error:", {
            message: (updateError as any).message,
            details: (updateError as any).details,
            hint: (updateError as any).hint,
            code: (updateError as any).code,
          });
          throw updateError;
        }
        caseSheetId = updateData.id;
      } else {
        // Insert new IPD case sheet
        const { data: insertData, error: insertError } = await supabase
          .from("ipd_case_sheets")
          .insert([
            {
              ...payload,
              general_examination: payload.general_examination || null,
              dasavidha_pariksha: payload.dasavidha_pariksha || null,
              asthasthana_pariksha: payload.asthasthana_pariksha || null,
              systemic_examination: payload.systemic_examination || null,
              sampraptighataka: payload.sampraptighataka || null,
            },
          ])
          .select()
          .single();
        
        if (insertError) {
          console.error("IPD case sheet insert error:", {
            message: (insertError as any).message,
            details: (insertError as any).details,
            hint: (insertError as any).hint,
            code: (insertError as any).code,
          });
          throw insertError;
        }
        caseSheetId = insertData.id;
      }

      // Handle procedures - update existing, insert new, delete removed
      if (initialCaseSheet && initialCaseSheet.id) {
        // For existing case sheets, we need to handle updates properly
        
        // Get existing procedures for this IPD
        const { data: existingProcedures } = await supabase
          .from('procedure_entries')
          .select('id, procedure_name')
          .eq('ipd_no', ipdNo);

        // Get existing medications for this IPD
        const { data: existingMedications } = await supabase
          .from('internal_medications')
          .select('id, medication_name')
          .eq('ipd_no', ipdNo);

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
                prescribed_by: doctorId
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
                prescribed_by: doctorId,
                created_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error("Error inserting medication:", insertError);
            }
          }
        }
      } else {
        // For new case sheets, just insert everything
        
        // Save procedures
        if (procedures.length > 0) {
          console.log("Saving procedures with ipd_no:", ipdNo);
          console.log("Procedures to save:", procedures);
          
          const procedureEntries = procedures
            .filter(proc => proc.procedure && proc.procedure.procedure_name)
            .map(proc => {
              // Combine medicines and requirements for database storage
              const medicinesString = proc.medicinesString || "";
              const requirementsString = proc.requirementsString || "";
              
              // Create combined string with both medicines and requirements
              let combinedRequirements = "";
              if (medicinesString && requirementsString) {
                combinedRequirements = `${medicinesString}, ${requirementsString}`;
              } else if (medicinesString) {
                combinedRequirements = medicinesString;
              } else if (requirementsString) {
                combinedRequirements = requirementsString;
              }

              console.log('🔍 Saving procedure with combined requirements:', combinedRequirements);

              return {
                ipd_no: ipdNo,
                procedure_name: proc.procedure.procedure_name,
                requirements: combinedRequirements,
                quantity: proc.quantity,
                start_date: proc.start_date || null,
                end_date: proc.end_date || null,
                therapist: proc.therapist,
                created_at: new Date().toISOString()
              };
            });

          console.log("Procedure entries to insert:", procedureEntries);

          if (procedureEntries.length > 0) {
            const { data: procedureData, error: procedureError } = await supabase
              .from("procedure_entries")
              .insert(procedureEntries)
              .select();

            if (procedureError) {
              console.error("Error saving procedures:", procedureError);
              console.error("Error details:", {
                message: procedureError.message,
                details: procedureError.details,
                hint: procedureError.hint,
                code: procedureError.code
              });
              toast({ title: "Warning", description: "Case sheet saved but procedures failed to save", variant: "destructive" });
            } else {
              console.log("Procedures saved successfully:", procedureData);
            }
          }
        }

        // Save internal medications
        if (internalMedications.length > 0) {
          console.log("Saving medications with ipd_no:", ipdNo);
          console.log("Medications to save:", internalMedications);
          
          const medicationEntries = internalMedications
            .filter(med => med.medication && med.medication.product_name)
            .map(med => ({
              ipd_no: ipdNo,
              medication_name: med.medication.product_name,
              dosage: med.dosage,
              frequency: med.frequency,
              start_date: med.start_date || null,
              end_date: med.end_date || null,
              notes: med.notes,
              prescribed_by: doctorId,
              created_at: new Date().toISOString()
            }));

          console.log("Medication entries to insert:", medicationEntries);

          if (medicationEntries.length > 0) {
            const { data: medicationData, error: medicationError } = await supabase
              .from("internal_medications")
              .insert(medicationEntries)
              .select();

            if (medicationError) {
              console.error("Error saving medications:", medicationError);
              console.error("Medication error details:", {
                message: medicationError.message,
                details: medicationError.details,
                hint: medicationError.hint,
                code: medicationError.code
              });
              toast({ title: "Warning", description: "Case sheet saved but medications failed to save", variant: "destructive" });
            } else {
              console.log("Medications saved successfully:", medicationData);
            }
          }
        }
      }

      toast({ 
        title: initialCaseSheet ? "IPD Case Sheet Updated" : "IPD Case Sheet Created", 
        description: initialCaseSheet ? "IPD case sheet updated successfully." : "IPD case sheet saved successfully." 
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      console.error("Error saving case sheet:", error);
      if (error && typeof error === "object") {
        const { message, details, hint, code } = error as { message?: string; details?: string; hint?: string; code?: string };
        console.error("Case sheet save error details:", { message, details, hint, code });
      }
      toast({ 
        title: initialCaseSheet ? "IPD Case Sheet Update Failed" : "IPD Case Sheet Creation Failed", 
        description: (error && (error.message || error.details)) || "Unknown error", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialCaseSheet ? "Edit IPD Case Sheet" : "Create New IPD Case Sheet"}</CardTitle>
        <CardDescription>
          {initialCaseSheet
            ? `Editing IPD case sheet for UHID: ${formData.uhid}`
            : "Fill out the form below to create a new IPD case sheet."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="uhid">Patient UHID</Label>
            <Input id="uhid" value={patientUhId || formData.uhid || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="patient_name">Patient Name</Label>
            <Input id="patient_name" value={patientName || formData.patient_name || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ip_no">IPD No</Label>
            <Input id="ip_no" value={ipdNo || formData.ip_no || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctor_id">Doctor ID</Label>
            <Input id="doctor_id" value={formData.doctor_id} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctor_name">Doctor Name</Label>
            <Input id="doctor_name" value={formData.doctor_name || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={formData.department} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ward">Ward</Label>
            <Input id="ward" value={formData.ward} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bed_no">Bed No</Label>
            <Input id="bed_no" value={formData.bed_no} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="admission_at">Admission Date</Label>
            <Input id="admission_at" type="datetime-local" value={formData.admission_at} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="discharge_at">Discharge Date</Label>
            <Input id="discharge_at" type="datetime-local" value={formData.discharge_at} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doa_time">DOA Time</Label>
            <Input id="doa_time" value={formData.doa_time} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dod_time">DOD Time</Label>
            <Input id="dod_time" value={formData.dod_time} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="op_no">OPD No</Label>
            <Input id="op_no" value={formData.op_no} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" value={formData.age} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={v => handleSelectChange("gender", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" value={formData.occupation} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" value={formData.contact} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="present_complaints">Present Complaints</Label>
            <Textarea id="present_complaints" value={formData.present_complaints} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="associated_complaints">Associated Complaints</Label>
            <Textarea id="associated_complaints" value={formData.associated_complaints} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="past_history">Past History</Label>
            <Textarea id="past_history" value={formData.past_history} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="personal_history">Personal History</Label>
            <Textarea id="personal_history" value={formData.personal_history} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="obs_gyn_history">Obs/Gyn History</Label>
            <Textarea id="obs_gyn_history" value={formData.obs_gyn_history} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="previous_medicine_history">Previous Medicine History</Label>
            <Textarea id="previous_medicine_history" value={formData.previous_medicine_history} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="family_history">Family History</Label>
            <Textarea id="family_history" value={formData.family_history} onChange={handleChange} />
          </div>
          {/* Add sections for general_examination, dasavidha_pariksha, asthasthana_pariksha, systemic_examination, sampraptighataka as needed */}
          {/* Individual Examination Fields */}
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">General Examination</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              <Input id="height" placeholder="Height (cm)" value={formData.height || ""} onChange={handleChange} />
                <Input id="weight" placeholder="Weight (kg)" value={formData.weight || ""} onChange={handleChange} />
                <Input id="bmi" placeholder="BMI" value={formData.bmi || ""} readOnly />
              <Input id="pulse" placeholder="Pulse" value={formData.pulse || ""} onChange={handleChange} />
              <Input id="rr" placeholder="RR" value={formData.rr || ""} onChange={handleChange} />
              <Input id="bp" placeholder="BP" value={formData.bp || ""} onChange={handleChange} />
            </div>
          </div>
          
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">Systemic Examination</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input id="respiratory_system" placeholder="Respiratory System" value={formData.respiratory_system || ""} onChange={handleChange} />
              <Input id="cvs" placeholder="CVS" value={formData.cvs || ""} onChange={handleChange} />
              <Input id="cns" placeholder="CNS" value={formData.cns || ""} onChange={handleChange} />
            </div>
          </div>

          
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">Pariksha - Dasavidha Pariksha</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Select value={formData.dasavidha_pariksha?.Prakriti || ""} onValueChange={v => handleDasavidhaChange("Prakriti", v)}>
                <SelectTrigger><SelectValue placeholder="Prakriti" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vata">Vata</SelectItem>
                  <SelectItem value="Pitta">Pitta</SelectItem>
                  <SelectItem value="Kapha">Kapha</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Vikruti || ""} onValueChange={v => handleDasavidhaChange("Vikruti", v)}>
                <SelectTrigger><SelectValue placeholder="Vikruti" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vata">Vata</SelectItem>
                  <SelectItem value="Pitta">Pitta</SelectItem>
                  <SelectItem value="Kapha">Kapha</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Sara || ""} onValueChange={v => handleDasavidhaChange("Sara", v)}>
                <SelectTrigger><SelectValue placeholder="Sara" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttam">Uttam</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Samhanana || ""} onValueChange={v => handleDasavidhaChange("Samhanana", v)}>
                <SelectTrigger><SelectValue placeholder="Samhanana" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttam">Uttam</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Pramana || ""} onValueChange={v => handleDasavidhaChange("Pramana", v)}>
                <SelectTrigger><SelectValue placeholder="Pramana" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttam">Uttam</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Satmya || ""} onValueChange={v => handleDasavidhaChange("Satmya", v)}>
                <SelectTrigger><SelectValue placeholder="Satmya" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttam">Uttam</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Satva || ""} onValueChange={v => handleDasavidhaChange("Satva", v)}>
                <SelectTrigger><SelectValue placeholder="Satva" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttam">Uttam</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.AharaShakti || ""} onValueChange={v => handleDasavidhaChange("AharaShakti", v)}>
                <SelectTrigger><SelectValue placeholder="Ahara Shakti" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pravara">Pravara</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.VyayamShakti || ""} onValueChange={v => handleDasavidhaChange("VyayamShakti", v)}>
                <SelectTrigger><SelectValue placeholder="Vyayam Shakti" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pravara">Pravara</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.dasavidha_pariksha?.Vaya || ""} onValueChange={v => handleDasavidhaChange("Vaya", v)}>
                <SelectTrigger><SelectValue placeholder="Vaya" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uttam">Uttam</SelectItem>
                  <SelectItem value="Madhyam">Madhyam</SelectItem>
                  <SelectItem value="Avara">Avara</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">Pariksha - Asthasthana Pariksha</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Input id="Nadi" placeholder="Nadi (Vataja/Pittaja/Kaphaja)" value={formData.asthasthana_pariksha?.Nadi || ""} onChange={handleAsthasthanaChange} />
              <Input id="Mootra" placeholder="Mootra (e.g. 4-5 times/day, Prakruta/Aprakruta)" value={formData.asthasthana_pariksha?.Mootra || ""} onChange={handleAsthasthanaChange} />
              <Input id="Mala" placeholder="Mala (Prakruta/Aprakruta)" value={formData.asthasthana_pariksha?.Mala || ""} onChange={handleAsthasthanaChange} />
              <Input id="Jivha" placeholder="Jivha (Leepthata/Aleepthata)" value={formData.asthasthana_pariksha?.Jivha || ""} onChange={handleAsthasthanaChange} />
              <Input id="Shabda" placeholder="Shabda (Prakruta/Aprakruta)" value={formData.asthasthana_pariksha?.Shabda || ""} onChange={handleAsthasthanaChange} />
              <Input id="Sparsha" placeholder="Sparsha (Anushanasheeta)" value={formData.asthasthana_pariksha?.Sparsha || ""} onChange={handleAsthasthanaChange} />
              <Input id="Drika" placeholder="Drika (Prakruta/Aprakruta)" value={formData.asthasthana_pariksha?.Drika || ""} onChange={handleAsthasthanaChange} />
              <Input id="Akruti" placeholder="Akruti (Madhyama)" value={formData.asthasthana_pariksha?.Akruti || ""} onChange={handleAsthasthanaChange} />
            </div>
          </div>
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">Systemic Examination</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Input id="RespiratorySystem" placeholder="Respiratory System" value={formData.systemic_examination?.RespiratorySystem || ""} onChange={handleSystemicExamChange} />
              <Input id="CVS" placeholder="CVS" value={formData.systemic_examination?.CVS || ""} onChange={handleSystemicExamChange} />
                              <Input id="CNS" placeholder="CNS" value={formData.systemic_examination?.CNS || ""} onChange={handleSystemicExamChange} />
            </div>
          </div>
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">Sampraptighataka</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Input id="Dosha" placeholder="Dosha" value={formData.sampraptighataka?.Dosha || ""} onChange={handleSampraptiChange} />
              <Input id="SrothoDushti" placeholder="Srotho dushti" value={formData.sampraptighataka?.SrothoDushti || ""} onChange={handleSampraptiChange} />
              <Input id="Vyaktasthana" placeholder="Vyaktasthana" value={formData.sampraptighataka?.Vyaktasthana || ""} onChange={handleSampraptiChange} />
              <Input id="Dushya" placeholder="Dushya" value={formData.sampraptighataka?.Dushya || ""} onChange={handleSampraptiChange} />
              <Input id="Udhabavasthana" placeholder="Udhabavasthana" value={formData.sampraptighataka?.Udhabavasthana || ""} onChange={handleSampraptiChange} />
              <Input id="Vyadibheda" placeholder="Vyadibheda" value={formData.sampraptighataka?.Vyadibheda || ""} onChange={handleSampraptiChange} />
              <Input id="Srothas" placeholder="Srothas" value={formData.sampraptighataka?.Srothas || ""} onChange={handleSampraptiChange} />
              <Input id="Sancharastana" placeholder="Sancharastana" value={formData.sampraptighataka?.Sancharastana || ""} onChange={handleSampraptiChange} />
              <Input id="Sadhyaasadhyatha" placeholder="Sadhyaasadhyatha" value={formData.sampraptighataka?.Sadhyaasadhyatha || ""} onChange={handleSampraptiChange} />
            </div>
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="local_examination">Local Examination</Label>
            <Textarea id="local_examination" value={formData.local_examination} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="pain_assessment">Pain Assessment</Label>
            <Textarea id="pain_assessment" value={formData.pain_assessment} onChange={handleChange} />
          </div>

          {/* Investigations Section */}
          <div className="col-span-full border rounded p-4 mb-4">
            <Label className="font-bold mb-2">Investigations</Label>
            <div className="space-y-4">
              {/* Selected Investigations */}
              {selectedInvestigations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedInvestigations.map((investigation, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {investigation}
                      <button
                        type="button"
                        onClick={() => removeInvestigation(investigation)}
                        className="ml-1 hover:text-red-500"
                       
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Investigation Categories */}
              <div className="space-y-2">
                {Object.entries(diagnosticServices).map(([category, subcategories]) => (
                  <Collapsible key={category}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto"
                        onClick={() => toggleCategory(category)}
                       
                      >
                        <span className="font-medium">{category}</span>
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-2">
                      {Object.entries(subcategories).map(([subcategory, investigations]) => (
                        <div key={subcategory} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubcategory(subcategory, investigations)}
                              className="text-sm font-medium"
                             
                            >
                              {subcategory}
                            </Button>
                            <Checkbox
                              checked={investigations.every(inv => selectedInvestigations.includes(inv))}
                              onCheckedChange={() => toggleSubcategory(subcategory, investigations)}
                             
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 pl-4">
                            {investigations.map((investigation) => (
                              <div key={investigation} className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedInvestigations.includes(investigation)}
                                  onCheckedChange={() => toggleInvestigation(investigation)}
                                 
                                />
                                <Label className="text-sm">{investigation}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea id="diagnosis" value={formData.diagnosis} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nutritional_status">Nutritional Status</Label>
            <Select value={formData.nutritional_status} onValueChange={v => handleSelectChange("nutritional_status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="mild malnutrition">Mild Malnutrition</SelectItem>
                <SelectItem value="moderate malnutrition">Moderate Malnutrition</SelectItem>
                <SelectItem value="severe malnutrition">Severe Malnutrition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Procedures Section */}
          <div className="col-span-full border rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-bold">Procedures</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProcedureAdd(!showProcedureAdd)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Procedure
              </Button>
            </div>

            {/* Show saved procedures for existing case sheets */}
            {savedProcedures.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label className="text-sm font-medium text-gray-600">Previously Saved Procedures:</Label>
                {savedProcedures.map((proc, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">{proc.procedure.procedure_name}</div>
                      <div className="text-sm text-gray-600">
                        {proc.requirementsString && <span>Medicines & Requirements: {proc.requirementsString}</span>}
                        <span className="ml-2">Quantity: {proc.quantity}</span>
                        <span className="ml-2">Duration: {proc.start_date} to {proc.end_date}</span>
                        {proc.therapist && <span className="ml-2">Therapist: {proc.therapist}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRequestRequirementsFromSaved(proc)}
                      >
                        Request Requirements
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Current procedures for new case sheets */}
            {procedures.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label className="text-sm font-medium text-gray-600">Current Procedures:</Label>
                {procedures.map((proc, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">{proc.procedure.procedure_name}</div>
                      <div className="text-sm text-gray-600">
                        {proc.medicinesString && <span>Medicines: {proc.medicinesString}</span>}
                        {proc.requirementsString && <span className="ml-2">Requirements: {proc.requirementsString}</span>}
                        <span className="ml-2">Quantity: {proc.quantity}</span>
                        <span className="ml-2">Duration: {proc.start_date} to {proc.end_date}</span>
                        {proc.therapist && <span className="ml-2">Therapist: {proc.therapist}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProcedure(idx)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRequestRequirements(idx)}
                      >
                        Request Requirements
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProcedure(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                    Add Procedure
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProcedureAdd(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Edit Procedure Form */}
            {editingProcedureIndex !== null && (
              <div className="p-4 bg-yellow-50 rounded border space-y-4">
                <Label className="font-medium">Edit Procedure</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Procedure</Label>
                    <Input
                      placeholder="Search procedures..."
                      value={editProcedureSearch || ""}
                      onChange={(e) => setEditProcedureSearch(e.target.value || "")}
                    />
                    {editProcedureResults.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                        {editProcedureResults.map((proc) => (
                          <div
                            key={proc.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setEditSelectedProcedure(proc);
                              setEditProcedureSearch("");
                              setEditProcedureResults([]);
                            }}
                          >
                            {proc.procedure_name}
                          </div>
                        ))}
                      </div>
                    )}
                    {editSelectedProcedure && (
                      <div className="mt-2 p-2 bg-blue-100 rounded">
                        Selected: {editSelectedProcedure.procedure_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Medicines (Optional)</Label>
                    <Input
                      placeholder="Search medicines..."
                      value={editMedicationSearch || ""}
                      onChange={(e) => setEditMedicationSearch(e.target.value || "")}
                    />
                    {editMedicationResults.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                        {editMedicationResults.map((med) => (
                          <div
                            key={med.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              addEditMedicine(med);
                              setEditMedicationSearch("");
                              setEditMedicationResults([]);
                            }}
                          >
                            {med.product_name}
                          </div>
                        ))}
                      </div>
                    )}
                    {editSelectedMedicines.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <Label className="text-sm font-medium">Selected Medicines:</Label>
                        {editSelectedMedicines.map((med) => (
                          <div key={med.id} className="flex items-center justify-between p-2 bg-blue-100 rounded">
                            <span className="text-sm">{med.product_name}</span>
                            <button
                              type="button"
                              onClick={() => removeEditMedicine(med.id)}
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
                      value={editRequirementSearch || ""}
                      onChange={(e) => setEditRequirementSearch(e.target.value || "")}
                    />
                    {editRequirementResults.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                        {editRequirementResults.map((req) => (
                          <div
                            key={req.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              addEditRequirement(req);
                              setEditRequirementSearch("");
                              setEditRequirementResults([]);
                            }}
                          >
                            {req.product_name}
                          </div>
                        ))}
                      </div>
                    )}
                    {editSelectedRequirements.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <Label className="text-sm font-medium">Selected Requirements:</Label>
                        {editSelectedRequirements.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-2 bg-green-100 rounded">
                            <span className="text-sm">{req.product_name}</span>
                            <button
                              type="button"
                              onClick={() => removeEditRequirement(req.id)}
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
                      value={editProcedureQuantity}
                      onChange={(e) => setEditProcedureQuantity(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={editProcedureStartDate}
                      onChange={(e) => setEditProcedureStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={editProcedureEndDate}
                      onChange={(e) => setEditProcedureEndDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Therapist</Label>
                    <Input
                      placeholder="Therapist name"
                      value={editProcedureTherapist}
                      onChange={(e) => setEditProcedureTherapist(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleSaveEditedProcedure}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEditProcedure}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Internal Medications Section */}
          <div className="col-span-full border rounded p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="font-bold">Internal Medications</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInternalMedAdd(!showInternalMedAdd)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>

            {/* Show saved medications for existing case sheets */}
            {savedMedications.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label className="text-sm font-medium text-gray-600">Previously Saved Medications:</Label>
                {savedMedications.map((med, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">{med.medication.product_name}</div>
                      <div className="text-sm text-gray-600">
                        <span>Dosage: {med.dosage}</span>
                        <span className="ml-2">Frequency: {med.frequency}</span>
                        <span className="ml-2">Duration: {med.start_date} to {med.end_date}</span>
                        {med.notes && <span className="ml-2">Notes: {med.notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRequestMedication(med)}
                      >
                        Request Medication
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Current medications for new case sheets */}
            {internalMedications.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label className="text-sm font-medium text-gray-600">Current Medications:</Label>
                {internalMedications.map((med, idx) => (
                  <div key={idx} className="p-3 bg-green-50 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">{med.medication.product_name}</div>
                      <div className="text-sm text-gray-600">
                        <span>Dosage: {med.dosage}</span>
                        <span className="ml-2">Frequency: {med.frequency}</span>
                        <span className="ml-2">Duration: {med.start_date} to {med.end_date}</span>
                        {med.notes && <span className="ml-2">Notes: {med.notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInternalMed(idx)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRequestMedication(med)}
                      >
                        Request Medication
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveInternalMed(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                    Add Medication
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInternalMedAdd(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Edit Medication Form */}
            {editingMedicationIndex !== null && (
              <div className="p-4 bg-yellow-50 rounded border space-y-4">
                <Label className="font-medium">Edit Medication</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Medication</Label>
                    <Input
                      placeholder="Search medications..."
                      value={editInternalMedSearch}
                      onChange={(e) => setEditInternalMedSearch(e.target.value)}
                    />
                    {editInternalMedResults.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto border rounded">
                        {editInternalMedResults.map((med) => (
                          <div
                            key={med.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setEditSelectedInternalMed(med);
                              setEditInternalMedSearch("");
                              setEditInternalMedResults([]);
                            }}
                          >
                            {med.product_name}
                          </div>
                        ))}
                      </div>
                    )}
                    {editSelectedInternalMed && (
                      <div className="mt-2 p-2 bg-blue-100 rounded">
                        Selected: {editSelectedInternalMed.product_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Dosage</Label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={editMedicationDosage}
                      onChange={(e) => setEditMedicationDosage(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Frequency</Label>
                    <Input
                      placeholder="e.g., twice daily"
                      value={editMedicationFrequency}
                      onChange={(e) => setEditMedicationFrequency(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={editMedicationStartDate}
                      onChange={(e) => setEditMedicationStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={editMedicationEndDate}
                      onChange={(e) => setEditMedicationEndDate(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={editMedicationNotes}
                      onChange={(e) => setEditMedicationNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleSaveEditedMedication}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEditMedication}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2 col-span-full">
            <Label htmlFor="treatment_plan">Treatment Plan</Label>
            <Textarea id="treatment_plan" value={formData.treatment_plan} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="preventive_aspects">Preventive Aspects</Label>
            <Textarea id="preventive_aspects" value={formData.preventive_aspects} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="rehabilitation">Rehabilitation</Label>
            <Textarea id="rehabilitation" value={formData.rehabilitation} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="desired_outcome">Desired Outcome</Label>
            <Textarea id="desired_outcome" value={formData.desired_outcome} onChange={handleChange} />
          </div>





          <div className="col-span-full flex justify-end gap-4">
            {initialCaseSheet && (
              <PrintableIpdCaseSheet 
                data={{
                  ...formData,
                  procedures: savedProcedures,
                  internal_medications: savedMedications,
                  investigations: selectedInvestigations.join(", ")
                }} 
              />
            )}
            <Button type="submit" disabled={loading}>{initialCaseSheet ? "Update IPD Case Sheet" : "Add IPD Case Sheet"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
