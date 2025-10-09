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

  // Validate response structure based on user request
  const validateResponse = (userMessage: string, responseData: any): { valid: boolean; reason?: string } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if this is a modification request
    const modificationKeywords = [
      'add', 'remove', 'delete', 'update', 'change', 'modify', 'improve', 
      'edit', 'fix', 'enhance', 'optimize', 'replace', 'swap', 'rewrite'
    ];
    const isModificationRequest = modificationKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // If not a modification request, any response is valid
    if (!isModificationRequest) {
      return { valid: true };
    }
    
    // Check if request is about cover letter
    const isCoverLetterRequest = lowerMessage.includes('cover letter') || 
                                  lowerMessage.includes('cover-letter') ||
                                  lowerMessage.includes('coverletter');
    
    // Check if request is about resume
    const isResumeRequest = !isCoverLetterRequest && (
      lowerMessage.includes('resume') ||
      lowerMessage.includes('skill') ||
      lowerMessage.includes('experience') ||
      lowerMessage.includes('project') ||
      lowerMessage.includes('education') ||
      lowerMessage.includes('summary') ||
      lowerMessage.includes('intern') ||
      lowerMessage.includes('bullet') ||
      lowerMessage.includes('description')
    );
    
    // Validation rules
    if (isCoverLetterRequest) {
      if (!responseData.updatedCoverLetter) {
        return { 
          valid: false, 
          reason: 'Cover letter modification requested but no updatedCoverLetter in response' 
        };
      }
      if (responseData.updatedCoverLetter.length < 100) {
        return { 
          valid: false, 
          reason: 'updatedCoverLetter is too short (likely a placeholder)' 
        };
      }
      if (responseData.updatedCoverLetter.includes('<updated') || 
          responseData.updatedCoverLetter.includes('placeholder')) {
        return { 
          valid: false, 
          reason: 'updatedCoverLetter contains placeholder text' 
        };
      }
    }
    
    if (isResumeRequest) {
      if (!responseData.updatedData) {
        return { 
          valid: false, 
          reason: 'Resume modification requested but no updatedData in response' 
        };
      }
      // Check for required fields
      const requiredFields = ['name', 'email', 'skills', 'experience'];
      const missingFields = requiredFields.filter(field => !responseData.updatedData[field]);
      if (missingFields.length > 0) {
        return { 
          valid: false, 
          reason: `updatedData missing required fields: ${missingFields.join(', ')}` 
        };
      }
    }
    
    return { valid: true };
  };

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

    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError: any = null;

    try {
      // Always use the latest resume data from refs
      const currentResumeData = latestResumeDataRef.current;
      const currentCoverLetter = latestCoverLetterRef.current;
      
      // Retry loop
      let messagesForRetry = newMessages;
      
      while (attempt < MAX_RETRIES) {
        attempt++;
        
        console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} - Calling chat-assistant...`);
        
        const { data, error } = await supabase.functions.invoke('chat-assistant', {
          body: {
            messages: messagesForRetry,
            resumeData: currentResumeData,
            coverLetter: currentCoverLetter
          }
        });

        if (error) {
          lastError = error;
          console.error(`❌ Attempt ${attempt} failed with error:`, error);
          
          if (attempt < MAX_RETRIES) {
            console.log('⏳ Retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            continue;
          }
          throw error;
        }

        // Validate response structure
        const validation = validateResponse(userMessage, data);
        
        if (!validation.valid) {
          console.warn(`⚠️ Attempt ${attempt} - Invalid response:`, validation.reason);
          console.log('Response data:', data);
          
          if (attempt < MAX_RETRIES) {
            console.log('⏳ Retrying with correction message...');
            
            // Add a correction message to help the AI understand what went wrong
            const correctionMessage = {
              role: 'system' as const,
              content: `ERROR: Your previous response was invalid. ${validation.reason}. 

CRITICAL: You MUST include the "${userMessage.toLowerCase().includes('cover letter') ? 'updatedCoverLetter' : 'updatedData'}" field in your JSON response with the COMPLETE ${userMessage.toLowerCase().includes('cover letter') ? 'cover letter text' : 'resume data'}.

Do NOT just return a message. Return the FULL JSON structure with the ${userMessage.toLowerCase().includes('cover letter') ? 'complete cover letter' : 'complete resume'}.

Please try again and include the required field.`,
              timestamp: Date.now()
            };
            
            messagesForRetry = [...messagesForRetry, correctionMessage];
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            continue;
          }
          
          // Final attempt failed - show error and don't display the invalid message
          console.error('🚨 All retry attempts failed validation');
          
          const errorMsg: Message = {
            role: 'assistant',
            content: "I apologize, but I'm having trouble processing your request in the correct format. Could you please try rephrasing it? For example:\n\n• \"Remove the skill 'Documentation' from my resume\"\n• \"Add Python to my programming skills\"\n• \"Rewrite the first paragraph of my cover letter\"",
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, errorMsg]);
          await saveMessageToDB('assistant', errorMsg.content);
          
          toast({
            title: "Request Processing Failed",
            description: "Please try rephrasing your request more specifically.",
            variant: "destructive"
          });
          
          // Break out of the loop since we've exhausted all retries
          break;
        }
        
        console.log(`✅ Attempt ${attempt} - Response validated successfully`);

        // Add AI response only if validation passed
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
          
          // Add system message with success indicator - make it context-aware
          let successMessage = '✅ Updated successfully! Changes are highlighted in the preview.';
          
          const systemMsg: Message = {
            role: 'system',
            content: successMessage,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, systemMsg]);
          
          // Save system message to database
          await saveMessageToDB('system', systemMsg.content);
        }
        
        // Success - break out of retry loop
        break;
      }

    } catch (error) {
      console.error('🚨 Fatal error in handleSend:', error);
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
                <span className="text-xs text-muted-foreground">Tweakie is thinking...</span>
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
