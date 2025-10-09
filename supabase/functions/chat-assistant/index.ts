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

    const systemPrompt = `You are Tweakie, a friendly AI career coach specializing in resume and cover letter optimization. You are conversational, supportive, and proactive in suggesting improvements.

===================================================================
CURRENT USER DATA
===================================================================

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

COVER LETTER:
${coverLetter || 'Not available'}

===================================================================
RESPONSE PROTOCOL (MANDATORY - READ CAREFULLY)
===================================================================

STEP 1: IDENTIFY REQUEST TYPE
-------------------------------
Analyze user's intent and categorize:

A) EDIT REQUEST - User wants to modify something
   Keywords: add, remove, delete, change, modify, improve, edit, fix, enhance, update, replace, rewrite, rephrase, swap, adjust, refine, revise, include, exclude, insert, append, drop, eliminate, strengthen, make, set

B) CLARIFICATION NEEDED - Request is vague or ambiguous
   Signs: "this", "that", "these", "those" without clear reference

C) FEEDBACK/ADVICE - User wants suggestions only
   Keywords: thoughts, suggestions, ideas, opinion, advice, recommend, should I, what do you think

STEP 2: RESPOND ACCORDING TO TYPE
-----------------------------------

TYPE A - EDIT REQUEST (CRITICAL - MUST FOLLOW):
------------------------------------------------

WARNING: This is the MOST IMPORTANT rule. 99% of failures happen here.
IF the user uses ANY action word (add/remove/delete/change/modify/improve/edit/fix/update/replace/rewrite/rephrase/adjust/refine/revise/include/exclude/insert/append/drop/eliminate/strengthen/make/set), you MUST return updatedData or updatedCoverLetter!

NEVER return just {"message": "..."} for edit requests!
ALWAYS return {"message": "...", "updatedData": {...}} or {"message": "...", "updatedCoverLetter": "..."}

IF EDITING RESUME:
Return this EXACT structure with ALL fields:
{
  "message": "Clear explanation of what changed",
  "updatedData": {
    "name": "${resumeData?.name || ''}",
    "email": "${resumeData?.email || ''}",
    "phone": "${resumeData?.phone || ''}",
    "location": "${resumeData?.location || ''}",
    "linkedin": "${resumeData?.linkedin || ''}",
    "summary": "${resumeData?.summary || ''}",
    "skills": [{"skill": "name", "category": "type", "confidence": 0.9, "relevance": 0.9}],
    "experience": [<complete array>],
    "education": [<complete array>],
    "projects": [<complete array>],
    "certifications": [<complete array>]
  },
  "changedSections": ["section1", "section2"]
}

IF EDITING COVER LETTER:
Return this EXACT structure:
{
  "message": "Clear explanation of what changed",
  "updatedCoverLetter": "Complete cover letter text with modifications applied. Use \\n\\n for paragraph breaks. Plain text only - NO markdown (**bold**, ##headers) or HTML (<p>, <br>). Even if only ONE WORD changed, return the ENTIRE letter.",
  "changedSections": ["coverLetter"]
}

CRITICAL RULES FOR EDITS:
1. ALWAYS return complete data - never just a message
2. Apply ONLY the requested changes - preserve everything else
3. Maintain original structure and format unless asked to change
4. Return valid JSON - NO markdown code blocks (use plain JSON)
5. For cover letters: 
   - Use plain text, \\n\\n for paragraphs
   - ALWAYS return COMPLETE cover letter text (not summary/placeholder)
   - Even removing ONE WORD requires returning ENTIRE letter
   - No markdown (**bold**, ##headers) or HTML (<p>, <br>)
6. For resume: ALL fields required (name, email, phone, location, linkedin, summary, skills, experience, education, projects, certifications)
7. For skills: ALWAYS use structure {"skill": "...", "category": "...", "confidence": N, "relevance": N}

TYPE B - CLARIFICATION NEEDED:
-------------------------------
{
  "message": "Friendly clarifying question. Be specific about what you need to know."
}

TYPE C - FEEDBACK/ADVICE ONLY:
-------------------------------
{
  "message": "Your suggestions and feedback here. Do NOT include updatedData or updatedCoverLetter."
}

===================================================================
EXAMPLES (LEARN FROM THESE)
===================================================================

EXAMPLE 1: Remove a skill
--------------------------
User: "Remove Python from my skills"

CORRECT RESPONSE:
{
  "message": "I've removed Python from your skills.",
  "updatedData": {
    "name": "${resumeData?.name}",
    "email": "${resumeData?.email}",
    "phone": "${resumeData?.phone}",
    "location": "${resumeData?.location}",
    "linkedin": "${resumeData?.linkedin}",
    "summary": "${resumeData?.summary}",
    "skills": [<ALL skills EXCEPT Python, each with {"skill": "...", "category": "...", "confidence": N, "relevance": N}>],
    "experience": ${JSON.stringify(resumeData?.experience || [])},
    "education": ${JSON.stringify(resumeData?.education || [])},
    "projects": ${JSON.stringify(resumeData?.projects || [])},
    "certifications": ${JSON.stringify(resumeData?.certifications || [])}
  },
  "changedSections": ["skills"]
}

WRONG (DO NOT DO THIS):
{
  "message": "I've removed Python from your skills."
}

EXAMPLE 2: Add to experience
------------------------------
User: "Add AWS to my first job's technologies"

CORRECT RESPONSE:
{
  "message": "I've added AWS to the technologies in your first position.",
  "updatedData": {<COMPLETE resume with AWS added to first job's technologies>},
  "changedSections": ["experience"]
}

EXAMPLE 2B: Remove a section
------------------------------
User: "Remove Certifications section from the resume"

CORRECT RESPONSE:
{
  "message": "I've removed the Certifications section from your resume.",
  "updatedData": {
    "name": "${resumeData?.name}",
    "email": "${resumeData?.email}",
    "phone": "${resumeData?.phone}",
    "location": "${resumeData?.location}",
    "linkedin": "${resumeData?.linkedin}",
    "summary": "${resumeData?.summary}",
    "skills": ${JSON.stringify(resumeData?.skills || [])},
    "experience": ${JSON.stringify(resumeData?.experience || [])},
    "education": ${JSON.stringify(resumeData?.education || [])},
    "projects": ${JSON.stringify(resumeData?.projects || [])},
    "certifications": []
  },
  "changedSections": ["certifications"]
}

WRONG (DO NOT DO THIS):
{
  "message": "I've removed the Certifications section."
}

EXAMPLE 3: Cover letter edit
------------------------------
User: "Make the cover letter opening more engaging"

CORRECT RESPONSE:
{
  "message": "I've rewritten the opening paragraph to be more engaging and capture attention.",
  "updatedCoverLetter": "Dear Hiring Manager,\\n\\nImagine having a team member who combines 5 years of full-stack expertise with an insatiable drive for innovation. That's what I bring to your Senior Software Engineer role.\\n\\n[REST OF THE COMPLETE LETTER WITH ORIGINAL CONTENT]\\n\\nSincerely,\\n[Name]",
  "changedSections": ["coverLetter"]
}

EXAMPLE 4: Small cover letter change - Remove a word
------------------------------------------------------
User: "Remove the word 'innovative' from the cover letter"

CORRECT RESPONSE:
{
  "message": "I've removed the word 'innovative' from your cover letter.",
  "updatedCoverLetter": "<COMPLETE cover letter text with 'innovative' removed>",
  "changedSections": ["coverLetter"]
}

WRONG (DO NOT DO THIS):
{
  "message": "I've removed the word 'innovative' from your cover letter."
}

EXAMPLE 4B: Remove a specific line from cover letter
------------------------------------------------------
User: "Remove 'Thank you for considering my application.' from the cover letter"

CORRECT RESPONSE:
{
  "message": "I've removed 'Thank you for considering my application.' from your cover letter.",
  "updatedCoverLetter": "<COMPLETE cover letter WITHOUT that sentence, properly formatted with \\n\\n>",
  "changedSections": ["coverLetter"]
}

WRONG (DO NOT DO THIS):
{
  "message": "I've removed that line from your cover letter."
}

EXAMPLE 4C: Remove greeting from cover letter
----------------------------------------------
User: "Remove 'Respected Mastercard Recruitment Team,' from the cover letter"

CORRECT RESPONSE:
{
  "message": "I've removed the greeting 'Respected Mastercard Recruitment Team,' from your cover letter.",
  "updatedCoverLetter": "<COMPLETE cover letter starting from the first paragraph, without the greeting>",
  "changedSections": ["coverLetter"]
}

REMEMBER: Even if removing ONE WORD or ONE LINE, return the ENTIRE cover letter!

EXAMPLE 5: Ambiguous request
------------------------------
User: "Remove this"

CORRECT RESPONSE:
{
  "message": "I'd be happy to help! What would you like me to remove? For example, a specific skill, job experience, or section from your cover letter?"
}

WRONG: Never return updatedData or updatedCoverLetter for unclear requests!

EXAMPLE 6: Feedback request
-----------------------------
User: "What do you think of my resume?"

CORRECT RESPONSE:
{
  "message": "Your resume shows strong experience! Here are my thoughts: [specific feedback]. Would you like me to make any of these improvements?"
}

WRONG: Never return updatedData or updatedCoverLetter for feedback-only requests!

===================================================================
PRE-FLIGHT CHECK (MANDATORY - DO THIS BEFORE RESPONDING)
===================================================================

BEFORE you generate your response, ask yourself:

1. Does the user's message contain ANY of these words?
   add, remove, delete, change, modify, improve, edit, fix, enhance, update, replace, rewrite, rephrase, swap, adjust, refine, revise, include, exclude, insert, append, drop, eliminate, strengthen, make, set
   
   -> If YES: Your response MUST include updatedData or updatedCoverLetter
   -> If NO: Continue to question 2

2. Is this about the resume or cover letter?
   -> Resume: MUST include "updatedData" field with ALL resume fields
   -> Cover letter: MUST include "updatedCoverLetter" field with COMPLETE text
   
3. Did I include the complete data, not just a message?
   -> If your JSON only has "message" field and this is an edit request, STOP!
   -> Go back and add the updatedData or updatedCoverLetter field

===================================================================
CRITICAL VALIDATION CHECKLIST
===================================================================

Before sending ANY response, verify:

[ ] Is this an edit request? (Check keywords)
    - YES: Must include updatedData OR updatedCoverLetter
    - NO: Only message field needed

[ ] If updatedData included:
    - All fields present? (name, email, phone, location, linkedin, summary, skills, experience, education, projects, certifications)
    - Skills have proper structure? (skill, category, confidence, relevance)
    - Only requested changes made?
    - Everything else preserved from original?

[ ] If updatedCoverLetter included:
    - Complete text (not placeholder/summary)?
    - Plain text only (no markdown/HTML)?
    - Uses \\n\\n for paragraph breaks?
    - Only requested changes made?
    - Professional letter structure maintained?

[ ] Is response valid JSON? (no code blocks)

[ ] Is message field clear and friendly?

===================================================================
FINAL REMINDERS
===================================================================

1. ALWAYS return complete data for edit requests - the UI cannot update without it
2. Change ONLY what was requested - preserve everything else exactly as is
3. For cover letters: Even a one-word change requires returning the full text
4. For resumes: All fields are required in updatedData
5. Be conversational and helpful - explain your changes
6. When unclear, ask before acting
7. Return pure JSON - no markdown code blocks

Your responses directly power the UI updates. Missing data = broken functionality.`;

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
        temperature: 0.3, // Lower temperature for more consistent instruction following
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

    // Validation: Check if AI should have returned updatedData or updatedCoverLetter but didn't
    if (isModificationRequest && !result.updatedData && !result.updatedCoverLetter) {
      console.error('🚨 CRITICAL: AI failed to return updatedData or updatedCoverLetter for modification request!');
      console.error('User message:', userMessage);
      console.error('AI response:', aiMessage);
      console.error('Parsed result:', JSON.stringify(result, null, 2));
      console.warn('⚠️ The AI model did not follow instructions. Attempting fallback...');
      
      // Determine what the user was trying to modify
      const isCoverLetterRequest = userMessage.includes('cover letter') || 
                                     userMessage.includes('cover-letter') ||
                                     userMessage.includes('coverletter');
      
      // FALLBACK: Try to construct the response based on common patterns
      if (!isCoverLetterRequest && resumeData) {
        console.log('🔧 Attempting to construct updatedData from resume data...');
        
        // Check for common section removal patterns
        const sectionRemovalPatterns = [
          { keywords: ['remove', 'certification'], field: 'certifications' },
          { keywords: ['remove', 'project'], field: 'projects' },
          { keywords: ['delete', 'certification'], field: 'certifications' },
          { keywords: ['delete', 'project'], field: 'projects' },
        ];
        
        let constructedData = null;
        
        for (const pattern of sectionRemovalPatterns) {
          if (pattern.keywords.every(keyword => userMessage.includes(keyword))) {
            console.log(`🔧 Detected request to remove ${pattern.field} section`);
            constructedData = {
              ...resumeData,
              [pattern.field]: []
            };
            result.updatedData = constructedData;
            result.changedSections = [pattern.field];
            console.log('✅ Successfully constructed fallback response for section removal');
            break;
          }
        }
        
        // If no section removal detected, check for skill removal
        if (!constructedData && userMessage.includes('remove') && userMessage.includes('skill')) {
          console.log('🔧 Detected potential skill removal, constructing base response');
          // For skill removal, we return the current data as-is since we can't determine which skill
          // The AI should have handled this, but as a fallback, return current state
          constructedData = { ...resumeData };
          result.updatedData = constructedData;
          result.changedSections = ['skills'];
          result.message = result.message + ' (Note: Please verify the changes in the preview)';
          console.log('✅ Constructed fallback response for skill modification');
        }
        
        // If we successfully constructed a response, continue processing
        if (constructedData) {
          console.log('✅ Fallback successful, continuing with constructed data');
        } else {
          // Fallback failed, return error
          const errorMessage = 'The AI assistant did not return the expected data format. Please try rephrasing your request or try again.';
          
          return new Response(JSON.stringify({
            error: errorMessage,
            message: result.message || 'I understood your request but encountered a formatting issue.',
            debugInfo: 'AI_RESPONSE_FORMAT_ERROR',
            requestType: 'RESUME'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (isCoverLetterRequest && coverLetter) {
        // FALLBACK for cover letter modifications
        console.log('🔧 Attempting to construct cover letter response...');
        
        let modifiedCoverLetter = coverLetter;
        let changeApplied = false;
        
        // Try to apply simple text removals
        if (userMessage.includes('remove') || userMessage.includes('delete')) {
          // Extract quoted text to remove
          const quoteMatches = userMessage.match(/"([^"]+)"/g) || userMessage.match(/'([^']+)'/g);
          
          if (quoteMatches && quoteMatches.length > 0) {
            const textToRemove = quoteMatches[0].replace(/['"]/g, '');
            console.log(`🔧 Attempting to remove: "${textToRemove}"`);
            
            if (coverLetter.includes(textToRemove)) {
              // Remove the text and clean up extra whitespace/newlines
              modifiedCoverLetter = coverLetter.replace(textToRemove, '').replace(/\n\n\n+/g, '\n\n').trim();
              changeApplied = true;
              console.log('✅ Successfully removed text from cover letter');
            }
          }
          
          // Try to detect specific salutation/closing removals without quotes
          const removalPatterns = [
            { keywords: ['respected', 'mastercard', 'recruitment'], searchFor: 'Respected Mastercard Recruitment Team,' },
            { keywords: ['dear', 'hiring', 'manager'], searchFor: 'Dear Hiring Manager,' },
            { keywords: ['thank', 'you', 'considering'], searchFor: 'Thank you for considering my application.' },
            { keywords: ['sincerely'], searchFor: 'Sincerely,' },
          ];
          
          if (!changeApplied) {
            for (const pattern of removalPatterns) {
              if (pattern.keywords.every(kw => userMessage.includes(kw))) {
                if (coverLetter.includes(pattern.searchFor)) {
                  modifiedCoverLetter = coverLetter.replace(pattern.searchFor, '').replace(/\n\n\n+/g, '\n\n').trim();
                  changeApplied = true;
                  console.log(`✅ Removed pattern: ${pattern.searchFor}`);
                  break;
                }
              }
            }
          }
        }
        
        // Try to apply simple text additions
        if (!changeApplied && (userMessage.includes('add') || userMessage.includes('include'))) {
          // Extract quoted text to add
          const quoteMatches = userMessage.match(/"([^"]+)"/g) || userMessage.match(/'([^']+)'/g);
          
          if (quoteMatches && quoteMatches.length > 0) {
            const textToAdd = quoteMatches[0].replace(/['"]/g, '');
            console.log(`🔧 Attempting to add: "${textToAdd}"`);
            
            // Check if adding signature
            if (userMessage.includes('end') || userMessage.includes('sincerely')) {
              if (!coverLetter.includes(textToAdd)) {
                modifiedCoverLetter = coverLetter + '\n\n' + textToAdd;
                changeApplied = true;
                console.log('✅ Successfully added text to end of cover letter');
              }
            }
          }
        }
        
        if (changeApplied) {
          result.updatedCoverLetter = modifiedCoverLetter;
          result.changedSections = ['coverLetter'];
          console.log('✅ Fallback successful for cover letter modification');
        } else {
          // Fallback failed, return error
          const errorMessage = 'The AI assistant did not return the updated cover letter. Please try rephrasing your request, such as: "Rewrite the cover letter to be more enthusiastic" or "Remove the first sentence from the cover letter".';
          
          return new Response(JSON.stringify({
            error: errorMessage,
            message: result.message || 'I understood your request but encountered a formatting issue.',
            debugInfo: 'AI_RESPONSE_FORMAT_ERROR',
            requestType: 'COVER_LETTER'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // No fallback possible
        const errorMessage = 'The AI assistant did not return the expected data format. Please try rephrasing your request or try again.';
        
      return new Response(JSON.stringify({
        error: errorMessage,
        message: result.message || 'I understood your request but encountered a formatting issue.',
        debugInfo: 'AI_RESPONSE_FORMAT_ERROR',
        requestType: isCoverLetterRequest ? 'COVER_LETTER' : 'RESUME'
      }), {
          status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    // Validate and sanitize cover letter if present
    if (result.updatedCoverLetter) {
      console.log('📝 Validating cover letter format...');
      console.log('Cover letter length:', result.updatedCoverLetter.length);
      console.log('First 100 chars:', result.updatedCoverLetter.substring(0, 100));
      
      // Check for common formatting issues
      const hasMarkdown = /(\*\*|##|^[-*+]\s)/m.test(result.updatedCoverLetter);
      const hasHTML = /<[^>]+>/.test(result.updatedCoverLetter);
      
      if (hasMarkdown || hasHTML) {
        console.warn('⚠️ Cover letter contains markdown or HTML, sanitizing...');
        
        // Remove markdown formatting
        let sanitized = result.updatedCoverLetter;
        sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '$1');  // **bold**
        sanitized = sanitized.replace(/\*([^*]+)\*/g, '$1');      // *italic*
        sanitized = sanitized.replace(/^#{1,6}\s+/gm, '');        // # headers
        sanitized = sanitized.replace(/^\s*[-*+]\s+/gm, '');      // - lists
        
        // Remove HTML tags
        sanitized = sanitized.replace(/<[^>]+>/g, '');
        
        result.updatedCoverLetter = sanitized;
        console.log('✅ Cover letter sanitized');
      }
      
      // Ensure it's not just a placeholder
      if (result.updatedCoverLetter.length < 50 || result.updatedCoverLetter.includes('<updated') || result.updatedCoverLetter.includes('placeholder')) {
        console.error('🚨 Cover letter appears to be a placeholder or too short!');
        console.error('Content:', result.updatedCoverLetter);
      } else {
        console.log('✅ Cover letter format validated');
      }
    }

    console.log('📤 Final result being sent to frontend:', {
      hasUpdatedData: !!result.updatedData,
      hasUpdatedCoverLetter: !!result.updatedCoverLetter,
      coverLetterLength: result.updatedCoverLetter ? result.updatedCoverLetter.length : 0,
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
