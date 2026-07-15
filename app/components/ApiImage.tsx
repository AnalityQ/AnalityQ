"use client";

import Image from "next/image";
import { useState } from "react";
import { GlobeHemisphereWest } from "@phosphor-icons/react";
import { countryFlagUrl, countryPresentation } from "@/lib/countries";
import { normalizeApiAssetUrl } from "@/lib/football-api/assets";

type ImageKind = "team" | "league" | "person";

export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function isAllowedApiImageUrl(value?: string | null) {
  return Boolean(normalizeApiAssetUrl(value));
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
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const safeSrc = normalizeApiAssetUrl(src);
  const failed = Boolean(safeSrc && failedSrc === safeSrc);
  if (!shouldRenderApiImage(safeSrc, failed)) {
    return <Fallback kind={kind} label={alt} size={size} />;
  }
  const loading = loadedSrc !== safeSrc;
  return (
    <span className={`api-image-shell api-image-shell-${kind} ${loading ? "is-loading" : "is-loaded"} ${className}`} style={{ width: size, height: size }}>
      <span className="api-image-loading" aria-hidden="true" />
      <Image
        src={safeSrc!}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className={kind === "person" ? "object-cover" : "object-contain"}
        preload={priority}
        unoptimized
        onLoad={() => setLoadedSrc(safeSrc)}
        onError={() => setFailedSrc(safeSrc)}
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
  const country = countryPresentation(name, code);
  const resolvedFlag = normalizeApiAssetUrl(flagSrc) || countryFlagUrl(country.countryName, country.countryCode);
  const label = country.countryName || "Nieznany kraj";
  return (
    <span className="country-label">
      {resolvedFlag ? (
        <ApiImage src={resolvedFlag} alt={`Flaga: ${label}`} kind="league" size={18} />
      ) : (
        <span className="country-globe-fallback" role="img" aria-label="Obszar międzynarodowy">
          <GlobeHemisphereWest size={14} weight="duotone" aria-hidden="true" />
        </span>
      )}
      {!compact && <span>{label}</span>}
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );
}
