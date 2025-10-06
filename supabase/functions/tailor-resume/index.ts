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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

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
      throw new Error('AI service not configured');
    }

    const systemPrompt = `You are an expert resume tailor. Given a resume and a job description, you need to:
1. Analyze the job requirements and identify key skills, qualifications, and experience needed
2. Match the candidate's experience and skills to the job requirements
3. Reorder and emphasize relevant experience, skills, and achievements
4. Generate a tailored professional summary that highlights relevant qualifications
5. Return a modified version of the resume data that emphasizes relevant information

Return your response as a JSON object with the same structure as the input resume data, but with reordered and emphasized content.`;

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
              description: "Return tailored resume data with reordered and emphasized content",
              parameters: {
                type: "object",
                properties: {
                  tailored_data: {
                    type: "object",
                    description: "The tailored resume data with same structure as input"
                  },
                  changes_summary: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of key changes made to tailor the resume"
                  }
                },
                required: ["tailored_data", "changes_summary"]
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
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices[0].message.tool_calls?.[0];
    const tailoredResult = JSON.parse(toolCall.function.arguments);

    // Generate cover letter using AI
    const coverLetterPrompt = `Based on the following resume and job description, write a professional cover letter (3-4 paragraphs) that:
1. Opens with enthusiasm for the specific role
2. Highlights 2-3 most relevant qualifications and experiences
3. Explains why the candidate is a great fit
4. Closes with a call to action

Resume Summary: ${resume.parsed_data.summary}
Key Skills: ${resume.parsed_data.skills.map((s: any) => s.skill).join(', ')}
Recent Experience: ${resume.parsed_data.experience[0]?.title} at ${resume.parsed_data.experience[0]?.company}

Job Description:
${jobDescription}`;

    const coverLetterResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional cover letter writer. Write compelling, personalized cover letters.' },
          { role: 'user', content: coverLetterPrompt }
        ],
      }),
    });

    const coverLetterResult = await coverLetterResponse.json();
    const coverLetter = coverLetterResult.choices[0].message.content;

    // Store the tailored resume
    const { data: tailoredResume, error: tailoredError } = await supabaseClient
      .from('tailored_resumes')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        job_description_id: jobDescRecord.id,
        tailored_data: tailoredResult.tailored_data,
        cover_letter: coverLetter,
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
