import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import tweakieAvatar from "@/assets/tweakie-avatar.png";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
  const [currentTweakedData, setCurrentTweakedData] = useState(tweakedData);
  const [currentCoverLetter, setCurrentCoverLetter] = useState(coverLetter);
  const [changedSections, setChangedSections] = useState<string[]>([]);
  const [renderKey, setRenderKey] = useState(0); // Force re-renders
  const [isChatOpen, setIsChatOpen] = useState(false); // Chat closed by default

  // Calculate total required skills from matching + missing skills
  const totalRequiredSkills = (skillMatches?.length || 0) + (missingSkills?.length || 0);

  const handleChatUpdate = async (updatedData: any, updatedCoverLetter?: string, sections?: string[]) => {

    // Validate the updated data has required fields
    if (updatedData) {
      const requiredFields = ['name', 'email', 'phone'];
      const hasAllFields = requiredFields.every(field => updatedData[field]);
      if (!hasAllFields) {
        updatedData = {
          ...currentTweakedData,
          ...updatedData
        };
      }
    }

    // Capture the cover letter value to save BEFORE any state updates
    let coverLetterToSave = updatedCoverLetter !== undefined ? updatedCoverLetter : currentCoverLetter;

    // Save to database FIRST if we have a tweakedResumeId
    if (tweakedResumeId && (updatedData || updatedCoverLetter !== undefined)) {
      try {
        const updatePayload: any = {
          updated_at: new Date().toISOString()
        };
        
        if (updatedData) {
          updatePayload.tweaked_data = updatedData;
        }
        
        if (coverLetterToSave !== undefined) {
          updatePayload.cover_letter = coverLetterToSave;
        }
        
        const {
          error
        } = await supabase.from('tweaked_resumes').update(updatePayload).eq('id', tweakedResumeId);
        if (error) {
          toast({
            title: "Warning",
            description: `Changes applied but failed to save: ${error.message}`,
            variant: "destructive"
          });
          return; // Don't update state if save failed
        }

        // Fetch fresh data from database to ensure UI is in sync
        const {
          data: freshData,
          error: fetchError
        } = await supabase.from('tweaked_resumes').select('tweaked_data, cover_letter').eq('id', tweakedResumeId).single();
        if (fetchError) {
          // Continue with the updatedData we have
        } else if (freshData) {
          const freshResumeData = freshData.tweaked_data as unknown as ResumeData;
          // Use fresh data from database instead of local updatedData
          updatedData = freshResumeData;
          
          if (freshData.cover_letter !== undefined) {
            coverLetterToSave = freshData.cover_letter;
          }
        }
      } catch (error: any) {
        toast({
          title: "Warning",
          description: `Changes applied but failed to save: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
        return; // Don't update state if save failed
      }
    } else {
      // Still update local state for cover letter if provided
      if (updatedCoverLetter !== undefined) {
        setCurrentCoverLetter(updatedCoverLetter);
      }
    }

    // Only update state AFTER successful database save and fetch
    if (updatedData) {
      setCurrentTweakedData(updatedData);
      setRenderKey(Date.now()); // Force immediate re-render

      // Notify parent component
      if (onDataUpdate) {
        onDataUpdate(updatedData, updatedCoverLetter);
      }
    }

    // Update cover letter with the saved value
    if (coverLetterToSave !== undefined && coverLetterToSave !== currentCoverLetter) {
      setCurrentCoverLetter(coverLetterToSave);
    }
    if (sections) {
      setChangedSections(sections);
      // Clear highlights after 3 seconds
      setTimeout(() => setChangedSections([]), 3000);
    }

    // Show success toast only after everything is done
    toast({
      title: "Resume updated successfully",
      description: "Changes are highlighted in the preview."
    });
  };
  return <div className="w-full relative">
      <Tabs defaultValue="customized" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="original">Original Resume</TabsTrigger>
          <TabsTrigger value="customized">Customized Resume</TabsTrigger>
          <TabsTrigger value="cover">Cover Letter</TabsTrigger>
          <TabsTrigger value="analysis">Score Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="original" className="mt-6">
          <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10">
            <ResumeTemplate data={originalData} id="original-resume-content" />
          </Card>
        </TabsContent>

        <TabsContent value="customized" className="mt-6">
          <Card className={`p-8 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10 transition-all duration-500 ${changedSections.length > 0 ? 'ring-2 ring-accent shadow-lg' : ''}`}>
            <ResumeTemplate 
              key={`tweaked-${renderKey}-${currentTweakedData?.skills?.length || 0}`}
              data={currentTweakedData} 
              id="tweaked-resume-content" 
            />
          </Card>
        </TabsContent>

        <TabsContent value="cover" className="mt-6">
          <Card className={`p-8 transition-all duration-500 ${changedSections.includes('coverLetter') ? 'ring-2 ring-accent shadow-lg' : ''}`}>
            <div className="prose prose-sm max-w-none">
              {currentCoverLetter ? <pre 
                key={`cover-letter-${renderKey}-${currentCoverLetter?.length || 0}`}
                id="cover-letter-content" 
                className="whitespace-pre-wrap text-sm font-sans"
              >
                {currentCoverLetter}
              </pre> : <p className="text-muted-foreground text-center py-8">
                  No cover letter available
                </p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <ScoreAnalysis originalScore={originalScore} customizedScore={customizedScore || 85} skillMatches={{
          matching: skillMatches || [],
          missing: missingSkills || [],
          addedSkills: currentTweakedData?.added_skills || []
        }} totalRequiredSkills={totalRequiredSkills} />
        </TabsContent>
      </Tabs>

      {/* Floating Chat Button - visible when chat is closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-28 h-28 z-50 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg hover:shadow-xl transition-transform cursor-pointer group animate-gentle-bounce flex items-center justify-center"
          aria-label="Open Tweakie Assistant"
        >
          <img 
            src={tweakieAvatar} 
            alt="Tweakie" 
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="absolute -top-2 -right-2 bg-primary/90 text-white text-xs px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Talk to Tweakie!
          </div>
        </button>
      )}

      {/* Floating Chat Panel - visible when chat is open */}
      {isChatOpen && <div className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl rounded-lg overflow-hidden z-50">
          <ChatAssistant tweakedResumeId={tweakedResumeId} resumeData={currentTweakedData} coverLetter={currentCoverLetter} onUpdate={handleChatUpdate} onClose={() => setIsChatOpen(false)} />
        </div>}
    </div>;
};