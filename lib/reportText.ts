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

function decimal(value: number) {
  return value.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

export function generateKeySignals(match: MatchAnalysisRecord, calculated: FullReportMetrics) {
  const signals: string[] = [];

  if (calculated.maxPositiveEdge > 8) {
    signals.push(
      `${teamLabel(match)}: rynek ${calculated.bestValueMarket} ma najwyższy dodatni edge równy ${decimal(calculated.maxPositiveEdge)} pp. Sygnał uwzględnia kurs, prawdopodobieństwo modelowe i kompletność danych ${calculated.dataCompleteness.percent}%.`,
    );
  } else if (calculated.maxPositiveEdge >= 3) {
    signals.push(
      `${teamLabel(match)}: rynek ${calculated.bestValueMarket} ma dodatni edge równy ${decimal(calculated.maxPositiveEdge)} pp przy kompletności danych ${calculated.dataCompleteness.percent}%.`,
    );
  }

  if (calculated.totalExpectedGoals !== null && calculated.totalExpectedGoals > 2.7) {
    signals.push(
      `${teamLabel(match)}: łączna wartość oczekiwanych goli wynosi ${decimal(calculated.totalExpectedGoals)} na podstawie dostępnych średnich obu drużyn.`,
    );
  }

  if (calculated.expectedCorners !== null && calculated.expectedCorners > 9) {
    signals.push(
      `${teamLabel(match)}: średnie obu drużyn dają łącznie ${decimal(calculated.expectedCorners)} oczekiwanego rzutu rożnego w meczu.`,
    );
  }

  if (calculated.expectedCards !== null && calculated.expectedCards > 3.5) {
    signals.push(
      `${teamLabel(match)}: średnie obu drużyn dają łącznie ${decimal(calculated.expectedCards)} oczekiwanej kartki w meczu.`,
    );
  }

  if (hasMissingData(calculated)) {
    signals.push(
      `${teamLabel(match)}: kompletność danych wynosi ${calculated.dataCompleteness.percent}% (${calculated.dataCompleteness.filled} z ${calculated.dataCompleteness.total} wymaganych pól), dlatego brakujące wartości ograniczają wnioski.`,
    );
  }

  if (signals.length === 0) {
    signals.push(
      `Dla meczu ${teamLabel(match)} żadna dostępna metryka nie spełniła reguł sygnału. Kompletność danych wynosi ${calculated.dataCompleteness.percent}%, a najwyższy dodatni edge ${decimal(calculated.maxPositiveEdge)} pp.`,
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
      `${teamLabel(match)}: scenariusz bramkowy opiera się na łącznej wartości oczekiwanych goli ${decimal(calculated.totalExpectedGoals)}.`,
    );
  } else if (calculated.totalExpectedGoals !== null) {
    scenarios.push(
      `${teamLabel(match)}: łączna wartość oczekiwanych goli wynosi ${decimal(calculated.totalExpectedGoals)}; raport nie przypisuje tej wartości pewnego przebiegu spotkania.`,
    );
  }

  if (calculated.expectedCorners !== null && calculated.expectedCorners > 9) {
    scenarios.push(
      `${teamLabel(match)}: oczekiwana łączna liczba rzutów rożnych wynosi ${decimal(calculated.expectedCorners)} na podstawie dostępnych średnich obu drużyn.`,
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
