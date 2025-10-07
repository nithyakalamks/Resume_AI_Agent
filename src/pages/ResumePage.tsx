import { ResumeManager } from "@/components/ResumeManager";

interface ResumePageProps {
  userId: string;
}

export const ResumePage = ({ userId }: ResumePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">My Resume</h1>
          <p className="text-muted-foreground">Manage your base resume</p>
        </div>
        
        <ResumeManager userId={userId} onResumeChange={() => {}} />
      </div>
    </div>
  );
};
