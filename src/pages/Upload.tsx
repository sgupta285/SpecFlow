import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

interface LocationState {
  useSample?: boolean;
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const state = location.state as LocationState | null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<{
    id: string;
    repo_url: string;
  } | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /* ------------------------------------------------ */
  /* Load Project */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!user) return;

    supabase
      .from("projects")
      .select("id, repo_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          toast({
            title: "No repo linked",
            description: "Please connect a repo first.",
            variant: "destructive",
          });
          navigate("/sync");
        } else {
          setProject(data);
        }
      });
  }, [user, navigate, toast]);

  /* ------------------------------------------------ */
  /* Save Feedback */
  /* ------------------------------------------------ */

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("feedback")
        .insert({
          project_id: project.id,
          title,
          content,
        })
        .select("id")
        .single();

      if (error) throw error;

      setFeedbackId(data.id);
      setSaved(true);

      toast({ title: "Feedback saved" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------ */
  /* Generate Plan (AI Call) */
  /* ------------------------------------------------ */

  const handleGenerate = async () => {
    if (!project || !feedbackId) return;

    setLoading(true);

    try {
      const { data: run, error: runError } = await supabase
        .from("runs")
        .insert({
          project_id: project.id,
          feedback_id: feedbackId,
          status: "running",
        })
        .select("id")
        .single();

      if (runError) throw runError;

      // SAFE API URL FALLBACK
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "AI server error");
      }

      const ai = await response.json();

      await supabase
        .from("runs")
        .update({
          status: "done",
          result_spec: ai.answer,
        })
        .eq("id", run.id);

      navigate(`/runs/${run.id}`);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to reach AI server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------ */

  return (
    <AppLayout repoUrl={project?.repo_url ?? null}>
      <div className="max-w-lg mx-auto px-6 py-10">
        <Link to="/dashboard" className="text-sm mb-6 inline-block">
          <ArrowLeft className="inline h-4 w-4 mr-1" />
          Back
        </Link>

        <div className="glass-card p-6">
          {!saved ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Feedback
              </Button>
            </form>
          ) : (
            <Button onClick={handleGenerate} disabled={loading} size="lg">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Plan
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
