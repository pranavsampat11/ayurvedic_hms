# PHASE 2: Seed IPD Sections (ONLY for Excel-based admissions) - THIS IS THE VERSION WE ARE WORKING ON 
# This script ONLY works with IPD admissions created from your Excel file
# It will NOT touch any old/existing data in the database

# 1. Install required libraries
!pip install supabase pandas openpyxl

import pandas as pd
import random
from datetime import date, timedelta, datetime, timezone
from supabase import create_client

# 2. Configure Supabase connection
url = "https://yzmqdruerraecaoblrwv.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bXFkcnVlcnJhZWNhb2Jscnd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAwODI1MCwiZXhwIjoyMDY4NTg0MjUwfQ.UOH4Z8tnrn2z_bJmhG-FdWFEm8sfft4CT0T8L3s18IE"
supabase = create_client(url, key)

# 3. Load your Excel file to get the UHIDs
df = pd.read_excel("patients_filled_may_trial.xlsx")
print(f"📊 Loaded Excel file with {len(df)} rows")

# Get UHIDs from your Excel file
excel_uhids = set(df["uhid"].unique())
print(f"🔍 Found {len(excel_uhids)} unique UHIDs in Excel file")

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
    # Delete dispensed_procedure_requirements -> procedure_medicine_requirement_requests -> procedure_sessions -> procedure_entries for this IPD
    req_ids = supabase.table("procedure_medicine_requirement_requests").select("id").eq("ipd_no", ipd_no).execute().data or []
    ids = [r["id"] for r in req_ids]
    if ids:
        supabase.table("dispensed_procedure_requirements").delete().in_("request_id", ids).execute()
    supabase.table("procedure_medicine_requirement_requests").delete().eq("ipd_no", ipd_no).execute()
    # Delete procedure_sessions before procedure_entries since they reference procedure_entries
    supabase.table("procedure_sessions").delete().eq("ipd_no", ipd_no).execute()
    # Now safe to delete procedure_entries
    supabase.table("procedure_entries").delete().eq("ipd_no", ipd_no).execute()

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

def fetch_excel_based_admissions():
    """ONLY fetch IPD admissions that were created from your Excel file"""
    # Get all IPD admissions
    all_admissions = supabase.table("ipd_admissions").select("*").execute().data or []

    # Filter to ONLY those with UHIDs from your Excel file
    excel_based_admissions = [adm for adm in all_admissions if adm["uhid"] in excel_uhids]

    print(f"🔍 Found {len(all_admissions)} total IPD admissions in database")
    print(f"✅ Filtered to {len(excel_based_admissions)} admissions from your Excel file")

    return excel_based_admissions

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

        # Individual examination fields
        "height": str(random.randint(150, 180)),  # Height in cm
        "weight": str(random.randint(50, 90)),    # Weight in kg
        "bmi": str(round(random.uniform(18.5, 30.0), 1)),  # BMI
        "pulse": str(random.randint(70, 100)),    # Pulse rate
        "rr": str(random.randint(16, 22)),        # Respiratory rate
        "bp": rand_text(["118/76","120/80","124/82","130/86","140/90"]),  # Blood pressure
        
        # Systemic examination as JSONB (matching the reference structure)
        "systemic_examination": {
            "RespiratorySystem": rand_text([
                "Clear breath sounds, no crepitations",
                "Normal breath sounds, no wheezing",
                "Bilateral air entry equal, no added sounds",
                "Clear chest, no respiratory distress"
            ]),
            "CVS": rand_text([
                "S1 S2 heard, no murmurs",
                "Regular rhythm, no murmurs",
                "Normal heart sounds, no added sounds",
                "S1S2 normal, no murmurs"
            ]),
            "CNS": rand_text([
                "Conscious, oriented, no focal deficit",
                "Higher mental functions normal, cranial nerves intact",
                "Alert, responsive, normal coordination",
                "Conscious, oriented, no neurological deficits"
            ])
        },

        "present_complaints": pick_from_list(present_opts, 1, 3),
        "associated_complaints": pick_from_list(assoc_opts, 1, 3),
        "past_history": rand_text(["Nil","Diabetes","Hypertension","Asthma"]),
        "personal_history": rand_text(["Vegetarian","Mixed diet"]),
        "obs_gyn_history": rand_text(gyn_opts) if gender == "Female" else None,
        "previous_medicine_history": rand_text(["Occasional analgesics","Ayurvedic meds","None"]),
        "family_history": rand_text(["Nil","Similar complaints in family"]),

        "general_examination": {"bp": "120/80", "pulse": random.randint(72, 92), "spo2": random.randint(96, 99)},
        "dasavidha_pariksha": {
           "Prakriti": rand_text(["Vata","Pitta","Kapha"]),
            "Vikriti": rand_text(["Vata","Pitta","Kapha"]),
            "Sara": rand_text(["Uttam","Madhyam","Avara"]),
            "Samhanana": rand_text(["Uttam","Madhyam","Avara"]),
            "Pramana": rand_text(["Uttam","Madhyam","Avara"]),
            "Satmya": rand_text(["Uttam","Madhyam","Avara"]),
            "Satva": rand_text(["Uttam","Madhyam","Avara"]),
            "AharaShakti": rand_text(["Pravara","Madhyam","Avara"]),
            "VyayamShakti": rand_text(["Pravara","Madhyam","Avara"]),
            "Vaya": rand_text(["Uttam","Madhyam","Avara"]),
        },
        "asthasthana_pariksha": {
            "Nadi": rand_text(["Vata","Pitta","Kapha"]),
            "Mala": rand_text(["Samyaka","Alpa","Krura"]),
            "Mootra": rand_text(["Samyaka","Alpa"]),
            "Jihva": rand_text(["Nirmala","Saama"]),
            "Shabda": rand_text(["Samyaka"]),
            "Sparsha": rand_text(["Samashita","Ushna"]),
            "Drika": rand_text(["Prakrita"]),
            "Akruti": rand_text(["Madhyama","Sthula","Krisha"]),
        },
        "sampraptighataka": {
           "Dosha": rand_text(["Vata","Pitta","Kapha"]),
            "SrothoDushti": rand_text(["Mamsa","Rakta","Meda","Asthi"]),
            "Vyaktasthana": rand_text(["Mamsavaha","Raktavaha","Meda"]),
            "Dushya": rand_text(["Mandagni","Vishamagni","Tikshnagni"]),
            "Udhabavasthana": rand_text(["Present","Absent"]),
            "Vyadibheda": rand_text(["Kati","Janu","Greeva"]),
            "Srothas": rand_text(["Pakwashaya","Amashaya"]),
            "Sancharastana": rand_text(["Kati","Janu","Greeva"]),
            "Sadhyaasadhyatha": rand_text(["Yes","No"]),
        },
         "local_examination": rand_text(["Within normal limits","Tenderness present","Swelling noted","No abnormalities"]),
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

def create_med_dispense_requests_and_dispensed(adm):
    meds = supabase.table("internal_medications").select("id").eq("ipd_no", adm["ipd_no"]).execute().data or []
    
    # Delete existing records first
    delete_med_dispense_chain(adm["ipd_no"])
    
    if meds:
        # Create medication dispense requests
        requests = []
        for m in meds:
            requests.append({
                "ipd_no": adm["ipd_no"], 
                "medication_id": m["id"], 
                "status": "completed"  # Since these are past patients, status is completed
            })
        
        # Insert the requests
        supabase.table("medication_dispense_requests").insert(requests).execute()
        
        # Get the created request IDs
        created_requests = supabase.table("medication_dispense_requests").select("id").eq("ipd_no", adm["ipd_no"]).execute().data or []
        
        # Create dispensed_medications records (since these are past patients, meds were already dispensed)
        dispensed_records = []
        for req in created_requests:
            dispensed_records.append({
                "request_id": req["id"],
                "dispensed_by": adm.get("doctor_id") or "staff_1",  # Use doctor or fallback
                "dispensed_date": f"{ensure_date_iso(adm.get('admission_date'))}T10:00:00Z"  # Dispensed on admission date
            })
        
        if dispensed_records:
            supabase.table("dispensed_medications").insert(dispensed_records).execute()

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
    # Use chain delete to avoid FK violations
    delete_proc_req_chain(adm["ipd_no"])

    # Insert procedure entries first
    if entries:
        supabase.table("procedure_entries").insert(entries).execute()

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
            "status": "completed",  # Since these are past patients, status is completed
        })

    # Insert the dependent records
    if assignments:
        supabase.table("therapist_assignments").insert(assignments).execute()
    if reqs:
        supabase.table("procedure_medicine_requirement_requests").insert(reqs).execute()
        
        # Get the created request IDs
        created_proc_reqs = supabase.table("procedure_medicine_requirement_requests").select("id").eq("ipd_no", adm["ipd_no"]).execute().data or []
        
        # Create dispensed_procedure_requirements records (since these are past patients, requirements were already dispensed)
        dispensed_proc_records = []
        for req in created_proc_reqs:
            dispensed_proc_records.append({
                "request_id": req["id"],
                "dispensed_by": adm.get("doctor_id") or "staff_1",  # Use doctor or fallback
                "dispensed_date": f"{ensure_date_iso(adm.get('admission_date'))}T10:00:00Z",  # Dispensed on admission date
                "notes": rand_text(["Dispensed as requested", "All items provided", "Patient received"])
            })
        
        if dispensed_proc_records:
            supabase.table("dispensed_procedure_requirements").insert(dispensed_proc_records).execute()

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
        "created_at": datetime.now(timezone.utc).isoformat()  # Fixed for older Python versions
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

# Extra IPD sections
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

    # Delete existing sessions first, then insert new ones
    supabase.table("procedure_sessions").delete().eq("ipd_no", adm["ipd_no"]).execute()
    if rows:
        supabase.table("procedure_sessions").insert(rows).execute()

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

# Execute seeding ONLY for Excel-based admissions
try:
    print("🚀 Starting Phase 2: IPD Sections Seeding")
    print("=" * 50)

    # Fetch staff maps
    therapists_by_dept, nurses, staff_all = fetch_staff_maps()
    print(f"👥 Loaded {len(staff_all)} staff members")

    # Fetch ONLY admissions from your Excel file
    admissions = fetch_excel_based_admissions()

    if not admissions:
        print("⚠️ No Excel-based IPD admissions found. Please run Phase 1 first!")
        exit()

    print(f"📋 Seeding IPD sections for {len(admissions)} Excel-based admissions...")
    print("=" * 50)

    for i, adm in enumerate(admissions, 1):
        print(f"🔄 Processing admission {i}/{len(admissions)}: {adm['ipd_no']} (UHID: {adm['uhid']})")

        base = ensure_date_iso(adm.get("admission_date")) or date.today().isoformat()
        anchor_date_iso = random_date_in_month(base)

        # Build all IPD sections
        build_ipd_case_sheet(adm, anchor_date_iso)
        build_internal_meds(adm, anchor_date_iso)
        create_med_dispense_requests_and_dispensed(adm)  # Updated function name
        build_med_admin_charts(adm, anchor_date_iso)
        build_procedure_entries_and_assignments(adm, therapists_by_dept, anchor_date_iso)
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

        print(f"✅ Completed admission {i}/{len(admissions)}")

    print("=" * 50)
    print("🎉 Phase 2 completed successfully!")
    print(f"✅ Seeded IPD sections for {len(admissions)} Excel-based admissions")

except Exception as e:
    print("❌ Error in Phase 2:", e)
    import traceback
    traceback.print_exc()