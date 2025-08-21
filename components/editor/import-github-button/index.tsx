/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { Github } from "lucide-react";

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function ImportGitHubButton({
  onSuccess,
}: {
  onSuccess: (html: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  const importFromGitHub = async () => {
    if (!repoUrl) {
      toast.error("Please enter a GitHub repository URL.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/import-github", {
        repoUrl,
      });
      if (res.data.ok) {
        onSuccess(res.data.html);
        toast.success("Successfully imported from GitHub repository!");
      } else {
        toast.error(res?.data?.message || "Failed to import from GitHub");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div>
          <Button variant="outline" className="max-lg:hidden !px-4">
            <Github className="size-4 mr-2" />
            Import from GitHub
          </Button>
          <Button variant="outline" size="sm" className="lg:hidden">
            Import
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="!rounded-2xl !p-0 !bg-white !border-neutral-200 min-w-xs text-center overflow-hidden"
        align="end"
      >
        <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
          <p className="text-xl font-semibold text-neutral-950">
            Import from GitHub
          </p>
          <p className="text-sm text-neutral-500 mt-1.5">
            Enter the repository URL to import the `index.html` file.
          </p>
        </header>
        <main className="space-y-4 p-6">
          <div>
            <p className="text-sm text-neutral-700 mb-2">
              Enter the repository URL (e.g., https://github.com/owner/repo):
            </p>
            <Input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="!bg-white !border-neutral-300 !text-neutral-800 !placeholder:text-neutral-400 selection:!bg-blue-100"
            />
          </div>
          <div>
            <Button
              variant="black"
              onClick={importFromGitHub}
              className="relative w-full"
              disabled={loading}
            >
              Import
              {loading && <Loading className="ml-2 size-4 animate-spin" />}
            </Button>
          </div>
        </main>
      </PopoverContent>
    </Popover>
  );
}
