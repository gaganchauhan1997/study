import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { Brain, Layers, HelpCircle, BarChart3, Flame, BookOpen, ArrowRight, Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = trpc.analytics.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    { icon: Brain, title: "AI Tutor", desc: "Get step-by-step help", path: "/tutor", color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { icon: Layers, title: "Flashcards", desc: `${stats?.totalFlashcards || 0} cards ready`, path: "/flashcards", color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" },
    { icon: HelpCircle, title: "Quizzes", desc: "Test your knowledge", path: "/quizzes", color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
    { icon: BarChart3, title: "Analytics", desc: `${stats?.currentStreak || 0} day streak`, path: "/analytics", color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your study companion overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg"><Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" /></div>
            <div><p className="text-sm text-muted-foreground">Study Streak</p><p className="text-2xl font-bold">{stats?.currentStreak || 0} days</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
            <div><p className="text-sm text-muted-foreground">Flashcards</p><p className="text-2xl font-bold">{stats?.totalFlashcards || 0}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg"><HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" /></div>
            <div><p className="text-sm text-muted-foreground">Quiz Avg</p><p className="text-2xl font-bold">{stats?.averageScore || 0}%</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg"><Layers className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
            <div><p className="text-sm text-muted-foreground">Mastered</p><p className="text-2xl font-bold">{stats?.masteredFlashcards || 0}</p></div>
          </div>
        </CardContent></Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(action.path)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.color}`}><action.icon className="h-5 w-5" /></div>
                    <div><p className="font-medium">{action.title}</p><p className="text-sm text-muted-foreground">{action.desc}</p></div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {stats?.weakTopics && stats.weakTopics.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Topics to Review</h3>
            <div className="space-y-2">
              {stats.weakTopics.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{topic.topic}</span>
                  <span className="text-sm text-muted-foreground">{topic.count} missed</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
