import PharmacistDashboardLayout from "@/components/pharmacist-dashboard-layout";

export default function PharmacistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PharmacistDashboardLayout>{children}</PharmacistDashboardLayout>;
} 