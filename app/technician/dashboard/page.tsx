"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { 
  Microscope, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  FileText
} from "lucide-react";

interface DashboardStats {
  totalInvestigations: number;
  pendingInvestigations: number;
  completedInvestigations: number;
  todayInvestigations: number;
  urgentInvestigations: number;
  totalPatients: number;
}

export default function TechnicianDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvestigations: 0,
    pendingInvestigations: 0,
    completedInvestigations: 0,
    todayInvestigations: 0,
    urgentInvestigations: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Get investigation stats
      const { data: investigations, error: investigationsError } = await supabase
        .from("requested_investigations")
        .select("*");

      if (investigationsError) throw investigationsError;

      const today = new Date().toISOString().split('T')[0];
      
      const totalInvestigations = investigations?.length || 0;
      const pendingInvestigations = investigations?.filter(r => r.status === 'pending').length || 0;
      const completedInvestigations = investigations?.filter(r => r.status === 'completed').length || 0;
      const todayInvestigations = investigations?.filter(r => 
        r.scheduled_date === today
      ).length || 0;
      const urgentInvestigations = investigations?.filter(r => 
        r.priority === 'urgent' && r.status === 'pending'
      ).length || 0;

      // Get unique patient count
      const { data: patients, error: patientsError } = await supabase
        .from("requested_investigations")
        .select(`
          opd_no,
          ipd_no,
          opd_visits(uhid),
          ipd_admissions(uhid)
        `);

      if (patientsError) throw patientsError;

      // Count unique patients
      const uniquePatients = new Set();
      patients?.forEach(p => {
        if (p.opd_no && p.opd_visits && Array.isArray(p.opd_visits) && p.opd_visits[0]?.uhid) {
          uniquePatients.add(p.opd_visits[0].uhid);
        }
        if (p.ipd_no && p.ipd_admissions && Array.isArray(p.ipd_admissions) && p.ipd_admissions[0]?.uhid) {
          uniquePatients.add(p.ipd_admissions[0].uhid);
        }
      });

      setStats({
        totalInvestigations,
        pendingInvestigations,
        completedInvestigations,
        todayInvestigations,
        urgentInvestigations,
        totalPatients: uniquePatients.size,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Investigations",
      value: stats.totalInvestigations,
      icon: Microscope,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Investigations",
      value: stats.pendingInvestigations,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Completed Today",
      value: stats.completedInvestigations,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Today's Schedule",
      value: stats.todayInvestigations,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Urgent Investigations",
      value: stats.urgentInvestigations,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Technician Dashboard</h1>
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
        <h1 className="text-3xl font-bold">Technician Dashboard</h1>
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
                <span className="text-xs md:text-sm">5 investigations completed today</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs md:text-sm">3 pending investigations need attention</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs md:text-sm">1 urgent investigation requires immediate action</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs md:text-sm">2 new investigation requests received</span>
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
                <div className="font-medium text-sm md:text-base">View Pending Investigations</div>
                <div className="text-xs md:text-sm text-gray-600">Check investigations that need processing</div>
              </button>
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm md:text-base">Today's Schedule</div>
                <div className="text-xs md:text-sm text-gray-600">View today's investigation schedule</div>
              </button>
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm md:text-base">Urgent Investigations</div>
                <div className="text-xs md:text-sm text-gray-600">Handle priority investigations</div>
              </button>
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm md:text-base">Generate Reports</div>
                <div className="text-xs md:text-sm text-gray-600">Create investigation completion reports</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
