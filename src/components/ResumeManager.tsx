import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Pencil, Download } from "lucide-react";
import { ResumePreview } from "@/components/ResumePreview";
import html2pdf from "html2pdf.js";
import { createPrintableResume } from "@/utils/pdfHelpers";


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
      const resumeData = currentResume.parsed_data;
      const userName = resumeData.name || 'User';
      const filename = `${userName.replace(/\s+/g, '_')}_Resume.pdf`;

      // Create clean, print-optimized HTML
      const printableHTML = createPrintableResume(resumeData);

      // Generate PDF with better configuration
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: { 
          scale: 3,
          useCORS: true,
          letterRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Create a temporary element
      const temp = document.createElement('div');
      temp.innerHTML = printableHTML;
      temp.style.position = 'absolute';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);

      await html2pdf().set(opt).from(temp).save();
      document.body.removeChild(temp);

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

  const createPrintableResume = (data: any) => {
    const formatDate = (dateStr: string) => {
      if (dateStr === "Present" || !dateStr) return dateStr || "Present";
      const [year, month] = dateStr.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return month ? `${months[parseInt(month) - 1]} ${year}` : year;
    };

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="font-size: 24pt; font-weight: 700; margin: 0 0 8px 0; color: #1a1a1a;">${data.name}</h1>
          <div style="font-size: 9pt; color: #6b7280;">
            ${data.email ? `${data.email}` : ''}
            ${data.phone ? ` • ${data.phone}` : ''}
            ${data.linkedin ? ` • ${data.linkedin}` : ''}
            ${data.other_links ? ` • ${data.other_links}` : ''}
          </div>
        </div>

        ${data.summary ? `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Professional Summary</h2>
          <p style="margin: 0; color: #374151;">${data.summary}</p>
        </div>
        ` : ''}

        ${data.skills && data.skills.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Skills</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${data.skills.sort((a: any, b: any) => b.confidence - a.confidence).map((skill: any) => 
              `<span style="display: inline-block; padding: 3px 10px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 8.5pt; font-weight: 500;">${skill.skill}</span>`
            ).join('')}
          </div>
        </div>
        ` : ''}

        ${data.experience && data.experience.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Professional Experience</h2>
          ${data.experience.map((exp: any) => `
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                <div>
                  <h3 style="font-size: 11pt; font-weight: 600; margin: 0; color: #1a1a1a;">${exp.title}</h3>
                  <p style="font-size: 10pt; margin: 2px 0 0 0; color: #2563eb; font-weight: 500;">${exp.company}</p>
                </div>
                <span style="font-size: 8.5pt; color: #6b7280; white-space: nowrap;">${formatDate(exp.start)} - ${formatDate(exp.end || "Present")}</span>
              </div>
              ${exp.bullets && exp.bullets.length > 0 ? `
                <ul style="margin: 6px 0 0 18px; padding: 0;">
                  ${exp.bullets.map((bullet: string) => `<li style="margin-bottom: 3px; color: #374151; font-size: 10pt;">${bullet}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Education</h2>
          ${data.education.map((edu: any) => `
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <h3 style="font-size: 10.5pt; font-weight: 600; margin: 0; color: #1a1a1a;">${edu.degree}</h3>
                  ${edu.field ? `<p style="margin: 2px 0 0 0; font-size: 9.5pt; color: #6b7280;">${edu.field}</p>` : ''}
                  <p style="margin: 2px 0 0 0; font-size: 9.5pt; color: #2563eb; font-weight: 500;">${edu.institution}</p>
                </div>
                ${edu.graduation_date ? `<span style="font-size: 8.5pt; color: #6b7280;">${formatDate(edu.graduation_date)}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.projects && data.projects.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Projects</h2>
          ${data.projects.map((project: any) => `
            <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 6px;">
              <h3 style="font-size: 10.5pt; font-weight: 600; margin: 0 0 4px 0; color: #1a1a1a;">${project.name}</h3>
              <p style="margin: 0 0 6px 0; font-size: 9.5pt; color: #374151;">${project.description}</p>
              ${project.technologies && project.technologies.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${project.technologies.map((tech: string) => `<span style="display: inline-block; padding: 2px 6px; background: #e5e7eb; color: #374151; border-radius: 3px; font-size: 7.5pt;">${tech}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.certifications && data.certifications.length > 0 ? `
        <div>
          <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Certifications</h2>
          ${data.certifications.map((cert: any) => `
            <div style="margin-bottom: 8px;">
              <h3 style="font-size: 10pt; font-weight: 600; margin: 0; color: #1a1a1a;">${cert.name}</h3>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="margin: 0; font-size: 9pt; color: #2563eb;">${cert.issuer}</p>
                ${cert.date ? `<span style="font-size: 8pt; color: #6b7280;">${formatDate(cert.date)}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;
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
