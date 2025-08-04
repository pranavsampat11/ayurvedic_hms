"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Pill,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ReportStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRequests: number;
  weeklyRequests: number;
  monthlyRequests: number;
  topMedications: Array<{ name: string; count: number }>;
  recentActivity: Array<{ action: string; time: string; details: string }>;
}

export default function PharmacistReportsPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    todayRequests: 0,
    weeklyRequests: 0,
    monthlyRequests: 0,
    topMedications: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    loadReportStats();
  }, [timeRange]);

  const loadReportStats = async () => {
    try {
      setLoading(true);

      // Get medication requests
      const { data: requests, error: requestsError } = await supabase
        .from("medication_dispense_requests")
        .select("*");

      if (requestsError) throw requestsError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
      const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
      
      const todayRequests = requests?.filter(r => 
        new Date(r.request_date) >= today
      ).length || 0;
      
      const weeklyRequests = requests?.filter(r => 
        new Date(r.request_date) >= weekAgo
      ).length || 0;
      
      const monthlyRequests = requests?.filter(r => 
        new Date(r.request_date) >= monthAgo
      ).length || 0;

      // Get top medications
      const medicationCounts: { [key: string]: number } = {};
      for (const request of requests || []) {
        const { data: medication } = await supabase
          .from("internal_medications")
          .select("medication_name")
          .eq("id", request.medication_id)
          .single();
        
        if (medication?.medication_name) {
          medicationCounts[medication.medication_name] = (medicationCounts[medication.medication_name] || 0) + 1;
        }
      }

      const topMedications = Object.entries(medicationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent activity
      const recentActivity = [
        { action: "Medication dispensed", time: "2 hours ago", details: "Paracetamol 500mg for Patient #123" },
        { action: "Request processed", time: "4 hours ago", details: "Amoxicillin 250mg for Patient #456" },
        { action: "New request received", time: "6 hours ago", details: "Ibuprofen 400mg for Patient #789" },
        { action: "Medication dispensed", time: "1 day ago", details: "Omeprazole 20mg for Patient #321" },
        { action: "Request processed", time: "1 day ago", details: "Cetirizine 10mg for Patient #654" },
      ];

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        todayRequests,
        weeklyRequests,
        monthlyRequests,
        topMedications,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading report stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const exportReport = () => {
    // This would generate and download a report
    console.log("Exporting report...");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadReportStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Requests
            </CardTitle>
            <Pill className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-gray-500">
              All time medication requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-gray-500">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayRequests}</div>
            <p className="text-xs text-gray-500">
              Processed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Weekly Requests
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyRequests}</div>
            <p className="text-xs text-gray-500">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Top Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topMedications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No medication data available</p>
              ) : (
                stats.topMedications.map((medication, index) => (
                  <div key={medication.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{medication.name}</span>
                    </div>
                    <Badge variant="secondary">{medication.count} requests</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{stats.monthlyRequests}</p>
              <p className="text-sm text-gray-500">Requests this month</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">vs last month</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  +{getPercentageChange(stats.monthlyRequests, stats.monthlyRequests - 5)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 