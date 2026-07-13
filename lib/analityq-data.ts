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
    description: "Żółte i czerwone kartki, faule, progi oraz porównanie obu drużyn na konkretnych próbach.",
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
    title: "Wybór spotkania",
    text: "Administrator wybiera datę i spotkanie dostępne u dostawcy danych.",
  },
  {
    title: "Pobranie danych",
    text: "Serwer pobiera dane API-Football, deduplikuje sezonowe mecze i przygotowuje próby ogółem oraz dom/wyjazd.",
  },
  {
    title: "Analiza ostatnich meczów",
    text: "Każde dostępne spotkanie można sprawdzić i niezależnie uwzględnić w analizie.",
  },
  {
    title: "Normalizacja statystyk",
    text: "Różne formaty danych są ujednolicane, a brakujące wartości pozostają oznaczone jako brak danych.",
  },
  {
    title: "Obliczenia modelu",
    text: "AnalityQ liczy średnie, prawdopodobieństwa, edge, Value Index i poziom ryzyka.",
  },
  {
    title: "Sprawdzenie przez administratora",
    text: "Pobrane wartości i ręcznie uzupełnione kursy są weryfikowane przed zapisem.",
  },
  {
    title: "Publikacja raportu",
    text: "Dopiero ręcznie potwierdzony raport może trafić na publiczną listę analiz.",
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
      "Dane meczowe są pobierane po stronie serwera z API-Football i normalizowane przed zapisem raportu. Administrator może skorygować dane i opisy przed publikacją. Kursy ręczne mają pierwszeństwo; AnalityQ nie scrapuje FotMob ani Fortuny.",
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
