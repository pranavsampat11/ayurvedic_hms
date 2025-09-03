"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"
import { type CaseSheet, type Patient, addCaseSheet } from "@/lib/data"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { getDummyProcedures, buildSeedProcedures, buildSeedMedications } from "@/lib/dummy"


interface CaseSheetFormProps {
  initialCaseSheet?: CaseSheet // For editing an existing case sheet
  patientUhId?: string // For creating a new case sheet for a specific patient
  opNo?: string
  doctorId?: string
  doctorName?: string
  patientName?: string
  age?: number | string
  gender?: string
  contact?: string
  address?: string
  department?: string
  onSave?: () => void // Callback after saving
}

export default function CaseSheetForm({ initialCaseSheet, patientUhId, opNo, doctorId, doctorName, patientName, age, gender, contact, address, department, onSave }: CaseSheetFormProps) {
  const [formData, setFormData] = useState<any>(
    initialCaseSheet || {
      doctor_id: doctorId || "",
      opd_no: opNo || "",
      patient_name: patientName || "",
      age: age || "",
      gender: gender || "Male",
      contact: contact || "",
      address: address || "",
      doctor: doctorName || "",
      department: department || "",
      chief_complaints: "",
      associated_complaints: "",
      past_history: "",
      personal_history: "",
      allergy_history: "",
      family_history: "",
      obs_gyn_history: "",
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
      local_examination: "",
      pain_assessment: "",
      investigations: "",
      diagnosis: "",
      nutritional_status: "normal",
      treatment_plan: "",
      preventive_aspects: "",
      rehabilitation: "",
      desired_outcome: "",
      OPD_NEXT_FOLLOW_UP: "",
    }
  )

  // Load examination data from Supabase when initialCaseSheet is provided
  useEffect(() => {
    if (initialCaseSheet) {
      console.log("Initial case sheet received:", initialCaseSheet);
      
      // Map individual examination fields from database to form
      setFormData((prev: any) => ({
        ...prev,
        ...initialCaseSheet,
        OPD_NEXT_FOLLOW_UP: (initialCaseSheet as any).OPD_NEXT_FOLLOW_UP || "",
        chief_complaints: (initialCaseSheet as any).chief_complaints || "",
        associated_complaints: (initialCaseSheet as any).associated_complaints || "",
        past_history: (initialCaseSheet as any).past_history || "",
        personal_history: (initialCaseSheet as any).personal_history || "",
        allergy_history: (initialCaseSheet as any).allergy_history || "",
        family_history: (initialCaseSheet as any).family_history || "",
        obs_gyn_history: (initialCaseSheet as any).obs_gyn_history || "",
        local_examination: (initialCaseSheet as any).local_examination || "",
        pain_assessment: (initialCaseSheet as any).pain_assessment || "",
        investigations: (initialCaseSheet as any).investigations || "",
        diagnosis: (initialCaseSheet as any).diagnosis || "",
        treatment_plan: (initialCaseSheet as any).treatment_plan || "",
        preventive_aspects: (initialCaseSheet as any).preventive_aspects || "",
        rehabilitation: (initialCaseSheet as any).rehabilitation || "",
        desired_outcome: (initialCaseSheet as any).desired_outcome || "",
        // Map individual examination fields
        height: (initialCaseSheet as any).height || "",
        weight: (initialCaseSheet as any).weight || "",
        bmi: (initialCaseSheet as any).bmi || "",
        pulse: (initialCaseSheet as any).pulse || "",
        rr: (initialCaseSheet as any).rr || "",
        bp: (initialCaseSheet as any).bp || "",
        respiratory_system: (initialCaseSheet as any).respiratory_system || "",
        cvs: (initialCaseSheet as any).cvs || "",
        cns: (initialCaseSheet as any).cns || "",
      }));
    }
  }, [initialCaseSheet]);
  const [loading, setLoading] = useState(false)
  const [procedures, setProcedures] = useState<any[]>([]);
  const [showProcedureAdd, setShowProcedureAdd] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState("");
  const [procedureResults, setProcedureResults] = useState<any[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  
  // Multiple medicines and requirements support
  const [selectedMedicines, setSelectedMedicines] = useState<any[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<any[]>([]);
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medicationResults, setMedicationResults] = useState<any[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [requirementSearch, setRequirementSearch] = useState("");
  const [requirementResults, setRequirementResults] = useState<any[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [procedureQuantity, setProcedureQuantity] = useState("");
  const [procedureStartDate, setProcedureStartDate] = useState("");
  const [procedureEndDate, setProcedureEndDate] = useState("");
  const [procedureTherapist, setProcedureTherapist] = useState("");
  
  // Edit states for procedures
  const [editingProcedureIndex, setEditingProcedureIndex] = useState<number | null>(null);
  const [editProcedureSearch, setEditProcedureSearch] = useState("");
  const [editProcedureResults, setEditProcedureResults] = useState<any[]>([]);
  const [editSelectedProcedure, setEditSelectedProcedure] = useState<any>(null);
  
  // Multiple medicines and requirements for editing
  const [editSelectedMedicines, setEditSelectedMedicines] = useState<any[]>([]);
  const [editSelectedRequirements, setEditSelectedRequirements] = useState<any[]>([]);
  const [editMedicationSearch, setEditMedicationSearch] = useState("");
  const [editMedicationResults, setEditMedicationResults] = useState<any[]>([]);
  const [editSelectedMedicine, setEditSelectedMedicine] = useState<any>(null);
  const [editRequirementSearch, setEditRequirementSearch] = useState("");
  const [editRequirementResults, setEditRequirementResults] = useState<any[]>([]);
  const [editSelectedRequirement, setEditSelectedRequirement] = useState<any>(null);
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
  // Base month for seeding procedures/medications (patient's created_at month)
  const [patientBaseMonthISO, setPatientBaseMonthISO] = useState<string | null>(null);

  // Fetch doctor's department when doctor_id changes
  useEffect(() => {
    const fetchDoctorDepartment = async () => {
      if (doctorId) {
        const { data, error } = await supabase
          .from("staff")
          .select("department_id, department:department_id(name)")
          .eq("id", doctorId)
          .single();
        
        if (data && data.department) {
          setFormData((prev: any) => ({
            ...prev,
            department: (data.department as any).name
          }));
        }
      }
    };
    
    fetchDoctorDepartment();
  }, [doctorId]);

  // Prefill general examination vitals if empty
  useEffect(() => {
    try {
      const hasVitals = Boolean(formData?.height || formData?.weight || formData?.bmi || formData?.pulse || formData?.rr || formData?.bp);
      if (!hasVitals) {
        setFormData((prev: any) => ({
          ...prev,
          height: prev.height || "170 cm",
          weight: prev.weight || "68 kg",
          bmi: prev.bmi || "23.5",
          pulse: prev.pulse || "78",
          rr: prev.rr || "16",
          bp: prev.bp || "120/80",
        }));
      }
    } catch {}
    // run once on mount / when initial case sheet changes
  }, [initialCaseSheet]);

  // Ensure investigations have sensible defaults when none present
  useEffect(() => {
    try {
      const invFromCase = (initialCaseSheet as any)?.investigations as string | undefined;
      if ((!invFromCase || invFromCase.trim() === "") && selectedInvestigations.length === 0) {
        setSelectedInvestigations(["Complete Haemogram", "LFT I", "Glucose - F"]);
      }
    } catch {}
  }, [initialCaseSheet]);

  // Fetch patient's created_at to anchor all dummy dates within that month
  useEffect(() => {
    const fetchPatientCreatedAt = async () => {
      try {
        if (!patientUhId) return;
        const { data, error } = await supabase
          .from("patients")
          .select("created_at")
          .eq("uhid", patientUhId)
          .single();
        if (!error && data?.created_at) {
          const d = new Date(data.created_at);
          const base = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
          setPatientBaseMonthISO(base);
        }
      } catch {}
    };
    fetchPatientCreatedAt();
  }, [patientUhId]);

  // Load previously saved procedures and internal medications
  useEffect(() => {
    const loadSavedData = async () => {
      if (opNo) {
        console.log("Loading saved data for case sheet:", initialCaseSheet);
        
        // Get the case sheet creation date to filter procedures and medications
        let caseSheetCreatedDate = null;
        if (initialCaseSheet.created_at) {
          caseSheetCreatedDate = new Date(initialCaseSheet.created_at).toISOString().split('T')[0];
          console.log("Case sheet created date:", caseSheetCreatedDate);
        } else {
          console.log("No created_at date found, will load all data for this OPD");
        }

        // Load procedures - match case sheet created date with procedure created_at date
        let proceduresQuery = supabase
          .from("procedure_entries")
          .select("*")
          .eq("opd_no", opNo);
        
        if (caseSheetCreatedDate) {
          // Match case sheet creation date with procedure created_at date (date only)
          proceduresQuery = proceduresQuery.gte("created_at", caseSheetCreatedDate + "T00:00:00.000Z")
                                           .lt("created_at", caseSheetCreatedDate + "T23:59:59.999Z");
        }
        
        let { data: proceduresData, error: proceduresError } = await proceduresQuery;
        console.log("Procedures data:", proceduresData, "Error:", proceduresError);
        
        // If no procedures in DB, seed 1-2 demo entries using the case sheet created_at (or visit_date) as base date
        if ((!proceduresData || proceduresData.length === 0) && opNo) {
          try {
            // base date = case sheet date if available, else visit date (fallback to today)
            let baseISO = new Date().toISOString().slice(0,10);
            if (patientBaseMonthISO) baseISO = patientBaseMonthISO;
            else if (initialCaseSheet?.created_at) baseISO = new Date(initialCaseSheet.created_at).toISOString().slice(0,10);
            else if (formData?.visit_date) baseISO = String(formData.visit_date);
            const seed = buildSeedProcedures(opNo, baseISO);
            await supabase.from("procedure_entries").insert(seed);
            // Re-fetch without date filter to ensure visibility
            const { data: seeded } = await supabase
              .from("procedure_entries").select("*").eq("opd_no", opNo);
            proceduresData = seeded || [];
          } catch (e) {
            console.warn("Seeding procedures failed, using dummy overlay only", e);
          }
        }

        const effectiveProcedures = (proceduresData && proceduresData.length > 0) ? proceduresData : getDummyProcedures(opNo || "OPD-00000000-0001");
        if (effectiveProcedures && effectiveProcedures.length > 0) {
          const formattedProcedures = effectiveProcedures.map(proc => {
            // Parse the requirements string to extract medicines and requirements
            const requirementsList = (proc.requirements || "").split(", ").filter(Boolean);
            const medicines = requirementsList.map((item: string) => ({ product_name: item }));
            
            return {
              procedure: { procedure_name: proc.procedure_name },
              medicines: medicines,
              requirements: [], // For backward compatibility, we'll treat all as medicines
              requirementsString: proc.requirements,
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

        // Load internal medications - match case sheet created date with medication created_at date
        let medicationsQuery = supabase
          .from("internal_medications")
          .select("*")
          .eq("opd_no", opNo);
        
        if (caseSheetCreatedDate) {
          // Match case sheet creation date with medication created_at date (date only)
          medicationsQuery = medicationsQuery.gte("created_at", caseSheetCreatedDate + "T00:00:00.000Z")
                                            .lt("created_at", caseSheetCreatedDate + "T23:59:59.999Z");
        }
        
        let { data: medicationsData, error: medicationsError } = await medicationsQuery;
        console.log("Medications data:", medicationsData, "Error:", medicationsError);
        
        if ((!medicationsData || medicationsData.length === 0) && opNo) {
          try {
            let baseISO = new Date().toISOString().slice(0,10);
            if (patientBaseMonthISO) baseISO = patientBaseMonthISO;
            else if (initialCaseSheet?.created_at) baseISO = new Date(initialCaseSheet.created_at).toISOString().slice(0,10);
            else if (formData?.visit_date) baseISO = String(formData.visit_date);
            const seed = buildSeedMedications(opNo, baseISO);
            await supabase.from("internal_medications").insert(seed);
            const { data: seededMeds } = await supabase
              .from("internal_medications").select("*").eq("opd_no", opNo);
            medicationsData = seededMeds || [];
          } catch (e) {
            console.warn("Seeding internal medications failed", e);
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

        // Prefill investigations if empty
        try {
          const invFromCase = (initialCaseSheet as any)?.investigations as string | undefined;
          if ((!invFromCase || invFromCase.trim() === "") && selectedInvestigations.length === 0) {
            const defaults = ["Complete Haemogram", "LFT I", "Glucose - F"];
            setSelectedInvestigations(defaults);
          }
        } catch {}
          } else {
        console.log("No OPD number, not loading saved data");
      }
    };
    
    loadSavedData();
  }, [opNo, initialCaseSheet]);

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

  // Debounced search for medications (for both medicine and requirement)
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
  // Debounced search for internal medications
  useEffect(() => {
    if (internalMedSearch.length < 2) { setInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${internalMedSearch}%`);
      setInternalMedResults(data || []);
    };
    fetch();
  }, [internalMedSearch]);

  // Debounced search for edit procedure
  useEffect(() => {
    if (editProcedureSearch.length < 2) { setEditProcedureResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("procedures").select("*").ilike("procedure_name", `%${editProcedureSearch}%`);
      setEditProcedureResults(data || []);
    };
    fetch();
  }, [editProcedureSearch]);

  // Debounced search for edit medication (for procedures)
  useEffect(() => {
    if (editMedicationSearch.length < 2) { setEditMedicationResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editMedicationSearch}%`);
      setEditMedicationResults(data || []);
    };
    fetch();
  }, [editMedicationSearch]);

  // Debounced search for edit requirement
  useEffect(() => {
    if (editRequirementSearch.length < 2) { setEditRequirementResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editRequirementSearch}%`);
      setEditRequirementResults(data || []);
    };
    fetch();
  }, [editRequirementSearch]);

  // Debounced search for edit internal medication
  useEffect(() => {
    if (editInternalMedSearch.length < 2) { setEditInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editInternalMedSearch}%`);
      setEditInternalMedResults(data || []);
    };
    fetch();
  }, [editInternalMedSearch]);

  // Helper functions for multiple medicines and requirements
  const handleAddMedicine = () => {
    if (selectedMedicine && !selectedMedicines.find(m => m.id === selectedMedicine.id)) {
      setSelectedMedicines(prev => [...prev, selectedMedicine]);
      setSelectedMedicine(null);
      setMedicationSearch("");
    }
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setSelectedMedicines(prev => prev.filter(m => m.id !== medicineId));
  };

  const handleAddRequirement = () => {
    if (selectedRequirement && !selectedRequirements.find(r => r.id === selectedRequirement.id)) {
      setSelectedRequirements(prev => [...prev, selectedRequirement]);
      setSelectedRequirement(null);
      setRequirementSearch("");
    }
  };

  const handleRemoveRequirement = (requirementId: string) => {
    setSelectedRequirements(prev => prev.filter(r => r.id !== requirementId));
  };

  const handleAddEditMedicine = () => {
    if (editSelectedMedicine && !editSelectedMedicines.find(m => m.id === editSelectedMedicine.id)) {
      setEditSelectedMedicines(prev => [...prev, editSelectedMedicine]);
      setEditSelectedMedicine(null);
      setEditMedicationSearch("");
    }
  };

  const handleRemoveEditMedicine = (medicineId: string) => {
    setEditSelectedMedicines(prev => prev.filter(m => m.id !== medicineId));
  };

  const handleAddEditRequirement = () => {
    if (editSelectedRequirement && !editSelectedRequirements.find(r => r.id === editSelectedRequirement.id)) {
      setEditSelectedRequirements(prev => [...prev, editSelectedRequirement]);
      setEditSelectedRequirement(null);
      setEditRequirementSearch("");
    }
  };

  const handleRemoveEditRequirement = (requirementId: string) => {
    setEditSelectedRequirements(prev => prev.filter(r => r.id !== requirementId));
  };

  // Add procedure entry
  const handleAddProcedure = () => {
    if (!selectedProcedure) return;
    
    // Combine medicines and requirements into comma-separated strings
    const medicinesString = selectedMedicines.map(m => m.product_name).join(", ");
    const requirementsString = selectedRequirements.map(r => r.product_name).join(", ");
    const combinedRequirements = [medicinesString, requirementsString].filter(Boolean).join(", ");
    
    setProcedures(prev => [
      ...prev,
      {
        procedure: selectedProcedure,
        medicines: selectedMedicines,
        requirements: selectedRequirements,
        requirementsString: combinedRequirements,
        quantity: procedureQuantity,
        start_date: procedureStartDate,
        end_date: procedureEndDate,
        therapist: procedureTherapist,
      },
    ]);
    setShowProcedureAdd(false);
    setSelectedProcedure(null);
    setSelectedMedicines([]);
    setSelectedRequirements([]);
    setProcedureQuantity("");
    setProcedureStartDate("");
    setProcedureEndDate("");
    setProcedureTherapist("");
    setProcedureSearch("");
    setMedicationSearch("");
    setRequirementSearch("");
  };
  const handleRemoveProcedure = (idx: number) => {
    setProcedures(prev => prev.filter((_, i) => i !== idx));
  };

  // Add internal medication entry
  const handleAddInternalMed = () => {
    if (!selectedInternalMed) return;
    setInternalMedications(prev => [
      ...prev,
      { 
        medication: selectedInternalMed,
        dosage: medicationDosage,
        frequency: medicationFrequency,
        start_date: medicationStartDate,
        end_date: medicationEndDate,
        notes: medicationNotes
      },
    ]);
    setShowInternalMedAdd(false);
    setSelectedInternalMed(null);
    setInternalMedSearch("");
    setMedicationDosage("");
    setMedicationFrequency("");
    setMedicationStartDate("");
    setMedicationEndDate("");
    setMedicationNotes("");
  };
  const handleRemoveInternalMed = (idx: number) => {
    setInternalMedications(prev => prev.filter((_, i) => i !== idx));
  };

  // Edit procedure functions
  const handleEditProcedure = (idx: number) => {
    const procedure = procedures[idx];
    setEditingProcedureIndex(idx);
    setEditSelectedProcedure(procedure.procedure);
    setEditProcedureSearch(procedure.procedure.procedure_name);
    
    // Handle both old and new structure for backward compatibility
    if (procedure.medicines) {
      setEditSelectedMedicines(procedure.medicines);
    } else if (procedure.medicine) {
      setEditSelectedMedicines(procedure.medicine ? [procedure.medicine] : []);
    } else {
      setEditSelectedMedicines([]);
    }
    
    if (procedure.requirements) {
      setEditSelectedRequirements(procedure.requirements);
    } else if (procedure.requirement) {
      setEditSelectedRequirements(procedure.requirement ? [procedure.requirement] : []);
    } else {
      setEditSelectedRequirements([]);
    }
    
    setEditProcedureQuantity(procedure.quantity || "");
    setEditProcedureStartDate(procedure.start_date || "");
    setEditProcedureEndDate(procedure.end_date || "");
    setEditProcedureTherapist(procedure.therapist || "");
  };

  const handleSaveEditedProcedure = () => {
    if (editingProcedureIndex === null || !editSelectedProcedure) return;
    
    // Combine medicines and requirements into comma-separated strings
    const medicinesString = editSelectedMedicines.map(m => m.product_name).join(", ");
    const requirementsString = editSelectedRequirements.map(r => r.product_name).join(", ");
    const combinedRequirements = [medicinesString, requirementsString].filter(Boolean).join(", ");
    
    const updatedProcedure = {
      procedure: editSelectedProcedure,
      medicines: editSelectedMedicines,
      requirements: editSelectedRequirements,
      requirementsString: combinedRequirements,
      quantity: editProcedureQuantity,
      start_date: editProcedureStartDate,
      end_date: editProcedureEndDate,
      therapist: editProcedureTherapist,
    };
    
    setProcedures(prev => prev.map((p, i) => i === editingProcedureIndex ? updatedProcedure : p));
    setEditingProcedureIndex(null);
    
    // Reset edit states
    setEditSelectedProcedure(null);
    setEditProcedureSearch("");
    setEditSelectedMedicines([]);
    setEditSelectedRequirements([]);
    setEditProcedureQuantity("");
    setEditProcedureStartDate("");
    setEditProcedureEndDate("");
    setEditProcedureTherapist("");
    
    toast({ title: "Updated", description: "Procedure updated successfully." });
  };

  const handleCancelEditProcedure = () => {
    setEditingProcedureIndex(null);
    // Reset edit states
    setEditSelectedProcedure(null);
    setEditProcedureSearch("");
    setEditSelectedMedicines([]);
    setEditSelectedRequirements([]);
    setEditProcedureQuantity("");
    setEditProcedureStartDate("");
    setEditProcedureEndDate("");
    setEditProcedureTherapist("");
  };

  // Edit internal medication functions
  const handleEditInternalMed = (idx: number) => {
    const medication = internalMedications[idx];
    setEditingMedicationIndex(idx);
    setEditSelectedInternalMed(medication.medication);
    setEditInternalMedSearch(medication.medication.product_name);
    setEditMedicationDosage(medication.dosage || "");
    setEditMedicationFrequency(medication.frequency || "");
    setEditMedicationStartDate(medication.start_date || "");
    setEditMedicationEndDate(medication.end_date || "");
    setEditMedicationNotes(medication.notes || "");
  };

  const handleSaveEditedMedication = () => {
    if (editingMedicationIndex === null || !editSelectedInternalMed) return;
    
    const updatedMedication = {
      medication: editSelectedInternalMed,
      dosage: editMedicationDosage,
      frequency: editMedicationFrequency,
      start_date: editMedicationStartDate,
      end_date: editMedicationEndDate,
      notes: editMedicationNotes
    };
    
    setInternalMedications(prev => prev.map((m, i) => i === editingMedicationIndex ? updatedMedication : m));
    setEditingMedicationIndex(null);
    
    // Reset edit states
    setEditSelectedInternalMed(null);
    setEditInternalMedSearch("");
    setEditMedicationDosage("");
    setEditMedicationFrequency("");
    setEditMedicationStartDate("");
    setEditMedicationEndDate("");
    setEditMedicationNotes("");
    
    toast({ title: "Updated", description: "Medication updated successfully." });
  };

  const handleCancelEditMedication = () => {
    setEditingMedicationIndex(null);
    // Reset edit states
    setEditSelectedInternalMed(null);
    setEditInternalMedSearch("");
    setEditMedicationDosage("");
    setEditMedicationFrequency("");
    setEditMedicationStartDate("");
    setEditMedicationEndDate("");
    setEditMedicationNotes("");
  };

  const handleRequestRequirements = async (idx: number) => {
    const procedure = procedures[idx];
    if (!procedure || !opNo) {
      toast({
        title: "Error",
        description: "Unable to request requirements for this procedure",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, ensure the procedure is saved to procedure_entries
      const requirementsString = procedure.requirementsString || [
        procedure.medicines?.map((m: any) => m.product_name).join(", "),
        procedure.requirements?.map((r: any) => r.product_name).join(", ")
      ].filter(Boolean).join(", ");

      const { data: procedureData, error: procedureError } = await supabase
        .from("procedure_entries")
        .insert({
          opd_no: opNo,
          ipd_no: null,
          procedure_name: procedure.procedure.procedure_name,
          requirements: requirementsString,
          quantity: procedure.quantity || null,
          start_date: new Date().toISOString().split('T')[0],
          end_date: procedure.end_date || null,
          therapist: procedure.therapist || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (procedureError) {
        console.error("Procedure insert error:", procedureError);
        throw procedureError;
      }

      // Then create the procedure medicine requirement request
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          opd_no: opNo,
          procedure_entry_id: procedureData.id,
          requirements: requirementsString,
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

  const handleRequestRequirementsFromSaved = async (savedProcedure: any) => {
    if (!savedProcedure || !opNo) {
      toast({
        title: "Error",
        description: "Unable to request requirements for this procedure",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, ensure the procedure is saved to procedure_entries
      const requirementsString = savedProcedure.requirementsString || [
        savedProcedure.medicines?.map((m: any) => m.product_name).join(", "),
        savedProcedure.requirements?.map((r: any) => r.product_name).join(", ")
      ].filter(Boolean).join(", ");

      const { data: procedureData, error: procedureError } = await supabase
        .from("procedure_entries")
        .insert({
          opd_no: opNo,
          ipd_no: null,
          procedure_name: savedProcedure.procedure.procedure_name,
          requirements: requirementsString,
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

      // Then create the procedure medicine requirement request
      const { error: requestError } = await supabase
        .from("procedure_medicine_requirement_requests")
        .insert({
          opd_no: opNo,
          procedure_entry_id: procedureData.id,
          requirements: requirementsString,
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

  const handleRequestMedication = async (medication: any) => {
    if (!medication || !opNo) {
      toast({
        title: "Error",
        description: "Unable to request medication",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, check if this medication already exists for this OPD
      const { data: existingMedication, error: checkError } = await supabase
        .from("internal_medications")
        .select("id")
        .eq("opd_no", opNo)
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
            opd_no: opNo,
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
        .eq("opd_no", opNo)
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

      // Create the medication dispense request
      const { error: requestError } = await supabase
        .from("medication_dispense_requests")
        .insert({
          opd_no: opNo,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev: any) => {
      const updatedData = { ...prev, [id]: value }
      
      // Auto-calculate BMI when height or weight changes
      if (id === 'height' || id === 'weight') {
        const height = id === 'height' ? value : prev.height
        const weight = id === 'weight' ? value : prev.weight
        
        if (height && weight) {
          const heightInMeters = parseFloat(height) / 100 // Convert cm to meters
          const weightInKg = parseFloat(weight)
          
          if (heightInMeters > 0 && weightInKg > 0) {
            const bmi = weightInKg / (heightInMeters * heightInMeters)
            updatedData.bmi = bmi.toFixed(1)
          } else {
            updatedData.bmi = ""
          }
        } else {
          updatedData.bmi = ""
        }
      }
      
      return updatedData
    })
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }))
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Convert selected investigations to string for storage
    const investigationsString = selectedInvestigations.join(", ");
    
    const { patients, id, ...dataToSave } = formData;
    dataToSave.investigations = investigationsString;
    let error = null;
    if (initialCaseSheet && initialCaseSheet.id) {
      // Update existing case sheet
      const { error: updateError } = await supabase
        .from("opd_case_sheets")
        .update({
          ...dataToSave,
          age: dataToSave.age ? Number(dataToSave.age) : null,
        })
        .eq("id", initialCaseSheet.id);
      error = updateError;
    } else {
      // Insert new case sheet
      const { error: insertError } = await supabase
        .from("opd_case_sheets")
        .insert([
          {
            ...dataToSave,
            age: dataToSave.age ? Number(dataToSave.age) : null,
          },
        ]);
      error = insertError;
    }
    if (error) {
      setLoading(false);
      toast({ title: initialCaseSheet ? "Case Sheet Update Failed" : "Case Sheet Creation Failed", description: error.message, variant: "destructive" });
      return;
    }
    
    // Save procedures to database
    if (initialCaseSheet && initialCaseSheet.id && initialCaseSheet.created_at) {
      // For updates, first delete existing procedures and medications for this specific case sheet date
      const caseSheetCreatedDate = new Date(initialCaseSheet.created_at).toISOString().split('T')[0];
      await supabase.from("procedure_entries").delete()
        .eq("opd_no", opNo)
        .gte("created_at", caseSheetCreatedDate + "T00:00:00.000Z")
        .lt("created_at", caseSheetCreatedDate + "T23:59:59.999Z");
      await supabase.from("internal_medications").delete()
        .eq("opd_no", opNo)
        .gte("created_at", caseSheetCreatedDate + "T00:00:00.000Z")
        .lt("created_at", caseSheetCreatedDate + "T23:59:59.999Z");
    }
    
    if (procedures.length > 0) {
      // Get the case sheet creation date to set as start_date for new procedures
      const caseSheetDate = initialCaseSheet?.created_at ? 
        new Date(initialCaseSheet.created_at).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      const procedurePromises = procedures.map(proc => {
        // Use the combined requirements string from the new structure
        const requirementsString = proc.requirementsString || [
          proc.medicines?.map((m: any) => m.product_name).join(", "),
          proc.requirements?.map((r: any) => r.product_name).join(", ")
        ].filter(Boolean).join(", ");

        return supabase.from("procedure_entries").insert([{
          opd_no: opNo,
          ipd_no: null,
          procedure_name: proc.procedure.procedure_name,
          requirements: requirementsString,
          quantity: proc.quantity || null,
          start_date: caseSheetDate, // Use case sheet creation date
          end_date: proc.end_date || null,
          therapist: proc.therapist || null,
          created_at: new Date().toISOString()
        }]);
      });
      
      const procedureResults = await Promise.all(procedurePromises);
      const procedureErrors = procedureResults.filter(result => result.error);
      
      if (procedureErrors.length > 0) {
        console.error("Some procedures failed to save:", procedureErrors);
        toast({ title: "Warning", description: "Case sheet saved but some procedures failed to save.", variant: "destructive" });
      }
    }
    
    // Save internal medications to database
    if (internalMedications.length > 0) {
      // Get the case sheet creation date to set as start_date for new medications
      const caseSheetDate = initialCaseSheet?.created_at ? 
        new Date(initialCaseSheet.created_at).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      const medicationPromises = internalMedications.map(med => 
        supabase.from("internal_medications").insert([{
          opd_no: opNo,
          medication_name: med.medication.product_name,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          start_date: caseSheetDate, // Use case sheet creation date
          end_date: med.end_date || null,
          notes: med.notes || null,
          prescribed_by: doctorId,
          created_at: new Date().toISOString()
        }])
      );
      
      const medicationResults = await Promise.all(medicationPromises);
      const medicationErrors = medicationResults.filter(result => result.error);
      
      if (medicationErrors.length > 0) {
        console.error("Some medications failed to save:", medicationErrors);
        toast({ title: "Warning", description: "Case sheet saved but some medications failed to save.", variant: "destructive" });
      }
    }
    
    setLoading(false);
    toast({ title: initialCaseSheet ? "Case Sheet Updated" : "Case Sheet Created", description: initialCaseSheet ? "Case sheet updated successfully." : "Case sheet saved successfully." });
    if (onSave) onSave();
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialCaseSheet ? "Edit Case Sheet" : "Create New Case Sheet"}</CardTitle>
        <CardDescription>
          {initialCaseSheet
            ? `Editing case sheet for UHID: ${patientUhId}`
            : "Fill out the form below to create a new case sheet."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="uhid">Patient UHID</Label>
              <Input id="uhid" value={patientUhId} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="opd_no">OPD Number</Label>
              <Input id="opd_no" value={formData.opd_no} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctor_id">Doctor ID</Label>
            <Input id="doctor_id" value={formData.doctor_id} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="op_no">OPD No</Label>
            <Input id="op_no" value={formData.op_no} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="patient_name">Patient Name</Label>
            <Input id="patient_name" value={formData.patient_name} onChange={handleChange} />
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
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" value={formData.contact} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doctor">Doctor Name</Label>
            <Input id="doctor" value={formData.doctor} onChange={handleChange} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={formData.department} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="chief_complaints">Chief Complaints</Label>
            <Textarea id="chief_complaints" value={formData.chief_complaints} onChange={handleChange} />
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
            <Label htmlFor="allergy_history">Allergy History</Label>
            <Textarea id="allergy_history" value={formData.allergy_history} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="family_history">Family History</Label>
            <Textarea id="family_history" value={formData.family_history} onChange={handleChange} />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="obs_gyn_history">Obs/Gyn History</Label>
            <Textarea id="obs_gyn_history" value={formData.obs_gyn_history} onChange={handleChange} />
          </div>
          <div className="col-span-full">
            <Label className="font-bold text-green-800">General Examination</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="height">Height</Label>
                <Input id="height" placeholder="Height (cm)" value={formData.height || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input id="weight" placeholder="Weight (kg)" value={formData.weight || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="bmi">BMI</Label>
                <Input id="bmi" placeholder="BMI" value={formData.bmi || ""} readOnly />
              </div>
              <div>
                <Label htmlFor="pulse">Pulse</Label>
                <Input id="pulse" value={formData.pulse || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="rr">RR</Label>
                <Input id="rr" value={formData.rr || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="bp">BP</Label>
                <Input id="bp" value={formData.bp || ""} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="col-span-full mt-4">
            <Label className="font-bold text-green-800">Systemic Examination</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="respiratory_system">Respiratory System</Label>
                <Input id="respiratory_system" value={formData.respiratory_system || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="cvs">CVS</Label>
                <Input id="cvs" value={formData.cvs || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="cns">CNS</Label>
                <Input id="cns" value={formData.cns || ""} onChange={handleChange} />
              </div>
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
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="investigations">Investigations</Label>
            
            {/* Selected Investigations Display */}
            {selectedInvestigations.length > 0 && (
              <div className="mb-4 p-3 border rounded-lg bg-muted">
                <Label className="text-sm font-medium mb-2">Selected Investigations:</Label>
                
                {/* Laboratory Services */}
                {selectedInvestigations.filter(inv => 
                  Object.values(diagnosticServices["Laboratory Services"]).flat().includes(inv)
                ).length > 0 && (
                  <div className="mb-3">
                    <Label className="text-xs font-semibold text-blue-600 mb-2 block">Laboratory Services:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedInvestigations
                        .filter(inv => Object.values(diagnosticServices["Laboratory Services"]).flat().includes(inv))
                        .map((investigation, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200" onClick={() => removeInvestigation(investigation)}>
                            {investigation} ×
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Imaging Services */}
                {selectedInvestigations.filter(inv => 
                  Object.values(diagnosticServices["Imaging Services"]).flat().includes(inv)
                ).length > 0 && (
                  <div className="mb-3">
                    <Label className="text-xs font-semibold text-green-600 mb-2 block">Imaging Services:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedInvestigations
                        .filter(inv => Object.values(diagnosticServices["Imaging Services"]).flat().includes(inv))
                        .map((investigation, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200" onClick={() => removeInvestigation(investigation)}>
                            {investigation} ×
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diagnostic Services Categories */}
            <div className="border rounded-lg p-4 space-y-4">
              {Object.entries(diagnosticServices).map(([mainCategory, subcategories]) => (
                <div key={mainCategory} className="space-y-2">
                  <Collapsible open={expandedCategories.includes(mainCategory)} onOpenChange={() => toggleCategory(mainCategory)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                        <span className="font-semibold text-left">{mainCategory}</span>
                        {expandedCategories.includes(mainCategory) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pl-4">
                      {Object.entries(subcategories).map(([subcategory, investigations]) => (
                        <div key={subcategory} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleSubcategory(subcategory, investigations)}
                              className="text-xs"
                            >
                              {investigations.every(inv => selectedInvestigations.includes(inv)) ? "Deselect All" : "Select All"}
                            </Button>
                            <span className="font-medium text-sm">{subcategory}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                            {investigations.map((investigation, index) => (
                              <div key={`${subcategory}-${investigation}-${index}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${subcategory}-${investigation}-${index}`}
                                  checked={selectedInvestigations.includes(investigation)}
                                  onCheckedChange={() => toggleInvestigation(investigation)}
                                />
                                <Label htmlFor={`${subcategory}-${investigation}-${index}`} className="text-sm cursor-pointer">
                                  {investigation}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea id="diagnosis" value={formData.diagnosis} onChange={handleChange} />
          </div>
          {/* Previously Saved Procedures (Read-only) */}
          {savedProcedures.length > 0 && (
            <div className="col-span-full mt-8">
              <Label className="font-bold text-gray-600 text-lg">Previously Saved Procedures</Label>
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Select items to keep or delete:</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setProcedures([...savedProcedures]);
                      toast({ title: "Copied", description: "All previously saved procedures copied to editable section." });
                    }}
                  >
                    Copy All to Editable
                  </Button>
                </div>
                <ul className="space-y-3">
                  {savedProcedures.map((p, idx) => (
                    <li key={idx} className="p-3 border rounded bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-800">{p.procedure?.procedure_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Previously Saved</Badge>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setProcedures(prev => [...prev, p]);
                              toast({ title: "Copied", description: "Procedure copied to editable section." });
                            }}
                          >
                            Copy to Editable
                          </Button>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleRequestRequirementsFromSaved(p)}
                          >
                            Request Requirements
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        {p.requirementsString && <div><span className="font-medium">Requirements:</span> {p.requirementsString}</div>}
                        {p.quantity && <div><span className="font-medium">Quantity:</span> {p.quantity}</div>}
                        {p.start_date && <div><span className="font-medium">Start Date:</span> {p.start_date}</div>}
                        {p.end_date && <div><span className="font-medium">End Date:</span> {p.end_date}</div>}
                        {p.therapist && <div><span className="font-medium">Therapist:</span> {p.therapist}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Procedures Section */}
          <div className="col-span-full mt-8">
            <Label className="font-bold text-blue-800 text-lg">Procedures</Label>
            <div className="mb-2">
              <Button type="button" variant="outline" onClick={() => setShowProcedureAdd(true)}>+ Add Procedure</Button>
            </div>
            {procedures.length > 0 && (
              <ul className="mb-2">
                {procedures.map((p, idx) => (
                  <li key={idx} className="mb-3 p-3 border rounded-lg bg-muted">
                    {editingProcedureIndex === idx ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-600">Editing Procedure</span>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={handleSaveEditedProcedure}>Save</Button>
                            <Button type="button" size="sm" variant="outline" onClick={handleCancelEditProcedure}>Cancel</Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Search Procedure</Label>
                            <Input value={editProcedureSearch} onChange={e => setEditProcedureSearch(e.target.value)} placeholder="Type to search..." />
                            {editProcedureResults.length > 0 && (
                              <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                                {editProcedureResults.map(proc => (
                                  <li key={proc.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setEditSelectedProcedure(proc); setEditProcedureSearch(proc.procedure_name); setEditProcedureResults([]); }}>
                                    {proc.procedure_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          
                          <div>
                            <Label>Search Medicine</Label>
                            <div className="flex gap-2">
                              <Input value={editMedicationSearch} onChange={e => setEditMedicationSearch(e.target.value)} placeholder="Type to search..." />
                              <Button type="button" size="sm" onClick={handleAddEditMedicine} disabled={!editSelectedMedicine}>Add</Button>
                            </div>
                            {editMedicationResults.length > 0 && (
                              <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                                {editMedicationResults.map(med => (
                                  <li key={med.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setEditSelectedMedicine(med); setEditMedicationSearch(med.product_name); setEditMedicationResults([]); }}>
                                    {med.product_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {editSelectedMedicines.length > 0 && (
                              <div className="mt-2">
                                <Label className="text-sm">Selected Medicines:</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {editSelectedMedicines.map(med => (
                                    <Badge key={med.id} variant="secondary" className="text-xs">
                                      {med.product_name}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEditMedicine(med.id)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Search Requirement</Label>
                            <div className="flex gap-2">
                              <Input value={editRequirementSearch} onChange={e => setEditRequirementSearch(e.target.value)} placeholder="Type to search..." />
                              <Button type="button" size="sm" onClick={handleAddEditRequirement} disabled={!editSelectedRequirement}>Add</Button>
                            </div>
                            {editRequirementResults.length > 0 && (
                              <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                                {editRequirementResults.map(req => (
                                  <li key={req.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setEditSelectedRequirement(req); setEditRequirementSearch(req.product_name); setEditRequirementResults([]); }}>
                                    {req.product_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {editSelectedRequirements.length > 0 && (
                              <div className="mt-2">
                                <Label className="text-sm">Selected Requirements:</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {editSelectedRequirements.map(req => (
                                    <Badge key={req.id} variant="secondary" className="text-xs">
                                      {req.product_name}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEditRequirement(req.id)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Quantity</Label>
                            <Input value={editProcedureQuantity} onChange={e => setEditProcedureQuantity(e.target.value)} placeholder="e.g., 20 ml of oil, 1 tablet, etc." />
                          </div>
                          
                          <div>
                            <Label>Start Date</Label>
                            <Input value={editProcedureStartDate} onChange={e => setEditProcedureStartDate(e.target.value)} type="date" />
                          </div>
                          
                          <div>
                            <Label>End Date</Label>
                            <Input value={editProcedureEndDate} onChange={e => setEditProcedureEndDate(e.target.value)} type="date" />
                          </div>
                          
                          <div>
                            <Label>Therapist</Label>
                            <Input value={editProcedureTherapist} onChange={e => setEditProcedureTherapist(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">{p.procedure?.procedure_name}</span>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleEditProcedure(idx)}>Edit</Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => handleRequestRequirements(idx)}>Request Requirements</Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveProcedure(idx)}>Remove</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {p.requirementsString && <div><span className="font-medium">Requirements:</span> {p.requirementsString}</div>}
                          {p.quantity && <div><span className="font-medium">Quantity:</span> {p.quantity}</div>}
                          {p.start_date && <div><span className="font-medium">Start Date:</span> {p.start_date}</div>}
                          {p.end_date && <div><span className="font-medium">End Date:</span> {p.end_date}</div>}
                          {p.therapist && <div><span className="font-medium">Therapist:</span> {p.therapist}</div>}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {showProcedureAdd && (
              <div className="border p-4 rounded mb-2 bg-muted">
                <div className="mb-2">
                  <Label>Search Procedure</Label>
                  <Input value={procedureSearch} onChange={e => setProcedureSearch(e.target.value)} placeholder="Type to search..." />
                  {procedureResults.length > 0 && (
                    <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                      {procedureResults.map(proc => (
                        <li key={proc.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setSelectedProcedure(proc); setProcedureSearch(proc.procedure_name); setProcedureResults([]); }}>
                          {proc.procedure_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {selectedProcedure && (
                  <>
                    <div className="mb-2">
                      <Label>Search Medicine</Label>
                      <div className="flex gap-2">
                        <Input value={medicationSearch} onChange={e => setMedicationSearch(e.target.value)} placeholder="Type to search..." />
                        <Button type="button" size="sm" onClick={handleAddMedicine} disabled={!selectedMedicine}>Add</Button>
                      </div>
                      {medicationResults.length > 0 && (
                        <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                          {medicationResults.map(med => (
                            <li key={med.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setSelectedMedicine(med); setMedicationSearch(med.product_name); setMedicationResults([]); }}>
                              {med.product_name}
                            </li>
                          ))}
                        </ul>
                      )}
                      {selectedMedicines.length > 0 && (
                        <div className="mt-2">
                          <Label className="text-sm">Selected Medicines:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedMedicines.map(med => (
                              <Badge key={med.id} variant="secondary" className="text-xs">
                                {med.product_name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedicine(med.id)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <Label>Search Requirement</Label>
                      <div className="flex gap-2">
                        <Input value={requirementSearch} onChange={e => setRequirementSearch(e.target.value)} placeholder="Type to search..." />
                        <Button type="button" size="sm" onClick={handleAddRequirement} disabled={!selectedRequirement}>Add</Button>
                      </div>
                      {requirementResults.length > 0 && (
                        <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                          {requirementResults.map(req => (
                            <li key={req.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setSelectedRequirement(req); setRequirementSearch(req.product_name); setRequirementResults([]); }}>
                              {req.product_name}
                            </li>
                          ))}
                        </ul>
                      )}
                      {selectedRequirements.length > 0 && (
                        <div className="mt-2">
                          <Label className="text-sm">Selected Requirements:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRequirements.map(req => (
                              <Badge key={req.id} variant="secondary" className="text-xs">
                                {req.product_name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRequirement(req.id)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <Label>Quantity</Label>
                      <Input value={procedureQuantity} onChange={e => setProcedureQuantity(e.target.value)} placeholder="e.g., 20 ml of oil, 1 tablet, etc." />
                    </div>
                    <div className="mb-2">
                      <Label>Start Date</Label>
                      <Input value={procedureStartDate} onChange={e => setProcedureStartDate(e.target.value)} type="date" />
                    </div>
                    <div className="mb-2">
                      <Label>End Date</Label>
                      <Input value={procedureEndDate} onChange={e => setProcedureEndDate(e.target.value)} type="date" />
                    </div>
                    <div className="mb-2">
                      <Label>Therapist</Label>
                      <Input value={procedureTherapist} onChange={e => setProcedureTherapist(e.target.value)} />
                    </div>
                    <Button type="button" onClick={handleAddProcedure}>Add</Button>
                    <Button type="button" variant="outline" className="ml-2" onClick={() => setShowProcedureAdd(false)}>Cancel</Button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Previously Saved Internal Medications (Read-only) */}
          {savedMedications.length > 0 && (
            <div className="col-span-full mt-8">
              <Label className="font-bold text-gray-600 text-lg">Previously Saved Internal Medications</Label>
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Select items to keep or delete:</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setInternalMedications([...savedMedications]);
                      toast({ title: "Copied", description: "All previously saved medications copied to editable section." });
                    }}
                  >
                    Copy All to Editable
                  </Button>
                </div>
                <ul className="space-y-3">
                  {savedMedications.map((m, idx) => (
                    <li key={idx} className="p-3 border rounded bg-white">
                                              <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-800 text-lg">{m.medication.product_name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">Previously Saved</Badge>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setInternalMedications(prev => [...prev, m]);
                                toast({ title: "Copied", description: "Medication copied to editable section." });
                              }}
                            >
                              Copy to Editable
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleRequestMedication(m)}
                            >
                              Request Medication
                            </Button>
                          </div>
                        </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        {m.dosage && <div><span className="font-medium">Dosage:</span> {m.dosage}</div>}
                        {m.frequency && <div><span className="font-medium">Frequency:</span> {m.frequency}</div>}
                        {m.start_date && <div><span className="font-medium">Start Date:</span> {m.start_date}</div>}
                        {m.end_date && <div><span className="font-medium">End Date:</span> {m.end_date}</div>}
                      </div>
                      {m.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {m.notes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Internal Medication Section */}
          <div className="col-span-full mt-8">
            <Label className="font-bold text-blue-800 text-lg">Internal Medication</Label>
            <div className="mb-2">
              <Button type="button" variant="outline" onClick={() => setShowInternalMedAdd(true)}>+ Add Medication</Button>
            </div>
            {internalMedications.length > 0 && (
              <ul className="mb-2">
                {internalMedications.map((m, idx) => (
                  <li key={idx} className="mb-3 p-3 border rounded-lg bg-muted">
                    {editingMedicationIndex === idx ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-600">Editing Medication</span>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={handleSaveEditedMedication}>Save</Button>
                            <Button type="button" size="sm" variant="outline" onClick={handleCancelEditMedication}>Cancel</Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Search Medication</Label>
                            <Input value={editInternalMedSearch} onChange={e => setEditInternalMedSearch(e.target.value)} placeholder="Type to search..." />
                            {editInternalMedResults.length > 0 && (
                              <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                                {editInternalMedResults.map(med => (
                                  <li key={med.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setEditSelectedInternalMed(med); setEditInternalMedSearch(med.product_name); setEditInternalMedResults([]); }}>
                                    {med.product_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          
                          <div>
                            <Label>Dosage</Label>
                            <Input 
                              value={editMedicationDosage} 
                              onChange={e => setEditMedicationDosage(e.target.value)} 
                              placeholder="e.g., 1 tablet, 10ml, etc."
                            />
                          </div>
                          
                          <div>
                            <Label>Frequency</Label>
                            <Input 
                              value={editMedicationFrequency} 
                              onChange={e => setEditMedicationFrequency(e.target.value)} 
                              placeholder="e.g., Twice daily, Once daily, etc."
                            />
                          </div>
                          
                          <div>
                            <Label>Start Date</Label>
                            <Input 
                              type="date" 
                              value={editMedicationStartDate} 
                              onChange={e => setEditMedicationStartDate(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label>End Date</Label>
                            <Input 
                              type="date" 
                              value={editMedicationEndDate} 
                              onChange={e => setEditMedicationEndDate(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Notes</Label>
                          <Textarea 
                            value={editMedicationNotes} 
                            onChange={e => setEditMedicationNotes(e.target.value)} 
                            placeholder="Additional notes about the medication..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">{m.medication.product_name}</span>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleEditInternalMed(idx)}>Edit</Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => handleRequestMedication(m)}>Request Medication</Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveInternalMed(idx)}>Remove</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {m.dosage && <div><span className="font-medium">Dosage:</span> {m.dosage}</div>}
                          {m.frequency && <div><span className="font-medium">Frequency:</span> {m.frequency}</div>}
                          {m.start_date && <div><span className="font-medium">Start Date:</span> {m.start_date}</div>}
                          {m.end_date && <div><span className="font-medium">End Date:</span> {m.end_date}</div>}
                        </div>
                        {m.notes && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Notes:</span> {m.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {showInternalMedAdd && (
              <div className="border p-4 rounded mb-2 bg-muted">
                <div className="mb-2">
                  <Label>Search Medication</Label>
                  <Input value={internalMedSearch} onChange={e => setInternalMedSearch(e.target.value)} placeholder="Type to search..." />
                  {internalMedResults.length > 0 && (
                    <ul className="border rounded bg-white mt-1 max-h-32 overflow-auto">
                      {internalMedResults.map(med => (
                        <li key={med.id} className="p-1 hover:bg-blue-100 cursor-pointer" onClick={() => { setSelectedInternalMed(med); setInternalMedSearch(med.product_name); setInternalMedResults([]); }}>
                          {med.product_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {selectedInternalMed && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Dosage</Label>
                        <Input 
                          value={medicationDosage} 
                          onChange={e => setMedicationDosage(e.target.value)} 
                          placeholder="e.g., 1 tablet, 10ml, etc."
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Input 
                          value={medicationFrequency} 
                          onChange={e => setMedicationFrequency(e.target.value)} 
                          placeholder="e.g., Twice daily, Once daily, etc."
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input 
                          type="date" 
                          value={medicationStartDate} 
                          onChange={e => setMedicationStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input 
                          type="date" 
                          value={medicationEndDate} 
                          onChange={e => setMedicationEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <Label>Notes</Label>
                      <Textarea 
                        value={medicationNotes} 
                        onChange={e => setMedicationNotes(e.target.value)} 
                        placeholder="Additional notes about the medication..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleAddInternalMed}>Add Medication</Button>
                      <Button type="button" variant="outline" onClick={() => setShowInternalMedAdd(false)}>Cancel</Button>
                    </div>
                  </>
                )}
              </div>
            )}
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
          <div className="grid gap-2 col-span-full">
            <Label htmlFor="OPD_NEXT_FOLLOW_UP">Next OPD Follow-up</Label>
            <Input id="OPD_NEXT_FOLLOW_UP" value={formData.OPD_NEXT_FOLLOW_UP || ""} onChange={handleChange} />
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                                // Combine current form data with saved data for printing
                const allProcedures = [...procedures, ...savedProcedures];
                const allMedications = [...internalMedications, ...savedMedications];
                
                const printData = {
                  patient_name: formData.patient_name,
                  uhid: patientUhId,
                  opd_no: formData.opd_no,
                  age: formData.age,
                  ref: "",
                  gender: formData.gender,
                  contact: formData.contact,
                  address: formData.address,
                  doctor: formData.doctor,
                  department: formData.department,
                  chief_complaints: formData.chief_complaints,
                  associated_complaints: formData.associated_complaints,
                  past_history: formData.past_history,
                  personal_history: formData.personal_history,
                  allergy_history: formData.allergy_history,
                  family_history: formData.family_history,
                  obs_gyn_history: formData.obs_gyn_history,
                  // Individual examination fields
                  height: formData.height,
                  weight: formData.weight,
                  bmi: formData.bmi,
                  pulse: formData.pulse,
                  rr: formData.rr,
                  bp: formData.bp,
                  respiratory_system: formData.respiratory_system,
                  cvs: formData.cvs,
                  cns: formData.cns,
                  local_examination: formData.local_examination,
                  pain_assessment: formData.pain_assessment,
                  investigations: selectedInvestigations.join(", "),
                  diagnosis: formData.diagnosis,
                  nutritional_status: formData.nutritional_status,
                  treatment_plan: formData.treatment_plan,
                  preventive_aspects: formData.preventive_aspects,
                  rehabilitation: formData.rehabilitation,
                  desired_outcome: formData.desired_outcome,
                  OPD_NEXT_FOLLOW_UP: formData.OPD_NEXT_FOLLOW_UP || "",
                  procedures: allProcedures,
                  internal_medications: allMedications,
                  created_at: new Date().toISOString()
                };
                
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                    <head>
                      <title>OPD COMPLETE CASE SUMMARY - ${formData.patient_name}</title>
                      <style>
                        body { 
                          font-family: 'Times New Roman', serif; 
                          background: #fff; 
                          color: #000; 
                          margin: 0; 
                          padding: 20px; 
                          font-size: 12pt;
                          line-height: 1.4;
                        }
                        .container { 
                          max-width: 800px; 
                          margin: 0 auto; 
                          padding: 20px;
                        }
                        .header { 
                          display: flex; 
                          align-items: center; 
                          margin-bottom: 30px; 
                          border-bottom: 2px solid #333;
                          padding-bottom: 20px;
                        }
                        .logo { 
                          width: 80px;
                          height: 80px;
                          margin-right: 20px;
                        }
                        .title { 
                          flex: 1; 
                          text-align: center; 
                        }
                        .title h1 {
                          font-size: 18pt;
                          font-weight: bold;
                          margin: 0 0 5px 0;
                          color: #000;
                        }
                        .title h2 {
                          font-size: 16pt;
                          font-weight: bold;
                          margin: 0;
                          text-decoration: underline;
                          color: #000;
                        }
                        .patient-info {
                          display: flex;
                          flex-wrap: wrap;
                          gap: 40px;
                          margin-bottom: 20px;
                        }
                        .patient-info div {
                          display: flex;
                          align-items: baseline;
                        }
                        .patient-info b {
                          font-weight: bold;
                          margin-right: 5px;
                        }
                        .patient-info .value {
                          border-bottom: 1px solid #000;
                          min-width: 150px;
                          padding-bottom: 2px;
                        }
                        .section { 
                          margin-bottom: 15px; 
                        }
                        .section b { 
                          font-weight: bold; 
                          margin-bottom: 5px; 
                          color: #000; 
                          font-size: 12pt;
                        }
                        .section .value { 
                          margin-left: 20px; 
                          font-weight: normal; 
                          white-space: pre-wrap; 
                          word-break: break-word; 
                          font-size: 12pt;
                          border-bottom: 1px solid #ccc;
                          padding-bottom: 2px;
                          min-height: 20px;
                        }
                        .examination-section {
                          margin-left: 20px;
                        }
                        .examination-section b {
                          font-weight: bold;
                          color: #000;
                        }
                        .examination-table {
                          margin-left: 20px;
                          margin-top: 5px;
                        }
                        .examination-table table {
                          width: 100%;
                          border-collapse: collapse;
                        }
                        .examination-table td {
                          padding: 2px 10px;
                          font-size: 12pt;
                        }
                        .examination-table b {
                          font-weight: bold;
                        }
                        .examination-list {
                          margin-left: 20px;
                          margin-top: 5px;
                        }
                        .examination-list ul {
                          margin: 5px 0;
                          padding-left: 20px;
                        }
                        .examination-list li {
                          margin-bottom: 3px;
                          font-size: 12pt;
                        }
                        .examination-list b {
                          font-weight: bold;
                        }
                        .pain-scale {
                          margin-top: 10px;
                          text-align: center;
                        }
                        .pain-scale img {
                          max-width: 400px;
                          height: auto;
                        }
                        .procedures-section, .medications-section {
                          margin-left: 20px;
                          margin-top: 5px;
                        }
                        .procedure-item, .medication-item {
                          margin-bottom: 10px;
                          padding: 8px;
                          border: 1px solid #ccc;
                          border-radius: 4px;
                          background-color: #f9f9f9;
                        }
                        .procedure-item b, .medication-item b {
                          font-weight: bold;
                          color: #000;
                        }
                        hr { 
                          margin: 20px 0; 
                          border: none; 
                          border-top: 1.5px solid #333; 
                        }
                        .footer { 
                          margin-top: 40px; 
                          display: flex; 
                          justify-content: space-between; 
                          border-top: 1px solid #333;
                          padding-top: 20px;
                          font-size: 12pt;
                        }
                        .page-number {
                          text-align: right;
                          margin-top: 20px;
                          font-size: 10pt;
                        }
                        @media print {
                          body { margin: 0; padding: 10px; }
                          .container { border: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <!-- Page 1 -->
                        <div class="header">
                          <img src="/my-logo.png" alt="Logo" class="logo" />
                          <div class="title">
                            <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                            <h2>OPD COMPLETE CASE SUMMARY</h2>
                          </div>
                        </div>
                        
                        <div class="patient-info">
                          <div><b>Patient Name:</b><span class="value">${printData.patient_name || ''}</span></div>
                          <div><b>UHID No:</b><span class="value">${printData.uhid || ''}</span></div>
                        </div>
                        <div class="patient-info">
                          <div><b>Age:</b><span class="value">${printData.age || ''} yrs</span></div>
                          <div><b>Gender:</b><span class="value">${printData.gender || ''}</span></div>
                        </div>
                        <div class="patient-info">
                          <div><b>Contact No:</b><span class="value">${printData.contact || ''}</span></div>
                          <div><b>Address:</b><span class="value">${printData.address || ''}</span></div>
                        </div>
                        <div class="patient-info">
                          <div><b>Department:</b><span class="value">${printData.department || ''}</span></div>
                          <div><b>OPD No:</b><span class="value">${printData.opd_no || ''}</span></div>
                        </div>
                        
                        <hr />
                        
                        <div class="section"><b>• Chief Complaints:</b><div class="value">${printData.chief_complaints || ''}</div></div>
                        <div class="section"><b>• Associated Complaints:</b><div class="value">${printData.associated_complaints || ''}</div></div>
                        <div class="section"><b>• Past History:</b><div class="value">${printData.past_history || ''}</div></div>
                        <div class="section"><b>• Personal History:</b><div class="value">${printData.personal_history || ''}</div></div>
                        <div class="section"><b>• Allergy History:</b><div class="value">${printData.allergy_history || ''}</div></div>
                        <div class="section"><b>• Family History:</b><div class="value">${printData.family_history || ''}</div></div>
                        <div class="section"><b>• Obs & Gyn History: (Applicable for female patients only)</b><div class="value">${printData.obs_gyn_history || ''}</div></div>
                        
                        <div class="section">
                          <b>• Examination:</b>
                          <div class="examination-section">
                            <div class="examination-table">
                              <b>• General Examination</b>
                              <table>
                                <tr>
                                  <td><b>Ht:</b> ${printData.height || ''}</td>
                                  <td><b>Wt:</b> ${printData.weight || ''}</td>
                                  <td><b>BMI:</b> ${printData.bmi || ''}</td>
                                  <td><b>Pulse:</b> ${printData.pulse || ''}</td>
                                  <td><b>RR:</b> ${printData.rr || ''}</td>
                                  <td><b>BP:</b> ${printData.bp || ''}</td>
                                </tr>
                              </table>
                            </div>
                            <div class="examination-list">
                              <b>• Systemic Examination</b>
                              <ul>
                                <li><b>Respiratory System:</b> ${printData.respiratory_system || ''}</li>
                                <li><b>CVS:</b> ${printData.cvs || ''}</li>
                                <li><b>CNS:</b> ${printData.cns || ''}</li>
                              </ul>
                            </div>
                            <div class="examination-list">
                              <b>• Local Examination</b>
                              <div class="value">${printData.local_examination || ''}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="section">
                          <b>• Pain Assessment (applicable only for pain predominant cases):</b>
                          <div class="value">${printData.pain_assessment || ''}</div>
                          <div class="pain-scale">
                            <img src="/pain-scale.png" alt="Pain Scale" />
                          </div>
                        </div>
                        
                        <div class="section"><b>• Investigations (if any):</b><div class="value">${printData.investigations || ''}</div></div>
                        
                        <div class="section">
                          <b>• Procedures:</b>
                          <div class="procedures-section">
                            ${printData.procedures.length > 0 ? printData.procedures.map(proc => `
                              <div class="procedure-item">
                                <b>${proc.procedure?.procedure_name || proc.procedure_name || 'Unknown Procedure'}</b><br>
                                ${proc.medicine ? `${proc.medicine.product_name}<br>` : ''}
                                ${proc.requirement ? `${proc.requirement.product_name}<br>` : ''}
                                ${proc.quantity ? `Quantity: ${proc.quantity}<br>` : ''}
                                ${proc.start_date ? `Start Date: ${proc.start_date}<br>` : ''}
                                ${proc.end_date ? `End Date: ${proc.end_date}<br>` : ''}
                                ${proc.therapist ? `Therapist: ${proc.therapist}` : ''}
                              </div>
                            `).join('') : '<div class="value">No procedures added</div>'}
                          </div>
                        </div>
                        
                        <div class="section">
                          <b>• Internal Medications:</b>
                          <div class="medications-section">
                            ${printData.internal_medications.length > 0 ? printData.internal_medications.map(med => `
                              <div class="medication-item">
                                <b>${med.medication?.product_name || med.medication_name || 'Unknown Medication'}</b><br>
                                ${med.dosage ? `Dosage: ${med.dosage}<br>` : ''}
                                ${med.frequency ? `Frequency: ${med.frequency}<br>` : ''}
                                ${med.start_date ? `Start Date: ${med.start_date}<br>` : ''}
                                ${med.end_date ? `End Date: ${med.end_date}<br>` : ''}
                                ${med.notes ? `Notes: ${med.notes}` : ''}
                              </div>
                            `).join('') : '<div class="value">No medications added</div>'}
                          </div>
                        </div>
                        
                        <div class="section"><b>• Provisional Diagnosis/Final Diagnosis:</b><div class="value">${printData.diagnosis || ''}</div></div>
                        <div class="section">
                          <b>• Screening for Nutritional Needs:</b>
                          <div class="examination-section">
                            <b>o Nutritional Status:</b> Normal/mild malnutrition/moderate malnutrition/severe malnutrition
                            <div class="value">${printData.nutritional_status || ''}</div>
                          </div>
                        </div>
                        <div class="section"><b>• Treatment Plan/Care of Plan:</b><div class="value">${printData.treatment_plan || ''}</div></div>
                        <div class="section"><b>• Preventive aspects Pathya Apathys Nidana Pariyarjana, (if any):</b><div class="value">${printData.preventive_aspects || ''}</div></div>
                        <div class="section"><b>• Rehabilitation-Physiotherapy/Basayana Apunarbhay:</b><div class="value">${printData.rehabilitation || ''}</div></div>
                        <div class="section"><b>• Desired outcome:</b><div class="value">${printData.desired_outcome || ''}</div></div>
                        <div class="section"><b>• Next OPD Follow-up:</b><div class="value">${printData.OPD_NEXT_FOLLOW_UP || ''}</div></div>
                        
                        <div class="footer">
                          <div>Date: ${new Date().toLocaleDateString()}</div>
                          <div><b>Doctor Name, Signature with date & Time</b></div>
                        </div>
                        
                        <div class="page-number">Page 1 of 1</div>
                      </div>
                      <script>window.onload = function() { window.print(); };</script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }}
            >
              Print Case Sheet
            </Button>
            <Button type="submit" disabled={loading}>{initialCaseSheet ? "Update Case Sheet" : "Add Case Sheet"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
