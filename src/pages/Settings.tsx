import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/providers/trpc";
import { Key, ExternalLink, Check, Loader2, Sparkles, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const utils = trpc.useUtils();
  const { data: apiKeys, isLoading } = trpc.settings.getApiKeys.useQuery();
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [preferredModel, setPreferredModel] = useState<"gemini" | "groq">("gemini");
  const [validating, setValidating] = useState<string | null>(null);

  const saveKeys = trpc.settings.saveApiKeys.useMutation({
    onSuccess: () => { toast.success("API keys saved!"); utils.settings.getApiKeys.invalidate(); setGeminiKey(""); setGroqKey(""); },
    onError: (err) => toast.error(err.message),
  });
  const validateKey = trpc.settings.validateKey.useMutation();

  const handleValidate = async (provider: "gemini" | "groq", key: string) => {
    if (!key) return;
    setValidating(provider);
    try {
      const res = await validateKey.mutateAsync({ provider, key });
      toast.success(res.valid ? `${provider} key is valid!` : `${provider} key is invalid`);
    } catch (e: any) { toast.error(`Validation failed: ${e.message}`); }
    setValidating(null);
  };

  const handleSave = () => {
    saveKeys.mutate({ geminiKey: geminiKey || undefined, groqKey: groqKey || undefined, preferredModel });
  };

  const hasGemini = !!apiKeys?.geminiKey;
  const hasGroq = !!apiKeys?.groqKey;
  const hasAnyKey = hasGemini || hasGroq;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your AI API keys and preferences</p>
      </div>

      {!hasAnyKey && !isLoading && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">No API keys configured</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">AI features won't work until you add at least one API key. Both Gemini and Groq offer free tiers!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasAnyKey && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="font-medium text-green-800 dark:text-green-200">AI features are ready to use!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />AI API Keys (BYOK)</CardTitle>
          <CardDescription>Bring Your Own Key — encrypted in database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />Gemini API Key
                {hasGemini && <Badge variant="outline" className="text-green-600 border-green-600"><Check className="h-3 w-3 mr-1" />Saved</Badge>}
              </Label>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => window.open("https://aistudio.google.com/apikey", "_blank")}><ExternalLink className="h-3 w-3 mr-1" />Get free key</Button>
            </div>
            <div className="flex gap-2">
              <Input id="gemini-key" type="password" placeholder={hasGemini ? "••••••••••••••••" : "Paste Gemini API key"} value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="flex-1" />
              {geminiKey && <Button variant="outline" onClick={() => handleValidate("gemini", geminiKey)} disabled={validating === "gemini"}>{validating === "gemini" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}</Button>}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="groq-key" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />Groq API Key
                {hasGroq && <Badge variant="outline" className="text-green-600 border-green-600"><Check className="h-3 w-3 mr-1" />Saved</Badge>}
              </Label>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => window.open("https://console.groq.com/keys", "_blank")}><ExternalLink className="h-3 w-3 mr-1" />Get free key</Button>
            </div>
            <div className="flex gap-2">
              <Input id="groq-key" type="password" placeholder={hasGroq ? "••••••••••••••••" : "Paste Groq API key"} value={groqKey} onChange={(e) => setGroqKey(e.target.value)} className="flex-1" />
              {groqKey && <Button variant="outline" onClick={() => handleValidate("groq", groqKey)} disabled={validating === "groq"}>{validating === "groq" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}</Button>}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Preferred AI Model</Label>
            <Tabs value={preferredModel} onValueChange={(v) => setPreferredModel(v as "gemini" | "groq")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gemini" disabled={!hasGemini && !geminiKey}>Gemini</TabsTrigger>
                <TabsTrigger value="groq" disabled={!hasGroq && !groqKey}>Groq</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">This model will be used for all AI features</p>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saveKeys.isPending || (!geminiKey && !groqKey)}>
            {saveKeys.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save API Keys
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Info className="h-4 w-4" />About BYOK</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Study uses your own API keys to power AI features. This means:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>No usage limits imposed by us</li>
            <li>Your API keys are encrypted in our database</li>
            <li>Switch between Gemini and Groq anytime</li>
            <li>Both offer generous free tiers</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
