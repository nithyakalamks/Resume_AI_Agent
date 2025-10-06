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
    
    // TODO: Implement actual PDF parsing
    // For now, we'll return a placeholder response
    // In production, you would:
    // 1. Use a PDF parsing library compatible with Deno
    // 2. Extract text, structure, and metadata
    // 3. Parse into the required JSON format
    
    console.log('PDF file size:', arrayBuffer.byteLength, 'bytes');
    
    // Placeholder parsed data - this should be replaced with actual parsing
    const parsedData = {
      name: "Extracted Name",
      email: "email@example.com",
      phone: "+1-XXX-XXX-XXXX",
      linkedin: "https://linkedin.com/in/username",
      other_links: "",
      summary: "Professional summary will be extracted from the resume.",
      skills: [
        { skill: "JavaScript", confidence: 0.95 },
        { skill: "React", confidence: 0.90 },
        { skill: "TypeScript", confidence: 0.85 }
      ],
      experience: [
        {
          company: "Company Name",
          title: "Job Title",
          start: "2020-01",
          end: "2024-01",
          bullets: ["Achievement 1", "Achievement 2"],
          raw_text_span: { start_idx: 0, end_idx: 100 }
        }
      ],
      education: [],
      projects: [],
      certifications: [],
      raw_text: "Full extracted text would go here..."
    };

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
