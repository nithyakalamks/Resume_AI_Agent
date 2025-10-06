import { useState, useEffect } from "react";
import { Upload, FileText, Sparkles, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ResumePreview } from "@/components/ResumePreview";
import { TailoredResumeView } from "@/components/TailoredResumeView";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [tailoredResume, setTailoredResume] = useState<any>(null);
  const [tailoredData, setTailoredData] = useState<any>(null);
  const [changesSummary, setChangesSummary] = useState<string[]>([]);
  const [skillMatches, setSkillMatches] = useState<any[]>([]);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [tailoredVersions, setTailoredVersions] = useState<any[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Call parse-resume edge function
      const { data, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: { filePath: fileName }
      });

      if (parseError) throw parseError;

      setCurrentResumeId(data.resume_id);
      setParsedResume(data.parsed_data);
      
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been parsed. Now add a job description to tailor it.",
      });
      
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fetchTailoredVersions = async () => {
    if (!currentResumeId) return;
    
    try {
      const { data, error } = await supabase
        .from('tailored_resumes')
        .select(`
          *,
          job_descriptions (description, created_at)
        `)
        .eq('resume_id', currentResumeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTailoredVersions(data || []);
    } catch (error: any) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleTailorResume = async () => {
    if (!currentResumeId || !jobDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload a resume and enter a job description.",
        variant: "destructive",
      });
      return;
    }

    setIsTailoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('tailor-resume', {
        body: { 
          resumeId: currentResumeId, 
          jobDescription: jobDescription 
        }
      });

      if (error) throw error;

      setTailoredData(data.tailored_data);
      setChangesSummary(data.changes_summary || []);
      setSkillMatches(data.skill_matches || []);
      setCoverLetter(data.cover_letter || "");
      setTailoredResume(data);

      // Refresh version history
      await fetchTailoredVersions();

      toast({
        title: "Resume tailored successfully!",
        description: `Made ${data.changes_summary?.length || 0} key changes to match the job.`,
      });
      
    } catch (error: any) {
      console.error('Tailor error:', error);
      toast({
        title: "Tailoring failed",
        description: error.message || "Failed to tailor resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const loadTailoredVersion = (version: any) => {
    setTailoredData(version.tailored_data);
    setChangesSummary([]);
    setSkillMatches([]);
    setCoverLetter(version.cover_letter || "");
    setShowVersionHistory(false);
    
    toast({
      title: "Version loaded",
      description: "Viewing previous tailored version",
    });
  };

  useEffect(() => {
    if (currentResumeId) {
      fetchTailoredVersions();
    }
  }, [currentResumeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Tweaker
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Tailor Your Resume in Seconds
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your resume and job description. Our AI will create a perfectly tailored resume 
              and cover letter that highlights your relevant skills.
            </p>
          </div>

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Resume Upload */}
            <Card className="p-8 border-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Upload Resume</h3>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                  ${isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }
                `}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium mb-2">
                  {selectedFile ? selectedFile.name : 'Drop your resume here'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  or click to browse (PDF only)
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                  <Button 
                    onClick={handleUpload} 
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Parse Resume'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Job Description */}
            <Card className="p-8 border-2 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Job Description</h3>
              </div>

              <textarea
                placeholder="Paste the job description here..."
                className="w-full h-[200px] p-4 rounded-xl border-2 border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <Button 
                className="w-full mt-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                onClick={handleTailorResume}
                disabled={isTailoring || !currentResumeId || !jobDescription.trim()}
              >
                {isTailoring ? 'Analyzing...' : 'Analyze & Tailor'}
              </Button>
            </Card>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: FileText, title: "Smart Parsing", desc: "Extracts all details from your resume" },
              { icon: Sparkles, title: "AI Tailoring", desc: "Matches skills to job requirements" },
              { icon: Upload, title: "PDF Download", desc: "Get professional PDF outputs" },
            ].map((feature, i) => (
              <Card 
                key={i} 
                className="p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>

          {/* Resume Preview Section */}
          {parsedResume && !tailoredData && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your Resume Preview
              </h3>
              <ResumePreview data={parsedResume} />
            </div>
          )}

          {/* Tailored Resume View */}
          {tailoredData && parsedResume && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Tailored Resume
                </h3>
                {tailoredVersions.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Version History ({tailoredVersions.length})
                  </Button>
                )}
              </div>

              {showVersionHistory && (
                <Card className="p-6 mb-8">
                  <h4 className="font-semibold mb-4">Previous Versions</h4>
                  <div className="space-y-3">
                    {tailoredVersions.map((version) => (
                      <div 
                        key={version.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                        onClick={() => loadTailoredVersion(version)}
                      >
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {new Date(version.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm mt-1 line-clamp-1">
                            {version.job_descriptions?.description || 'Job description'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <TailoredResumeView 
                originalData={parsedResume}
                tailoredData={tailoredData}
                changesSummary={changesSummary}
                skillMatches={skillMatches}
              />

              {coverLetter && (
                <Card className="p-8 mt-8">
                  <h3 className="text-2xl font-bold mb-4 text-primary">Cover Letter</h3>
                  <div className="prose prose-sm max-w-none">
                    {coverLetter.split('\n').map((paragraph, idx) => (
                      paragraph.trim() && <p key={idx} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
