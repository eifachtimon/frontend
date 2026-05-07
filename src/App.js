import SearchResult from "./components/SearchResult";
import React, { Component } from "react";
import "./App.css";


const fachOptions = [
  { value: 'Italienisch', label: 'Italienisch' },
  { value: 'Französisch', label: 'Französisch' },
  { value: 'Englisch', label: 'Englisch' },
  { value: 'Latein', label: 'Latein' },
  { value: 'Deutsch', label: 'Deutsch' },
  { value: 'Bewegung und Sport', label: 'Bewegung und Sport' },
  { value: 'Natur, Mensch, Gesellschaft (1./2. Zyklus)', label: 'Natur, Mensch, Gesellschaft (1./2. Zyklus)' },
  { value: 'Ethik, Religionen, Gemeinschaft (mit Lebenskunde)', label: 'Ethik, Religionen, Gemeinschaft (mit Lebenskunde)' },
  { value: 'Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)', label: 'Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)' },
  { value: 'Natur und Technik (mit Physik, Chemie, Biologie)', label: 'Natur und Technik (mit Physik, Chemie, Biologie)' },
  { value: 'Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)', label: 'Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)' },
  { value: 'Medien und Informatik', label: 'Medien und Informatik' },
  { value: 'Musik', label: 'Musik' },
  { value: 'Bildnerisches Gestalten', label: 'Bildnerisches Gestalten' },
  { value: 'Textiles und Technisches Gestalten', label: 'Textiles und Technisches Gestalten' },
  { value: 'Mathematik', label: 'Mathematik' },
  { value: 'Berufliche Orientierung', label: 'Berufliche Orientierung' },
];

const zyklusOptions = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
];
const fachByZyklus = {
  "1": [
    "Bewegung und Sport",
    "Bildnerisches Gestalten",
    "Deutsch",
    "Mathematik",
    "Medien und Informatik",
    "Musik",
    "Natur, Mensch, Gesellschaft (1./2. Zyklus)",
    "Textiles und Technisches Gestalten",
  ],
  "2": [
    "Bewegung und Sport",
    "Bildnerisches Gestalten",
    "Deutsch",
    "Englisch",
    "Französisch",
    "Mathematik",
    "Medien und Informatik",
    "Musik",
    "Natur, Mensch, Gesellschaft (1./2. Zyklus)",
    "Textiles und Technisches Gestalten",
  ],
  "3": [
    "Berufliche Orientierung",
    "Bewegung und Sport",
    "Bildnerisches Gestalten",
    "Deutsch",
    "Englisch",
    "Ethik, Religionen, Gemeinschaft (mit Lebenskunde)",
    "Französisch",
    "Italienisch",
    "Latein",
    "Mathematik",
    "Medien und Informatik",
    "Musik",
    "Natur und Technik (mit Physik, Chemie, Biologie)",
    "Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)",
    "Textiles und Technisches Gestalten",
    "Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)",
  ],
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryText: "",
      fach: [],
      zyklus: [],
      results: [],
      isLoading: false,
      hasSearched: false,
      searchError: "",
    };
    this.searchDebounceTimer = null;
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  handleKeyDown = (event) => {
    if (event.key === "Enter") {
      this.search();
    }
  };

  componentWillUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  scheduleSearch = () => {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.search({ silent: true });
    }, 260);
  };

  search = (options = {}) => {
    const { silent = false } = options;
    const { queryText, fach, zyklus } = this.state;

    if (!queryText.trim()) {
      if (!silent) {
        alert("Bitte gib eine Suchanfrage ein.");
      }
      return;
    }

    this.setState({ isLoading: true, searchError: "" });

    fetch("http://127.0.0.1:5000/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_texts: queryText,
        querySchlagwort: "",
        n_results: 10,
        filters: {
          fach,
          zyklus,
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        const documents = Array.isArray(data?.documents?.[0])
          ? data.documents[0]
          : Array.isArray(data?.documents)
            ? data.documents
            : [];
        const metadatas = Array.isArray(data?.metadatas?.[0])
          ? data.metadatas[0]
          : Array.isArray(data?.metadatas)
            ? data.metadatas
            : [];

        const results = documents.map((item, index) => ({
          id: `${metadatas[index]?.uid || "result"}-${index}`,
          text: item,
          metadata: metadatas[index] || {},
        }));

        this.setState({
          results,
          isLoading: false,
          hasSearched: true,
          searchError: "",
        });
      })
      .catch(() => {
        this.setState({
          isLoading: false,
          hasSearched: true,
          searchError: "API nicht erreichbar oder Fehler bei der Suche.",
        });
      });
  };

  clearFilters = () => {
    this.setState({ fach: [], zyklus: [] }, () => {
      this.scheduleSearch();
    });
  };

  toggleQuickFach = (fachValue) => {
    this.setState((prevState) => {
      const exists = prevState.fach.includes(fachValue);
      const fach = exists
        ? prevState.fach.filter((value) => value !== fachValue)
        : [...prevState.fach, fachValue];
      return { fach };
    }, this.scheduleSearch);
  };

  toggleQuickZyklus = (zyklusValue) => {
    this.setState((prevState) => {
      const exists = prevState.zyklus.includes(zyklusValue);
      const zyklus = exists
        ? prevState.zyklus.filter((value) => value !== zyklusValue)
        : [...prevState.zyklus, zyklusValue];
      let fach = prevState.fach;
      if (zyklus.length > 0) {
        const allowedFach = new Set(
          zyklus.flatMap((item) => fachByZyklus[item] || [])
        );
        fach = prevState.fach.filter((item) => allowedFach.has(item));
      }
      return { zyklus, fach };
    }, this.scheduleSearch);
  };

  removeFilterChip = (type, value) => {
    this.setState((prevState) => {
      if (type === "fach") {
        return { fach: prevState.fach.filter((item) => item !== value) };
      }
      return { zyklus: prevState.zyklus.filter((item) => item !== value) };
    }, this.scheduleSearch);
  };

  handleChipClick = (chip) => {
    if (chip.type === "fach") {
      this.toggleQuickFach(chip.value);
      return;
    }
    this.toggleQuickZyklus(chip.value);
  };

  isChipActive = (chip) => {
    const { fach, zyklus } = this.state;
    return chip.type === "fach" ? fach.includes(chip.value) : zyklus.includes(chip.value);
  };

  render() {
    const { queryText, fach, zyklus, results, isLoading, hasSearched, searchError } = this.state;
    const hasActiveFilters = fach.length > 0 || zyklus.length > 0;
    const activeFilterChips = [
      ...fach.map((value) => ({ type: "fach", label: value, value })),
      ...zyklus.map((value) => ({ type: "zyklus", label: `Zyklus ${value}`, value })),
    ];
    const allowedFachValues = zyklus.length > 0
      ? new Set(zyklus.flatMap((item) => fachByZyklus[item] || []))
      : new Set();
    const fachChips = fachOptions
      .filter((option) => (zyklus.length > 0 ? allowedFachValues.has(option.value) : true))
      .map((option) => ({ type: "fach", value: option.value, label: option.label }));
    const zyklusChips = zyklusOptions.map((option) => ({ type: "zyklus", value: option.value, label: `Zyklus ${option.label}` }));

    return (
      <div className="app-shell">
        <header className="hero">
          <h1>Lehrplan 21 Suche</h1>
          <p>
            Beschreibe kurz deine Unterrichtsidee und finde passende Kompetenzen.
          </p>

          <div className="search-bar">
            <input
              type="text"
              id="queryText"
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              placeholder="z. B. Bruchrechnen mit Gruppenarbeit in der 5. Klasse"
              value={queryText}
              aria-label="Suchanfrage"
            />
            <button onClick={() => this.search()} aria-label="Suche starten">
              Suchen
            </button>
          </div>
        </header>

        <main className="layout">
          <aside className="filters-sidebar">
            <div className="filters-sidebar-header">
              <h2>Filter</h2>
              <button
                className="clear-button"
                onClick={this.clearFilters}
                aria-label="Alle Filter löschen"
                disabled={!hasActiveFilters}
              >
                Zurücksetzen
              </button>
            </div>

            {hasActiveFilters && (
              <div className="active-filters">
                {activeFilterChips.map((chip) => (
                  <button
                    key={`${chip.type}-${chip.value}`}
                    className="active-filter-chip"
                    onClick={() => this.removeFilterChip(chip.type, chip.value)}
                    aria-label={`${chip.label} entfernen`}
                  >
                    {chip.label} <span aria-hidden="true">x</span>
                  </button>
                ))}
              </div>
            )}

            <div className="quick-filters">
              <div className="chip-group">
                <p className="chip-group-title">1) Zyklus wählen</p>
                <div className="chip-row">
                  {zyklusChips.map((chip) => {
                    const isActive = this.isChipActive(chip);
                    return (
                      <button
                        key={`${chip.type}-${chip.value}`}
                        className={`quick-chip ${isActive ? "active" : ""}`}
                        onClick={() => this.handleChipClick(chip)}
                        aria-label={`${chip.label} ${isActive ? "deaktivieren" : "aktivieren"}`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="chip-group">
                <p className="chip-group-title">2) Fach wählen (optional)</p>
              {zyklus.length > 0 && (
                <p className="chip-hint">
                  Es werden nur Fächer angezeigt, die im gewählten Zyklus vorkommen.
                </p>
                )}
                <div className="chip-row">
                  {fachChips.map((chip) => {
                    const isActive = this.isChipActive(chip);
                    return (
                      <button
                        key={`${chip.type}-${chip.value}`}
                      className={`quick-chip ${isActive ? "active" : ""}`}
                        onClick={() => this.handleChipClick(chip)}
                        aria-label={`${chip.label} ${isActive ? "deaktivieren" : "aktivieren"}`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <section className="results-panel" aria-live="polite">
            <div className="results-header">
              <h2>Ergebnisse</h2>
              {hasSearched && !searchError && !isLoading && (
                <span>{results.length} Treffer</span>
              )}
            </div>

            {isLoading && <p className="status-message">Suche läuft ...</p>}
            {searchError && <p className="status-message error">{searchError}</p>}

            {!isLoading && !searchError && results.length > 0 && (
              <div className="results-grid">
                {results.map((result) => (
                  <SearchResult
                    key={result.id}
                    fach={result.metadata.fach}
                    zyklus={result.metadata.zyklus}
                    themenbereich={result.metadata.themenbereich}
                    code={result.metadata.code}
                    text={result.text}
                    url={result.metadata.url}
                  />
                ))}
              </div>
            )}

            {hasSearched && !isLoading && !searchError && results.length === 0 && (
              <p className="status-message">Keine Ergebnisse gefunden.</p>
            )}
          </section>
        </main>
      </div>
    );
  }
}

export default App;