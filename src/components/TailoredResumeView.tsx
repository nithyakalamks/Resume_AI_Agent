import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";

interface Skill {
  skill: string;
  confidence: number;
  relevance?: number;
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

  const getRelevanceBadgeColor = (relevance: number) => {
    if (relevance >= 0.8) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    if (relevance >= 0.5) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-8">
      {/* Changes Summary */}
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

      {/* Skill Matches */}
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

      {/* Side-by-Side Comparison */}
      <Tabs defaultValue="tailored" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
          <TabsTrigger value="original">Original Resume</TabsTrigger>
        </TabsList>

        <TabsContent value="tailored" className="mt-6">
          <Card className="p-8">
            <ResumeContent data={tailoredData} formatDate={formatDate} showRelevance />
          </Card>
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
  const getRelevanceBadgeColor = (relevance: number) => {
    if (relevance >= 0.8) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    if (relevance >= 0.5) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-bold mb-2">{data.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div>
          <h2 className="text-2xl font-bold mb-3 text-primary">Professional Summary</h2>
          <p className="text-foreground/90 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-3 text-primary">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skillItem, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={showRelevance && skillItem.relevance !== undefined 
                    ? getRelevanceBadgeColor(skillItem.relevance)
                    : ""}
                >
                  {skillItem.skill}
                  {showRelevance && skillItem.relevance !== undefined && (
                    <span className="ml-2 text-xs opacity-70">
                      {(skillItem.relevance * 100).toFixed(0)}%
                    </span>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-primary">Experience</h2>
          <div className="space-y-6">
            {data.experience.map((exp, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-primary/20">
                {showRelevance && exp.relevance !== undefined && exp.relevance >= 0.7 && (
                  <div className="absolute -left-2 top-0">
                    <ArrowUp className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="mb-2">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {exp.title}
                    {showRelevance && exp.relevance !== undefined && (
                      <Badge className={getRelevanceBadgeColor(exp.relevance)}>
                        {(exp.relevance * 100).toFixed(0)}% match
                      </Badge>
                    )}
                  </h3>
                  <div className="text-muted-foreground">
                    <span className="font-medium">{exp.company}</span>
                    {exp.location && <span> • {exp.location}</span>}
                  </div>
                  {exp.start_date && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                    </p>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                  {exp.description.map((item, i) => (
                    <li key={i} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-primary">Projects</h2>
          <div className="space-y-4">
            {data.projects.map((project, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  {project.name}
                  {showRelevance && project.relevance !== undefined && (
                    <Badge className={getRelevanceBadgeColor(project.relevance)}>
                      {(project.relevance * 100).toFixed(0)}% relevant
                    </Badge>
                  )}
                </h3>
                <p className="text-foreground/90 mb-2">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <Badge key={i} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-primary">Education</h2>
          <div className="space-y-4">
            {data.education.filter((edu: any) => edu && edu.degree).map((edu: any, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold">{edu.degree}</h3>
                <p className="text-muted-foreground">{edu.institution}</p>
                {edu.graduation_date && (
                  <p className="text-sm text-muted-foreground">{formatDate(edu.graduation_date)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-primary">Certifications</h2>
          <ul className="space-y-2">
            {data.certifications.filter((cert: any) => cert && cert.name).map((cert: any, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{cert.name}</p>
                  {cert.issuer && <p className="text-sm text-muted-foreground">{cert.issuer}</p>}
                  {cert.date && <p className="text-sm text-muted-foreground">{formatDate(cert.date)}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
