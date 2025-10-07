import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Pencil, Download, FileText } from "lucide-react";
import { ResumeTemplate } from "@/components/ResumeTemplate";
import { FileUploadZone } from "@/components/ui/file-upload-zone";
import { UploadProgress } from "@/components/ui/upload-progress";
import { SuccessBanner } from "@/components/ui/success-banner";
import html2pdf from "html2pdf.js";

interface ResumeManagerProps {
  userId: string;
  onResumeChange: (resumeId: string | null) => void;
}

export const ResumeManager = ({ userId, onResumeChange }: ResumeManagerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<"uploading" | "parsing" | "complete">("uploading");
  const [currentResume, setCurrentResume] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    if (!currentResume?.parsed_data) return;
    
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('original-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const userName = currentResume.parsed_data.name || 'User';
      const opt = {
        margin: 5,
        filename: `${userName.replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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
    setUploadStage("uploading");
    setShowSuccess(false);
    
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadStage("parsing");

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

      setUploadStage("complete");
      setShowSuccess(true);
      
      setTimeout(() => {
        setSelectedFile(null);
        setShowSuccess(false);
        fetchCurrentResume();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setShowSuccess(false);
  };

  return (
    <div className="space-y-6">
      {!currentResume ? (
        <div className="space-y-6">
          <Card className="p-8 bg-gradient-to-br from-card to-muted/20">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Upload Your Resume</h2>
                <p className="text-muted-foreground">
                  Upload your resume once and tweak it for any job application
                </p>
              </div>

              {!uploading ? (
                <>
                  <FileUploadZone
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClearFile={handleClearFile}
                    disabled={uploading}
                  />

                  {selectedFile && (
                    <Button 
                      onClick={handleUpload} 
                      disabled={uploading} 
                      className="w-full h-12 text-base"
                      size="lg"
                    >
                      Upload Resume
                    </Button>
                  )}
                </>
              ) : (
                <UploadProgress 
                  stage={uploadStage} 
                  fileName={selectedFile?.name}
                />
              )}
            </div>
          </Card>

          {showSuccess && (
            <SuccessBanner
              title="Resume Uploaded Successfully!"
              description="Your resume is now ready to be tweaked for job applications"
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {showSuccess && (
            <SuccessBanner
              title="Resume Updated Successfully!"
              description="Your resume has been updated and is ready for job applications"
            />
          )}
          
          <Card className="p-6 bg-gradient-to-br from-card to-accent/5">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your Resume</h2>
                    <p className="text-sm text-muted-foreground">
                      {currentResume.original_filename}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-15">
                  Uploaded {new Date(currentResume.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                  {downloading ? "Generating..." : "Download"}
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

          {selectedFile && !uploading && (
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      New file selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.name}
                    </p>
                  </div>
                </div>
                <Button onClick={handleUpload} disabled={uploading}>
                  Upload New Resume
                </Button>
              </div>
            </Card>
          )}

          {uploading && (
            <UploadProgress 
              stage={uploadStage} 
              fileName={selectedFile?.name}
            />
          )}

          {showPreview && currentResume.parsed_data && (
            <ResumeTemplate 
              data={currentResume.parsed_data} 
              id="original-resume-content"
            />
          )}
        </div>
      )}
    </div>
  );
};
