import { useParams } from "react-router-dom";
import { JobHistory } from "@/components/JobHistory";

interface HistoryPageProps {
  userId: string;
}

export const HistoryPage = ({ userId }: HistoryPageProps) => {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <JobHistory userId={userId} selectedId={id} />
    </div>
  );
};
