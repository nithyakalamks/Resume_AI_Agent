import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Skill {
  skill: string;
  importance: "required" | "preferred" | "nice-to-have";
  related_skills?: string[];
}

interface SkillsReviewProps {
  jobSkills: Skill[];
  matchingSkills: string[];
  missingSkills: Skill[];
  onConfirm: (selectedSkills: string[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SkillsReview = ({
  jobSkills,
  matchingSkills,
  missingSkills,
  onConfirm,
  onCancel,
  loading = false,
}: SkillsReviewProps) => {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  const toggleSkill = (skill: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skill)) {
      newSelected.delete(skill);
    } else {
      newSelected.add(skill);
    }
    setSelectedSkills(newSelected);
  };

  const getImportanceBadge = (importance: string) => {
    const colors = {
      required: "destructive",
      preferred: "default",
      "nice-to-have": "secondary",
    } as const;
    return <Badge variant={colors[importance as keyof typeof colors]}>{importance}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Skill Gap Analysis
          </h3>
          <p className="text-muted-foreground">
            Review the skills required for this job and add any missing skills you actually have
          </p>
        </div>

        <Separator />

        {/* Matching Skills */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Skills You Already Have ({matchingSkills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchingSkills.map((skill) => (
              <Badge key={skill} variant="outline" className="border-green-600 text-green-600">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Missing Skills */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-5 h-5" />
            Missing Skills ({missingSkills.length})
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Select any skills below that you actually have but weren't detected in your resume
          </p>
          <div className="space-y-3">
            {missingSkills.map((item) => (
              <div
                key={item.skill}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={item.skill}
                  checked={selectedSkills.has(item.skill)}
                  onCheckedChange={() => toggleSkill(item.skill)}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label
                      htmlFor={item.skill}
                      className="font-medium cursor-pointer"
                    >
                      {item.skill}
                    </label>
                    {getImportanceBadge(item.importance)}
                  </div>
                  {item.related_skills && item.related_skills.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Related skills you have: {item.related_skills.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* All Job Requirements */}
        <div>
          <h4 className="font-semibold mb-3">All Skills Required for This Job</h4>
          <div className="space-y-2">
            {jobSkills.map((item) => (
              <div key={item.skill} className="flex items-center gap-2 text-sm">
                <span>{item.skill}</span>
                {getImportanceBadge(item.importance)}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onConfirm(Array.from(selectedSkills))}
            disabled={loading}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "Generating Resume..." : `Continue with ${selectedSkills.size} Added Skill${selectedSkills.size !== 1 ? 's' : ''}`}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};
