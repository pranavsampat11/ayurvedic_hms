#Completely Working With IPD ADMISSIONS DO NOT TOUCH THIS VERSION AS THIS WORKING 
# 1. Install required libraries
!pip install supabase pandas openpyxl

import pandas as pd
from datetime import datetime
from supabase import create_client

# 2. Configure Supabase connection
url = "https://yzmqdruerraecaoblrwv.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bXFkcnVlcnJhZWNhb2Jscnd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAwODI1MCwiZXhwIjoyMDY4NTg0MjUwfQ.UOH4Z8tnrn2z_bJmhG-FdWFEm8sfft4CT0T8L3s18IE"
supabase = create_client(url, key)

# 3. Load Excel file
df = pd.read_excel("patients_filled_may_trial.xlsx")
print("Loaded rows:", len(df))
  
# --- Normalize Department/Sub Department (capitalize only first letter) ---
df["Department"] = df["Department"].str.title().str.strip()
if "Sub Department" in df.columns:
    df["Sub Department"] = df["Sub Department"].str.title().str.strip()

# 4. Build department → doctor mapping from Supabase
staff_resp = supabase.table("staff").select("*").execute()
staff = staff_resp.data

dept_doctor_map = {}
for s in staff:
    if s["role"] == "doctor" and s["department_id"]:
        dept_doctor_map[s["department_id"]] = s["id"]

# 5. Build department name → id map from departments table
dept_resp = supabase.table("departments").select("id, name").execute()
departments = {d["name"]: d["id"] for d in dept_resp.data}

# Sub-departments map
subdept_resp = supabase.table("sub_departments").select("id, name").execute()
sub_departments = {d["name"]: d["id"] for d in subdept_resp.data}

# 6. Insert patients (skip duplicates by UHID)
existing_patients = supabase.table("patients").select("uhid").execute()
existing_uhids = {p["uhid"] for p in existing_patients.data}

patients = df[["uhid", "full_name", "Gender", "Age", "mobile", "aadhar",
               "address", "created_at", "complaints", "Department", "Sub Department"]]

patients = patients.rename(columns={
    "Gender": "gender",
    "Age": "age",
    "aadhar": "aadhaar",
    "Department": "Department",
    "Sub Department": "Sub_Department"
})

new_patients = patients[~patients["uhid"].isin(existing_uhids)]
print(f"Skipping {len(patients) - len(new_patients)} patients (already exist)")
print(f"Inserting {len(new_patients)} new patients")

if not new_patients.empty:
    new_patients = new_patients.where(pd.notnull(new_patients), None)
    supabase.table("patients").insert(new_patients.to_dict(orient="records")).execute()
    print("✅ Inserted new patients")

# 7. Create appointments (skip duplicates by uhid + date)
existing_appts = supabase.table("appointments").select("uhid, appointment_date").execute()
existing_appt_keys = {(a["uhid"], a["appointment_date"]) for a in existing_appts.data}

appointments = []
for idx, row in df.iterrows():
    dept_id = departments.get(row["Department"])
    sub_dept_id = sub_departments.get(row["Sub Department"]) if pd.notna(row.get("Sub Department")) else None
    doctor_id = dept_doctor_map.get(dept_id)

    if not dept_id or not doctor_id:
        print(f"⚠️ Skipping {row['uhid']} - No doctor/department found")
        continue

    appt_date = str(pd.to_datetime(row["created_at"]).date())

    if (row["uhid"], appt_date) in existing_appt_keys:
        print(f"⏭️ Skipping duplicate appointment for {row['uhid']} on {appt_date}")
        continue

    appointments.append({
        "uhid": row["uhid"],
        "department_id": dept_id,
        "sub_department_id": sub_dept_id,
        "doctor_id": doctor_id,
        "appointment_date": appt_date,
        "reason": row.get("complaints", "Checkup"),
        "status": "seen"
    })

appointments_inserted = []
if appointments:
    resp = supabase.table("appointments").insert(appointments).execute()
    appointments_inserted = resp.data
print("✅ Inserted appointments:", len(appointments_inserted))

# 8. Insert OPD visits (only for new appointments)
opd_visits = {}

def make_opd_no(date, seq):
    return f"OPD-{date.strftime('%Y%m%d')}-{seq:04d}"

counts = {}

for appt in appointments_inserted:
    date = datetime.fromisoformat(appt["appointment_date"]).date()

    if date not in counts:
        existing_opds = supabase.table("opd_visits") \
            .select("opd_no") \
            .ilike("opd_no", f"OPD-{date.strftime('%Y%m%d')}-%") \
            .execute()

        max_seq = 0
        for e in existing_opds.data:
            try:
                seq = int(e["opd_no"].split("-")[-1])
                max_seq = max(max_seq, seq)
            except:
                pass
        counts[date] = max_seq

    counts[date] += 1
    opd_no = make_opd_no(date, counts[date])

    if opd_no not in opd_visits:
        opd_visits[opd_no] = {
            "opd_no": opd_no,
            "uhid": appt["uhid"],
            "appointment_id": appt["id"],
            "visit_date": str(date)
        }

# 9. Admit some OPD patients into IPD (skip duplicates)
import random
from datetime import timedelta

def make_ipd_no(date, seq):
    return f"IPD-{date.strftime('%Y%m%d')}-{seq:04d}"

def admit_random_patients_to_ipd(supabase, df, new_opd_visits, n=10):
    # Use only the newly created OPD visits, not all from database
    if not new_opd_visits:
        print("⚠️ No new OPD visits to admit.")
        return

    print(f"🔍 Working with {len(new_opd_visits)} newly created OPD visits")
    
    # Fetch already admitted opd_no
    existing_adm = supabase.table("ipd_admissions").select("opd_no, ipd_no").execute().data
    admitted_opds = {adm["opd_no"] for adm in existing_adm}

    # Build date → last admission seq map
    counts = {}
    for adm in existing_adm:
        try:
            seq = int(adm["ipd_no"].split("-")[-1])
            date_str = adm["ipd_no"].split("-")[1]  # YYYYMMDD
            counts[date_str] = max(counts.get(date_str, 0), seq)
        except:
            continue

    # Filter OPDs not yet admitted
    available_opds = [opd for opd in new_opd_visits if opd["opd_no"] not in admitted_opds]
    if not available_opds:
        print("⚠️ All OPD visits already admitted.")
        return

    # Pick random subset
    selected_opds = random.sample(available_opds, min(n, len(available_opds)))

    # Fetch appointments for selected OPDs
    appt_ids = [opd["appointment_id"] for opd in selected_opds]
    appts = supabase.table("appointments").select("*").in_("id", appt_ids).execute().data
    appt_map = {a["id"]: a for a in appts}

    # Random assignment pools
    wards = ["General", "Semi-Private", "Private", "ICU"]
    reasons = ["Fever", "Surgery", "Observation", "Infection", "Accident", "Chronic illness"]

    admissions = []

    for opd in selected_opds:
        appt = appt_map.get(opd["appointment_id"])
        if not appt:
            continue

        # Get admission_date = created_at from Excel
        created_at = df.loc[df["uhid"] == opd["uhid"], "created_at"].values
        if len(created_at) == 0:
            continue
        admission_date = pd.to_datetime(created_at[0]).date()

        # Discharge date = admission_date + random days
        discharge_date = admission_date + pd.Timedelta(days=random.randint(2, 7))

        # Generate ipd_no
        date_str = admission_date.strftime("%Y%m%d")
        counts[date_str] = counts.get(date_str, 0) + 1
        ipd_no = f"IPD-{date_str}-{counts[date_str]:04d}"

        admissions.append({
            "ipd_no": ipd_no,
            "uhid": opd["uhid"],
            "opd_no": opd["opd_no"],
            "doctor_id": appt["doctor_id"],
            "ward": random.choice(wards),
            "bed_number": f"{random.choice(['G','S','P','ICU'])}-{random.randint(1,30)}",
            "admission_date": str(admission_date),
            "discharge_date": str(discharge_date),
            "admission_reason": random.choice(reasons),
            "status": "discharged",
            "deposit_amount": random.choice([500, 1000, 2000])
        })

    if admissions:
        resp = supabase.table("ipd_admissions").insert(admissions).execute()
        print(f"✅ Inserted {len(resp.data)} new IPD admissions")
    else:
        print("⚠️ No admissions created.")

# Insert OPD visits first
if opd_visits:
    resp2 = supabase.table("opd_visits").insert(list(opd_visits.values())).execute()
    print("✅ Inserted OPD visits:", len(resp2.data))
    
    # Store the newly created OPD visits for IPD admission
    newly_created_opd_visits = resp2.data
else:
    newly_created_opd_visits = []

# Call function to create IPD admissions (pass only new OPD visits)
print("🚀 Starting IPD admission process...")
admit_random_patients_to_ipd(supabase, df, newly_created_opd_visits, n=1)  # Changed to n=1 for testing

print("🎉 All done successfully!")