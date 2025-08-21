/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function ImportButton({
  onSuccess,
}: {
  onSuccess: (html: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [spaceId, setSpaceId] = useState("");

  const importFromSpace = async () => {
    if (!spaceId) {
      toast.error("Please enter a Space ID.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/import", {
        space_id: spaceId,
      });
      if (res.data.ok) {
        onSuccess(res.data.html);
        toast.success("Successfully imported from Hugging Face Space!");
      } else {
        toast.error(res?.data?.message || "Failed to import from Space");
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
            <Download className="size-4 mr-2" />
            Import from Hugging Face
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
            Import from Hugging Face
          </p>
          <p className="text-sm text-neutral-500 mt-1.5">
            Enter the Space ID to import the `index.html` file.
          </p>
        </header>
        <main className="space-y-4 p-6">
          <div>
            <p className="text-sm text-neutral-700 mb-2">
              Enter the Space ID (e.g., username/space-name):
            </p>
            <Input
              type="text"
              placeholder="username/space-name"
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="!bg-white !border-neutral-300 !text-neutral-800 !placeholder:text-neutral-400 selection:!bg-blue-100"
            />
          </div>
          <div>
            <Button
              variant="black"
              onClick={importFromSpace}
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
