
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { User, Briefcase, Clock, CheckCircle, XCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

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
        <Badge variant="outline">{applications.length} applications</Badge>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Applications for your job postings will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => {
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
