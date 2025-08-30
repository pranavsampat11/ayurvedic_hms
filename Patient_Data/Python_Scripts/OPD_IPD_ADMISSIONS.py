#Completely Working With IPD ADMISSIONS CODE FROM CURSOR TESTING PHASE 
# 1. Install required libraries
!pip install supabase pandas openpyxl

import pandas as pd
from datetime import datetime
from supabase import create_client

# 2. Configure Supabase connection
url = "https://yzmqdruerraecaoblrwv.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bXFkcnVlcnJhZWNhb2Jscnd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAwODI1MCwiZXhwIjoyMDY4NTg0MjUwfQ.UOH4Z8tnrn2z_bJmhG-FdWFEm8sfft4CT0T8L3s18IE"  # Replace with your actual Service Role Key
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
# Fetch existing appointments from Supabase
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

    # If first time for this date, check existing max sequence in DB
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
        counts[date] = max_seq  # start after the last used number

    # Increment sequence
    counts[date] += 1
    opd_no = make_opd_no(date, counts[date])

    if opd_no not in opd_visits:  # prevent duplicates in same run
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

def admit_random_patients_to_ipd(supabase, df, n=10):
    # Fetch OPD visits
    opd_visits = supabase.table("opd_visits").select("*").execute().data
    if not opd_visits:
        print("⚠️ No OPD visits found to admit.")
        return

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
    available_opds = [opd for opd in opd_visits if opd["opd_no"] not in admitted_opds]
    if not available_opds:
        print("⚠️ All OPD visits already admitted.")
        return

    # Pick random subset
    import random
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



if opd_visits:
    resp2 = supabase.table("opd_visits").insert(list(opd_visits.values())).execute()
    print("✅ Inserted OPD visits:", len(resp2.data))

# Call function (admit up to 50 patients)
admit_random_patients_to_ipd(supabase,df,n=600)

print("🎉 All done successfully!")

# ---------------------- PHASE 2: Seed IPD sections ----------------------
import random
from datetime import date, timedelta
try:
    from dateutil import parser
except Exception:
    parser = None

def ensure_date_iso(v):
    if not v:
        return None
    try:
        if parser:
            return parser.parse(str(v)).date().isoformat()
        # Fallback
        return str(pd.to_datetime(v).date())
    except Exception:
        return None

def month_bounds(base_iso):
    d = pd.to_datetime(base_iso).date()
    start = d.replace(day=1)
    if d.month == 12:
        next_month = date(d.year + 1, 1, 1)
    else:
        next_month = date(d.year, d.month + 1, 1)
    end = next_month - timedelta(days=1)
    return start, end

def random_date_in_month(base_iso):
    start, end = month_bounds(base_iso)
    days = (end - start).days
    return (start + timedelta(days=random.randint(0, days))).isoformat()

def rand_text(options):
    return random.choice(options)

def pick_from_list(options, kmin=1, kmax=2):
    if not options:
        return ""
    k = random.randint(kmin, kmax)
    k = min(k, len(options))
    return ", ".join(random.sample(options, k))

# External catalogs from Excel exports
MEDS_XLSX = r"C:\Users\rahul prakash\Desktop\AYURVEDIC_HMS\Patient_Data\medications_export.xlsx"
PROCS_XLSX = r"C:\Users\rahul prakash\Desktop\AYURVEDIC_HMS\Patient_Data\procedures_export.xlsx"

def safe_read_xlsx(path):
    try:
        return pd.read_excel(path)
    except Exception:
        return pd.DataFrame()

def delete_then_insert(table, where_col, where_val, rows):
    supabase.table(table).delete().eq(where_col, where_val).execute()
    if rows:
        supabase.table(table).insert(rows).execute()

def delete_med_dispense_chain(ipd_no: str):
    # Delete dispensed_medications -> medication_dispense_requests for this IPD
    req_ids = supabase.table("medication_dispense_requests").select("id").eq("ipd_no", ipd_no).execute().data or []
    ids = [r["id"] for r in req_ids]
    if ids:
        supabase.table("dispensed_medications").delete().in_("request_id", ids).execute()
    supabase.table("medication_dispense_requests").delete().eq("ipd_no", ipd_no).execute()

def delete_proc_req_chain(ipd_no: str):
    # Delete dispensed_procedure_requirements -> procedure_medicine_requirement_requests for this IPD
    req_ids = supabase.table("procedure_medicine_requirement_requests").select("id").eq("ipd_no", ipd_no).execute().data or []
    ids = [r["id"] for r in req_ids]
    if ids:
        supabase.table("dispensed_procedure_requirements").delete().in_("request_id", ids).execute()
    supabase.table("procedure_medicine_requirement_requests").delete().eq("ipd_no", ipd_no).execute()

def delete_med_admin_chain(ipd_no: str):
    # Delete medication_administration_entries -> medication_administration_charts for this IPD
    charts = supabase.table("medication_administration_charts").select("id").eq("ipd_no", ipd_no).execute().data or []
    ids = [c["id"] for c in charts]
    if ids:
        supabase.table("medication_administration_entries").delete().in_("chart_id", ids).execute()
    supabase.table("medication_administration_charts").delete().eq("ipd_no", ipd_no).execute()

def get_patient_demographics(uhid):
    res = supabase.table("patients").select("full_name, age, gender, mobile, address").eq("uhid", uhid).maybe_single().execute()
    data = res.data or {}
    return {
        "patient_name": data.get("full_name"),
        "age": data.get("age"),
        "gender": data.get("gender"),
        "contact": data.get("mobile"),
        "address": data.get("address"),
    }

def get_doctor_department_name(doctor_id):
    if not doctor_id:
        return None
    s = supabase.table("staff").select("department_id").eq("id", doctor_id).maybe_single().execute().data or {}
    dept_id = s.get("department_id")
    if not dept_id:
        return None
    d = supabase.table("departments").select("name").eq("id", dept_id).maybe_single().execute().data or {}
    return d.get("name")

def fetch_admissions_all():
    return supabase.table("ipd_admissions").select("*").execute().data or []

def fetch_latest_appointment(uhid):
    res = supabase.table("appointments").select("*").eq("uhid", uhid).order("appointment_date", desc=True).limit(1).execute()
    arr = res.data or []
    return arr[0] if arr else None

def fetch_staff_maps():
    data = supabase.table("staff").select("*").execute().data or []
    therapists_by_dept, nurses, staff_all = {}, [], []
    for s in data:
        staff_all.append(s)
        if s.get("role") == "therapist":
            therapists_by_dept.setdefault(s.get("department_id"), []).append(s)
        if s.get("role") == "nurse":
            nurses.append(s)
    return therapists_by_dept, nurses, staff_all

def build_ipd_case_sheet(adm, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    demo = get_patient_demographics(adm["uhid"])
    gender = (demo.get("gender") or "").strip().title()
    dept_name = get_doctor_department_name(adm.get("doctor_id"))

    present_opts = [
        "Low back pain","Knee pain","Headache","Neck stiffness","Generalized weakness",
        "Fever","Cough","Abdominal pain","Joint stiffness","Tingling in limbs"
    ]
    assoc_opts = [
        "Nausea","Vomiting","Dizziness","Loss of appetite","Sleep disturbance",
        "Fatigue","Constipation","Acidity","Muscle cramps","Swelling"
    ]
    gyn_opts = [
        "Irregular cycles","Dysmenorrhea","Menorrhagia","Leucorrhea","PMS symptoms","No significant OBG history"
    ]

    row = {
        "ipd_no": adm["ipd_no"],
        "opd_no": adm.get("opd_no"),
        "doctor_id": adm.get("doctor_id"),
        "department": dept_name,
        "ward": adm.get("ward"),
        "bed_no": adm.get("bed_number"),
        "admission_at": f"{anchor_date_iso}T09:00:00Z",
        "discharge_at": f"{ensure_date_iso(adm.get('discharge_date'))}T17:00:00Z" if adm.get("discharge_date") else None,
        "doa_time": "09:00",
        "dod_time": "17:00" if adm.get("discharge_date") else None,
        "op_no": adm.get("opd_no"),
        "ip_no": adm["ipd_no"],

        "age": demo.get("age"),
        "gender": demo.get("gender"),
        "occupation": "Unknown",
        "address": demo.get("address"),
        "contact": demo.get("contact"),

        "present_complaints": pick_from_list(present_opts, 1, 3),
        "associated_complaints": pick_from_list(assoc_opts, 1, 3),
        "past_history": rand_text(["Nil","Diabetes","Hypertension","Asthma"]),
        "personal_history": rand_text(["Vegetarian","Mixed diet"]),
        "obs_gyn_history": rand_text(gyn_opts) if gender == "Female" else None,
        "previous_medicine_history": rand_text(["Occasional analgesics","Ayurvedic meds","None"]),
        "family_history": rand_text(["Nil","Similar complaints in family"]),

        "general_examination": {"bp": "120/80", "pulse": random.randint(72, 92), "spo2": random.randint(96, 99)},
        "dasavidha_pariksha": {
            "prakriti": rand_text(["Vata","Pitta","Kapha","Vata-Pitta"]),
            "vikriti": rand_text(["Vata","Pitta","Kapha"]),
            "sara": rand_text(["Mamsa","Rakta","Meda"]),
            "samhanana": rand_text(["Madhyama","Sthira"]),
            "pramana": rand_text(["Madhyama","Alpa"]),
            "satmya": rand_text(["Madhura","Lavanya","Mixed"]),
            "satva": rand_text(["Madhyama","Avara","Pravara"]),
            "ahara_shakti": rand_text(["Madhyama","Avara"]),
            "vyayama_shakti": rand_text(["Madhyama","Avara"]),
            "vaya": rand_text(["Yuva","Madhyama","Vriddha"]),
        },
        "asthasthana_pariksha": {
            "nadi": rand_text(["Vata","Pitta","Kapha"]),
            "mala": rand_text(["Samyaka","Alpa","Krura"]),
            "mutra": rand_text(["Samyaka","Alpa"]),
            "jihva": rand_text(["Nirmala","Saama"]),
            "shabda": rand_text(["Samyaka"]),
            "sparsha": rand_text(["Samashita","Ushna"]),
            "drik": rand_text(["Prakrita"]),
            "aakruti": rand_text(["Madhyama","Sthula","Krisha"]),
        },
        "sampraptighataka": {
            "dosha": rand_text(["Vata","Pitta","Kapha"]),
            "dushya": rand_text(["Mamsa","Rakta","Meda","Asthi"]),
            "srotas": rand_text(["Mamsavaha","Raktavaha","Meda"]),
            "agni": rand_text(["Mandagni","Vishamagni","Tikshnagni"]),
            "ama": rand_text(["Present","Absent"]),
            "sthana_samsraya": rand_text(["Kati","Janu","Greeva"]),
            "udbhava_sthana": rand_text(["Pakwashaya","Amashaya"]),
            "vyakta_sthana": rand_text(["Kati","Janu","Greeva"]),
            "sanchara": rand_text(["Yes","No"]),
            "vyadhi_marga": rand_text(["Bahya","Madhyama","Abhyantara"]),
            "rogamarga": rand_text(["Madhyama"]),
            "sadhya_asadhyata": rand_text(["Sadhya","Krichra Sadhya","Asadhya"]),
        },
        "pain_assessment": rand_text(["VAS 4/10","VAS 6/10","VAS 7/10"]),
        "investigations": rand_text(["CBC, RFT","X-Ray","MRI as advised"]),
        "diagnosis": rand_text(["Vata vyadhi","Pitta vyadhi","Kapha vyadhi"]),
        "nutritional_status": rand_text(["normal","mild malnutrition"]),
        "treatment_plan": rand_text(["Abhyanga + internal meds","Physiotherapy + meds"]),
        "preventive_aspects": rand_text(["Posture advice","Back strengthening"]),
        "rehabilitation": rand_text(["Physiotherapy","Home exercise program"]),
        "desired_outcome": rand_text(["Pain reduction","Improved mobility"]),
    }
    delete_then_insert("ipd_case_sheets", "ipd_no", adm["ipd_no"], [row])

def build_internal_meds(adm, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    # Prefer Excel export; fallback to DB
    meds_df = safe_read_xlsx(MEDS_XLSX)
    if not meds_df.empty and "product_name" in meds_df.columns:
        names = [str(x) for x in meds_df["product_name"].dropna().unique().tolist()]
    else:
        meds = supabase.table("medications").select("product_name").limit(100).execute().data or []
        names = [m["product_name"] for m in meds] or ["Ashwagandha","Triphala","Guggulu","Punarnava","Haridra","Shatavari"]
    rows = []
    count = random.randint(2, 4)
    for i in range(count):
        start = anchor_date_iso if i == 0 else random_date_in_month(base)
        s = pd.to_datetime(start).date()
        mb_s, mb_e = month_bounds(base)
        end = (s + timedelta(days=random.randint(0, max(0, (mb_e - s).days)))).isoformat()
        rows.append({
            "ipd_no": adm["ipd_no"],
            "medication_name": random.choice(names),
            "dosage": rand_text(["1 tab","2 tabs","10 ml","500 mg"]),
            "frequency": rand_text(["OD","BD","TDS","HS","QID"]),
            "start_date": start,
            "end_date": end,
            "notes": rand_text(["After food","Before food","With water","Monitor BP","PRN"]),
            "prescribed_by": adm.get("doctor_id"),
        })
    # Cascade delete dependent dispense requests (and dispensed) first to avoid FK errors
    delete_med_dispense_chain(adm["ipd_no"])
    delete_then_insert("internal_medications", "ipd_no", adm["ipd_no"], rows)

def create_med_dispense_requests(adm):
    meds = supabase.table("internal_medications").select("id").eq("ipd_no", adm["ipd_no"]).execute().data or []
    delete_then_insert("medication_dispense_requests", "ipd_no", adm["ipd_no"], [])
    if meds:
        supabase.table("medication_dispense_requests").insert([
            {"ipd_no": adm["ipd_no"], "medication_id": m["id"], "status": "pending"} for m in meds
        ]).execute()

def build_med_admin_charts(adm, anchor_date_iso):
    charts = []
    ims = supabase.table("internal_medications").select("medication_name,dosage,frequency,start_date,end_date").eq("ipd_no", adm["ipd_no"]).execute().data or []
    for m in ims:
        charts.append({
            "ipd_no": adm["ipd_no"],
            "medication_name": m["medication_name"],
            "dosage": m.get("dosage"),
            "frequency": m.get("frequency"),
            "start_date": m.get("start_date"),
            "end_date": m.get("end_date"),
        })
    delete_then_insert("medication_administration_charts", "ipd_no", adm["ipd_no"], charts)
    res = supabase.table("medication_administration_charts").select("id,start_date").eq("ipd_no", adm["ipd_no"]).execute()
    entries = []
    for c in (res.data or []):
        base = ensure_date_iso(c.get("start_date")) or ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
        n = random.randint(1, 3)
        for j in range(n):
            entries.append({
                "chart_id": c["id"],
                "date": anchor_date_iso if j == 0 else random_date_in_month(base),
                "time_slot": rand_text(["M","A","E","N"]),
                "administered": random.choice([True, False]),
                "administered_at": None,
                "administered_by": None,
                "notes": rand_text(["Given as scheduled","Delayed dose","Patient asleep","Refused"]),
            })
    if entries:
        supabase.table("medication_administration_entries").insert(entries).execute()

def build_procedure_entries_and_assignments(adm, therapists_by_dept, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    # Prefer Excel export; fallback to DB
    procs_df = safe_read_xlsx(PROCS_XLSX)
    proc_rows = []
    if not procs_df.empty and "procedure_name" in procs_df.columns:
        proc_rows = procs_df.to_dict(orient="records")
    else:
        procs = supabase.table("procedures").select("procedure_name").limit(100).execute().data or []
        proc_rows = [{"procedure_name": p["procedure_name"], "requirements": None, "quantity": None} for p in procs]
    entries = []
    count = random.randint(2, 4)
    for i in range(count):
        start = anchor_date_iso if i == 0 else random_date_in_month(base)
        s = pd.to_datetime(start).date()
        mb_s, mb_e = month_bounds(base)
        end = (s + timedelta(days=random.randint(0, max(0, (mb_e - s).days)))).isoformat()
        src = random.choice(proc_rows) if proc_rows else {"procedure_name":"Procedure","requirements":None,"quantity":None}
        entries.append({
            "ipd_no": adm["ipd_no"],
            "procedure_name": src.get("procedure_name") or "Procedure",
            "requirements": (src.get("requirements") if src.get("requirements") not in [None, float('nan')] else rand_text(["Oil, Herbs","Bandage, Gauze","Steam setup","Saline"])),
            "quantity": (str(src.get("quantity")) if src.get("quantity") not in [None, float('nan')] else rand_text(["1","2","3","5"])),
            "start_date": start,
            "end_date": end,
            "therapist": "",
        })
    delete_then_insert("procedure_entries", "ipd_no", adm["ipd_no"], entries)

    res = supabase.table("procedure_entries").select("id,start_date").eq("ipd_no", adm["ipd_no"]).execute()
    dept_id = None
    appt = fetch_latest_appointment(adm["uhid"]) or {}
    dept_id = appt.get("department_id")
    pool = therapists_by_dept.get(dept_id) or sum(therapists_by_dept.values(), [])

    assignments, reqs = [] , []
    for e in (res.data or []):
        scheduled_date = e.get("start_date") or anchor_date_iso or base
        therapist_id = (random.choice(pool)["id"] if pool else None)
        assignments.append({
            "ipd_no": adm["ipd_no"],
            "procedure_entry_id": e["id"],
            "therapist_id": therapist_id or "therapist_1",
            "doctor_id": adm.get("doctor_id"),
            "scheduled_date": scheduled_date,
            "scheduled_time": rand_text(["09:00","11:00","15:30"]),
            "notes": rand_text(["Handle gently","Short session","Post-procedure rest"]),
            "status": rand_text(["pending","completed"]),
        })
        reqs.append({
            "ipd_no": adm["ipd_no"],
            "procedure_entry_id": e["id"],
            "requirements": rand_text(["Oil, Herbs","Bandage, Gauze","Steam setup","Saline"]),
            "quantity": rand_text(["1","2","3","5"]),
            "requested_by": adm.get("doctor_id"),
            "status": "pending",
        })
    delete_then_insert("therapist_assignments", "ipd_no", adm["ipd_no"], assignments)
    delete_then_insert("procedure_medicine_requirement_requests", "ipd_no", adm["ipd_no"], reqs)

def build_pain_assessment(adm):
    row = {
        "ipd_no": adm["ipd_no"],
        "location": rand_text(["Back","Head","Knee","Abdomen"]),
        "intensity": rand_text(["2/10","4/10","6/10","8/10"]),
        "character": rand_text(["Dull","Sharp","Throbbing","Burning"]),
        "frequency": rand_text(["Intermittent","Continuous"]),
        "duration": rand_text(["Hours","Days","Weeks"]),
        "radiation": rand_text(["None","To leg","To shoulder"]),
        "triggers": rand_text(["Movement","Cold","Pressure"]),
        "current_management": rand_text(["Heat therapy","Analgesic","Rest"]),
        "created_at": datetime.utcnow().isoformat()
    }
    delete_then_insert("pain_assessments", "ipd_no", adm["ipd_no"], [row])

def build_pain_monitoring(adm, staff_all, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    staff_ids = [s.get("id") for s in staff_all] or ["staff_1"]
    rows = []
    for _ in range(3):
        rows.append({
            "ipd_no": adm["ipd_no"],
            "date_time": f"{anchor_date_iso if _ == 0 else random_date_in_month(base)}T{rand_text(['08:00:00','12:00:00','18:00:00'])}Z",
            "pain_score": random.randint(1, 10),
            "intervention": rand_text(["Analgesic","Physiotherapy","Massage","Cold pack"]),
            "outcome": rand_text(["Improved","No change"]),
            "side_effects": rand_text(["None","Drowsiness"]),
            "advice": rand_text(["Continue as advised","Rest"]),
            "staff_id": random.choice(staff_ids),
        })
    delete_then_insert("pain_monitoring_charts", "ipd_no", adm["ipd_no"], rows)

def build_bp_tpr(adm, nurses, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    nurse_id = (nurses[0].get("id") if nurses else None)
    rows = []
    for i in range(4):
        rows.append({
            "ipd_no": adm["ipd_no"],
            "date_time": f"{anchor_date_iso if i == 0 else random_date_in_month(base)}T{rand_text(['07:30:00','11:30:00','16:30:00'])}Z",
            "temperature": random.choice([36.7, 36.9, 37.2, 37.5]),
            "pulse": random.randint(68, 98),
            "respiratory_rate": random.randint(14, 22),
            "bp": rand_text(["118/76","120/80","124/82","130/86"]),
            "nurse_id": nurse_id,
        })
    delete_then_insert("bp_tpr_charts", "ipd_no", adm["ipd_no"], rows)

def build_diet(adm, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    rows = []
    for i in range(4):
        rows.append({
            "ipd_no": adm["ipd_no"],
            "date": anchor_date_iso if i == 0 else random_date_in_month(base),
            "time": rand_text(["07:30","13:00","19:30"]),
            "diet": rand_text([
                "Breakfast: Idli-Sambar; Lunch: Dal-Rice; Dinner: Soup",
                "Breakfast: Poha; Lunch: Roti-Sabzi; Dinner: Khichdi",
                "Breakfast: Upma; Lunch: Curd-Rice; Dinner: Veg Pulao"
            ]),
            "notes": rand_text(["Tolerated well","Half taken","Skipped dinner"]),
        })
    delete_then_insert("diet_sheets", "ipd_no", adm["ipd_no"], rows)

def build_daily_assessments(adm, anchor_date_iso):
    base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
    rows = []
    n = random.randint(2, 4)
    for i in range(n):
        rows.append({
            "ipd_no": adm["ipd_no"],
            "date": anchor_date_iso if i == 0 else random_date_in_month(base),
            "doctor_id": adm.get("doctor_id"),
            "assessment": rand_text(["Stable","Improving","Deteriorating"]),
            "advice": rand_text(["Continue meds","Physio advised","Observe"]),
        })
    delete_then_insert("ipd_daily_assessments", "ipd_no", adm["ipd_no"], rows)

def build_discharge_summary(adm):
    if not adm.get("discharge_date"):
        return
    row = {
        "ipd_no": adm["ipd_no"],
        "department": get_doctor_department_name(adm.get("doctor_id")),
        "doctor_name": None,
        "patient_name": get_patient_demographics(adm["uhid"]).get("patient_name"),
        "age": None,
        "sex": None,
        "uhid_no": adm["uhid"],
        "ip_no": adm["ipd_no"],
        "ward_bed_no": adm.get("bed_number"),
        "date_of_admission": adm.get("admission_date"),
        "time_of_admission": None,
        "date_of_discharge": adm.get("discharge_date"),
        "time_of_discharge": None,
        "complaints": "As per records",
        "history_brief": "As per records",
        "significant_findings": "As per records",
        "investigation_results": "As per records",
        "diagnosis": "As per records",
        "condition_at_discharge": rand_text(["Stable","Improved"]),
        "course_in_hospital": "As per records",
        "procedures_performed": "As per records",
        "medications_administered": "As per records",
        "other_treatment": None,
        "discharge_medications": None,
        "other_instructions": "As advised",
        "follow_up_period": "7 days",
        "urgent_care_instructions": None,
        "doctor_signature": None,
        "patient_signature": None,
        "summary_prepared_by": None,
    }
    delete_then_insert("discharge_summaries", "ipd_no", adm["ipd_no"], [row])

# ---------------- Extra IPD sections ----------------
def build_procedure_sessions(adm, anchor_date_iso, staff_all):
    # Link to existing procedure_entries for this IPD
    entries = supabase.table("procedure_entries").select("id").eq("ipd_no", adm["ipd_no"]).execute().data or []
    rows = []
    for e in entries[:3]:
        rows.append({
            "ipd_no": adm["ipd_no"],
            "procedure_entry_id": e["id"],
            "session_date": anchor_date_iso,
            "pre_vitals": "Temp: 36.9, Pulse: 76, BP: 120/80, RR: 18",
            "post_vitals": "Temp: 37.0, Pulse: 80, BP: 124/82, RR: 19",
            "procedure_note": rand_text(["Session completed; tolerated well","Mild discomfort; advised rest"]),
            "performed_by": (staff_all[0].get("id") if staff_all else None),
            "session_duration_minutes": random.choice([30,45,60]),
            "complications": rand_text(["None","Nil"]),
            "patient_response": rand_text(["Improved","Stable"]),
            "next_session_date": anchor_date_iso,
        })
    delete_then_insert("procedure_sessions", "ipd_no", adm["ipd_no"], rows)

def build_referred_assessments(adm, staff_all, anchor_date_iso):
    # Choose two staff as referred_by and referred_to if available
    ref_by = (staff_all[0].get("id") if staff_all else None)
    ref_to = (staff_all[1].get("id") if len(staff_all) > 1 else None)
    rows = [{
        "ipd_no": adm["ipd_no"],
        "referred_by_id": ref_by,
        "referred_to_id": ref_to,
        "department": get_doctor_department_name(adm.get("doctor_id")),
        "assessment_note": rand_text(["Needs specialist review","Second opinion requested"]),
        "advice": rand_text(["Proceed with imaging","Start physiotherapy"]),
        "recommended_procedures": "Abhyanga, Swedana",
        "recommended_meds": "Ashwagandha, Triphala",
        "status": "pending",
        "created_at": f"{anchor_date_iso}T10:00:00Z",
    }]
    delete_then_insert("referred_assessments", "ipd_no", adm["ipd_no"], rows)

def build_requested_investigations(adm, anchor_date_iso):
    # Pull list from codebase-like static set
    investigations = [
        "CBC", "RFT", "LFT", "X-Ray Chest", "MRI Lumbar Spine",
        "CT Brain", "Urine Routine", "ECG", "Ultrasound Abdomen"
    ]
    rows = [{
        "ipd_no": adm["ipd_no"],
        "requested_investigations": ", ".join(random.sample(investigations, random.randint(1,3))),
        "doctor_id": adm.get("doctor_id"),
        "scheduled_date": anchor_date_iso,
        "scheduled_time": rand_text(["09:00-10:00 am","11:00-12:00 pm","02:00-03:00 pm"]),
        "status": "pending",
        "notes": rand_text(["Urgent","Normal priority","Review after report"]),
        "priority": rand_text(["low","normal","high","urgent"]),
        "created_at": f"{anchor_date_iso}T09:00:00Z",
        "updated_at": f"{anchor_date_iso}T09:00:00Z",
    }]
    delete_then_insert("requested_investigations", "ipd_no", adm["ipd_no"], rows)

def build_billing_records(adm, anchor_date_iso):
    items = [
        ("Admission charges", 500),
        ("Bed charges", random.choice([1000, 1500, 2000])),
        ("Procedure charges", random.choice([1500, 2500, 3500])),
        ("Medication charges", random.choice([800, 1200, 1600])),
    ]
    rows = [{
        "ipd_no": adm["ipd_no"],
        "opd_no": adm.get("opd_no"),
        "bill_date": f"{anchor_date_iso}T12:00:00Z",
        "description": desc,
        "amount": amt,
    } for desc, amt in items]
    delete_then_insert("billing_records", "ipd_no", adm["ipd_no"], rows)

# Execute seeding over all admissions
try:
    therapists_by_dept, nurses, staff_all = fetch_staff_maps()
    admissions = fetch_admissions_all()
    print(f"Seeding IPD sections for {len(admissions)} admissions...")
    for adm in admissions:
        base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
        anchor_date_iso = random_date_in_month(base)
        build_ipd_case_sheet(adm, anchor_date_iso)
        build_internal_meds(adm, anchor_date_iso)
        create_med_dispense_requests(adm)
        build_med_admin_charts(adm, anchor_date_iso)
        build_procedure_entries_and_assignments(adm, therapists_by_dept, anchor_date_iso)
        # New: extra IPD sections
        build_procedure_sessions(adm, anchor_date_iso, staff_all)
        build_referred_assessments(adm, staff_all, anchor_date_iso)
        build_requested_investigations(adm, anchor_date_iso)
        build_billing_records(adm, anchor_date_iso)
        build_pain_assessment(adm)
        build_pain_monitoring(adm, staff_all, anchor_date_iso)
        build_bp_tpr(adm, nurses, anchor_date_iso)
        build_diet(adm, anchor_date_iso)
        build_daily_assessments(adm, anchor_date_iso)
        build_discharge_summary(adm)
    print("✅ IPD sections seeding complete.")
except Exception as e:
    print("❌ Error seeding IPD sections:", e)