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
    const { resumeId, companyName, roleName, jobDescription, addedSkills = [] } = await req.json();
    
    if (!resumeId || !companyName || !roleName || !jobDescription) {
      throw new Error('Resume ID, company name, role name, and job description are required');
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
        company_name: companyName,
        role_name: roleName,
      })
      .select()
      .single();

    if (jobDescError) {
      console.error('Job description insert error:', jobDescError);
      throw new Error('Failed to save job description');
    }

    // Use Lovable AI to tweak the resume
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    console.log('Starting AI tweaking process...');

    const systemPrompt = `You are an expert resume optimizer. Given a candidate's resume and a job description, make MINOR STRATEGIC TWEAKS to align the resume with the job.

CRITICAL RULES - WHAT YOU CAN DO:
1. REORDER skills, projects, and experience bullets to highlight relevance
2. REMOVE skills that have zero relevance to the job description
3. RECATEGORIZE skills into more relevant categories if needed
4. ENHANCE the language of project descriptions and experience bullets to better highlight relevant skills and achievements
5. REWRITE the summary to emphasize matching qualifications
6. PRESERVE ALL EDUCATION AND CERTIFICATIONS EXACTLY AS PROVIDED

CRITICAL RULES - WHAT YOU CANNOT DO:
1. NEVER add new skills, experiences, projects, or qualifications
2. NEVER add new bullet points to experiences
3. NEVER add new projects
4. NEVER modify education or certifications
5. NEVER change dates, company names, job titles, or degree names
6. NEVER invent achievements or responsibilities

YOUR TASK:
1. Analyze job description to extract required skills, qualifications, and keywords
2. For each skill in the resume:
   - Calculate relevance score (0.0-1.0) based on job requirements
   - Keep original confidence score unchanged
   - Recategorize if it better highlights relevance (e.g., move "Python" from "Languages" to "Data Science Tools" if applying for data role)
   - REMOVE skills with relevance < 0.3 (too irrelevant)
   - Add "relevance" field to each kept skill
3. Reorder skills: Most relevant (high relevance * confidence) first
4. For each experience entry:
   - ENHANCE bullet point language to highlight relevant skills (keep same meaning and facts)
   - Reorder bullets to put most relevant first
   - Calculate overall relevance score (0.0-1.0)
   - Add "relevance" field
5. For each project:
   - ENHANCE description to highlight relevant technologies and achievements
   - Calculate relevance score (0.0-1.0)
   - Add "relevance" field
6. Reorder projects: Most relevant first
7. Rewrite summary to emphasize matching skills and experience
8. PRESERVE ALL EDUCATION ENTRIES EXACTLY - COPY VERBATIM
9. PRESERVE ALL CERTIFICATIONS EXACTLY - COPY VERBATIM
10. Track specific changes for user visibility

ENHANCEMENT GUIDELINES:
- Use stronger action verbs when relevant
- Quantify achievements where possible (keep existing numbers)
- Emphasize technologies and skills mentioned in job description
- Keep the same facts and accomplishments - just present them better

MANDATORY: Education and Certifications MUST be included unchanged. All modifications must be minor improvements to presentation, not fabrication.`;

    const userPrompt = `Resume Data:
${JSON.stringify(resume.parsed_data, null, 2)}

Job Description:
${jobDescription}

${addedSkills.length > 0 ? `\nADDITIONAL SKILLS TO INCLUDE:
The user has indicated they have these skills that should be added to the resume:
${addedSkills.join(', ')}

IMPORTANT: Add these skills to the appropriate categories in the skills section with:
- confidence: 0.85 (indicating user-verified but not explicitly mentioned in original resume)
- relevance: 0.9 (since they're relevant to the job)
- category: Choose the most appropriate category based on the skill type\n` : ''}

CRITICAL REMINDER:
- You MUST include ALL education entries from the resume data above in your response
- You MUST include ALL certifications from the resume data above in your response
- Copy these sections EXACTLY as they appear in the resume data
- If education or certifications arrays are present in the resume, they MUST NOT be empty in your output
${addedSkills.length > 0 ? '- ADD the additional skills listed above to the appropriate skill categories\n' : ''}
Please tweak this resume to match the job description while preserving education and certifications exactly as shown above.`;

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
              name: "tweak_resume",
              description: "Return resume data with only skills reordered by relevance and relevance scores added",
              parameters: {
                type: "object",
                properties: {
                  tweaked_data: {
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
                        items: {
                          type: "object",
                          properties: {
                            degree: { type: "string" },
                            institution: { type: "string" },
                            location: { type: "string" },
                            start_date: { type: "string" },
                            end_date: { type: "string" },
                            gpa: { type: "string" }
                          }
                        },
                        description: "REQUIRED: MUST preserve ALL education entries exactly as provided in original resume. Copy every field verbatim. NEVER return empty array if original has education."
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
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            issuer: { type: "string" },
                            date: { type: "string" },
                            url: { type: "string" }
                          }
                        },
                        description: "REQUIRED: MUST preserve ALL certifications exactly as provided in original resume. Copy every field verbatim. NEVER return empty array if original has certifications."
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
                required: ["tweaked_data", "changes_summary", "skill_matches"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "tweak_resume" } }
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
    const tweakedResult = JSON.parse(toolCall.function.arguments);

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

    console.log('Storing tweaked resume in database...');

    // Store the tweaked resume with added skills metadata
    const { data: tweakedResume, error: tweakedError } = await supabaseClient
      .from('tweaked_resumes')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        job_description_id: jobDescRecord.id,
        tweaked_data: {
          ...tweakedResult.tweaked_data,
          added_skills: addedSkills, // Store which skills were manually added
        },
        cover_letter: coverLetter,
        changes_summary: [
          ...tweakedResult.changes_summary,
          ...(addedSkills.length > 0 ? [`Added ${addedSkills.length} user-verified skill${addedSkills.length > 1 ? 's' : ''}: ${addedSkills.join(', ')}`] : [])
        ],
        skill_matches: tweakedResult.skill_matches,
      })
      .select()
      .single();

    if (tweakedError) {
      console.error('Tweaked resume insert error:', tweakedError);
      throw new Error('Failed to save tweaked resume');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tweaked_resume_id: tweakedResume.id,
        tweaked_data: tweakedResult.tweaked_data,
        changes_summary: tweakedResult.changes_summary,
        skill_matches: tweakedResult.skill_matches,
        cover_letter: coverLetter,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in tweak-resume function:', error);
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
