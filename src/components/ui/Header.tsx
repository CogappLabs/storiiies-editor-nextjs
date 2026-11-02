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
      className={`${fullWidth ? "" : "max-w-6xl mx-auto"} px-4 py-6 flex items-center justify-between`}
    >
      <div className="flex items-center gap-4">
        {backLink && (
          <Link
            href={backLink.href}
            className="text-sm text-cogapp-cream hover:text-white"
          >
            ← {backLink.label}
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-cogapp-cream mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </header>
);

export default Header;
