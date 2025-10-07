import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, TrendingUp, Download } from "lucide-react";
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

interface TailoredResumeViewProps {
  originalData: ResumeData;
  tailoredData: ResumeData;
  changesSummary: string[];
  skillMatches: Array<{
    skill: string;
    relevance: number;
    reason: string;
  }>;
}

export const TailoredResumeView = ({ 
  originalData, 
  tailoredData, 
  changesSummary,
  skillMatches 
}: TailoredResumeViewProps) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('tailored-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const opt = {
        margin: 5,
        filename: `${tailoredData.name.replace(/\s+/g, '_')}_Resume.pdf`,
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

  const getRelevanceBadgeColor = (relevance: number) => {
    if (relevance >= 0.8) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    if (relevance >= 0.5) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-8">
      {/* Changes Summary */}
      {changesSummary && changesSummary.length > 0 && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Key Changes Made</h3>
              <ul className="space-y-2">
                {changesSummary.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Skill Matches */}
      {skillMatches && skillMatches.length > 0 && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-4">Top Skill Matches</h3>
              <div className="space-y-3">
                {skillMatches.map((match, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Badge className={getRelevanceBadgeColor(match.relevance)}>
                      {(match.relevance * 100).toFixed(0)}%
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{match.skill}</p>
                      <p className="text-sm text-muted-foreground mt-1">{match.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Side-by-Side Comparison */}
      <Tabs defaultValue="tailored" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
            <TabsTrigger value="original">Original Resume</TabsTrigger>
          </TabsList>
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Generating PDF..." : "Download Tailored PDF"}
          </Button>
        </div>

        <TabsContent value="tailored" className="mt-6">
          <ResumeTemplate 
            data={tailoredData} 
            id="tailored-resume-content"
          />
        </TabsContent>

        <TabsContent value="original" className="mt-6">
          <Card className="p-8">
            <ResumeTemplate data={originalData} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

