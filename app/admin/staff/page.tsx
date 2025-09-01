"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboardLayout from "@/components/admin-dashboard-layout";
import { UserPlus, Users, Shield, CalendarDays, UserCircle2 } from "lucide-react";

// Department map (id -> name) from provided schema list
const DEPARTMENTS_MAP: Record<number, string> = {
  1: "Kayachikitsa",
  2: "Panchakarma",
  3: "Shalya Tantra",
  4: "Shalakya Tantra",
  5: "Prasooti & Striroga",
  6: "Balaroga",
  7: "Swasthavritta",
  8: "Agadatantra",
  9: "Other",
  10: "Aatyayikachikitsa",
};

// Seed staff list (UI-only; backend wiring later)
const STAFF_SEED = [
  { id: "dr_aishwarya", full_name: "Dr Aishwarya", role: "doctor", department_id: 2, sub_department_id: null },
  { id: "dr_ambika", full_name: "Dr Ambika", role: "doctor", department_id: 9, sub_department_id: null },
  { id: "dr_basavraj", full_name: "Dr Basavaraj", role: "doctor", department_id: 9, sub_department_id: null },
  { id: "dr_karamudi", full_name: "Dr C S Karamudi", role: "doctor", department_id: 7, sub_department_id: null },
  { id: "dr_keerti", full_name: "Dr Keerthy Priya", role: "doctor", department_id: 9, sub_department_id: null },
  { id: "dr_manpreeth", full_name: "Dr Manpreeth Mali Patil", role: "doctor", department_id: 6, sub_department_id: null },
  { id: "dr_roja", full_name: "Dr Roja", role: "doctor", department_id: 2, sub_department_id: null },
  { id: "dr_santosh", full_name: "Dr Santosh Kumar", role: "doctor", department_id: 9, sub_department_id: null },
  { id: "dr_saraswati", full_name: "Dr Saraswati", role: "doctor", department_id: 9, sub_department_id: null },
  { id: "dr_shankranand", full_name: "Dr Shankrananda", role: "doctor", department_id: 3, sub_department_id: null },
  { id: "dr_shrutika", full_name: "Dr Shrutika", role: "doctor", department_id: 1, sub_department_id: null },
  { id: "dr_siddharth", full_name: "Dr Siddharth Patil", role: "doctor", department_id: 9, sub_department_id: null },
  { id: "dr_soumya", full_name: "Dr Soumya", role: "doctor", department_id: 7, sub_department_id: null },
  { id: "dr_supreeta", full_name: "Dr Supreeta", role: "doctor", department_id: 8, sub_department_id: null },
  { id: "dr_sushmita", full_name: "Dr Sushmita", role: "doctor", department_id: 5, sub_department_id: null },
  { id: "dr_swati", full_name: "Dr Swati B R", role: "doctor", department_id: 7, sub_department_id: null },
  { id: "dr_uma", full_name: "Dr Uma Kembavi", role: "doctor", department_id: 4, sub_department_id: 1 },
  { id: "dr_vamshi", full_name: "Dr Vamshi Krishna", role: "doctor", department_id: 4, sub_department_id: 2 },
  { id: "receptionist", full_name: "Receptionist User", role: "receptionist", department_id: null, sub_department_id: null },
  { id: "pharmacist", full_name: "Pharmacist User", role: "pharmacist", department_id: null, sub_department_id: null },
  { id: "th_001", full_name: "Dr. Rajesh Kumar", role: "therapist", department_id: null, sub_department_id: null },
  { id: "th_002", full_name: "Dr. Priya Sharma", role: "therapist", department_id: null, sub_department_id: null },
  { id: "th_003", full_name: "Dr. Amit Patel", role: "therapist", department_id: null, sub_department_id: null },
  { id: "th_004", full_name: "Dr. Sunita Verma", role: "therapist", department_id: null, sub_department_id: null },
  { id: "nr_001", full_name: "Nurse Anjali Rao", role: "nurse", department_id: null, sub_department_id: null },
  { id: "nr_002", full_name: "Nurse Deepak Mehta", role: "nurse", department_id: null, sub_department_id: null },
  { id: "nr_003", full_name: "Nurse Kavya Nair", role: "nurse", department_id: null, sub_department_id: null },
  { id: "nr_004", full_name: "Nurse Sameer Khan", role: "nurse", department_id: null, sub_department_id: null },
  { id: "pmo_officer", full_name: "PMO OFFICER", role: "doctor", department_id: 10, sub_department_id: null },
  { id: "admin_01", full_name: "admin user", role: "admin", department_id: null, sub_department_id: null },
];

export default function AdminStaffPage() {
  const doctors = STAFF_SEED.filter((s) => s.role === "doctor");
  const therapists = STAFF_SEED.filter((s) => s.role === "therapist");
  const nurses = STAFF_SEED.filter((s) => s.role === "nurse");

  // Deterministic pseudo-random generator to vary numbers per doctor (stable across reloads)
  function hashToFloat(input: string): number {
    let hash = 2166136261; // FNV-1a base
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const uint = Math.abs(hash >>> 0);
    return uint / 0xffffffff; // 0..1
  }
  function randInRange(seed: string, min: number, max: number): number {
    const r = hashToFloat(seed);
    return min + r * (max - min);
  }
  type DocStats = { totalPatients: number; totalIpd: number; totalOpd: number; todayAppointments: number };
  function generateDoctorStats(id: string, departmentId: number | null): DocStats {
    // Give small bias to Kayachikitsa (1) by increasing upper bound slightly
    const upper = departmentId === 1 ? 360 : 320;
    const lower = departmentId === 1 ? 200 : 160;
    const totalPatients = Math.round(randInRange(`${id}:patients`, lower, upper));
    const ipdRatio = randInRange(`${id}:ipd`, 0.18, 0.35);
    const totalIpd = Math.max(1, Math.round(totalPatients * ipdRatio));
    const totalOpd = Math.max(totalPatients - totalIpd, 0);
    const todayAppointments = Math.max(1, Math.round(randInRange(`${id}:today`, 1, 6)));
    return { totalPatients, totalIpd, totalOpd, todayAppointments };
  }
  const statsByDoctorId: Record<string, DocStats> = Object.fromEntries(
    doctors.map((d) => [d.id, generateDoctorStats(d.id, d.department_id as number | null)])
  );

  return (
    <AdminDashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Staff Management</h1>
            <p className="text-sm text-gray-600">Manage hospital staff, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Coming Soon</span>
          </div>
        </div>

        {/* Doctors Overview Cards (UI only; wire backend later) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Doctors Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCircle2 className="h-6 w-6 text-blue-600" />
                      </div>
    <div>
                        <div className="font-semibold text-gray-900">{doc.full_name}</div>
                        <div className="text-xs text-gray-600">{doc.department_id ? DEPARTMENTS_MAP[doc.department_id] : "N/A"}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{doc.id}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-blue-50 p-3">
                      <div className="flex items-center gap-2 text-blue-700 text-xs">
                        <CalendarDays className="h-4 w-4" /> Today Appointments
                      </div>
                      <div className="mt-1 text-2xl font-bold text-blue-900">
                        {statsByDoctorId[doc.id]?.todayAppointments ?? 0}
                      </div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="text-xs text-gray-600">Total Patients</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900">
                        {statsByDoctorId[doc.id]?.totalPatients ?? 0}
                      </div>
                    </div>
                    <div className="rounded-md bg-green-50 p-3">
                      <div className="text-xs text-green-700">Total OPD</div>
                      <div className="mt-1 text-2xl font-bold text-green-900">
                        {statsByDoctorId[doc.id]?.totalOpd ?? 0}
                      </div>
                    </div>
                    <div className="rounded-md bg-purple-50 p-3">
                      <div className="text-xs text-purple-700">Total IPD</div>
                      <div className="mt-1 text-2xl font-bold text-purple-900">
                        {statsByDoctorId[doc.id]?.totalIpd ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Therapists Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Therapists Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {therapists.map((t) => (
                <div key={t.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{t.full_name}</div>
                    <div className="text-xs text-gray-500">{t.id}</div>
                  </div>
                  <div className="text-xs text-gray-600">Assignments Today</div>
                  <div className="text-2xl font-bold">0</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nurses Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nurses Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {nurses.map((n) => (
                <div key={n.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{n.full_name}</div>
                    <div className="text-xs text-gray-500">{n.id}</div>
                  </div>
                  <div className="text-xs text-gray-600">Patients Today</div>
                  <div className="text-2xl font-bold">0</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technician Overview (numbers only) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Technician Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm text-gray-600">Total Investigations Performed</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">5200</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Management Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Add New Staff</h3>
                <p className="text-sm text-gray-600">Register new staff members with appropriate roles</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Manage Roles</h3>
                <p className="text-sm text-gray-600">Assign and modify staff roles and permissions</p>
              </div>
              <div className="text-center p-6 border rounded-lg">
                <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Access Control</h3>
                <p className="text-sm text-gray-600">Control access to different system modules</p>
      </div>
    </div>
            <div className="mt-8 text-center text-gray-500">
              <p>Staff management functionality will be implemented in the next phase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
} 