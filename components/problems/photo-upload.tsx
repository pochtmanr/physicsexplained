"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function PhotoUpload() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("image", file);
      form.set("locale", locale);
      const res = await fetch("/api/problems/ocr", { method: "POST", body: form });
      const body = await res.json();
      if (res.status === 401) { window.location.href = `/${locale}/sign-in`; return; }
      if (res.status === 402) { setError("Daily upload limit reached. Upgrade for more uploads."); return; }
      if (!res.ok)            { setError(body.message ?? "Upload failed"); return; }

      if (body.kind === "match") {
        router.push(`/${locale}/${body.topicSlug.split("/")[0] ?? "classical-mechanics"}/${body.topicSlug}/problems/${body.problemId}?from=ocr`);
      } else if (body.kind === "fallthrough") {
        // Pre-fill the chat input with extracted text (set in URL hash).
        router.push(`/${locale}/ask?seed=${encodeURIComponent(body.statement)}`);
      } else {
        setError(body.message ?? "Could not parse image.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-neutral-300 hover:text-cyan-400">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={busy}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <span>{busy ? "Reading…" : "📷 Upload homework photo"}</span>
      {error && <span className="text-red-400">{error}</span>}
    </label>
  );
}
