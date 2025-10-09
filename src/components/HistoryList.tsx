import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2 } from "lucide-react";

interface HistoryListProps {
  userId: string;
}

export const HistoryList = ({ userId }: HistoryListProps) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tweaked_resumes")
      .select(`
        *,
        job_descriptions (description, company_name, role_name),
        resumes (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const handleView = (version: any) => {
    navigate(`/dashboard/history/${version.id}`);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("tweaked_resumes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Application deleted successfully",
      });
      
      await fetchHistory();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tweaks</h1>
        <p className="text-muted-foreground">View and manage your past resume tweaks</p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No past applications yet. Start applying to jobs to see your history here.
            </p>
          </Card>
        ) : (
          history.map((item) => {
            const companyName = item.job_descriptions?.company_name || 'Unknown Company';
            const roleName = item.job_descriptions?.role_name || 'Unknown Position';
            
            return (
              <Card key={item.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{roleName}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{companyName}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {new Date(item.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting === item.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
