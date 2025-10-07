import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface KeyCustomizationsProps {
  changesSummary: string[];
}

export const KeyCustomizations = ({ changesSummary }: KeyCustomizationsProps) => {
  const getCustomizationType = (change: string): { icon: string; label: string } => {
    const lowerChange = change.toLowerCase();
    if (lowerChange.includes("skill")) return { icon: "🎯", label: "Skills Matched" };
    if (lowerChange.includes("experience") || lowerChange.includes("bullet")) 
      return { icon: "📝", label: "Experience Enhanced" };
    if (lowerChange.includes("keyword")) return { icon: "🔑", label: "Keywords Added" };
    if (lowerChange.includes("summary")) return { icon: "📄", label: "Summary Optimized" };
    return { icon: "✨", label: "Content Improved" };
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">Key Customizations</h3>
          <p className="text-sm text-muted-foreground">
            Here's what we optimized for this role
          </p>
        </div>

        {changesSummary && changesSummary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {changesSummary.map((change, idx) => {
              const type = getCustomizationType(change);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div className="flex-1 space-y-1">
                      <Badge variant="secondary" className="text-xs">
                        {type.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{change}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Resume customized and optimized for this position.</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
