import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHero } from "@/components/DashboardHero";
import { RecentTweaks } from "@/components/RecentTweaks";
import { SkillsReview } from "@/components/SkillsReview";

interface DashboardHomeProps {
  userId: string;
}

export const DashboardHome = ({ userId }: DashboardHomeProps) => {
  const navigate = useNavigate();
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tweaking, setTweaking] = useState(false);
  const [showSkillsReview, setShowSkillsReview] = useState(false);
  const [skillComparison, setSkillComparison] = useState<any>(null);
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

      // Redirect to the history page with the newly created tweaked resume ID
      if (functionData.tweaked_resume_id) {
        navigate(`/dashboard/history/${functionData.tweaked_resume_id}`);
        return;
      }

      // Fallback to the old behavior if no ID is returned
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
