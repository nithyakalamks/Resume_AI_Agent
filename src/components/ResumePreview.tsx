// No imports needed for simple template

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
  const formatDate = (dateStr: string) => {
    if (dateStr === "Present" || !dateStr) return dateStr || "Present";
    const [year, month] = dateStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return month ? `${months[parseInt(month) - 1]} ${year}` : year;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white text-black">
      {/* Header Section */}
      <div className="text-center mb-3">
        <h1 className="text-2xl font-bold uppercase mb-1">{data.name}</h1>
        <div className="text-sm">
          {[
            data.phone,
            data.email,
            data.linkedin && "LinkedIn",
            data.other_links && "Portfolio"
          ].filter(Boolean).join(" ⋄ ")}
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
                <div key={idx}>
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
                <div key={idx}>
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
            <p className="text-sm">
              {data.skills
                .sort((a, b) => b.confidence - a.confidence)
                .map(skill => skill.skill)
                .join(", ")}
            </p>
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
