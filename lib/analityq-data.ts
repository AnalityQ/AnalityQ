import { STUDIO_PASSWORD } from "./studio-auth";

export const adminPassword = STUDIO_PASSWORD;

export const disclaimer =
  "Model AnalityQ jest narzędziem pomocniczym opartym na danych wejściowych. Wyniki procentowe i Value Index mają charakter szacunkowy, nie gwarantują rezultatu i nie są rekomendacją hazardową. Decyzje użytkownik podejmuje samodzielnie.";

export const modelDisclaimer = disclaimer;

export const navItems = [
  { label: "Start", href: "/" },
  { label: "Analizy", href: "/analizy" },
  { label: "Jak działa model", href: "/jak-to-dziala" },
  { label: "Premium", href: "/premium" },
  { label: "FAQ", href: "/faq" },
];

export const analysisAreas = [
  {
    title: "Forma drużyn",
    mark: "F5",
    description: "Ostatnie pięć spotkań, bilans formy oraz stabilność wyników obu zespołów.",
  },
  {
    title: "Gole i xG",
    mark: "xG",
    description: "Bramki, oczekiwane gole i szacowany potencjał bramkowy spotkania.",
  },
  {
    title: "Rzuty rożne",
    mark: "RZ",
    description: "Wolumen rożnych wykonanych i dopuszczanych przez obie drużyny.",
  },
  {
    title: "Kartki",
    mark: "KD",
    description: "Średnie kartek oraz profil spotkania pod kątem przerywania gry.",
  },
  {
    title: "Kursy i prawdopodobieństwo z kursu",
    mark: "IP",
    description: "Kursy wpisywane ręcznie i prawdopodobieństwo wynikające z kursu.",
  },
  {
    title: "Edge i Value Index",
    mark: "VI",
    description: "Edge — przewaga modelu nad kursem, połączona z ryzykiem i jakością danych.",
  },
  {
    title: "Ryzyko meczu",
    mark: "RK",
    description: "Automatyczny lub ręczny poziom ryzyka oparty na kompletności danych i kontekście.",
  },
  {
    title: "Scenariusze spotkania",
    mark: "SC",
    description: "Opis możliwego przebiegu meczu generowany z danych oraz notatek analitycznych.",
  },
];

export const pipelineSteps = [
  {
    title: "Dane wejściowe",
    text: "Analityk ręcznie wpisuje dane meczu, statystyki, kursy, formę, składy i absencje.",
  },
  {
    title: "Obliczenia statystyczne",
    text: "AnalityQ liczy średnie z ostatnich pięciu meczów, oczekiwane gole, rożne, kartki i prawdopodobieństwa modelowe.",
  },
  {
    title: "Porównanie z kursem",
    text: "Kursy są przeliczane na prawdopodobieństwo, a model porównuje je z prawdopodobieństwem statystycznym i wylicza edge.",
  },
  {
    title: "Ocena ryzyka",
    text: "Poziom ryzyka uwzględnia kompletność danych, stabilność sygnałów, składy i zmienność meczu.",
  },
  {
    title: "Raport końcowy",
    text: "Opublikowana analiza trafia do publicznej listy jako przejrzysty raport z danymi, scenariuszami i disclaimerem.",
  },
];

export const audienceCards = [
  {
    title: "Osoby analizujące mecze",
    text: "Jeden widok na kursy, prawdopodobieństwa modelowe, ryzyko i scenariusze.",
  },
  {
    title: "Twórcy sportowi",
    text: "Czytelne raporty do omawiania spotkań bez chaotycznych arkuszy i luźnych notatek.",
  },
  {
    title: "Społeczności premium",
    text: "Uporządkowana prezentacja analiz z podziałem na sekcje darmowe i rozszerzone.",
  },
  {
    title: "Osoby szukające danych",
    text: "Szybki kontekst meczowy, kluczowe metryki i jasna informacja o poziomie ryzyka.",
  },
];

export const pricingPlans = [
  {
    name: "Darmowy",
    price: "0 zł",
    label: "Podstawowy raport",
    description: "Publiczny widok raportu z podstawowymi metrykami i tabelą kursów.",
    features: [
      "Podsumowanie modelu i forma drużyn",
      "Średnie z ostatnich 5 meczów",
      "Tabela kursów, prawdopodobieństwo z kursu i edge",
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
      "Rzuty rożne, kartki i strzały",
      "Analiza połówek",
      "Zaawansowane ryzyko",
      "H2H, składy i absencje",
      "Rozszerzone notatki premium",
    ],
  },
  {
    name: "Pro",
    price: "129 zł",
    label: "Przestrzeń robocza",
    description: "Proces pracy dla wielu raportów, kopii zapasowych i watchlisty.",
    features: [
      "20 slotów analiz",
      "Kopia zapasowa JSON",
      "Lista obserwacyjna sygnałów value",
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
  ["Kopia zapasowa JSON", "Nie", "Nie", "Tak"],
  ["Przestrzeń robocza", "Nie", "Nie", "Tak"],
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
      "Value Index to syntetyczna ocena jakości sygnału analitycznego. Łączy pewność analizy, edge — przewagę modelu nad kursem, poziom ryzyka i kompletność danych wejściowych.",
  },
  {
    question: "Czym jest prawdopodobieństwo z kursu?",
    answer:
      "Implied probability to prawdopodobieństwo wynikające z kursu. AnalityQ porównuje je z prawdopodobieństwem modelowym i wylicza edge.",
  },
  {
    question: "Skąd są dane?",
    answer:
      "W prototypie dane są wpisywane ręcznie przez osobę prowadzącą analizę. AnalityQ nie pobiera automatycznie danych z FotMob ani Fortuny.",
  },
  {
    question: "Czy publicznie widać szkice?",
    answer:
      "Nie. Publiczna lista pokazuje tylko raporty opublikowane. Szkice i archiwum są widoczne wyłącznie w ukrytej przestrzeni roboczej.",
  },
  {
    question: "Jak czytać poziom ryzyka?",
    answer:
      "Poziom ryzyka opisuje zmienność raportu: wpływ absencji, jakości danych, składów, stylu gry i sprzecznych sygnałów.",
  },
  {
    question: "Czy to jest produkcyjne zabezpieczenie?",
    answer:
      "Nie. Hasło w przestrzeni roboczej jest blokadą demonstracyjną dla lokalnego prototypu i nie zastępuje prawdziwego uwierzytelniania.",
  },
];
