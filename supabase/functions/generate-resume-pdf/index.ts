import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  other_links?: string;
  summary?: string;
  skills?: Array<{ skill?: string; name?: string; confidence?: number; relevance?: number }>;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    start?: string;
    end?: string;
    start_date?: string;
    end_date?: string;
    bullets?: string[];
    description?: string[] | string;
    achievements?: string[];
    relevance?: number;
  }>;
  education?: Array<{
    degree?: string;
    field?: string;
    institution?: string;
    location?: string;
    graduation_date?: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    link?: string;
    relevance?: number;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, name } = await req.json();
    
    console.log('Generating PDF:', { type, hasData: !!data, name });

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    if (type === 'resume') {
      generateResumePDF(doc, data as ResumeData);
    } else if (type === 'cover-letter') {
      generateCoverLetterPDF(doc, data as string, name);
    }

    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name || 'document'}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateResumePDF(doc: any, data: ResumeData) {
  let yPos = 20;
  const margin = 20;
  const pageWidth = 170;
  
  console.log('Generating PDF with data:', JSON.stringify(data, null, 2));
  
  // Header
  if (data.name) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(data.name || '', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contactInfo = [data.email, data.phone, data.location].filter(Boolean).join(' | ');
    if (contactInfo) {
      doc.text(contactInfo, margin, yPos);
      yPos += 5;
    }
    
    const links = [data.linkedin, data.github, data.other_links].filter(Boolean).join(' | ');
    if (links) {
      doc.text(links, margin, yPos);
      yPos += 5;
    }
    
    doc.line(margin, yPos, pageWidth + margin, yPos);
    yPos += 8;
  }

  // Summary
  if (data.summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFESSIONAL SUMMARY', margin, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(data.summary, pageWidth);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 5;
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SKILLS', margin, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const skillText = data.skills.map((s) => s.skill || s.name || '').filter(Boolean).join(' • ');
    const skillLines = doc.splitTextToSize(skillText, pageWidth);
    doc.text(skillLines, margin, yPos);
    yPos += skillLines.length * 5 + 5;
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('WORK EXPERIENCE', margin, yPos);
    yPos += 7;
    
    data.experience.forEach((exp) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(exp.title || '', margin, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const companyText = [exp.company, exp.location].filter(Boolean).join(' | ');
      if (companyText) {
        doc.text(companyText, margin, yPos);
        yPos += 5;
      }
      
      const startDate = exp.start || exp.start_date;
      const endDate = exp.end || exp.end_date;
      if (startDate) {
        doc.setFont('helvetica', 'normal');
        doc.text(`${startDate} - ${endDate || 'Present'}`, margin, yPos);
        yPos += 5;
      }
      
      // Handle different description formats
      const bullets = exp.bullets || (Array.isArray(exp.description) ? exp.description : []) || exp.achievements || [];
      if (bullets.length > 0) {
        doc.setFont('helvetica', 'normal');
        bullets.forEach((desc: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const descLines = doc.splitTextToSize(`• ${desc}`, pageWidth - 5);
          doc.text(descLines, margin + 5, yPos);
          yPos += descLines.length * 5;
        });
      } else if (typeof exp.description === 'string' && exp.description) {
        const descLines = doc.splitTextToSize(exp.description, pageWidth - 5);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 5;
      }
      
      yPos += 5;
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EDUCATION', margin, yPos);
    yPos += 7;
    
    data.education.forEach((edu: any) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(edu.degree || '', margin, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (edu.field) {
        doc.text(edu.field, margin, yPos);
        yPos += 5;
      }
      
      const eduLocation = [edu.institution, edu.location].filter(Boolean).join(' | ');
      if (eduLocation) {
        doc.text(eduLocation, margin, yPos);
        yPos += 5;
      }
      
      const gradDate = edu.graduation_date || edu.graduationDate;
      if (gradDate) {
        doc.text(gradDate, margin, yPos);
        yPos += 5;
      }
      
      if (edu.gpa) {
        doc.text(`GPA: ${edu.gpa}`, margin, yPos);
        yPos += 5;
      }
      
      yPos += 3;
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECTS', margin, yPos);
    yPos += 7;
    
    data.projects.forEach((project) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(project.name || '', margin, yPos);
      yPos += 6;
      
      if (project.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const projLines = doc.splitTextToSize(project.description, pageWidth);
        doc.text(projLines, margin, yPos);
        yPos += projLines.length * 5;
      }
      
      if (project.technologies && project.technologies.length > 0) {
        doc.text(`Technologies: ${project.technologies.join(', ')}`, margin, yPos);
        yPos += 5;
      }
      
      yPos += 3;
    });
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATIONS', margin, yPos);
    yPos += 7;
    
    data.certifications.forEach((cert: any) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${cert.name || ''} - ${cert.issuer || ''} | ${cert.date || ''}`, margin, yPos);
      yPos += 5;
    });
  }
}

function generateCoverLetterPDF(doc: any, coverLetter: string, name: string) {
  let yPos = 20;
  const margin = 20;
  const pageWidth = 170;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Add date
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(date, margin, yPos);
  yPos += 15;
  
  // Add content
  const paragraphs = coverLetter.split('\n\n');
  paragraphs.forEach((paragraph) => {
    if (paragraph.trim()) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      const lines = doc.splitTextToSize(paragraph.trim(), pageWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 7 + 5;
    }
  });
}
