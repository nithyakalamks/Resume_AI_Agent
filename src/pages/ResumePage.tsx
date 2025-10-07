import { ResumeManager } from "@/components/ResumeManager";

interface ResumePageProps {
  userId: string;
}

export const ResumePage = ({ userId }: ResumePageProps) => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Resume</h1>
        <p className="text-muted-foreground">Manage your base resume</p>
      </div>
      
      <ResumeManager userId={userId} onResumeChange={() => {}} />
    </div>
  );
};
