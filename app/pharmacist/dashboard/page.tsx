"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { 
  Pill, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  FileText
} from "lucide-react";

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRequests: number;
  totalPatients: number;
  totalCaseSheets: number;
}

export default function PharmacistDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    todayRequests: 0,
    totalPatients: 0,
    totalCaseSheets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Get medication request stats
      const { data: requests, error: requestsError } = await supabase
        .from("medication_dispense_requests")
        .select("*");

      if (requestsError) throw requestsError;

      const today = new Date().toISOString().split('T')[0];
      
      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      const todayRequests = requests?.filter(r => 
        r.request_date?.startsWith(today)
      ).length || 0;

      // Get patient count
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("uhid");

      if (patientsError) throw patientsError;

      // Get case sheet count
      const { data: opdCaseSheets, error: opdError } = await supabase
        .from("opd_case_sheets")
        .select("id");

      const { data: ipdCaseSheets, error: ipdError } = await supabase
        .from("ipd_case_sheets")
        .select("id");

      if (opdError || ipdError) throw opdError || ipdError;

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        todayRequests,
        totalPatients: patients?.length || 0,
        totalCaseSheets: (opdCaseSheets?.length || 0) + (ipdCaseSheets?.length || 0),
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Requests",
      value: stats.totalRequests,
      icon: Pill,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Completed Today",
      value: stats.completedRequests,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today's Requests",
      value: stats.todayRequests,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Case Sheets",
      value: stats.totalCaseSheets,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pharmacist Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </CardTitle>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pharmacist Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Welcome back!
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-1.5 md:p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-3 w-3 md:h-4 md:w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs md:text-sm">5 medication requests completed today</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs md:text-sm">3 pending requests need attention</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs md:text-sm">2 new case sheets reviewed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm md:text-base">View Pending Requests</div>
                <div className="text-xs md:text-sm text-gray-600">Check medication requests that need processing</div>
              </button>
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm md:text-base">Review Case Sheets</div>
                <div className="text-xs md:text-sm text-gray-600">Access patient case sheets for medication details</div>
              </button>
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm md:text-base">Generate Reports</div>
                <div className="text-xs md:text-sm text-gray-600">Create medication dispensing reports</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 