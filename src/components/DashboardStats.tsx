import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText, Briefcase, CheckCircle } from "lucide-react";

interface DashboardStatsProps {
  userId: string;
}

export const DashboardStats = ({ userId }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    resumeCount: 0,
    applicationCount: 0,
    lastUpdated: null as string | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const [resumeData, applicationData] = await Promise.all([
        supabase
          .from("resumes")
          .select("id, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1),
        supabase
          .from("tweaked_resumes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      setStats({
        resumeCount: resumeData.data?.length || 0,
        applicationCount: applicationData.count || 0,
        lastUpdated: resumeData.data?.[0]?.updated_at || null,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted rounded w-1/4" />
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Resume Uploaded",
      value: stats.resumeCount > 0 ? "Ready" : "Not Yet",
      icon: FileText,
      color: stats.resumeCount > 0 ? "text-accent" : "text-muted-foreground",
    },
    {
      label: "Total Applications",
      value: stats.applicationCount.toString(),
      icon: Briefcase,
      color: "text-primary",
    },
    {
      label: "Status",
      value: stats.resumeCount > 0 ? "Active" : "Setup Required",
      icon: CheckCircle,
      color: stats.resumeCount > 0 ? "text-accent" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <Icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
