import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { Loader2, Flame, BookOpen, HelpCircle, Layers, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Analytics() {
  const { data: stats, isLoading } = trpc.analytics.getStats.useQuery();
  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const scoreData = stats?.scoreOverTime || [];
  const hasScoreData = scoreData.length > 0;
  const trend = scoreData.length >= 2 ? scoreData[scoreData.length - 1].score - scoreData[0].score : 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><TrendingUp className="h-7 w-7 text-primary" />Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your study progress</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg"><Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" /></div><div><p className="text-sm text-muted-foreground">Study Streak</p><p className="text-2xl font-bold">{stats?.currentStreak || 0} days</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-muted-foreground">Study Sessions</p><p className="text-2xl font-bold">{stats?.totalStudySessions || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg"><HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div><div><p className="text-sm text-muted-foreground">Avg Quiz Score</p><p className="text-2xl font-bold">{stats?.averageScore || 0}%</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg"><Layers className="h-5 w-5 text-green-600 dark:text-green-400" /></div><div><p className="text-sm text-muted-foreground">Flashcards</p><p className="text-2xl font-bold">{stats?.masteredFlashcards || 0}/{stats?.totalFlashcards || 0}</p></div></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">Quiz Score Trend {hasScoreData && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}</CardTitle></CardHeader>
          <CardContent>
            {hasScoreData ? (
              <ResponsiveContainer width="100%" height={200}><LineChart data={scoreData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="attempt" /><YAxis domain={[0, 100]} /><Tooltip formatter={(v: any) => [`${v}%`, "Score"]} labelFormatter={(l) => `Attempt ${l}`} /><Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} /></LineChart></ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[200px] text-muted-foreground"><p>No quiz data yet. Take some quizzes!</p></div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Topics to Review</CardTitle></CardHeader>
          <CardContent>
            {stats?.weakTopics && stats.weakTopics.length > 0 ? (
              <div className="space-y-3">
                {stats.weakTopics.map((topic, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1"><span className="truncate">{topic.topic}</span><span className="text-muted-foreground">{topic.count} missed</span></div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (topic.count / (stats.weakTopics[0]?.count || 1)) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            ) : <div className="flex items-center justify-center h-[200px] text-muted-foreground"><p>No weak topics identified yet.</p></div>}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Flashcard Mastery</CardTitle></CardHeader>
        <CardContent>
          {stats?.totalFlashcards && stats.totalFlashcards > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span>{stats.masteredFlashcards} of {stats.totalFlashcards} mastered</span><span className="font-medium">{Math.round((stats.masteredFlashcards / stats.totalFlashcards) * 100)}%</span></div>
              <div className="h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(stats.masteredFlashcards / stats.totalFlashcards) * 100}%` }} /></div>
            </div>
          ) : <p className="text-muted-foreground text-center py-4">No flashcards yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
