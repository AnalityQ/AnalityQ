# Design QA — AnalityQ 2.0

Data: 2026-07-13

## Materiał porównawczy

- Wybrana makieta: `C:\Users\Oskar\.codex\generated_images\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\exec-eec05813-bc3d-4dbd-a730-4c230b11e8bd.png`
- Lokalny build: `C:\Users\Oskar\.codex\visualizations\2026\07\13\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\analityq-audit\home-implementation-final-1440.png`
- Porównanie w jednym obrazie: `C:\Users\Oskar\.codex\visualizations\2026\07\13\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\analityq-audit\home-reference-vs-final.png`

## Wynik

- P0: brak.
- P1: brak.
- P2: brak otwartych usterek blokujących odbiór.

## Sprawdzone obszary

- Wierność kierunkowi: ciemna powierzchnia, turkusowo-złote akcenty, boisko w hero, dwukolumnowy układ oraz karta Meczu dnia są zgodne z pierwszą wybraną makietą. Dane w karcie pozostają prawdziwe, dlatego drużyny i wartości mogą różnić się od makiety koncepcyjnej.
- Typografia: po porównaniu obok siebie zmniejszono skalę nagłówka desktopowego do dwóch linii i zachowano mocną hierarchię na telefonie.
- Układ i odstępy: brak nakładania, obcinania i poziomego przelewania przy 320, 375, 390, 430, 768 oraz 1440 px.
- Obrazy: hero i OG korzystają z przygotowanych rasterów; logotypy drużyn, lig i zdjęcia zawodników pochodzą wyłącznie z danych, a brak obrazu ma jawny fallback tekstowy.
- Interakcje: CTA, menu, 16 zakładek raportu, widok składów, tryb Premium, kroki Studio i akcje odświeżania mają funkcjonalne stany. Zakładki obsługują klawiaturę i role ARIA.
- Stany: sprawdzono ładowanie Meczu dnia, brak danych składów, blokady Premium, pustą listę, logowanie Studio, komunikaty odświeżania oraz ostrzeżenia publikacji.
- Dostępność: semantyczne przyciski i zakładki, etykiety, alt, focus trap panelu zawodnika, Escape, ograniczenie ruchu przez `prefers-reduced-motion` i tekstowe nazwy stanów.
- Treść publiczna: brak nazw backendu, endpointów i technicznych szczegółów dostawcy; brak planu Pro i fikcyjnych danych.

## Uwagi środowiskowe

Lokalny sandbox blokuje część zewnętrznych żądań optymalizatora obrazów do domeny danych piłkarskich. Zostały zweryfikowane bezpieczne fallbacki; nie jest to błąd buildu ani publicznej logiki aplikacji.
