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
import { Plus, Loader2, Sparkles, Brain, RotateCcw, ThumbsUp, ThumbsDown, BookOpen, AlertTriangle, Layers, Trash2, Edit3 } from "lucide-react";
import { useNavigate } from "react-router";

export default function Flashcards() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("all");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [reviewCard, setReviewCard] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const { data: apiKeys } = trpc.settings.getApiKeys.useQuery();
  const { data: allCards, isLoading } = trpc.flashcards.list.useQuery();
  const { data: dueCards } = trpc.flashcards.dueForReview.useQuery();

  const hasKey = apiKeys?.geminiKey || apiKeys?.groqKey;
  const generateMutation = trpc.flashcards.generateWithAI.useMutation({
    onSuccess: (data) => { toast.success(`Generated ${data.length} flashcards!`); utils.flashcards.list.invalidate(); utils.flashcards.dueForReview.invalidate(); setTopic(""); },
    onError: (err) => toast.error(err.message),
  });
  const createMutation = trpc.flashcards.create.useMutation({
    onSuccess: () => { toast.success("Flashcard created!"); utils.flashcards.list.invalidate(); setFront(""); setBack(""); },
  });
  const deleteMutation = trpc.flashcards.delete.useMutation({
    onSuccess: () => { utils.flashcards.list.invalidate(); utils.flashcards.dueForReview.invalidate(); },
  });
  const updateMutation = trpc.flashcards.update.useMutation({
    onSuccess: () => { utils.flashcards.list.invalidate(); setEditingCard(null); },
  });
  const reviewMutation = trpc.flashcards.review.useMutation({
    onSuccess: () => { utils.flashcards.list.invalidate(); utils.flashcards.dueForReview.invalidate(); setReviewCard(null); setShowAnswer(false); },
  });

  const handleReview = (quality: number) => { if (!reviewCard) return; reviewMutation.mutate({ id: reviewCard.id, quality }); };
  const displayedCards = activeTab === "due" ? dueCards : allCards;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Layers className="h-7 w-7 text-primary" />Flashcards</h1>
          <p className="text-muted-foreground mt-1">{allCards?.length || 0} total · {dueCards?.length || 0} due for review</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Cards</TabsTrigger>
          <TabsTrigger value="due">
            Due for Review
            {dueCards && dueCards.length > 0 && <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">{dueCards.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {hasKey ? (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Generate with AI</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Enter a topic (e.g., 'World War 2')" value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1" />
                  <Input type="number" min={1} max={30} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-20" />
                  <Button onClick={() => { if (!topic.trim()) return; generateMutation.mutate({ topic: topic.trim(), count }); }} disabled={generateMutation.isPending || !topic.trim()}>
                    {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" />Generate</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-6 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm">Add an API key in <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/settings")}>Settings</Button> to generate flashcards with AI.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Create Manually</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs mb-1 block">Front</Label><Textarea placeholder="Question..." value={front} onChange={(e) => setFront(e.target.value)} rows={2} /></div>
                <div><Label className="text-xs mb-1 block">Back</Label><Textarea placeholder="Answer..." value={back} onChange={(e) => setBack(e.target.value)} rows={2} /></div>
              </div>
              <Button onClick={() => { if (!front.trim() || !back.trim()) return; createMutation.mutate({ front: front.trim(), back: back.trim() }); }} disabled={createMutation.isPending || !front.trim() || !back.trim()} size="sm"><Plus className="h-4 w-4 mr-2" />Add</Button>
            </CardContent>
          </Card>

          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedCards?.map((card) => (
                <Card key={card.id} className="group">
                  <CardContent className="pt-4">
                    {editingCard === card.id ? (
                      <div className="space-y-2">
                        <Textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} rows={2} />
                        <Textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateMutation.mutate({ id: card.id, front: editFront, back: editBack })}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCard(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-xs">Lv.{card.repetitions}</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingCard(card.id); setEditFront(card.front); setEditBack(card.back); }}><Edit3 className="h-3 w-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteMutation.mutate({ id: card.id })}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        <p className="font-medium text-sm mb-1">{card.front}</p>
                        <p className="text-sm text-muted-foreground">{card.back}</p>
                        {activeTab === "due" && <Button size="sm" className="w-full mt-3" onClick={() => { setReviewCard(card); setShowAnswer(false); }}><Brain className="h-4 w-4 mr-2" />Review Now</Button>}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="due" className="space-y-4">
          {dueCards && dueCards.length > 0 ? (
            !reviewCard ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dueCards.map((card) => (
                  <Card key={card.id}>
                    <CardContent className="pt-4">
                      <p className="font-medium text-sm mb-2">{card.front}</p>
                      <Button size="sm" className="w-full" onClick={() => { setReviewCard(card); setShowAnswer(false); }}><Brain className="h-4 w-4 mr-2" />Review Now</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="max-w-lg mx-auto">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center"><p className="text-sm text-muted-foreground mb-2">Question</p><p className="text-lg font-medium">{reviewCard.front}</p></div>
                  {showAnswer ? (
                    <>
                      <div className="border-t pt-4 text-center"><p className="text-sm text-muted-foreground mb-2">Answer</p><p className="text-lg">{reviewCard.back}</p></div>
                      <div>
                        <p className="text-sm text-center text-muted-foreground mb-3">How well did you know this?</p>
                        <div className="grid grid-cols-4 gap-2">
                          <Button variant="destructive" size="sm" onClick={() => handleReview(1)}><ThumbsDown className="h-3 w-3 mr-1" />Hard</Button>
                          <Button variant="outline" size="sm" onClick={() => handleReview(3)}>Okay</Button>
                          <Button variant="secondary" size="sm" onClick={() => handleReview(4)}>Good</Button>
                          <Button size="sm" onClick={() => handleReview(5)}><ThumbsUp className="h-3 w-3 mr-1" />Easy</Button>
                        </div>
                      </div>
                    </>
                  ) : <Button className="w-full" variant="outline" onClick={() => setShowAnswer(true)}><RotateCcw className="h-4 w-4 mr-2" />Show Answer</Button>}
                </CardContent>
              </Card>
            )
          ) : (
            <div className="text-center py-12"><BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No cards due for review!</p></div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
