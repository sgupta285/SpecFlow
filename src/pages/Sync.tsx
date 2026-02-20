import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function Sync() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [repoUrl, setRepoUrl] = useState("");
  const [repoBranch, setRepoBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingProject, setExistingProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("projects")
      .select("id, repo_url, repo_branch")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingProject(data.id);
          setRepoUrl(data.repo_url);
          setRepoBranch(data.repo_branch ?? "");
        }
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      if (existingProject) {
        const { error } = await supabase
          .from("projects")
          .update({
            repo_url: repoUrl,
            repo_branch: repoBranch || null,
          })
          .eq("id", existingProject);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert({
          user_id: user.id,
          repo_url: repoUrl,
          repo_branch: repoBranch || null,
        });

        if (error) throw error;
      }

      toast({
        title: "Repo linked",
        description: "Your repository has been saved.",
      });

      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout repoUrl={repoUrl || null}>
      <div className="max-w-lg mx-auto px-6 py-10 animate-fade-in">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Sync GitHub
        </h1>

        <p className="text-muted-foreground text-sm mb-8">
          Connect your repository to generate targeted specs.
        </p>

        <div className="glass-card p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="repo_url">Repository URL *</Label>
              <Input
                id="repo_url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo_branch">Branch (optional)</Label>
              <Input
                id="repo_branch"
                value={repoBranch}
                onChange={(e) => setRepoBranch(e.target.value)}
                placeholder="main"
                className="font-mono text-sm"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Repo
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
