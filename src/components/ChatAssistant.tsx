import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import tweakieAvatar from "@/assets/tweakie-avatar.png";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ChatAssistantProps {
  tweakedResumeId?: string;
  resumeData: any;
  coverLetter?: string;
  onUpdate: (updatedData: any, updatedCoverLetter?: string, changedSections?: string[]) => void;
  onClose?: () => void;
}

export const ChatAssistant = ({ tweakedResumeId, resumeData, coverLetter, onUpdate, onClose }: ChatAssistantProps) => {
  const getWelcomeMessage = (): Message[] => [{
    role: 'assistant',
    content: "👋 Hi! I'm Tweakie. I can suggest you changes that aligns with this job. Try asking me to:\n\n• Make your summary more impactful\n• Add or remove skills\n• Improve bullet points\n\nWhat would you like to improve?",
    timestamp: Date.now()
  }];
  
  const [messages, setMessages] = useState<Message[]>(getWelcomeMessage());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use a ref to always have the latest resume data
  const latestResumeDataRef = useRef(resumeData);
  const latestCoverLetterRef = useRef(coverLetter);
  
  // Update refs whenever props change
  useEffect(() => {
    latestResumeDataRef.current = resumeData;
  }, [resumeData]);
  
  useEffect(() => {
    latestCoverLetterRef.current = coverLetter;
  }, [coverLetter]);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      // If no tweakedResumeId, this is onboarding/preview mode - show welcome message
      if (!tweakedResumeId) {
        setMessages(getWelcomeMessage());
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setMessages(getWelcomeMessage());
          return;
        }

        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('tweaked_resume_id', tweakedResumeId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages = data.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime()
          }));
          setMessages(loadedMessages);
        } else {
          setMessages(getWelcomeMessage());
        }
      } catch (error) {
        setMessages(getWelcomeMessage());
      }
    };

    loadChatHistory();
  }, [tweakedResumeId]);

  // Save message to database
  const saveMessageToDB = async (role: string, content: string) => {
    // Only save to database if we have a tweakedResumeId (not in onboarding mode)
    if (!tweakedResumeId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        tweaked_resume_id: tweakedResumeId,
        role,
        content
      });
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const userMsg: Message = { role: 'user', content: userMessage, timestamp: Date.now() };
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    
    // Save user message to database
    await saveMessageToDB('user', userMessage);
    
    setIsLoading(true);

    try {
      // Always use the latest resume data from refs
      const currentResumeData = latestResumeDataRef.current;
      const currentCoverLetter = latestCoverLetterRef.current;
      
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: newMessages,
          resumeData: currentResumeData,
          coverLetter: currentCoverLetter
        }
      });

      if (error) throw error;

      // Add AI response
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // Save assistant message to database
      await saveMessageToDB('assistant', data.message);

      // If there are updates, apply them
      if (data.updatedData || data.updatedCoverLetter) {
        // Validate and merge updatedData if present
        let validatedData = data.updatedData;
        if (data.updatedData) {
          const requiredFields = ['name', 'email', 'phone'];
          const missingFields = requiredFields.filter(field => !data.updatedData[field]);
          
          if (missingFields.length > 0) {
            // Merge with current resume data to fill missing fields
            validatedData = {
              ...currentResumeData,
              ...data.updatedData
            };
          }
        }
        
        onUpdate(
          validatedData || currentResumeData,
          data.updatedCoverLetter || currentCoverLetter,
          data.changedSections
        );
        
        // Add system message with success indicator
        const systemMsg: Message = {
          role: 'system',
          content: '✅ Resume updated successfully. Changes are highlighted in the preview.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, systemMsg]);
        
        // Save system message to database
        await saveMessageToDB('system', systemMsg.content);
      }

    } catch (error) {
      const errorMsg: Message = {
        role: 'assistant',
        content: "I'm having trouble processing that request. Please try again or rephrase your question.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      // Save error message to database
      await saveMessageToDB('assistant', errorMsg.content);
      
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
    <Card className="h-full flex flex-col bg-white">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <img src={tweakieAvatar} alt="Tweakie" className="h-10 w-10 rounded-full object-cover" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Tweakie</h3>
              <p className="text-xs text-muted-foreground">AI-powered resume assistant</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-white" ref={scrollRef}>
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

      <div className="p-4 border-t bg-white">
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
            placeholder="Ask Tweakie..."
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
