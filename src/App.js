import SearchResult from "./components/SearchResult";
import React, { Component } from "react";
import "./App.css";

const STORAGE_KEY = "lp21-search-state-v1";
const promptSuggestions = [
  "Bruchrechnen in der 5. Klasse",
  "Unterrichtsidee zu Körperausdruck in Musik",
  "Projekt zu nachhaltigem Konsum im Zyklus 3",
];

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
const fachColors = {
  "Mathematik": "#4a90e2",
  "Deutsch": "#7b6fd6",
  "Englisch": "#5aa85f",
  "Französisch": "#d86aa3",
  "Italienisch": "#e68a4a",
  "Latein": "#9c6acb",
  "Bewegung und Sport": "#e06767",
  "Natur, Mensch, Gesellschaft (1./2. Zyklus)": "#66b26f",
  "Natur und Technik (mit Physik, Chemie, Biologie)": "#3ca8a8",
  "Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)": "#c07c4f",
  "Ethik, Religionen, Gemeinschaft (mit Lebenskunde)": "#9aa657",
  "Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)": "#b0834a",
  "Medien und Informatik": "#4b8ad1",
  "Musik": "#b66bd1",
  "Bildnerisches Gestalten": "#d97858",
  "Textiles und Technisches Gestalten": "#5e9fca",
  "Berufliche Orientierung": "#8a8a8a",
};
const zyklusColors = {
  "1": "rgb(217, 158, 70)",
  "2": "rgb(76, 141, 201)",
  "3": "rgb(162, 200, 87)",
  "12": "rgb(147, 150, 136)",
  "23": "rgb(119, 171, 144)",
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryText: "",
      fach: [],
      zyklus: [],
      showFachFilters: false,
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
    }, this.persistSearchState);
  };

  handleKeyDown = (event) => {
    if (event.key === "Enter") {
      this.search();
    }
  };

  applyPromptSuggestion = (prompt) => {
    this.setState({ queryText: prompt }, () => {
      this.persistSearchState();
      this.search({ silent: true });
    });
  };

  componentWillUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  componentDidMount() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      const queryText = typeof parsed.queryText === "string" ? parsed.queryText : "";
      const fach = Array.isArray(parsed.fach) ? parsed.fach.map(String) : [];
      const zyklus = Array.isArray(parsed.zyklus) ? parsed.zyklus.map(String) : [];
      const showFachFilters = Boolean(parsed.showFachFilters);

      this.setState(
        {
          queryText,
          fach,
          zyklus,
          showFachFilters,
        },
        () => {
          if (queryText.trim()) {
            this.search({ silent: true });
          }
        }
      );
    } catch (_error) {
      // Ignore corrupted local storage and continue with defaults.
    }
  }

  persistSearchState = () => {
    const { queryText, fach, zyklus, showFachFilters } = this.state;
    const payload = {
      queryText,
      fach,
      zyklus,
      showFachFilters,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_error) {
      // Ignore storage write failures (private mode/quota).
    }
  };

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

    this.setState({ isLoading: true, searchError: "", showFachFilters: false }, this.persistSearchState);

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
        }, this.persistSearchState);
      })
      .catch(() => {
        this.setState({
          isLoading: false,
          hasSearched: true,
          searchError: "API nicht erreichbar oder Fehler bei der Suche.",
        }, this.persistSearchState);
      });
  };

  clearFilters = () => {
    this.setState({
      fach: [],
      zyklus: [],
    }, () => {
      this.persistSearchState();
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
    }, () => {
      this.persistSearchState();
      this.scheduleSearch();
    });
  };

  toggleZyklusBox = (value) => {
    this.setState((prevState) => {
      const key = String(value);
      const exists = prevState.zyklus.includes(key);
      const zyklus = exists
        ? prevState.zyklus.filter((item) => item !== key)
        : [...prevState.zyklus, key];
      zyklus.sort((a, b) => Number(a) - Number(b));
      return { zyklus };
    }, () => {
      this.persistSearchState();
      this.scheduleSearch();
    });
  };

  toggleFachFilters = () => {
    this.setState((prevState) => ({ showFachFilters: !prevState.showFachFilters }), this.persistSearchState);
  };

  removeFilterChip = (type, value) => {
    this.setState((prevState) => ({
      fach: prevState.fach.filter((item) => item !== value),
    }), () => {
      this.persistSearchState();
      this.scheduleSearch();
    });
  };

  handleChipClick = (chip) => {
    if (chip.type === "fach") {
      this.toggleQuickFach(chip.value);
    }
  };

  isChipActive = (chip) => {
    const { fach, zyklus } = this.state;
    return chip.type === "fach" ? fach.includes(chip.value) : zyklus.includes(chip.value);
  };

  getFachColor = (fachName) => fachColors[fachName] || "#8f8f8f";
  getZyklusColor = (zyklusValue) => {
    const value = String(zyklusValue || "").trim();
    return zyklusColors[value] || "#9f9f9f";
  };

  render() {
    const {
      queryText,
      fach,
      zyklus,
      showFachFilters,
      results,
      isLoading,
      hasSearched,
      searchError,
    } = this.state;
    const allowedFachValues = zyklus.length > 0
      ? new Set(zyklus.flatMap((item) => fachByZyklus[item] || []))
      : new Set();
    const selectedFachChips = fachOptions
      .filter((option) => fach.includes(option.value))
      .map((option) => ({ value: option.value, label: option.label }));
    const fachChips = fachOptions
      .filter((option) => (zyklus.length > 0 ? allowedFachValues.has(option.value) : true))
      .filter((option) => !fach.includes(option.value))
      .map((option) => ({ type: "fach", value: option.value, label: option.label }));
    const groupedResults = results.reduce((acc, result) => {
      const themenbereich = result.metadata.themenbereich || "Ohne Themenbereich";
      if (!acc[themenbereich]) {
        acc[themenbereich] = [];
      }
      acc[themenbereich].push(result);
      return acc;
    }, {});
    const groupedSections = Object.entries(groupedResults).flatMap(([themenbereich, items]) => {
      const fachBuckets = items.reduce((bucketAcc, item) => {
        const fachName = item.metadata.fach || "Unbekanntes Fach";
        if (!bucketAcc[fachName]) {
          bucketAcc[fachName] = [];
        }
        bucketAcc[fachName].push(item);
        return bucketAcc;
      }, {});

      return Object.entries(fachBuckets).map(([fachName, fachItems]) => ({
        key: `${themenbereich}-${fachName}`,
        themenbereich,
        fachName,
        items: fachItems,
      }));
    });

    return (
      <div className="app-shell">
        <main className="layout">
          <section className="content-column">
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

              <div className="prompt-suggestions">
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    className="prompt-chip"
                    onClick={() => this.applyPromptSuggestion(prompt)}
                    aria-label={`Beispielsuche ${prompt}`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </header>

            <section className="filters-inline" aria-label="Filter">
              <div className="quick-filters">
                <div className="chip-group minimal-group zyklus-group">
                  <div className="zyklus-row">
                    <p className="chip-group-title">Zyklus</p>
                    <div className="zyklus-boxes">
                      {[1, 2, 3].map((value) => {
                        const key = String(value);
                        const isActive = zyklus.includes(key);
                        return (
                          <button
                            key={`zyklus-box-${key}`}
                            className={`zyklus-box ${isActive ? "active" : ""}`}
                          style={{ "--chip-accent": this.getZyklusColor(key) }}
                            onClick={() => this.toggleZyklusBox(value)}
                            aria-label={`Zyklus ${key} ${isActive ? "deaktivieren" : "aktivieren"}`}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className={`fach-toggle-button ${showFachFilters ? "open" : ""}`}
                      onClick={this.toggleFachFilters}
                      aria-label="Fachfilter ein- oder ausklappen"
                    >
                      Fächer <span className="caret" aria-hidden="true">▾</span>
                    </button>
                  </div>
                  {selectedFachChips.length > 0 && (
                    <div className="selected-fach-chips">
                      {selectedFachChips.map((chip) => (
                        <button
                          key={`selected-${chip.value}`}
                          className="active-filter-chip"
                          style={{ "--chip-accent": this.getFachColor(chip.value) }}
                          onClick={() => this.removeFilterChip("fach", chip.value)}
                          aria-label={`${chip.label} entfernen`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {showFachFilters && (
                  <div className="chip-row fach-picker-row">
                    {fachChips.map((chip) => {
                      const isActive = this.isChipActive(chip);
                      return (
                        <button
                          key={`${chip.type}-${chip.value}`}
                          className={`quick-chip ${isActive ? "active" : ""}`}
                          style={{ "--chip-accent": this.getFachColor(chip.value) }}
                          onClick={() => this.handleChipClick(chip)}
                          aria-label={`${chip.label} ${isActive ? "deaktivieren" : "aktivieren"}`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

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
              <div className="results-groups">
                {groupedSections.map((group) => (
                  <section className="result-group" key={group.key}>
                    <div className="result-group-header">
                      <div className="result-group-title-wrap">
                        <span
                          className="group-fach-pill"
                          style={{ "--fach-color": this.getFachColor(group.fachName) }}
                        >
                          {group.fachName}
                        </span>
                        <h3>{group.themenbereich}</h3>
                      </div>
                    </div>
                    <div className="results-grid">
                      {group.items.map((result) => (
                        <SearchResult
                          key={result.id}
                          fach={result.metadata.fach}
                          zyklus={result.metadata.zyklus}
                          zyklusColor={this.getZyklusColor(result.metadata.zyklus)}
                          getZyklusColorByPart={this.getZyklusColor}
                          themenbereich={result.metadata.themenbereich}
                          code={result.metadata.code}
                          text={result.text}
                          url={result.metadata.url}
                          queryText={queryText}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {hasSearched && !isLoading && !searchError && results.length === 0 && (
              <p className="status-message">Keine Ergebnisse gefunden.</p>
            )}
            </section>
          </section>
        </main>
      </div>
    );
  }
}

export default App;