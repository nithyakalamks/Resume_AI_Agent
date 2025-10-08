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

    const systemPrompt = `You are Tweakie, an AI assistant helping users refine their resumes and cover letters.

Current resume data: ${JSON.stringify(resumeData, null, 2)}
Current cover letter: ${coverLetter || 'Not available'}

🚨 MANDATORY RULES - FAILURE TO FOLLOW WILL BREAK THE APPLICATION:

1. **MANDATORY**: When a user asks you to make ANY change (add, remove, modify, update, improve, delete, etc.), you MUST ALWAYS return a complete JSON response with the ENTIRE updated resume data
2. **NEVER** respond with plain text like "I've made the change" without the JSON structure
3. **ALWAYS** return the COMPLETE resume object with ALL fields (name, email, phone, location, linkedin, summary, skills, experience, education, projects, certifications)
4. **ALWAYS** preserve all existing data that wasn't changed
5. **MANDATORY**: The response MUST be valid JSON, not markdown with code blocks

⚠️ WARNING: If you don't return updatedData for modification requests, the user's changes will NOT be applied and the application will fail!

📋 RESPONSE FORMAT RULES:

**For ANY modification request** (user says: add, remove, delete, update, change, modify, improve, edit, fix, etc.):
YOU MUST RETURN THIS EXACT STRUCTURE:

{
  "message": "Brief confirmation of what you changed",
  "updatedData": {
    "name": "${resumeData?.name || 'Full Name'}",
    "email": "${resumeData?.email || 'email@example.com'}",
    "phone": "${resumeData?.phone || 'phone'}",
    "location": "${resumeData?.location || 'location'}",
    "linkedin": "${resumeData?.linkedin || ''}",
    "summary": "${resumeData?.summary || 'professional summary'}",
    "skills": [{"skill": "Skill Name", "category": "Category", "confidence": 0.9, "relevance": 0.9}],
    "experience": [...all experience entries...],
    "education": [...all education entries...],
    "projects": [...all projects...],
    "certifications": [...all certifications...]
  },
  "changedSections": ["skills"]
}

**For suggestions/questions only** (user asks: "what do you think?", "any suggestions?", "how does it look?"):
{
  "message": "Your feedback and suggestions here"
}

📝 CONCRETE EXAMPLES:

User: "Remove the Documentation skill"
YOU MUST RESPOND WITH:
{
  "message": "I've removed 'Documentation' from your skills.",
  "updatedData": {
    "name": "${resumeData?.name}",
    "email": "${resumeData?.email}",
    "phone": "${resumeData?.phone}",
    "location": "${resumeData?.location}",
    "linkedin": "${resumeData?.linkedin}",
    "summary": "${resumeData?.summary}",
    "skills": [<all skills EXCEPT Documentation, with proper structure: {"skill": "...", "category": "...", "confidence": 0.9, "relevance": 0.9}>],
    "experience": ${JSON.stringify(resumeData?.experience || [])},
    "education": ${JSON.stringify(resumeData?.education || [])},
    "projects": ${JSON.stringify(resumeData?.projects || [])},
    "certifications": ${JSON.stringify(resumeData?.certifications || [])}
  },
  "changedSections": ["skills"]
}

User: "Add Python to my skills"
YOU MUST RESPOND WITH:
{
  "message": "I've added Python to your Programming Languages.",
  "updatedData": {<COMPLETE resume with Python added to skills array>},
  "changedSections": ["skills"]
}

🎯 KEY DETECTION WORDS - IF USER MESSAGE CONTAINS ANY OF THESE, YOU MUST RETURN updatedData:
- add, remove, delete, update, change, modify, improve, edit, fix, enhance, optimize
- replace, swap, switch, adjust, refine, revise, rewrite, rephrase
- include, exclude, insert, append, drop, eliminate

🔍 IMPORTANT: 
- Always check if the user is asking you to DO something vs just discussing
- If in doubt whether to return updatedData, ASK the user first
- NEVER return plain text for modification requests`;

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

    // Detect if this was a modification request
    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const modificationKeywords = [
      'add', 'remove', 'delete', 'update', 'change', 'modify', 'improve', 
      'edit', 'fix', 'enhance', 'optimize', 'replace', 'swap', 'switch', 
      'adjust', 'refine', 'revise', 'rewrite', 'rephrase', 'include', 
      'exclude', 'insert', 'append', 'drop', 'eliminate'
    ];
    const isModificationRequest = modificationKeywords.some(keyword => userMessage.includes(keyword));

    // Try to parse as JSON for updates, otherwise return as plain message
    let result;
    try {
      // First try to parse the message directly
      result = JSON.parse(aiMessage);
      console.log('✅ Parsed as direct JSON');
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      try {
        const jsonMatch = aiMessage.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          console.log('✅ Found JSON in markdown code block');
          result = JSON.parse(jsonMatch[1]);
        } else {
          console.log('⚠️ No JSON found in markdown, treating as plain message');
          result = { message: aiMessage };
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON from markdown:', parseError);
        result = { message: aiMessage };
      }
    }

    // Validation: Check if AI should have returned updatedData but didn't
    if (isModificationRequest && !result.updatedData) {
      console.error('🚨 CRITICAL: AI failed to return updatedData for modification request!');
      console.error('User message:', userMessage);
      console.error('AI response:', aiMessage);
      console.warn('⚠️ The AI model did not follow instructions. This will prevent UI updates.');
      
      // Return an error response to inform the frontend
      return new Response(JSON.stringify({
        error: 'The AI assistant did not return the expected data format. Please try rephrasing your request or try again.',
        message: result.message || aiMessage,
        debugInfo: 'AI_RESPONSE_FORMAT_ERROR'
      }), {
        status: 200, // Don't fail the request, just inform the frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Merge updatedData with original resumeData to ensure all required fields are present
    if (result.updatedData && resumeData) {
      console.log('🔄 Merging updated data with original resume data');
      
      // Handle skills: ensure they maintain proper structure with category, confidence, relevance
      let mergedSkills = result.updatedData.skills || resumeData.skills || [];
      if (mergedSkills.length > 0) {
        // Check if skills are simple strings and convert to proper structure
        if (typeof mergedSkills[0] === 'string') {
          console.log('⚠️ Skills are strings, converting to proper structure');
          mergedSkills = mergedSkills.map((skillName: string) => {
            // Try to find the skill in original resume data to preserve metadata
            const originalSkill = resumeData.skills?.find((s: any) => s.skill === skillName);
            return originalSkill || {
              skill: skillName,
              category: 'General',
              confidence: 0.8,
              relevance: 0.8
            };
          });
        }
        console.log('✅ Skills structure validated:', {
          count: mergedSkills.length,
          firstSkill: mergedSkills[0],
          hasCategory: !!mergedSkills[0]?.category
        });
      }
      
      result.updatedData = {
        ...resumeData,
        ...result.updatedData,
        // Ensure nested arrays are properly merged with validated structure
        skills: mergedSkills,
        experience: result.updatedData.experience || resumeData.experience || [],
        education: result.updatedData.education || resumeData.education || [],
        projects: result.updatedData.projects || resumeData.projects || [],
        certifications: result.updatedData.certifications || resumeData.certifications || [],
      };
      console.log('✅ Merged data structure:', {
        hasName: !!result.updatedData.name,
        hasEmail: !!result.updatedData.email,
        skillsCount: result.updatedData.skills?.length || 0,
        experienceCount: result.updatedData.experience?.length || 0,
        firstSkillStructure: result.updatedData.skills?.[0]
      });
    }

    console.log('📤 Final result being sent to frontend:', {
      hasUpdatedData: !!result.updatedData,
      hasUpdatedCoverLetter: !!result.updatedCoverLetter,
      hasChangedSections: !!result.changedSections,
      resultKeys: Object.keys(result),
      updatedDataKeys: result.updatedData ? Object.keys(result.updatedData) : []
    });

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
