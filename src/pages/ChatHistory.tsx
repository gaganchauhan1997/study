import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { History, Search, Trash2, MessageSquare, ArrowRight, Loader2, Brain } from "lucide-react";

export default function ChatHistory() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: chats, isLoading } = trpc.chat.list.useQuery();
  const { data: searchResults } = trpc.chat.search.useQuery({ query: searchQuery }, { enabled: searchQuery.length > 0 });
  const deleteMutation = trpc.chat.delete.useMutation({
    onSuccess: () => { toast.success("Chat deleted"); utils.chat.list.invalidate(); },
  });
  const displayedChats = searchQuery.length > 0 ? searchResults : chats;
  const getMessageCount = (messages: any) => (messages || []).length;
  const getLastMessage = (messages: any) => { const msgs = messages || []; if (msgs.length === 0) return "No messages"; const last = msgs[msgs.length - 1]; return last.content.slice(0, 100) + (last.content.length > 100 ? "..." : ""); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><History className="h-7 w-7 text-primary" />Chat History</h1>
        <p className="text-muted-foreground mt-1">All your AI tutor conversations</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <div className="space-y-3">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : displayedChats && displayedChats.length > 0 ? displayedChats.map((chat) => (
          <Card key={chat.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/tutor")}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold truncate">{chat.title}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{getMessageCount(chat.messages)} messages</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{getLastMessage(chat.messages)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(chat.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate("/tutor"); }}><ArrowRight className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: chat.id }); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{searchQuery.length > 0 ? "No matching conversations" : "No chats yet. Start a conversation!"}</p>
            {searchQuery.length === 0 && <Button className="mt-3" onClick={() => navigate("/tutor")}>Go to AI Tutor</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
