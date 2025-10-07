import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeId, jobDescription } = await req.json();
    
    if (!resumeId || !jobDescription) {
      throw new Error('Resume ID and job description are required');
    }

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error('No user found in token');
      throw new Error('User not authenticated');
    }
    
    console.log('Authenticated user:', user.id);

    // Fetch the resume data
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (resumeError || !resume) {
      throw new Error('Resume not found');
    }

    // Store the job description
    const { data: jobDescRecord, error: jobDescError } = await supabaseClient
      .from('job_descriptions')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        description: jobDescription,
      })
      .select()
      .single();

    if (jobDescError) {
      console.error('Job description insert error:', jobDescError);
      throw new Error('Failed to save job description');
    }

    // Use Lovable AI to tailor the resume
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    console.log('Starting AI tailoring process...');

    const systemPrompt = `You are an expert resume optimizer. Given a candidate's resume and a job description. Tweak the resume to match the job description:

CRITICAL RULES:
1. NEVER add new skills, experiences, or qualifications not in the original resume
2. ONLY work with existing data - reorder, emphasize, and highlight what's already there
3. Match existing skills to job requirements and assign relevance scores
4. Keep original confidence scores AND categories for all skills
5. PRESERVE ALL EDUCATION AND CERTIFICATIONS EXACTLY AS PROVIDED - DO NOT MODIFY OR OMIT THEM

YOUR TASK:
1. Analyze job description to extract required skills, qualifications, and keywords
2. For each skill in the resume:
   - Calculate relevance score (0.0-1.0) based on how well it matches job requirements
   - Keep the original confidence score unchanged
   - PRESERVE the original category field
   - Add a "relevance" field to each skill
3. Reorder skills: Most relevant to job (high relevance * confidence) first
4. For each experience entry:
   - Reorder bullet points to put most relevant achievements first based on job requirements
   - Calculate overall relevance score for the experience (0.0-1.0)
   - Add "relevance" field to each experience
6. For each project:
   - Calculate relevance score (0.0-1.0) based on job requirements
   - Add "relevance" field
7. Reorder projects: Most relevant to job requirements first
8. Rewrite summary to emphasize skills and experience that match the job description
9. CRITICAL: PRESERVE ALL EDUCATION ENTRIES EXACTLY AS PROVIDED - COPY THEM VERBATIM
10. CRITICAL: PRESERVE ALL CERTIFICATIONS EXACTLY AS PROVIDED - COPY THEM VERBATIM
11. Track specific changes made for display to the user

MANDATORY: Education and Certifications sections MUST be included in the output with ALL original entries. Do not skip, modify, or omit any education or certification entries.`;

    const userPrompt = `Resume Data:
${JSON.stringify(resume.parsed_data, null, 2)}

Job Description:
${jobDescription}

Please tailor this resume to match the job description. Reorder experiences to put most relevant ones first, emphasize matching skills, and create a compelling summary.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "tailor_resume",
              description: "Return resume data with only skills reordered by relevance and relevance scores added",
              parameters: {
                type: "object",
                properties: {
                  tailored_data: {
                    type: "object",
                    description: "Resume data with skills/experience/projects reordered by relevance. Each skill must have 'relevance' field (0.0-1.0). Each experience must have 'relevance' field. Each project must have 'relevance' field. Summary should be rewritten.",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      location: { type: "string" },
                      linkedin: { type: "string" },
                      summary: { type: "string", description: "Rewritten summary emphasizing relevant skills" },
                      skills: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            skill: { type: "string" },
                            confidence: { type: "number" },
                            category: { type: "string", description: "MUST preserve original category like 'Programming Languages', 'Frameworks & Libraries', etc." },
                            relevance: { type: "number", description: "0.0-1.0 score of relevance to job" }
                          },
                          required: ["skill", "confidence", "category", "relevance"]
                        },
                        description: "Skills reordered by (relevance * confidence). MUST preserve category field from original."
                      },
                      experience: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            company: { type: "string" },
                            location: { type: "string" },
                            start_date: { type: "string" },
                            end_date: { type: "string" },
                            description: {
                              type: "array",
                              items: { type: "string" },
                              description: "Bullet points reordered by relevance"
                            },
                            relevance: { type: "number", description: "0.0-1.0 overall relevance score" }
                          },
                          required: ["title", "company", "description", "relevance"]
                        },
                        description: "Experiences reordered by relevance and recency"
                      },
                      education: { 
                        type: "array",
                        description: "MUST preserve ALL education entries exactly as provided in original resume. If original has education entries, they MUST be included in the output verbatim."
                      },
                      projects: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            technologies: { type: "array", items: { type: "string" } },
                            relevance: { type: "number", description: "0.0-1.0 relevance score" }
                          }
                        },
                        description: "Projects reordered by relevance"
                      },
                      certifications: { 
                        type: "array",
                        description: "MUST preserve ALL certifications exactly as provided in original resume. If original has certification entries, they MUST be included in the output verbatim."
                      }
                    }
                  },
                  changes_summary: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific changes made (e.g., 'Reordered 12 skills to highlight Python and React', 'Moved Project X to top position')"
                  },
                  skill_matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        relevance: { type: "number" },
                        reason: { type: "string", description: "Why this skill matches the job" }
                      },
                      required: ["skill", "relevance", "reason"]
                    },
                    description: "Top 5-10 most relevant skills with explanations"
                  }
                },
                required: ["tailored_data", "changes_summary", "skill_matches"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "tailor_resume" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status} - ${errorText}`);
    }

    console.log('AI response received successfully');

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices[0].message.tool_calls?.[0];
    const tailoredResult = JSON.parse(toolCall.function.arguments);

    // Generate cover letter using AI
    const coverLetterPrompt = `Write a professional cover letter for this candidate applying to this job.

CANDIDATE INFORMATION:
Name: ${resume.parsed_data.name}
Email: ${resume.parsed_data.email || ''}
Phone: ${resume.parsed_data.phone || ''}
Location: ${resume.parsed_data.location || ''}

CANDIDATE'S BACKGROUND:
Summary: ${resume.parsed_data.summary}
Key Skills: ${resume.parsed_data.skills?.slice(0, 10).map((s: any) => s.skill).join(', ')}
Recent Experience: ${resume.parsed_data.experience?.[0]?.title} at ${resume.parsed_data.experience?.[0]?.company}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Write 400-500 words
2. Start with: "Dear [Company Name from job description] Recruitment Team,"
3. Write 3-4 body paragraphs highlighting relevant qualifications
4. End with: "Sincerely," followed by the candidate's name: ${resume.parsed_data.name}
5. CRITICAL: Do NOT use ANY placeholders like [Your Name], [Your Address], [Date], [Your Phone Number], [Your Email], etc.
6. Do NOT include addresses, phone numbers, emails, or dates anywhere in the letter
7. Use ONLY the actual candidate name provided: ${resume.parsed_data.name}
8. Extract the company name from the job description and use it in the greeting
9. Make it personal and specific to this job and candidate`;

    const coverLetterResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional cover letter writer. Write compelling, personalized cover letters. Follow the exact formatting instructions provided - do not include placeholder text, addresses, or dates. Use only the candidate\'s actual name as provided.' 
          },
          { role: 'user', content: coverLetterPrompt }
        ],
      }),
    });

    const coverLetterResult = await coverLetterResponse.json();
    const coverLetter = coverLetterResult.choices[0].message.content;

    console.log('Storing tailored resume in database...');

    // Store the tailored resume
    const { data: tailoredResume, error: tailoredError } = await supabaseClient
      .from('tailored_resumes')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        job_description_id: jobDescRecord.id,
        tailored_data: tailoredResult.tailored_data,
        cover_letter: coverLetter,
        changes_summary: tailoredResult.changes_summary,
        skill_matches: tailoredResult.skill_matches,
      })
      .select()
      .single();

    if (tailoredError) {
      console.error('Tailored resume insert error:', tailoredError);
      throw new Error('Failed to save tailored resume');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tailored_resume_id: tailoredResume.id,
        tailored_data: tailoredResult.tailored_data,
        changes_summary: tailoredResult.changes_summary,
        skill_matches: tailoredResult.skill_matches,
        cover_letter: coverLetter,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in tailor-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
