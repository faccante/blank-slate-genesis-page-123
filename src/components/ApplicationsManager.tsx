
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { User, Briefcase, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import JobSeekerRating from './JobSeekerRating';

type Application = Tables<'job_applications'> & {
  applicant: {
    full_name: string;
    skills: string[];
  };
  job: {
    title: string;
    required_skills: string[];
  };
};

export function ApplicationsManager() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    job: '',
    minRating: '',
    skill: ''
  });
  const [jobs, setJobs] = useState<Tables<'jobs'>[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchJobs();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('employer_id', user.id);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          applicant:profiles!job_applications_applicant_id_fkey(full_name, skills),
          job:jobs!job_applications_job_id_fkey(title, required_skills)
        `)
        .eq('jobs.employer_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      
      setApplications(data as Application[] || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Filter by job
    if (filters.job) {
      filtered = filtered.filter(app => app.job_id === filters.job);
    }

    // Filter by skill
    if (filters.skill) {
      filtered = filtered.filter(app => 
        app.applicant?.skills?.some(skill => 
          skill.toLowerCase().includes(filters.skill.toLowerCase())
        )
      );
    }

    // Sort by rating would require fetching ratings for each applicant
    // For now, we'll sort by application date
    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (applicationId: string, status: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, reviewed_at: new Date().toISOString() }
            : app
        )
      );

      toast({
        title: "Status updated",
        description: `Application status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'reviewed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMatchingSkills = (applicantSkills: string[] = [], requiredSkills: string[] = []) => {
    return applicantSkills.filter(skill => 
      requiredSkills.some(required => 
        required.toLowerCase() === skill.toLowerCase()
      )
    );
  };

  const getMissingSkills = (applicantSkills: string[] = [], requiredSkills: string[] = []) => {
    return requiredSkills.filter(required => 
      !applicantSkills.some(skill => 
        skill.toLowerCase() === required.toLowerCase()
      )
    );
  };

  const clearFilters = () => {
    setFilters({
      job: '',
      minRating: '',
      skill: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Job Applications</h2>
        <Badge variant="outline">{filteredApplications.length} applications</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="job-filter">Filter by Job</Label>
              <Select value={filters.job} onValueChange={(value) => setFilters({...filters, job: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All jobs" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="">All jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skill-filter">Filter by Skill</Label>
              <Input
                id="skill-filter"
                placeholder="e.g. JavaScript"
                value={filters.skill}
                onChange={(e) => setFilters({...filters, skill: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
            </h3>
            <p className="text-gray-600">
              {applications.length === 0 
                ? 'Applications for your job postings will appear here.' 
                : 'Try adjusting your filters to see more applications.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredApplications.map((application) => {
            const matchingSkills = getMatchingSkills(application.applicant?.skills, application.job?.required_skills);
            const missingSkills = getMissingSkills(application.applicant?.skills, application.job?.required_skills);
            
            return (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {application.applicant?.full_name || 'Anonymous Applicant'}
                        </CardTitle>
                        <CardDescription>
                          Applied for: {application.job?.title}
                        </CardDescription>
                        <JobSeekerRating 
                          jobSeekerId={application.applicant_id} 
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(application.status)}
                      <Badge 
                        variant={
                          application.status === 'accepted' ? 'default' :
                          application.status === 'rejected' ? 'destructive' :
                          application.status === 'reviewed' ? 'secondary' : 'outline'
                        }
                        className="capitalize"
                      >
                        {application.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm text-gray-600">
                      <strong>Applied:</strong> {new Date(application.applied_at).toLocaleDateString()}
                    </div>
                    {application.reviewed_at && (
                      <div className="text-sm text-gray-600">
                        <strong>Reviewed:</strong> {new Date(application.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Skills Analysis */}
                  <div className="space-y-3">
                    {matchingSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">
                          Matching Skills ({matchingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matchingSkills.map((skill, index) => (
                            <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {application.applicant?.skills && application.applicant.skills.length > matchingSkills.length && (
                      <div>
                        <p className="text-sm font-medium text-blue-700 mb-2">
                          Additional Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {application.applicant.skills
                            .filter(skill => !matchingSkills.includes(skill))
                            .map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {missingSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-2">
                          Missing Required Skills ({missingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {missingSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="border-red-200 text-red-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <span className="text-sm font-medium text-gray-700">Update Status:</span>
                    <Select
                      value={application.status}
                      onValueChange={(value) => updateApplicationStatus(application.id, value as any)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
