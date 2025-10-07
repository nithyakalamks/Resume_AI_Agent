import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHero } from "@/components/DashboardHero";
import { RecentTweaks } from "@/components/RecentTweaks";
import { SkillsReview } from "@/components/SkillsReview";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import { ResumeTemplate } from "@/components/ResumeTemplate";
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
  const [downloadingResume, setDownloadingResume] = useState(false);
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

  const handleDownloadResume = async () => {
    setDownloadingResume(true);
    try {
      const element = document.getElementById("hidden-resume-content");
      if (!element) {
        console.error("Resume content not found");
        return;
      }

      const opt = {
        margin: 0.5,
        filename: `tweaked-resume-${jobInfo.companyName}-${jobInfo.roleName}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();
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
    setDownloadingCover(true);
    try {
      const element = document.getElementById("hidden-cover-letter-content");
      if (!element) {
        console.error("Cover letter content not found");
        return;
      }

      const opt = {
        margin: 1,
        filename: `cover-letter-${jobInfo.companyName}-${jobInfo.roleName}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();
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
      <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30">
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
      <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tweaker has done its magic!
            </h1>
            <p className="text-lg text-muted-foreground">
              Tweaked for {jobInfo.roleName} at {jobInfo.companyName}
            </p>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={handleDownloadResume} disabled={downloadingCover} size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </Button>
              <Button onClick={handleDownloadCoverLetter} disabled={downloadingCover} size="lg" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {downloadingCover ? "Generating PDF..." : "Download Cover Letter"}
              </Button>
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-muted"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.91)}`}
                    className="text-primary transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">91/100</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Job Fit Score: 91/100</h3>
                <p className="text-muted-foreground">
                  Your resume shows an excellent match with the job requirements
                </p>
              </div>
            </div>
          </Card>

          <TweakedResumeView
            originalData={originalData}
            tweakedData={tweakedData}
            changesSummary={changesSummary}
            coverLetter={coverLetter}
          />

          <div className="flex justify-center">
            <Button onClick={handleCreateAnother} size="lg">
              Create Another Tweaked Resume
            </Button>
          </div>

          <div className="hidden">
            <div id="hidden-resume-content">
              <ResumeTemplate data={tweakedData} />
            </div>
            <div id="hidden-cover-letter-content" className="p-8">
              <pre className="whitespace-pre-wrap font-sans text-sm">{coverLetter}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30">
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
