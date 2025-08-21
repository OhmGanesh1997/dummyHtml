"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaGithub } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DownloadModal } from "../download-modal";

export function DownloadButton({ html }: { html: string }) {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["github-status"],
    queryFn: async () => {
      const res = await api.get("/me/github/status");
      return res.data;
    },
  });

  const handleConnect = () => {
    window.location.href = "/api/auth/github";
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
