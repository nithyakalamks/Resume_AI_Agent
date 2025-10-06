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

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Resume Tailor</h1>
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
