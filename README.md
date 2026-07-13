# AnalityQ

AnalityQ to polska platforma raportów statystycznych oraz prywatne Studio do ręcznego i wspomaganego przez API przygotowywania analiz. Import nigdy nie zapisuje ani nie publikuje raportu automatycznie.

## Instalacja i uruchomienie lokalne

Wymagany jest Node.js 20.9 lub nowszy.

```bash
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Konfiguracja Supabase

1. Utwórz projekt Supabase.
2. W Supabase SQL Editor uruchom `supabase/schema.sql` tylko dla nowej bazy albo odpowiednią migrację z `supabase/migrations/` dla istniejącej bazy.
3. Utwórz lokalny plik `.env.local` na podstawie `.env.example`.
4. Uzupełnij `NEXT_PUBLIC_SUPABASE_URL` oraz `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Dodaj serwerowy `SUPABASE_SERVICE_ROLE_KEY` dla chronionych operacji Studio i trwałego cache `api_cache`.
6. Dodaj `STUDIO_PASSWORD` — hasło jest sprawdzane wyłącznie na serwerze.

`SUPABASE_SERVICE_ROLE_KEY` i `STUDIO_PASSWORD` są sekretami serwerowymi. Nie wolno dodawać im prefiksu `NEXT_PUBLIC_`, umieszczać ich w kodzie ani wysyłać do przeglądarki. Studio korzysta z podpisanej sesji w cookie `httpOnly`; publiczny klient Supabase może wyłącznie odczytywać opublikowane analizy.

## Konfiguracja API-Football

Integracja korzysta z API-Football / API-Sports wyłącznie przez endpointy Next.js.

```bash
FOOTBALL_API_KEY=
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io
```

W `.env.local` wpisz prawdziwy `FOOTBALL_API_KEY`. Klucz nie może mieć prefiksu `NEXT_PUBLIC_`. Gdy go brakuje, aplikacja nadal się uruchamia, testuje i buduje, a Studio wyświetla komunikat „Brakuje klucza API danych piłkarskich.”

## Import meczu w Studio

1. Otwórz ukryty panel `/studio` jedną z istniejących metod wejścia.
2. Kliknij „Pobierz dane meczu”.
3. Wybierz datę i kliknij „Pokaż mecze”.
4. Filtruj listę po lidze lub drużynie i wybierz spotkanie.
5. Poczekaj na pobranie sezonowych danych obu drużyn, ich podział na próby ogółem oraz dom/wyjazd i uzupełnienie sekcji opcjonalnych.
6. Na ekranie „Sprawdź pobrane dane” skontroluj statystyki, ostrzeżenia, kompletność i `coverage`.
7. Odznacz spotkania, których nie chcesz uwzględnić. Sumy, średnie i pokrycie przeliczą się natychmiast.
8. Kliknij „Uzupełnij formularz”. Formularz otworzy sekcję kursów.
9. Uzupełnij aktualne kursy ręcznie i popraw dowolne pobrane wartości.
10. Zapisz raport jako szkic. Publikację wykonaj dopiero po ręcznym sprawdzeniu i potwierdzeniu.

Najnowszy mecz znajduje się po lewej stronie zapisu formy `W,D,L`. Brakująca statystyka pozostaje `null`; nie jest traktowana jako zero.

## Kursy

Kursy wpisane ręcznie przez administratora mają pierwszeństwo. Dostępne kursy API-Football są zapisywane w snapshotcie jako kontekst i nie nadpisują ręcznej korekty. Aplikacja nie scrapuje Fortuny ani innych serwisów z kursami. Po wpisaniu kursów model oblicza prawdopodobieństwo wynikające z kursu, edge i Value Index.

## Testy i weryfikacja

```bash
npm run lint
npm test
npm run build
```

Testy Vitest mockują odpowiedzi dostawcy. Nie wykonują prawdziwych połączeń z API-Football ani zapisów do Supabase.

## Migracje SQL

Dla istniejącego projektu ręcznie uruchom kolejno odpowiednie migracje:

- `supabase/migrations/add_data_source.sql` — rozszerzenie integracji danych,
- `supabase/migrations/20260712103027_secure_analysis_rls.sql` — uszczelnienie publicznego dostępu.

Migracje:

- dodaje `analyses.data_source` typu `jsonb`, jeśli kolumna nie istnieje,
- tworzy lub uzupełnia `api_cache`,
- nie usuwa rekordów ani kolumn,
- blokuje dostęp do cache dla `anon` i `authenticated`,
- przyznaje dostęp do cache wyłącznie `service_role`,
- odbiera `anon` możliwość tworzenia, edycji i usuwania analiz,
- pozwala `anon` odczytywać wyłącznie rekordy ze statusem `published`.

Migracji nie uruchamia aplikacja ani proces build.

## Konfiguracja Vercel

W `Settings → Environment Variables` dodaj ręcznie:

- `NEXT_PUBLIC_SUPABASE_URL`,
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
- `SUPABASE_SERVICE_ROLE_KEY` — chronione operacje Studio i trwały cache,
- `STUDIO_PASSWORD` — serwerowo weryfikowane hasło Studio,
- `FOOTBALL_API_KEY`,
- `FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io`.

Sekretów nie wpisuj do workflow CI. Zmiana zmiennych w Vercel i deployment nie są wykonywane automatycznie przez ten projekt.

## Bezpieczeństwo Studio

Ukryte metody wejścia i trasa `/studio` pozostają niezmienione. Hasło jest porównywane z `STUDIO_PASSWORD` po stronie serwera, a wszystkie operacje administracyjne przechodzą przez chronione Route Handlers i klienta service role. Wygaśnięcie sesji nie usuwa lokalnej kopii roboczej formularza.
