import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface JobFitScoreProps {
  score: number;
  onViewAnalysis: () => void;
}

export const JobFitScore = ({ score, onViewAnalysis }: JobFitScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 71) return "text-success";
    if (score >= 41) return "text-warning";
    return "text-destructive";
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 71) return "stroke-green-500";
    if (score >= 41) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 71) return "Strong match";
    if (score >= 41) return "Moderate match";
    return "Low match";
  };

  const getMessage = (score: number) => {
    if (score >= 71) return "Excellent match! Your customized resume is optimized for this role.";
    if (score >= 41) return "Good match! Your resume shows strong alignment with key requirements.";
    return "Room for improvement. Consider highlighting more relevant skills and experience.";
  };

  return (
    <Card className="p-6 animate-fade-in-up border-primary/20 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="50"
              strokeWidth="8"
              fill="none"
              className="stroke-muted"
            />
            <circle
              cx="56"
              cy="56"
              r="50"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - score / 100)}`}
              className={getScoreStrokeColor(score)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">Job Fit Score: {score}/100</h3>
          </div>
          <p className="text-muted-foreground">
            {getScoreLabel(score)}. {getMessage(score)}
          </p>
          <Button variant="outline" size="sm" onClick={onViewAnalysis} className="mt-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Detailed Analysis
          </Button>
        </div>
      </div>
    </Card>
  );
};
