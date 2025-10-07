import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Wand2, 
  Send, 
  Brain, 
  Mail, 
  BarChart3, 
  Target, 
  Bell, 
  Zap,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Tweaker" className="h-8 w-8" />
            <span className="text-xl font-display font-bold text-foreground">Tweaker</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Log In
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent hover:opacity-90 transition-opacity"
              onClick={() => navigate("/")}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium border border-primary/20">
            <Sparkles className="w-4 h-4 mr-2 inline-block text-primary" />
            AI-Powered Resume Tweaking
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight">
            Land your next job faster!
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Stop wasting hours editing the same resume. Upload once, paste any job description, 
            and Tweaker instantly generates a tailored resume, cover letter, and even applies for you.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent hover:opacity-90 transition-opacity text-lg px-8"
              onClick={() => navigate("/")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/")}
            >
              Log In
            </Button>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-destructive" />
              <h3 className="font-display font-semibold text-lg text-foreground">Before Tweaker</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-destructive/50 mt-2 flex-shrink-0" />
                <span>6 tabs open with job portals</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-destructive/50 mt-2 flex-shrink-0" />
                <span>5 versions of your resume</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-destructive/50 mt-2 flex-shrink-0" />
                <span>Endless copy-paste</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-destructive/50 mt-2 flex-shrink-0" />
                <span>Zero clarity on what recruiters want</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold text-lg text-foreground">After Tweaker</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span>One smart resume</span>
                </li>
                <li className="flex items-start gap-3 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span>Auto-tailored for every role</span>
                </li>
                <li className="flex items-start gap-3 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span>Fresh Cover Letter</span>
                </li>
                <li className="flex items-start gap-3 text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span>Resume Fit Score — know your chances</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-b from-background to-secondary/20 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              From tweak to apply — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                icon: Upload,
                title: "Upload your base resume",
                description: "One-time upload. Any format works.",
                color: "primary"
              },
              {
                step: "2",
                icon: FileText,
                title: "Paste a job description",
                description: "Copy any JD from any job board.",
                color: "primary"
              },
              {
                step: "3",
                icon: Wand2,
                title: "Get tailored documents",
                description: "Resume + cover letter in seconds.",
                color: "accent"
              },
              {
                step: "4",
                icon: Send,
                title: "Auto-apply with one click",
                description: "We fill forms and track applications.",
                color: "accent"
              }
            ].map((item, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-card border border-border">
                <div className="mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-4 ${
                    item.color === "primary" ? "bg-gradient-to-r from-primary to-[hsl(169,48%,53%)]" : "bg-gradient-to-r from-accent to-accent-secondary"
                  }`}>
                    {item.step}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    item.color === "primary" ? "bg-primary/10" : "bg-accent/10"
                  }`}>
                    <item.icon className={`w-6 h-6 ${item.color === "primary" ? "text-primary" : "text-accent"}`} />
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent hover:opacity-90 transition-opacity"
              onClick={() => navigate("/")}
            >
              Try Tweaker — no manual edits ever again
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Why Job Seekers Love Tweaker
            </h2>
            <p className="text-lg text-muted-foreground">
              Smart features that get you noticed faster
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                emoji: "🧠",
                title: "AI-Powered Resume Tailoring",
                description: "Matches your skills to the job in seconds. No more guessing what keywords to add."
              },
              {
                icon: Mail,
                emoji: "✍️",
                title: "Smart Cover Letters",
                description: "Polished and personal every time. Customized to the role and company culture."
              },
              {
                icon: BarChart3,
                emoji: "📊",
                title: "Resume Fit Score",
                description: "See how well your resume aligns with the JD. Know your chances before you apply."
              },
              {
                icon: Target,
                emoji: "🎯",
                title: "Smart Suggestions",
                description: "Tweaker recommends what to add based on the job requirements you're missing."
              },
              {
                icon: Bell,
                emoji: "🔔",
                title: "Application Tracker",
                description: "Track every job from one dashboard. Never lose track of where you applied."
              },
              {
                icon: Zap,
                emoji: "🚀",
                title: "Auto-Apply",
                description: "We fill the application forms so you don't have to. Apply to 10x more jobs."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">
                  <span className="mr-2">{feature.emoji}</span>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-[hsl(169,48%,53%)] to-accent opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-block text-5xl mb-4">💼</div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
              Your dream job shouldn't depend on copy-paste skills.
            </h2>
            <p className="text-lg md:text-xl text-white/90">
              Let Tweaker personalize your resume, apply smarter, and get you noticed — automatically.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 transition-colors text-lg px-8"
                onClick={() => navigate("/")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free — No Credit Card Required
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
                onClick={() => navigate("/")}
              >
                Login to Continue
              </Button>
            </div>

            <p className="text-sm text-white/70 pt-4">
              Join thousands of job seekers who landed their dream roles with Tweaker
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Tweaker" className="h-5 w-5" />
              <span>Tweaker © 2025 | AI-powered job application assistant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
