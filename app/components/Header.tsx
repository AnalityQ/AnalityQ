"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/lib/analityq-data";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020713]/78 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-20 w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Główna nawigacja">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/analizy" className="btn-primary">
            Zobacz analizy
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-button lg:hidden"
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? "translate-y-[7px] rotate-45" : ""} />
          <span className={open ? "opacity-0" : ""} />
          <span className={open ? "-translate-y-[7px] -rotate-45" : ""} />
        </button>
      </div>

      <div className={`mobile-panel lg:hidden ${open ? "mobile-panel-open" : ""}`}>
        <nav className="grid gap-2" aria-label="Nawigacja mobilna">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 grid gap-3">
          <Link href="/analizy" onClick={closeMenu} className="btn-primary justify-center">
            Zobacz analizy
          </Link>
        </div>
      </div>
    </header>
  );
}
