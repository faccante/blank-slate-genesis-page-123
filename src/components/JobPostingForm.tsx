
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Briefcase } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Job = Tables<'jobs'>;

interface JobPostingFormProps {
  job?: Job;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JobPostingForm({ job, onSuccess, onCancel }: JobPostingFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: job?.title || '',
    description: job?.description || '',
    company_name: job?.company_name || '',
    location: job?.location || '',
    salary_min: job?.salary_min?.toString() || '',
    salary_max: job?.salary_max?.toString() || '',
    job_type: job?.job_type || '',
    requirements: job?.requirements || ''
  });
  const [requiredSkills, setRequiredSkills] = useState<string[]>(job?.required_skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    const trimmedSkill = newSkill.trim();
    if (requiredSkills.includes(trimmedSkill)) {
      toast({
        title: "Skill already added",
        description: "This skill is already in the required skills list.",
        variant: "destructive",
      });
      return;
    }

    setRequiredSkills([...requiredSkills, trimmedSkill]);
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (requiredSkills.length === 0) {
      toast({
        title: "Required skills missing",
        description: "Please add at least one required skill for this job.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const jobData = {
        title: formData.title,
        description: formData.description,
        company_name: formData.company_name,
        location: formData.location || null,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        job_type: formData.job_type || null,
        requirements: formData.requirements || null,
        required_skills: requiredSkills,
        employer_id: user.id,
        status: 'active' as const
      };

      if (job) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', job.id);

        if (error) throw error;

        toast({
          title: "Job updated",
          description: "Your job posting has been updated successfully.",
        });
      } else {
        // Create new job
        const { error } = await supabase
          .from('jobs')
          .insert([jobData]);

        if (error) throw error;

        toast({
          title: "Job posted",
          description: "Your job has been posted successfully.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job posting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <div>
            <CardTitle>{job ? 'Edit Job Posting' : 'Create New Job Posting'}</CardTitle>
            <CardDescription>
              {job ? 'Update your job posting details' : 'Fill in the details for your new job posting'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Senior Frontend Developer"
                required
              />
            </div>
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                placeholder="Your company name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. New York, NY"
              />
            </div>
            <div>
              <Label htmlFor="salary_min">Min Salary</Label>
              <Input
                id="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                placeholder="50000"
              />
            </div>
            <div>
              <Label htmlFor="salary_max">Max Salary</Label>
              <Input
                id="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                placeholder="100000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="job_type">Job Type</Label>
            <Input
              id="job_type"
              value={formData.job_type}
              onChange={(e) => setFormData({...formData, job_type: e.target.value})}
              placeholder="e.g. Full-time, Part-time, Contract"
            />
          </div>

          <div>
            <Label htmlFor="requirements">Additional Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              placeholder="Education, experience, certifications, etc."
              rows={3}
            />
          </div>

          {/* Required Skills */}
          <div className="space-y-3">
            <Label>Required Skills *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a required skill (e.g., JavaScript, Project Management)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                type="button"
                onClick={addSkill} 
                disabled={!newSkill.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {requiredSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Required Skills ({requiredSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (job ? 'Update Job' : 'Post Job')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
