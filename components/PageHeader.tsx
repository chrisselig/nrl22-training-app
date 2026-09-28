import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-1.5 border-b border-neutral-200 pb-5 dark:border-neutral-800">
      <p className="text-xs font-semibold tracking-[0.14em] text-blue-600 uppercase dark:text-blue-400">
        {eyebrow}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {title}
      </h1>
      {children && (
        <p className="max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          {children}
        </p>
      )}
    </header>
  );
}
