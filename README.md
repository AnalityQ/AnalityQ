# AnalityQ

AnalityQ to prototyp prywatnego studia do ręcznego tworzenia sportowych raportów statystycznych oraz publicznej platformy z opublikowanymi analizami.

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
