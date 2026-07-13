<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zasady projektu AnalityQ

- Aplikacja i komunikaty dla użytkownika są po polsku.
- Nie dodajemy fikcyjnych analiz ani nie seedujemy meczów.
- Nie scrapujemy FotMob ani Fortuny. Dane piłkarskie pobieramy przez provider API-Football.
- Dane analiz zapisujemy w Supabase; `localStorage` służy wyłącznie do kopii roboczych i migracji starych danych.
- Panel `/studio` pozostaje ukryty i nie może pojawić się w publicznym menu.
- Hasło panelu i tajne metody wejścia nie mogą być zmieniane bez wyraźnego polecenia użytkownika.
- Brak danych oznacza `null`, nigdy automatyczne `0`. Ręcznie wpisane `0` jest prawidłową wartością.
- Klucze API działają wyłącznie po stronie serwera i nie mogą mieć prefiksu `NEXT_PUBLIC_`.
- Migracje SQL muszą być niedestrukcyjne i nie mogą usuwać analiz ani resetować bazy.
- Przed zakończeniem zmian uruchamiamy `npm run lint`, `npm test` i `npm run build`.
- Nie wykonujemy deploymentu bez jednoznacznego potwierdzenia użytkownika.
