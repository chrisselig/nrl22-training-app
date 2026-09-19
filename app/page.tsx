"use client";

import { SessionProvider, useSession } from "@/components/SessionProvider";
import { TargetForm } from "@/components/TargetForm";
import { TargetList } from "@/components/TargetList";
import { PageSettings } from "@/components/PageSettings";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { ExportButton } from "@/components/ExportButton";

function Builder() {
  const { session, addTarget, resetSession, hydrated } = useSession();

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
        Loading your session…
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 p-4 lg:grid-cols-[minmax(0,420px)_1fr] lg:p-6">
      <div className="space-y-4">
        <header>
          <h1 className="text-xl font-semibold">NRL22 Target Printer</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Build a course of fire, then export an exact-scale PDF to print on graph paper.
          </p>
        </header>

        <PageSettings />

        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Add a target
          </h2>
          <TargetForm onSubmit={addTarget} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Course of fire ({session.targets.length})
            </h2>
            {session.targets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear all targets and reset page settings?")) resetSession();
                }}
                className="text-xs font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
              >
                Reset session
              </button>
            )}
          </div>
          <TargetList />
        </section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Print preview
          </h2>
          <ExportButton />
        </div>
        <PreviewCanvas />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <Builder />
    </SessionProvider>
  );
}
