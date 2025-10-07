import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  stage: "uploading" | "parsing" | "complete";
  fileName?: string;
  tips?: string[];
}

const processingTips = [
  "Extracting your professional experience...",
  "Analyzing your skills and qualifications...",
  "Organizing your education and certifications...",
  "Preparing your resume for customization...",
];

export const UploadProgress = ({ stage, fileName, tips = processingTips }: UploadProgressProps) => {
  const getCurrentTip = () => {
    if (stage === "uploading") return "Uploading your resume...";
    if (stage === "parsing") {
      const tipIndex = Math.floor(Date.now() / 2000) % tips.length;
      return tips[tipIndex];
    }
    return "Resume processed successfully!";
  };

  const getProgress = () => {
    if (stage === "uploading") return 30;
    if (stage === "parsing") return 70;
    return 100;
  };

  return (
    <Card className="p-8 border-2">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          stage === "complete" ? "bg-accent/10" : "bg-primary/10"
        )}>
          {stage === "complete" ? (
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          ) : (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          )}
        </div>

        <div className="text-center space-y-2 w-full">
          <h3 className="text-xl font-semibold text-foreground">
            {stage === "complete" ? "All Set!" : "Processing Your Resume"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getCurrentTip()}
          </p>
          {fileName && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate max-w-xs">
                {fileName}
              </p>
            </div>
          )}
        </div>

        <div className="w-full space-y-2">
          <Progress value={getProgress()} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {getProgress()}% complete
          </p>
        </div>

        {stage === "complete" && (
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 w-full">
            <p className="text-sm text-center text-foreground">
              Your resume is ready to be tailored for any job!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
