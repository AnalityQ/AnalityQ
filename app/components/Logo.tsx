import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  href?: string;
  compact?: boolean;
};

function LogoContent({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-lockup ${compact ? "brand-lockup-compact" : ""}`}>
      <span className="logo-mark" aria-hidden="true">
        <Image
          src="/branding/analityq-mark-compact-clean.png"
          alt=""
          width={52}
          height={52}
          sizes="52px"
          className="brand-mark-image"
          unoptimized
        />
      </span>
      {!compact && <span className="brand-wordmark">
        Anality<span className="logo-q">Q</span>
      </span>}
    </span>
  );
}

export function Logo({ className = "", href = "/", compact = false }: LogoProps) {
  if (!href) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <LogoContent compact={compact} />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 ${className}`}
      aria-label="AnalityQ — strona główna"
    >
      <LogoContent compact={compact} />
    </Link>
  );
}
