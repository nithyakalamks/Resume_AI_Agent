import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

export const ProgressStepper = ({ steps, currentStep }: ProgressStepperProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-evenly">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-center" style={{ flex: index < steps.length - 1 ? '1' : '0 0 auto' }}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isCompleted && "bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent text-white shadow-lg",
                    isCurrent && "bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent text-white ring-4 ring-primary/30 shadow-xl animate-glow-pulse",
                    isUpcoming && "bg-muted text-muted-foreground border-2 border-muted-foreground/20"
                  )}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : step.id}
                </div>
                <div className="mt-3 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      isCurrent && "text-primary font-bold",
                      isCompleted && "text-foreground",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-4 rounded-full transition-all duration-500",
                    isCompleted ? "bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
