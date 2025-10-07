import { CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SuccessBannerProps {
  title: string;
  description?: string;
  className?: string;
}

export const SuccessBanner = ({ title, description, className }: SuccessBannerProps) => {
  return (
    <Card className={cn(
      "p-6 border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5 relative overflow-hidden",
      className
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
