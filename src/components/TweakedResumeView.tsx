import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import html2pdf from "html2pdf.js";
import { ResumeTemplate } from "@/components/ResumeTemplate";
import { ScoreAnalysis } from "@/components/ScoreAnalysis";

interface Skill {
  skill: string;
  confidence: number;
  relevance?: number;
  category?: string;
}

interface Experience {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description: string[];
  relevance?: number;
}

interface Project {
  name: string;
  description: string;
  technologies?: string[];
  relevance?: number;
}

interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  skills: Skill[];
  experience: Experience[];
  education?: any[];
  projects?: Project[];
  certifications?: any[];
  added_skills?: string[];
}

interface TweakedResumeViewProps {
  originalData: ResumeData;
  tweakedData: ResumeData;
  changesSummary: string[];
  coverLetter?: string;
  originalScore?: number;
  customizedScore?: number;
  skillMatches?: any[];
}

export const TweakedResumeView = ({ 
  originalData, 
  tweakedData, 
  changesSummary,
  coverLetter,
  originalScore,
  customizedScore,
  skillMatches
}: TweakedResumeViewProps) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('tweaked-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const opt = {
        margin: 5,
        filename: `${tweakedData.name.replace(/\s+/g, '_')}_Resume.pdf`,
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

  return (
    <Tabs defaultValue="customized" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8 max-w-4xl mx-auto">
        <TabsTrigger value="original">Original Resume</TabsTrigger>
        <TabsTrigger value="customized">Customized Resume</TabsTrigger>
        <TabsTrigger value="cover">Cover Letter</TabsTrigger>
        <TabsTrigger value="analysis">Score Analysis</TabsTrigger>
      </TabsList>

      <TabsContent value="original" className="mt-6">
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10">
          <ResumeTemplate 
            data={originalData} 
            id="original-resume-content"
          />
        </Card>
      </TabsContent>

      <TabsContent value="customized" className="mt-6">
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10">
          <ResumeTemplate 
            data={tweakedData} 
            id="tweaked-resume-content"
          />
        </Card>
      </TabsContent>

      <TabsContent value="cover" className="mt-6">
        <Card className="p-8">
          <div className="prose prose-sm max-w-none">
            {coverLetter ? (
              <pre id="cover-letter-content" className="whitespace-pre-wrap text-sm font-sans">{coverLetter}</pre>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No cover letter available
              </p>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="analysis" className="mt-6">
        <ScoreAnalysis 
          originalScore={originalScore}
          customizedScore={customizedScore || 85}
          skillMatches={{
            matching: skillMatches?.filter((s: any) => s.relevance >= 0.5) || [],
            missing: [],
            addedSkills: tweakedData?.added_skills || []
          }}
        />
      </TabsContent>
    </Tabs>
  );
};

