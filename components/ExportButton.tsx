"use client";

import { useState } from "react";
import { useSession } from "./SessionProvider";
import { buildTargetPdf, downloadPdf } from "@/lib/pdf/generate-target-pdf";

export function ExportButton() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setError(null);
    setBusy(true);
    try {
      const bytes = await buildTargetPdf(session);
      downloadPdf(bytes, "nrl22-targets.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={session.targets.length === 0 || busy}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {busy ? "Generating…" : "Export PDF"}
      </button>
      {error && (
        <p className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
