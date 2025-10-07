import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Briefcase, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResumeManager } from "@/components/ResumeManager";
import { JobApplication } from "@/components/JobApplication";
import { JobHistory } from "@/components/JobHistory";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user has uploaded a resume
        const { data: resumes } = await supabase
          .from("resumes")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1);
        
        const userHasResume = resumes && resumes.length > 0;
        setHasResume(userHasResume);
        
        // Show onboarding for new users (no resume)
        if (!userHasResume) {
          setShowOnboarding(true);
        }
      }
      
      setLoading(false);
    };

    initializeUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  // Show onboarding wizard for new users
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Tweaker</h1>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <OnboardingWizard
          userId={user.id}
          onComplete={() => {
            setShowOnboarding(false);
            setHasResume(true);
          }}
        />
      </div>
    );
  }

  // Show main dashboard for existing users
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Tweaker</h1>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resume">
              <FileText className="w-4 h-4 mr-2" />
              My Resume
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Apply to Jobs
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Past Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="mt-6">
            <ResumeManager 
              userId={user.id} 
              onResumeChange={setCurrentResumeId}
            />
          </TabsContent>

          <TabsContent value="jobs" className="mt-6">
            <JobApplication 
              userId={user.id}
              currentResumeId={currentResumeId}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <JobHistory userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
