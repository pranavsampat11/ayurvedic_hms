"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  CheckCircle, 
  RefreshCw,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DispensedProcedureRequirement {
  id: number;
  request_id: number;
  dispensed_by: string;
  dispensed_date: string;
  notes: string;
  patient_name?: string;
  procedure_name?: string;
  requirements?: string;
  quantity?: string;
  pharmacist_name?: string;
  opd_no?: string;
  ipd_no?: string;
}

export default function DispensedProcedureRequirementsPage() {
  const [dispensedRequirements, setDispensedRequirements] = useState<DispensedProcedureRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadDispensedRequirements();
  }, []);

  const loadDispensedRequirements = async () => {
    try {
      setLoading(true);
      console.log('📦 Loading dispensed procedure requirements...');

      const { data, error } = await supabase
        .from('dispensed_procedure_requirements')
        .select(`
          *,
          procedure_medicine_requirement_requests!inner(
            requirements,
            quantity,
            opd_no,
            ipd_no,
            procedure_entries!inner(
              procedure_name,
              opd_visits(
                uhid,
                patients(full_name)
              ),
              ipd_admissions(
                uhid,
                patients(full_name)
              )
            )
          ),
          staff!inner(full_name)
        `)
        .order('dispensed_date', { ascending: false });

      if (error) {
        console.error('Error loading dispensed requirements:', error);
        throw error;
      }

      // Transform the data to match our interface
      const transformedDispensed = data?.map(dispensed => {
        // Get patient name from either OPD or IPD
        let patientName = "Unknown";
        if (dispensed.procedure_medicine_requirement_requests?.procedure_entries?.opd_visits?.patients?.full_name) {
          patientName = dispensed.procedure_medicine_requirement_requests.procedure_entries.opd_visits.patients.full_name;
        } else if (dispensed.procedure_medicine_requirement_requests?.procedure_entries?.ipd_admissions?.patients?.full_name) {
          patientName = dispensed.procedure_medicine_requirement_requests.procedure_entries.ipd_admissions.patients.full_name;
        }

        return {
          id: dispensed.id,
          request_id: dispensed.request_id,
          dispensed_by: dispensed.dispensed_by,
          dispensed_date: dispensed.dispensed_date,
          notes: dispensed.notes,
          patient_name: patientName,
          procedure_name: dispensed.procedure_medicine_requirement_requests?.procedure_entries?.procedure_name,
          requirements: dispensed.procedure_medicine_requirement_requests?.requirements,
          quantity: dispensed.procedure_medicine_requirement_requests?.quantity,
          pharmacist_name: dispensed.staff?.full_name,
          opd_no: dispensed.procedure_medicine_requirement_requests?.opd_no,
          ipd_no: dispensed.procedure_medicine_requirement_requests?.ipd_no
        };
      }) || [];

      setDispensedRequirements(transformedDispensed);
      console.log(`✅ Loaded ${transformedDispensed.length} dispensed requirements`);
    } catch (error) {
      console.error('Error loading dispensed requirements:', error);
      toast({
        title: "Error",
        description: "Failed to load dispensed requirements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const filteredDispensed = dispensedRequirements.filter(dispensed => {
    const matchesSearch = 
      dispensed.opd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispensed.ipd_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispensed.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispensed.procedure_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispensed.requirements?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispensed.pharmacist_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dispensed Procedure Requirements</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Records of approved and dispensed procedure requirements</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadDispensedRequirements}
            disabled={loading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Dispensed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{dispensedRequirements.length}</p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by OPD/IPD, patient, procedure, requirements, or pharmacist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispensed Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Dispensed Procedure Requirements ({filteredDispensed.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32 sm:h-64">
              <div className="text-sm sm:text-lg">Loading dispensed requirements...</div>
            </div>
          ) : filteredDispensed.length === 0 ? (
            <div className="text-center py-4 sm:py-8 text-muted-foreground text-sm sm:text-base">
              {searchTerm ? 
                "No dispensed requirements match your search" : 
                "No dispensed procedure requirements found"
              }
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredDispensed.map((dispensed) => (
                <Card key={dispensed.id} className="hover:shadow-md transition-shadow bg-green-50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs sm:text-sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Dispensed
                        </Badge>
                        {(dispensed.opd_no || dispensed.ipd_no) && (
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {dispensed.opd_no || dispensed.ipd_no}
                          </Badge>
                        )}
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {formatDate(dispensed.dispensed_date)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-medium text-sm sm:text-base">
                          Patient: {dispensed.patient_name || "Unknown"}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Procedure: {dispensed.procedure_name || "Unknown"}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Dispensed by: {dispensed.pharmacist_name || "Unknown"}
                        </div>
                      </div>
                      
                      <div className="text-xs sm:text-sm">
                        <span className="font-medium">Requirements:</span>
                        <p className="mt-1 text-muted-foreground break-words">
                          {dispensed.requirements || "No requirements specified"}
                        </p>
                      </div>
                      
                      {dispensed.quantity && (
                        <div className="text-xs sm:text-sm">
                          <span className="font-medium">Quantity:</span>
                          <span className="ml-2 text-muted-foreground break-words">{dispensed.quantity}</span>
                        </div>
                      )}
                      
                      {dispensed.notes && (
                        <div className="text-xs sm:text-sm">
                          <span className="font-medium">Notes:</span>
                          <span className="ml-2 text-muted-foreground break-words">{dispensed.notes}</span>
                        </div>
                      )}
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