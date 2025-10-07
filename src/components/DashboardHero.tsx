import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className={cn(
      "relative overflow-hidden border-2",
      hasResume ? "bg-gradient-to-br from-primary/5 via-accent/5 to-background" : "bg-muted/50"
    )}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Resume Tweaking</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Tweak Your Resume for Any Job
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get a customized resume and cover letter in minutes, perfectly matched to the job description
          </p>
        </div>

        {!hasResume ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Upload your resume first to start creating tweaked versions
            </p>
            <Button variant="outline" asChild>
              <a href="/dashboard/resume">
                <Briefcase className="w-4 h-4 mr-2" />
                Go to Resume Manager
              </a>
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-company">Company Name</Label>
                <Input
                  id="hero-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-role">Role Name</Label>
                <Input
                  id="hero-role"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-job-description">Job Description</Label>
              <Textarea
                id="hero-job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="min-h-[150px]"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              size="lg"
              variant="gradient"
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? "Analyzing..." : "Generate Tweaked Resume"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
