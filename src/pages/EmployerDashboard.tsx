import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { Plus, Edit, Trash2, Users, Briefcase, BarChart3, Star } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import RatingDialog from '@/components/RatingDialog';

type Job = Tables<'jobs'>;
type JobApplication = Tables<'job_applications'> & {
  profiles: Tables<'profiles'>;
};
type Rating = Tables<'ratings'>;
type ApplicationStatus = Tables<'job_applications'>['status'];

export default function EmployerDashboard() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: '',
    requirements: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  useEffect(() => {
    if (jobs.length > 0) {
      fetchApplications();
      fetchAnalyticsData();
      fetchRatings();
    }
  }, [jobs]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      console.log('Fetching jobs for user:', user.id);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched jobs:', data);
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

  const fetchApplications = async () => {
    if (!user || jobs.length === 0) return;

    try {
      const jobIds = jobs.map(job => job.id);
      console.log('Fetching applications for jobs:', jobIds);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles:applicant_id (*)
        `)
        .in('job_id', jobIds);

      if (error) throw error;
      console.log('Fetched applications:', data);
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchRatings = async () => {
    if (!user) return;

    try {
      console.log('Fetching ratings for employer:', user.id);
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('employer_id', user.id);

      if (error) throw error;
      console.log('Fetched ratings:', data);
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    if (!user || jobs.length === 0) return;

    try {
      const jobIds = jobs.map(job => job.id);
      const { data, error } = await supabase
        .from('job_applications')
        .select('applied_at')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: true });

      if (error) throw error;

      // Group applications by date
      const groupedData = (data || []).reduce((acc: any, app) => {
        const date = new Date(app.applied_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Convert to chart format
      const chartData = Object.entries(groupedData).map(([date, count]) => ({
        date,
        applications: count
      }));

      setAnalyticsData(chartData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const createJob = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create jobs.",
        variant: "destructive",
      });
      return;
    }

    if (!newJob.title || !newJob.description) {
      toast({
        title: "Error",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating job with data:', newJob);
      const { error } = await supabase
        .from('jobs')
        .insert({
          employer_id: user.id,
          title: newJob.title,
          description: newJob.description,
          company_name: profile?.company_name || profile?.full_name || 'Unknown Company',
          location: newJob.location || null,
          salary_min: newJob.salary_min ? parseInt(newJob.salary_min) : null,
          salary_max: newJob.salary_max ? parseInt(newJob.salary_max) : null,
          job_type: newJob.job_type || null,
          requirements: newJob.requirements || null,
          status: 'active'
        });

      if (error) throw error;

      setNewJob({
        title: '',
        description: '',
        location: '',
        salary_min: '',
        salary_max: '',
        job_type: '',
        requirements: ''
      });
      setIsCreateDialogOpen(false);
      await fetchJobs();
      
      toast({
        title: "Job created!",
        description: "Your job posting is now live.",
      });
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Failed to create job",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateJob = async () => {
    if (!selectedJob) return;

    if (!newJob.title || !newJob.description) {
      toast({
        title: "Error",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Updating job:', selectedJob.id, 'with data:', newJob);
      const { error } = await supabase
        .from('jobs')
        .update({
          title: newJob.title,
          description: newJob.description,
          location: newJob.location || null,
          salary_min: newJob.salary_min ? parseInt(newJob.salary_min) : null,
          salary_max: newJob.salary_max ? parseInt(newJob.salary_max) : null,
          job_type: newJob.job_type || null,
          requirements: newJob.requirements || null,
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      setSelectedJob(null);
      await fetchJobs();
      
      toast({
        title: "Job updated!",
        description: "Your job posting has been updated.",
      });
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Failed to update job",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting job:', jobId);
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      await fetchJobs();
      toast({
        title: "Job deleted",
        description: "The job posting has been removed.",
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Failed to delete job",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    try {
      console.log('Updating application status:', applicationId, 'to:', status);
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status,
          reviewed_at: status !== 'pending' ? new Date().toISOString() : null
        })
        .eq('id', applicationId);

      if (error) throw error;

      await fetchApplications();
      toast({
        title: "Application status updated",
        description: `Application has been marked as ${status}.`,
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Failed to update application",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (job: Job) => {
    setSelectedJob(job);
    setNewJob({
      title: job.title,
      description: job.description,
      location: job.location || '',
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      job_type: job.job_type || '',
      requirements: job.requirements || ''
    });
    setIsEditDialogOpen(true);
  };

  const openRatingDialog = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsRatingDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isApplicationRated = (applicationId: string) => {
    return ratings.some(rating => rating.application_id === applicationId);
  };

  const chartConfig = {
    applications: {
      label: "Applications",
      color: "#3b82f6",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your job postings and applications</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your job posting.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Title *</Label>
                    <Input
                      id="title"
                      value={newJob.title}
                      onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                      className="col-span-3"
                      placeholder="Software Engineer"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">Location</Label>
                    <Input
                      id="location"
                      value={newJob.location}
                      onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                      className="col-span-3"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="job_type" className="text-right">Type</Label>
                    <Select value={newJob.job_type} onValueChange={(value) => setNewJob({...newJob, job_type: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Salary Range</Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        value={newJob.salary_min}
                        onChange={(e) => setNewJob({...newJob, salary_min: e.target.value})}
                        placeholder="Min"
                        type="number"
                      />
                      <Input
                        value={newJob.salary_max}
                        onChange={(e) => setNewJob({...newJob, salary_max: e.target.value})}
                        placeholder="Max"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right">Description *</Label>
                    <Textarea
                      id="description"
                      value={newJob.description}
                      onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                      className="col-span-3"
                      rows={4}
                      placeholder="Job description..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="requirements" className="text-right">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                      className="col-span-3"
                      rows={3}
                      placeholder="Job requirements..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={createJob} disabled={!newJob.title || !newJob.description}>
                    Post Job
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Analytics Section */}
        {analyticsData.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Job Applications Analytics
                </CardTitle>
                <CardDescription>Daily application submissions to your job posts</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="var(--color-applications)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Jobs Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Your Job Postings ({jobs.length})
            </h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.location}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={job.status === 'active' ? 'default' : 'secondary'}
                        >
                          {job.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(job)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-600">Create your first job posting to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Applications Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Recent Applications ({applications.length})
            </h2>
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {application.profiles?.full_name || 'Unknown Applicant'}
                        </CardTitle>
                        <CardDescription>
                          Applied for: {jobs.find(j => j.id === application.job_id)?.title}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 mb-3">
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                    </div>
                    
                    {application.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateApplicationStatus(application.id, 'accepted' as ApplicationStatus)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateApplicationStatus(application.id, 'rejected' as ApplicationStatus)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateApplicationStatus(application.id, 'reviewed' as ApplicationStatus)}
                        >
                          Mark Reviewed
                        </Button>
                      </div>
                    )}
                    
                    {application.status === 'accepted' && !isApplicationRated(application.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRatingDialog(application)}
                        className="flex items-center"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Rate Job Seeker
                      </Button>
                    )}
                    
                    {application.status === 'accepted' && isApplicationRated(application.id) && (
                      <div className="flex items-center text-sm text-green-600">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        Rated
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-600">Applications will appear here when candidates apply to your jobs.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Job Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-white">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
              <DialogDescription>
                Update the details for your job posting.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">Title *</Label>
                <Input
                  id="edit-title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  className="col-span-3"
                  placeholder="Software Engineer"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">Location</Label>
                <Input
                  id="edit-location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  className="col-span-3"
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-job_type" className="text-right">Type</Label>
                <Select value={newJob.job_type} onValueChange={(value) => setNewJob({...newJob, job_type: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Salary Range</Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    value={newJob.salary_min}
                    onChange={(e) => setNewJob({...newJob, salary_min: e.target.value})}
                    placeholder="Min"
                    type="number"
                  />
                  <Input
                    value={newJob.salary_max}
                    onChange={(e) => setNewJob({...newJob, salary_max: e.target.value})}
                    placeholder="Max"
                    type="number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  className="col-span-3"
                  rows={4}
                  placeholder="Job description..."
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-requirements" className="text-right">Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                  className="col-span-3"
                  rows={3}
                  placeholder="Job requirements..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateJob} disabled={!newJob.title || !newJob.description}>
                Update Job
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        {selectedApplication && user && (
          <RatingDialog
            isOpen={isRatingDialogOpen}
            onClose={() => {
              setIsRatingDialogOpen(false);
              setSelectedApplication(null);
            }}
            application={selectedApplication}
            employerId={user.id}
            onRatingSubmitted={() => {
              fetchRatings();
              fetchApplications();
            }}
          />
        )}
      </div>
    </div>
  );
}
