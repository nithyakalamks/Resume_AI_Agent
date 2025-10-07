import { ResumeManager } from "@/components/ResumeManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ResumePageProps {
  userId: string;
}

export const ResumePage = ({ userId }: ResumePageProps) => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">My Resume</h1>
          <p className="text-muted-foreground">Manage your base resume</p>
        </div>
      </div>
      
      <ResumeManager userId={userId} onResumeChange={() => {}} />
    </div>
  );
};
