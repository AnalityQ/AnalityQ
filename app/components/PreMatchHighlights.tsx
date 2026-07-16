import type { FootballAnalysisSnapshot } from "@/lib/football-api/types";
import { localizePublicText, localizeTeamName } from "@/lib/countries";
import { contextualSnapshotContent } from "@/lib/football-api/match-context";
import { contextualSamples } from "@/lib/football-api/venue-context";
import { predictTeamLineup } from "@/lib/football-api/predicted-lineup";

function lineupStatus(snapshot: FootballAnalysisSnapshot) {
  if (snapshot.lineups.official && snapshot.lineups.teams.every((team) => team.startXI.length >= 11)) {
    return "Oficjalne składy są dostępne";
  }
  if (snapshot.lineups.historicalStarters.length === 2 && snapshot.lineups.historicalStarters.every((team) =>
    predictTeamLineup(team, snapshot.injuries, snapshot.playerInsights).available,
  )) {
    return "Dostępne przewidywanie na podstawie ostatnich składów";
  }
  if (snapshot.lineups.historicalStarters.some((team) => team.players.length > 0)) {
    return "Dostępni najczęściej rozpoczynający zawodnicy";
  }
  return "Brak wystarczających danych o składach";
}

export function PreMatchHighlights({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const contextual = contextualSnapshotContent(snapshot);
  const signals = contextual.signals.slice(0, 3);
  const risks = contextual.risks.slice(0, 2);
  const samples = contextualSamples(snapshot);
  const homeVenue = samples.home.summary;
  const awayVenue = samples.away.summary;
  const homeName = localizeTeamName(snapshot.fixture.homeTeam.name);
  const awayName = localizeTeamName(snapshot.fixture.awayTeam.name);
  const advantage = contextual.venueContext.mode === "neutral"
    ? `${contextual.venueContext.reason} Porównanie wykorzystuje ostatnią formę ogólną obu drużyn.`
    : homeVenue.sampleSize > 0 && awayVenue.sampleSize > 0
    ? homeVenue.points === awayVenue.points
      ? "W próbkach dom/wyjazd obie drużyny zdobyły tyle samo punktów."
      : homeVenue.points > awayVenue.points
        ? `${homeName} ma przewagę w punktach zdobytych u siebie względem wyjazdowej próbki rywala.`
        : `${awayName} ma lepszy dorobek w wyjazdowej próbce niż gospodarz u siebie.`
    : "Brak wspólnej próby dom/wyjazd.";
  const table = snapshot.standings?.home && snapshot.standings.away
    ? `${localizeTeamName(snapshot.standings.home.teamName)}: ${snapshot.standings.home.rank}. miejsce · ${localizeTeamName(snapshot.standings.away.teamName)}: ${snapshot.standings.away.rank}. miejsce · różnica punktów: ${snapshot.standings.pointsDifference === null ? "brak danych" : Math.abs(snapshot.standings.pointsDifference)}.`
    : "Brak tabeli obejmującej obie drużyny.";
  const keyAbsence = snapshot.injuries.missing[0];
  const profile = signals.length
    ? signals.map((signal) => signal.title).slice(0, 3).join(" · ")
    : "Profil spotkania pojawi się, gdy obie drużyny będą miały wspólny zestaw danych.";

  return (
    <section id="najwazniejsze" className="prematch-highlights" aria-labelledby="prematch-title">
      <div className="prematch-heading">
        <p className="eyebrow">Szybki obraz</p>
        <h2 id="prematch-title">Najważniejsze przed meczem</h2>
      </div>
      <div className="prematch-grid">
        <article className="prematch-card prematch-card-wide">
          <span>3 najmocniejsze sygnały</span>
          {signals.length ? <ol>{signals.map((signal) => <li key={signal.id}><strong>{localizePublicText(signal.title)}</strong><p>{localizePublicText(signal.evidence)}</p></li>)}</ol> : <p>Brak wystarczających danych do wskazania sygnałów.</p>}
        </article>
        <article className="prematch-card">
          <span>Największe ryzyka</span>
          {risks.length ? <ul>{risks.map((risk) => <li key={risk.id}>{localizePublicText(risk.title)}</li>)}</ul> : <p>Nie wykryto konkretnego ryzyka liczbowego; nie oznacza to braku niepewności.</p>}
        </article>
        <article className="prematch-card"><span>{contextual.venueContext.label}</span><p>{advantage}</p></article>
        <article className="prematch-card"><span>Tabela</span><p>{table}</p></article>
        <article className="prematch-card"><span>Kluczowa absencja</span><p>{keyAbsence ? `${keyAbsence.playerName} · ${localizeTeamName(keyAbsence.teamName)}${keyAbsence.reason ? ` · ${keyAbsence.reason}` : ""}` : "Brak potwierdzonej kluczowej absencji w dostępnych danych."}</p></article>
        <article className="prematch-card"><span>Status składów</span><p>{lineupStatus(snapshot)}</p></article>
        <article className="prematch-card prematch-card-wide"><span>Profil spotkania</span><p>{localizePublicText(profile)}</p></article>
      </div>
    </section>
  );
}
