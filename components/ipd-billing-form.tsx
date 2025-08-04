import React, { useState } from "react";

export interface IPDBillingData {
  bed_charge: number;
  nursing_charge: number;
  doctor_charge: number;
  procedure_charge: number;
  surgery_charge: number;
  other_charges: number;
  total: number;
}

interface IPDBillingFormProps {
  onSubmit?: (data: IPDBillingData) => void;
}

const IPDBillingForm: React.FC<IPDBillingFormProps> = ({ onSubmit }) => {
  const [charges, setCharges] = useState<Omit<IPDBillingData, "total">>({
    bed_charge: 0,
    nursing_charge: 0,
    doctor_charge: 0,
    procedure_charge: 0,
    surgery_charge: 0,
    other_charges: 0,
  });
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<IPDBillingData | null>(null);

  const total =
    charges.bed_charge +
    charges.nursing_charge +
    charges.doctor_charge +
    charges.procedure_charge +
    charges.surgery_charge +
    charges.other_charges;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCharges((prev) => ({
      ...prev,
      [name]: Number(value) || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bill = { ...charges, total };
    setBillData(bill);
    setShowBill(true);
    if (onSubmit) {
      onSubmit(bill);
    }
  };

  const handlePrint = () => {
    const printContents = document.getElementById("ipd-bill-receipt")?.innerHTML;
    if (printContents) {
      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write("<html><head><title>IPD Bill Receipt</title>");
        printWindow.document.write("<style>body{font-family:sans-serif;} .receipt{max-width:400px;margin:auto;border:1px solid #ccc;padding:24px;border-radius:8px;} .receipt h2{text-align:center;} .receipt table{width:100%;margin-top:16px;} .receipt td{padding:4px 0;} .receipt .total{font-weight:bold;color:#15803d;}</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write(printContents);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-4"
      >
        <h2 className="text-xl font-bold mb-4">IPD Billing</h2>
        {[
          { label: "Bed Charge", name: "bed_charge" },
          { label: "Nursing Charge", name: "nursing_charge" },
          { label: "Doctor Charge", name: "doctor_charge" },
          { label: "Procedure Charge", name: "procedure_charge" },
          { label: "Surgery Charge", name: "surgery_charge" },
          { label: "Other Charges", name: "other_charges" },
        ].map((field) => (
          <div key={field.name} className="flex items-center">
            <label className="w-40">{field.label}:</label>
            <input
              type="number"
              name={field.name}
              value={charges[field.name as keyof typeof charges]}
              onChange={handleChange}
              min={0}
              step="0.01"
              className="flex-1 border rounded px-2 py-1"
              required
            />
          </div>
        ))}
        <div className="flex items-center font-semibold">
          <span className="w-40">Total:</span>
          <span className="flex-1 text-green-700">₹ {total.toFixed(2)}</span>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
      {showBill && billData && (
        <div className="flex justify-center mt-8">
          <div id="ipd-bill-receipt" className="receipt bg-white p-8 rounded shadow max-w-md w-full border">
            <h2 className="text-2xl font-bold mb-4 text-center">IPD Bill Receipt</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr><td>Bed Charge:</td><td className="text-right">₹ {billData.bed_charge.toFixed(2)}</td></tr>
                <tr><td>Nursing Charge:</td><td className="text-right">₹ {billData.nursing_charge.toFixed(2)}</td></tr>
                <tr><td>Doctor Charge:</td><td className="text-right">₹ {billData.doctor_charge.toFixed(2)}</td></tr>
                <tr><td>Procedure Charge:</td><td className="text-right">₹ {billData.procedure_charge.toFixed(2)}</td></tr>
                <tr><td>Surgery Charge:</td><td className="text-right">₹ {billData.surgery_charge.toFixed(2)}</td></tr>
                <tr><td>Other Charges:</td><td className="text-right">₹ {billData.other_charges.toFixed(2)}</td></tr>
                <tr className="border-t"><td className="pt-2 total">Total:</td><td className="pt-2 total text-right">₹ {billData.total.toFixed(2)}</td></tr>
              </tbody>
            </table>
            <div className="text-center mt-6">
              <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Print Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPDBillingForm; 