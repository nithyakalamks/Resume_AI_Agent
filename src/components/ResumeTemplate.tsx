import React from 'react';

interface Skill {
  skill: string;
  confidence: number;
  relevance?: number;
  category?: string;
}

interface Experience {
  company: string;
  title: string;
  start?: string;
  end?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  bullets?: string[];
  description?: string[];
  relevance?: number;
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduation_date?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  location?: string;
}

interface Project {
  name: string;
  description: string;
  technologies?: string[];
  relevance?: number;
}

interface Certification {
  name: string;
  issuer: string;
  date?: string;
}

interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  other_links?: string;
  summary?: string;
  skills?: Skill[];
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
}

interface ResumeTemplateProps {
  data: ResumeData;
  id?: string;
}

export const ResumeTemplate = ({ data, id }: ResumeTemplateProps) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr === "Present" || dateStr.toLowerCase() === "present") return "Present";
    
    try {
      const [year, month] = dateStr.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return month ? `${months[parseInt(month) - 1]} ${year}` : year;
    } catch {
      return dateStr;
    }
  };

  const getLinkLabel = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('github.com')) return 'GitHub';
    if (lowerUrl.includes('gitlab.com')) return 'GitLab';
    if (lowerUrl.includes('bitbucket.org')) return 'Bitbucket';
    return 'Portfolio';
  };

  return (
    <div 
      id={id}
      className="max-w-4xl mx-auto px-4 pt-2 pb-4 bg-white text-black" 
      style={{ pageBreakInside: 'avoid' }}
    >
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
          {data.other_links && data.other_links.split(',').map((link: string, idx: number) => {
            const trimmedLink = link.trim();
            return (
              <React.Fragment key={`link-${idx}`}>
                {(data.phone || data.email || data.linkedin || idx > 0) && <span>⋄</span>}
                <a 
                  href={trimmedLink}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {getLinkLabel(trimmedLink)}
                </a>
              </React.Fragment>
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
      {data.education && data.education.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Education
            </h2>
            <div className="space-y-2">
              {data.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="text-sm">
                    <span className="font-semibold">{edu.degree}</span>
                    {edu.field && <span>, {edu.field}</span>}
                    <span> - {edu.institution}</span>
                  </div>
                  {(edu.start_date || edu.end_date || edu.graduation_date) && (
                    <span className="text-sm whitespace-nowrap">
                      {edu.start_date && edu.end_date 
                        ? `${formatDate(edu.start_date)} - ${formatDate(edu.end_date)}`
                        : edu.graduation_date 
                          ? formatDate(edu.graduation_date)
                          : formatDate(edu.start_date || edu.end_date)
                      }
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Experience Section */}
      {data.experience && data.experience.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Experience
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp, idx) => {
                const startDate = exp.start || exp.start_date;
                const endDate = exp.end || exp.end_date;
                const bulletPoints = exp.bullets || exp.description || [];
                
                return (
                  <div key={idx} style={{ pageBreakInside: 'avoid' }}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-bold">{exp.company} - {exp.title}</h3>
                      <span className="text-sm whitespace-nowrap">
                        {formatDate(startDate)} - {formatDate(endDate) || "Present"}
                      </span>
                    </div>
                    {bulletPoints.length > 0 && (
                      <ul className="space-y-0.5 text-sm">
                        {bulletPoints.map((bullet, bulletIdx) => (
                          <li key={bulletIdx} className="leading-relaxed flex">
                            <span className="mr-1.5">-</span>
                            <span className="flex-1">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Projects Section */}
      {data.projects && data.projects.length > 0 && (
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
                    {project.technologies && project.technologies.length > 0 && (
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
      {data.skills && data.skills.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Skills
            </h2>
            {(() => {
              const categorized = data.skills.reduce((acc: any, skill: Skill) => {
                const category = skill.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(skill);
                return acc;
              }, {});

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
                        .sort((a: Skill, b: Skill) => b.confidence - a.confidence)
                        .map((s: Skill) => s.skill)
                        .join(", ")}
                    </span>
                  </div>
                ));
            })()}
          </div>
        </>
      )}

      {/* Certifications Section */}
      {data.certifications && data.certifications.length > 0 && (
        <>
          <hr className="border-t border-black my-2" />
          <div className="mb-3">
            <h2 className="text-base font-bold uppercase mb-1">
              Certifications and Achievements
            </h2>
            <ul className="space-y-0.5 text-sm">
              {data.certifications.map((cert, idx) => (
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