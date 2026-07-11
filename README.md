# AnalityQ

AnalityQ to prywatne studio do ręcznego i wspomaganego przez API tworzenia sportowych raportów statystycznych oraz publiczna platforma z opublikowanymi analizami.

## Konfiguracja Supabase

1. Utwórz projekt w Supabase.
2. Wejdź w `SQL Editor`.
3. Wklej zawartość pliku `supabase/schema.sql` i uruchom zapytanie.
4. Skopiuj `Project URL` oraz `anon public key` z ustawień projektu.
5. Utwórz plik `.env.local` w katalogu projektu.
6. Wklej konfigurację:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

7. Zainstaluj zależności:

```bash
npm install
```

8. Uruchom projekt:

```bash
npm run dev
```

9. Wejdź na `/studio`.
10. Dodaj analizę przez „Szybkie dodawanie” albo pełny formularz.
11. Opublikuj analizę.
12. Sprawdź publiczną listę pod `/analizy`.

## Integracja z API-Football

Integracja korzysta z oficjalnego API-Football / API-Sports wyłącznie przez backend Next.js. Klucz nie jest wysyłany do przeglądarki ani zapisywany w Supabase.

1. Załóż konto w API-Sports i aktywuj dostęp do Football API.
2. Pobierz klucz API z panelu dostawcy.
3. Dodaj do lokalnego pliku `.env.local`:

```bash
FOOTBALL_API_KEY=...
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io
```

4. Uruchom aplikację:

```bash
npm run dev
```

5. Wejdź do `/studio`.
6. Kliknij „Pobierz dane meczu”.
7. Wybierz datę, a następnie mecz.
8. Sprawdź pobrane spotkania i odznacz te, których nie chcesz uwzględniać.
9. Kliknij „Uzupełnij formularz”.
10. Uzupełnij ręcznie aktualne kursy.
11. Zapisz analizę jako szkic albo opublikuj ją po weryfikacji.

Brakujące statystyki pozostają puste (`null`). Import nigdy nie publikuje analizy automatycznie.

### Konfiguracja na Vercel

W projekcie Vercel przejdź do `Settings` → `Environment Variables` i dodaj:

- `FOOTBALL_API_KEY` — prywatny klucz API,
- `FOOTBALL_API_BASE_URL` — `https://v3.football.api-sports.io`.

Zmienne należy dodać co najmniej dla środowiska `Production`, a w razie potrzeby także dla `Preview` i `Development`. Po zmianie wykonaj nowy deployment. Nazwa klucza nie może mieć prefiksu `NEXT_PUBLIC_`.

## Migracja źródła danych

Przed zapisem pierwszej analizy pobranej z API uruchom w Supabase SQL Editor plik:

```text
supabase/migrations/add_data_source.sql
```

Migracja dodaje kolumnę `data_source` typu `jsonb` bez usuwania istniejących rekordów oraz przygotowuje opcjonalną tabelę `api_cache`. Aktualna integracja korzysta z cache serwerowego w pamięci: lista meczów jest przechowywana przez 20 minut, ostatnie mecze przez 45 minut, a statystyki zakończonych spotkań przez 24 godziny.

## Kopia zapasowa i migracja

Studio zapisuje główne dane w Supabase. Import i eksport JSON działa jako kopia zapasowa. Jeśli w przeglądarce są stare analizy z localStorage, panel „Migracja danych lokalnych” pozwala przenieść je do bazy online i dopiero osobnym przyciskiem wyczyścić lokalne kopie.

## Uwaga produkcyjna

Obecna blokada `/studio` hasłem w aplikacji jest zabezpieczeniem prototypowym. Docelowo panel administracyjny powinien korzystać z Supabase Auth, zabezpieczonych API routes i polityk RLS ograniczających zapis tylko do zalogowanego administratora.

## Skrypty

```bash
npm run dev
npm run lint
npm run build
```
