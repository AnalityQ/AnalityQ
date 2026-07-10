"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMatches } from "@/lib/storage";
import type { MatchAnalysisRecord } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { MatchCard } from "./MatchCard";

export function HomePublishedAnalyses() {
  const [matches, setMatches] = useState<MatchAnalysisRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const load = () => {
      setMatches(getMatches().filter((match) => match.publicationStatus === "published").slice(0, 6));
      setMounted(true);
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("analityq-storage", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("analityq-storage", load);
    };
  }, []);

  if (!mounted) {
    return <div className="h-44 animate-soft-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />;
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Raporty pojawią się po aktualizacji listy analiz."
        description="Publiczna lista korzysta wyłącznie z analiz dodanych w panelu admina i oznaczonych jako published."
        action={
          <Link href="/analizy" className="btn-secondary justify-center">
            Przejdź do analiz
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
