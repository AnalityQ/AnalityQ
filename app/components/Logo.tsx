import Link from "next/link";

type LogoProps = {
  className?: string;
  href?: string;
};

function LogoContent() {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="logo-mark" aria-hidden="true">
        Q
      </span>
      <span className="text-[1.08rem] font-black text-white md:text-[1.2rem]">
        Anality<span className="logo-q">Q</span>
      </span>
    </span>
  );
}

export function Logo({ className = "", href = "/" }: LogoProps) {
  if (!href) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <LogoContent />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 ${className}`}
      aria-label="AnalityQ - strona główna"
    >
      <LogoContent />
    </Link>
  );
}
