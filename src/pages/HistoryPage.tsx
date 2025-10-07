import { JobHistory } from "@/components/JobHistory";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface HistoryPageProps {
  userId: string;
}

export const HistoryPage = ({ userId }: HistoryPageProps) => {
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
          <h1 className="text-3xl font-bold">Application History</h1>
          <p className="text-muted-foreground">View all your past job applications</p>
        </div>
      </div>
      
      <JobHistory userId={userId} />
    </div>
  );
};
