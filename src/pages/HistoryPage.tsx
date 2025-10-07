import { JobHistory } from "@/components/JobHistory";

interface HistoryPageProps {
  userId: string;
}

export const HistoryPage = ({ userId }: HistoryPageProps) => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tweak History</h1>
        <p className="text-muted-foreground">View all your past job applications</p>
      </div>
      
      <JobHistory userId={userId} />
    </div>
  );
};
