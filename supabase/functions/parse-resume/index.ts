import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('File path is required');
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

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('resumes')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file');
    }

    // Convert blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    console.log('PDF file size:', arrayBuffer.byteLength, 'bytes');
    
    // Extract text from PDF using unpdf
    let rawText = '';
    try {
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
      const numPages = pdf.numPages;
      console.log('Total pages:', numPages);
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        rawText += pageText + '\n\n';
      }
      
      console.log('Extracted text length:', rawText.length, 'characters');
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF.');
    }

    // Parse the extracted text using Lovable AI with structured tool calling
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const parseResumeTool = {
      type: "function",
      function: {
        name: "parse_resume",
        description: "Parse resume text into structured JSON format with all relevant sections",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Full name of the candidate" },
            email: { type: "string", description: "Email address" },
            phone: { type: "string", description: "Phone number" },
            linkedin: { type: "string", description: "LinkedIn profile URL" },
            other_links: { type: "string", description: "Other professional links (GitHub, portfolio, etc.)" },
            summary: { type: "string", description: "Professional summary or objective (2-3 sentences)" },
            skills: {
              type: "array",
              description: "List of skills with confidence scores based on context and experience",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: ["skill", "confidence"]
              }
            },
            experience: {
              type: "array",
              description: "Work experience entries",
              items: {
                type: "object",
                properties: {
                  company: { type: "string" },
                  title: { type: "string" },
                  start: { type: "string", description: "Start date in YYYY-MM format" },
                  end: { type: "string", description: "End date in YYYY-MM format or 'Present'" },
                  bullets: { type: "array", items: { type: "string" } },
                  raw_text_span: {
                    type: "object",
                    properties: {
                      start_idx: { type: "number" },
                      end_idx: { type: "number" }
                    }
                  }
                },
                required: ["company", "title", "start", "bullets"]
              }
            },
            education: {
              type: "array",
              description: "Education entries",
              items: {
                type: "object",
                properties: {
                  institution: { type: "string" },
                  degree: { type: "string" },
                  field: { type: "string" },
                  graduation_date: { type: "string" }
                }
              }
            },
            projects: {
              type: "array",
              description: "Personal or professional projects",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  technologies: { type: "array", items: { type: "string" } }
                }
              }
            },
            certifications: {
              type: "array",
              description: "Professional certifications",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  issuer: { type: "string" },
                  date: { type: "string" }
                }
              }
            },
            raw_text: { type: "string", description: "Full extracted text from the resume" }
          },
          required: ["name", "email", "skills", "experience", "raw_text"]
        }
      }
    };

    let parsedData;
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an expert resume parser. Extract all information from the resume text and structure it according to the provided schema. For skills, assign confidence scores based on: explicit mentions (0.9-1.0), years of experience (0.7-0.9), or casual mentions (0.5-0.7). Parse dates into YYYY-MM format. Track raw_text_span character indices for each experience section."
            },
            {
              role: "user",
              content: `Parse this resume:\n\n${rawText}`
            }
          ],
          tools: [parseResumeTool],
          tool_choice: { type: "function", function: { name: "parse_resume" } }
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI gateway error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (aiResponse.status === 402) {
          throw new Error('AI credits exhausted. Please add credits to your workspace.');
        }
        throw new Error('AI parsing failed');
      }

      const aiData = await aiResponse.json();
      console.log('AI response received');
      
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== "parse_resume") {
        throw new Error('Invalid AI response format');
      }

      parsedData = JSON.parse(toolCall.function.arguments);
      parsedData.raw_text = rawText; // Ensure raw_text is included
      console.log('Parsed resume for:', parsedData.name);
      
    } catch (aiError) {
      console.error('AI parsing error:', aiError);
      throw new Error(`Failed to parse resume content: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
    }

    // Store the parsed data in the database
    const { data: resumeRecord, error: insertError } = await supabaseClient
      .from('resumes')
      .insert({
        user_id: user.id,
        file_path: filePath,
        original_filename: filePath.split('/').pop() || 'resume.pdf',
        parsed_data: parsedData,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save parsed data');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        parsed_data: parsedData,
        resume_id: resumeRecord.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
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
