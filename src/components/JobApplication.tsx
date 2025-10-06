import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download } from "lucide-react";
import { TailoredResumeView } from "@/components/TailoredResumeView";

interface JobApplicationProps {
  userId: string;
  currentResumeId: string | null;
}

export const JobApplication = ({ userId, currentResumeId }: JobApplicationProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [tailoredData, setTailoredData] = useState<any>(null);
  const [changesSummary, setChangesSummary] = useState<string[]>([]);
  const [skillMatches, setSkillMatches] = useState<any[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [downloadingCover, setDownloadingCover] = useState(false);
  const { toast } = useToast();

  const handleTailor = async () => {
    if (!currentResumeId) {
      toast({
        title: "No resume found",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    setTailoring(true);
    try {
      const { data: resumeData } = await supabase
        .from("resumes")
        .select("parsed_data")
        .eq("id", currentResumeId)
        .single();

      if (!resumeData) throw new Error("Resume not found");

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "tailor-resume",
        {
          body: {
            resumeId: currentResumeId,
            jobDescription,
          },
        }
      );

      if (functionError) throw functionError;

      setOriginalData(resumeData.parsed_data);
      setTailoredData(functionData.tailored_data);
      setChangesSummary(functionData.changes_summary || []);
      setSkillMatches(functionData.skill_matches || []);
      setCoverLetter(functionData.cover_letter || "");

      // Insert job description first to get its ID
      const { data: jobDescData, error: jobDescError } = await supabase
        .from("job_descriptions")
        .insert({
          user_id: userId,
          resume_id: currentResumeId,
          description: jobDescription,
        })
        .select()
        .single();

      if (jobDescError) throw jobDescError;

      // Insert tailored resume with job_description_id
      const { error: insertError } = await supabase.from("tailored_resumes").insert({
        user_id: userId,
        resume_id: currentResumeId,
        job_description_id: jobDescData.id,
        tailored_data: functionData.tailored_data,
        cover_letter: functionData.cover_letter,
      });

      if (insertError) throw insertError;

      toast({
        title: "Resume tailored successfully",
      });
    } catch (error: any) {
      toast({
        title: "Tailoring failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTailoring(false);
    }
  };

  const handleDownloadCoverLetter = async () => {
    setDownloadingCover(true);
    try {
      if (!coverLetter || !tailoredData?.name) {
        throw new Error('Cover letter or name not available');
      }

      const filename = `${tailoredData.name.replace(/\s+/g, '_')}_Cover_Letter.pdf`;

      const { data: pdfBlob, error } = await supabase.functions.invoke('generate-resume-pdf', {
        body: { 
          type: 'cover-letter',
          data: coverLetter,
          name: filename
        }
      });

      if (error) throw error;

      const url = window.URL.createObjectURL(new Blob([pdfBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

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
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Apply to a New Job</h2>
        <p className="text-muted-foreground mb-4">
          Paste the job description and get a tailored resume with cover letter
        </p>
        
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="min-h-[200px] mb-4"
        />

        <Button
          onClick={handleTailor}
          disabled={tailoring || !jobDescription.trim()}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {tailoring ? "Tailoring Resume..." : "Tailor Resume"}
        </Button>
      </Card>

      {tailoredData && (
        <div className="space-y-6">
          <TailoredResumeView
            originalData={originalData}
            tailoredData={tailoredData}
            changesSummary={changesSummary}
            skillMatches={skillMatches}
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
        </div>
      )}
    </div>
  );
};
