import type { FullReportMetrics, MatchAnalysisRecord } from "./types";

function teamLabel(match: MatchAnalysisRecord) {
  if (match.basic.homeTeam && match.basic.awayTeam) {
    return `${match.basic.homeTeam} vs ${match.basic.awayTeam}`;
  }

  return "ten mecz";
}

function hasMissingData(calculated: FullReportMetrics) {
  return calculated.dataCompleteness.ratio < 0.78 || calculated.dataCompleteness.missingCritical;
}

export function generateKeySignals(match: MatchAnalysisRecord, calculated: FullReportMetrics) {
  const signals: string[] = [];

  if (calculated.maxPositiveEdge > 8) {
    signals.push(
      `Najsilniejszy sygnał value pojawia się na rynku ${calculated.bestValueMarket}, gdzie różnica między prawdopodobieństwem użytym przez model a prawdopodobieństwem z kursu jest wyraźna.`,
    );
  } else if (calculated.maxPositiveEdge >= 3) {
    signals.push(
      `Model wskazuje umiarkowany sygnał value na rynku ${calculated.bestValueMarket}. Warto czytać go razem z poziomem ryzyka i kompletnością danych.`,
    );
  }

  if (calculated.totalExpectedGoals !== null && calculated.totalExpectedGoals > 2.7) {
    signals.push(
      "Model wskazuje podwyższony potencjał bramkowy. Łączna wartość oczekiwanych goli przekracza standardowy próg dla meczu o profilu bramkowym.",
    );
  }

  if (calculated.expectedCorners !== null && calculated.expectedCorners > 9) {
    signals.push(
      "Dane rożnych sugerują wysoką aktywność bocznych sektorów i możliwy większy wolumen stałych fragmentów.",
    );
  }

  if (calculated.expectedCards !== null && calculated.expectedCards > 3.5) {
    signals.push(
      "Profil spotkania wskazuje na podwyższony potencjał kartek, szczególnie jeśli tempo meczu będzie przerywane faulami.",
    );
  }

  if (hasMissingData(calculated)) {
    signals.push(
      "Część danych wejściowych nie została uzupełniona, dlatego raport należy traktować jako wstępną analizę statystyczną.",
    );
  }

  if (signals.length === 0) {
    signals.push(
      `Dla meczu ${teamLabel(match)} model pokazuje zrównoważony profil analityczny bez jednego dominującego sygnału. Kluczowe pozostają kurs, edge, jakość danych i kontekst składowy.`,
    );
  }

  return signals;
}

export function generateModelSummary(match: MatchAnalysisRecord, calculated: FullReportMetrics) {
  const signals = generateKeySignals(match, calculated);
  const completeness = Math.round(calculated.dataCompleteness.ratio * 100);
  const valueSentence =
    calculated.maxPositiveEdge > 0
      ? `Najlepszy sygnał value: ${calculated.bestValueMarket}.`
      : "Model nie wskazuje obecnie wyraźnego dodatniego edge na dostępnych rynkach.";

  const dataSentence = calculated.dataCompleteness.percent >= 90
    ? "Analiza została przygotowana na podstawie kompletnego zestawu podstawowych statystyk z ostatnich pięciu spotkań."
    : calculated.dataCompleteness.percent < 70
      ? "Część danych wejściowych nie została uzupełniona. Wynik modelu należy traktować jako analizę wstępną."
      : "Zakres danych pozwala na analizę podstawowych sygnałów, ale raport nadal może zyskać po uzupełnieniu brakujących pól.";

  return [
    `Raport dla meczu ${teamLabel(match)} łączy dane wejściowe, kursy, prawdopodobieństwo z kursu, edge i poziom ryzyka w jednym modelu pomocniczym.`,
    valueSentence,
    `Kompletność danych wejściowych wynosi około ${completeness}%, a bieżąca pewność analizy to ${Math.round(calculated.confidence)}%.`,
    dataSentence,
    signals[0],
  ].join(" ");
}

export function generateScenarioText(match: MatchAnalysisRecord, calculated: FullReportMetrics) {
  const scenarios: string[] = [];

  if (calculated.totalExpectedGoals !== null && calculated.totalExpectedGoals > 2.7) {
    scenarios.push(
      "Scenariusz wyższego tempa bramkowego jest wspierany przez oczekiwane gole i profil ofensywny danych wejściowych.",
    );
  } else if (calculated.totalExpectedGoals !== null) {
    scenarios.push(
      "Scenariusz bazowy przewiduje bardziej kontrolowany przebieg, w którym przewagę mogą mieć jakość sytuacji i skuteczność w kluczowych momentach.",
    );
  }

  if (calculated.expectedCorners !== null && calculated.expectedCorners > 9) {
    scenarios.push(
      "Wariant z większą liczbą stałych fragmentów może pojawić się, jeśli boczne sektory będą często wykorzystywane do budowania ataku.",
    );
  }

  if (calculated.effectiveRiskLevel === "high") {
    scenarios.push(
      "Alternatywny scenariusz jest mocno zależny od składów, pierwszej bramki i tempa meczu, dlatego raport wymaga ostrożnej interpretacji.",
    );
  }

  if (scenarios.length === 0) {
    scenarios.push(
      `Model nie buduje jednego dominującego scenariusza dla meczu ${teamLabel(match)}. Raport warto aktualizować po uzupełnieniu kolejnych danych wejściowych.`,
    );
  }

  return scenarios.join("\n\n");
}

export function generateRiskText(match: MatchAnalysisRecord, calculated: FullReportMetrics) {
  const risks: string[] = [];

  if (calculated.effectiveRiskLevel === "high") {
    risks.push(
      "Analiza ma podwyższony poziom ryzyka. Wynik może mocno zależeć od składów, pierwszej bramki, tempa meczu i decyzji taktycznych.",
    );
  } else if (calculated.effectiveRiskLevel === "medium") {
    risks.push(
      "Ryzyko analizy jest średnie. Model wskazuje użyteczne sygnały, ale część zmiennych meczowych może istotnie zmienić obraz raportu.",
    );
  } else {
    risks.push(
      "Poziom ryzyka jest relatywnie niski względem kompletności danych i spójności sygnałów modelu.",
    );
  }

  if (hasMissingData(calculated)) {
    risks.push(
      "Najważniejsze ograniczenie raportu to niepełne dane wejściowe. Brakujące statystyki obniżają pewność analizy i mogą przesuwać Value Index.",
    );
  }

  if (match.settings.riskNote.trim()) {
    risks.push(match.settings.riskNote.trim());
  }

  return risks.join("\n\n");
}
