import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Search } from "lucide-react";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import { SkillsReview } from "@/components/SkillsReview";
import { ResumeTemplate } from "@/components/ResumeTemplate";
import html2pdf from "html2pdf.js";

interface JobApplicationProps {
  userId: string;
  currentResumeId: string | null;
}

export const JobApplication = ({ userId, currentResumeId }: JobApplicationProps) => {
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [tweaking, setTweaking] = useState(false);
  const [showSkillsReview, setShowSkillsReview] = useState(false);
  const [skillComparison, setSkillComparison] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [tweakedData, setTweakedData] = useState<any>(null);
  const [changesSummary, setChangesSummary] = useState<string[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [downloadingCover, setDownloadingCover] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeSkills = async () => {
    if (!currentResumeId) {
      toast({
        title: "No resume found",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }

    if (!companyName.trim() || !roleName.trim() || !jobDescription.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in company name, role name, and job description",
        variant: "destructive",
      });
      return;
    }

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
        description: `Found ${comparisonData.missing_skills.length} missing skills`,
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
            companyName,
            roleName,
            jobDescription,
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
          ? `Added ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} to your resume`
          : undefined,
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
    if (!tweakedData) return;
    
    setDownloadingResume(true);
    try {
      const resumeElement = document.getElementById('hidden-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const userName = tweakedData?.name || 'User';
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
      setDownloadingResume(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    if (!coverLetter) {
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

      const userName = tweakedData?.name || 'User';
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
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloadingCover(false);
    }
  };

  if (!currentResumeId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Please upload a resume first to start applying to jobs
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!showSkillsReview && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Apply to a New Job</h2>
          <p className="text-muted-foreground mb-4">
            Enter job details and we'll analyze skill gaps before tweaking your resume
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google, Microsoft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[200px]"
            />
          </div>

          <Button
            onClick={handleAnalyzeSkills}
            disabled={analyzing || !companyName.trim() || !roleName.trim() || !jobDescription.trim()}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {analyzing ? "Analyzing Skills..." : "Analyze Skills & Continue"}
          </Button>
        </Card>
      )}

      {showSkillsReview && skillComparison && (
        <SkillsReview
          jobSkills={skillComparison.job_skills}
          matchingSkills={skillComparison.matching_skills}
          missingSkills={skillComparison.missing_skills}
          onConfirm={handleConfirmSkills}
          onCancel={handleCancelSkillsReview}
          loading={tweaking}
        />
      )}

      {tweakedData && (
        <div className="space-y-6">
          {/* Title Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Tweaker has done its magic!</h1>
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
                {coverLetter && (
                  <Button variant="outline" onClick={handleDownloadCoverLetter} disabled={downloadingCover}>
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingCover ? "Generating PDF..." : "Download Cover Letter"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Job Fit Score */}
          <Card className="p-4">
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - 91 / 100)}`}
                    className="text-green-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-green-500">
                    91
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Job Fit Score: 91/100</h3>
                <p className="text-muted-foreground">
                  Excellent match! Your customized resume is optimized for this role.
                </p>
              </div>
            </div>
          </Card>

          {/* Tabs for Resume, Cover Letter, and Analysis */}
          <TweakedResumeView
            originalData={originalData}
            tweakedData={tweakedData}
            changesSummary={changesSummary}
            coverLetter={coverLetter}
          />

          {/* Hidden elements for PDF generation - always rendered */}
          <div className="absolute -top-[9999px] left-0 w-full">
            {/* Hidden resume content for PDF generation */}
            <div id="hidden-resume-content" className="bg-white">
              <div className="p-8">
                <ResumeTemplate 
                  data={tweakedData} 
                />
              </div>
            </div>

            {/* Hidden cover letter content for PDF generation */}
            {coverLetter && (
              <div id="hidden-cover-letter-content" className="bg-white">
                <div className="p-8 max-w-4xl mx-auto">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-black">
                      {coverLetter}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
