import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, FileText, Download, Loader2, Eye, X, Image } from 'lucide-react';
import { Prescription } from '@/types';

const Prescriptions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const fetchPrescriptions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load prescriptions.',
        variant: 'destructive',
      });
    } else {
      setPrescriptions((data as Prescription[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPG, PNG, WebP, or PDF file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save metadata to database
      const { error: dbError } = await supabase.from('prescriptions').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
      });

      if (dbError) {
        // Cleanup uploaded file if db insert fails
        await supabase.storage.from('prescriptions').remove([fileName]);
        throw dbError;
      }

      toast({
        title: 'Success',
        description: 'Prescription uploaded successfully.',
      });

      fetchPrescriptions();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload prescription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (prescription: Prescription) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('prescriptions')
        .remove([prescription.file_path]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescription.id);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'Deleted',
        description: 'Prescription removed successfully.',
      });

      setPrescriptions(prescriptions.filter((p) => p.id !== prescription.id));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prescription.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (prescription: Prescription) => {
    try {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .download(prescription.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = prescription.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download prescription.',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (prescription: Prescription) => {
    try {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .createSignedUrl(prescription.file_path, 300); // 5 min expiry

      if (error) throw error;

      setPreviewUrl(data.signedUrl);
      setPreviewName(prescription.file_name);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to preview prescription.',
        variant: 'destructive',
      });
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewName('');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isImage = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
            <p className="text-sm text-muted-foreground">Store your prescriptions digitally</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Prescription
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Upload Info */}
        <Card className="mb-6 border-border bg-accent/30 shadow-card">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Image className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Supported Formats</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, PDF (max 10MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : prescriptions.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="flex flex-col items-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No prescriptions yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload your first prescription to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prescriptions.map((prescription) => (
              <Card
                key={prescription.id}
                className="border-border shadow-card transition-all hover:shadow-healthcare animate-fade-in"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {isImage(prescription.file_name) ? (
                        <Image className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {prescription.file_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(prescription.file_size)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(prescription.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(prescription)}
                      className="flex-1 gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(prescription)}
                      className="flex-1 gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(prescription)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4">
            <div className="relative max-h-[90vh] max-w-4xl w-full overflow-auto rounded-lg bg-card shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-4">
                <h3 className="font-medium text-foreground truncate pr-4">{previewName}</h3>
                <Button variant="ghost" size="icon" onClick={closePreview}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4">
                {previewName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[70vh] rounded border border-border"
                    title={previewName}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewName}
                    className="max-w-full h-auto mx-auto rounded"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Prescriptions;
