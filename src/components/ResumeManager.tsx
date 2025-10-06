import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Pencil, Download } from "lucide-react";
import { ResumePreview } from "@/components/ResumePreview";
import html2pdf from "html2pdf.js";

interface ResumeManagerProps {
  userId: string;
  onResumeChange: (resumeId: string | null) => void;
}

export const ResumeManager = ({ userId, onResumeChange }: ResumeManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentResume, setCurrentResume] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    if (!currentResume?.parsed_data) return;
    
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('original-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const userName = currentResume.parsed_data.name || 'User';
      const opt = {
        margin: 10,
        filename: `${userName.replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(resumeElement).save();
      toast({ title: "Resume downloaded successfully" });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchCurrentResume();
  }, [userId]);

  const fetchCurrentResume = async () => {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentResume(data);
      onResumeChange(data.id);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "parse-resume",
        {
          body: { filePath },
        }
      );

      if (functionError) throw functionError;

      const { error: insertError } = await supabase.from("resumes").insert({
        user_id: userId,
        file_path: filePath,
        original_filename: selectedFile.name,
        parsed_data: functionData.parsed_data,
      });

      if (insertError) throw insertError;

      toast({
        title: "Resume uploaded successfully",
      });

      setSelectedFile(null);
      fetchCurrentResume();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {!currentResume ? (
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
          <p className="text-muted-foreground mb-6">
            Upload your resume once and tailor it for any job application
          </p>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">Drag and drop your resume here</p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <label className="inline-block">
              <Button variant="outline" asChild>
                <span>Choose File</span>
              </Button>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Selected: {selectedFile.name}
              </p>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? "Uploading..." : "Upload Resume"}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Resume</h2>
                <p className="text-muted-foreground">
                  {currentResume.original_filename}
                </p>
                <p className="text-sm text-muted-foreground">
                  Uploaded {new Date(currentResume.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? "Hide" : "Preview"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={downloading || !currentResume?.parsed_data}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Generating..." : "Download PDF"}
                </Button>
                <label>
                  <Button variant="outline" asChild>
                    <span>
                      <Pencil className="w-4 h-4 mr-2" />
                      Update
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>

          {selectedFile && (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">
                New file selected: {selectedFile.name}
              </p>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload New Resume"}
              </Button>
            </Card>
          )}

          {showPreview && currentResume.parsed_data && (
            <div id="original-resume-content">
              <ResumePreview data={currentResume.parsed_data} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
