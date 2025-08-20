"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/hooks/use-toast"
import { X, Edit, Trash2 } from "lucide-react"

interface OPDFollowUpFormProps {
  onClose: () => void
  onSave: () => void
  initialData?: any // For editing existing follow-ups
  initialOpdNo?: string // For pre-selecting OPD number
}

export default function OPDFollowUpForm({ onClose, onSave, initialData, initialOpdNo }: OPDFollowUpFormProps) {
  const [formData, setFormData] = useState({
    opd_no: initialOpdNo || "",
    date: new Date().toISOString().split('T')[0], // Today's date by default
    doctor_id: "",
    notes: ""
  })
  const [loading, setLoading] = useState(false)
  const [opdVisits, setOpdVisits] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [currentDoctor, setCurrentDoctor] = useState<any>(null)

  // Procedures state
  const [procedures, setProcedures] = useState<any[]>([])
  const [showProcedureAdd, setShowProcedureAdd] = useState(false)
  const [procedureSearch, setProcedureSearch] = useState("")
  const [procedureResults, setProcedureResults] = useState<any[]>([])
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null)
  
  // Multiple medicines and requirements state
  const [selectedMedicines, setSelectedMedicines] = useState<any[]>([])
  const [selectedRequirements, setSelectedRequirements] = useState<any[]>([])
  const [medicationSearch, setMedicationSearch] = useState("")
  const [medicationResults, setMedicationResults] = useState<any[]>([])
  const [requirementSearch, setRequirementSearch] = useState("")
  const [requirementResults, setRequirementResults] = useState<any[]>([])
  
  // Single selection for adding to arrays
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null)
  
  const [procedureQuantity, setProcedureQuantity] = useState("")
  const [procedureStartDate, setProcedureStartDate] = useState("")
  const [procedureEndDate, setProcedureEndDate] = useState("")
  const [procedureTherapist, setProcedureTherapist] = useState("")
  
  // Edit states for procedures
  const [editingProcedureIndex, setEditingProcedureIndex] = useState<number | null>(null)
  const [editProcedureSearch, setEditProcedureSearch] = useState("")
  const [editProcedureResults, setEditProcedureResults] = useState<any[]>([])
  const [editSelectedProcedure, setEditSelectedProcedure] = useState<any>(null)
  
  // Edit states for multiple medicines and requirements
  const [editSelectedMedicines, setEditSelectedMedicines] = useState<any[]>([])
  const [editSelectedRequirements, setEditSelectedRequirements] = useState<any[]>([])
  const [editMedicationSearch, setEditMedicationSearch] = useState("")
  const [editMedicationResults, setEditMedicationResults] = useState<any[]>([])
  const [editRequirementSearch, setEditRequirementSearch] = useState("")
  const [editRequirementResults, setEditRequirementResults] = useState<any[]>([])
  
  // Edit single selection for adding to arrays
  const [editSelectedMedicine, setEditSelectedMedicine] = useState<any>(null)
  const [editSelectedRequirement, setEditSelectedRequirement] = useState<any>(null)
  
  const [editProcedureQuantity, setEditProcedureQuantity] = useState("")
  const [editProcedureStartDate, setEditProcedureStartDate] = useState("")
  const [editProcedureEndDate, setEditProcedureEndDate] = useState("")
  const [editProcedureTherapist, setEditProcedureTherapist] = useState("")

  // Internal medications state
  const [internalMedications, setInternalMedications] = useState<any[]>([])
  const [showInternalMedAdd, setShowInternalMedAdd] = useState(false)
  const [internalMedSearch, setInternalMedSearch] = useState("")
  const [internalMedResults, setInternalMedResults] = useState<any[]>([])
  const [selectedInternalMed, setSelectedInternalMed] = useState<any>(null)
  const [medicationDosage, setMedicationDosage] = useState("")
  const [medicationFrequency, setMedicationFrequency] = useState("")
  const [medicationStartDate, setMedicationStartDate] = useState("")
  const [medicationEndDate, setMedicationEndDate] = useState("")
  const [medicationNotes, setMedicationNotes] = useState("")
  
  // Edit states for internal medications
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null)
  const [editInternalMedSearch, setEditInternalMedSearch] = useState("")
  const [editInternalMedResults, setEditInternalMedResults] = useState<any[]>([])
  const [editSelectedInternalMed, setEditSelectedInternalMed] = useState<any>(null)
  const [editMedicationDosage, setEditMedicationDosage] = useState("")
  const [editMedicationFrequency, setEditMedicationFrequency] = useState("")
  const [editMedicationStartDate, setEditMedicationStartDate] = useState("")
  const [editMedicationEndDate, setEditMedicationEndDate] = useState("")
  const [editMedicationNotes, setEditMedicationNotes] = useState("")
  
  // State for previously saved data (read-only view)
  const [savedProcedures, setSavedProcedures] = useState<any[]>([])
  const [savedMedications, setSavedMedications] = useState<any[]>([])

  // Load OPD visits and doctors
  useEffect(() => {
    // Only load OPD visits if no initialOpdNo is provided (for general form)
    if (!initialOpdNo) {
      loadOpdVisits()
    }
    loadDoctors()
    loadCurrentDoctor()
    loadSavedData()
    
    // If editing, populate form with initial data
    if (initialData) {
      setFormData({
        opd_no: initialData.opd_no || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        doctor_id: initialData.doctor_id || "",
        notes: initialData.notes || ""
      })
    } else if (initialOpdNo) {
      // If initial OPD number is provided, set it
      setFormData(prev => ({
        ...prev,
        opd_no: initialOpdNo
      }))
    }
  }, [initialData, initialOpdNo])

  // Load previously saved procedures and internal medications
  const loadSavedData = async () => {
    if (initialOpdNo && initialData && initialData.id) {
      console.log("Loading saved data for OPD follow-up:", initialData)
      
      // Get the follow-up date to filter procedures and medications
      let followUpDate = null
      if (initialData.date) {
        followUpDate = initialData.date
        console.log("Follow-up date:", followUpDate)
      } else {
        console.log("No date found, will load all data for this OPD")
      }

      // Load procedures - match follow-up date with procedure start_date
      let proceduresQuery = supabase
        .from("procedure_entries")
        .select("*")
        .eq("opd_no", initialOpdNo)
      
      if (followUpDate) {
        // Match follow-up date with procedure start date
        proceduresQuery = proceduresQuery.eq("start_date", followUpDate)
      }
      
      const { data: proceduresData, error: proceduresError } = await proceduresQuery
      console.log("Procedures data:", proceduresData, "Error:", proceduresError)
      
      if (proceduresData && proceduresData.length > 0) {
        const formattedProcedures = proceduresData.map(proc => {
          return {
            procedure: { procedure_name: proc.procedure_name },
            requirementsString: proc.requirements || "",
            quantity: proc.quantity,
            start_date: proc.start_date,
            end_date: proc.end_date,
            therapist: proc.therapist
          }
        })
        
        // For existing follow-ups, show in read-only view
        setSavedProcedures(formattedProcedures)
        console.log("Set saved procedures:", formattedProcedures)
      }

      // Load internal medications - match follow-up date with medication start_date
      let medicationsQuery = supabase
        .from("internal_medications")
        .select("*")
        .eq("opd_no", initialOpdNo)
      
      if (followUpDate) {
        // Match follow-up date with medication start date
        medicationsQuery = medicationsQuery.eq("start_date", followUpDate)
      }
      
      const { data: medicationsData, error: medicationsError } = await medicationsQuery
      console.log("Medications data:", medicationsData, "Error:", medicationsError)
      
      if (medicationsData && medicationsData.length > 0) {
        const formattedMedications = medicationsData.map(med => ({
          medication: { product_name: med.medication_name },
          dosage: med.dosage,
          frequency: med.frequency,
          start_date: med.start_date,
          end_date: med.end_date,
          notes: med.notes
        }))
        
        // For existing follow-ups, show in read-only view
        setSavedMedications(formattedMedications)
        console.log("Set saved medications:", formattedMedications)
      }
    } else if (initialOpdNo && initialData && initialData.procedures && initialData.medications) {
      // If we have procedures and medications passed directly from the parent component
      if (initialData.procedures.length > 0) {
        const formattedProcedures = initialData.procedures.map((proc: any) => {
          return {
            procedure: { procedure_name: proc.procedure_name },
            requirementsString: proc.requirements || "",
            quantity: proc.quantity,
            start_date: proc.start_date,
            end_date: proc.end_date,
            therapist: proc.therapist
          }
        })
        setSavedProcedures(formattedProcedures)
      }

      if (initialData.medications.length > 0) {
        const formattedMedications = initialData.medications.map((med: any) => ({
          medication: { product_name: med.medication_name },
          dosage: med.dosage,
          frequency: med.frequency,
          start_date: med.start_date,
          end_date: med.end_date,
          notes: med.notes
        }))
        setSavedMedications(formattedMedications)
      }
    }
  }

  // Debounced search for procedures
  useEffect(() => {
    if (procedureSearch.length < 2) { setProcedureResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("procedures").select("*").ilike("procedure_name", `%${procedureSearch}%`)
      setProcedureResults(data || [])
    }
    fetch()
  }, [procedureSearch])

  // Debounced search for medications (for procedures)
  useEffect(() => {
    if (medicationSearch.length < 2) { setMedicationResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${medicationSearch}%`)
      setMedicationResults(data || [])
    }
    fetch()
  }, [medicationSearch])

  // Debounced search for requirements
  useEffect(() => {
    if (requirementSearch.length < 2) { setRequirementResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${requirementSearch}%`)
      setRequirementResults(data || [])
    }
    fetch()
  }, [requirementSearch])

  // Debounced search for internal medications
  useEffect(() => {
    if (internalMedSearch.length < 2) { setInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${internalMedSearch}%`)
      setInternalMedResults(data || [])
    }
    fetch()
  }, [internalMedSearch])

  // Debounced search for edit procedure
  useEffect(() => {
    if (editProcedureSearch.length < 2) { setEditProcedureResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("procedures").select("*").ilike("procedure_name", `%${editProcedureSearch}%`)
      setEditProcedureResults(data || [])
    }
    fetch()
  }, [editProcedureSearch])

  // Debounced search for edit medication (for procedures)
  useEffect(() => {
    if (editMedicationSearch.length < 2) { setEditMedicationResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editMedicationSearch}%`)
      setEditMedicationResults(data || [])
    }
    fetch()
  }, [editMedicationSearch])

  // Debounced search for edit requirement
  useEffect(() => {
    if (editRequirementSearch.length < 2) { setEditRequirementResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editRequirementSearch}%`)
      setEditRequirementResults(data || [])
    }
    fetch()
  }, [editRequirementSearch])

  // Debounced search for edit internal medication
  useEffect(() => {
    if (editInternalMedSearch.length < 2) { setEditInternalMedResults([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from("medications").select("*").ilike("product_name", `%${editInternalMedSearch}%`)
      setEditInternalMedResults(data || [])
    }
    fetch()
  }, [editInternalMedSearch])

  const loadOpdVisits = async () => {
    try {
      console.log("Loading OPD visits...")
      
      const { data, error } = await supabase
        .from("opd_visits")
        .select("opd_no, created_at, uhid")
        .order("created_at", { ascending: false })
        .limit(100) // Limit to recent visits

      if (error) {
        console.error("Error fetching OPD visits:", error)
        throw error
      }

      console.log("OPD visits data:", data)
      
      // Now fetch patient names separately
      if (data && data.length > 0) {
        const uhids = data.map(visit => visit.uhid).filter(Boolean)
        console.log("Fetching patients for UHIDs:", uhids)
        
        const { data: patients, error: patientsError } = await supabase
          .from("patients")
          .select("uhid, full_name")
          .in("uhid", uhids)

        if (patientsError) {
          console.error("Error fetching patients:", patientsError)
          throw patientsError
        }

        console.log("Patients data:", patients)

        // Combine the data
        const visitsWithPatients = data.map(visit => ({
          ...visit,
          patient: patients?.find(p => p.uhid === visit.uhid) || null
        }))

        setOpdVisits(visitsWithPatients || [])
      } else {
        console.log("No OPD visits found")
        setOpdVisits(data || [])
      }
    } catch (error) {
      console.error("Error loading OPD visits:", error)
      toast({ title: "Error", description: "Failed to load OPD visits", variant: "destructive" })
      // Set empty array to prevent crashes
      setOpdVisits([])
    }
  }

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("id, full_name")
        .eq("role", "doctor")
        .order("full_name")

      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error("Error loading doctors:", error)
      toast({ title: "Error", description: "Failed to load doctors", variant: "destructive" })
    }
  }

  const loadCurrentDoctor = async () => {
    try {
      const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null
      
      if (doctorId) {
        const { data, error } = await supabase
          .from("staff")
          .select("id, full_name")
          .eq("id", doctorId)
          .single()

        if (error) throw error
        
        if (data) {
          setCurrentDoctor(data)
          // Auto-fill the doctor_id if not editing
          if (!initialData) {
            setFormData(prev => ({
              ...prev,
              doctor_id: data.id
            }))
          }
        }
      }
    } catch (error) {
      console.error("Error loading current doctor:", error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Add procedure entry
  const handleAddProcedure = () => {
    if (!selectedProcedure) return
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
    ])
    setShowProcedureAdd(false)
    setSelectedProcedure(null)
    setSelectedMedicines([])
    setSelectedRequirements([])
    setProcedureQuantity("")
    setProcedureStartDate("")
    setProcedureEndDate("")
    setProcedureTherapist("")
    setProcedureSearch("")
    setMedicationSearch("")
    setRequirementSearch("")
  }

  const handleRemoveProcedure = (idx: number) => {
    setProcedures(prev => prev.filter((_, i) => i !== idx))
  }

  // Add internal medication entry
  const handleAddInternalMed = () => {
    if (!selectedInternalMed) return
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
    ])
    setShowInternalMedAdd(false)
    setSelectedInternalMed(null)
    setInternalMedSearch("")
    setMedicationDosage("")
    setMedicationFrequency("")
    setMedicationStartDate("")
    setMedicationEndDate("")
    setMedicationNotes("")
  }

  const handleRemoveInternalMed = (idx: number) => {
    setInternalMedications(prev => prev.filter((_, i) => i !== idx))
  }

  // Edit procedure functions
  const handleEditProcedure = (idx: number) => {
    const procedure = procedures[idx]
    setEditingProcedureIndex(idx)
    setEditSelectedProcedure(procedure.procedure)
    setEditProcedureSearch(procedure.procedure.procedure_name)
    
    // Handle both old and new structure for backward compatibility
    if (procedure.medicines) {
      setEditSelectedMedicines(procedure.medicines)
    } else if (procedure.medicine) {
      setEditSelectedMedicines(procedure.medicine ? [procedure.medicine] : [])
    } else {
      setEditSelectedMedicines([])
    }
    
    if (procedure.requirements) {
      setEditSelectedRequirements(procedure.requirements)
    } else if (procedure.requirement) {
      setEditSelectedRequirements(procedure.requirement ? [procedure.requirement] : [])
    } else {
      setEditSelectedRequirements([])
    }
    
    setEditProcedureQuantity(procedure.quantity || "")
    setEditProcedureStartDate(procedure.start_date || "")
    setEditProcedureEndDate(procedure.end_date || "")
    setEditProcedureTherapist(procedure.therapist || "")
  }

  const handleSaveEditedProcedure = () => {
    if (editingProcedureIndex === null || !editSelectedProcedure) return
    
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
    }
    
    setProcedures(prev => prev.map((p, i) => i === editingProcedureIndex ? updatedProcedure : p))
    setEditingProcedureIndex(null)
    
    // Reset edit states
    setEditSelectedProcedure(null)
    setEditProcedureSearch("")
    setEditSelectedMedicines([])
    setEditSelectedRequirements([])
    setEditProcedureQuantity("")
    setEditProcedureStartDate("")
    setEditProcedureEndDate("")
    setEditProcedureTherapist("")
    
    toast({ title: "Updated", description: "Procedure updated successfully." })
  }

  const handleCancelEditProcedure = () => {
    setEditingProcedureIndex(null)
    // Reset edit states
    setEditSelectedProcedure(null)
    setEditProcedureSearch("")
    setEditSelectedMedicines([])
    setEditSelectedRequirements([])
    setEditProcedureQuantity("")
    setEditProcedureStartDate("")
    setEditProcedureEndDate("")
    setEditProcedureTherapist("")
  }

  // Edit internal medication functions
  const handleEditInternalMed = (idx: number) => {
    const medication = internalMedications[idx]
    setEditingMedicationIndex(idx)
    setEditSelectedInternalMed(medication.medication)
    setEditInternalMedSearch(medication.medication.product_name)
    setEditMedicationDosage(medication.dosage || "")
    setEditMedicationFrequency(medication.frequency || "")
    setEditMedicationStartDate(medication.start_date || "")
    setEditMedicationEndDate(medication.end_date || "")
    setEditMedicationNotes(medication.notes || "")
  }

  const handleSaveEditedMedication = () => {
    if (editingMedicationIndex === null || !editSelectedInternalMed) return
    
    const updatedMedication = {
      medication: editSelectedInternalMed,
      dosage: editMedicationDosage,
      frequency: editMedicationFrequency,
      start_date: editMedicationStartDate,
      end_date: editMedicationEndDate,
      notes: editMedicationNotes
    }
    
    setInternalMedications(prev => prev.map((m, i) => i === editingMedicationIndex ? updatedMedication : m))
    setEditingMedicationIndex(null)
    
    // Reset edit states
    setEditSelectedInternalMed(null)
    setEditInternalMedSearch("")
    setEditMedicationDosage("")
    setEditMedicationFrequency("")
    setEditMedicationStartDate("")
    setEditMedicationEndDate("")
    setEditMedicationNotes("")
    
    toast({ title: "Updated", description: "Medication updated successfully." })
  }

  const handleCancelEditMedication = () => {
    setEditingMedicationIndex(null)
    // Reset edit states
    setEditSelectedInternalMed(null)
    setEditInternalMedSearch("")
    setEditMedicationDosage("")
    setEditMedicationFrequency("")
    setEditMedicationStartDate("")
    setEditMedicationEndDate("")
    setEditMedicationNotes("")
  }

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

  const handleRequestRequirements = async (idx: number) => {
    const procedure = procedures[idx];
    if (!procedure || !formData.opd_no) {
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
          opd_no: formData.opd_no,
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
          opd_no: formData.opd_no,
          procedure_entry_id: procedureData.id,
          requirements: requirementsString,
          quantity: procedure.quantity || null,
          requested_by: formData.doctor_id,
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
    if (!savedProcedure || !formData.opd_no) {
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
          opd_no: formData.opd_no,
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
          opd_no: formData.opd_no,
          procedure_entry_id: procedureData.id,
          requirements: requirementsString,
          quantity: savedProcedure.quantity || null,
          requested_by: formData.doctor_id,
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
    if (!medication || !formData.opd_no) {
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
        .eq("opd_no", formData.opd_no)
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
            opd_no: formData.opd_no,
            medication_name: medication.medication.product_name,
            dosage: medication.dosage || null,
            frequency: medication.frequency || null,
            start_date: medication.start_date || new Date().toISOString().split('T')[0],
            end_date: medication.end_date || null,
            notes: medication.notes || null,
            prescribed_by: formData.doctor_id,
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
        .eq("opd_no", formData.opd_no)
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
          opd_no: formData.opd_no,
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
    e.preventDefault()
    
    if (!formData.opd_no || !formData.doctor_id || !formData.notes.trim()) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      let followUpId = null

      if (initialData) {
        // Update existing follow-up
        const { data, error } = await supabase
          .from("opd_follow_up_sheets")
          .update({
            opd_no: formData.opd_no,
            date: formData.date,
            doctor_id: formData.doctor_id,
            notes: formData.notes.trim()
          })
          .eq("id", initialData.id)
          .select()
          .single()

        if (error) throw error
        followUpId = data.id
        toast({ title: "Success", description: "Follow-up updated successfully" })
      } else {
        // Create new follow-up
        const { data, error } = await supabase
          .from("opd_follow_up_sheets")
          .insert([{
            opd_no: formData.opd_no,
            date: formData.date,
            doctor_id: formData.doctor_id,
            notes: formData.notes.trim()
          }])
          .select()
          .single()

        if (error) throw error
        followUpId = data.id
        toast({ title: "Success", description: "Follow-up added successfully" })
      }

      // Save procedures
      if (procedures.length > 0) {
        const procedureEntries = procedures.map(proc => ({
          opd_no: formData.opd_no,
          procedure_name: proc.procedure.procedure_name,
                      requirements: proc.requirementsString || [
              proc.medicines?.map((m: any) => m.product_name).join(", "),
              proc.requirements?.map((r: any) => r.product_name).join(", ")
            ].filter(Boolean).join(", "),
          quantity: proc.quantity,
          start_date: proc.start_date,
          end_date: proc.end_date,
          therapist: proc.therapist,
          created_at: new Date().toISOString()
        }))

        const { error: procedureError } = await supabase
          .from("procedure_entries")
          .insert(procedureEntries)

        if (procedureError) {
          console.error("Error saving procedures:", procedureError)
          toast({ title: "Warning", description: "Follow-up saved but procedures failed to save", variant: "destructive" })
        }
      }

      // Save internal medications
      if (internalMedications.length > 0) {
        const medicationEntries = internalMedications.map(med => ({
          opd_no: formData.opd_no,
          medication_name: med.medication.product_name,
          dosage: med.dosage,
          frequency: med.frequency,
          start_date: med.start_date,
          end_date: med.end_date,
          notes: med.notes,
          prescribed_by: formData.doctor_id,
          created_at: new Date().toISOString()
        }))

        const { error: medicationError } = await supabase
          .from("internal_medications")
          .insert(medicationEntries)

        if (medicationError) {
          console.error("Error saving medications:", medicationError)
          toast({ title: "Warning", description: "Follow-up saved but medications failed to save", variant: "destructive" })
        }
      }

      onSave()
    } catch (error: any) {
      console.error("Error saving follow-up:", error)
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save follow-up", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const formatOpdDisplay = (opd: any) => {
    const date = new Date(opd.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    return `${opd.opd_no} - ${opd.patient?.full_name} (${date})`
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{initialData ? "Edit Follow-up" : "Add New Follow-up"}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <CardDescription>
            {initialData ? "Update the follow-up details" : "Add a new follow-up entry for today"}
          </CardDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opd_no">OPD Number *</Label>
              {initialOpdNo ? (
                <Input
                  value={formData.opd_no}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <Select value={formData.opd_no} onValueChange={(value) => handleChange("opd_no", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select OPD visit" />
                  </SelectTrigger>
                  <SelectContent>
                    {opdVisits.map(visit => (
                      <SelectItem key={visit.opd_no} value={visit.opd_no}>
                        {formatOpdDisplay(visit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Defaults to today's date. You can change it if needed.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor_id">Doctor *</Label>
            {currentDoctor ? (
              <Input
                value={currentDoctor.full_name}
                disabled
                className="bg-muted"
              />
            ) : (
              <Select value={formData.doctor_id} onValueChange={(value) => handleChange("doctor_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                                  {doctors.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            )}
            {currentDoctor && (
              <p className="text-xs text-muted-foreground">
                Automatically set to current logged-in doctor.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Follow-up Notes *</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Enter detailed follow-up notes, observations, progress, recommendations..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include patient progress, symptoms, treatment response, and any recommendations.
            </p>
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
                      setProcedures([...savedProcedures])
                      toast({ title: "Copied", description: "All previously saved procedures copied to editable section." })
                    }}
                  >
                    Copy All to Editable
                  </Button>
                </div>
                <ul className="space-y-3">
                  {savedProcedures.map((p, idx) => (
                    <li key={`saved-proc-${idx}-${p.procedure?.procedure_name}`} className="p-3 border rounded bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-800">{p.procedure?.procedure_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Previously Saved</Badge>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setProcedures(prev => [...prev, p])
                              toast({ title: "Copied", description: "Procedure copied to editable section." })
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
                      setInternalMedications([...savedMedications])
                      toast({ title: "Copied", description: "All previously saved medications copied to editable section." })
                    }}
                  >
                    Copy All to Editable
                  </Button>
                </div>
                <ul className="space-y-3">
                  {savedMedications.map((m, idx) => (
                    <li key={`saved-med-${idx}-${m.medication?.product_name}`} className="p-3 border rounded bg-white">
                                              <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-800 text-lg">{m.medication.product_name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">Previously Saved</Badge>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setInternalMedications(prev => [...prev, m])
                                toast({ title: "Copied", description: "Medication copied to editable section." })
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (initialData ? "Update Follow-up" : "Add Follow-up")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 