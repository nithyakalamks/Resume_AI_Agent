import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Trash2 } from "lucide-react";
import { TweakedResumeView } from "@/components/TweakedResumeView";
import html2pdf from "html2pdf.js";

interface JobHistoryProps {
  userId: string;
}

export const JobHistory = ({ userId }: JobHistoryProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [downloadingCover, setDownloadingCover] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownloadCoverLetter = async () => {
    if (!selectedVersion?.cover_letter) return;
    
    setDownloadingCover(true);
    try {
      const coverElement = document.getElementById('history-cover-letter-content');
      if (!coverElement) throw new Error('Cover letter content not found');

      const userName = selectedVersion.tweaked_data?.name || 'User';
      const opt = {
        margin: 10,
        filename: `${userName.replace(/\s+/g, '_')}_Cover_Letter.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(coverElement).save();
      toast({ title: "Cover letter downloaded successfully" });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloadingCover(false);
    }
  };

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
    setSelectedVersion(version);
    setOriginalData(version.resumes?.parsed_data || null);
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

  if (selectedVersion) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedVersion(null)}>
          ← Back to History
        </Button>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Job Description</h3>
          <p className="text-sm text-muted-foreground">
            {selectedVersion.job_descriptions?.description || "No job description saved"}
          </p>
        </Card>

        <TweakedResumeView
          originalData={originalData}
          tweakedData={selectedVersion.tweaked_data}
          changesSummary={selectedVersion.changes_summary || []}
        />

        {selectedVersion.cover_letter && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Cover Letter</h3>
              <Button onClick={handleDownloadCoverLetter} disabled={downloadingCover}>
                <Download className="w-4 h-4 mr-2" />
                {downloadingCover ? "Generating PDF..." : "Download Cover Letter"}
              </Button>
            </div>
            <div id="history-cover-letter-content" className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{selectedVersion.cover_letter}</pre>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
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
  );
};
