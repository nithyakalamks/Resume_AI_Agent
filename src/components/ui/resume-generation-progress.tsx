import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

interface ResumeGenerationProgressProps {
  companyName: string;
  roleName: string;
  currentStage?: number; // 0-5 (5 = complete)
}

const STAGES = [
  "Writing a new summary...",
  "Tweaking your skills...",
  "Calculating job fit score...",
  "Optimizing resume content...",
  "Generating cover letter...",
];

export const ResumeGenerationProgress = ({
  companyName,
  roleName,
  currentStage = 0,
}: ResumeGenerationProgressProps) => {
  const progressPercentage = Math.min(20 + (currentStage * 16), 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <img 
              src={logo} 
              alt="Tweaker Logo" 
              className="h-10 md:h-12 w-auto animate-fade-in-up transition-transform duration-300 group-hover:scale-105"
            />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              Tweaking Your documents
            </CardTitle>
            <p className="text-muted-foreground">
              AI is analyzing the job description and tweaking your documents for{" "}
              <span className="font-semibold text-foreground">{roleName}</span> at{" "}
              <span className="font-semibold text-foreground">{companyName}</span>
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progressPercentage}% Complete
            </p>
          </div>

          {/* Stage List */}
          <div className="space-y-3">
            {STAGES.map((stage, index) => {
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;
              const isPending = index > currentStage;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-muted/30"
                  }`}
                >
                  {isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                  )}
                  {isPending && (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      isPending ? "text-muted-foreground" : "text-foreground"
                    } ${isCurrent ? "font-medium" : ""}`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
