"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaGithub } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DownloadModal } from "../download-modal";

export function DownloadButton({ html }: { html: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["github-status"],
    queryFn: async () => {
      const res = await api.get("/me/github/status");
      return res.data;
    },
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data === "github_auth_success") {
        queryClient.invalidateQueries({ queryKey: ["github-status"] });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [queryClient]);

  const handleConnect = () => {
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const url = "/api/auth/github";
    window.open(
      url,
      "GitHub Auth",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (!data?.connected) {
    return (
      <Button variant="outline" onClick={handleConnect}>
        <FaGithub className="mr-2" />
        Connect to GitHub
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setModalOpen(true)}>
        <FaGithub className="mr-2" />
        Download to GitHub
      </Button>
      <DownloadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        html={html}
      />
    </>
  );
}
