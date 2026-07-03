import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { FolderOpen, Plus, Trash2, Edit3, ExternalLink, BookOpen, StickyNote, Link2, Loader2, Save, X } from "lucide-react";

export default function ResourceHub() {
  const utils = trpc.useUtils();
  const [activeFolder, setActiveFolder] = useState("All");
  const [isCreating, setIsCreating] = useState(false);
  const [editNote, setEditNote] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [folder, setFolder] = useState("General");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editFolder, setEditFolder] = useState("");

  const { data: notes, isLoading } = trpc.notes.list.useQuery();
  const createMutation = trpc.notes.create.useMutation({
    onSuccess: () => { toast.success("Note saved!"); utils.notes.list.invalidate(); setIsCreating(false); setTitle(""); setContent(""); setLink(""); setFolder("General"); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.notes.update.useMutation({
    onSuccess: () => { utils.notes.list.invalidate(); setEditNote(null); },
  });
  const deleteMutation = trpc.notes.delete.useMutation({ onSuccess: () => utils.notes.list.invalidate() });

  const folders = ["All", ...Array.from(new Set(notes?.map((n) => n.folder || "General").filter(Boolean) || []))];
  const filteredNotes = activeFolder === "All" ? notes : notes?.filter((n) => n.folder === activeFolder);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FolderOpen className="h-7 w-7 text-primary" />Resource Hub</h1>
          <p className="text-muted-foreground mt-1">Save notes and links organized by folder</p>
        </div>
        <Button onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 mr-2" />Add Resource</Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center justify-between"><span className="flex items-center gap-2"><Plus className="h-4 w-4" />New Resource</span><Button size="icon" variant="ghost" onClick={() => setIsCreating(false)}><X className="h-4 w-4" /></Button></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title..." /></div>
            <div><Label className="text-xs">Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Notes..." rows={3} /></div>
            <div><Label className="text-xs">Link</Label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." /></div>
            <div><Label className="text-xs">Folder</Label><Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Folder name..." /></div>
            <Button onClick={() => { if (!title.trim()) return; createMutation.mutate({ title: title.trim(), content: content.trim() || null, link: link.trim() || null, folder: folder || "General" }); }} disabled={createMutation.isPending || !title.trim()}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Resource
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeFolder} onValueChange={setActiveFolder}>
        <TabsList className="flex-wrap h-auto">
          {folders.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={activeFolder} className="mt-4">
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : filteredNotes && filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredNotes.map((note) => editNote === note.id ? (
                <Card key={note.id}><CardContent className="pt-4 space-y-2">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} />
                  <Input value={editLink} onChange={(e) => setEditLink(e.target.value)} />
                  <Input value={editFolder} onChange={(e) => setEditFolder(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: note.id, title: editTitle, content: editContent || null, link: editLink || null, folder: editFolder })}><Save className="h-3 w-3 mr-1" />Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditNote(null)}>Cancel</Button>
                  </div>
                </CardContent></Card>
              ) : (
                <Card key={note.id} className="group"><CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.link ? <Link2 className="h-4 w-4 text-blue-500 shrink-0" /> : <StickyNote className="h-4 w-4 text-yellow-500 shrink-0" />}
                        <h3 className="font-semibold truncate">{note.title}</h3>
                      </div>
                      {note.content && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{note.content}</p>}
                      {note.link && <a href={note.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />{note.link.slice(0, 50)}...</a>}
                      <Badge variant="outline" className="mt-2 text-xs">{note.folder}</Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditNote(note.id); setEditTitle(note.title); setEditContent(note.content || ""); setEditLink(note.link || ""); setEditFolder(note.folder); }}><Edit3 className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: note.id })}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          ) : <div className="text-center py-12"><BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No resources yet. Add your first note or link!</p></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
