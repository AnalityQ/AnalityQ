import Link from "next/link";
import { disclaimer, navItems } from "@/lib/analityq-data";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020713]">
      <div className="section-shell !py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <Logo href="" />
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Sportowe raporty statystyczne, prawdopodobieństwa modelowe, edge, ryzyko i scenariusze
              spotkania w jednym przejrzystym produkcie.
            </p>
            <p className="mt-5 max-w-3xl rounded-xl border border-cyan-200/15 bg-cyan-200/[0.04] p-4 text-xs leading-6 text-slate-400">
              {disclaimer}
            </p>
            <p className="mt-4 text-xs font-semibold text-amber-200">AnalityQ</p>
          </div>

          <nav className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3" aria-label="Linki w stopce">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
