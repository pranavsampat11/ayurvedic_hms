-- 1. patients
CREATE TABLE patients (
    uhid TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    mobile TEXT,
    aadhaar TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);



-- 2. departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 3. sub_departments
CREATE TABLE sub_departments (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id),
    name TEXT NOT NULL,
    UNIQUE(department_id, name)
);

-- 4. staff
CREATE TABLE staff (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    role TEXT, -- doctor, pharmacist, etc.
    department_id INTEGER REFERENCES departments(id),
    sub_department_id INTEGER REFERENCES sub_departments(id),
    mobile TEXT
);

-- 5. Procedures
CREATE TABLE IF NOT EXISTS procedures (
  id text PRIMARY KEY,
  pk_number integer GENERATED ALWAYS AS (CAST(SUBSTRING(id FROM 4) AS INTEGER)) STORED,
  procedure_name text NOT NULL,
  charges_per_day text,
  charges_for_8_day_course text
);

--6 medications
CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    current_stock NUMERIC,
    mrp NUMERIC
);



-- 7. appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    uhid TEXT REFERENCES patients(uhid),
    department_id INTEGER REFERENCES departments(id),
    sub_department_id INTEGER REFERENCES sub_departments(id),
    doctor_id TEXT REFERENCES staff(id),
    appointment_date DATE,
    reason TEXT,
    status TEXT DEFAULT 'pending'
);

-- 8. opd_visits
CREATE TABLE opd_visits (
    opd_no TEXT PRIMARY KEY,
    uhid TEXT REFERENCES patients(uhid),
    appointment_id INTEGER REFERENCES appointments(id),
    visit_date DATE DEFAULT CURRENT_DATE
);

-- 9. ipd_admissions
CREATE TABLE ipd_admissions (
    ipd_no TEXT PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    uhid TEXT REFERENCES patients(uhid),
    admission_date DATE,
    discharge_date DATE,
    ward TEXT,
    bed_number TEXT,
    admission_reason TEXT,
    doctor_id TEXT REFERENCES staff(id),
    deposit_amount NUMERIC,
    status TEXT DEFAULT 'active'
);

-- 10. opd_case_sheets
CREATE TABLE opd_case_sheets (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    doctor_id TEXT REFERENCES staff(id),
    patient_name TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    contact TEXT,
    address TEXT,
    doctor TEXT,
    department TEXT,
    chief_complaints TEXT,
    associated_complaints TEXT,
    past_history TEXT,
    personal_history TEXT,
    allergy_history TEXT,
    family_history TEXT,
    obs_gyn_history TEXT,
    general_examination JSONB,
    systemic_examination JSONB,
    local_examination TEXT,
    pain_assessment TEXT,
    investigations TEXT,
    diagnosis TEXT,
    nutritional_status TEXT CHECK (
        nutritional_status IN ('normal', 'mild malnutrition', 'moderate malnutrition', 'severe malnutrition')
    ),
    treatment_plan TEXT,
    preventive_aspects TEXT,
    rehabilitation TEXT,
    desired_outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. ipd_case_sheets
CREATE TABLE ipd_case_sheets (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    opd_no TEXT REFERENCES opd_visits(opd_no),
    doctor_id TEXT REFERENCES staff(id),
    department TEXT,
    ward TEXT,
    bed_no TEXT,
    admission_at TIMESTAMPTZ DEFAULT now(),
    discharge_at TIMESTAMPTZ,
    doa_time TEXT,
    dod_time TEXT,
    op_no TEXT,
    ip_no TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    occupation TEXT,
    address TEXT,
    contact TEXT,
    present_complaints TEXT,
    associated_complaints TEXT,
    past_history TEXT,
    personal_history TEXT,
    obs_gyn_history TEXT,
    previous_medicine_history TEXT,
    family_history TEXT,
    general_examination JSONB,
    dasavidha_pariksha JSONB,
    asthasthana_pariksha JSONB,
    systemic_examination JSONB,
    local_examination TEXT,
    sampraptighataka JSONB,
    pain_assessment TEXT,
    investigations TEXT,
    diagnosis TEXT,
    nutritional_status TEXT CHECK (
        nutritional_status IN ('normal', 'mild malnutrition', 'moderate malnutrition', 'severe malnutrition')
    ),
    treatment_plan TEXT,
    preventive_aspects TEXT,
    rehabilitation TEXT,
    desired_outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. opd_follow_up_sheets
CREATE TABLE opd_follow_up_sheets (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    date DATE,
    doctor_id TEXT REFERENCES staff(id),
    notes TEXT
);

-- 13. ipd_daily_assessments
CREATE TABLE ipd_daily_assessments (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    date DATE,
    doctor_id TEXT REFERENCES staff(id),
    assessment TEXT,
    advice TEXT
);

-- 14. pain_assessments
CREATE TABLE pain_assessments (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    location TEXT,
    intensity TEXT,
    character TEXT,
    frequency TEXT,
    duration TEXT,
    radiation TEXT,
    triggers TEXT,
    current_management TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 15. pain_monitoring_charts
CREATE TABLE pain_monitoring_charts (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    date_time TIMESTAMP,
    pain_score INTEGER,
    intervention TEXT,
    outcome TEXT,
    side_effects TEXT,
    advice TEXT,
    staff_id TEXT REFERENCES staff(id)
);

-- 16. bp_tpr_charts
CREATE TABLE bp_tpr_charts (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    date_time TIMESTAMP,
    temperature NUMERIC,
    pulse INTEGER,
    respiratory_rate INTEGER,
    bp TEXT,
    nurse_id TEXT REFERENCES staff(id)
);

-- 17. nursing_rounds
CREATE TABLE nursing_rounds (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    date_time TIMESTAMP,
    nurse_id TEXT REFERENCES staff(id),
    notes TEXT
);

-- 18. diet_sheets
CREATE TABLE diet_sheets (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    date DATE,
    time TIME,
    diet TEXT,
    notes TEXT
);

-- 19. procedure_entries
CREATE TABLE procedure_entries (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    procedure_name TEXT,
    requirements TEXT,
    quantity TEXT,
    start_date DATE,
    end_date DATE,
    therapist TEXT
);

-- 20. internal_medications
CREATE TABLE internal_medications (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    medication_name TEXT,
    dosage TEXT,
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    prescribed_by TEXT REFERENCES staff(id)
);

-- 21. medication_dispense_requests
CREATE TABLE medication_dispense_requests (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    medication_id INTEGER REFERENCES internal_medications(id),
    request_date TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

-- 22. dispensed_medications
CREATE TABLE dispensed_medications (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES medication_dispense_requests(id),
    dispensed_by TEXT REFERENCES staff(id),
    dispensed_date TIMESTAMP DEFAULT NOW()
);

-- 23. billing_records
CREATE TABLE billing_records (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    bill_date TIMESTAMP DEFAULT NOW(),
    description TEXT,
    amount NUMERIC
);

-- 24. referred_assessments
CREATE TABLE referred_assessments (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    referred_by_id TEXT REFERENCES staff(id),
    referred_to_id TEXT REFERENCES staff(id),
    department TEXT,
    assessment_note TEXT,
    advice TEXT,
    recommended_procedures TEXT,
    recommended_meds TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE billing_records
ADD COLUMN opd_no TEXT REFERENCES opd_visits(opd_no);


-- 25. Opd to Ipd Requests 
CREATE TABLE opd_to_ipd_requests (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    uhid TEXT REFERENCES patients(uhid),
    doctor_id TEXT REFERENCES staff(id),
    requested_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by TEXT REFERENCES staff(id),
    approved_at TIMESTAMP,
    notes TEXT
);


-- 26. procedure_medicine_requirement_requests
CREATE TABLE procedure_medicine_requirement_requests (
    id SERIAL PRIMARY KEY,
    opd_no TEXT REFERENCES opd_visits(opd_no),
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    procedure_entry_id INTEGER REFERENCES procedure_entries(id),
    requirements TEXT NOT NULL, -- medicines and requirements combined
    quantity TEXT,
    request_date TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'dispensed'
    requested_by TEXT REFERENCES staff(id),
    notes TEXT
);

-- 27. dispensed_procedure_requirements
CREATE TABLE dispensed_procedure_requirements (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES procedure_medicine_requirement_requests(id),
    dispensed_by TEXT REFERENCES staff(id),
    dispensed_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- 28. medication_administration_charts
CREATE TABLE medication_administration_charts (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 29. medication_administration_entries
CREATE TABLE medication_administration_entries (
    id SERIAL PRIMARY KEY,
    chart_id INTEGER REFERENCES medication_administration_charts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TEXT CHECK (time_slot IN ('M', 'A', 'E', 'N')),
    administered BOOLEAN DEFAULT FALSE,
    administered_at TIMESTAMP,
    administered_by TEXT REFERENCES staff(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 30. procedure_sessions
CREATE TABLE procedure_sessions (
    id SERIAL PRIMARY KEY,
    ipd_no TEXT REFERENCES ipd_admissions(ipd_no),
    procedure_entry_id INTEGER REFERENCES procedure_entries(id),
    session_date DATE NOT NULL,
    
    -- Pre-procedure vitals (as text for flexibility)
    pre_vitals TEXT,
    
    -- Post-procedure vitals (as text for flexibility)
    post_vitals TEXT,
    
    -- Procedure details
    procedure_note TEXT,
    performed_by TEXT REFERENCES staff(id),
    
    -- Additional fields
    session_duration_minutes INTEGER,
    complications TEXT,
    patient_response TEXT,
    next_session_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

--31 discharge summaries
CREATE TABLE discharge_summaries (
    id SERIAL PRIMARY KEY,
    ipd_no VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    doctor_name VARCHAR(255),
    patient_name VARCHAR(255),
    age VARCHAR(50),
    sex VARCHAR(50),
    uhid_no VARCHAR(255),
    ip_no VARCHAR(255),
    ward_bed_no VARCHAR(255),
    date_of_admission DATE,
    time_of_admission TIME,
    date_of_discharge DATE,
    time_of_discharge TIME,
    complaints TEXT,
    history_brief TEXT,
    significant_findings TEXT,
    investigation_results TEXT,
    diagnosis TEXT,
    condition_at_discharge TEXT,
    course_in_hospital TEXT,
    procedures_performed TEXT,
    medications_administered TEXT,
    other_treatment TEXT,
    discharge_medications TEXT,
    other_instructions TEXT,
    follow_up_period VARCHAR(255),
    urgent_care_instructions TEXT,
    doctor_signature VARCHAR(255),
    patient_signature VARCHAR(255),
    summary_prepared_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--32 therapist assigmnments 
CREATE TABLE IF NOT EXISTS therapist_assignments (
  id SERIAL PRIMARY KEY,

  -- Link to exactly one visit type
  opd_no TEXT REFERENCES opd_visits(opd_no),
  ipd_no TEXT REFERENCES ipd_admissions(ipd_no),

  procedure_entry_id INTEGER REFERENCES procedure_entries(id) ON DELETE SET NULL,

  therapist_id TEXT NOT NULL REFERENCES staff(id),
  doctor_id    TEXT         REFERENCES staff(id),

  scheduled_time TEXT,      -- free text like "6:00–6:15 am"
  notes          TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed')),

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Enforce either OPD or IPD (not both)
  CONSTRAINT therapist_assignments_visit_xor CHECK (
    (opd_no IS NOT NULL AND ipd_no IS NULL) OR
    (opd_no IS NULL AND ipd_no IS NOT NULL)
  )
);

-- Add scheduled_date column to therapist_assignments table
ALTER TABLE therapist_assignments 
ADD COLUMN scheduled_date DATE;

CREATE INDEX IF NOT EXISTS idx_therapist_assignments_therapist ON therapist_assignments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_assignments_opd       ON therapist_assignments(opd_no);
CREATE INDEX IF NOT EXISTS idx_therapist_assignments_ipd       ON therapist_assignments(ipd_no);


-- 33. requested_investigations
CREATE TABLE IF NOT EXISTS requested_investigations (
  id SERIAL PRIMARY KEY,

  -- Link to exactly one visit type
  opd_no TEXT REFERENCES opd_visits(opd_no),
  ipd_no TEXT REFERENCES ipd_admissions(ipd_no),

  -- Investigation details
  requested_investigations TEXT NOT NULL, -- text field for investigation names
  doctor_id TEXT NOT NULL REFERENCES staff(id), -- doctor requesting the investigation
  
  -- Scheduling
  scheduled_date DATE, -- when the investigation should be done
  scheduled_time TEXT, -- optional time like "9:00-10:00 am"
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Additional info
  notes TEXT, -- any additional notes
  priority TEXT DEFAULT 'normal' 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Enforce either OPD or IPD (not both)
  CONSTRAINT requested_investigations_visit_xor CHECK (
    (opd_no IS NOT NULL AND ipd_no IS NULL) OR
    (opd_no IS NULL AND ipd_no IS NOT NULL)
  )
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_requested_investigations_opd ON requested_investigations(opd_no);
CREATE INDEX IF NOT EXISTS idx_requested_investigations_ipd ON requested_investigations(ipd_no);
CREATE INDEX IF NOT EXISTS idx_requested_investigations_doctor ON requested_investigations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_requested_investigations_date ON requested_investigations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_requested_investigations_status ON requested_investigations(status);

-
ALTER TABLE opd_case_sheets 
ADD COLUMN height TEXT,
ADD COLUMN weight TEXT,
ADD COLUMN bmi TEXT,
ADD COLUMN pulse TEXT,
ADD COLUMN rr TEXT,
ADD COLUMN bp TEXT,
ADD COLUMN respiratory_system TEXT,
ADD COLUMN cvs TEXT,
ADD COLUMN cns TEXT;

ALTER TABLE ipd_case_sheets 
ADD COLUMN height TEXT,
ADD COLUMN weight TEXT,
ADD COLUMN bmi TEXT,
ADD COLUMN pulse TEXT,
ADD COLUMN rr TEXT,
ADD COLUMN bp TEXT,
ADD COLUMN respiratory_system TEXT,
ADD COLUMN cvs TEXT,
ADD COLUMN cns TEXT;

ALTER TABLE opd_follow_up_sheets 
ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();


-- Add created_at column to procedure_entries table
ALTER TABLE procedure_entries 
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

-- Add created_at column to internal_medications table
ALTER TABLE internal_medications 
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE ipd_case_sheets 
ADD COLUMN uhid TEXT

ALTER TABLE ipd_daily_assessments 
ADD COLUMN time TIME;


ALTER TABLE referred_assessments 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'declined', 'cancelled')),
ADD COLUMN response_at TIMESTAMP,
ADD COLUMN response_note TEXT,
ADD COLUMN response_assessment TEXT,
ADD COLUMN response_advice TEXT,
ADD COLUMN response_procedures TEXT,
ADD COLUMN response_medications TEXT,
ADD COLUMN follow_up_date DATE,
ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN reminder_sent_at TIMESTAMP,
ADD COLUMN reminder_count INTEGER DEFAULT 0;




