
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type CV = Tables<'cvs'>;

export function CVManager() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCVs();
    }
  }, [user]);

  const fetchCVs = async () => {
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCvs(data || []);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast({
        title: "Error",
        description: "Failed to load CVs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      // Save CV record to database
      const { error: dbError } = await supabase
        .from('cvs')
        .insert({
          user_id: user?.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          content_type: file.type,
        });

      if (dbError) throw dbError;

      toast({
        title: "CV uploaded",
        description: "Your CV has been uploaded successfully.",
      });

      fetchCVs();
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const deleteCV = async (cvId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('cvs')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cvId);

      if (dbError) throw dbError;

      toast({
        title: "CV deleted",
        description: "Your CV has been deleted successfully.",
      });

      fetchCVs();
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadCV = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('cvs')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast({
        title: "Download failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CV Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          CV Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cv-upload" className="block mb-2">
            Upload CV (PDF or Word document, max 5MB)
          </Label>
          <Input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={uploadCV}
            disabled={uploading}
          />
        </div>

        <div className="space-y-3">
          {cvs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No CVs uploaded yet</p>
              <p className="text-sm">Upload your first CV to start applying for jobs</p>
            </div>
          ) : (
            cvs.map((cv) => {
              const filePath = cv.file_url.split('/').slice(-2).join('/');
              return (
                <div key={cv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{cv.file_name}</p>
                      <p className="text-sm text-gray-500">
                        {(cv.file_size / 1024 / 1024).toFixed(2)} MB • 
                        Uploaded {new Date(cv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCV(filePath, cv.file_name)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCV(cv.id, filePath)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
