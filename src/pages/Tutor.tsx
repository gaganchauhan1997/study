import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/providers/trpc";
import { Send, Loader2, Brain, User, Plus, AlertTriangle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Tutor() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: apiKeys } = trpc.settings.getApiKeys.useQuery();
  const createChat = trpc.chat.create.useMutation({
    onSuccess: (data) => { setCurrentChatId(data.id); utils.chat.list.invalidate(); },
  });
  const sendMessage = trpc.chat.sendMessage.useMutation();

  const hasKey = apiKeys?.geminiKey || apiKeys?.groqKey;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    createChat.mutate({ title: "New Chat" });
  };

  const handleSend = async () => {
    if (!message.trim() || !currentChatId) return;
    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    try {
      const updated = await sendMessage.mutateAsync({ chatId: currentChatId, message: userMessage });
      setMessages(updated.messages as Message[]);
    } catch (err: any) {
      toast.error(err.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Explain photosynthesis step by step",
    "How do I solve quadratic equations?",
    "What is the difference between DNA and RNA?",
    "Help me understand derivatives in calculus",
  ];

  if (!hasKey) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-semibold">API Key Required</h2>
            <p className="text-muted-foreground">Please configure your Gemini or Groq API key in Settings to use the AI Tutor.</p>
            <Button onClick={() => navigate("/settings")}>Go to Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-6 w-6 text-primary" />AI Tutor</h1>
          <p className="text-sm text-muted-foreground">Step-by-step learning with Socratic questioning</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewChat}><Plus className="h-4 w-4 mr-2" />New Chat</Button>
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="p-4 bg-primary/10 rounded-full"><Brain className="h-8 w-8 text-primary" /></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">How can I help you learn today?</h3>
                <p className="text-muted-foreground mt-1">I explain concepts step-by-step and guide you to answers.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestedQuestions.map((q) => (
                  <Button key={q} variant="outline" className="text-left h-auto py-2 px-3 text-sm" onClick={() => { if (!currentChatId) { createChat.mutate({ title: "New Chat" }, { onSuccess: (data) => { setCurrentChatId(data.id); setMessage(q); }}); } else { setMessage(q); } }}>
                    <Lightbulb className="h-3 w-3 mr-2 shrink-0" />{q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Brain className="h-4 w-4 text-primary" /></div>}
                  <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>}
                </div>
              ))}
              {isLoading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Brain className="h-4 w-4 text-primary" /></div><div className="bg-muted rounded-lg p-3"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input placeholder="Ask me anything..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={isLoading || !currentChatId} className="flex-1" />
            <Button type="submit" disabled={isLoading || !message.trim() || !currentChatId}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
