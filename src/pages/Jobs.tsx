
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { MapPin, DollarSign, Clock, Building } from 'lucide-react';
import { JobFiltersComponent, JobFilters } from '@/components/JobFilters';

type Job = Tables<'jobs'>;
type CV = Tables<'cvs'>;

export default function Jobs() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    location: '',
    jobType: '',
    salaryMin: '',
    salaryMax: '',
  });
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Set<string>>(new Set());
  const [selectedCvs, setSelectedCvs] = useState<{ [jobId: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
    if (profile?.role === 'job_seeker') {
      fetchUserApplications();
      fetchUserCVs();
    }
  }, [profile]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', user.id);

      if (error) throw error;
      setApplications(new Set(data.map(app => app.job_id)));
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchUserCVs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCvs(data || []);
    } catch (error) {
      console.error('Error fetching CVs:', error);
    }
  };

  const applyToJob = async (jobId: string) => {
    if (!user || !profile) return;

    const selectedCvId = selectedCvs[jobId];
    if (!selectedCvId) {
      toast({
        title: "Please select a CV",
        description: "You need to select a CV to apply for this job.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          cv_id: selectedCvId,
          status: 'pending'
        });

      if (error) throw error;

      setApplications(prev => new Set([...prev, jobId]));
      toast({
        title: "Application sent!",
        description: "Your application has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Application failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredJobs = jobs.filter(job => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!job.title.toLowerCase().includes(searchLower) &&
          !job.company_name.toLowerCase().includes(searchLower) &&
          !job.description.toLowerCase().includes(searchLower) &&
          !(job.location?.toLowerCase().includes(searchLower))) {
        return false;
      }
    }

    // Location filter
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // Job type filter
    if (filters.jobType && job.job_type !== filters.jobType) {
      return false;
    }

    // Salary filters
    if (filters.salaryMin && job.salary_max && parseInt(filters.salaryMin) > job.salary_max) {
      return false;
    }
    if (filters.salaryMax && job.salary_min && parseInt(filters.salaryMax) < job.salary_min) {
      return false;
    }

    return true;
  });

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      jobType: '',
      salaryMin: '',
      salaryMax: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Next Job</h1>
          <p className="mt-2 text-gray-600">Discover opportunities that match your skills</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <JobFiltersComponent 
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Building className="w-4 h-4 mr-1" />
                          {job.company_name}
                        </CardDescription>
                      </div>
                      {job.job_type && (
                        <Badge variant="secondary" className="ml-2">
                          {job.job_type}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {job.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {job.location}
                        </div>
                      )}
                      
                      {formatSalary(job.salary_min || undefined, job.salary_max || undefined) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {formatSalary(job.salary_min || undefined, job.salary_max || undefined)}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-3">
                        {job.description}
                      </p>

                      {profile?.role === 'job_seeker' && user && (
                        <div className="space-y-3 pt-3 border-t">
                          {!applications.has(job.id) && cvs.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select CV for application:
                              </label>
                              <Select
                                value={selectedCvs[job.id] || ''}
                                onValueChange={(value) => setSelectedCvs(prev => ({
                                  ...prev,
                                  [job.id]: value
                                }))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Choose a CV..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {cvs.map((cv) => (
                                    <SelectItem key={cv.id} value={cv.id}>
                                      {cv.file_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <Button
                            onClick={() => applyToJob(job.id)}
                            disabled={applications.has(job.id) || cvs.length === 0}
                            className="w-full"
                            variant={applications.has(job.id) ? "secondary" : "default"}
                          >
                            {applications.has(job.id) 
                              ? 'Applied' 
                              : cvs.length === 0 
                                ? 'Upload CV to Apply' 
                                : 'Apply Now'
                            }
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Building className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">
                  {filters.search || filters.location || filters.jobType || filters.salaryMin || filters.salaryMax
                    ? 'Try adjusting your search criteria'
                    : 'No jobs are currently available'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
