import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { FileUploadZone } from "@/components/ui/file-upload-zone";
import { UploadProgress } from "@/components/ui/upload-progress";
import { SuccessBanner } from "@/components/ui/success-banner";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import { SkillsReview } from "@/components/SkillsReview";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import { SAMPLE_JOB_DESCRIPTION } from "@/lib/sample-job-description";

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Upload Resume", description: "Add your base resume" },
  { id: 2, title: "Add Job Details", description: "Paste job description" },
  { id: 3, title: "Review Results", description: "Get your tweaked resume" },
];

export const OnboardingWizard = ({ userId, onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  // Step 1: Resume Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "parsing" | "complete">("idle");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);

  // Step 2: Job Description
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Step 3: Results
  const [tweakedData, setTweakedData] = useState<any>(null);
  const [changesSummary, setChangesSummary] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Step 1: Handle Resume Upload
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadStage("uploading");

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      setUploadStage("parsing");

      const { data: parseData, error: parseError } = await supabase.functions.invoke(
        "parse-resume",
        { body: { filePath: fileName } }
      );

      if (parseError) throw parseError;

      const { data: resumeRecord, error: insertError } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          file_path: fileName,
          original_filename: selectedFile.name,
          parsed_data: parseData.parsed_data,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadStage("complete");
      setResumeId(resumeRecord.id);
      setResumeData(parseData.parsed_data);

      toast({ title: "Resume uploaded successfully!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadStage("idle");
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinueToJobDetails = () => {
    setCurrentStep(2);
  };

  // Step 2: Handle Job Description & Skill Analysis
  const handleAnalyzeSkills = async () => {
    if (!resumeId || !jobDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all job details",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: resume } = await supabase
        .from("resumes")
        .select("parsed_data")
        .eq("id", resumeId)
        .single();

      if (!resume) throw new Error("Resume not found");

      const { data, error } = await supabase.functions.invoke("compare-skills", {
        body: {
          resumeData: resume.parsed_data,
          jobDescription,
          companyName,
          roleName,
        },
      });

      if (error) throw error;

      setSkillsData(data);
      
      // Auto-select recommended skills (required and preferred importance)
      if (data.missing_skills && Array.isArray(data.missing_skills)) {
        const recommended = data.missing_skills
          .filter((s: any) => s.importance === "required" || s.importance === "preferred")
          .map((s: any) => s.skill);
        setSelectedSkills(recommended);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSkills = async () => {
    if (!resumeId || !skillsData) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("tweak-resume", {
        body: {
          resumeData,
          jobDescription,
          companyName,
          roleName,
          skillsToAdd: selectedSkills,
          skillMatches: skillsData,
        },
      });

      if (error) throw error;

      // Save to database
      const { data: jobDescRecord } = await supabase
        .from("job_descriptions")
        .insert({
          user_id: userId,
          company_name: companyName,
          role_name: roleName,
          description: jobDescription,
          resume_id: resumeId,
        })
        .select()
        .single();

      if (jobDescRecord) {
        await supabase.from("tweaked_resumes").insert({
          user_id: userId,
          resume_id: resumeId,
          job_description_id: jobDescRecord.id,
          tweaked_data: data.tweaked_resume,
          changes_summary: data.changes_summary,
          skill_matches: skillsData,
          cover_letter: data.cover_letter,
        });
      }

      setTweakedData(data.tweaked_resume);
      setChangesSummary(data.changes_summary);
      setCoverLetter(data.cover_letter);
      setCurrentStep(3);

      toast({ title: "Resume tweaked successfully!" });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 3: Download functionality
  const handleDownloadCoverLetter = async () => {
    setIsDownloading(true);
    const element = document.getElementById("cover-letter-content");
    if (!element) return;

    try {
      const opt = {
        margin: 1,
        filename: `cover-letter-${companyName || "job"}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();
      toast({ title: "Cover letter downloaded!" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 relative overflow-hidden">
      {/* Circular gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/50 via-[hsl(169,48%,53%)]/40 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-gradient-to-tl from-accent/50 via-[hsl(169,48%,53%)]/40 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 shadow-[0_0_40px_rgba(var(--primary),0.2)]" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-accent/8 to-primary/6 rounded-full blur-2xl translate-y-1/2 translate-x-1/2 shadow-[0_0_40px_rgba(var(--accent),0.2)]" />
      
      <div className="container mx-auto px-4 pt-2 relative z-10">
        {/* Progress Stepper */}
        <ProgressStepper steps={STEPS} currentStep={currentStep} />

        {/* Step 1: Upload Resume */}
        {currentStep === 1 && (
          <Card className="mt-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Welcome! Let's start by uploading your resume
              </CardTitle>
              <CardDescription>
                Upload your base resume in PDF format. We'll extract all the important details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadStage === "idle" && (
                <>
                  <FileUploadZone
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    onClearFile={() => setSelectedFile(null)}
                    accept=".pdf"
                    maxSize={20}
                    disabled={isUploading}
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full"
                    size="lg"
                  >
                    Upload & Parse Resume
                  </Button>
                </>
              )}

              {(uploadStage === "uploading" || uploadStage === "parsing") && (
                <UploadProgress
                  stage={uploadStage}
                  fileName={selectedFile?.name}
                />
              )}

              {uploadStage === "complete" && (
                <>
                  <SuccessBanner
                    title="Resume uploaded and parsed successfully!"
                    description="Your resume has been analyzed and is ready to be tweaked."
                  />
                  <Button
                    onClick={handleContinueToJobDetails}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Job Details →
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Job Description */}
        {currentStep === 2 && !skillsData && (
          <Card className="mt-2">
            <CardHeader>
              <CardTitle>Tell us about the job you're applying for</CardTitle>
              <CardDescription>
                Paste the job description and we'll tweak your resume to match it perfectly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Name</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Senior Software Engineer"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Job Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)}
                    disabled={isAnalyzing}
                    className="text-xs"
                  >
                    Sample JD
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleAnalyzeSkills}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze & Generate Tweaked Resume"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2b: Skills Review */}
        {currentStep === 2 && skillsData && (
          <div className="mt-8">
            <SkillsReview
              jobSkills={skillsData.job_skills || []}
              matchingSkills={skillsData.matching_skills || []}
              missingSkills={skillsData.missing_skills || []}
              onConfirm={(skills) => {
                setSelectedSkills(skills);
                handleConfirmSkills();
              }}
              onCancel={() => setSkillsData(null)}
              loading={isGenerating}
            />
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && tweakedData && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Tweaked Resume is Ready!
                </CardTitle>
                <CardDescription>
                  Review your customized resume and cover letter below. Download them when you're ready.
                </CardDescription>
              </CardHeader>
            </Card>

            <TweakedResumeView
              tweakedData={tweakedData}
              originalData={resumeData}
              changesSummary={changesSummary}
            />

            <Card>
              <CardHeader>
                <CardTitle>Generated Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  id="cover-letter-content"
                  className="prose prose-sm max-w-none bg-background p-8 rounded-lg border"
                  dangerouslySetInnerHTML={{ __html: coverLetter }}
                />
                <Button
                  onClick={handleDownloadCoverLetter}
                  disabled={isDownloading}
                  className="w-full mt-4"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Cover Letter (PDF)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-center mb-4">
                  Great job! You've completed your first tweaked resume. Ready to explore more features?
                </p>
                <Button onClick={onComplete} className="w-full" size="lg">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
