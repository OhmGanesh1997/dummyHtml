"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Repo {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
}

export function DownloadModal({
  isOpen,
  onClose,
  html,
}: {
  isOpen: boolean;
  onClose: () => void;
  html: string;
}) {
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    data: reposData,
    isLoading: reposLoading,
    error: reposError,
  } = useQuery({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const res = await api.get<{ repos: Repo[] }>("/me/github/repos");
      return res.data;
    },
    enabled: isOpen,
  });

  const handleDownload = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository");
      return;
    }

    setLoading(true);
    try {
      await api.post("/me/github/download", {
        repoName: selectedRepo.name,
        owner: selectedRepo.owner.login,
        html,
      });
      toast.success("Code downloaded to your repository! 🎉");
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to download code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download to GitHub</DialogTitle>
        </DialogHeader>
        <div>
          {reposLoading && <p>Loading repositories...</p>}
          {reposError && <p className="text-red-500">Failed to load repositories</p>}
          {reposData && (
            <Select
              onValueChange={(value) => {
                const repo = reposData.repos.find((r) => r.id.toString() === value);
                setSelectedRepo(repo || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {reposData.repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.id.toString()}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={handleDownload} disabled={!selectedRepo || loading}>
              {loading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
