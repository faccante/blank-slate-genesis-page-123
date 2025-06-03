import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { MapPin, DollarSign, Clock, Building, Award, AlertCircle } from 'lucide-react';
import { JobFiltersComponent, JobFilters } from '@/components/JobFilters';

type Job = Tables<'jobs'>;

export default function Jobs() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    location: '',
    jobType: '',
    salaryMin: '',
    salaryMax: '',
  });
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
    if (profile?.role === 'job_seeker') {
      fetchUserApplications();
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

  const getMatchingSkills = (userSkills: string[] = [], requiredSkills: string[] = []) => {
    return userSkills.filter(skill => 
      requiredSkills.some(required => 
        required.toLowerCase() === skill.toLowerCase()
      )
    );
  };

  const getMissingSkills = (userSkills: string[] = [], requiredSkills: string[] = []) => {
    return requiredSkills.filter(required => 
      !userSkills.some(skill => 
        skill.toLowerCase() === required.toLowerCase()
      )
    );
  };

  const canApplyToJob = (job: Job) => {
    if (!profile?.skills || !job.required_skills) return true;
    
    const missingSkills = getMissingSkills(profile.skills, job.required_skills);
    return missingSkills.length === 0;
  };

  const applyToJob = async (jobId: string) => {
    if (!user || !profile) return;

    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    if (!canApplyToJob(job)) {
      toast({
        title: "Skills required",
        description: "You need all required skills to apply for this job.",
        variant: "destructive",
      });
      return;
    }

    if (!profile.skills || profile.skills.length === 0) {
      toast({
        title: "Add your skills",
        description: "Please add your skills to your profile before applying.",
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
          status: 'pending',
          skill: profile.skills.join(', ') // Store skills as comma-separated string
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
              {filteredJobs.map((job) => {
                const userSkills = profile?.skills || [];
                const matchingSkills = getMatchingSkills(userSkills, job.required_skills || []);
                const missingSkills = getMissingSkills(userSkills, job.required_skills || []);
                const canApply = canApplyToJob(job);

                return (
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

                        {/* Required Skills */}
                        {job.required_skills && job.required_skills.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Required Skills</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {job.required_skills.map((skill, index) => (
                                <Badge 
                                  key={index} 
                                  variant={matchingSkills.includes(skill) ? "default" : "outline"}
                                  className={matchingSkills.includes(skill) ? "bg-green-100 text-green-800" : ""}
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile?.role === 'job_seeker' && user && (
                          <div className="space-y-3 pt-3 border-t">
                            {/* Skills Match Info */}
                            {job.required_skills && job.required_skills.length > 0 && profile.skills && (
                              <div className="space-y-2">
                                {matchingSkills.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-green-600 font-medium">
                                      ✓ You have {matchingSkills.length} required skill(s)
                                    </span>
                                  </div>
                                )}
                                {missingSkills.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-red-600 font-medium flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      Missing {missingSkills.length} required skill(s): {missingSkills.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <Button
                              onClick={() => applyToJob(job.id)}
                              disabled={applications.has(job.id) || !canApply || !profile.skills || profile.skills.length === 0}
                              className="w-full"
                              variant={applications.has(job.id) ? "secondary" : canApply ? "default" : "outline"}
                            >
                              {applications.has(job.id) 
                                ? 'Applied' 
                                : !profile.skills || profile.skills.length === 0
                                  ? 'Add Skills to Apply'
                                  : !canApply
                                    ? 'Missing Required Skills'
                                    : 'Apply Now'
                              }
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
