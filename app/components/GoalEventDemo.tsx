export function GoalEventDemo() {
  return (
    <article className="goal-demo">
      <div className="goal-pitch" aria-hidden="true">
        <svg viewBox="0 0 640 260" role="presentation">
          <path className="pitch-line" d="M24 24H616V236H24Z M320 24V236 M104 82H24V178H104 M536 82H616V178H536" />
          <path className="goal-frame" d="M616 96H636V164H616 M616 96L628 106V154L616 164" />
          <path className="ball-trail" d="M80 194C196 184 254 66 390 104C486 130 532 128 620 130" />
          <circle className="goal-ball" cx="0" cy="0" r="8" />
        </svg>
        <div className="goal-net" />
        <span className="goal-detected">Zdarzenie boiskowe wykryte</span>
      </div>
      <div className="goal-update-grid">
        {[ ["Strzały", "+1"], ["xG", "+0,18"], ["Tempo meczu", "rośnie"], ["Prawdopodobieństwo modelu", "aktualizacja"] ].map(([label, metric], index) => (
          <div key={label} style={{ "--update-delay": `${1.8 + index * 0.18}s` } as React.CSSProperties}><span>{label}</span><strong>{metric}</strong></div>
        ))}
      </div>
      <p>Prezentacja sposobu aktualizacji danych.</p>
    </article>
  );
}
