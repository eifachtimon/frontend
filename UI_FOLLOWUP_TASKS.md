# UI Follow-up Tasks

## 1) Copy button per competence card

- Add a `Kopieren` button in `src/components/SearchResult.js`.
- Copy format:
  - `Fach`
  - `Zyklus`
  - `Code`
  - `Kompetenz`
- Show a short success state (`Kopiert`) for 1.5s.
- Add keyboard accessibility (`button` element, focus styles).

## 2) Better multi-select filter UX

- In `src/App.js`, show active filter chips under the search bar.
- Add per-chip remove action and one `Alle Filter löschen` button.
- Keep multi-select in `react-select`, but mirror active selections in chips.
- Trigger a new search only after state update and only when query text is present.

## 3) Search feedback and ranking controls

- Add a compact result meta bar:
  - number of hits returned
  - active ranking profile (`Hybrid Standard`)
- Add optional profile switch:
  - `Natürlich (Empfohlen)` = current hybrid weights
  - `Keyword stärker` = higher lexical contribution

## 4) Result readability improvements

- Highlight matched query tokens in `Kompetenz` text.
- Collapse long text with `Mehr anzeigen`.
- Keep code, fach, zyklus visually grouped at top of each card.

## 5) UX quality checks

- Empty state: distinguish `keine Suche`, `keine Treffer`, `API-Fehler`.
- Loading state: keep spinner plus text hint (`Suche läuft ...`).
- Mobile pass: ensure filter sidebar is reachable and not blocking results.
