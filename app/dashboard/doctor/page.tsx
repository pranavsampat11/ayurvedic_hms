"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  Calendar,
  Bed,
  FileText,
  Users,
  Activity,
  TrendingUp,
  Bell
} from "lucide-react";
import Link from "next/link";

interface DoctorStats {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  average_response_time: number;
  total_patients: number;
  active_patients: number;
}

interface RecentReferral {
  id: number;
  patient_name: string;
  referred_by_name: string;
  status: string;
  priority: string;
  created_at: string;
  department: string;
}

export default function DoctorDashboardPage() {
  const [doctorStats, setDoctorStats] = useState<DoctorStats>({
    total_referrals: 0,
    pending_referrals: 0,
    completed_referrals: 0,
    average_response_time: 0,
    total_patients: 0,
    active_patients: 0
  });
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDoctorId, setCurrentDoctorId] = useState<string>(''); // Will be set from localStorage
  const { toast } = useToast();

  // Get current doctor ID from localStorage
  useEffect(() => {
    const doctorId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
    console.log("Current doctor ID from localStorage:", doctorId);
    if (doctorId) {
      setCurrentDoctorId(doctorId);
    }
  }, []);

  // Load doctor dashboard data
  const loadDashboardData = async () => {
    try {
      // Load referred patients stats
      const { data: referralsData, error: referralsError } = await supabase
        .from('referred_assessments')
        .select(`
          *,
          referred_by:staff!referred_assessments_referred_by_id_fkey(full_name),
          ipd_admissions!referred_assessments_ipd_no_fkey(
            bed_number,
            uhid,
            patients!ipd_admissions_uhid_fkey(
              full_name,
              age,
              gender
            )
          ),
          opd_visits!referred_assessments_opd_no_fkey(
            patients!opd_visits_uhid_fkey(
              full_name,
              age,
              gender
            )
          )
        `)
        .eq('referred_to_id', currentDoctorId)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      if (referralsData) {
        const transformedReferrals = referralsData.map((item: any) => ({
          id: item.id,
          patient_name: item.ipd_admissions?.patients?.full_name || item.opd_visits?.patients?.full_name,
          referred_by_name: item.referred_by?.full_name,
          status: item.status,
          priority: item.priority,
          created_at: item.created_at,
          department: item.department
        }));

        setRecentReferrals(transformedReferrals.slice(0, 5)); // Show last 5

        // Calculate stats
        const stats: DoctorStats = {
          total_referrals: transformedReferrals.length,
          pending_referrals: transformedReferrals.filter(p => p.status === 'pending').length,
          completed_referrals: transformedReferrals.filter(p => p.status === 'completed').length,
          average_response_time: calculateAverageResponseTime(referralsData),
          total_patients: new Set(transformedReferrals.map(r => r.patient_name)).size,
          active_patients: new Set(transformedReferrals.filter(r => r.status === 'pending' || r.status === 'accepted').map(r => r.patient_name)).size
        };
        setDoctorStats(stats);
      }

      // Load patient stats (IPD patients assigned to this doctor)
      const { data: ipdData, error: ipdError } = await supabase
        .from('ipd_admissions')
        .select('*')
        .eq('doctor_id', currentDoctorId);

      if (!ipdError && ipdData) {
        setDoctorStats(prev => ({
          ...prev,
          total_patients: prev.total_patients + ipdData.length,
          active_patients: prev.active_patients + ipdData.filter(p => p.discharge_date === null).length
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageResponseTime = (referrals: any[]): number => {
    const completedReferrals = referrals.filter(p => p.response_at);
    if (completedReferrals.length === 0) return 0;

    const totalHours = completedReferrals.reduce((sum, referral) => {
      const created = new Date(referral.created_at);
      const responded = new Date(referral.response_at);
      const diffHours = Math.floor((responded.getTime() - created.getTime()) / (1000 * 60 * 60));
      return sum + diffHours;
    }, 0);

    return Math.round(totalHours / completedReferrals.length);
  };

  useEffect(() => {
    if (currentDoctorId) {
      loadDashboardData();
    }
  }, [currentDoctorId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'accepted': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Doctor Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome back, Dr. Manpreet</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{doctorStats.total_referrals}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Referrals</p>
                <p className="text-2xl font-bold text-yellow-600">{doctorStats.pending_referrals}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-green-600">{doctorStats.active_patients}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{doctorStats.average_response_time}h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <Link href="/dashboard/doctor/referred-patients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Referred Patients</h3>
                  <p className="text-sm text-gray-600">View and respond to referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/patients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">My Patients</h3>
                  <p className="text-sm text-gray-600">Manage your patient list</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/schedule">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Schedule</h3>
                  <p className="text-sm text-gray-600">View appointments and rounds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Referrals</CardTitle>
              <Link href="/dashboard/doctor/referred-patients">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReferrals.length > 0 ? (
                recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(referral.status)}
                      <div>
                        <p className="font-medium">{referral.patient_name}</p>
                        <p className="text-sm text-gray-600">
                          Referred by {referral.referred_by_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(referral.status)}>
                        {referral.status.toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(referral.priority)}>
                        {referral.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent referrals</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm text-gray-600">
                  {doctorStats.total_referrals > 0 
                    ? Math.round((doctorStats.completed_referrals / doctorStats.total_referrals) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Urgent Referrals</span>
                <span className="text-sm text-red-600 font-medium">
                  {recentReferrals.filter(r => r.priority === 'urgent').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Today's Referrals</span>
                <span className="text-sm text-gray-600">
                  {recentReferrals.filter(r => {
                    const today = new Date().toDateString();
                    const referralDate = new Date(r.created_at).toDateString();
                    return today === referralDate;
                  }).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Response Time</span>
                <span className="text-sm text-gray-600">{doctorStats.average_response_time}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{doctorStats.total_referrals}</div>
              <p className="text-sm text-gray-600">Total Referrals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{doctorStats.completed_referrals}</div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{doctorStats.pending_referrals}</div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 