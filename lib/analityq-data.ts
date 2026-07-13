export const disclaimer =
  "Model AnalityQ jest narzędziem pomocniczym opartym na danych wejściowych. Wyniki procentowe i Value Index mają charakter szacunkowy, nie gwarantują rezultatu i nie są rekomendacją hazardową. Decyzje użytkownik podejmuje samodzielnie.";

export const modelDisclaimer = disclaimer;

export const navItems = [
  { label: "Start", href: "/" },
  { label: "Analizy", href: "/analizy" },
  { label: "Jak działa AnalityQ", href: "/jak-to-dziala" },
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
    text: "Dane meczowe są pobierane po stronie serwera i porządkowane dla próby ogółem oraz dom/wyjazd.",
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
    description: "Szybki obraz meczu i wybrane sekcje raportu bez opłat.",
    features: [
      "Najważniejsze sygnały i ryzyka",
      "Forma drużyn oraz dom i wyjazd",
      "Podstawowe statystyki meczu",
      "Informacja o jakości danych",
    ],
  },
  {
    name: "Premium",
    price: "29,99 zł",
    label: "Pełny raport",
    highlighted: true,
    description: "Pełny kontekst meczu dla osób, które chcą wejść głębiej w dane.",
    features: [
      "Pełne porównania i trendy",
      "Rzuty rożne, kartki i strzały",
      "Składy, zawodnicy i absencje",
      "Historia spotkań i scenariusze",
      "Rozszerzona ocena ryzyka",
    ],
  },
];

export const comparisonRows = [
  ["Najważniejsze sygnały", "Tak", "Tak"],
  ["Forma i dom/wyjazd", "Tak", "Tak"],
  ["Pełne porównania", "Wybrane", "Tak"],
  ["Rzuty rożne, kartki i strzały", "Wybrane", "Tak"],
  ["Składy i profile zawodników", "Podgląd", "Tak"],
  ["Absencje i ryzyka", "Podstawowe", "Pełne"],
  ["Historia spotkań i scenariusze", "Wybrane", "Tak"],
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
      "Dane meczowe są pobierane po stronie serwera, normalizowane i sprawdzane przed publikacją. W raporcie pokazujemy również braki danych, aby nie udawać pewności tam, gdzie jej nie ma.",
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
    question: "Jak powstaje raport?",
    answer:
      "Raport łączy aktualny kontekst spotkania z historycznymi statystykami, a następnie przechodzi ręczną kontrolę przed publikacją.",
  },
];
