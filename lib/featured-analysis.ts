import type { MatchAnalysisRecord } from "./types";

function kickoffTime(analysis: MatchAnalysisRecord) {
  const time = new Date(analysis.basic.kickoff).getTime();
  return Number.isFinite(time) ? time : null;
}

function byNearestKickoff(a: MatchAnalysisRecord, b: MatchAnalysisRecord) {
  const aTime = kickoffTime(a) ?? Number.MAX_SAFE_INTEGER;
  const bTime = kickoffTime(b) ?? Number.MAX_SAFE_INTEGER;
  return aTime - bTime || a.slotNumber - b.slotNumber;
}

export function selectFeaturedAnalysis(
  analyses: MatchAnalysisRecord[],
  now = new Date(),
) {
  const published = analyses.filter((analysis) => analysis.publicationStatus === "published");
  const selected = published
    .filter((analysis) => analysis.featuredType === "match_of_the_day")
    .sort(byNearestKickoff)[0];
  if (selected) return selected;

  const nowTime = now.getTime();
  const future = published
    .filter((analysis) => {
      const time = kickoffTime(analysis);
      return time !== null && time >= nowTime;
    })
    .sort(byNearestKickoff)[0];
  if (future) return future;

  const past = published
    .filter((analysis) => kickoffTime(analysis) !== null)
    .sort((a, b) => (kickoffTime(b) ?? 0) - (kickoffTime(a) ?? 0))[0];
  return past ?? published.sort((a, b) => a.slotNumber - b.slotNumber)[0] ?? null;
}
