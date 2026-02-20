import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Download, FileCode, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";

interface RunData {
  id: string;
  status: string;
  result_files: { path: string; reason: string }[] | null;
  result_spec: string | null;
  cursor_prompt: string | null;
  error_message: string | null;
  created_at: string;
  project_id: string;
  feedback_id: string;
}

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [run, setRun] = useState<RunData | null>(null);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRun = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    const { data } = await supabase
      .from("runs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      setRun(data as RunData);

      const { data: fb } = await supabase
        .from("feedback")
        .select("title")
        .eq("id", data.feedback_id)
        .maybeSingle();

      if (fb) setFeedbackTitle(fb.title);

      const { data: proj } = await supabase
        .from("projects")
        .select("repo_url")
        .eq("id", data.project_id)
        .maybeSingle();

      if (proj) setRepoUrl(proj.repo_url);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    loadRun();
  }, [id, user, loadRun]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const downloadMd = () => {
    if (!run?.result_spec) return;
    const blob = new Blob([run.result_spec], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${feedbackTitle || "spec"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusClass = (s: string) => {
    if (s === "done") return "status-done";
    if (s === "running") return "status-running";
    if (s === "error") return "status-error";
    return "status-queued";
  };

  if (loading) {
    return (
      <AppLayout repoUrl={repoUrl}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-32 mb-8" />
        </div>
      </AppLayout>
    );
  }

  if (!run) {
    return (
      <AppLayout repoUrl={null}>
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <p className="text-muted-foreground">Run not found.</p>
          <Link
            to="/dashboard"
            className="text-primary text-sm mt-2 inline-block"
          >
            Back to dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isRunning = run.status === "running";

  return (
    <AppLayout repoUrl={repoUrl}>
      <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {feedbackTitle}
            </h1>
            <span className={`mt-2 ${statusClass(run.status)}`}>
              {run.status}
            </span>
          </div>

          {run.status === "done" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(run.result_spec ?? "", "PRD")}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy PRD
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  copyToClipboard(run.cursor_prompt ?? "", "Cursor prompt")
                }
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy for Cursor
              </Button>
              <Button variant="outline" size="sm" onClick={downloadMd}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download .md
              </Button>
            </div>
          )}
        </div>

        {isRunning ? (
          <div className="glass-card p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium">Analyzing feedback…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Files to Change
              </h2>

              {(run.result_files || []).map((file, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md bg-muted/50 border border-border mb-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-mono text-xs text-foreground truncate">
                      {file.path}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {file.reason}
                  </p>
                </div>
              ))}
            </div>

            <div className="glass-card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Technical Spec
              </h2>

              <div className="prose-spec">
                <ReactMarkdown>{run.result_spec || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
