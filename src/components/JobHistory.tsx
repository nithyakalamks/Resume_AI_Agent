import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download } from "lucide-react";
import { TailoredResumeView } from "@/components/TailoredResumeView";
import html2pdf from "html2pdf.js";
import { createPrintableCoverLetter } from "@/utils/pdfHelpers";

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

  const handleDownloadCoverLetter = async (coverLetter: string, name: string) => {
    setDownloadingCover(true);
    try {
      const filename = `${name.replace(/\s+/g, '_')}_Cover_Letter.pdf`;
      const printableHTML = createPrintableCoverLetter(coverLetter, name);

      const opt = {
        margin: [20, 20, 20, 20] as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: { 
          scale: 3,
          useCORS: true,
          letterRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const temp = document.createElement('div');
      temp.innerHTML = printableHTML;
      temp.style.position = 'absolute';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);

      await html2pdf().set(opt).from(temp).save();
      document.body.removeChild(temp);

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
              <Button onClick={() => handleDownloadCoverLetter(selectedVersion.cover_letter, selectedVersion.tailored_data?.name || 'User')} disabled={downloadingCover}>
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
        history.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.job_descriptions?.description || "No job description"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
