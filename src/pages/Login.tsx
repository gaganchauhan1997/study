import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Brain, Layers } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Study</h1>
          <p className="text-muted-foreground">Your AI-powered study companion</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-card border">
            <Brain className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">AI Tutor</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card border">
            <Layers className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">Flashcards</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card border">
            <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium">Quizzes</p>
          </div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in to access all features. Bring your own API key for AI features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => { window.location.href = getOAuthUrl(); }}>
              Sign in with Kimi
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Free to use. AI features require your own free Gemini or Groq API key.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
