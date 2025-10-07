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
  skillMatches: SkillMatch[], 
  addedSkillsCount: number = 0
): number {
  if (!skillMatches || skillMatches.length === 0) return 65; // default fallback
  
  // Calculate based on skill relevance scores
  const totalRelevance = skillMatches.reduce((sum, match) => sum + match.relevance, 0);
  const averageRelevance = totalRelevance / skillMatches.length;
  const baseScore = Math.round(averageRelevance * 100);
  
  // Bonus for added skills (up to 10 points)
  const addedSkillsBonus = Math.min(addedSkillsCount * 2, 10);
  
  return Math.min(baseScore + addedSkillsBonus, 100);
}
