
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Award } from 'lucide-react';

export function SkillsManager() {
  const { profile, updateProfile } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.skills) {
      setSkills(profile.skills);
    }
  }, [profile]);

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    
    const trimmedSkill = newSkill.trim();
    if (skills.includes(trimmedSkill)) {
      toast({
        title: "Skill already exists",
        description: "This skill is already in your list.",
        variant: "destructive",
      });
      return;
    }

    const updatedSkills = [...skills, trimmedSkill];
    setSkills(updatedSkills);
    setNewSkill('');
    
    try {
      setIsLoading(true);
      await updateProfile({ skills: updatedSkills });
      toast({
        title: "Skill added",
        description: "Your skill has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding skill:', error);
      setSkills(skills); // Revert on error
      toast({
        title: "Failed to add skill",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    
    try {
      setIsLoading(true);
      await updateProfile({ skills: updatedSkills });
      toast({
        title: "Skill removed",
        description: "Your skill has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing skill:', error);
      setSkills(skills); // Revert on error
      toast({
        title: "Failed to remove skill",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSkill();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <div>
            <CardTitle>My Skills</CardTitle>
            <CardDescription>
              Add your skills to match with relevant job opportunities
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill (e.g., JavaScript, Project Management)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            onClick={addSkill} 
            disabled={!newSkill.trim() || isLoading}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {skills.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Your Skills ({skills.length})</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    disabled={isLoading}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No skills added yet</p>
            <p className="text-xs">Add your skills to improve job matching</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
