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

interface ProcedureRequest {
  id: number;
  opd_no: string | null;
  ipd_no: string | null;
  procedure_entry_id: number;
  requirements: string;
  quantity: string | null;
  request_date: string;
  status: string;
  requested_by: string;
  patient_name?: string;
  procedure_name?: string;
  doctor_name?: string;
}



export default function ProcedureRequirementsPage() {
  const [requests, setRequests] = useState<ProcedureRequest[]>([]);
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
  
  // Get current pharmacist ID from localStorage
  const pharmacistId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
  
  // Audio reference for notification sound
  const audioRef = useRef<any>(null);

  useEffect(() => {
    loadProcedureRequests();
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
      const channel = supabase.channel('procedure_requests_changes');
      console.log('Channel state:', channel);
    }, 3000);
    
    // Set up smart polling to stay within free tier limits
    const pollingInterval = setInterval(() => {
      // Only poll if page is active and visible
      if (isPageActive && !document.hidden) {
        console.log('🔄 Smart polling refresh - checking for new requests...');
        setPollingActive(true);
        loadProcedureRequests().finally(() => {
          setPollingActive(false);
        });
      } else {
        console.log('⏸️ Skipping poll - page inactive or hidden');
      }
    }, 30000); // 30 seconds to reduce API calls

    // Cleanup
    return () => {
      clearInterval(pollingInterval);
      // Cleanup real-time subscription
      supabase.removeAllChannels();
    };
  }, [isPageActive]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageActive(!document.hidden);
      if (!document.hidden) {
        console.log('📱 Page became visible - refreshing data...');
        loadProcedureRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const playNotificationSound = async () => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      // Create a simple notification sound
      const oscillator = audioRef.current.createOscillator();
      const gainNode = audioRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioRef.current.destination);

      oscillator.frequency.setValueAtTime(800, audioRef.current.currentTime);
      oscillator.frequency.setValueAtTime(600, audioRef.current.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + 0.3);

      oscillator.start(audioRef.current.currentTime);
      oscillator.stop(audioRef.current.currentTime + 0.3);

      console.log('🔊 Notification sound played');
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('🔌 Setting up real-time subscription for procedure requests...');
    
    const channel = supabase
      .channel('procedure_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'procedure_medicine_requirement_requests',
          filter: `status=eq.pending`
        },
        (payload) => {
          console.log('🆕 New procedure request received:', payload);
          setNewRequestsCount(prev => prev + 1);
          
          // Play notification sound for new requests
          if (soundEnabled) {
            playNotificationSound();
          }
          
          // Show toast notification
          const requestType = payload.new.opd_no ? 'OPD' : 'IPD';
          const requestNumber = payload.new.opd_no || payload.new.ipd_no;
          toast({
            title: "New Procedure Request",
            description: `New procedure requirements request received for ${requestType}: ${requestNumber}`,
          });
          
          // Refresh the list
          loadProcedureRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'procedure_medicine_requirement_requests'
        },
        (payload) => {
          console.log('🔄 Procedure request updated:', payload);
          loadProcedureRequests();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });
  };

  const loadProcedureRequests = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading procedure requests...');

      // First, let's get all requests without joins to see what we have
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('procedure_medicine_requirement_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (allRequestsError) {
        console.error('Error loading all requests:', allRequestsError);
        throw allRequestsError;
      }

      console.log('🔍 All procedure requests:', allRequests);
      console.log('🔍 IPD requests found:', allRequests?.filter(r => r.ipd_no) || []);

      // Now get the full data with joins - using a more robust approach
      const { data, error } = await supabase
        .from('procedure_medicine_requirement_requests')
        .select(`
          *,
          procedure_entries(
            id,
            procedure_name,
            opd_no,
            ipd_no,
            opd_visits(
              uhid,
              patients(full_name)
            ),
            ipd_admissions(
              uhid,
              patients(full_name)
            )
          ),
          staff(full_name)
        `)
        .order('request_date', { ascending: false });

      if (error) {
        console.error('Error loading procedure requests:', error);
        throw error;
      }

      console.log('🔍 Raw data with joins:', data);

      // Let's also check the procedure entries directly for IPD requests
      const ipdRequests = allRequests?.filter(r => r.ipd_no) || [];
      if (ipdRequests.length > 0) {
        console.log('🔍 Checking procedure entries for IPD requests...');
        for (const ipdRequest of ipdRequests) {
          const { data: procedureEntry } = await supabase
            .from('procedure_entries')
            .select(`
              *,
              ipd_admissions(
                uhid,
                patients(full_name)
              )
            `)
            .eq('id', ipdRequest.procedure_entry_id)
            .single();
          
          console.log(`🔍 Procedure entry for IPD request ${ipdRequest.id}:`, procedureEntry);
        }
      }

      // Transform the data to match our interface
      const transformedRequests = await Promise.all(data?.map(async request => {
        console.log('🔍 Processing request:', {
          id: request.id,
          opd_no: request.opd_no,
          ipd_no: request.ipd_no,
          procedure_entries: request.procedure_entries,
          staff: request.staff
        });

        // Get patient name from either OPD or IPD
        let patientName = "Unknown";
        let procedureName = "Unknown";
        
        // First try to get data from procedure_entries if it exists
        if (request.procedure_entries) {
          if (request.procedure_entries.opd_visits?.patients?.full_name) {
            patientName = request.procedure_entries.opd_visits.patients.full_name;
            console.log('🔍 Found OPD patient name from procedure entry:', patientName);
          } else if (request.procedure_entries.ipd_admissions?.patients?.full_name) {
            patientName = request.procedure_entries.ipd_admissions.patients.full_name;
            console.log('🔍 Found IPD patient name from procedure entry:', patientName);
          }
          
          if (request.procedure_entries.procedure_name) {
            procedureName = request.procedure_entries.procedure_name;
            console.log('🔍 Found procedure name from procedure entry:', procedureName);
          }
        }
        
        // If we still don't have the data, try direct queries
        if (patientName === "Unknown") {
          console.log('🔍 No patient name found from procedure entry, trying direct queries...');
          if (request.opd_no) {
            console.log('🔍 Trying to get patient name from OPD visit directly...');
            const { data: opdData } = await supabase
              .from('opd_visits')
              .select('patients(full_name)')
              .eq('opd_no', request.opd_no)
              .single();
            if (opdData?.patients?.full_name) {
              patientName = opdData.patients.full_name;
              console.log('🔍 Found patient name from direct OPD query:', patientName);
            }
          } else if (request.ipd_no) {
            console.log('🔍 Trying to get patient name from IPD admission directly...');
            const { data: ipdData } = await supabase
              .from('ipd_admissions')
              .select('patients(full_name)')
              .eq('ipd_no', request.ipd_no)
              .single();
            if (ipdData?.patients?.full_name) {
              patientName = ipdData.patients.full_name;
              console.log('🔍 Found patient name from direct IPD query:', patientName);
            }
          }
        }
        
        // Log if we still don't have procedure name
        if (procedureName === "Unknown") {
          console.log('🔍 No procedure name found for request:', request.id);
        }

        return {
          id: request.id,
          opd_no: request.opd_no,
          ipd_no: request.ipd_no,
          procedure_entry_id: request.procedure_entry_id,
          requirements: request.requirements,
          quantity: request.quantity,
          request_date: request.request_date,
          status: request.status,
          requested_by: request.requested_by,
          patient_name: patientName,
          procedure_name: procedureName,
          doctor_name: request.staff?.full_name
        };
      }) || []);

      setRequests(transformedRequests);
      setLastRefreshTime(new Date());
      console.log(`✅ Loaded ${transformedRequests.length} procedure requests`);
    } catch (error) {
      console.error('Error loading procedure requests:', error);
      toast({
        title: "Error",
        description: "Failed to load procedure requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleProcessRequest = async (requestId: number) => {
    try {
      setProcessingRequest(requestId);
      console.log(`🔄 Processing procedure request ${requestId}...`);

      // First, update the request status to approved
      const { error: updateError } = await supabase
        .from('procedure_medicine_requirement_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        throw updateError;
      }

      // Then, create a record in dispensed_procedure_requirements table
      const { error: dispenseError } = await supabase
        .from('dispensed_procedure_requirements')
        .insert({
          request_id: requestId,
          dispensed_by: pharmacistId,
          dispensed_date: new Date().toISOString(),
          notes: 'Approved and dispensed by pharmacist'
        });

      if (dispenseError) {
        console.error('Error creating dispensed record:', dispenseError);
        throw dispenseError;
      }

      toast({
        title: "Success",
        description: "Procedure request approved and dispensed successfully",
      });

      // Refresh the list
      await loadProcedureRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.opd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.ipd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.procedure_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requirements?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Procedure Requirements</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage procedure requirements requests</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadProcedureRequests}
            disabled={loading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-xl sm:text-2xl font-bold">{requests.length}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by OPD/IPD, patient, procedure, or requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-xs sm:text-sm font-medium">Actions</label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Requests List */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">
             Procedure Requests ({filteredRequests.length})
             {newRequestsCount > 0 && (
               <Badge variant="destructive" className="ml-2">
                 {newRequestsCount} New
               </Badge>
             )}
           </CardTitle>
                       <p className="text-sm text-muted-foreground">
              Last updated: {lastRefreshTime.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
              {pollingActive && <span className="ml-2 text-blue-600">🔄 Refreshing...</span>}
            </p>
         </CardHeader>
         <CardContent>
           {loading ? (
             <div className="flex items-center justify-center h-64">
               <div className="text-lg">Loading procedure requests...</div>
             </div>
           ) : filteredRequests.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               {searchTerm || statusFilter !== "all" ? 
                 "No procedure requests match your filters" : 
                 "No procedure requests found"
               }
             </div>
           ) : (
             <div className="space-y-4">
               {filteredRequests.map((request) => (
                 <Card key={request.id} className="hover:shadow-md transition-shadow">
                   <CardContent className="p-4">
                     <div className="flex justify-between items-start">
                       <div className="space-y-2 flex-1">
                         <div className="flex items-center gap-4">
                           <Badge variant="secondary" className="text-sm">
                             {request.opd_no || request.ipd_no}
                           </Badge>
                           {getStatusBadge(request.status)}
                           <span className="text-sm text-muted-foreground">
                             {formatDate(request.request_date)}
                           </span>
                         </div>
                         
                         <div className="space-y-1">
                           <div className="font-medium">
                             Patient: {request.patient_name || "Unknown"}
                           </div>
                           <div className="text-sm text-muted-foreground">
                             Doctor: {request.doctor_name || "Unknown"}
                           </div>
                           <div className="text-sm text-muted-foreground">
                             Procedure: {request.procedure_name || "Unknown"}
                           </div>
                         </div>
                         
                         <div className="text-sm">
                           <span className="font-medium">Requirements:</span>
                           <p className="mt-1 text-muted-foreground">
                             {request.requirements || "No requirements specified"}
                           </p>
                         </div>
                         
                         {request.quantity && (
                           <div className="text-sm">
                             <span className="font-medium">Quantity:</span>
                             <span className="ml-2 text-muted-foreground">{request.quantity}</span>
                           </div>
                         )}
                       </div>
                       
                       <div className="flex items-center gap-2">
                         {request.status === 'pending' && (
                           <Button
                             onClick={() => handleProcessRequest(request.id)}
                             disabled={processingRequest === request.id}
                             className="flex items-center gap-2"
                           >
                             {processingRequest === request.id ? (
                               <RefreshCw className="w-4 h-4 animate-spin" />
                             ) : (
                               <CheckCircle className="w-4 h-4" />
                             )}
                             {processingRequest === request.id ? 'Processing...' : 'Approve'}
                           </Button>
                         )}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </CardContent>
       </Card>

       
     </div>
   );
} 