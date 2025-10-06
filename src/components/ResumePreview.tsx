import { Mail, Phone, Linkedin, Link2, Calendar, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import html2pdf from "html2pdf.js";

interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  other_links?: string;
  summary?: string;
  skills?: Array<{ skill: string; confidence: number }>;
  experience?: Array<{
    company: string;
    title: string;
    start: string;
    end?: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduation_date?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
}

interface ResumePreviewProps {
  data: ResumeData;
}

export const ResumePreview = ({ data }: ResumePreviewProps) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  
  const formatDate = (dateStr: string) => {
    if (dateStr === "Present" || !dateStr) return dateStr || "Present";
    const [year, month] = dateStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return month ? `${months[parseInt(month) - 1]} ${year}` : year;
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const opt = {
        margin: 10,
        filename: `${data.name.replace(/\s+/g, '_')}_resume.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleDownloadPDF} disabled={downloading}>
          <Download className="w-4 h-4 mr-2" />
          {downloading ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>
      
      <Card id="resume-content" className="max-w-4xl mx-auto p-8 bg-background shadow-lg">
        {/* Header Section */}
      <div className="border-b border-border pb-6 mb-6">
        <h1 className="text-4xl font-bold text-foreground mb-3">{data.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {data.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <a href={`mailto:${data.email}`} className="hover:text-primary transition-colors">
                {data.email}
              </a>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{data.phone}</span>
            </div>
          )}
          {data.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                LinkedIn
              </a>
            </div>
          )}
          {data.other_links && (
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <a href={data.other_links} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                Portfolio
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 uppercase tracking-wide border-b border-border pb-2">
            Professional Summary
          </h2>
          <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Skills Section */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 uppercase tracking-wide border-b border-border pb-2">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills
              .sort((a, b) => b.confidence - a.confidence)
              .map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  title={`Confidence: ${Math.round(skill.confidence * 100)}%`}
                >
                  {skill.skill}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Experience Section */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 uppercase tracking-wide border-b border-border pb-2">
            Professional Experience
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{exp.title}</h3>
                    <p className="text-primary font-medium">{exp.company}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(exp.start)} - {formatDate(exp.end || "Present")}
                    </span>
                  </div>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    {exp.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {data.education && data.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 uppercase tracking-wide border-b border-border pb-2">
            Education
          </h2>
          <div className="space-y-4">
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{edu.degree}</h3>
                    {edu.field && <p className="text-muted-foreground">{edu.field}</p>}
                    <p className="text-primary font-medium">{edu.institution}</p>
                  </div>
                  {edu.graduation_date && (
                    <span className="text-sm text-muted-foreground">{formatDate(edu.graduation_date)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 uppercase tracking-wide border-b border-border pb-2">
            Projects
          </h2>
          <div className="space-y-4">
            {data.projects.map((project, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
                <p className="text-muted-foreground mb-2">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, techIdx) => (
                      <span key={techIdx} className="px-2 py-1 bg-muted text-foreground text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications Section */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-3 uppercase tracking-wide border-b border-border pb-2">
            Certifications
          </h2>
          <div className="space-y-3">
            {data.certifications.map((cert, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-semibold text-foreground">{cert.name}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-primary">{cert.issuer}</p>
                  {cert.date && <span className="text-sm text-muted-foreground">{formatDate(cert.date)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </Card>
    </div>
  );
};
