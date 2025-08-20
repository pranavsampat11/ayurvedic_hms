"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { Printer } from "lucide-react";

export default function PrintEntireCasePage() {
	const params = useParams();
	const visitId = params.uhid as string; // OPD-..., IPD-..., or UHID
	const [printing, setPrinting] = useState(false);

	useEffect(() => {
		void handlePrint();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visitId]);

	async function handlePrint() {
		if (!visitId) return;
		setPrinting(true);
		try {
			const isOPD = visitId.startsWith("OPD-");
			const isIPD = visitId.startsWith("IPD-");
			let actualUhid = visitId;

			if (isOPD) {
				const { data } = await supabase.from("opd_visits").select("uhid").eq("opd_no", visitId).single();
				if (data?.uhid) actualUhid = data.uhid;
			}
			if (isIPD) {
				const { data } = await supabase.from("ipd_admissions").select("uhid").eq("ipd_no", visitId).single();
				if (data?.uhid) actualUhid = data.uhid;
			}

			const { data: patient } = await supabase.from("patients").select("*").eq("uhid", actualUhid).single();
			if (!patient) {
				toast({ title: "Patient not found", variant: "destructive" });
				setPrinting(false);
				return;
			}

			// IPD admission details (for headers)
			let ipdAdmission: any = null;
			if (isIPD) {
				const { data } = await supabase
					.from("ipd_admissions")
					.select("*, patients(full_name, age, gender, uhid)")
					.eq("ipd_no", visitId)
					.single();
				ipdAdmission = data || null;
			}

			// CASE SHEET (OPD or IPD) and OPD supplementary
			let caseSheet: any = null;
			let selectedInvestigations: string[] = [];
			let followUps: any[] = [];
			if (isOPD) {
				const { data: cs } = await supabase.from("opd_case_sheets").select("*").eq("opd_no", visitId).single();
				caseSheet = cs;
				if (cs?.investigations) selectedInvestigations = cs.investigations.split(",").map((s: string) => s.trim());
				const { data: fu } = await supabase
					.from("opd_follow_up_sheets")
					.select("*")
					.eq("opd_no", visitId)
					.order("date", { ascending: true });
				followUps = fu || [];
			} else if (isIPD) {
				const { data: cs } = await supabase.from("ipd_case_sheets").select("*").eq("ipd_no", visitId).single();
				caseSheet = cs;
			}

			// PROCEDURES and INTERNAL MEDICATIONS (IPD)
			let procedures: any[] = [];
			let internalMedications: any[] = [];
			if (isIPD) {
				const { data: procs } = await supabase.from("procedure_entries").select("*").eq("ipd_no", visitId).order("start_date");
				procedures = procs || [];
				const { data: meds } = await supabase.from("internal_medications").select("*").eq("ipd_no", visitId).order("start_date");
				internalMedications = meds || [];
			}

			// DAILY ASSESSMENTS
			let dailyAssessments: any[] = [];
			if (isIPD) {
				const { data } = await supabase.from("ipd_daily_assessments").select("*").eq("ipd_no", visitId).order("date", { ascending: true });
				dailyAssessments = data || [];
			}

			// MEDICATION ADMINISTRATION CHARTS + ENTRIES
			let medCharts: any[] = [];
			if (isIPD) {
				const { data: charts } = await supabase
					.from("medication_administration_charts")
					.select("id, medication_name, dosage, frequency, start_date, end_date")
					.eq("ipd_no", visitId)
					.order("start_date");
				medCharts = charts || [];
				if (medCharts.length) {
					const ids = medCharts.map(c => c.id);
					const { data: entries } = await supabase
						.from("medication_administration_entries")
						.select("chart_id, date, time_slot, administered")
						.in("chart_id", ids);
					const map: Record<number, any[]> = {};
					(entries || []).forEach(e => { map[e.chart_id] = map[e.chart_id] || []; map[e.chart_id].push(e); });
					medCharts = medCharts.map(c => ({ ...c, entries: map[c.id] || [] }));
				}
			}

			// DIET CHARTS
			let dietCharts: any[] = [];
			if (isIPD) {
				const { data } = await supabase.from("diet_sheets").select("*").eq("ipd_no", visitId).order("date", { ascending: true });
				dietCharts = data || [];
			}

			// BP TPR CHART
			let bpTpr: any[] = [];
			if (isIPD) {
				const { data } = await supabase
					.from("bp_tpr_charts")
					.select("*, staff: nurse_id(full_name)")
					.eq("ipd_no", visitId)
					.order("date_time", { ascending: true });
				bpTpr = data || [];
			}

			// PAIN ASSESSMENT (initial sheet)
			let painAssessments: any[] = [];
			if (isIPD) {
				const { data } = await supabase
					.from("pain_assessments")
					.select("*")
					.eq("ipd_no", visitId)
					.order("created_at", { ascending: true });
				painAssessments = data || [];
			}

			// PAIN MANAGEMENT / MONITORING CHARTS
			let painManagements: any[] = [];
			if (isIPD) {
				const { data } = await supabase
					.from("pain_monitoring_charts")
					.select("*, staff: staff_id(full_name)")
					.eq("ipd_no", visitId)
					.order("date_time", { ascending: true });
				painManagements = data || [];
			}

			// REFERRED DOCTORS
			let referredAssessments: any[] = [];
			if (isIPD) {
				const { data } = await supabase
					.from("referred_assessments")
					.select("*")
					.eq("ipd_no", visitId)
					.order("created_at", { ascending: true });
				referredAssessments = data || [];
			}

			// DISCHARGE SUMMARY
			let dischargeSummary: any = null;
			if (isIPD) {
				const { data } = await supabase
					.from("discharge_summaries")
					.select("*")
					.eq("ipd_no", visitId)
					.maybeSingle();
				dischargeSummary = data || null;
			}

			const html = buildCombinedHtml({
				isOPD,
				patient,
				ipdAdmission,
				caseSheet,
				selectedInvestigations,
				followUps,
				procedures,
				internalMedications,
				dailyAssessments,
				medCharts,
				dietCharts,
				bpTpr,
				painAssessments,
				painManagements,
				referredAssessments,
				dischargeSummary,
			});

			const win = window.open("", "_blank", "width=900,height=1200");
			if (win) {
				win.document.write(html);
				win.document.close();
				win.focus();
			}
		} catch (e) {
			console.error(e);
			toast({ title: "Failed to generate print", variant: "destructive" });
		} finally {
			setPrinting(false);
		}
	}

	return (
		<div className="p-4 max-w-3xl mx-auto">
			<h1 className="text-xl font-bold mb-3">Print Entire Case</h1>
			<p className="text-sm text-muted-foreground mb-4">Visit: {visitId}</p>
			<Button onClick={handlePrint} disabled={printing} className="flex items-center gap-2">
				<Printer className="h-4 w-4" /> {printing ? "Preparing..." : "Print All Sections"}
			</Button>
		</div>
	);
}

function buildCombinedHtml(ctx: any) {
	const logoUrl = window.location.origin + "/my-logo.png";
	const { isOPD, patient, ipdAdmission } = ctx;
	const header = `
	  <div class="header">
	    <img src="${logoUrl}" class="logo" />
	    <div class="title">
	      <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
	      <h2>${isOPD ? "OPD" : "IPD"} COMPLETE CASE SUMMARY</h2>
	    </div>
	  </div>`;
	const patientBlock = `
	  <div class="section">
	    <h3>Patient</h3>
	    <table class="table">
	      <tr><th>Name</th><td>${patient.full_name || ""}</td><th>UHID</th><td>${patient.uhid || ""}</td></tr>
	      <tr><th>Age</th><td>${patient.age || ""}</td><th>Gender</th><td>${patient.gender || ""}</td></tr>
	      ${ipdAdmission ? `<tr><th>Ward/Bed</th><td>${ipdAdmission.ward||''}/${ipdAdmission.bed_number||''}</td><th>IP No</th><td>${ipdAdmission.ipd_no||''}</td></tr>` : ''}
	    </table>
	  </div>`;

	const sections: string[] = [];
	sections.push(sectionWrap(header + patientBlock));

	// Case sheet summary
	sections.push(sectionPage("Initial Assessment / Case Sheet", renderCaseSheet(ctx.caseSheet, isOPD)));

	// Follow-ups (OPD only)
	if (ctx.followUps && ctx.followUps.length) {
		sections.push(sectionPage("OPD Follow-ups", ctx.followUps.map((f: any) => `
		  <div style="margin:8px 0;">
		    <b>${f.date || ''}</b>
		    ${(f.procedures||[]).length ? `<div><i>Procedures:</i> ${(f.procedures||[]).map((p:any)=>p.procedure_name).join(', ')}</div>` : ''}
		    ${(f.medications||[]).length ? `<div><i>Medications:</i> ${(f.medications||[]).map((m:any)=>m.medication_name).join(', ')}</div>` : ''}
		  </div>`).join("")));
	}

	// Daily Assessment (IPD)
	if (ctx.dailyAssessments && ctx.dailyAssessments.length) {
		sections.push(renderDailyAssessmentSection(ctx));
	}
	// Medication Chart
	if (ctx.medCharts && ctx.medCharts.length) {
		sections.push(renderMedicationChartSection(ctx));
	}
	// Diet Chart
	if (ctx.dietCharts && ctx.dietCharts.length) {
		sections.push(renderDietChartSection(ctx));
	}
	// BP TPR
	if (ctx.bpTpr && ctx.bpTpr.length) {
		sections.push(renderBptprSection(ctx));
	}
	// Pain Assessment
	if (ctx.painAssessments && ctx.painAssessments.length) {
		sections.push(renderPainAssessmentSection(ctx));
	}
	// Pain Management
	if (ctx.painManagements && ctx.painManagements.length) {
		sections.push(renderPainManagementSection(ctx));
	}
	// Referred Doctors
	if (ctx.referredAssessments && ctx.referredAssessments.length) {
		sections.push(renderReferredDoctorsSection(ctx));
	}
	// Discharge Summary
	if (ctx.dischargeSummary) {
		sections.push(renderDischargeSummarySection(ctx));
	}

	return `
	<!DOCTYPE html>
	<html>
	<head>
	  <meta charset="utf-8" />
	  <title>Complete Case Summary - ${patient.full_name}</title>
	  <style>
	    body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; color: #000; font-size: 12pt; line-height: 1.4; }
	    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
	    .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
	    .logo { width: 80px; height: 80px; margin-right: 20px; }
	    .title { flex: 1; text-align: center; }
	    .title h1 { font-size: 18pt; font-weight: bold; margin: 0 0 5px 0; }
	    .title h2 { font-size: 16pt; font-weight: bold; margin: 0; text-decoration: underline; }
	    .section { margin: 16px 0; }
	    .section h3 { margin: 0 0 8px 0; font-size: 13pt; }
	    .hr { margin: 20px 0; border: none; border-top: 1.5px solid #333; }
	    .table { width: 100%; border-collapse: collapse; }
	    .table th, .table td { border: 1px solid #333; padding: 6px; vertical-align: top; }
	    .page-break { page-break-before: always; break-before: page; }
	    .no-border td, .no-border th { border: none; }
	    .center { text-align: center; }
	    .muted { color: #666; font-size: 10pt; }
	    @media print { body { margin: 0; padding: 10px; } .container { border: none; } .page-break { page-break-before: always; } }
	  </style>
	</head>
	<body>
	  <div class="container">${sections.join("")}</div>
	  <script>window.onload = function(){ window.print(); }</script>
	</body>
	</html>`;
}

function sectionWrap(inner: string) {
	return `<section>${inner}</section>`;
}
function sectionPage(title: string, bodyHtml: string) {
	return `<section class="page-break"><h3>${title}</h3>${bodyHtml}</section>`;
}

function renderCaseSheet(caseSheet: any, isOPD: boolean) {
	if (!caseSheet) return "<i>No case sheet found</i>";
	const parts: string[] = [];
	const add = (label: string, value: any) => { if (value) parts.push(`<div><b>${label}:</b> ${escapeHtml(String(value))}</div>`); };
	add("Department", caseSheet.department);
	add("Doctor", caseSheet.doctor || caseSheet.doctor_id);
	add("Present Complaints", caseSheet.present_complaints || caseSheet.chief_complaints);
	add("Associated Complaints", caseSheet.associated_complaints);
	add("Past History", caseSheet.past_history);
	add("Personal History", caseSheet.personal_history);
	add("Allergy History", caseSheet.allergy_history);
	add("Family History", caseSheet.family_history);
	add("Obs/Gyn History", caseSheet.obs_gyn_history);
	add("Local Examination", caseSheet.local_examination);
	add("Pain Assessment", caseSheet.pain_assessment);
	add("Investigations", caseSheet.investigations);
	add("Diagnosis", caseSheet.diagnosis);
	add("Nutritional Status", caseSheet.nutritional_status);
	add("Treatment Plan", caseSheet.treatment_plan);
	add("Preventive Aspects", caseSheet.preventive_aspects);
	add("Rehabilitation", caseSheet.rehabilitation);
	add("Desired Outcome", caseSheet.desired_outcome);
	return parts.join("");
}

function renderDailyAssessmentSection(ctx: any) {
	const p = ctx.ipdAdmission || {};
	const rows = ctx.dailyAssessments.map((a: any) => `
	  <tr>
	    <td class="date-cell">${new Date(a.date).toLocaleDateString('en-GB')}</td>
	    <td class="progress-cell">
	      <div class="assessment-entry">
	        <div><strong>Assessment:</strong> ${escapeHtml(a.assessment || 'N/A')}</div>
	        ${a.advice ? `<div><strong>Advice:</strong> ${escapeHtml(a.advice)}</div>` : ''}
	        ${a.time ? `<div class="muted">Time: ${a.time}</div>` : ''}
	      </div>
	    </td>
	  </tr>`).join("");
	return `
	  <style>
	    .patient-details{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
	    .patient-row{display:flex;justify-content:space-between}
	    table{width:100%;border-collapse:collapse;margin-top:8px}
	    th,td{border:1px solid #000;padding:6px;font-size:10pt}
	    th{background:#f0f0f0;text-align:center}
	    .date-cell{text-align:center;font-weight:bold;width:15%}
	    .progress-cell{width:85%}
	  </style>
	  <div class="header small">
	    <div class="patient-details">
	      <div class="patient-row"><div><b>Name:</b> ${p.patients?.full_name||'N/A'}</div><div><b>Age:</b> ${p.patients?.age||'N/A'}</div><div><b>Sex:</b> ${p.patients?.gender||'N/A'}</div></div>
	      <div class="patient-row"><div><b>Bed No:</b> ${p.bed_number||'N/A'}</div><div><b>UHID No:</b> ${p.uhid||'N/A'}</div><div><b>IP No:</b> ${p.ipd_no||''}</div></div>
	    </div>
	  </div>
	  <table><thead><tr><th class="date-cell">Date</th><th class="progress-cell">Progress Notes & Advice</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderMedicationChartSection(ctx: any) {
	const p = ctx.ipdAdmission || {};
	// collect all distinct dates from entries
	const allDates = Array.from(new Set<string>(ctx.medCharts.flatMap((c: any) => (c.entries||[]).map((e: any) => String(e.date))))).sort((a,b)=>a.localeCompare(b));
	const headerDates = allDates.map(() => `<th class="time-slot">M</th><th class="time-slot">A</th><th class="time-slot">E</th><th class="time-slot">N</th>`).join("");
	const bodyRows = ctx.medCharts.map((chart: any) => {
		const cells = allDates.map((d: string) => {
			const m = (chart.entries||[]).find((e: any) => e.date===d && e.time_slot==='M');
			const a = (chart.entries||[]).find((e: any) => e.date===d && e.time_slot==='A');
			const e = (chart.entries||[]).find((e: any) => e.date===d && e.time_slot==='E');
			const n = (chart.entries||[]).find((e: any) => e.date===d && e.time_slot==='N');
			return `
			  <td class="${m?.administered?'administered':'not-administered'}">${m?.administered?'✓':''}</td>
			  <td class="${a?.administered?'administered':'not-administered'}">${a?.administered?'✓':''}</td>
			  <td class="${e?.administered?'administered':'not-administered'}">${e?.administered?'✓':''}</td>
			  <td class="${n?.administered?'administered':'not-administered'}">${n?.administered?'✓':''}</td>`;
		}).join("");
		return `<tr><td class="medicine-name">${chart.medication_name}<br><small>${chart.dosage||''} - ${chart.frequency||''}</small></td>${cells}<td class="signature"></td></tr>`;
	}).join("");
	return `
	  <style>
	    .table{width:100%;border-collapse:collapse;margin-top:8px}
	    .table th,.table td{border:1px solid #000;padding:6px;vertical-align:top}
	    .medicine-name{width:220px}
	    .time-slot{width:24px;text-align:center}
	    .administered{background:#e6ffed}
	    .not-administered{background:#ffecec}
	    .signature{width:120px}
	  </style>
	  <div class="patient-row"><b>Medication Administration Chart</b></div>
	  <table class="table"><thead><tr><th>Medicine</th>${headerDates}<th>Sign</th></tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function renderDietChartSection(ctx: any) {
	const rows = ctx.dietCharts.map((e: any) => `<tr><td class="date">${new Date(e.date).toLocaleDateString('en-GB')}</td><td class="time">${e.time||''}</td><td class="diet">${escapeHtml(e.diet||'')}</td><td class="notes">${escapeHtml(e.notes||'')}</td></tr>`).join("");
	return `
	  <style>
	    table{width:100%;border-collapse:collapse;margin-top:8px}
	    th,td{border:1px solid #000;padding:6px;font-size:10pt}
	    th{background:#f0f0f0;text-align:center}
	    .date{width:18%}.time{width:18%}.diet{width:40%}.notes{width:24%}
	  </style>
	  <div><b>IPD Diet Chart</b></div>
	  <table><thead><tr><th>Date</th><th>Time</th><th>Diet Plan</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderBptprSection(ctx: any) {
	const fmt = (dt: string) => { const d=new Date(dt); return { d:d.toLocaleDateString('en-GB'), t:d.toLocaleTimeString() }; };
	const rows = ctx.bpTpr.map((e: any) => { const ft=fmt(e.date_time); return `<tr><td>${ft.d}</td><td>${ft.t}</td><td>${e.temperature?`${e.temperature}°F`:'N/A'}</td><td>${e.pulse||'N/A'}</td><td>${e.respiratory_rate||'N/A'}</td><td>${e.bp||'N/A'}</td><td>${e.staff?.full_name||'N/A'}</td></tr>`; }).join("");
	return `
	  <style>
	    table{width:100%;border-collapse:collapse;margin-top:8px}
	    th,td{border:1px solid #000;padding:6px;font-size:10pt}
	    th{background:#f0f0f0;text-align:center}
	  </style>
	  <div><b>BP & TPR Chart</b></div>
	  <table><thead><tr><th>Date</th><th>Time</th><th>Temp</th><th>Pulse</th><th>RR</th><th>BP</th><th>Nurse</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderPainAssessmentSection(ctx: any) {
	const p = ctx.ipdAdmission || {};
	const a = ctx.painAssessments[0]; // show first/most recent as assessment sheet
	if (!a) return "";
	return `
	  <style>
	    .assessment-table{width:100%;border-collapse:collapse;margin-top:8px}
	    .assessment-table td{border:1px solid #000;padding:6px}
	    .wong{max-width:400px;margin-top:8px}
	  </style>
	  <div><b>Pain Assessment</b></div>
	  <img src="/wongscale.png" class="wong" />
	  <table class="assessment-table">
	    <tr><td>Pain Location</td><td>${escapeHtml(a.location||'')}</td></tr>
	    <tr><td>Intensity</td><td>${escapeHtml(a.intensity||'')}</td></tr>
	    <tr><td>Character</td><td>${escapeHtml(a.character||'')}</td></tr>
	    <tr><td>Frequency</td><td>${escapeHtml(a.frequency||'')}</td></tr>
	    <tr><td>Duration</td><td>${escapeHtml(a.duration||'')}</td></tr>
	    <tr><td>Referral or Radiating pain</td><td>${escapeHtml(a.radiation||'')}</td></tr>
	    <tr><td>Alleviating & aggravating factor</td><td>${escapeHtml(a.triggers||'')}</td></tr>
	    <tr><td>Present Pain Management Regimen & effectiveness</td><td>${escapeHtml(a.current_management||'')}</td></tr>
	  </table>`;
}

function renderPainManagementSection(ctx: any) {
	const rows = ctx.painManagements.map((e: any) => {
		const d=new Date(e.date_time); const D=d.toLocaleDateString('en-GB'), T=d.toLocaleTimeString();
		return `<tr><td class="date-time">${D}<br>${T}</td><td class="pain-score">${e.pain_score||''}/10</td><td>${escapeHtml(e.intervention||'')}</td><td>${escapeHtml(e.outcome||'')}</td><td>${escapeHtml(e.side_effects||'')}</td><td>${escapeHtml(e.advice||'')}</td><td class="staff-name">${e.staff?.full_name||''}</td></tr>`;
	}).join("");
	return `
	  <style>
	    table{width:100%;border-collapse:collapse;margin-top:8px}
	    th,td{border:1px solid #000;padding:6px;font-size:10pt}
	    th{background:#f0f0f0;text-align:center}
	  </style>
	  <div><b>Pain Management and Monitoring</b></div>
	  <table><thead><tr><th>Date & Time</th><th>Pain Score</th><th>Intervention</th><th>Outcome</th><th>Side effects</th><th>Advice</th><th>Staff</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderReferredDoctorsSection(ctx: any) {
	const rows = ctx.referredAssessments.map((a: any) => `
	  <div class="assessment">
	    <div class="assessment-header">Referred to: ${escapeHtml(a.referred_to_name||'N/A')} (${escapeHtml(a.department||'')}) <span class="muted">${(a.status||'').toUpperCase()}</span></div>
	    <div><strong>Referred by:</strong> ${escapeHtml(a.referred_by_name||'N/A')}</div>
	    <div><strong>Date:</strong> ${new Date(a.created_at).toLocaleDateString()}</div>
	    <div><strong>Priority:</strong> ${(a.priority||'').toUpperCase()}</div>
	    <div style="margin-top:6px"><strong>Assessment Note:</strong> ${escapeHtml(a.assessment_note||'N/A')}</div>
	    <div><strong>Advice:</strong> ${escapeHtml(a.advice||'N/A')}</div>
	    <div><strong>Recommended Procedures:</strong> ${escapeHtml(a.recommended_procedures||'N/A')}</div>
	    <div><strong>Recommended Medications:</strong> ${escapeHtml(a.recommended_meds||'N/A')}</div>
	    ${a.response_assessment ? `<div style="margin-top:6px"><strong>Response Assessment:</strong> ${escapeHtml(a.response_assessment)}</div>` : ''}
	  </div>`).join("");
	return `
	  <div><b>Referred Doctors</b></div>
	  ${rows}`;
}

function renderDischargeSummarySection(ctx: any) {
	const f = ctx.dischargeSummary;
	return `
	  <style>
	    .section b{display:block;margin:6px 0}
	    .value{min-height:18px;border-bottom:1px solid #ccc;padding-bottom:2px}
	  </style>
	  <div><b>Discharge Summary</b></div>
	  <div class="section"><b>Complaints</b><div class="value">${escapeHtml(f.complaints||'')}</div></div>
	  <div class="section"><b>History Brief</b><div class="value">${escapeHtml(f.history_brief||'')}</div></div>
	  <div class="section"><b>Significant Findings</b><div class="value">${escapeHtml(f.significant_findings||'')}</div></div>
	  <div class="section"><b>Investigation Results</b><div class="value">${escapeHtml(f.investigation_results||'')}</div></div>
	  <div class="section"><b>Diagnosis</b><div class="value">${escapeHtml(f.diagnosis||'')}</div></div>
	  <div class="section"><b>Condition at Discharge</b><div class="value">${escapeHtml(f.condition_at_discharge||'')}</div></div>
	  <div class="section"><b>Course in Hospital</b><div class="value">${escapeHtml(f.course_in_hospital||'')}</div></div>
	  <div class="section"><b>Procedures Performed</b><div class="value">${escapeHtml(f.procedures_performed||'')}</div></div>
	  <div class="section"><b>Medications Administered</b><div class="value">${escapeHtml(f.medications_administered||'')}</div></div>
	  <div class="section"><b>Other Treatment</b><div class="value">${escapeHtml(f.other_treatment||'')}</div></div>
	  <div class="section"><b>Discharge Medications</b><div class="value">${escapeHtml(f.discharge_medications||'')}</div></div>
	  <div class="section"><b>Other Instructions</b><div class="value">${escapeHtml(f.other_instructions||'')}</div></div>
	  <div class="section"><b>Follow-up Period</b><div class="value">${escapeHtml(f.follow_up_period||'')}</div></div>
	`;
}

function escapeHtml(v: string) {
	return v
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
} 