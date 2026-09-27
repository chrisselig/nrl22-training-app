import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Target Printer" },
  { href: "/props", label: "Props & Strategy" },
  { href: "/log", label: "Match Log" },
  { href: "/results", label: "Results" },
];

export function NavBar() {
  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 text-sm lg:px-6">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
