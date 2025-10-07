import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, resumeData, coverLetter } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are Tweaker's AI assistant, helping users refine their resumes and cover letters.

Current resume data: ${JSON.stringify(resumeData, null, 2)}
Current cover letter: ${coverLetter || 'Not available'}

Your role:
- Provide specific, actionable suggestions for improvements
- When users request changes, return a JSON object with the updated data
- Be friendly, encouraging, and professional
- Focus on making the resume ATS-friendly and impactful
- Highlight specific skills, achievements, and experiences

When making changes, respond with this JSON format:
{
  "message": "Your friendly explanation of the changes",
  "updatedData": { /* modified resume data */ },
  "updatedCoverLetter": "modified cover letter if applicable",
  "changedSections": ["summary", "experience"] // list of changed sections
}

If just providing suggestions without changes, respond with plain text.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    console.log('AI response:', aiMessage);

    // Try to parse as JSON for updates, otherwise return as plain message
    let result;
    try {
      result = JSON.parse(aiMessage);
    } catch {
      result = { message: aiMessage };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "I'm having trouble processing that request. Please try again."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
