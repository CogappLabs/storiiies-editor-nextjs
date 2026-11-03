import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

interface HeaderProps<T extends string> {
  title: string;
  subtitle?: string;
  backLink?: { href: Route<T>; label: string };
  actions?: ReactNode;
  fullWidth?: boolean;
}

const Header = <T extends string>({
  title,
  subtitle,
  backLink,
  actions,
  fullWidth = false,
}: HeaderProps<T>) => (
  <header className="bg-cogapp-charcoal">
    <div
      className={`${fullWidth ? "" : "max-w-6xl mx-auto"} px-4 py-4 md:py-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {backLink && (
          <Link
            href={backLink.href}
            // On public preview pages the editor is behind basic auth, and a
            // prefetch 401 makes the browser show the login prompt.
            prefetch={false}
            className="text-sm text-cogapp-cream hover:text-white whitespace-nowrap"
          >
            ← {backLink.label}
          </Link>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-cogapp-cream mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  </header>
);

export default Header;
