"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock,
  AlertCircle,
  RefreshCw,
  Bell,
  Volume2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MedicationRequest {
  id: number;
  opd_no: string | null;
  ipd_no: string | null;
  medication_id: number;
  request_date: string;
  status: string;
  patient_name?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  doctor_name?: string;
}

export default function MedicationRequestsPage() {
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [pollingActive, setPollingActive] = useState(true);
  const [isPageActive, setIsPageActive] = useState(true);
  const { toast } = useToast();
  
  // Audio reference for notification sound
  const audioRef = useRef<any>(null);

  useEffect(() => {
    loadMedicationRequests();
    setupRealtimeSubscription();
    
    // Initialize audio context
    audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Test sound after 2 seconds to ensure audio context is ready
    setTimeout(() => {
      console.log('🔊 Testing sound on page load...');
      playNotificationSound();
    }, 2000);
    
    // Add click event listener to unlock audio context
    const unlockAudio = () => {
      if (audioRef.current && audioRef.current.state === 'suspended') {
        audioRef.current.resume();
        console.log('🔓 Audio context unlocked by user interaction');
      }
    };
    
    // Listen for any user interaction to unlock audio
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    
    // Test if real-time is working by checking subscription status after 3 seconds
    setTimeout(() => {
      console.log('🔍 Testing real-time subscription status...');
      const channel = supabase.channel('medication_requests_changes');
      console.log('Channel state:', channel);
    }, 3000);
    
    // Set up smart polling to stay within free tier limits
    const pollingInterval = setInterval(() => {
      // Only poll if page is active and visible
      if (isPageActive && !document.hidden) {
        console.log('🔄 Smart polling refresh - checking for new requests...');
        setPollingActive(true);
        loadMedicationRequests().finally(() => {
          setPollingActive(false);
        });
      } else {
        console.log('⏸️ Skipping poll - page inactive or hidden');
      }
    }, 30000); // 30 seconds to reduce API calls
    
    return () => {
      // Cleanup subscription and polling
      clearInterval(pollingInterval);
      const subscription = supabase
        .channel('medication_requests_changes')
        .unsubscribe();
    };
  }, []);

  const playNotificationSound = async () => {
    console.log('playNotificationSound called');
    try {
      // Resume audio context if suspended (browser requirement)
      if (audioRef.current && audioRef.current.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await audioRef.current.resume();
        console.log('Audio context resumed, new state:', audioRef.current.state);
      }
      
      const audioContext = audioRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context state:', audioContext.state);
      
      // Wait a bit for the audio context to be ready
      if (audioContext.state === 'running') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        console.log('Notification sound played successfully');
        
        // Store the audio context for reuse
        audioRef.current = audioContext;
      } else {
        console.log('❌ Audio context not ready, state:', audioContext.state);
        // Try to unlock audio context
        if (audioContext.state === 'suspended') {
          console.log('🔓 Attempting to unlock audio context...');
          await audioContext.resume();
          // Try again after resume
          setTimeout(() => {
            playNotificationSound();
          }, 100);
        }
      }
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('Setting up real-time subscription...');
    
    // First, let's test if we can connect to Supabase real-time
    const subscription = supabase
      .channel('medication_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'medication_dispense_requests'
        },
        (payload) => {
          console.log('🎯 REAL-TIME EVENT RECEIVED:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          console.log('New medication request received:', payload);
          console.log('Sound enabled:', soundEnabled);
          console.log('Audio ref exists:', !!audioRef.current);
          
          // Play notification sound
          if (soundEnabled && audioRef.current) {
            console.log('Attempting to play notification sound...');
            playNotificationSound().catch(error => {
              console.log('Error playing notification sound:', error);
            });
          } else {
            console.log('Sound not played - enabled:', soundEnabled, 'audio ref:', !!audioRef.current);
          }
          
          // Show toast notification
          toast({
            title: "New Medication Request",
            description: "A new medication request has been received! Auto-refreshing list...",
          });
          
          // Increment new requests counter
          setNewRequestsCount(prev => prev + 1);
          
          // Auto-refresh the requests list after a short delay
          setTimeout(() => {
            console.log('🔄 Auto-refreshing medication requests...');
            setAutoRefreshing(true);
            loadMedicationRequests().finally(() => {
              setAutoRefreshing(false);
            });
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription is ACTIVE and listening for changes');
        } else if (status === 'CLOSED') {
          console.log('❌ Real-time subscription CLOSED - attempting to reconnect...');
          // Try to reconnect after a delay
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect real-time subscription...');
            setupRealtimeSubscription();
          }, 3000);
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Real-time subscription ERROR - check Supabase configuration');
        } else {
          console.log('❌ Real-time subscription failed:', status);
        }
      });
  };

  const loadMedicationRequests = async () => {
    try {
      setLoading(true);

      // Store current request count to detect new ones
      const currentRequestCount = requests.length;
      console.log('Current request count:', currentRequestCount);

      // Clear new requests counter when manually refreshing
      setNewRequestsCount(0);

      // Get medication requests with related data (only pending requests)
      const { data: requestsData, error: requestsError } = await supabase
        .from("medication_dispense_requests")
        .select(`
          *,
          internal_medication:medication_id(
            medication_name,
            dosage,
            frequency,
            prescribed_by
          )
        `)
        .eq("status", "pending")
        .order("request_date", { ascending: false });

      if (requestsError) throw requestsError;

      // Process and enrich the data
      const enrichedRequests = await Promise.all(
        (requestsData || []).map(async (request) => {
          let patientName = "";
          let doctorName = "";

          // Get patient name from OPD or IPD
          if (request.opd_no) {
            const { data: opdData } = await supabase
              .from("opd_visits")
              .select("uhid, patient:uhid(full_name)")
              .eq("opd_no", request.opd_no)
              .single();
            
            patientName = (opdData?.patient as any)?.full_name || "";
          } else if (request.ipd_no) {
            const { data: ipdData } = await supabase
              .from("ipd_admissions")
              .select("uhid, patient:uhid(full_name)")
              .eq("ipd_no", request.ipd_no)
              .single();
            
            patientName = (ipdData?.patient as any)?.full_name || "";
          }

          // Get doctor name
          if (request.internal_medication?.prescribed_by) {
            const { data: doctorData } = await supabase
              .from("staff")
              .select("full_name")
              .eq("id", request.internal_medication.prescribed_by)
              .single();
            
            doctorName = doctorData?.full_name || "";
          }

          return {
            ...request,
            patient_name: patientName,
            medication_name: request.internal_medication?.medication_name || "",
            dosage: request.internal_medication?.dosage || "",
            frequency: request.internal_medication?.frequency || "",
            doctor_name: doctorName,
          };
        })
      );

      // Check if new requests were found
      const newRequestCount = enrichedRequests.length - currentRequestCount;
      console.log('New requests found:', newRequestCount);
      
      if (newRequestCount > 0) {
        console.log('🎉 New medication requests detected!');
        
        // Play notification sound
        if (soundEnabled && audioRef.current) {
          console.log('🔊 Playing notification sound for new requests...');
          playNotificationSound().catch(error => {
            console.log('Error playing notification sound:', error);
          });
        }
        
        // Show toast notification
        toast({
          title: "New Medication Requests",
          description: `${newRequestCount} new medication request${newRequestCount > 1 ? 's' : ''} found!`,
        });
        
        // Update new requests counter
        setNewRequestsCount(prev => prev + newRequestCount);
      }
      
      setRequests(enrichedRequests);
    } catch (error) {
      console.error("Error loading medication requests:", error);
      toast({
        title: "Error",
        description: "Failed to load medication requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: number) => {
    try {
      setProcessingRequest(requestId);

      // Update request status to completed
      const { error: updateError } = await supabase
        .from("medication_dispense_requests")
        .update({ status: "completed" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create dispensed medication record
      const currentUserId = localStorage.getItem("userId");
      const { error: dispenseError } = await supabase
        .from("dispensed_medications")
        .insert({
          request_id: requestId,
          dispensed_by: currentUserId,
        });

      if (dispenseError) throw dispenseError;

      toast({
        title: "Success",
        description: "Medication request processed successfully",
      });

      // Reload requests
      await loadMedicationRequests();
    } catch (error) {
      console.error("Error processing request:", error);
      toast({
        title: "Error",
        description: "Failed to process medication request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Convert UTC to IST (UTC + 5:30)
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    
    return istDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.opd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.ipd_no?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pending Medication Requests</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Pending Medication Requests</h1>
          {newRequestsCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Bell className="h-3 w-3 mr-1" />
              {newRequestsCount} New
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Disable sound notifications" : "Enable sound notifications"}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            {soundEnabled ? "Sound On" : "Sound Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={playNotificationSound}
            title="Test notification sound"
          >
            <Bell className="h-4 w-4 mr-2" />
            Test Sound
          </Button>
                      <Button 
              onClick={loadMedicationRequests} 
              variant="outline" 
              size="sm"
              disabled={autoRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefreshing ? 'animate-spin' : ''}`} />
              {autoRefreshing ? 'Auto-refreshing...' : 'Refresh'}
            </Button>
            {pollingActive && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                Auto-refresh active
              </div>
            )}
            <Button 
              onClick={() => {
                console.log('🧪 Manual test: Simulating new request...');
                setNewRequestsCount(prev => prev + 1);
                toast({
                  title: "Test Notification",
                  description: "Testing auto-refresh functionality...",
                });
                setTimeout(() => {
                  loadMedicationRequests();
                }, 1000);
              }} 
              variant="outline" 
              size="sm"
            >
              🧪 Test Auto-refresh
            </Button>
            <Button 
              onClick={() => {
                console.log('🔍 Checking Supabase real-time status...');
                const channel = supabase.channel('test_channel');
                channel.subscribe((status) => {
                  console.log('Test channel status:', status);
                });
              }} 
              variant="outline" 
              size="sm"
            >
              🔍 Test Real-time
            </Button>
            <Button 
              onClick={() => {
                console.log('⚡ Manual check for new requests...');
                setPollingActive(true);
                loadMedicationRequests().finally(() => {
                  setPollingActive(false);
                });
              }} 
              variant="outline" 
              size="sm"
            >
              ⚡ Check Now
            </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, medication, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pending Medication Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No medication requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Patient</th>
                      <th className="text-left p-3 font-medium">OPD/IPD No</th>
                      <th className="text-left p-3 font-medium">Medication</th>
                      <th className="text-left p-3 font-medium">Dosage</th>
                      <th className="text-left p-3 font-medium">Frequency</th>
                      <th className="text-left p-3 font-medium">Doctor</th>
                      <th className="text-left p-3 font-medium">Request Date</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{request.patient_name || "N/A"}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {request.opd_no || request.ipd_no || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{request.medication_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.dosage}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.frequency}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{request.doctor_name}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{formatDate(request.request_date)}</div>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "View Details",
                                  description: `Viewing details for request #${request.id}`,
                                });
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessRequest(request.id)}
                                disabled={processingRequest === request.id}
                              >
                                {processingRequest === request.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{request.patient_name || "N/A"}</div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>OPD/IPD: {request.opd_no || request.ipd_no || "N/A"}</div>
                        <div>Medication: {request.medication_name}</div>
                        <div>Dosage: {request.dosage}</div>
                        <div>Frequency: {request.frequency}</div>
                        <div>Doctor: {request.doctor_name}</div>
                        <div>Date: {formatDate(request.request_date)}</div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            toast({
                              title: "View Details",
                              description: `Viewing details for request #${request.id}`,
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleProcessRequest(request.id)}
                            disabled={processingRequest === request.id}
                          >
                            {processingRequest === request.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 