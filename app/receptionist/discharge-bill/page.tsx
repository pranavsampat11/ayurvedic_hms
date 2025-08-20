"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";
import { Calculator, Printer, Receipt, Search } from "lucide-react";

interface BillCharges {
  diet_charges_per_day: number;
  doctor_charges_per_day: number;
  nursing_charges_per_day: number;
  room_type: "AC" | "Non-AC";
}

interface ProcedureDetail {
  procedure_name: string;
  start_date: string;
  end_date: string;
  days: number;
  rate_per_day: number;
  total_cost: number;
}

interface BillCalculation {
  total_days: number;
  bed_charges: number;
  procedure_charges: number;
  diet_charges: number;
  doctor_charges: number;
  nursing_charges: number;
  total_amount: number;
  procedure_details: ProcedureDetail[];
  deposit_amount: number;
  returnable_amount: number;
  additional_cost: number;
}

export default function ReceptionistDischargeBillPage() {
  const [ipdNoInput, setIpdNoInput] = useState("");
  const [selectedIpdNo, setSelectedIpdNo] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [billCharges, setBillCharges] = useState<BillCharges>({
    diet_charges_per_day: 0,
    doctor_charges_per_day: 0,
    nursing_charges_per_day: 0,
    room_type: "Non-AC",
  });
  const [billCalculation, setBillCalculation] = useState<BillCalculation | null>(null);

  useEffect(() => {
    if (selectedIpdNo) {
      loadPatientData(selectedIpdNo);
    }
  }, [selectedIpdNo]);

  useEffect(() => {
    if (patientData?.ipd_no) {
      loadProcedures();
    } else {
      setProcedures([]);
    }
  }, [patientData?.ipd_no]);

  async function loadPatientData(ipdNo: string) {
    setLoading(true);
    try {
      const { data: ipdAdmission, error: ipdError } = await supabase
        .from("ipd_admissions")
        .select(
          `*,
           patients (
             full_name,
             age,
             gender,
             uhid
           )`
        )
        .eq("ipd_no", ipdNo)
        .single();

      if (ipdError || !ipdAdmission) {
        throw ipdError || new Error("IPD not found");
      }

      const { data: dischargeSummary } = await supabase
        .from("discharge_summaries")
        .select("date_of_discharge")
        .eq("ipd_no", ipdNo)
        .single();

      const combinedData = {
        ...ipdAdmission,
        discharge_date: dischargeSummary?.date_of_discharge || null,
      };

      setPatientData(combinedData);
      setBillCalculation(null);
    } catch (error: any) {
      setPatientData(null);
      toast({ title: "Not found", description: error?.message || "Unable to find IPD number" , variant: "destructive"});
    } finally {
      setLoading(false);
    }
  }

  async function loadProcedures() {
    const { data, error } = await supabase
      .from("procedure_entries")
      .select("*")
      .eq("ipd_no", patientData?.ipd_no)
      .order("start_date", { ascending: true });
    if (!error) setProcedures(data || []);
  }

  async function calculateBill() {
    if (!patientData?.admission_date || !patientData?.discharge_date) {
      toast({ title: "Error", description: "Please ensure admission and discharge dates are set", variant: "destructive" });
      return;
    }

    try {
      const admissionDate = new Date(patientData.admission_date);
      const dischargeDate = new Date(patientData.discharge_date);
      const totalDays = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const bedRate = billCharges.room_type === "AC" ? 750 : 500;
      const bedCharges = totalDays * bedRate;

      let procedureCharges = 0;
      const procedureDetails: ProcedureDetail[] = [];

      for (const procedure of procedures) {
        const startDate = new Date(procedure.start_date);
        const endDate = new Date(procedure.end_date);
        const procedureDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const { data: procedureData } = await supabase
          .from("procedures")
          .select("charges_per_day")
          .eq("procedure_name", procedure.procedure_name)
          .single();

        let ratePerDay = 0;
        if (procedureData && procedureData.charges_per_day) {
          ratePerDay = parseFloat(procedureData.charges_per_day);
        }

        const procedureCost = procedureDays * ratePerDay;
        procedureCharges += procedureCost;
        procedureDetails.push({
          procedure_name: procedure.procedure_name,
          start_date: procedure.start_date,
          end_date: procedure.end_date,
          days: procedureDays,
          rate_per_day: ratePerDay,
          total_cost: procedureCost,
        });
      }

      const dietCharges = totalDays * billCharges.diet_charges_per_day;
      const doctorCharges = totalDays * billCharges.doctor_charges_per_day;
      const nursingCharges = totalDays * billCharges.nursing_charges_per_day;

      const totalAmount = bedCharges + procedureCharges + dietCharges + doctorCharges + nursingCharges;
      const depositAmount = patientData.deposit_amount || 0;
      const returnableAmount = depositAmount >= totalAmount ? depositAmount - totalAmount : 0;
      const additionalCost = totalAmount > depositAmount ? totalAmount - depositAmount : 0;

      setBillCalculation({
        total_days: totalDays,
        bed_charges: bedCharges,
        procedure_charges: procedureCharges,
        diet_charges: dietCharges,
        doctor_charges: doctorCharges,
        nursing_charges: nursingCharges,
        total_amount: totalAmount,
        procedure_details: procedureDetails,
        deposit_amount: depositAmount,
        returnable_amount: returnableAmount,
        additional_cost: additionalCost,
      });

      toast({ title: "Success", description: "Bill calculated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to calculate bill", variant: "destructive" });
    }
  }

  function printBill() {
    if (!billCalculation || !patientData) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Final Bill - ${patientData.patients?.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin-bottom: 10px; }
            .title h1 { margin: 0; font-size: 18pt; font-weight: bold; color: #2E7D32; }
            .title h2 { margin: 5px 0; font-size: 16pt; font-weight: bold; color: #333; }
            .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 12pt; }
            .patient-info div { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 2px 0; }
            .patient-info b { font-weight: bold; min-width: 120px; }
            .value { font-weight: normal; text-align: right; word-break: break-word; }
            .bill-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12pt; }
            .bill-table th, .bill-table td { border: 1px solid #333; padding: 8px; text-align: left; }
            .bill-table th { background-color: #f0f0f0; font-weight: bold; }
            .bill-table .total-row { font-weight: bold; background-color: #e8f5e8; }
            .procedure-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11pt; }
            .procedure-table th, .procedure-table td { border: 1px solid #333; padding: 6px; text-align: left; }
            .procedure-table th { background-color: #f8f8f8; font-weight: bold; }
            .total-amount { text-align: center; margin-top: 30px; font-size: 16pt; font-weight: bold; color: #2E7D32; border: 2px solid #2E7D32; padding: 15px; background-color: #f0f8f0; }
            @media print { body { margin: 0; padding: 10px; } .container { border: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/my-logo.png" alt="Logo" class="logo" />
              <div class="title">
                <h1>POORNIMA AYURVEDIC MEDICAL COLLEGE, HOSPITAL & RESEARCH CENTRE</h1>
                <h2>FINAL BILL</h2>
              </div>
            </div>

            <div class="patient-info">
              <div><b>Patient Name:</b><span class="value">${patientData.patients?.full_name}</span></div>
              <div><b>IP No:</b><span class="value">${patientData.ipd_no}</span></div>
              <div><b>UHID No:</b><span class="value">${patientData.patients?.uhid}</span></div>
              <div><b>Age:</b><span class="value">${patientData.patients?.age}</span></div>
              <div><b>Sex:</b><span class="value">${patientData.patients?.gender}</span></div>
              <div><b>Ward/Bed No:</b><span class="value">${patientData.ward} / ${patientData.bed_number}</span></div>
              <div><b>Date of Admission:</b><span class="value">${patientData.admission_date}</span></div>
              <div><b>Date of Discharge:</b><span class="value">${patientData.discharge_date}</span></div>
              <div><b>Total Days:</b><span class="value">${billCalculation.total_days}</span></div>
              <div><b>Room Type:</b><span class="value">${billCharges.room_type}</span></div>
              <div><b>Deposit Amount:</b><span class="value">₹${billCalculation.deposit_amount.toLocaleString()}</span></div>
            </div>

            <div class="section-title">PROCEDURE DETAILS</div>
            <table class="procedure-table">
              <thead>
                <tr>
                  <th>Procedure Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Rate/Day (₹)</th>
                  <th>Total Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${billCalculation.procedure_details
                  .map(
                    (proc) => `
                  <tr>
                    <td>${proc.procedure_name}</td>
                    <td>${proc.start_date}</td>
                    <td>${proc.end_date}</td>
                    <td>${proc.days}</td>
                    <td>₹${proc.rate_per_day.toLocaleString()}</td>
                    <td>₹${proc.total_cost.toLocaleString()}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="section-title">BILL SUMMARY</div>
            <table class="bill-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Days</th>
                  <th>Rate per Day</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Bed Charges (${billCharges.room_type})</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.room_type === "AC" ? "750" : "500"}</td>
                  <td>₹${billCalculation.bed_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Procedure Charges</td>
                  <td>-</td>
                  <td>-</td>
                  <td>₹${billCalculation.procedure_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Diet Charges</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.diet_charges_per_day}</td>
                  <td>₹${billCalculation.diet_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Doctor Charges</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.doctor_charges_per_day}</td>
                  <td>₹${billCalculation.doctor_charges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Nursing Charges</td>
                  <td>${billCalculation.total_days}</td>
                  <td>₹${billCharges.nursing_charges_per_day}</td>
                  <td>₹${billCalculation.nursing_charges.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL AMOUNT</strong></td>
                  <td><strong>₹${billCalculation.total_amount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style="margin: 20px 0; padding: 15px; border: 1px solid #333; background-color: #f9f9f9;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Deposit Amount:</strong>
                <span>₹${billCalculation.deposit_amount.toLocaleString()}</span>
              </div>
              ${billCalculation.returnable_amount > 0
                ? `<div style="display: flex; justify-content: space-between; color: #2E7D32; font-weight: bold; margin-bottom: 10px;"><span>Returnable Amount:</span><span>₹${billCalculation.returnable_amount.toLocaleString()}</span></div>`
                : ""}
              ${billCalculation.additional_cost > 0
                ? `<div style=\"display: flex; justify-content: space-between; color: #D32F2F; font-weight: bold; margin-bottom: 10px;\"><span>Additional Cost:</span><span>₹${billCalculation.additional_cost.toLocaleString()}</span></div>`
                : ""}
            </div>

            <div class="total-amount">Total Amount: ₹${billCalculation.total_amount.toLocaleString()}</div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="ipdNo">Enter IPD Number</Label>
          <Input
            id="ipdNo"
            placeholder="IPD-..."
            value={ipdNoInput}
            onChange={(e) => setIpdNoInput(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            const val = ipdNoInput.trim();
            if (!val) {
              toast({ title: "Enter IPD No", description: "Please enter a valid IPD number", variant: "destructive" });
              return;
            }
            setSelectedIpdNo(val);
          }}
          disabled={loading}
        >
          <Search className="h-4 w-4 mr-2" /> Find
        </Button>
        <Button onClick={calculateBill} variant="outline" disabled={!patientData}>
          <Calculator className="h-4 w-4 mr-2" /> Calculate Bill
        </Button>
        {billCalculation && (
          <Button onClick={printBill} variant="outline">
            <Printer className="h-4 w-4 mr-2" /> Print Bill
          </Button>
        )}
      </div>

      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Patient Name</Label>
                <div className="text-lg font-semibold">{patientData?.patients?.full_name}</div>
              </div>
              <div>
                <Label>IP No</Label>
                <div className="text-lg font-semibold">{patientData?.ipd_no}</div>
              </div>
              <div>
                <Label>UHID No</Label>
                <div className="text-lg font-semibold">{patientData?.patients?.uhid}</div>
              </div>
              <div>
                <Label>Age</Label>
                <div className="text-lg font-semibold">{patientData?.patients?.age}</div>
              </div>
              <div>
                <Label>Sex</Label>
                <div className="text-lg font-semibold">{patientData?.patients?.gender}</div>
              </div>
              <div>
                <Label>Ward/Bed No</Label>
                <div className="text-lg font-semibold">{`${patientData?.ward || ""} / ${patientData?.bed_number || ""}`}</div>
              </div>
              <div>
                <Label>Date of Admission</Label>
                <div className="text-lg font-semibold">{patientData?.admission_date}</div>
              </div>
              <div>
                <Label>Deposit Amount</Label>
                <div className="text-lg font-semibold">₹{patientData?.deposit_amount?.toLocaleString() || "0"}</div>
              </div>
              <div>
                <Label>Date of Discharge</Label>
                <div className="text-lg font-semibold">{patientData?.discharge_date || "Not discharged yet"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charges Configuration */}
      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Charges Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room_type">Room Type</Label>
                <select
                  id="room_type"
                  value={billCharges.room_type}
                  onChange={(e) => setBillCharges((prev) => ({ ...prev, room_type: e.target.value as "AC" | "Non-AC" }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Non-AC">Non-AC (₹500/day)</option>
                  <option value="AC">AC (₹750/day)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="diet_charges">Diet Charges per Day (₹)</Label>
                <Input
                  id="diet_charges"
                  type="number"
                  value={billCharges.diet_charges_per_day}
                  onChange={(e) => setBillCharges((prev) => ({ ...prev, diet_charges_per_day: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter daily diet charges"
                />
              </div>
              <div>
                <Label htmlFor="doctor_charges">Doctor Charges per Day (₹)</Label>
                <Input
                  id="doctor_charges"
                  type="number"
                  value={billCharges.doctor_charges_per_day}
                  onChange={(e) => setBillCharges((prev) => ({ ...prev, doctor_charges_per_day: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter daily doctor charges"
                />
              </div>
              <div>
                <Label htmlFor="nursing_charges">Nursing Charges per Day (₹)</Label>
                <Input
                  id="nursing_charges"
                  type="number"
                  value={billCharges.nursing_charges_per_day}
                  onChange={(e) => setBillCharges((prev) => ({ ...prev, nursing_charges_per_day: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter daily nursing charges"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Procedures */}
      {patientData && (
        <Card>
          <CardHeader>
            <CardTitle>Procedures Performed ({procedures.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {procedures.length > 0 ? (
              <div className="space-y-3">
                {procedures.map((proc, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-semibold">{proc.procedure_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {proc.start_date} to {proc.end_date}
                      {proc.therapist && ` • ${proc.therapist}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No procedures found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bill Calculation */}
      {patientData && billCalculation && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Total Days:</strong> {billCalculation.total_days}</div>
                <div><strong>Room Type:</strong> {billCharges.room_type}</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Procedure Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Procedure</th>
                        <th className="border border-gray-300 p-2 text-left">Start Date</th>
                        <th className="border border-gray-300 p-2 text-left">End Date</th>
                        <th className="border border-gray-300 p-2 text-center">Days</th>
                        <th className="border border-gray-300 p-2 text-right">Rate/Day</th>
                        <th className="border border-gray-300 p-2 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billCalculation.procedure_details.map((proc, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{proc.procedure_name}</td>
                          <td className="border border-gray-300 p-2">{proc.start_date}</td>
                          <td className="border border-gray-300 p-2">{proc.end_date}</td>
                          <td className="border border-gray-300 p-2 text-center">{proc.days}</td>
                          <td className="border border-gray-300 p-2 text-right">₹{proc.rate_per_day.toLocaleString()}</td>
                          <td className="border border-gray-300 p-2 text-right">₹{proc.total_cost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span>Bed Charges ({billCharges.room_type}):</span>
                  <span>₹{billCalculation.bed_charges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Procedure Charges:</span>
                  <span>₹{billCalculation.procedure_charges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diet Charges:</span>
                  <span>₹{billCalculation.diet_charges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Doctor Charges:</span>
                  <span>₹{billCalculation.doctor_charges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nursing Charges:</span>
                  <span>₹{billCalculation.nursing_charges.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>TOTAL AMOUNT:</span>
                  <span>₹{billCalculation.total_amount.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span>Deposit Amount:</span>
                  <span>₹{billCalculation.deposit_amount.toLocaleString()}</span>
                </div>
                {billCalculation.returnable_amount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Returnable Amount:</span>
                    <span>₹{billCalculation.returnable_amount.toLocaleString()}</span>
                  </div>
                )}
                {billCalculation.additional_cost > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Additional Cost:</span>
                    <span>₹{billCalculation.additional_cost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 