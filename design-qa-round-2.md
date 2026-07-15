# Design QA — AnalityQ, runda korekcyjna

Data: 2026-07-15

## Wynik

- P0: brak.
- P1: brak.
- P2: brak otwartych usterek blokujących lokalny odbiór.
- Wersja publiczna używa wyłącznie nazwy „AnalityQ”; tekst „2.0” nie występuje w interfejsie.

## Główne przyczyny i poprawki

| Obszar | Przyczyna | Poprawka i wynik |
| --- | --- | --- |
| Logowanie Studio | limit prób zliczał również poprawne logowania | licznik obejmuje wyłącznie błędne hasła i jest zerowany po sukcesie; lokalny POST zwraca 200, ustawia cookie, a GET potwierdza sesję |
| Kreska nad znakiem | artefakt był częścią źródłowego rastra | znak oczyszczono precyzyjną edycją obrazu i wygenerowano z niego faviconę, wariant kompaktowy, watermark oraz OG |
| Flagi i polszczyzna | kod `GB-ENG` nie pasował do dwuliterowego adresu flagi, a odmiana była ograniczona do dwóch państw | dodano jawne mapowanie flag i gramatykę reprezentacji, w tym rodzaj żeński, męski, nijaki i liczbę mnogą |
| Za wysokie i mało czytelne karty | cztery kolumny ściskały nazwy drużyn i wymuszały łamanie pojedynczych słów | trzy kolumny na desktopie, pionowa tożsamość drużyn i zwarte metryki; wysokość pierwszego rzędu spadła z około 647 do 543 px |
| Puste powierzchnie raportu | rozciąganie siatki i stała minimalna wysokość panelu | KPI wyrównują się do góry, a panel zakładki nie wymusza pustej wysokości |
| Surowe etykiety danych | dodatkowa statystyka API wyświetlała `goals_prevented` | widok pokazuje polską nazwę „Zapobieżone gole” |

## Funkcje sprawdzone w działającym interfejsie

- Mobilne Premium: dokładnie 13 kliknięć przycisku „Kup” przy szerokości 390 px zmienia stan na „Premium aktywny”.
- Desktopowe Premium: `Shift+Alt+P` pokazuje potwierdzenie i odblokowuje płatne zakładki raportu.
- Raport reprezentacji: Anglia–Argentyna pokazuje logotypy, flagi, polskie nazwy i poprawną odmianę w podsumowaniu oraz sygnałach.
- Składy: oficjalny skład API ma pierwszeństwo; przy jego braku prognoza korzysta z historycznych startów, występów i minut z API-Football oraz pokazuje próbę i pewność.
- Lista analiz: wyłącznie opublikowane rekordy z bieżącej bazy; nie dodano fikcyjnych meczów ani seedów.
- Studio: pozostaje ukryte w publicznym menu, a istniejące hasło i tajna metoda wejścia nie zostały zmienione.

## Responsywność i obrazy

- Sprawdzone szerokości: 320, 360, 375, 390, 430, 768, 1366 i 1440 px.
- Poziome przelewanie: 0 px na każdym sprawdzonym breakpoincie.
- Uszkodzone widoczne obrazy: 0.
- `prefers-reduced-motion` wyłącza dekoracyjne animacje i skraca przejścia.

## Materiał porównawczy

- Przed: `C:\Users\Oskar\.codex\visualizations\2026\07\13\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\analityq-audit-round-2\01-home-desktop-before.png`
- Po: `C:\Users\Oskar\.codex\visualizations\2026\07\13\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\analityq-audit-round-2\08-home-desktop-final.jpg`
- Porównanie obok siebie: `C:\Users\Oskar\.codex\visualizations\2026\07\13\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\analityq-audit-round-2\09-home-before-after-comparison.jpg`
- Finalne karty analiz: `C:\Users\Oskar\.codex\visualizations\2026\07\13\019f5c93-85d7-7ff3-a56f-e8843ad7eb2b\analityq-audit-round-2\12-analyses-cards-final.jpg`

## Walidacja techniczna

- `npm run lint`: zaliczone.
- `npm test`: 24 pliki i 84 testy zaliczone.
- `npm run build`: zaliczone na Next.js 16.2.10.
- React 19.2.4 i granice klient/serwer są zgodne z bieżącą konfiguracją projektu.
- Lokalny dostęp z telefonu w tej samej sieci: `http://192.168.0.104:3000` zwraca HTTP 200.

## Świadomie poza zakresem

- Nie wykonano deploymentu, migracji bazy, pushowania gałęzi ani zmiany domeny.
- Bieżąca lokalna baza nie zawiera już publikacji Francja–Hiszpania. Regresję językową tego przypadku pokrywają testy; wizualnie sprawdzono aktualny raport Anglia–Argentyna bez dodawania danych testowych.
