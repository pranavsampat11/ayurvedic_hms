// Centralized fallback dummy data for OPD/IPD pages

export function getDummyPatient(opdOrIpdNo: string) {
  const isOPD = typeof opdOrIpdNo === "string" && opdOrIpdNo.startsWith("OPD-");
  return {
    full_name: "Demo Patient",
    age: 35,
    gender: "Male",
    mobile: "9000000000",
    address: "Demo Address, Jaipur",
    uhid: `PAMCH-25-AUG-0001`,
    opd_no: isOPD ? opdOrIpdNo : undefined,
    ipd_no: !isOPD ? opdOrIpdNo : undefined,
    doctor_id: "dr_demo",
    doctor_name: "Dr Demo",
  } as any;
}

export function getDummyOpdCaseSheet(opdNo: string) {
  const today = new Date().toISOString();
  return {
    opd_no: opdNo,
    patient_name: "Demo Patient",
    age: 35,
    gender: "Male",
    contact: "9000000000",
    address: "Demo Address, Jaipur",
    doctor: "Dr Demo",
    department: "Kayachikitsa",
    chief_complaints: "Fever, body ache since 3 days",
    associated_complaints: "Headache",
    past_history: "No significant past history",
    personal_history: "Non-smoker, vegetarian",
    allergy_history: "No known allergies",
    family_history: "Non-contributory",
    general_examination: {},
    systemic_examination: {},
    local_examination: "Within normal limits",
    pain_assessment: "Mild",
    investigations: "CBC, LFT",
    diagnosis: "Viral fever",
    nutritional_status: "normal",
    treatment_plan: "Hydration, rest, paracetamol",
    preventive_aspects: "Hand hygiene, hydration",
    rehabilitation: "NA",
    desired_outcome: "Afebrile in 48 hours",
    created_at: today,
    updated_at: today,
  } as any;
}

export function getDummyFollowUps(opdNo: string) {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  return [
    {
      id: 1,
      opd_no: opdNo,
      date,
      doctor_id: "dr_demo",
      notes: "Patient reviewed. Symptomatically improved.",
      created_at: new Date().toISOString(),
      procedures: [
        { procedure_name: "Abyangam", requirements: "Oil", quantity: "1", start_date: date, end_date: date, therapist: "therapist_1" },
      ],
      medications: [
        { medication_name: "Giloy Juice", dosage: "20 ml", frequency: "BD", start_date: date, end_date: date, notes: "Before food" },
      ],
    },
  ];
}

export function getDummyMedications() {
  return [
    { id: 101, product_name: "Giloy Juice", current_stock: 100, mrp: 120 },
    { id: 102, product_name: "Chyawanprash", current_stock: 80, mrp: 250 },
    { id: 103, product_name: "Ashwagandha Tablets", current_stock: 60, mrp: 180 },
  ];
}

export function getDummyMedicationRequests(opdNo: string) {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      opd_no: opdNo,
      medication_id: 0,
      request_date: now,
      status: "pending",
      internal_medication: {
        medication_name: "Giloy Juice",
        dosage: "20 ml",
        frequency: "BD",
        start_date: now.slice(0, 10),
        end_date: now.slice(0, 10),
        notes: "Before food",
      },
    },
  ] as any[];
}

export function getDummyProcedures(opdOrIpdNo: string) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    { id: 1, procedure_name: "Abyangam", requirements: "Oil", quantity: "1", start_date: date, end_date: date, therapist: "therapist_1" },
  ];
}

export function getDummyTherapists() {
  return [
    { id: "therapist_1", full_name: "Therapist One", role: "therapist" },
    { id: "therapist_2", full_name: "Therapist Two", role: "therapist" },
  ];
}

export function getDummyTherapistAssignments(opdOrIpdNo: string) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    { id: 1, procedure_entry_id: 1, therapist_id: "therapist_1", scheduled_date: date, scheduled_time: "9:00–9:15 am", status: "pending" },
  ];
}

export function getDummyInvestigations(opdOrIpdNo: string) {
  const date = new Date().toISOString().slice(0, 10);
  return [
    { id: 1, requested_investigations: "CBC, LFT", scheduled_date: date, scheduled_time: "10:00–11:00 am", priority: "normal", status: "pending", notes: "Fasting not required" },
  ];
}

// ---------- Seeding helpers for variety ----------
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function dayOffset(isoDate: string, offset: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function monthBounds(baseISO: string): { start: string; end: string } {
  const base = new Date(baseISO);
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function randomDateInMonth(baseISO: string): string {
  const { start, end } = monthBounds(baseISO);
  const s = new Date(start);
  const e = new Date(end);
  const spanDays = Math.floor((e.getTime() - s.getTime()) / (24 * 3600 * 1000)) + 1;
  const offset = Math.floor(Math.random() * spanDays);
  const d = new Date(s);
  d.setDate(s.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const PROCEDURE_TEMPLATES = [
  { procedure_name: "Abyangam", requirements: "Oil" },
  { procedure_name: "Swedana", requirements: "Steam" },
  { procedure_name: "Shirodhara", requirements: "Medicated oil" },
  { procedure_name: "Kati Basti", requirements: "Dough ring, oil" },
  { procedure_name: "Nasyam", requirements: "Medicated drops" },
  { procedure_name: "Patra Pinda Sweda", requirements: "Herbal bolus" },
];

const MED_TEMPLATES = [
  { medication_name: "Giloy Juice", dosage: "20 ml", frequency: "BD", notes: "Before food" },
  { medication_name: "Chyawanprash", dosage: "1 tsp", frequency: "HS", notes: "Bedtime" },
  { medication_name: "Ashwagandha Tabs", dosage: "1 tab", frequency: "BD", notes: "After food" },
  { medication_name: "Triphala Powder", dosage: "1 tsp", frequency: "HS", notes: "With warm water" },
  { medication_name: "Tulsi Drops", dosage: "10 drops", frequency: "TDS", notes: "In warm water" },
];

export function buildSeedProcedures(opdNo: string, baseDateISO: string) {
  const count = 1 + Math.floor(Math.random() * 2); // 1..2
  const rows = Array.from({ length: count }).map((_, i) => {
    const t = pick(PROCEDURE_TEMPLATES);
    const monthStartEnd = monthBounds(baseDateISO);
    const start = randomDateInMonth(baseDateISO);
    // duration 0..3 days but clamp to month end
    const endCandidate = dayOffset(start, Math.floor(Math.random() * 4));
    const end = new Date(endCandidate) > new Date(monthStartEnd.end) ? monthStartEnd.end : endCandidate;
    return {
      opd_no: opdNo,
      procedure_name: t.procedure_name,
      requirements: t.requirements,
      quantity: "1",
      start_date: start,
      end_date: end,
      therapist: `therapist_${1 + Math.floor(Math.random()*3)}`,
    };
  });
  return rows;
}

export function buildSeedMedications(opdNo: string, baseDateISO: string) {
  const count = 1 + Math.floor(Math.random() * 2); // 1..2
  const rows = Array.from({ length: count }).map((_, i) => {
    const t = pick(MED_TEMPLATES);
    const monthStartEnd = monthBounds(baseDateISO);
    const start = randomDateInMonth(baseDateISO);
    // duration 3..6 days, clamp to month end
    const endCandidate = dayOffset(start, 3 + Math.floor(Math.random() * 4));
    const end = new Date(endCandidate) > new Date(monthStartEnd.end) ? monthStartEnd.end : endCandidate;
    return {
      opd_no: opdNo,
      medication_name: t.medication_name,
      dosage: t.dosage,
      frequency: t.frequency,
      start_date: start,
      end_date: end,
      notes: t.notes,
    };
  });
  return rows;
}

// ---------- IPD-specific dummy data ----------
export function getDummyIpdCaseSheet(ipdNo: string) {
  const today = new Date().toISOString();
  return {
    ipd_no: ipdNo,
    patient_name: "Demo IPD Patient",
    age: 45,
    gender: "Female",
    contact: "9000000000",
    address: "Demo Address, Jaipur",
    doctor: "Dr Demo",
    department: "Kayachikitsa",
    ward: "General Ward",
    bed_no: "A-101",
    admission_at: today,
    discharge_at: "",
    present_complaints: "Severe back pain radiating to left leg since 1 week",
    associated_complaints: "Numbness in left foot, difficulty walking",
    past_history: "Hypertension for 5 years, controlled with medication",
    personal_history: "Non-smoker, vegetarian, moderate physical activity",
    obs_gyn_history: "G2P2, last delivery 10 years ago",
    previous_medicine_history: "Amlodipine 5mg OD for hypertension",
    family_history: "Father had diabetes, mother had hypertension",
    height: "165",
    weight: "68",
    bmi: "25.0",
    pulse: "78",
    rr: "18",
    bp: "140/90",
    respiratory_system: "Normal breath sounds, no wheezing",
    cvs: "S1S2 normal, no murmurs",
    cns: "Higher mental functions normal, cranial nerves intact",
    local_examination: "Tenderness over L4-L5 region, positive straight leg raise test",
    sampraptighataka: {},
    pain_assessment: "Severe pain (8/10) on VAS scale",
    investigations: "X-ray Lumbar spine, MRI Lumbar spine, CBC, ESR",
    diagnosis: "Lumbar disc herniation L4-L5 with left L5 radiculopathy",
    nutritional_status: "normal",
    treatment_plan: "Conservative management with Panchakarma therapy, pain management",
    preventive_aspects: "Posture correction, core strengthening exercises",
    rehabilitation: "Physical therapy, ergonomic modifications",
    desired_outcome: "Pain relief, improved mobility, return to normal activities",
    created_at: today,
    updated_at: today,
  } as any;
}

export function getDummyDailyAssessments(ipdNo: string, baseDateISO: string) {
  const { start, end } = monthBounds(baseDateISO);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
  
  return Array.from({ length: Math.min(days, 7) }).map((_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    return {
      ipd_no: ipdNo,
      assessment_date: dateStr,
      general_condition: pick(["Stable", "Improving", "Good", "Fair"]),
      consciousness: pick(["Conscious", "Alert", "Orientated"]),
      temperature: (36.5 + Math.random() * 2).toFixed(1),
      pulse: (70 + Math.random() * 20).toFixed(0),
      bp: `${(110 + Math.random() * 30).toFixed(0)}/${(70 + Math.random() * 20).toFixed(0)}`,
      rr: (16 + Math.random() * 6).toFixed(0),
      spo2: (95 + Math.random() * 5).toFixed(0),
      pain_score: (1 + Math.random() * 9).toFixed(0),
      appetite: pick(["Good", "Fair", "Poor"]),
      sleep: pick(["Good", "Fair", "Poor"]),
      bowel_movement: pick(["Regular", "Constipated", "Diarrhea"]),
      urine_output: pick(["Normal", "Decreased", "Increased"]),
      edema: pick(["None", "Mild", "Moderate"]),
      jaundice: pick(["None", "Mild", "Moderate"]),
      cyanosis: pick(["None", "Present"]),
      clubbing: pick(["None", "Present"]),
      lymphadenopathy: pick(["None", "Present"]),
      skin_rashes: pick(["None", "Present"]),
      neurological_examination: "Higher mental functions normal, cranial nerves intact",
      cardiovascular_examination: "S1S2 normal, no murmurs",
      respiratory_examination: "Normal breath sounds, no wheezing",
      abdominal_examination: "Soft, non-tender, no organomegaly",
      musculoskeletal_examination: "Range of motion normal, no deformities",
      treatment_response: pick(["Good", "Fair", "Poor"]),
      complications: pick(["None", "Mild", "Moderate"]),
      plan_for_today: pick([
        "Continue current treatment",
        "Adjust medication dosage",
        "Start new therapy",
        "Plan discharge",
        "Refer to specialist"
      ]),
      notes: pick([
        "Patient showing good response to treatment",
        "Pain has reduced significantly",
        "Mobility improved",
        "Continue with current regimen",
        "Monitor for any side effects"
      ]),
      created_at: date.toISOString(),
    };
  });
}

export function getDummyPainAssessments(ipdNo: string, baseDateISO: string) {
  const { start, end } = monthBounds(baseDateISO);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
  
  return Array.from({ length: Math.min(days, 7) }).map((_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    return {
      ipd_no: ipdNo,
      assessment_date: dateStr,
      pain_location: pick(["Lower back", "Left leg", "Right leg", "Neck", "Shoulder"]),
      pain_intensity: (1 + Math.random() * 9).toFixed(0),
      pain_quality: pick(["Sharp", "Dull", "Throbbing", "Burning", "Aching"]),
      pain_duration: pick(["Constant", "Intermittent", "Waves", "Brief"]),
      aggravating_factors: pick(["Movement", "Sitting", "Standing", "Lifting", "Walking"]),
      relieving_factors: pick(["Rest", "Medication", "Heat", "Cold", "Position change"]),
      associated_symptoms: pick(["Numbness", "Tingling", "Weakness", "Stiffness", "None"]),
      functional_impact: pick(["Mild", "Moderate", "Severe", "Unable to perform"]),
      sleep_disturbance: pick(["None", "Mild", "Moderate", "Severe"]),
      mood_impact: pick(["None", "Mild", "Moderate", "Severe"]),
      treatment_effectiveness: pick(["Excellent", "Good", "Fair", "Poor"]),
      notes: pick([
        "Pain reduced with medication",
        "Patient reports improvement",
        "Continuing current treatment",
        "May need dose adjustment",
        "Good response to therapy"
      ]),
      created_at: date.toISOString(),
    };
  });
}

export function getDummyBpTprCharts(ipdNo: string, baseDateISO: string) {
  const { start, end } = monthBounds(baseDateISO);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
  
  return Array.from({ length: Math.min(days, 7) }).map((_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    return {
      ipd_no: ipdNo,
      date: dateStr,
      time: pick(["6:00 AM", "9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"]),
      temperature: (36.5 + Math.random() * 2).toFixed(1),
      pulse: (70 + Math.random() * 20).toFixed(0),
      bp_systolic: (110 + Math.random() * 30).toFixed(0),
      bp_diastolic: (70 + Math.random() * 20).toFixed(0),
      rr: (16 + Math.random() * 6).toFixed(0),
      spo2: (95 + Math.random() * 5).toFixed(0),
      notes: pick([
        "Vitals stable",
        "BP slightly elevated",
        "Temperature normal",
        "Pulse rate normal",
        "Oxygen saturation good"
      ]),
      created_at: date.toISOString(),
    };
  });
}

export function getDummyDietSheets(ipdNo: string, baseDateISO: string) {
  const { start, end } = monthBounds(baseDateISO);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
  
  return Array.from({ length: Math.min(days, 7) }).map((_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    return {
      ipd_no: ipdNo,
      date: dateStr,
      meal_type: pick(["Breakfast", "Lunch", "Dinner", "Snack"]),
      food_items: pick([
        "Khichdi, vegetables, buttermilk",
        "Roti, dal, rice, vegetables",
        "Oats, milk, fruits",
        "Soup, bread, vegetables",
        "Rice, dal, vegetables, curd"
      ]),
      quantity: pick(["Full", "Half", "Quarter", "As tolerated"]),
      patient_acceptance: pick(["Good", "Fair", "Poor", "Refused"]),
      special_diet: pick(["Regular", "Low salt", "Low fat", "Diabetic", "None"]),
      restrictions: pick(["No restrictions", "Avoid spicy food", "Low salt", "Low fat", "None"]),
      supplements: pick(["None", "Vitamin D", "Calcium", "Iron", "Multivitamin"]),
      notes: pick([
        "Patient accepting diet well",
        "Appetite improved",
        "Following dietary restrictions",
        "May need diet modification",
        "Good compliance with diet"
      ]),
      created_at: date.toISOString(),
    };
  });
}

export function getDummyMedicationAdministrationCharts(ipdNo: string, baseDateISO: string) {
  const { start, end } = monthBounds(baseDateISO);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
  
  return Array.from({ length: Math.min(days, 7) }).map((_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    
    return {
      ipd_no: ipdNo,
      date: dateStr,
      medication_name: pick(["Amlodipine", "Metformin", "Omeprazole", "Paracetamol", "Ibuprofen"]),
      dosage: pick(["5mg", "500mg", "20mg", "500mg", "400mg"]),
      frequency: pick(["OD", "BD", "TDS", "QID", "HS"]),
      route: pick(["Oral", "IV", "IM", "Subcutaneous", "Topical"]),
      scheduled_time: pick(["6:00 AM", "9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"]),
      administered_time: dateStr + " " + pick(["6:00 AM", "9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"]),
      status: pick(["Given", "Refused", "Held", "Not due"]),
      given_by: pick(["Nurse 1", "Nurse 2", "Nurse 3"]),
      patient_response: pick(["Good", "Fair", "Poor", "None"]),
      side_effects: pick(["None", "Nausea", "Dizziness", "Headache", "Rash"]),
      notes: pick([
        "Medication administered as scheduled",
        "Patient tolerated well",
        "No side effects reported",
        "Dose adjusted as per doctor's order",
        "Patient refused morning dose"
      ]),
      created_at: date.toISOString(),
    };
  });
}

export function buildSeedIpdProcedures(ipdNo: string, baseDateISO: string) {
  const count = 1 + Math.floor(Math.random() * 3); // 1..3
  const rows = Array.from({ length: count }).map((_, i) => {
    const t = pick(PROCEDURE_TEMPLATES);
    const monthStartEnd = monthBounds(baseDateISO);
    const start = randomDateInMonth(baseDateISO);
    // duration 1..5 days but clamp to month end
    const endCandidate = dayOffset(start, 1 + Math.floor(Math.random() * 5));
    const end = new Date(endCandidate) > new Date(monthStartEnd.end) ? monthStartEnd.end : endCandidate;
    return {
      ipd_no: ipdNo,
      procedure_name: t.procedure_name,
      requirements: t.requirements,
      quantity: "1",
      start_date: start,
      end_date: end,
      therapist: `therapist_${1 + Math.floor(Math.random()*3)}`,
    };
  });
  return rows;
}

export function buildSeedIpdMedications(ipdNo: string, baseDateISO: string) {
  const count = 2 + Math.floor(Math.random() * 3); // 2..4
  const rows = Array.from({ length: count }).map((_, i) => {
    const t = pick(MED_TEMPLATES);
    const monthStartEnd = monthBounds(baseDateISO);
    const start = randomDateInMonth(baseDateISO);
    // duration 5..10 days, clamp to month end
    const endCandidate = dayOffset(start, 5 + Math.floor(Math.random() * 6));
    const end = new Date(endCandidate) > new Date(monthStartEnd.end) ? monthStartEnd.end : endCandidate;
    return {
      ipd_no: ipdNo,
      medication_name: t.medication_name,
      dosage: t.dosage,
      frequency: t.frequency,
      start_date: start,
      end_date: end,
      notes: t.notes,
    };
  });
  return rows;
}


