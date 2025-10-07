import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_JOB_DESCRIPTION } from "@/lib/sample-job-description";

interface DashboardHeroProps {
  hasResume: boolean;
  onStartTweaking: (companyName: string, roleName: string, jobDescription: string) => void;
  loading?: boolean;
}

export const DashboardHero = ({ hasResume, onStartTweaking, loading }: DashboardHeroProps) => {
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const isFormValid = companyName.trim() && roleName.trim() && jobDescription.trim();

  const handleSubmit = () => {
    if (isFormValid && hasResume) {
      onStartTweaking(companyName, roleName, jobDescription);
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 shadow-2xl",
        "transform transition-all duration-300 hover:shadow-3xl",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:bg-gradient-to-tl after:from-black/5 after:via-transparent after:to-accent/10 after:pointer-events-none",
        hasResume 
          ? "bg-gradient-to-br from-primary/8 via-accent/6 to-primary/4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)]" 
          : "bg-gradient-to-br from-muted/60 via-muted/40 to-muted/70 shadow-[0_15px_30px_-8px_rgba(0,0,0,0.15)]",
      )}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 shadow-[0_0_60px_rgba(var(--primary),0.3)]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 shadow-[0_0_60px_rgba(var(--accent),0.3)]" />
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 shadow-[0_0_40px_rgba(var(--primary),0.2)]" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-accent/8 to-primary/6 rounded-full blur-2xl translate-y-1/2 translate-x-1/2 shadow-[0_0_40px_rgba(var(--accent),0.2)]" />

      <div className="relative p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/20 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 drop-shadow-sm" />
            <span className="text-sm font-medium">AI-Powered Resume Tweaking</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Tweak Your Resume for Any Job</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Get a customized resume and cover letter in minutes, perfectly matched to the job description
          </p>
        </div>

        {!hasResume ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Upload your resume first to start creating tweaked versions</p>
            <Button variant="outline" asChild className="shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
              <a href="/dashboard/resume">
                <Briefcase className="w-4 h-4 mr-2 drop-shadow-sm" />
                Go to Resume Manager
              </a>
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-company" className="text-sm font-medium drop-shadow-sm">Company Name</Label>
                <Input
                  id="hero-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft"
                  disabled={loading}
                  autoFocus
                  className="shadow-md shadow-black/5 border-2 focus:shadow-lg focus:shadow-primary/10 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-role" className="text-sm font-medium drop-shadow-sm">Role Name</Label>
                <Input
                  id="hero-role"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  disabled={loading}
                  className="shadow-md shadow-black/5 border-2 focus:shadow-lg focus:shadow-primary/10 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hero-job-description" className="text-sm font-medium drop-shadow-sm">Job Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)}
                  disabled={loading}
                  className="text-xs shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Sample JD
                </Button>
              </div>
              <Textarea
                id="hero-job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="min-h-[150px] shadow-md shadow-black/5 border-2 focus:shadow-lg focus:shadow-primary/10 transition-all duration-200"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              size="lg"
              variant="gradient"
              className="w-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2 drop-shadow-sm" />
              {loading ? "Tweaking..." : "Tweak it!"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
