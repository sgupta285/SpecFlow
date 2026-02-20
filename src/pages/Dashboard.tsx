import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  GitBranch,
  MessageSquare,
  Sparkles,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Run = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  created_at: string;
  title: string;
};

const LS_REPO = "specflow_repo_url";
const LS_RUNS = "specflow_runs";

function readRepoUrl() {
  return localStorage.getItem(LS_REPO) || "";
}

function readRuns(): Run[] {
  try {
    return JSON.parse(localStorage.getItem(LS_RUNS) || "[]");
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRepoUrl(readRepoUrl());
      setRuns(readRuns().slice(0, 10));
      setLoading(false);
    }, 250);
  }, []);

  const statusClass = (s: Run["status"]) => {
    if (s === "done") return "status-done";
    if (s === "running") return "status-running";
    if (s === "error") return "status-error";
    return "status-queued";
  };

  const canGenerate = useMemo(() => Boolean(repoUrl), [repoUrl]);

  const handleGeneratePlan = () => {
    if (!repoUrl) {
      toast({
        title: "Link a repo first",
        description: "Go to Sync GitHub to connect your repo.",
        variant: "destructive",
      });
      return;
    }
    navigate("/upload");
  };

  const handleSampleTranscript = () => {
    if (!repoUrl) {
      toast({
        title: "Link a repo first",
        description: "Go to Sync GitHub to connect your repo.",
        variant: "destructive",
      });
      return;
    }
    navigate("/upload", { state: { useSample: true } });
  };

  return (
    <AppLayout repoUrl={repoUrl || null}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* HERO */}
        <div className="hero-card mb-8">
          {/* overlay grid line vibe */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
            <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:64px_64px]" />
          </div>

          <div className="relative p-10 md:p-12">
            <div className="chip w-fit mb-6">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span className="text-muted-foreground">
                AI-powered spec generation
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
              Hey divij, ready to{" "}
              <span className="grad-text">ship faster?</span>
            </h1>

            <p className="mt-4 text-muted-foreground max-w-2xl text-base md:text-lg">
              Paste customer feedback, get a production-ready technical spec
              with exact files to change — in seconds.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={handleGeneratePlan}
                className="rounded-2xl px-5"
                disabled={!canGenerate}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate a Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handleSampleTranscript}
                className="rounded-2xl px-5"
                disabled={!canGenerate}
              >
                Try sample transcript
              </Button>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-4 text-sm font-semibold tracking-tight text-muted-foreground">
          QUICK ACTIONS
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link
            to="/sync"
            className="soft-card p-6 group hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-card/40 border border-border/70 backdrop-blur-xl flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>

              <div className="flex-1">
                <div className="text-base font-semibold group-hover:text-[hsl(var(--primary))] transition-colors">
                  Sync GitHub
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {repoUrl
                    ? "Update your connected repository"
                    : "Connect your repo for file-level suggestions"}
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors mt-1" />
            </div>
          </Link>

          <Link
            to="/upload"
            className="soft-card p-6 group hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-card/40 border border-border/70 backdrop-blur-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>

              <div className="flex-1">
                <div className="text-base font-semibold group-hover:text-[hsl(var(--primary))] transition-colors">
                  Upload Feedback
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Paste a transcript and generate a spec
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors mt-1" />
            </div>
          </Link>
        </div>

        {/* RECENT RUNS */}
        <div className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground">
          RECENT RUNS
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : runs.length > 0 ? (
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-border/70">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  to={`/runs/${run.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {run.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={statusClass(run.status)}>
                      {run.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(run.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="dashed-panel p-10 md:p-12 text-center relative overflow-hidden">
            <div className="mx-auto mb-6 h-16 w-16 rounded-3xl bg-card/40 border border-border/70 backdrop-blur-xl flex items-center justify-center">
              {/* BIG SF */}
              <span className="text-2xl font-extrabold tracking-tight grad-text">
                SF
              </span>
            </div>

            <div className="text-lg font-semibold">No runs yet</div>
            <div className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Your generated specs will appear here. Try a sample to see how it
              works.
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handleSampleTranscript}
                className="rounded-2xl px-5"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Try sample transcript
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
