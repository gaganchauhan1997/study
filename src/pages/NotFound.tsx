import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Card className="max-w-sm w-full text-center">
        <CardContent className="pt-6 space-y-4">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">Page not found</p>
          <Button onClick={() => navigate("/")}><Home className="h-4 w-4 mr-2" />Go Home</Button>
        </CardContent>
      </Card>
    </div>
  );
}
