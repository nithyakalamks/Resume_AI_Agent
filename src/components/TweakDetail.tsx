import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import { ResumeTemplate } from "@/components/ResumeTemplate";
import html2pdf from "html2pdf.js";

interface TweakDetailProps {
  userId: string;
  tweakId: string;
}

export const TweakDetail = ({ userId, tweakId }: TweakDetailProps) => {
  const [loading, setLoading] = useState(true);
  const [tweakData, setTweakData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [downloadingCover, setDownloadingCover] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTweakData();
  }, [tweakId]);

  const fetchTweakData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tweaked_resumes")
        .select(`
          *,
          job_descriptions (description, company_name, role_name),
          resumes (*)
        `)
        .eq("id", tweakId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setTweakData(data);
        setOriginalData(data.resumes?.parsed_data || null);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load tweak",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = (updatedData: any, updatedCoverLetter?: string) => {
    setTweakData(prev => ({
      ...prev,
      tweaked_data: updatedData,
      cover_letter: updatedCoverLetter || prev.cover_letter
    }));
  };

  const handleDownloadResume = async () => {
    if (!tweakData?.tweaked_data) return;
    
    setDownloadingResume(true);
    try {
      const resumeElement = document.getElementById('hidden-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const userName = tweakData.tweaked_data?.name || 'User';
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
    if (!tweakData?.cover_letter) {
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

      const userName = tweakData.tweaked_data?.name || 'User';
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tweakData) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Tweak not found</p>
      </Card>
    );
  }

  const companyName = tweakData.job_descriptions?.company_name || 'Unknown Company';
  const roleName = tweakData.job_descriptions?.role_name || 'Unknown Position';
  
  const jobFitScore = tweakData.customized_score || 
    (tweakData.skill_matches?.length > 0 
      ? Math.round((tweakData.skill_matches.reduce((sum: number, s: any) => sum + s.relevance, 0) / tweakData.skill_matches.length) * 100)
      : 50);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
            Tweaker has done its magic!
          </h1>
          <p className="text-muted-foreground">
            Tweaked for {roleName} at {companyName}
          </p>
        </div>

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

      <TweakedResumeView
        tweakedResumeId={tweakData.id}
        originalData={originalData}
        tweakedData={tweakData.tweaked_data}
        changesSummary={tweakData.changes_summary || []}
        coverLetter={tweakData.cover_letter}
        originalScore={tweakData.original_score}
        customizedScore={tweakData.customized_score}
        skillMatches={tweakData.skill_matches}
        missingSkills={tweakData.missing_skills}
        onDataUpdate={handleDataUpdate}
      />

      {/* Hidden elements for PDF generation */}
      <div className="absolute -top-[9999px] left-0 w-full">
        {tweakData.tweaked_data && (
          <div id="hidden-resume-content" className="bg-white">
            <ResumeTemplate data={tweakData.tweaked_data} />
          </div>
        )}

        {tweakData.cover_letter && (
          <div id="hidden-cover-letter-content" className="bg-white">
            <div className="p-8 max-w-4xl mx-auto">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-black">
                  {tweakData.cover_letter}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
