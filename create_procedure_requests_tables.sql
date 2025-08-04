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