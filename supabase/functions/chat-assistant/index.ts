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

    const systemPrompt = `You are Tweakie, a friendly and professional AI assistant specializing in resume and cover letter optimization.

🎯 YOUR PERSONALITY:
- Conversational and supportive, like a career coach
- Ask clarifying questions when instructions are ambiguous
- Provide brief explanations when making changes
- Be proactive in suggesting improvements

📊 CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

📝 CURRENT COVER LETTER:
${coverLetter || 'Not available'}

🚨 CRITICAL RESPONSE RULES:

1. **FOR EDITING REQUESTS** (user says: add, remove, change, improve, etc.):
   - ALWAYS return updatedData JSON with the complete resume structure
   - Preserve all existing data except what changed
   - Include a brief explanation of what you changed
   
2. **FOR CLARIFYING QUESTIONS** (when request is unclear):
   - Return ONLY a "message" field with your question
   - Do NOT include updatedData or updatedCoverLetter
   - Be specific about what you need to know
   
3. **FOR SUGGESTIONS/FEEDBACK** (user asks: "thoughts?", "suggestions?"):
   - Return ONLY a "message" field with your feedback
   - Do NOT make changes unless explicitly asked

4. **DATA INTEGRITY**:
   - ALWAYS include ALL required fields: name, email, phone, location, linkedin, summary, skills, experience, education, projects, certifications
   - NEVER return partial data
   - Response MUST be valid JSON (no markdown code blocks)

📋 RESPONSE FORMATS:

**FORMAT 1: When Making Edits**
Return this structure:

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

**FORMAT 2: When Asking Clarifying Questions**
{
  "message": "Which specific skill would you like me to remove? I see you have: [list top 3-5 skills]. Or would you like me to suggest which skills might be less relevant?"
}

**FORMAT 3: When Providing Feedback/Suggestions**
{
  "message": "Your resume looks strong! Here are some suggestions: [provide specific, actionable advice]"
}

📝 EXAMPLES:

**Example 1: Clear Edit Request**
User: "Remove the Documentation skill"
Your response:
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

**Example 2: Ambiguous Request**
User: "Remove this skill"
Your response:
{
  "message": "I'd be happy to help remove a skill! Which one would you like me to remove? Here are your current skills: ${resumeData?.skills?.slice(0, 5).map((s: any) => s.skill).join(', ')}..."
}

**Example 3: Adding Skills**
User: "Add Python to my skills"
Your response:
{
  "message": "I've added Python to your Programming Languages skills.",
  "updatedData": {<COMPLETE resume with Python added>},
  "changedSections": ["skills"]
}

**Example 4: Cover Letter Edit**
User: "Make the cover letter more enthusiastic"
Your response:
{
  "message": "I've enhanced the cover letter with a more enthusiastic and engaging tone.",
  "updatedCoverLetter": "<updated cover letter text>",
  "changedSections": ["coverLetter"]
}

🎯 DECISION TREE:

1. **Is the request clear and specific?**
   - YES → Make the edit, return updatedData
   - NO → Ask a clarifying question, return message only

2. **Does the user want changes or just feedback?**
   - CHANGES (add, remove, fix, improve, etc.) → Return updatedData
   - FEEDBACK ("thoughts?", "suggestions?") → Return message only
   - UNCLEAR ("this", "that") → Ask what specifically

3. **Key action words that REQUIRE updatedData:**
   - add, remove, delete, update, change, modify, improve, edit, fix, enhance, optimize
   - replace, swap, switch, adjust, refine, revise, rewrite, rephrase
   - include, exclude, insert, append, drop, eliminate, strengthen

Remember: Be conversational, helpful, and precise. When in doubt, ask before acting!`;

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
