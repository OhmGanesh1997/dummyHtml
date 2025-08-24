import { Eye, MessageCircleCode, Download } from "lucide-react";
import JSZip from "jszip";

import Logo from "@/assets/logo.svg";

import { Button } from "@/components/ui/button";
import classNames from "classnames";
import Image from "next/image";
const TABS = [
  {
    value: "chat",
    label: "Chat",
    icon: MessageCircleCode,
  },
  {
    value: "preview",
    label: "Preview",
    icon: Eye,
  },
];

export function Header({
  tab,
  onNewTab,
  html,
}: {
  tab: string;
  onNewTab: (tab: string) => void;
  html: string;
}) {
  const handleDownload = async () => {
    const zip = new JSZip();
    let modifiedHtml = html;

    // 1) Extract and externalize <style> -> style.css
    const styleRegex = /<style>(.*?)<\/style>/s;
    const styleMatch = modifiedHtml.match(styleRegex);
    if (styleMatch && styleMatch[1]) {
      const cssContent = styleMatch[1].trim();
      zip.file("style.css", cssContent);
      modifiedHtml = modifiedHtml.replace(
        styleRegex,
        '<link rel="stylesheet" href="style.css">'
      );
    }

    // 2) Find all <img src="...">
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const imageUrls = [...modifiedHtml.matchAll(imgRegex)].map(m => m[1]);
    const uniqueImageUrls = [...new Set(imageUrls)];

    // Helpers
    const extFromMime = (mime?: string | null) => {
      switch (mime) {
        case "image/jpeg": return "jpg";
        case "image/png": return "png";
        case "image/gif": return "gif";
        case "image/webp": return "webp";
        case "image/svg+xml": return "svg";
        case "image/bmp": return "bmp";
        case "image/x-icon": return "ico";
        case "image/avif": return "avif";
        default: return undefined;
      }
    };
    const extFromUrl = (url: string) => {
      try {
        const u = new URL(url, typeof window !== "undefined" ? window.location.href : "http://localhost");
        const path = u.pathname || "";
        const base = path.split("/").pop() || "";
        const dot = base.lastIndexOf(".");
        if (dot > -1) return base.substring(dot + 1).toLowerCase().replace(/[^a-z0-9]+/g, "");
      } catch { }
      return undefined;
    };
    const usedNames = new Set<string>();
    const makeUniqueName = (base: string, ext: string) => {
      let idx = 1;
      let candidate = `${base}.${ext}`;
      while (usedNames.has(candidate)) {
        candidate = `${base}-${idx}.${ext}`;
        idx++;
      }
      usedNames.add(candidate);
      return candidate;
    };

    const imagesFolder = zip.folder("images");
    const replacements: { url: string; path: string }[] = [];

    if (imagesFolder) {
      for (let i = 0; i < uniqueImageUrls.length; i++) {
        const imageUrl = uniqueImageUrls[i];
        try {
          // Try to fetch even data: URIs (works in modern browsers). If a site blocks CORS, this will fail gracefully.
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.error(`Failed to fetch image: ${imageUrl}, status: ${response.status}`);
            continue;
          }

          const blob = await response.blob();

          // Decide extension
          const mimeExt = extFromMime(blob.type);
          const urlExt = extFromUrl(imageUrl);
          const ext = (mimeExt || urlExt || "png").replace(/[^a-z0-9]/g, "") || "png";

          // Base name: numbered to guarantee uniqueness
          const base = `img-${String(i + 1).padStart(3, "0")}`;

          const filename = makeUniqueName(base, ext);
          const imagePath = `images/${filename}`;

          imagesFolder.file(filename, blob);

          replacements.push({ url: imageUrl, path: imagePath });
        } catch (err) {
          console.error(`Failed to download image: ${imageUrl}`, err);
        }
      }

      // Apply all replacements after downloads
      for (const { url, path } of replacements) {
        const imageUrlRegex = new RegExp(url.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
        modifiedHtml = modifiedHtml.replace(imageUrlRegex, path);
      }
    }

    // 3) Write index.html
    zip.file("index.html", modifiedHtml);

    // 4) Save zip
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deepsite.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <header className="border-b bg-slate-200 border-slate-300 dark:bg-neutral-950 dark:border-neutral-800 px-3 lg:px-6 py-2 flex items-center max-lg:gap-3 justify-between lg:grid lg:grid-cols-3 z-20">
      <div className="flex items-center justify-start gap-3">
        <h1 className="text-neutral-900 dark:text-white text-lg lg:text-xl font-bold flex items-center justify-start">
          <Image
            src={Logo}
            alt="DeepSite Logo"
            className="size-6 lg:size-8 mr-2 invert-100 dark:invert-0"
          />
          <p className="max-md:hidden flex items-center justify-start">
            DeepSite
            <span className="font-mono bg-gradient-to-br from-sky-500 to-emerald-500 text-neutral-950 rounded-full text-xs ml-2 px-1.5 py-0.5">
              {" "}
              v2
            </span>
          </p>
        </h1>
      </div>
      <div className="flex items-center justify-start lg:justify-center gap-1 max-lg:pl-3 flex-1 max-lg:border-l max-lg:border-l-neutral-800">
        {TABS.map((item) => (
          <Button
            key={item.value}
            variant={tab === item.value ? "secondary" : "ghost"}
            className={classNames("", {
              "opacity-60": tab !== item.value,
            })}
            size="sm"
            onClick={() => onNewTab(item.value)}
          >
            <item.icon className="size-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="size-4" />
          <span className="hidden md:inline">Download</span>
        </Button>
      </div>
    </header>
  );
}
