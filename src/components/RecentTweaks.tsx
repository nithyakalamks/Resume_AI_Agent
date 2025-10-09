import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Eye, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface RecentTweaksProps {
  userId: string;
}

interface TweakItem {
  id: string;
  created_at: string;
  job_description: {
    company_name: string;
    role_name: string;
  };
}

export const RecentTweaks = ({ userId }: RecentTweaksProps) => {
  const [recentTweaks, setRecentTweaks] = useState<TweakItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTweaks();
  }, [userId]);

  const fetchRecentTweaks = async () => {
    try {
      const { data, error } = await supabase
        .from("tweaked_resumes")
        .select(`
          id,
          created_at,
          job_description:job_descriptions(company_name, role_name)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentTweaks(data as any || []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Applications</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4" />
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recentTweaks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
        <p className="text-muted-foreground">
          Start by creating your first tweaked resume above
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Applications</h2>
        {recentTweaks.length >= 3 && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/history">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recentTweaks.map((tweak) => (
          <Card key={tweak.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">
                  {tweak.job_description?.role_name || "Untitled Role"}
                </h3>
                <p className="text-muted-foreground line-clamp-1">
                  {tweak.job_description?.company_name || "Unknown Company"}
                </p>
              </div>

              <Badge variant="secondary" className="text-xs">
                {formatDistanceToNow(new Date(tweak.created_at), { addSuffix: true })}
              </Badge>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/dashboard/history?view=${tweak.id}`}>
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
