import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeData {
  header?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  skills?: Array<{ name: string; relevance?: number }>;
  experience?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
    relevance?: number;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    link?: string;
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
  
  // Header
  if (data.header) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(data.header.name || '', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contactInfo = [data.header.email, data.header.phone, data.header.location].filter(Boolean).join(' | ');
    doc.text(contactInfo, margin, yPos);
    yPos += 5;
    
    const links = [data.header.linkedin, data.header.github].filter(Boolean).join(' | ');
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
    const skillText = data.skills.map((s) => s.name).join(' • ');
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
      doc.text(`${exp.company || ''} | ${exp.location || ''}`, margin, yPos);
      yPos += 5;
      
      if (exp.startDate) {
        doc.setFont('helvetica', 'normal');
        doc.text(`${exp.startDate} - ${exp.endDate || 'Present'}`, margin, yPos);
        yPos += 5;
      }
      
      if (exp.achievements && exp.achievements.length > 0) {
        doc.setFont('helvetica', 'normal');
        exp.achievements.forEach((desc: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          const descLines = doc.splitTextToSize(`• ${desc}`, pageWidth - 5);
          doc.text(descLines, margin + 5, yPos);
          yPos += descLines.length * 5;
        });
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
      doc.text(`${edu.institution || ''} | ${edu.location || ''}`, margin, yPos);
      yPos += 5;
      
      if (edu.graduationDate) {
        doc.text(edu.graduationDate, margin, yPos);
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
