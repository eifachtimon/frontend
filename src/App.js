import SearchResult from "./components/SearchResult";
import CompetencyChainView from "./components/CompetencyChainView";
import React, { Component } from "react";
import "./App.css";

const STORAGE_KEY = "lp21-search-state-v2";

/**
 * Lokal: In .env.development ist REACT_APP_API_BASE_URL=http://127.0.0.1:5001 gesetzt
 * (direkt Flask; vermeidet macOS-Konflikte mit Port 3000/AirTunes und Dev-Proxy).
 * Ohne diese Variable im Dev nutzt die App optional den gleichen Host + src/setupProxy.js.
 * Produktion: REACT_APP_API_BASE_URL auf die gehostete API setzen.
 */
const rawApiBase = process.env.REACT_APP_API_BASE_URL;
const API_ROOT =
  rawApiBase != null && String(rawApiBase).trim() !== ""
    ? String(rawApiBase).replace(/\/$/, "")
    : process.env.NODE_ENV === "development"
      ? ""
      : "http://127.0.0.1:5001";

const apiUrl = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_ROOT}${normalized}`;
};

const backendDisplayLabel =
  API_ROOT === ""
    ? "npm-Dev-Proxy → Port 5001"
    : API_ROOT;
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

/** Ein Suchlauf = ein Profil; Kurzerklärung oberhalb der Trefferliste (nicht auf jeder Karte). */
const QUERY_PROFILE_HELP = {
  planning_complex:
    "Ausführliche Frage: Es fliessen mehr Kontextsignale ein (Bedeutungsnähe, Varianten, Metadaten).",
  lookup_short:
    "Kurze Eingabe: Stichworttreffer und kompakte Bedeutungsnähe sind relativ stärker gewichtet.",
  standard: "Ausgewogene Kombination aus Bedeutungsnähe, Stichworttreffern und Fach-/Intent-Signalen.",
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
      queryValidationError: false,
      revealResults: false,
      chainView: null,
      /** Aus den Suchmetadaten (_query_profile), nur zur Erklärung des Rankings */
      searchQueryProfile: null,
      /** Nur Dev: null | true | false — GET /health gegen API_ROOT */
      devBackendReachable: null,
    };
    this.searchDebounceTimer = null;
  }

  componentDidMount() {
    if (process.env.NODE_ENV === "development") {
      this.refreshDevBackendReachable();
      this.handleVisibilityForHealth = () => {
        if (document.visibilityState === "visible") {
          this.refreshDevBackendReachable();
        }
      };
      document.addEventListener("visibilitychange", this.handleVisibilityForHealth);
    }

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
            this.search();
          }
        }
      );
    } catch (_error) {
      // Ignore corrupted local storage and continue with defaults.
    }
  }

  refreshDevBackendReachable = () => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    fetch(apiUrl("/health"), { method: "GET" })
      .then((response) => {
        this.setState({ devBackendReachable: response.ok });
      })
      .catch(() => {
        this.setState({ devBackendReachable: false });
      });
  };

  renderLocalDevWarnings = () => {
    if (process.env.NODE_ENV !== "development") {
      return null;
    }
    const port = window.location.port;
    const host = window.location.hostname;
    const onWrongDevPort =
      (host === "localhost" || host === "127.0.0.1") && port === "3000";

    if (onWrongDevPort) {
      return (
        <div className="dev-warning dev-warning--critical" role="alert">
          <p className="dev-warning-title">Falsche Adresse (macOS / AirTunes)</p>
          <p className="dev-warning-body">
            Unter Port <strong>3000</strong> schlägt die Suche oft mit HTTP 403 fehl. Diese App läuft im Dev-Modus auf{" "}
            <strong>http://localhost:3002</strong> — dieses Tab hier schließen und die richtige URL öffnen.
          </p>
        </div>
      );
    }

    const { devBackendReachable } = this.state;
    if (devBackendReachable === false) {
      return (
        <div className="dev-warning dev-warning--backend" role="status">
          <p className="dev-warning-title">Backend nicht erreichbar</p>
          <p className="dev-warning-body">
            Erwartet unter <code>{API_ROOT || "(gleiche Origin)"}</code>. Terminal:{" "}
            <code>{`cd backend && python3 server.py`}</code> (Port 5001). Tab zurück/fokussieren oder Seite neu laden.
          </p>
        </div>
      );
    }

    return null;
  };

  handleChange = (event) => {
    const nextValue = event.target.value;
    this.setState({
      [event.target.id]: nextValue,
      queryValidationError: event.target.id === "queryText" ? false : this.state.queryValidationError,
    }, this.persistSearchState);
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
    if (this.handleVisibilityForHealth) {
      document.removeEventListener("visibilitychange", this.handleVisibilityForHealth);
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
      this.search();
    }, 260);
  };

  search = () => {
    const { queryText, fach, zyklus } = this.state;
    const searchStartedAt = Date.now();

    if (!queryText.trim()) {
      this.setState({ queryValidationError: true });
      return;
    }

    this.setState(
      {
        isLoading: true,
        searchError: "",
        showFachFilters: false,
        queryValidationError: false,
        revealResults: false,
        searchQueryProfile: null,
      },
      this.persistSearchState
    );

    fetch(apiUrl("/search"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_texts: queryText,
        querySchlagwort: "",
        filters: {
          fach,
          zyklus,
        },
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const snippet = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status}: ${snippet.slice(0, 160)}`
          );
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
        const responseIds = Array.isArray(data?.ids?.[0])
          ? data.ids[0]
          : Array.isArray(data?.ids)
            ? data.ids
            : [];

        const results = documents.map((item, index) => {
          const meta = metadatas[index] || {};
          const documentUid = responseIds[index] || meta.uid || null;
          const stableKey =
            typeof documentUid === "string" && documentUid.trim()
              ? documentUid.trim()
              : `${meta.uid || "result"}-${index}`;
          return {
            id: stableKey,
            documentUid: typeof documentUid === "string" ? documentUid.trim() : documentUid,
            text: item,
            metadata: meta,
            prefetchedChain: meta._competency_chain || null,
          };
        });

        const searchQueryProfile =
          typeof metadatas[0]?._query_profile === "string"
            ? metadatas[0]._query_profile
            : null;

        const elapsed = Date.now() - searchStartedAt;
        const remaining = Math.max(0, 500 - elapsed);
        setTimeout(() => {
          this.setState({
            results,
            isLoading: false,
            hasSearched: true,
            searchError: "",
            revealResults: true,
            searchQueryProfile,
          }, this.persistSearchState);
        }, remaining);
      })
      .catch((err) => {
        const target = apiUrl("/search");
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("Suche fehlgeschlagen:", target, err);
        }
        const detail = err?.message || "";
        const httpStatusMatch = detail.match(/^HTTP (\d{3})/);
        const tech =
          process.env.NODE_ENV === "development" && detail
            ? ` Technisch: ${detail}`
            : "";
        const elapsed = Date.now() - searchStartedAt;
        const remaining = Math.max(0, 500 - elapsed);
        const looksLikeConnectionRefused =
          !httpStatusMatch &&
          (/failed to fetch|networkerror|load failed|refused|connection reset|nicht erreichbar/i.test(
            detail
          ) ||
            err?.name === "TypeError");
        const backendHint =
          `Backend starten: Terminal → cd backend && python3 server.py (lauscht auf Port 5001). ` +
          `Test: curl -s http://127.0.0.1:5001/health → {"status":"ok"}.`;
        const frontendHint =
          process.env.NODE_ENV === "development"
            ? ` Lädt die Seite selbst nicht (Browser ERR_CONNECTION_REFUSED auf :3002)? → cd frontend && npm start (Port 3002).`
            : "";
        const connectionHint =
          `${backendHint} Nach Änderung an .env: npm start neu starten.${frontendHint}`;
        const errorBody = httpStatusMatch
          ? `Antwort HTTP ${httpStatusMatch[1]} vom Backend — oft läuft auf Port 5001 nicht diese Flask-App, oder ein anderer Dienst antwortet. ` +
            `Prüfen: curl -s http://127.0.0.1:5001/health muss {"status":"ok"} liefern. ${connectionHint}${tech}`
          : looksLikeConnectionRefused
            ? `Keine Verbindung zum API-Server (${backendDisplayLabel}) — typisch wenn Flask nicht läuft oder die URL nicht stimmt (ERR_CONNECTION_REFUSED / Failed to fetch). ${connectionHint}${tech}`
            : `Keine Verbindung zum Backend (${backendDisplayLabel}). ${connectionHint}${tech}`;
        setTimeout(() => {
          this.setState({
            isLoading: false,
            hasSearched: true,
            searchError: errorBody,
            revealResults: false,
            searchQueryProfile: null,
          }, this.persistSearchState);
        }, remaining);
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

  /**
   * Fehlende Querverweise zur aktuellen Stufe nachladen (Backend ohne network_links in /competency-chain).
   */
  enrichChainDataWithNetworkApi = async (chainPayload) => {
    if (!chainPayload?.current?.uid) {
      return chainPayload;
    }
    const focusUid = chainPayload.current.uid;
    if (
      Array.isArray(chainPayload.current.network_links) &&
      chainPayload.current.network_links.length > 0
    ) {
      const has = chainPayload._has_network === true || chainPayload.current.network_links.length > 0;
      return {
        ...chainPayload,
        _has_network: chainPayload._has_network ?? has,
      };
    }
    const tryUrls = [
      apiUrl(`/api/competency-network/${encodeURIComponent(focusUid)}`),
      apiUrl(`/competency-network/${encodeURIComponent(focusUid)}`),
    ];

    for (const url of tryUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          continue;
        }
        const net = await response.json();
        const outgoing = net && net.outgoing;
        if (!Array.isArray(outgoing) || outgoing.length === 0) {
          continue;
        }
        const links = outgoing.map((o) => ({
          uid: o.uid,
          code: o.code,
          fach: o.fach,
        }));
        const fullChain = Array.isArray(chainPayload.full_chain)
          ? chainPayload.full_chain.map((step) =>
              step && step.uid === focusUid ? { ...step, network_links: links } : step
            )
          : chainPayload.full_chain;
        return {
          ...chainPayload,
          _has_network: true,
          current: { ...chainPayload.current, network_links: links },
          full_chain: fullChain,
        };
      } catch (_err) {
        continue;
      }
    }
    return chainPayload;
  };

  handleOpenCompetencyChain = (rawUid, prefetchedChain) => {
    const uid =
      typeof rawUid === "string"
        ? rawUid.trim()
        : rawUid != null
          ? String(rawUid).trim()
          : "";
    if (!uid) {
      return;
    }

    const highlightAnchorUid = uid;

    const embedded =
      prefetchedChain &&
      (prefetchedChain.current || prefetchedChain["current"]);

    // Kurz eingebettete Daten zeigen, dann immer frisch laden — damit u.a.
    // network_links und _has_network aus der aktuellen API garantiert sind.
    if (embedded) {
      this.setState({
        chainView: {
          loading: false,
          error: null,
          data: prefetchedChain,
          highlightAnchorUid,
        },
      });
    } else {
      this.setState({
        chainView: { loading: true, error: null, data: null, highlightAnchorUid },
      });
    }

    fetch(apiUrl(`/competency-chain/${encodeURIComponent(uid)}`))
      .then((response) => {
        if (response.status === 404) {
          throw new Error("not_found");
        }
        if (!response.ok) {
          throw new Error("network");
        }
        return response.json();
      })
      .then((data) => this.enrichChainDataWithNetworkApi(data))
      .then((data) => {
        this.setState((prev) => ({
          chainView: prev.chainView
            ? {
                ...prev.chainView,
                loading: false,
                error: null,
                data,
              }
            : {
                loading: false,
                error: null,
                data,
                highlightAnchorUid,
              },
        }));
      })
      .catch((error) => {
        const message =
          error.message === "not_found"
            ? "Für diese Kompetenz wurde kein Aufbau-Kontext gefunden."
            : "Der Aufbau-Kontext konnte nicht geladen werden.";
        if (embedded) {
          this.setState({
            chainView: {
              loading: false,
              error: message,
              data: prefetchedChain,
              highlightAnchorUid,
            },
          });
        } else {
          this.setState({
            chainView: {
              loading: false,
              error: message,
              data: null,
              highlightAnchorUid,
            },
          });
        }
      });
  };

  handleCloseCompetencyChain = () => {
    this.setState({ chainView: null });
  };

  handleChainSelectNeighbor = (nextUid) => {
    const { chainView } = this.state;
    const fullChain = chainView && chainView.data && chainView.data.full_chain;
    if (fullChain && Array.isArray(fullChain) && nextUid) {
      const idx = fullChain.findIndex((step) => step && step.uid === nextUid);
      if (idx !== -1) {
        const cur = fullChain[idx];
        const data = {
          previous: idx > 0 ? fullChain[idx - 1] : null,
          current: cur,
          next: idx < fullChain.length - 1 ? fullChain[idx + 1] : null,
          full_chain: fullChain,
          _has_network: Boolean(cur && cur.network_links && cur.network_links.length > 0),
        };
        this.enrichChainDataWithNetworkApi(data).then((enriched) => {
          this.setState({
            chainView: {
              ...chainView,
              loading: false,
              error: null,
              data: enriched,
            },
          });
        });
        return;
      }
    }
    this.handleOpenCompetencyChain(nextUid);
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
      queryValidationError,
      revealResults,
      chainView,
      searchQueryProfile,
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
    const fachSections = Object.entries(
      results.reduce((acc, result) => {
        const fachName = result.metadata.fach || "Unbekanntes Fach";
        const themenbereich = result.metadata.themenbereich || "Ohne Themenbereich";

        if (!acc[fachName]) {
          acc[fachName] = {};
        }
        if (!acc[fachName][themenbereich]) {
          acc[fachName][themenbereich] = [];
        }
        acc[fachName][themenbereich].push(result);
        return acc;
      }, {})
    ).map(([fachName, themenbereichMap]) => ({
      fachName,
      themenbereiche: Object.entries(themenbereichMap).map(([themenbereich, items]) => ({
        key: `${fachName}-${themenbereich}`,
        themenbereich,
        items,
      })),
    }));

    return (
      <div className="app-shell">
        {this.renderLocalDevWarnings()}
        <main className="layout">
          <section className="content-column">
            <header className={`hero ${hasSearched ? "hero-compact" : ""}`}>
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
                  placeholder="Stichwort, Unterrichtsidee oder Kompetenzcode (z. B. NT.5.2.a)"
                  value={queryText}
                  className={queryValidationError ? "input-error" : ""}
                  aria-label="Suchanfrage"
                />
                <button onClick={() => this.search()} aria-label="Suche starten" className="search-icon-button">
                  <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.8" />
                    <line x1="16" y1="16" x2="20.5" y2="20.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </header>

            <section className="filters-inline" id="filter-panel" aria-label="Filter">
              <div className="quick-filters">
                <div className="chip-group minimal-group filter-toolbar">
                  <div className="filter-toolbar-row">
                    <div className="filter-cluster filter-cluster-zyklus">
                      <p className="chip-group-title" id="filter-label-zyklus">
                        Zyklus
                      </p>
                      <div className="zyklus-boxes" role="group" aria-labelledby="filter-label-zyklus">
                        {[1, 2, 3].map((value) => {
                          const key = String(value);
                          const isActive = zyklus.includes(key);
                          return (
                            <button
                              key={`zyklus-box-${key}`}
                              type="button"
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
                    </div>
                    <div className="filter-cluster filter-cluster-fach">
                      <p className="chip-group-title" id="filter-label-fach">
                        Fächer
                      </p>
                      <button
                        type="button"
                        className={`fach-expand-toggle ${showFachFilters ? "open" : ""}`}
                        onClick={this.toggleFachFilters}
                        aria-expanded={showFachFilters}
                        aria-controls="fach-picker-panel"
                        aria-label={
                          showFachFilters ? "Fächerliste schließen" : "Fächerliste öffnen"
                        }
                      >
                        <span className="caret" aria-hidden="true">
                          ▾
                        </span>
                      </button>
                      {selectedFachChips.length > 0 ? (
                        <div className="selected-fach-inline">
                          {selectedFachChips.map((chip) => (
                            <button
                              key={`selected-${chip.value}`}
                              type="button"
                              className="active-filter-chip active-filter-chip--compact"
                              style={{ "--chip-accent": this.getFachColor(chip.value) }}
                              title={chip.label}
                              onClick={() => this.removeFilterChip("fach", chip.value)}
                              aria-label={`${chip.label} entfernen`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div
                        id="fach-picker-panel"
                        className={`fach-picker-panel ${showFachFilters ? "is-open" : ""}`}
                        aria-hidden={!showFachFilters}
                      >
                        <div className="fach-picker-panel-inner">
                          <div className="chip-row fach-picker-row">
                            {fachChips.map((chip) => {
                              const isActive = this.isChipActive(chip);
                              return (
                                <button
                                  key={`${chip.type}-${chip.value}`}
                                  type="button"
                                  tabIndex={showFachFilters ? 0 : -1}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="results-panel" aria-live="polite">
            {hasSearched ? (
              <div className="results-header">
                <h2>Ergebnisse</h2>
                {!searchError && !isLoading && (
                  <span>{results.length} Treffer</span>
                )}
                {!searchError &&
                  !isLoading &&
                  searchQueryProfile &&
                  QUERY_PROFILE_HELP[searchQueryProfile] ? (
                  <p className="search-profile-hint">
                    {QUERY_PROFILE_HELP[searchQueryProfile]}
                  </p>
                ) : null}
              </div>
            ) : null}

            {isLoading && <p className="status-message">Suche läuft ...</p>}
            {searchError && <p className="status-message error">{searchError}</p>}

            {chainView ? (
              <CompetencyChainView
                loading={Boolean(chainView.loading)}
                error={chainView.error}
                chainData={chainView.data}
                highlightAnchorUid={chainView.highlightAnchorUid}
                onBack={this.handleCloseCompetencyChain}
                onSelectNeighbor={this.handleChainSelectNeighbor}
                getZyklusColorByPart={this.getZyklusColor}
                getFachColor={this.getFachColor}
                getCompetencyNetworkUrl={(uid) =>
                  apiUrl(`/api/competency-network/${encodeURIComponent(uid)}`)
                }
              />
            ) : null}

            {!chainView && !isLoading && !searchError && results.length > 0 && (
              <div className={`results-groups ${revealResults ? "results-fade-in" : ""}`}>
                {fachSections.map((fachSection) => (
                  <section
                    className="fach-section"
                    key={fachSection.fachName}
                    style={{ "--fach-color": this.getFachColor(fachSection.fachName) }}
                  >
                    <div className="fach-section-header">
                      <span className="group-fach-pill">{fachSection.fachName}</span>
                    </div>
                    <div className="fach-section-content">
                      {fachSection.themenbereiche.map((group) => (
                        <section className="result-group" key={group.key}>
                          <div className="result-group-header">
                            <div className="result-group-title-wrap">
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
                                competencyUid={result.documentUid || result.metadata.uid}
                                prefetchedChain={result.prefetchedChain || result.metadata._competency_chain}
                                metadata={result.metadata}
                                onOpenCompetencyChain={this.handleOpenCompetencyChain}
                                getCompetencyChainUrl={(uid) =>
                                  apiUrl(
                                    `/api/competency-chain/${encodeURIComponent(uid)}`
                                  )
                                }
                              />
                            ))}
                          </div>
                        </section>
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