"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SchedulePage() {
  const [therapists, setTherapists] = useState<any[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("all-therapists");
  const [selectedStatus, setSelectedStatus] = useState("all-statuses");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all therapists
      const { data: therapistData } = await supabase
        .from("staff")
        .select("id, full_name")
        .eq("role", "therapist");

      // Load all therapist assignments
      const { data: scheduleData } = await supabase
        .from("therapist_assignments")
        .select(`
          *,
          patient_opd:opd_no(uhid(full_name)),
          patient_ipd:ipd_no(uhid(full_name)),
          therapist:therapist_id(full_name)
        `)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      setTherapists(therapistData || []);
      setAllSchedules(scheduleData || []);
      setFilteredSchedules(scheduleData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allSchedules];

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(schedule => 
        schedule.scheduled_date === selectedDate
      );
    }

    // Filter by therapist
    if (selectedTherapist && selectedTherapist !== "all-therapists") {
      filtered = filtered.filter(schedule => 
        schedule.therapist_id === selectedTherapist
      );
    }

    // Filter by status
    if (selectedStatus && selectedStatus !== "all-statuses") {
      filtered = filtered.filter(schedule => 
        schedule.status === selectedStatus
      );
    }

    setFilteredSchedules(filtered);
  };

  const clearFilters = () => {
    setSelectedDate("");
    setSelectedTherapist("all-therapists");
    setSelectedStatus("all-statuses");
    setFilteredSchedules(allSchedules);
  };

  const getPatientName = (schedule: any) => {
    return schedule.patient_opd?.full_name || schedule.patient_ipd?.full_name || "Unknown Patient";
  };

  const getVisitType = (schedule: any) => {
    return schedule.opd_no ? "OPD" : "IPD";
  };

  const getVisitNumber = (schedule: any) => {
    return schedule.opd_no || schedule.ipd_no;
  };

  const groupSchedulesByDate = (schedules: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    schedules.forEach(schedule => {
      const date = schedule.scheduled_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(schedule);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, schedules]) => ({ date, schedules }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const groupedSchedules = groupSchedulesByDate(filteredSchedules);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Therapist Schedules</h1>
          <p className="text-gray-600">View all therapist schedules and assignments</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Select date"
              />
            </div>
            <div>
              <Label>Therapist</Label>
              <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                <SelectTrigger>
                  <SelectValue placeholder="All therapists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-therapists">All therapists</SelectItem>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredSchedules.length}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filteredSchedules.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {filteredSchedules.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules by Date */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading schedules...</p>
          </CardContent>
        </Card>
      ) : groupedSchedules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-600">No therapy sessions match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedSchedules.map(({ date, schedules }) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatDate(date)}
                  <Badge variant="outline">{schedules.length} sessions</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{getPatientName(schedule)}</h3>
                            <Badge variant="outline">{getVisitType(schedule)}</Badge>
                            <Badge variant={schedule.status === 'completed' ? 'default' : 'secondary'}>
                              {schedule.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Visit Number:</strong> {getVisitNumber(schedule)}</div>
                            <div><strong>Therapist:</strong> {schedule.therapist?.full_name || "Unassigned"}</div>
                            <div><strong>Time:</strong> {schedule.scheduled_time || "Not specified"}</div>
                            {schedule.notes && (
                              <div><strong>Notes:</strong> {schedule.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 