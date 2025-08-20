"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { 
  Users, 
  Bed, 
  DollarSign, 
  UserCheck, 
  UserX, 
  Activity,
  TrendingUp,
  Building2,
  Calendar,
  FileText,
  Package,
  Stethoscope,
  User,
  BarChart
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalPatients: number;
  totalMalePatients: number;
  totalFemalePatients: number;
  totalOtherPatients: number;
  totalIpdPatients: number;
  totalDischargedPatients: number;
  activePatients: number;
  totalDeposits: number;
  totalRevenue: number;
  totalStaff: number;
  totalDepartments: number;
  totalBeds: number;
  occupiedBeds: number;
  totalAppointments: number;
  pendingAppointments: number;
}

export default function AdminDashboardPage() {
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalPatients: 0,
    totalMalePatients: 0,
    totalFemalePatients: 0,
    totalOtherPatients: 0,
    totalIpdPatients: 0,
    totalDischargedPatients: 0,
    activePatients: 0,
    totalDeposits: 0,
    totalRevenue: 0,
    totalStaff: 0,
    totalDepartments: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    totalAppointments: 0,
    pendingAppointments: 0
  });
  const [revenueDisplay, setRevenueDisplay] = useState<string>("₹0");
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const { toast } = useToast();

  // Load admin dashboard data
  const loadDashboardData = async () => {
    try {
      let activeIpdCount = 0;

      // Load patient statistics (count-based)
      try {
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });

        const [maleRes, femaleRes, otherRes] = await Promise.all([
          supabase.from('patients').select('*', { count: 'exact', head: true }).eq('gender', 'Male'),
          supabase.from('patients').select('*', { count: 'exact', head: true }).eq('gender', 'Female'),
          supabase.from('patients').select('*', { count: 'exact', head: true }).eq('gender', 'Other'),
        ]);

        setAdminStats(prev => ({
          ...prev,
          totalPatients: patientsCount || 0,
          totalMalePatients: maleRes.count || 0,
          totalFemalePatients: femaleRes.count || 0,
          totalOtherPatients: otherRes.count || 0,
        }));
      } catch (patientError) {
        console.warn('Could not load patient statistics:', patientError);
      }

      // Load IPD patients (count-based)
      try {
        const [{ count: totalIpdPatients }, { count: activePatients }, { count: dischargedPatients }] = await Promise.all([
          supabase.from('ipd_admissions').select('*', { count: 'exact', head: true }),
          supabase.from('ipd_admissions').select('*', { count: 'exact', head: true }).is('discharge_date', null),
          supabase.from('ipd_admissions').select('*', { count: 'exact', head: true }).not('discharge_date', 'is', null),
        ]);

        activeIpdCount = activePatients || 0;
        setAdminStats(prev => ({
          ...prev,
          totalIpdPatients: totalIpdPatients || 0,
          totalDischargedPatients: dischargedPatients || 0,
          activePatients: activeIpdCount,
        }));
      } catch (ipdError) {
        console.warn('Could not load IPD statistics:', ipdError);
      }

      // Bed statistics (fixed total = 60, occupied = active IPD)
      setAdminStats(prev => ({
        ...prev,
        totalBeds: 60,
        occupiedBeds: activeIpdCount,
      }));

      // Load appointment statistics
      try {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('status');

        if (!appointmentsError && appointmentsData) {
          const totalAppointments = appointmentsData.length;
          const pendingAppointments = appointmentsData.filter(a => a.status === 'pending').length;

          setAdminStats(prev => ({
            ...prev,
            totalAppointments,
            pendingAppointments
          }));
        }
      } catch (appointmentError) {
        console.warn('Could not load appointment statistics:', appointmentError);
      }

      // Load staff statistics
      try {
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*');

        if (!staffError && staffData) {
          setAdminStats(prev => ({
            ...prev,
            totalStaff: staffData.length
          }));
        }
      } catch (staffError) {
        console.warn('Could not load staff statistics:', staffError);
      }

      // Load department statistics
      try {
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('*');

        if (!departmentsError && departmentsData) {
          setAdminStats(prev => ({
            ...prev,
            totalDepartments: departmentsData.length
          }));
        }
      } catch (departmentError) {
        console.warn('Could not load department statistics:', departmentError);
      }

      // Financials (fixed display)
      setAdminStats(prev => ({
        ...prev,
        totalRevenue: 400000,
        totalDeposits: 0,
      }));
      setRevenueDisplay('₹4 L');

      // Load department-wise patient distribution - simplified approach
      try {
        const { data: deptPatientsData, error: deptPatientsError } = await supabase
          .from('patients')
          .select('department_id, gender');

        if (!deptPatientsError && deptPatientsData) {
          // Get department names separately
          const { data: departmentsData, error: deptError } = await supabase
            .from('departments')
            .select('id, name');

          if (!deptError && departmentsData) {
            const deptMap = departmentsData.reduce((acc: any, dept: any) => {
              acc[dept.id] = dept.name;
              return acc;
            }, {});

            const deptStats = deptPatientsData.reduce((acc: any, patient: any) => {
              const deptName = deptMap[patient.department_id] || 'Unknown';
              if (!acc[deptName]) {
                acc[deptName] = { total: 0, male: 0, female: 0, other: 0 };
              }
              acc[deptName].total++;
              if (patient.gender === 'Male') acc[deptName].male++;
              else if (patient.gender === 'Female') acc[deptName].female++;
              else acc[deptName].other++;
              return acc;
            }, {});

            setDepartmentStats(Object.entries(deptStats).map(([name, stats]: [string, any]) => ({
              name,
              ...stats
            })));
          }
        }
      } catch (deptError) {
        console.warn('Could not load department statistics:', deptError);
        // Set empty department stats if there's an error
        setDepartmentStats([]);
      }

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      {/* Main Dashboard Content - Full Width */}
    <div className="space-y-8">
        {/* Top Section with Title and Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Hospital Overview</h1>
            <p className="text-lg text-gray-600 mt-2">Real-time statistics and operational insights</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Activity className="h-5 w-5 mr-2" />
              Generate Report
            </Button>
            <Button size="lg" className="w-full sm:w-auto">
              <TrendingUp className="h-5 w-5 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-2">Total Patients</p>
                  <p className="text-3xl font-bold text-blue-900">{adminStats.totalPatients.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">All registered patients</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">IPD Patients</p>
                  <p className="text-3xl font-bold text-green-900">{adminStats.totalIpdPatients.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">Currently admitted</p>
                </div>
                <div className="p-3 bg-green-500 rounded-full shadow-md">
                  <Bed className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-2">Active Patients</p>
                  <p className="text-3xl font-bold text-orange-900">{adminStats.activePatients.toLocaleString()}</p>
                  <p className="text-xs text-orange-600 mt-1">Under treatment</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-full shadow-md">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-900">{revenueDisplay}</p>
                  <p className="text-xs text-purple-600 mt-1">This month</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gender Distribution and Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-800">Patient Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">Male Patients</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">{adminStats.totalMalePatients.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-pink-900">Female Patients</span>
                  </div>
                  <span className="text-lg font-bold text-pink-900">{adminStats.totalFemalePatients.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Other</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{adminStats.totalOtherPatients.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-800">Hospital Infrastructure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500 rounded-full">
                      <Bed className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Total Beds</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{adminStats.totalBeds.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-full">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-orange-900">Occupied Beds</span>
                  </div>
                  <span className="text-lg font-bold text-orange-900">{adminStats.occupiedBeds.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">Bed Occupancy Rate</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">
                    {adminStats.totalBeds > 0 ? Math.round((adminStats.occupiedBeds / adminStats.totalBeds) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-900">Total Staff</span>
                  </div>
                  <span className="text-lg font-bold text-green-900">{adminStats.totalStaff.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-purple-900">Departments</span>
                  </div>
                  <span className="text-lg font-bold text-purple-900">{adminStats.totalDepartments.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department-wise Patient Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Department-wise Patient Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Department</th>
                    <th className="text-center py-2 font-medium">Total Patients</th>
                    <th className="text-center py-2 font-medium">Male</th>
                    <th className="text-center py-2 font-medium">Female</th>
                    <th className="text-center py-2 font-medium">Other</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStats.map((dept, index) => (
                    <tr key={dept.name} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                      <td className="py-2 font-medium">{dept.name}</td>
                      <td className="py-2 text-center">{dept.total}</td>
                      <td className="py-2 text-center text-blue-600">{dept.male}</td>
                      <td className="py-2 text-center text-pink-600">{dept.female}</td>
                      <td className="py-2 text-center text-gray-600">{dept.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/admin/patients">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Manage Patients</h3>
                    <p className="text-sm text-gray-600">View and manage all patient records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/staff">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold">Staff Management</h3>
                    <p className="text-sm text-gray-600">Manage hospital staff and roles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reports">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BarChart className="h-8 w-8 text-purple-600" />
                  <p className="text-sm text-gray-600">Generate detailed reports and analytics</p>
      </div>
              </CardContent>
            </Card>
          </Link>
      </div>
    </div>
    </AdminDashboardLayout>
  );
} 