import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download } from "lucide-react";
import { TailoredResumeView } from "@/components/TailoredResumeView";
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
  const { toast } = useToast();

  const extractJobDetails = (description: string) => {
    if (!description) return { title: 'Unknown Position', company: 'Unknown Company' };
    
    let title = 'Unknown Position';
    let company = 'Unknown Company';
    
    // Extract company name - look for common company indicators
    const companyMatch = description.match(/(?:at\s+|for\s+|Company:\s*)?([A-Z][a-zA-Z\s&]+?)(?:\s+powers|\s+is|\s+provides|,|\n)/);
    if (companyMatch) {
      const potentialCompany = companyMatch[1].trim();
      if (potentialCompany.length > 2 && potentialCompany.length < 50) {
        company = potentialCompany;
      }
    }
    
    // Extract title - look for "Title and Summary" section or similar patterns
    const titleSummaryMatch = description.match(/Title and Summary[\s\n]+([^\n]+)/i);
    if (titleSummaryMatch) {
      title = titleSummaryMatch[1].trim();
    } else {
      // Try other common patterns
      const jobTitleMatch = description.match(/(?:Position|Role|Job Title):\s*([^\n]+)/i);
      if (jobTitleMatch) {
        title = jobTitleMatch[1].trim();
      } else {
        // Look for lines that might be job titles (capitalized, reasonable length)
        const lines = description.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 5 && trimmed.length < 100 && 
              /^[A-Z]/.test(trimmed) && 
              !trimmed.includes('Our Purpose') &&
              !trimmed.includes('Overview') &&
              !trimmed.toLowerCase().startsWith('we ')) {
            title = trimmed;
            break;
          }
        }
      }
    }
    
    return { title, company };
  };

  const handleDownloadCoverLetter = async () => {
    if (!selectedVersion?.cover_letter) return;
    
    setDownloadingCover(true);
    try {
      const coverElement = document.getElementById('history-cover-letter-content');
      if (!coverElement) throw new Error('Cover letter content not found');

      const userName = selectedVersion.tailored_data?.name || 'User';
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
      .from("tailored_resumes")
      .select(`
        *,
        job_descriptions (description),
        resumes (parsed_data)
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

        <TailoredResumeView
          originalData={originalData}
          tailoredData={selectedVersion.tailored_data}
          changesSummary={[]}
          skillMatches={[]}
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
      <h2 className="text-2xl font-bold">Past Applications</h2>
      
      {history.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No past applications yet. Start applying to jobs to see your history here.
          </p>
        </Card>
      ) : (
        history.map((item) => {
          const jobDetails = extractJobDetails(item.job_descriptions?.description || '');
          return (
            <Card key={item.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{jobDetails.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{jobDetails.company}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};
