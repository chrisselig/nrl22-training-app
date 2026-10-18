"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/props", label: "Props & Strategy" },
  { href: "/log", label: "Match Log" },
  { href: "/results", label: "Results" },
  { href: "/cof", label: "Course of Fire" },
  { href: "/wind", label: "Wind Reading" },
  { href: "/", label: "Target Printer" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-4 py-2 text-sm lg:px-6">
        <span className="mr-3 text-base font-black tracking-tight text-blue-600 dark:text-blue-400">
          NRL22
        </span>
        {NAV_LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
