import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ChatAssistantProps {
  resumeData: any;
  coverLetter?: string;
  onUpdate: (updatedData: any, updatedCoverLetter?: string, changedSections?: string[]) => void;
}

export const ChatAssistant = ({ resumeData, coverLetter, onUpdate }: ChatAssistantProps) => {
  const STORAGE_KEY = 'tweaker-chat-history';
  
  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    return [{
      role: 'assistant',
      content: "👋 Hi! I'm Tweaker's AI assistant. I can help you refine your resume and cover letter. Try asking me to:\n\n• Make your summary more impactful\n• Add leadership language\n• Emphasize specific skills\n• Improve bullet points\n\nWhat would you like to improve?",
      timestamp: Date.now()
    }];
  };

  const [messages, setMessages] = useState<Message[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: Date.now() }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: newMessages,
          resumeData,
          coverLetter
        }
      });

      if (error) throw error;

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now()
      }]);

      // If there are updates, apply them
      if (data.updatedData || data.updatedCoverLetter) {
        onUpdate(
          data.updatedData || resumeData,
          data.updatedCoverLetter || coverLetter,
          data.changedSections
        );
        
        // Add system message
        setMessages(prev => [...prev, {
          role: 'system',
          content: '✅ Resume updated successfully. Changes are highlighted in the preview.',
          timestamp: Date.now()
        }]);
        
        toast({
          title: "Changes applied",
          description: "Your resume has been updated. Check the highlighted sections.",
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble processing that request. Please try again or rephrase your question.",
        timestamp: Date.now()
      }]);
      
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Chat with Tweaker</h3>
            <p className="text-xs text-muted-foreground">AI-powered resume assistant</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 
                msg.role === 'system' ? 'justify-center' : 
                'justify-start'
              }`}
            >
              <div
                className={`rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'max-w-[80%] bg-gradient-to-br from-primary to-primary/80 text-white'
                    : msg.role === 'system'
                    ? 'max-w-[90%] bg-accent/20 text-accent-foreground text-xs border border-accent/30'
                    : 'max-w-[80%] bg-white/80 backdrop-blur-sm border border-primary/20'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/80 backdrop-blur-sm border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Tweaker is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white/50 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Tweaker to improve your resume..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-gradient-to-br from-primary to-accent"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
};
