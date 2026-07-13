"use client";

import Image from "next/image";
import { useState } from "react";

type ImageKind = "team" | "league" | "person";

export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function isAllowedApiImageUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "media.api-sports.io";
  } catch {
    return false;
  }
}

export function shouldRenderApiImage(value?: string | null, failed = false) {
  return !failed && isAllowedApiImageUrl(value);
}

function Fallback({ kind, label, size }: { kind: ImageKind; label: string; size: number }) {
  const content = initialsForName(label);
  return (
    <span
      className={`api-image-fallback api-image-fallback-${kind}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} — brak grafiki`}
    >
      {content}
    </span>
  );
}

export function ApiImage({
  src,
  alt,
  kind,
  size = 40,
  priority = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  kind: ImageKind;
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src && failedSrc === src);
  if (!shouldRenderApiImage(src, failed)) {
    return <Fallback kind={kind} label={alt} size={size} />;
  }
  return (
    <span className={`api-image-shell api-image-shell-${kind} ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src!}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className={kind === "person" ? "object-cover" : "object-contain"}
        priority={priority}
        onError={() => setFailedSrc(src || null)}
      />
    </span>
  );
}

export function TeamLogo(props: Omit<Parameters<typeof ApiImage>[0], "kind">) {
  return <ApiImage {...props} kind="team" />;
}

export function LeagueLogo(props: Omit<Parameters<typeof ApiImage>[0], "kind">) {
  return <ApiImage {...props} kind="league" />;
}

export function PersonPhoto(props: Omit<Parameters<typeof ApiImage>[0], "kind">) {
  return <ApiImage {...props} kind="person" />;
}

export function CountryLabel({
  code,
  name,
  compact = false,
  flagSrc,
}: {
  code?: string | null;
  name?: string | null;
  compact?: boolean;
  flagSrc?: string | null;
}) {
  return (
    <span className="country-label">
      {flagSrc ? (
        <ApiImage src={flagSrc} alt={name || "Flaga kraju"} kind="league" size={18} />
      ) : (
        <span className="country-code-fallback" aria-hidden="true">{code?.toUpperCase() || "NN"}</span>
      )}
      {!compact && <span>{name || "Nieznany kraj"}</span>}
      <span className="sr-only">{name || "Nieznany kraj"}</span>
    </span>
  );
}
