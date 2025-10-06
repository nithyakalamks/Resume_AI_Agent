export const createPrintableResume = (data: any, formatDate?: (date: string) => string) => {
  const defaultFormatDate = (dateStr: string) => {
    if (dateStr === "Present" || !dateStr) return dateStr || "Present";
    const [year, month] = dateStr.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return month ? `${months[parseInt(month) - 1]} ${year}` : year;
  };

  const formatFn = formatDate || defaultFormatDate;

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 24pt; font-weight: 700; margin: 0 0 8px 0; color: #1a1a1a;">${data.name}</h1>
        <div style="font-size: 9pt; color: #6b7280;">
          ${data.email ? `${data.email}` : ''}
          ${data.phone ? ` • ${data.phone}` : ''}
          ${data.linkedin ? ` • ${data.linkedin}` : ''}
          ${data.other_links ? ` • ${data.other_links}` : ''}
        </div>
      </div>

      ${data.summary ? `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Professional Summary</h2>
        <p style="margin: 0; color: #374151;">${data.summary}</p>
      </div>
      ` : ''}

      ${data.skills && data.skills.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Skills</h2>
        <div>
          ${data.skills.sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0)).map((skill: any) => 
            `<span style="display: inline-block; padding: 3px 10px; margin: 0 6px 6px 0; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 8.5pt; font-weight: 500;">${typeof skill === 'string' ? skill : skill.skill}</span>`
          ).join('')}
        </div>
      </div>
      ` : ''}

      ${data.experience && data.experience.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Professional Experience</h2>
        ${data.experience.map((exp: any) => `
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
              <div>
                <h3 style="font-size: 11pt; font-weight: 600; margin: 0; color: #1a1a1a;">${exp.title}</h3>
                <p style="font-size: 10pt; margin: 2px 0 0 0; color: #2563eb; font-weight: 500;">${exp.company}</p>
              </div>
              <span style="font-size: 8.5pt; color: #6b7280; white-space: nowrap;">${formatFn(exp.start || exp.start_date || '')} - ${formatFn(exp.end || exp.end_date || "Present")}</span>
            </div>
            ${(exp.bullets || exp.description) && (Array.isArray(exp.bullets) || Array.isArray(exp.description)) ? `
              <ul style="margin: 6px 0 0 18px; padding: 0;">
                ${(exp.bullets || exp.description).map((bullet: string) => `<li style="margin-bottom: 3px; color: #374151; font-size: 10pt;">${bullet}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.education && data.education.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Education</h2>
        ${data.education.map((edu: any) => `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <h3 style="font-size: 10.5pt; font-weight: 600; margin: 0; color: #1a1a1a;">${edu.degree}</h3>
                ${edu.field ? `<p style="margin: 2px 0 0 0; font-size: 9.5pt; color: #6b7280;">${edu.field}</p>` : ''}
                <p style="margin: 2px 0 0 0; font-size: 9.5pt; color: #2563eb; font-weight: 500;">${edu.institution}</p>
              </div>
              ${edu.graduation_date ? `<span style="font-size: 8.5pt; color: #6b7280;">${formatFn(edu.graduation_date)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.projects && data.projects.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Projects</h2>
        ${data.projects.map((project: any) => `
          <div style="margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 6px;">
            <h3 style="font-size: 10.5pt; font-weight: 600; margin: 0 0 4px 0; color: #1a1a1a;">${project.name}</h3>
            <p style="margin: 0 0 6px 0; font-size: 9.5pt; color: #374151;">${project.description}</p>
            ${project.technologies && project.technologies.length > 0 ? `
              <div>
                ${project.technologies.map((tech: string) => `<span style="display: inline-block; padding: 2px 6px; margin: 0 4px 4px 0; background: #e5e7eb; color: #374151; border-radius: 3px; font-size: 7.5pt;">${tech}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.certifications && data.certifications.length > 0 ? `
      <div>
        <h2 style="font-size: 12pt; font-weight: 600; margin: 0 0 8px 0; color: #2563eb; text-transform: uppercase; border-bottom: 1.5px solid #2563eb; padding-bottom: 4px;">Certifications</h2>
        ${data.certifications.map((cert: any) => `
          <div style="margin-bottom: 8px;">
            <h3 style="font-size: 10pt; font-weight: 600; margin: 0; color: #1a1a1a;">${cert.name}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p style="margin: 0; font-size: 9pt; color: #2563eb;">${cert.issuer}</p>
              ${cert.date ? `<span style="font-size: 8pt; color: #6b7280;">${formatFn(cert.date)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  `;
};

export const createPrintableCoverLetter = (coverLetter: string, name: string) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto;">
      <div style="white-space: pre-wrap; word-wrap: break-word;">${coverLetter}</div>
    </div>
  `;
};
