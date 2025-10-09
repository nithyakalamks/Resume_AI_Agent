import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Trash2 } from "lucide-react";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import { ResumeTemplate } from "@/components/ResumeTemplate";
import html2pdf from "html2pdf.js";

interface JobHistoryProps {
  userId: string;
  selectedId?: string;
}

export const JobHistory = ({ userId, selectedId }: JobHistoryProps) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [downloadingCover, setDownloadingCover] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper functions for score display
  const getScoreColor = (score: number) => {
    if (score >= 71) return "text-success";
    if (score >= 41) return "text-warning";
    return "text-destructive";
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 71) return "stroke-green-500";
    if (score >= 41) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const getMessage = (score: number) => {
    if (score >= 71) return "Excellent match! Your customized resume is optimized for this role.";
    if (score >= 41) return "Good match! Your resume shows strong alignment with key requirements.";
    return "Room for improvement. Consider highlighting more relevant skills and experience.";
  };

  const handleDownloadResume = async () => {
    if (!selectedVersion?.tweaked_data) return;
    
    setDownloadingResume(true);
    try {
      const resumeElement = document.getElementById('hidden-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const userName = selectedVersion.tweaked_data?.name || 'User';
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
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloadingResume(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    if (!selectedVersion?.cover_letter) {
      toast({
        title: "No cover letter available",
        description: "Cover letter not found for this application",
        variant: "destructive"
      });
      return;
    }
    
    setDownloadingCover(true);
    try {
      const coverElement = document.getElementById('hidden-cover-letter-content');
      if (!coverElement) throw new Error('Cover letter content not found');

      const userName = selectedVersion.tweaked_data?.name || 'User';
      const opt = {
        margin: 10,
        filename: `${userName.replace(/\s+/g, '_')}_Cover_Letter.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(coverElement).save();
      toast({ title: "Cover letter downloaded successfully" });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloadingCover(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  // Handle selectedId from route parameter
  useEffect(() => {
    if (selectedId && history.length > 0) {
      const selectedItem = history.find(item => item.id === selectedId);
      if (selectedItem) {
        setSelectedVersion(selectedItem);
        setOriginalData(selectedItem.resumes?.parsed_data || null);
      }
    } else if (!selectedId) {
      // Reset to list view when no selectedId
      setSelectedVersion(null);
      setOriginalData(null);
    }
  }, [selectedId, history]);

  // Fetch the latest data for the selected tweaked resume
  useEffect(() => {
    if (selectedId) {
      fetchLatestTweakedResume(selectedId);
    }
  }, [selectedId]);

  const fetchLatestTweakedResume = async (tweakedResumeId: string) => {
    try {
      const { data, error } = await supabase
        .from("tweaked_resumes")
        .select(`
          *,
          job_descriptions (description, company_name, role_name),
          resumes (*)
        `)
        .eq("id", tweakedResumeId)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedVersion(data);
        setOriginalData(data.resumes?.parsed_data || null);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleDataUpdate = (updatedData: any, updatedCoverLetter?: string) => {
    // Update the selectedVersion with the latest data
    setSelectedVersion(prev => ({
      ...prev,
      tweaked_data: updatedData,
      cover_letter: updatedCoverLetter || prev.cover_letter
    }));
  };

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tweaked_resumes")
      .select(`
        *,
        job_descriptions (description, company_name, role_name),
        resumes (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const handleView = (version: any) => {
    navigate(`/dashboard/history/${version.id}`);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("tweaked_resumes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Application deleted successfully",
      });
      
      await fetchHistory();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedVersion) {
    const companyName = selectedVersion.job_descriptions?.company_name || 'Unknown Company';
    const roleName = selectedVersion.job_descriptions?.role_name || 'Unknown Position';
    
    // Use database score if available, otherwise calculate from skill_matches
    const jobFitScore = selectedVersion.customized_score || 
      (selectedVersion.skill_matches?.length > 0 
        ? Math.round((selectedVersion.skill_matches.reduce((sum: number, s: any) => sum + s.relevance, 0) / selectedVersion.skill_matches.length) * 100)
        : 50); // More conservative default score

    return (
      <div className="space-y-6">
        {/* Title Section */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
          <h1 className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">Tweaker has done its magic!</h1>
          <p className="text-muted-foreground">
            Tweaked for {roleName} at {companyName}
          </p>
          </div>

          {/* Download Buttons Banner */}
          <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownloadResume} disabled={downloadingResume}>
                <Download className="w-4 h-4 mr-2" />
                {downloadingResume ? "Generating PDF..." : "Download Resume"}
              </Button>
              <Button variant="outline" onClick={handleDownloadCoverLetter} disabled={downloadingCover}>
                <Download className="w-4 h-4 mr-2" />
                {downloadingCover ? "Generating PDF..." : "Download Cover Letter"}
              </Button>
            </div>
          </div>
        </Card>
        </div>

        {/* Job Fit Score - Import component once created */}
        <Card className="p-4">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  strokeWidth="6"
                  fill="none"
                  className="stroke-muted"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - jobFitScore / 100)}`}
                  className={getScoreStrokeColor(jobFitScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${getScoreColor(jobFitScore)}`}>
                  {jobFitScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold">Job Fit Score: {jobFitScore}/100</h3>
              <p className="text-muted-foreground">
                {getMessage(jobFitScore)}
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs for Resume, Cover Letter, and Analysis */}
        <TweakedResumeView
          tweakedResumeId={selectedVersion.id}
          originalData={originalData}
          tweakedData={selectedVersion.tweaked_data}
          changesSummary={selectedVersion.changes_summary || []}
          coverLetter={selectedVersion.cover_letter}
          originalScore={selectedVersion.original_score}
          customizedScore={selectedVersion.customized_score}
          skillMatches={selectedVersion.skill_matches}
          missingSkills={selectedVersion.missing_skills}
          onDataUpdate={handleDataUpdate}
        />

        {/* Hidden elements for PDF generation - always rendered */}
        <div className="absolute -top-[9999px] left-0 w-full">
          {/* Hidden resume content for PDF generation */}
          {selectedVersion.tweaked_data && (
            <div id="hidden-resume-content" className="bg-white">
              <ResumeTemplate 
                data={selectedVersion.tweaked_data} 
              />
            </div>
          )}

          {/* Hidden cover letter content for PDF generation */}
          {selectedVersion.cover_letter && (
            <div id="hidden-cover-letter-content" className="bg-white">
              <div className="p-8 max-w-4xl mx-auto">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-black">
                    {selectedVersion.cover_letter}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold">My Tweaks</h1>
        <p className="text-muted-foreground">View and manage your past resume tweaks</p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No past applications yet. Start applying to jobs to see your history here.
          </p>
        </Card>
      ) : (
        history.map((item) => {
          const companyName = item.job_descriptions?.company_name || 'Unknown Company';
          const roleName = item.job_descriptions?.role_name || 'Unknown Position';
          
          return (
            <Card key={item.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{roleName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{companyName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting === item.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      )}
      </div>
    </div>
  );
};
