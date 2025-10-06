// No imports needed for simple template

interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  other_links?: string;
  summary?: string;
  skills?: Array<{ skill: string; confidence: number; category?: string }>;
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
  const formatDate = (dateStr: string) => {
    if (dateStr === "Present" || !dateStr) return dateStr || "Present";
    const [year, month] = dateStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return month ? `${months[parseInt(month) - 1]} ${year}` : year;
  };

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
          {data.other_links && data.other_links.split(',').map((link: string, idx: number) => {
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
      {data.experience && data.experience.length > 0 && (
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
                      {formatDate(exp.start)} - {formatDate(exp.end || "Present")}
                    </span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="space-y-0.5 text-sm">
                      {exp.bullets.map((bullet, bulletIdx) => (
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
