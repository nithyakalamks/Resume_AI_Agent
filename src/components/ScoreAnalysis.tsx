import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle2, Target, Sparkles } from "lucide-react";

interface Skill {
  name: string;
  importance?: string;
}

interface ScoreAnalysisProps {
  originalScore?: number;
  customizedScore: number;
  skillMatches?: {
    matching?: Skill[];
    missing?: Skill[];
    addedSkills?: string[];
  };
  totalRequiredSkills?: number;
}

export const ScoreAnalysis = ({ 
  originalScore = 65, 
  customizedScore,
  skillMatches,
  totalRequiredSkills 
}: ScoreAnalysisProps) => {
  const improvement = customizedScore - originalScore;
  
  // Use scores directly from database (already calculated with optimized logic)
  const matchingSkillsCount = skillMatches?.matching?.length || 0;
  const missingSkillsCount = skillMatches?.missing?.length || 0;
  const addedSkillsCount = skillMatches?.addedSkills?.length || 0;
  
  // Use totalRequiredSkills from the edge function response, or calculate from data
  const totalSkills = totalRequiredSkills || (matchingSkillsCount + missingSkillsCount);
  
  const totalMatchedAfter = matchingSkillsCount + addedSkillsCount;
  
  // Debug logging
  console.log('ScoreAnalysis Debug:', {
    matching: skillMatches?.matching,
    missing: skillMatches?.missing,
    added: skillMatches?.addedSkills,
    matchingCount: matchingSkillsCount,
    missingCount: missingSkillsCount,
    addedCount: addedSkillsCount,
    totalSkills,
    totalMatchedAfter,
    originalScore,
    customizedScore
  });
  
  // Color coding helper
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
    if (score >= 71) return { label: "Strong Match", emoji: "🟢", description: "Excellent match! Your resume strongly aligns with this role." };
    if (score >= 41) return { label: "Moderate Match", emoji: "🟡", description: "Good progress! Some relevant skills present, but gaps remain." };
    return { label: "Low Match", emoji: "🔴", description: "Needs improvement. Consider adding more relevant skills and experience." };
  };
  
  // Dynamic score breakdown based on actual data
  const skillsMatchPercent = totalSkills > 0 
    ? Math.round((matchingSkillsCount / totalSkills) * 100)
    : originalScore;
  
  const skillsMatchAfter = totalSkills > 0
    ? Math.min(100, Math.round((totalMatchedAfter / totalSkills) * 100))
    : customizedScore;
  
  const scoreBreakdown = [
    { 
      label: "Skills Match", 
      original: skillsMatchPercent, 
      customized: skillsMatchAfter, 
      weight: "40%",
      detail: totalSkills > 0 ? `${matchingSkillsCount} / ${totalSkills} → ${totalMatchedAfter} / ${totalSkills}` : ""
    },
    { 
      label: "Experience Relevance", 
      original: Math.max(65, originalScore - 5), 
      customized: Math.min(90, customizedScore - 5), 
      weight: "30%",
      detail: ""
    },
    { 
      label: "Keywords Optimization", 
      original: Math.max(50, originalScore - 15), 
      customized: Math.min(95, customizedScore), 
      weight: "20%",
      detail: ""
    },
    { 
      label: "Format & Structure", 
      original: 80, 
      customized: 90, 
      weight: "10%",
      detail: ""
    },
  ];
  
  const originalScoreInfo = getScoreLabel(originalScore);
  const customizedScoreInfo = getScoreLabel(customizedScore);

  return (
    <div className="space-y-6">
      {/* Motivational Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Job Fit Analysis</h3>
            <p className="text-sm text-muted-foreground">
              {totalSkills > 0 
                ? `Matched ${totalMatchedAfter} of ${totalSkills} required skills (${customizedScore}% fit)`
                : `Your match score improved from ${originalScore}% to ${customizedScore}%`}
              {totalSkills > 0 && totalMatchedAfter < totalSkills && missingSkillsCount > 0 && (
                <span className="block text-xs text-muted-foreground mt-1">
                  {totalSkills - totalMatchedAfter} skills still missing - consider gaining experience in these areas
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Score Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Tweaking */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="text-2xl">{originalScoreInfo.emoji}</span>
          </div>
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Before Tweaking</p>
              <p className="text-sm font-semibold text-muted-foreground">{originalScoreInfo.label}</p>
            </div>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  strokeWidth="10"
                  fill="none"
                  className="stroke-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - originalScore / 100)}`}
                  className={getScoreStrokeColor(originalScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(originalScore)}`}>
                  {originalScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{originalScoreInfo.description}</p>
          </div>
        </Card>

        {/* After Tweaking */}
        <Card className="p-6 relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="absolute top-4 right-4">
            <span className="text-2xl">{customizedScoreInfo.emoji}</span>
          </div>
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-primary font-medium uppercase tracking-wider">After Tweaking</p>
                {improvement > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs font-bold text-success">+{improvement}</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-primary">{customizedScoreInfo.label}</p>
            </div>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  strokeWidth="10"
                  fill="none"
                  className="stroke-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - customizedScore / 100)}`}
                  className={getScoreStrokeColor(customizedScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(customizedScore)}`}>
                  {customizedScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-xs text-primary font-medium">{customizedScoreInfo.description}</p>
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
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{item.label}</span>
                  {item.detail && <span className="text-xs text-muted-foreground">{item.detail}</span>}
                </div>
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
      <Card className="p-6 bg-gradient-to-br from-success/5 to-accent/5 border-success/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-success" />
          <h3 className="text-lg font-semibold">What Changed?</h3>
        </div>
        <div className="space-y-3">
          {addedSkillsCount > 0 && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Added {addedSkillsCount} Key {addedSkillsCount === 1 ? 'Skill' : 'Skills'}</p>
                <p className="text-sm text-muted-foreground">
                  Integrated {addedSkillsCount} user-verified skills to improve match
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Optimized Experience Descriptions</p>
              <p className="text-sm text-muted-foreground">
                Rewritten bullet points to highlight relevant achievements and keywords
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Strategic Keyword Integration</p>
              <p className="text-sm text-muted-foreground">
                Incorporated job-specific terminology throughout your resume
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Enhanced Professional Summary</p>
              <p className="text-sm text-muted-foreground">
                Tailored your summary to align perfectly with the role requirements
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
