import { useParams } from "react-router-dom";
import { HistoryList } from "@/components/HistoryList";
import { TweakDetail } from "@/components/TweakDetail";

interface HistoryPageProps {
  userId: string;
}

export const HistoryPage = ({ userId }: HistoryPageProps) => {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {id ? (
          <TweakDetail userId={userId} tweakId={id} />
        ) : (
          <HistoryList userId={userId} />
        )}
      </div>
    </div>
  );
};
