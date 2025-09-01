import TechnicianDashboardLayout from "@/components/technician-dashboard-layout";

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TechnicianDashboardLayout>{children}</TechnicianDashboardLayout>;
}
