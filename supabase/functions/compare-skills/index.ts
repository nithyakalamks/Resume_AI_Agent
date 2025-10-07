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
    const { resumeData, jobDescription } = await req.json();
    
    if (!resumeData || !jobDescription) {
      throw new Error('Resume data and job description are required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    console.log('Starting skill comparison...');

    const systemPrompt = `You are an expert at analyzing job descriptions and resumes to identify skill gaps.
Your task is to:
1. Extract all required skills from the job description
2. Extract all skills from the candidate's resume
3. Identify which required skills are missing from the resume
4. Normalize skill names for accurate comparison (e.g., "React.js" and "React" are the same)`;

    const userPrompt = `Job Description:
${jobDescription}

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please analyze and compare the skills.`;

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
              name: "compare_skills",
              description: "Compare job requirements with resume skills",
              parameters: {
                type: "object",
                properties: {
                  job_skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        importance: { 
                          type: "string", 
                          enum: ["required", "preferred", "nice-to-have"],
                          description: "How critical this skill is for the job"
                        }
                      },
                      required: ["skill", "importance"]
                    },
                    description: "All skills mentioned in the job description"
                  },
                  resume_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "All skills found in the candidate's resume"
                  },
                  missing_skills: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        skill: { type: "string" },
                        importance: { 
                          type: "string", 
                          enum: ["required", "preferred", "nice-to-have"]
                        },
                        related_skills: {
                          type: "array",
                          items: { type: "string" },
                          description: "Skills from resume that are similar or related"
                        }
                      },
                      required: ["skill", "importance"]
                    },
                    description: "Skills required by job but not found in resume"
                  },
                  matching_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Skills that appear in both job description and resume"
                  }
                },
                required: ["job_skills", "resume_skills", "missing_skills", "matching_skills"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "compare_skills" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices[0].message.tool_calls?.[0];
    const comparisonResult = JSON.parse(toolCall.function.arguments);

    console.log('Skill comparison completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        ...comparisonResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in compare-skills function:', error);
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
