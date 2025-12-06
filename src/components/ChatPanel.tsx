import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendChatMessage, streamChatMessage } from '@/services/vssApi';
import type { VssChatMessage } from '@/types/vss';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  fileId: string | null;
  className?: string;
}

interface ChatMessage extends VssChatMessage {
  id: string;
  isStreaming?: boolean;
}

const QUICK_PROMPTS = [
  { label: 'Count People', prompt: 'How many people are visible in this video?' },
  { label: 'Find Hazards', prompt: 'Are there any hazards or dangers visible?' },
  { label: 'Describe Scene', prompt: 'Describe the current situation in the video.' },
  { label: 'Safe Routes', prompt: 'What is the safest approach route based on what you see?' },
];

export const ChatPanel = ({ fileId, className }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !fileId) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantId = `assistant-${Date.now()}`;

    try {
      if (useStreaming) {
        // Streaming mode
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          isStreaming: true,
        };
        setMessages(prev => [...prev, assistantMessage]);

        let fullContent = '';
        await streamChatMessage(
          {
            messages: messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content }),
            file_id: fileId,
            stream: true,
          },
          (chunk) => {
            fullContent += chunk;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: fullContent } : m
              )
            );
          },
          () => {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              )
            );
          }
        );
      } else {
        // Non-streaming mode
        const response = await sendChatMessage({
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content }),
          file_id: fileId,
        });

        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: response.choices[0]?.message.content || 'No response',
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [fileId, messages, useStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!fileId) {
    return (
      <div className={cn('panel h-full flex flex-col', className)}>
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="panel-title">AI Analysis</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Upload a video to enable AI analysis
        </div>
      </div>
    );
  }

  return (
    <div className={cn('panel h-full flex flex-col', className)}>
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="panel-title">AI Analysis</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-6 px-2 text-xs', useStreaming && 'text-primary')}
          onClick={() => setUseStreaming(!useStreaming)}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Stream
        </Button>
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">Quick Analysis:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt.label}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => sendMessage(prompt.prompt)}
                disabled={isLoading}
              >
                {prompt.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-lg p-2.5 text-sm',
                message.role === 'user'
                  ? 'bg-primary/10 ml-8'
                  : 'bg-muted mr-8'
              )}
            >
              <p className="text-xs font-medium mb-1 text-muted-foreground">
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />
              )}
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the video..."
            disabled={isLoading}
            className="flex-1 h-8 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 px-3"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
