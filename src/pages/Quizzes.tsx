import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { HelpCircle, Sparkles, Loader2, Play, Trash2, Check, X, AlertTriangle, Trophy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function Quizzes() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const { data: apiKeys } = trpc.settings.getApiKeys.useQuery();
  const { data: quizzes, isLoading } = trpc.quizzes.list.useQuery();
  const { data: attempts } = trpc.quizzes.getAttempts.useQuery();
  const hasKey = apiKeys?.geminiKey || apiKeys?.groqKey;

  const generateMutation = trpc.quizzes.generateWithAI.useMutation({
    onSuccess: (data) => { toast.success("Quiz generated!"); utils.quizzes.list.invalidate(); setActiveQuiz(data); setCurrentQuestion(0); setAnswers([]); setShowResult(false); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.quizzes.delete.useMutation({ onSuccess: () => utils.quizzes.list.invalidate() });
  const submitMutation = trpc.quizzes.submitAttempt.useMutation({ onSuccess: () => utils.quizzes.getAttempts.invalidate() });

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    const questions = activeQuiz?.questions as QuizQuestion[];
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((p) => p + 1); setSelectedAnswer(null);
    } else {
      let score = 0; const weakTopics: string[] = [];
      newAnswers.forEach((ans, idx) => { if (ans === questions[idx].correctIndex) score++; else weakTopics.push(questions[idx].question); });
      submitMutation.mutate({ quizId: activeQuiz.id, score, totalQuestions: questions.length, answers: newAnswers.map((ans, idx) => ({ question: questions[idx].question, selected: ans, correct: questions[idx].correctIndex, explanation: questions[idx].explanation })), weakTopics });
      setShowResult(true);
    }
  };

  if (activeQuiz && !showResult) {
    const questions = activeQuiz.questions as QuizQuestion[];
    const q = questions[currentQuestion];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <span className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
        </div>
        <Card><CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">{q.question}</h2>
          <RadioGroup value={selectedAnswer?.toString()} onValueChange={(v) => setSelectedAnswer(Number(v))} className="space-y-2">
            {q.options.map((opt: string, i: number) => (
              <div key={i} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value={i.toString()} id={`opt-${i}`} /><Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent></Card>
        <Button className="w-full" onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>{currentQuestion < questions.length - 1 ? "Next" : "Finish"}</Button>
      </div>
    );
  }

  if (showResult && activeQuiz) {
    const questions = activeQuiz.questions as QuizQuestion[];
    const score = answers.reduce((acc, ans, idx) => acc + (ans === questions[idx].correctIndex ? 1 : 0), 0);
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveQuiz(null)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <Card><CardContent className="pt-6 text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-3xl font-bold mt-2">{score}/{questions.length} ({pct}%)</p>
        </CardContent></Card>
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.correctIndex;
            return (
              <Card key={idx}><CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  {isCorrect ? <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-medium">{q.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">Your answer: {q.options[answers[idx]]}</p>
                    {!isCorrect && <><p className="text-sm text-green-600 mt-1">Correct: {q.options[q.correctIndex]}</p><p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded">{q.explanation}</p></>}
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><HelpCircle className="h-7 w-7 text-primary" />Quizzes</h1>
        <p className="text-muted-foreground mt-1">Generate and take quizzes to test your knowledge</p>
      </div>
      {hasKey ? (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Generate New Quiz</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Enter a topic..." value={topic} onChange={(e) => setTopic(e.target.value)} className="flex-1" />
              <Input type="number" min={1} max={20} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-20" />
              <Button onClick={() => generateMutation.mutate({ topic, questionCount })} disabled={generateMutation.isPending || !topic.trim()}>
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" />Generate</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm">Add an API key in <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/settings")}>Settings</Button> to generate quizzes.</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Quizzes</h2>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : quizzes && quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quizzes.map((quiz) => {
              const quizAttempts = attempts?.filter((a) => a.quizId === quiz.id) || [];
              const bestScore = quizAttempts.length > 0 ? Math.max(...quizAttempts.map((a) => (a.score / a.totalQuestions) * 100)) : null;
              return (
                <Card key={quiz.id}><CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground">{(quiz.questions as any[])?.length || 0} questions</p>
                      {bestScore !== null && <Badge variant={bestScore >= 80 ? "default" : bestScore >= 60 ? "secondary" : "destructive"} className="mt-1">Best: {Math.round(bestScore)}%</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => { setActiveQuiz(quiz); setCurrentQuestion(0); setAnswers([]); setShowResult(false); setSelectedAnswer(null); }}><Play className="h-4 w-4 mr-1" />Start</Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ id: quiz.id })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        ) : <p className="text-muted-foreground text-center py-8">No quizzes yet. Generate your first one!</p>}
      </div>
    </div>
  );
}
