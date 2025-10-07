import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle2 } from "lucide-react";

interface ScoreAnalysisProps {
  originalScore?: number;
  customizedScore: number;
  skillMatches?: any;
}

export const ScoreAnalysis = ({ 
  originalScore = 65, 
  customizedScore,
  skillMatches 
}: ScoreAnalysisProps) => {
  const improvement = customizedScore - originalScore;
  
  const scoreBreakdown = [
    { label: "Skills Match", original: 60, customized: 95, weight: "35%" },
    { label: "Experience Relevance", original: 70, customized: 88, weight: "30%" },
    { label: "Keywords Optimization", original: 55, customized: 92, weight: "20%" },
    { label: "Format & Structure", original: 80, customized: 90, weight: "15%" },
  ];

  return (
    <div className="space-y-6">
      {/* Score Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Original Resume</p>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - originalScore / 100)}`}
                  className="text-muted-foreground"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground">
                  {originalScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-primary font-medium">Customized Resume</p>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">+{improvement}</span>
              </div>
            </div>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - customizedScore / 100)}`}
                  className="text-primary"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {customizedScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Score Breakdown</h3>
        <div className="space-y-6">
          {scoreBreakdown.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.weight}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Before</span>
                    <span>{item.original}%</span>
                  </div>
                  <Progress value={item.original} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-primary">After</span>
                    <span className="text-primary font-semibold">{item.customized}%</span>
                  </div>
                  <Progress value={item.customized} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Key Improvements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Improvements</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Enhanced Skills Section</p>
              <p className="text-sm text-muted-foreground">
                Added relevant technical skills and reorganized for better visibility
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Optimized Experience Descriptions</p>
              <p className="text-sm text-muted-foreground">
                Rewritten bullet points to highlight relevant achievements
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Strategic Keyword Integration</p>
              <p className="text-sm text-muted-foreground">
                Incorporated job-specific keywords throughout the resume
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
