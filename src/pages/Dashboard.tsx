import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Routes, Route, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { DashboardNav } from "@/components/DashboardNav";
import { DashboardHome } from "@/pages/DashboardHome";
import { ResumePage } from "@/pages/ResumePage";
import { HistoryPage } from "@/pages/HistoryPage";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
        <DashboardNav onSignOut={handleSignOut} />
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
      <DashboardNav onSignOut={handleSignOut} />
      <Routes>
        <Route path="/" element={<DashboardHome userId={user.id} />} />
        <Route path="/resume" element={<ResumePage userId={user.id} />} />
        <Route path="/history" element={<HistoryPage userId={user.id} />} />
        <Route path="/history/:id" element={<HistoryPage userId={user.id} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default Dashboard;
