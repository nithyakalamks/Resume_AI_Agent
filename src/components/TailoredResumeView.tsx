import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowRight, CheckCircle2, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import html2pdf from "html2pdf.js";

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
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.toLowerCase() === 'present') return 'Present';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

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
          <div id="tailored-resume-content">
            <ResumeContent data={tailoredData} formatDate={formatDate} showRelevance />
          </div>
        </TabsContent>

        <TabsContent value="original" className="mt-6">
          <Card className="p-8">
            <ResumeContent data={originalData} formatDate={formatDate} showRelevance={false} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ResumeContent = ({ 
  data, 
  formatDate, 
  showRelevance 
}: { 
  data: ResumeData; 
  formatDate: (date?: string) => string;
  showRelevance: boolean;
}) => {
  const getLinkLabel = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('github.com')) return 'GitHub';
    if (lowerUrl.includes('gitlab.com')) return 'GitLab';
    if (lowerUrl.includes('bitbucket.org')) return 'Bitbucket';
    return 'Portfolio';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-2 pb-4 bg-white text-black" style={{ pageBreakInside: 'avoid' }}>
      {/* Header Section */}
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold uppercase mb-1">{data.name}</h1>
        <div className="text-sm flex items-center justify-center gap-2 flex-wrap">
          {data.phone && <span>{data.phone}</span>}
          {data.email && (
            <>
              {data.phone && <span>⋄</span>}
              <a href={`mailto:${data.email}`} className="text-blue-600 hover:underline">{data.email}</a>
            </>
          )}
          {data.linkedin && (
            <>
              {(data.phone || data.email) && <span>⋄</span>}
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
            </>
          )}
          {(data as any).other_links && (data as any).other_links.split(',').map((link: string, idx: number) => {
            const trimmedLink = link.trim();
            return (
              <>
                {(data.phone || data.email || data.linkedin || idx > 0) && <span key={`sep-${idx}`}>⋄</span>}
                <a 
                  key={idx}
                  href={trimmedLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {getLinkLabel(trimmedLink)}
                </a>
              </>
            );
          })}
        </div>
      </div>

      {/* Summary Section */}
      {data.summary && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Professional Summary
            </h2>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </div>
        </>
      )}

      {/* Education Section */}
      {data.education && Array.isArray(data.education) && data.education.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Education
            </h2>
            <div className="space-y-2">
              {data.education.filter((edu: any) => edu && edu.degree).map((edu: any, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="text-sm">
                    <span className="font-semibold">{edu.degree}</span>
                    {edu.field && <span>, {edu.field}</span>}
                    <span> - {edu.institution}</span>
                  </div>
                  {edu.graduation_date && (
                    <span className="text-sm whitespace-nowrap">{formatDate(edu.graduation_date)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Experience Section */}
      {data.experience && Array.isArray(data.experience) && data.experience.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Experience
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp, idx) => (
                <div key={idx} style={{ pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold">{exp.company} - {exp.title}</h3>
                    <span className="text-sm whitespace-nowrap">
                      {formatDate(exp.start_date)} - {formatDate(exp.end_date) || "Present"}
                    </span>
                  </div>
                  {Array.isArray(exp.description) && exp.description.length > 0 && (
                    <ul className="space-y-0.5 text-sm">
                      {exp.description.map((bullet, bulletIdx) => (
                        <li key={bulletIdx} className="leading-relaxed flex">
                          <span className="mr-1.5">-</span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Projects Section */}
      {data.projects && Array.isArray(data.projects) && data.projects.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Projects
            </h2>
            <div className="space-y-3">
              {data.projects.map((project, idx) => (
                <div key={idx} style={{ pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold">{project.name}</h3>
                    {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                      <span className="text-sm italic">{project.technologies.join(", ")}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Skills Section */}
      {data.skills && Array.isArray(data.skills) && data.skills.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Skills
            </h2>
            {(() => {
              // Group skills by category
              const categorized = data.skills.reduce((acc: any, skill: any) => {
                const category = skill.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(skill);
                return acc;
              }, {});

              // Define order of categories
              const categoryOrder = [
                "Programming Languages",
                "Frameworks & Libraries", 
                "Technologies & Tools",
                "Databases",
                "Cloud & DevOps",
                "Soft Skills",
                "Other"
              ];

              return categoryOrder
                .filter(cat => categorized[cat] && categorized[cat].length > 0)
                .map((category, idx) => (
                  <div key={idx} className="mb-2">
                    <span className="text-sm font-semibold">{category}: </span>
                    <span className="text-sm">
                      {categorized[category]
                        .sort((a: any, b: any) => b.confidence - a.confidence)
                        .map((s: any) => s.skill)
                        .join(", ")}
                    </span>
                  </div>
                ));
            })()}
          </div>
        </>
      )}

      {/* Certifications Section */}
      {data.certifications && Array.isArray(data.certifications) && data.certifications.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Certifications and Achievements
            </h2>
            <ul className="space-y-0.5 text-sm">
              {data.certifications.filter((cert: any) => cert && cert.name).map((cert: any, idx) => (
                <li key={idx} className="leading-relaxed flex">
                  <span className="mr-1.5">-</span>
                  <span className="flex-1">
                    <span className="font-semibold">{cert.name}</span> - {cert.issuer}
                    {cert.date && <span className="text-sm"> ({formatDate(cert.date)})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
