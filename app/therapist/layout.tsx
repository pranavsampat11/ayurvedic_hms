import TherapistDashboardLayout from "@/components/therapist-dashboard-layout";

export default function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TherapistDashboardLayout>{children}</TherapistDashboardLayout>;
} 