import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHero } from "@/components/DashboardHero";
import { RecentTweaks } from "@/components/RecentTweaks";
import { SkillsReview } from "@/components/SkillsReview";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2pdf from "html2pdf.js";

interface DashboardHomeProps {
  userId: string;
}

export const DashboardHome = ({ userId }: DashboardHomeProps) => {
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tweaking, setTweaking] = useState(false);
  const [showSkillsReview, setShowSkillsReview] = useState(false);
  const [skillComparison, setSkillComparison] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [tweakedData, setTweakedData] = useState<any>(null);
  const [changesSummary, setChangesSummary] = useState<string[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [downloadingCover, setDownloadingCover] = useState(false);
  const [jobInfo, setJobInfo] = useState({ companyName: "", roleName: "", jobDescription: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentResume();
  }, [userId]);

  const fetchCurrentResume = async () => {
    try {
      const { data } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCurrentResumeId(data.id);
        setHasResume(true);
      }
    } catch (error) {
      console.error("Error fetching resume:", error);
    }
  };

  const handleStartTweaking = async (companyName: string, roleName: string, jobDescription: string) => {
    setJobInfo({ companyName, roleName, jobDescription });
    setAnalyzing(true);

    try {
      const { data: resumeData } = await supabase
        .from("resumes")
        .select("parsed_data")
        .eq("id", currentResumeId)
        .single();

      if (!resumeData) throw new Error("Resume not found");

      const { data: comparisonData, error: comparisonError } = await supabase.functions.invoke(
        "compare-skills",
        {
          body: {
            resumeData: resumeData.parsed_data,
            jobDescription,
          },
        }
      );

      if (comparisonError) throw comparisonError;

      setOriginalData(resumeData.parsed_data);
      setSkillComparison(comparisonData);
      setShowSkillsReview(true);

      toast({
        title: "Skills analyzed successfully",
        description: `Found ${comparisonData.missing_skills.length} skills to review`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmSkills = async (selectedSkills: string[]) => {
    setTweaking(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "tweak-resume",
        {
          body: {
            resumeId: currentResumeId,
            companyName: jobInfo.companyName,
            roleName: jobInfo.roleName,
            jobDescription: jobInfo.jobDescription,
            addedSkills: selectedSkills,
          },
        }
      );

      if (functionError) throw functionError;

      setTweakedData(functionData.tweaked_data);
      setChangesSummary(functionData.changes_summary || []);
      setCoverLetter(functionData.cover_letter || "");
      setShowSkillsReview(false);

      toast({
        title: "Resume tweaked successfully",
        description: selectedSkills.length > 0 
          ? `Added ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}`
          : "Resume optimized for the job",
      });
    } catch (error: any) {
      toast({
        title: "Tweaking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTweaking(false);
    }
  };

  const handleCancelSkillsReview = () => {
    setShowSkillsReview(false);
    setSkillComparison(null);
  };

  const handleDownloadCoverLetter = async () => {
    setDownloadingCover(true);
    try {
      const coverElement = document.getElementById('cover-letter-content');
      if (!coverElement) throw new Error('Cover letter content not found');

      const opt = {
        margin: 10,
        filename: `${tweakedData.name.replace(/\s+/g, '_')}_Cover_Letter.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
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

  const handleCreateAnother = () => {
    setTweakedData(null);
    setCoverLetter("");
    setChangesSummary([]);
    setJobInfo({ companyName: "", roleName: "", jobDescription: "" });
  };

  if (showSkillsReview && skillComparison) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/15 via-background via-50% to-accent/15">
        <div className="container mx-auto px-4 py-8">
          <SkillsReview
            jobSkills={skillComparison.job_skills}
            matchingSkills={skillComparison.matching_skills}
            missingSkills={skillComparison.missing_skills}
            onConfirm={handleConfirmSkills}
            onCancel={handleCancelSkillsReview}
            loading={tweaking}
          />
        </div>
      </div>
    );
  }

  if (tweakedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/15 via-background via-50% to-accent/15">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <TweakedResumeView
          originalData={originalData}
          tweakedData={tweakedData}
          changesSummary={changesSummary}
        />

        {coverLetter && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Generated Cover Letter</h3>
              <Button onClick={handleDownloadCoverLetter} disabled={downloadingCover}>
                <Download className="w-4 h-4 mr-2" />
                {downloadingCover ? "Generating PDF..." : "Download Cover Letter"}
              </Button>
            </div>
            <div id="cover-letter-content" className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{coverLetter}</pre>
            </div>
          </Card>
        )}

          <div className="flex justify-center">
            <Button onClick={handleCreateAnother} size="lg">
              Create Another Tweaked Resume
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/15 via-background via-50% to-accent/15">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <DashboardHero 
          hasResume={hasResume}
          onStartTweaking={handleStartTweaking}
          loading={analyzing}
        />
        <RecentTweaks userId={userId} />
      </div>
    </div>
  );
};
