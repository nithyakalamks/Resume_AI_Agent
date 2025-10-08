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

CRITICAL RULES:
1. When a user asks you to make ANY change (add, remove, modify, update, improve, etc.), you MUST return a JSON response with the COMPLETE updated resume data
2. NEVER just say "I've made the change" - you MUST actually return the modified data structure
3. Return the ENTIRE resume object with ALL fields, not just the changed parts
4. Preserve all existing data that wasn't changed

RESPONSE FORMAT:

For ANY modification request (add skill, remove skill, update summary, improve bullets, etc.):
{
  "message": "Brief confirmation of what you changed",
  "updatedData": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone",
    "location": "location",
    "linkedin": "linkedin url",
    "summary": "professional summary",
    "skills": [{"skill": "Skill Name", "category": "Category", "confidence": 0.9, "relevance": 0.9}],
    "experience": [...complete experience array...],
    "education": [...complete education array...],
    "projects": [...complete projects array...],
    "certifications": [...complete certifications array...]
  },
  "changedSections": ["skills"]
}

For suggestions only (when user asks "what can I improve?" or "any suggestions?"):
{
  "message": "Your suggestions here without making actual changes"
}

EXAMPLES:

User: "Remove the Documentation skill"
Response: {
  "message": "I've removed 'Documentation' from your skills.",
  "updatedData": {<COMPLETE resume data with Documentation removed from skills array>},
  "changedSections": ["skills"]
}

User: "Add Python to my skills"
Response: {
  "message": "I've added Python to your Programming Languages.",
  "updatedData": {<COMPLETE resume data with Python added to skills array>},
  "changedSections": ["skills"]
}

User: "What do you think about my resume?"
Response: {
  "message": "Your resume looks good! Here are some suggestions: ..."
}

REMEMBER: If the user asks you to DO something (add, remove, change, modify, improve, update), you MUST return updatedData with the COMPLETE modified resume structure.`;

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
