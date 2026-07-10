export const adminPassword = "analityq2026";

export const disclaimer =
  "AnalityQ dostarcza dane, kontekst i analizę ryzyka. Raporty nie gwarantują wyniku i nie są rekomendacją hazardową. Decyzje użytkownik podejmuje samodzielnie.";

export const modelDisclaimer =
  "Model AnalityQ jest uproszczonym narzędziem pomocniczym. Wyniki procentowe są szacunkowe i zależą od jakości danych wejściowych. Raport nie gwarantuje wyniku i nie jest rekomendacją hazardową. Decyzje użytkownik podejmuje samodzielnie.";

export const navItems = [
  { label: "Start", href: "/" },
  { label: "Analizy", href: "/analizy" },
  { label: "Jak to działa", href: "/jak-to-dziala" },
  { label: "Premium", href: "/premium" },
  { label: "FAQ", href: "/faq" },
];

export const analysisAreas = [
  {
    title: "Dane wejściowe",
    mark: "IN",
    description: "Ręcznie wpisane statystyki, kursy, notatki, składy i absencje.",
  },
  {
    title: "Średnie last5",
    mark: "F5",
    description: "Automatyczne średnie z ostatnich 5 meczów dla obu drużyn.",
  },
  {
    title: "Kursy i implied %",
    mark: "IP",
    description: "Przeliczenie kursów na implied probability dla każdego rynku.",
  },
  {
    title: "Modelowe %",
    mark: "MP",
    description: "Uproszczony model pomocniczy oparty na danych wejściowych.",
  },
  {
    title: "Edge",
    mark: "EG",
    description: "Różnica między użytym prawdopodobieństwem a implied probability.",
  },
  {
    title: "Value signal",
    mark: "VS",
    description: "Ocena rynku: od braku sygnału po wysoki value signal.",
  },
  {
    title: "Ryzyko",
    mark: "RK",
    description: "Ręcznie opisany poziom ryzyka oraz kara w Value Index.",
  },
  {
    title: "Watchlist",
    mark: "WL",
    description: "Raporty z mocniejszym Value Index i akceptowalnym ryzykiem.",
  },
  {
    title: "Premium sections",
    mark: "PR",
    description: "Rozszerzone notatki o rożnych, kartkach, strzałach i składach.",
  },
  {
    title: "Decyzja użytkownika",
    mark: "DU",
    description: "Raport wspiera analizę, ale nie zastępuje samodzielnej decyzji.",
  },
];

export const pipelineSteps = [
  {
    title: "Dane wejściowe",
    text: "Admin ręcznie wpisuje dane meczu, statystyki z FotMob, kursy z Fortuny, notatki, składy i ryzyka.",
  },
  {
    title: "Model pomocniczy",
    text: "AnalityQ liczy średnie last5, expected goals, implied probability, edge i modelowe prawdopodobieństwo.",
  },
  {
    title: "Analiza ryzyka",
    text: "Poziom ryzyka wpływa na Value Index, confidence i kwalifikację raportu do watchlist.",
  },
  {
    title: "Raport",
    text: "Opublikowana analiza trafia do listy publicznej, a użytkownik czyta dane, scenariusze i kontekst.",
  },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "0 zł",
    label: "Podstawowy raport",
    description: "Publiczny widok raportu z podstawowymi metrykami i tabelą kursów.",
    features: [
      "Summary i forma drużyn",
      "Średnie z ostatnich 5 meczów",
      "Tabela kursów i edge",
      "Podstawowy Value Index",
    ],
  },
  {
    name: "Premium",
    price: "49 zł",
    label: "Pełny raport",
    highlighted: true,
    description: "Rozszerzone sekcje analityczne dla głębszej pracy z raportem.",
    features: [
      "Rożne, kartki i strzały",
      "Analiza połówek",
      "Advanced risk",
      "H2H i składy",
      "Premium notes",
    ],
  },
  {
    name: "Pro",
    price: "129 zł",
    label: "Workspace admina",
    description: "Proces pracy dla wielu raportów, importu, eksportu i watchlist.",
    features: [
      "20 slotów analiz",
      "Import i export JSON",
      "Watchlist value signal",
      "Archiwum raportów",
    ],
  },
];

export const comparisonRows = [
  ["Raport podstawowy", "Tak", "Tak", "Tak"],
  ["Tabela kursów i edge", "Tak", "Tak", "Tak"],
  ["Sekcje rożnych", "Zablokowane", "Tak", "Tak"],
  ["Sekcje kartek", "Zablokowane", "Tak", "Tak"],
  ["Sekcje strzałów", "Zablokowane", "Tak", "Tak"],
  ["Analiza połówek", "Zablokowane", "Tak", "Tak"],
  ["Import / Export JSON", "Nie", "Nie", "Tak"],
  ["Panel admina", "Nie", "Nie", "Tak"],
];

export const faqItems = [
  {
    question: "Czy AnalityQ podaje gotową decyzję?",
    answer:
      "Nie. AnalityQ prezentuje analizę danych, ryzyka, kursów i możliwych scenariuszy. To narzędzie pomocnicze, a decyzję użytkownik podejmuje samodzielnie.",
  },
  {
    question: "Czy wyniki są pewne?",
    answer:
      "Nie. Sport jest zmienny, a raporty pokazują szacunkowe prawdopodobieństwa, trendy i kontekst. Celem jest lepsze rozumienie meczu, nie obietnica rezultatu.",
  },
  {
    question: "Czym jest Value Index?",
    answer:
      "Value Index to syntetyczna ocena jakości sygnału analitycznego. Łączy confidence, edge, poziom ryzyka i kompletność danych wejściowych.",
  },
  {
    question: "Skąd są dane?",
    answer:
      "W prototypie dane są wpisywane ręcznie przez admina. AnalityQ nie pobiera automatycznie danych z FotMob ani Fortuny.",
  },
  {
    question: "Czy publicznie widać szkice?",
    answer:
      "Nie. Publiczna lista pokazuje tylko raporty ze statusem published. Szkice i archiwum są widoczne wyłącznie w panelu admina.",
  },
  {
    question: "Jak czytać poziom ryzyka?",
    answer:
      "Poziom ryzyka opisuje zmienność raportu: wpływ absencji, jakości danych, składów, stylu gry i sprzecznych sygnałów.",
  },
  {
    question: "Czy to jest produkcyjne zabezpieczenie admina?",
    answer:
      "Nie. Hasło w panelu admina jest blokadą demonstracyjną dla lokalnego prototypu i nie zastępuje prawdziwego uwierzytelniania.",
  },
];
