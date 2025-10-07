import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import html2pdf from "html2pdf.js";
import { ResumeTemplate } from "@/components/ResumeTemplate";

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
}

interface TweakedResumeViewProps {
  originalData: ResumeData;
  tweakedData: ResumeData;
  changesSummary: string[];
  coverLetter?: string;
}

export const TweakedResumeView = ({ 
  originalData, 
  tweakedData, 
  changesSummary,
  coverLetter
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
        <Card className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground font-medium">Original Resume</p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * 0.35}`}
                    className="text-muted-foreground"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground">65</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-primary font-medium">Customized Resume</p>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-xs font-semibold">+26</span>
                </div>
              </div>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * 0.09}`}
                    className="text-primary"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-primary">91</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Improvements</h3>
            {changesSummary && changesSummary.length > 0 ? (
              <ul className="space-y-2">
                {changesSummary.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resume has been customized and optimized for this position.
              </p>
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

