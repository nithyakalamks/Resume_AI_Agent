import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkillMatch {
  skill: string;
  relevance: number;
  reason: string;
}

export function calculateJobFitScore(
  matchingSkills: SkillMatch[],
  totalRequiredSkills: number,
  addedSkillsCount: number = 0
): number {
  if (!matchingSkills || matchingSkills.length === 0) return 0;
  if (totalRequiredSkills === 0) return 65; // fallback for edge cases
  
  // Calculate weighted score based on relevance
  const weightedScore = matchingSkills.reduce((sum, match) => 
    sum + match.relevance, 0
  );
  
  // Calculate percentage: (matched + added) / total required
  const totalMatchedSkills = matchingSkills.length + addedSkillsCount;
  const matchPercentage = (totalMatchedSkills / totalRequiredSkills) * 100;
  
  // Apply relevance weighting (boost for high-quality matches)
  const averageRelevance = weightedScore / matchingSkills.length;
  const relevanceBonus = (averageRelevance - 0.7) * 5; // Up to +1.5% for high-quality matches
  
  const finalScore = Math.min(
    Math.round(matchPercentage + Math.max(0, relevanceBonus)),
    100
  );
  
  return Math.max(0, finalScore);
}
