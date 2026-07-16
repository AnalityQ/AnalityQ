"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  databaseChangeEvent,
  getPublicDatabaseErrorMessage,
  getPublishedAnalyses,
} from "@/lib/database";
import type { PublicAnalysisSummary } from "@/lib/public-analysis";
import { EmptyState } from "./EmptyState";
import { MatchCard } from "./MatchCard";

export function HomePublishedAnalyses() {
  const [matches, setMatches] = useState<PublicAnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getPublishedAnalyses();
        if (active) setMatches(data.slice(0, 6));
      } catch (error) {
        if (active) {
          setMatches([]);
          setErrorMessage(getPublicDatabaseErrorMessage(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    window.addEventListener(databaseChangeEvent, load);
    return () => {
      active = false;
      window.removeEventListener(databaseChangeEvent, load);
    };
  }, []);

  if (loading) {
    return (
      <div>
        <p className="mb-4 text-sm font-bold text-cyan-100">Ładowanie analiz...</p>
        <div className="h-44 animate-soft-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Nie udało się wczytać raportów"
        description={errorMessage}
        action={
          <Link href="/analizy" className="btn-secondary justify-center">
            Przejdź do analiz
          </Link>
        }
      />
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Raporty pojawią się po aktualizacji listy analiz."
        description="Publiczna lista pokazuje wyłącznie opublikowane raporty AnalityQ."
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
