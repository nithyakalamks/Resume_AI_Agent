import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { ResumeTemplate } from "@/components/ResumeTemplate";
import { ScoreAnalysis } from "@/components/ScoreAnalysis";
import { ChatAssistant } from "@/components/ChatAssistant";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  skill: string;
  confidence: number;
  relevance?: number;
  category?: string;
}

interface Experience {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description: string[];
  relevance?: number;
}

interface Project {
  name: string;
  description: string;
  technologies?: string[];
  relevance?: number;
}

interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  skills: Skill[];
  experience: Experience[];
  education?: any[];
  projects?: Project[];
  certifications?: any[];
  added_skills?: string[];
}

interface TweakedResumeViewProps {
  tweakedResumeId?: string;
  originalData: ResumeData;
  tweakedData: ResumeData;
  changesSummary: string[];
  coverLetter?: string;
  originalScore?: number;
  customizedScore?: number;
  skillMatches?: any[];
  missingSkills?: any[];
  onDataUpdate?: (updatedData: ResumeData, updatedCoverLetter?: string) => void;
}

export const TweakedResumeView = ({ 
  tweakedResumeId,
  originalData, 
  tweakedData, 
  changesSummary,
  coverLetter,
  originalScore,
  customizedScore,
  skillMatches,
  missingSkills,
  onDataUpdate
}: TweakedResumeViewProps) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [currentTweakedData, setCurrentTweakedData] = useState(tweakedData);
  const [currentCoverLetter, setCurrentCoverLetter] = useState(coverLetter);
  const [changedSections, setChangedSections] = useState<string[]>([]);
  const [renderKey, setRenderKey] = useState(0); // Force re-renders

  // Calculate total required skills from matching + missing skills
  const totalRequiredSkills = (skillMatches?.length || 0) + (missingSkills?.length || 0);

  // Debug: Log when currentTweakedData changes
  useEffect(() => {
    console.log('📊 currentTweakedData updated:', {
      name: currentTweakedData?.name,
      skills: currentTweakedData?.skills?.map((s: any) => s.skill),
      skillsCount: currentTweakedData?.skills?.length,
      firstSkill: currentTweakedData?.skills?.[0],
      fullData: currentTweakedData
    });
  }, [currentTweakedData]);

  // Force re-render when currentTweakedData changes (after state has settled)
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderKey(Date.now());
      console.log('🔄 Forced re-render with new key:', Date.now());
    }, 100);
    return () => clearTimeout(timer);
  }, [currentTweakedData]);

  const handleChatUpdate = async (updatedData: any, updatedCoverLetter?: string, sections?: string[]) => {
    console.log("📥 TweakedResumeView received update:", {
      hasUpdatedData: !!updatedData,
      updatedDataName: updatedData?.name,
      hasUpdatedCoverLetter: updatedCoverLetter !== undefined,
      changedSections: sections,
      updatedDataKeys: updatedData ? Object.keys(updatedData) : []
    });
    
    // Validate the updated data has required fields
    if (updatedData) {
      const requiredFields = ['name', 'email', 'phone'];
      const hasAllFields = requiredFields.every(field => updatedData[field]);
      
      if (!hasAllFields) {
        console.warn('⚠️ Updated data missing required fields, merging with current data');
        updatedData = {
          ...currentTweakedData,
          ...updatedData
        };
      }
      
      console.log("✅ Validated data ready to save:", {
        name: updatedData.name,
        email: updatedData.email,
        skillsCount: updatedData.skills?.length || 0,
        experienceCount: updatedData.experience?.length || 0
      });
    }
    
    // Capture the cover letter value to save BEFORE any state updates
    let coverLetterToSave = updatedCoverLetter !== undefined 
      ? updatedCoverLetter 
      : currentCoverLetter;

    // Save to database FIRST if we have a tweakedResumeId
    if (tweakedResumeId && updatedData) {
      console.log('💾 Saving to database with tweakedResumeId:', tweakedResumeId);
      try {
        const { error } = await supabase
          .from('tweaked_resumes')
          .update({
            tweaked_data: updatedData,
            cover_letter: coverLetterToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', tweakedResumeId);

        if (error) {
          console.error('❌ Failed to save chat updates:', error);
          toast({
            title: "Warning",
            description: `Changes applied but failed to save: ${error.message}`,
            variant: "destructive"
          });
          return; // Don't update state if save failed
        }
        
        console.log('✅ Successfully saved chat updates to database');
        
        // Fetch fresh data from database to ensure UI is in sync
        console.log('🔄 Fetching fresh data from database...');
        const { data: freshData, error: fetchError } = await supabase
          .from('tweaked_resumes')
          .select('tweaked_data, cover_letter')
          .eq('id', tweakedResumeId)
          .single();

        if (fetchError) {
          console.error('❌ Failed to fetch fresh data:', fetchError);
          // Continue with the updatedData we have
        } else if (freshData) {
          const freshResumeData = freshData.tweaked_data as unknown as ResumeData;
          console.log('✅ Fresh data fetched from database:', {
            name: freshResumeData?.name,
            educationCount: freshResumeData?.education?.length,
            firstEducation: freshResumeData?.education?.[0]
          });
          // Use fresh data from database instead of local updatedData
          updatedData = freshResumeData;
          if (freshData.cover_letter !== undefined) {
            coverLetterToSave = freshData.cover_letter;
          }
        }
      } catch (error: any) {
        console.error('❌ Error saving chat updates:', error);
        toast({
          title: "Warning",
          description: `Changes applied but failed to save: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
        return; // Don't update state if save failed
      }
    } else {
      console.log('⚠️ No tweakedResumeId - skipping database save');
    }

    // Only update state AFTER successful database save
    if (updatedData) {
      console.log("✅ Setting current tweaked data after successful save:", {
        name: updatedData.name,
        skillsCount: updatedData.skills?.length,
        firstSkill: updatedData.skills?.[0],
        skillsStructure: updatedData.skills?.map((s: any) => ({
          skill: s.skill,
          hasCategory: !!s.category,
          hasConfidence: !!s.confidence
        })).slice(0, 3)
      });
      setCurrentTweakedData(updatedData);
      
      // Notify parent component
      if (onDataUpdate) {
        console.log('📤 Notifying parent component of update');
        onDataUpdate(updatedData, updatedCoverLetter);
      }
    }
    
    // Update cover letter with the saved value
    if (coverLetterToSave !== undefined && coverLetterToSave !== currentCoverLetter) {
      console.log("✅ Setting current cover letter");
      setCurrentCoverLetter(coverLetterToSave);
    }
    
    if (sections) {
      console.log("✅ Setting changed sections:", sections);
      setChangedSections(sections);
      // Clear highlights after 3 seconds
      setTimeout(() => setChangedSections([]), 3000);
    }

    // Show success toast only after everything is done
    toast({
      title: "Resume updated successfully",
      description: "Changes are highlighted in the preview.",
    });
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('tweaked-resume-content');
      if (!resumeElement) throw new Error('Resume content not found');

      const opt = {
        margin: 5,
        filename: `${tweakedData.name.replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(resumeElement).save();
      toast({ title: "Resume downloaded successfully" });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      <div className="flex-1 min-w-0">
        <Tabs defaultValue="customized" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="original">Original Resume</TabsTrigger>
            <TabsTrigger value="customized">Customized Resume</TabsTrigger>
            <TabsTrigger value="cover">Cover Letter</TabsTrigger>
            <TabsTrigger value="analysis">Score Analysis</TabsTrigger>
          </TabsList>

      <TabsContent value="original" className="mt-6">
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10">
          <ResumeTemplate 
            data={originalData} 
            id="original-resume-content"
          />
        </Card>
      </TabsContent>

      <TabsContent value="customized" className="mt-6">
        <Card className={`p-8 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10 transition-all duration-500 ${changedSections.length > 0 ? 'ring-2 ring-accent shadow-lg' : ''}`}>
          <ResumeTemplate 
            key={`tweaked-${renderKey}-${JSON.stringify({
              name: currentTweakedData?.name,
              eduCount: currentTweakedData?.education?.length,
              eduFirst: currentTweakedData?.education?.[0],
              skillCount: currentTweakedData?.skills?.length
            })}`}
            data={currentTweakedData} 
            id="tweaked-resume-content"
          />
        </Card>
      </TabsContent>

      <TabsContent value="cover" className="mt-6">
        <Card className={`p-8 transition-all duration-500 ${changedSections.includes('coverLetter') ? 'ring-2 ring-accent shadow-lg' : ''}`}>
          <div className="prose prose-sm max-w-none">
            {currentCoverLetter ? (
              <pre id="cover-letter-content" className="whitespace-pre-wrap text-sm font-sans">{currentCoverLetter}</pre>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No cover letter available
              </p>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="analysis" className="mt-6">
        <ScoreAnalysis 
          originalScore={originalScore}
          customizedScore={customizedScore || 85}
          skillMatches={{
            matching: skillMatches || [],
            missing: missingSkills || [],
            addedSkills: currentTweakedData?.added_skills || []
          }}
          totalRequiredSkills={totalRequiredSkills}
        />
      </TabsContent>
        </Tabs>
      </div>

      <div className="w-full lg:w-96 h-[600px] lg:h-[800px] lg:sticky lg:top-6">
        <ChatAssistant
          tweakedResumeId={tweakedResumeId}
          resumeData={currentTweakedData}
          coverLetter={currentCoverLetter}
          onUpdate={handleChatUpdate}
        />
      </div>
    </div>
  );
};

