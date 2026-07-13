const phoneMetrics = [
  ["Forma drużyn", "W · D · W · L · W"],
  ["Gole", "8 : 5"],
  ["xG", "7,42"],
  ["Strzały", "61"],
  ["Rzuty rożne", "27"],
  ["Poziom ryzyka", "Średni"],
  ["Value Index", "68"],
];

export function PhoneShowcase() {
  return (
    <article className="phone-showcase">
      <div className="phone-aura" aria-hidden="true" />
      <div className="phone-frame">
        <div className="phone-speaker" aria-hidden="true" />
        <div className="phone-screen">
          <div className="phone-boot"><strong>AQ</strong><span>AnalityQ</span></div>
          <div className="phone-scan" aria-hidden="true" />
          <p className="eyebrow">Prezentacja interfejsu</p>
          <h3>Gospodarze <span>vs</span> Goście</h3>
          <p className="phone-caption">Przykładowy przepływ danych</p>
          <div className="phone-metrics">
            {phoneMetrics.map(([label, metric], index) => (
              <div key={label} style={{ "--metric-delay": `${1.2 + index * 0.24}s` } as React.CSSProperties}>
                <span>{label}</span><strong>{metric}</strong>
              </div>
            ))}
          </div>
          <span className="phone-report-cta">Otwórz raport</span>
        </div>
      </div>
    </article>
  );
}
