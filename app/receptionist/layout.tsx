import ReceptionistDashboardLayout from "@/components/receptionist-dashboard-layout";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReceptionistDashboardLayout>
      {children}
    </ReceptionistDashboardLayout>
  );
} 