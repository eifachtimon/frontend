import SearchResult from "./components/SearchResult";
import CompetencyChainView from "./components/CompetencyChainView";
import CurriculumMapOverlay from "./components/CurriculumMapOverlay";
import React, { Component } from "react";
import "./App.css";
import { APP_ROUTES, chainPath } from "./config/appUrls";
import {
  clearRecentCompetencies,
  pushRecentCompetency,
  readRecentCompetencies,
  truncateCompetencyLabel,
} from "./recentCompetencyHistory";
import { competencyEntryFromSearchResult } from "./utils/competencyUid";
import {
  addFolder,
  bookmarkExists,
  clearBookmarksStorage,
  DEFAULT_FOLDER_ID,
  deleteFolderMergeIntoDefault,
  folderToPlainTextForWord,
  loadBookmarkStore,
  moveBookmark,
  removeBookmarkAndSave,
  renameFolder,
  replaceBookmarkStore,
  sanitizeFileBaseName,
  totalBookmarkCount,
  uidSetFromStore,
  upsertBookmarkInDefaultFolder,
} from "./competencyBookmarks";

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

/** Querverweise-Nachladen: Fokus-UID kann in einer zusammengeführten Ketten-Stufe stecken. */
const chainStepContainsFocusUid = (step, focusUid) => {
  if (!step || focusUid == null || focusUid === "") {
    return false;
  }
  const f = String(focusUid).trim();
  if (step.uid != null && String(step.uid).trim() === f) {
    return true;
  }
  const mus = step.merged_uids;
  return Array.isArray(mus) && mus.some((u) => u != null && String(u).trim() === f);
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
      /** „Zuletzt angesehen“ — synchron zu localStorage */
      recentCompetencies: [],
      bookmarkStore: loadBookmarkStore(),
      bookmarkDrawerOpen: false,
      bookmarkDrawerTab: "merkliste",
      /** Ordner aufgeklappt (folderId → true); fehlt = offen wenn Einträge */
      bookmarkFolderExpanded: {},
      /** Nach „Leeren“: Snapshot für Rückgängig */
      bookmarkUndoSnapshot: null,
      /** Drag-and-Drop Zielordner (Highlight) */
      bookmarkDropTargetFolderId: null,
      /** Landkarte-Overlay (Fach → Thema → Ketten) */
      curriculumMapOpen: false,
      /** Einmaliger Fokus für CurriculumMapOverlay (z. B. aus ChainView-Kontext). */
      mapExplorerFocusRequest: null,
      /** Nur Dev: null | true | false — GET /health gegen API_ROOT */
      devBackendReachable: null,
      vorhabenToast: null,
    };
    this.searchDebounceTimer = null;
    this.bookmarkDrawerEscapeHandler = null;
    this.bookmarkUndoTimerId = null;
    /** Verhindert, dass ein älterer /competency-chain-Fetch die ChainView überschreibt. */
    this._chainViewRequestId = 0;
    /** Monoton für `mapExplorerFocusRequest.nonce`. */
    this._mapExplorerFocusNonce = 0;
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

    try {
      this.setState({
        recentCompetencies: readRecentCompetencies(),
        bookmarkStore: loadBookmarkStore(),
      });
    } catch (_e) {
      // ignore
    }

    this.syncFromRouteProps(this.props);
  }

  syncFromRouteProps = (props, prevProps) => {
    const uid =
      props.routeChainUid != null ? String(props.routeChainUid).trim() : "";
    const prevUid =
      prevProps && prevProps.routeChainUid != null
        ? String(prevProps.routeChainUid).trim()
        : "";
    if (uid && uid !== prevUid) {
      this.handleOpenCompetencyChain(uid, null, null, {});
    } else if (!uid && prevUid) {
      this.setState({ chainView: null });
    }
    if (props.initialMapOpen) {
      this.setState({ curriculumMapOpen: true });
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const routeChanged =
      prevProps.routeChainUid !== this.props.routeChainUid ||
      prevProps.initialMapOpen !== this.props.initialMapOpen;
    if (routeChanged) {
      this.syncFromRouteProps(this.props, prevProps);
    }

    if (prevState.bookmarkDrawerOpen !== this.state.bookmarkDrawerOpen) {
      if (this.state.bookmarkDrawerOpen) {
        this.bookmarkDrawerEscapeHandler = (event) => {
          if (event.key === "Escape") {
            this.setState({ bookmarkDrawerOpen: false });
          }
        };
        document.addEventListener("keydown", this.bookmarkDrawerEscapeHandler);
      } else if (this.bookmarkDrawerEscapeHandler) {
        document.removeEventListener(
          "keydown",
          this.bookmarkDrawerEscapeHandler
        );
        this.bookmarkDrawerEscapeHandler = null;
      }
      if (typeof document !== "undefined" && document.body) {
        document.body.style.overflow = this.state.bookmarkDrawerOpen
          ? "hidden"
          : "";
      }
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
    if (this.vorhabenToastTimerId) {
      clearTimeout(this.vorhabenToastTimerId);
      this.vorhabenToastTimerId = null;
    }
    if (this.handleVisibilityForHealth) {
      document.removeEventListener("visibilitychange", this.handleVisibilityForHealth);
    }
    if (this.bookmarkDrawerEscapeHandler) {
      document.removeEventListener(
        "keydown",
        this.bookmarkDrawerEscapeHandler
      );
      this.bookmarkDrawerEscapeHandler = null;
    }
    if (this.bookmarkUndoTimerId) {
      clearTimeout(this.bookmarkUndoTimerId);
      this.bookmarkUndoTimerId = null;
    }
    if (typeof document !== "undefined" && document.body) {
      document.body.style.overflow = "";
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

        const elapsed = Date.now() - searchStartedAt;
        const remaining = Math.max(0, 500 - elapsed);
        setTimeout(() => {
          this.setState({
            results,
            isLoading: false,
            hasSearched: true,
            searchError: "",
            revealResults: true,
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
  recordRecentCompetencyView = (partial) => {
    const next = pushRecentCompetency(partial);
    this.setState({ recentCompetencies: next });
  };

  resolveRecentLabelForOpen = (uid, prefetchedChain, recentContext) => {
    const embedded =
      prefetchedChain &&
      (prefetchedChain.current || prefetchedChain["current"]);
    if (recentContext && recentContext.label) {
      return truncateCompetencyLabel(recentContext.label, 120);
    }
    if (embedded && embedded.text) {
      return truncateCompetencyLabel(embedded.text, 120);
    }
    if (recentContext && recentContext.code) {
      return String(recentContext.code).trim();
    }
    if (embedded && embedded.code) {
      return String(embedded.code).trim();
    }
    return uid;
  };

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
              step && chainStepContainsFocusUid(step, focusUid)
                ? { ...step, network_links: links }
                : step
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

  handleOpenCompetencyChain = (rawUid, prefetchedChain, recentContext, openOptions) => {
    const uid =
      typeof rawUid === "string"
        ? rawUid.trim()
        : rawUid != null
          ? String(rawUid).trim()
          : "";
    if (!uid) {
      return;
    }

    const { routerNavigate } = this.props;
    const chainRoute = chainPath(uid);
    if (routerNavigate && window.location.pathname !== chainRoute) {
      routerNavigate(chainRoute);
    }
    if (this.state.curriculumMapOpen) {
      this.setState({ curriculumMapOpen: false, mapExplorerFocusRequest: null });
    }

    const requestId = ++this._chainViewRequestId;

    const highlightAnchorUid = uid;
    const searchSelectionHighlight = Boolean(
      openOptions && openOptions.searchSelectionHighlight
    );

    const embedded =
      prefetchedChain &&
      (prefetchedChain.current || prefetchedChain["current"]);
    const label = this.resolveRecentLabelForOpen(uid, prefetchedChain, recentContext);
    const code =
      recentContext && recentContext.code != null
        ? String(recentContext.code).trim() || undefined
        : embedded && embedded.code != null
          ? String(embedded.code).trim() || undefined
          : undefined;
    const fach =
      recentContext && recentContext.fach != null
        ? String(recentContext.fach).trim() || undefined
        : embedded && embedded.fach != null
          ? String(embedded.fach).trim() || undefined
          : undefined;
    this.recordRecentCompetencyView({
      uid,
      code,
      fach,
      label: label || uid,
    });

    // Kurz eingebettete Daten zeigen, dann immer frisch laden — damit u.a.
    // network_links und _has_network aus der aktuellen API garantiert sind.
    if (embedded) {
      this.setState({
        chainView: {
          loading: false,
          error: null,
          data: prefetchedChain,
          highlightAnchorUid,
          searchSelectionHighlight,
        },
      });
    } else {
      this.setState({
        chainView: {
          loading: true,
          error: null,
          data: null,
          highlightAnchorUid,
          searchSelectionHighlight,
        },
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
        if (requestId !== this._chainViewRequestId) {
          return;
        }
        this.setState((prev) => ({
          chainView: prev.chainView
            ? {
                ...prev.chainView,
                loading: false,
                error: null,
                data,
                searchSelectionHighlight,
              }
            : {
                loading: false,
                error: null,
                data,
                highlightAnchorUid,
                searchSelectionHighlight,
              },
        }));
      })
      .catch((error) => {
        if (requestId !== this._chainViewRequestId) {
          return;
        }
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
              searchSelectionHighlight,
            },
          });
        } else {
          this.setState({
            chainView: {
              loading: false,
              error: message,
              data: null,
              highlightAnchorUid,
              searchSelectionHighlight,
            },
          });
        }
      });
  };

  handleCloseCompetencyChain = () => {
    this.setState({ chainView: null });
    const { routerNavigate } = this.props;
    if (routerNavigate) {
      routerNavigate(APP_ROUTES.search);
    }
  };

  handleCloseCurriculumMap = () => {
    this.setState({ curriculumMapOpen: false, mapExplorerFocusRequest: null });
    if (this.props.initialMapOpen && this.props.routerNavigate) {
      this.props.routerNavigate(APP_ROUTES.search);
    }
  };

  handleOpenLandkarteRoute = () => {
    this.setState({ curriculumMapOpen: true, mapExplorerFocusRequest: null });
  };

  handleOpenCurriculumMapFromChainContext = (payload) => {
    if (!payload || !String(payload.fachName || "").trim()) {
      return;
    }
    this._mapExplorerFocusNonce += 1;
    this.setState({
      curriculumMapOpen: true,
      mapExplorerFocusRequest: { nonce: this._mapExplorerFocusNonce, ...payload },
    });
  };

  handleMapExplorerFocusApplied = (nonce) => {
    this.setState((prev) => {
      const cur = prev.mapExplorerFocusRequest;
      if (!cur || cur.nonce !== nonce) {
        return null;
      }
      return { mapExplorerFocusRequest: null };
    });
  };

  handleChainSelectNeighbor = (nextUid) => {
    const { chainView } = this.state;
    const fullChain = chainView && chainView.data && chainView.data.full_chain;
    if (fullChain && Array.isArray(fullChain) && nextUid) {
      const idx = fullChain.findIndex(
        (step) =>
          step &&
          ((step.doc_key && step.doc_key === nextUid) ||
            (step.uid && step.uid === nextUid))
      );
      if (idx !== -1) {
        const cur = fullChain[idx];
        const data = {
          previous: idx > 0 ? fullChain[idx - 1] : null,
          current: cur,
          next: idx < fullChain.length - 1 ? fullChain[idx + 1] : null,
          full_chain: fullChain,
          _has_network: Boolean(cur && cur.network_links && cur.network_links.length > 0),
        };
        const stepUid = (cur && cur.uid) || nextUid;
        const stepLabel =
          truncateCompetencyLabel(cur && cur.text, 120) ||
          (cur && cur.code ? String(cur.code).trim() : "") ||
          stepUid;
        this.recordRecentCompetencyView({
          uid: stepUid,
          code: cur && cur.code ? String(cur.code).trim() : undefined,
          fach: cur && cur.fach ? String(cur.fach).trim() : undefined,
          label: stepLabel,
        });
        const { routerNavigate } = this.props;
        if (routerNavigate && stepUid) {
          routerNavigate(chainPath(stepUid));
        }
        this.enrichChainDataWithNetworkApi(data).then((enriched) => {
          this.setState({
            chainView: {
              ...chainView,
              loading: false,
              error: null,
              data: enriched,
              searchSelectionHighlight: false,
            },
          });
        });
        return;
      }
    }
    this.handleOpenCompetencyChain(nextUid);
  };

  handleClearRecentHistory = () => {
    clearRecentCompetencies();
    this.setState({ recentCompetencies: [] });
  };

  handleOpenFromRecent = (entry) => {
    if (!entry || !entry.uid) {
      return;
    }
    this.handleOpenCompetencyChain(entry.uid, null, {
      code: entry.code,
      fach: entry.fach,
      label: entry.label,
    });
    this.setState({ bookmarkDrawerOpen: false });
  };

  formatRecentTimestamp = (ts) => {
    if (typeof ts !== "number" || !Number.isFinite(ts)) {
      return "";
    }
    try {
      const d = new Date(ts);
      const now = new Date();
      const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
      if (sameDay) {
        return d.toLocaleTimeString("de-CH", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return d.toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_e) {
      return "";
    }
  };

  /**
   * UID für Kartenklick / Chain — zuerst aus eingebetteter Kette (wie Backend lookup für diesen Treffer),
   * dann Chroma-/Metadaten-IDs.
   */
  resolveCompetencyOpenUidFromResult = (result) => {
    if (!result) {
      return null;
    }
    const chain =
      result.prefetchedChain || result.metadata?._competency_chain;
    const fromDocKey =
      chain?.current?.doc_key != null && String(chain.current.doc_key).trim()
        ? String(chain.current.doc_key).trim()
        : "";
    const fromChainUid =
      chain?.current?.uid != null && String(chain.current.uid).trim()
        ? String(chain.current.uid).trim()
        : "";
    const fromDoc =
      result.documentUid != null && String(result.documentUid).trim()
        ? String(result.documentUid).trim()
        : "";
    const fromMeta =
      result.metadata?.uid != null && String(result.metadata.uid).trim()
        ? String(result.metadata.uid).trim()
        : "";
    const fromLp21Row =
      result.metadata?.lp21_row_index != null &&
      String(result.metadata.lp21_row_index).trim() !== ""
        ? `lp21:${String(result.metadata.lp21_row_index).trim()}`
        : "";
    return fromDocKey || fromChainUid || fromDoc || fromLp21Row || fromMeta || null;
  };

  resolveBookmarkUidFromResult = (result) => {
    const chain =
      result.prefetchedChain || result.metadata?._competency_chain;
    const fromDocKey =
      chain?.current?.doc_key != null && String(chain.current.doc_key).trim()
        ? String(chain.current.doc_key).trim()
        : "";
    const fromChainUid =
      chain && chain.current && chain.current.uid
        ? String(chain.current.uid).trim()
        : "";
    const fromDoc =
      result.documentUid != null && String(result.documentUid).trim()
        ? String(result.documentUid).trim()
        : "";
    const fromMeta =
      result.metadata && result.metadata.uid != null
        ? String(result.metadata.uid).trim()
        : "";
    const fromLp21Row =
      result.metadata &&
      result.metadata.lp21_row_index != null &&
      String(result.metadata.lp21_row_index).trim() !== ""
        ? `lp21:${String(result.metadata.lp21_row_index).trim()}`
        : "";
    return fromDocKey || fromDoc || fromLp21Row || fromMeta || fromChainUid || null;
  };

  handleToggleBookmarkEntry = (partial) => {
    const uid =
      partial && typeof partial.uid === "string"
        ? partial.uid.trim()
        : partial && partial.uid != null
          ? String(partial.uid).trim()
          : "";
    if (!uid) {
      return;
    }
    const { bookmarkStore } = this.state;
    if (bookmarkExists(uid, bookmarkStore)) {
      this.setState({
        bookmarkStore: removeBookmarkAndSave(uid, bookmarkStore),
      });
    } else {
      this.setState({
        bookmarkStore: upsertBookmarkInDefaultFolder(partial, bookmarkStore),
      });
    }
  };

  handleToggleBookmarkFromChainStep = (item) => {
    if (!item) {
      return;
    }
    const bookmarkId =
      (item.doc_key != null && String(item.doc_key).trim()) ||
      (item.uid != null && String(item.uid).trim()) ||
      "";
    if (!bookmarkId) {
      return;
    }
    this.handleToggleBookmarkEntry({
      uid: bookmarkId,
      label: truncateCompetencyLabel(item.text || item.code || bookmarkId, 200),
      code: item.code,
      fach: item.fach,
      zyklus: item.zyklus,
      themenbereich: item.themenbereich,
    });
  };

  handleAddedToVorhaben = (vorhaben) => {
    if (!vorhaben?.title) {
      return;
    }
    this.setState({
      vorhabenToast: `Kompetenz in «${vorhaben.title}» übernommen.`,
    });
    if (this.vorhabenToastTimerId) {
      clearTimeout(this.vorhabenToastTimerId);
    }
    this.vorhabenToastTimerId = window.setTimeout(() => {
      this.setState({ vorhabenToast: null });
      this.vorhabenToastTimerId = null;
    }, 4000);
  };

  handleOpenBookmarkDrawer = () => {
    this.setState({ bookmarkDrawerOpen: true });
  };

  handleBookmarkDrawerTab = (tab) => {
    this.setState({ bookmarkDrawerTab: tab });
  };

  isBookmarkFolderExpanded = (folderId, itemCount) => {
    const { bookmarkFolderExpanded } = this.state;
    if (bookmarkFolderExpanded[folderId] !== undefined) {
      return bookmarkFolderExpanded[folderId];
    }
    return itemCount > 0;
  };

  handleToggleBookmarkFolder = (folderId) => {
    const itemCount =
      this.state.bookmarkStore?.folders?.find((f) => f.id === folderId)?.items
        ?.length ?? 0;
    const currently = this.isBookmarkFolderExpanded(folderId, itemCount);
    this.setState((prev) => ({
      bookmarkFolderExpanded: {
        ...prev.bookmarkFolderExpanded,
        [folderId]: !currently,
      },
    }));
  };

  handleCloseBookmarkDrawer = () => {
    this.setState({ bookmarkDrawerOpen: false });
  };

  handleOverlayPointerClose = (event) => {
    if (event.target === event.currentTarget) {
      this.handleCloseBookmarkDrawer();
    }
  };

  handleClearBookmarksWithUndo = () => {
    const snapshot = JSON.parse(JSON.stringify(this.state.bookmarkStore));
    clearBookmarksStorage();
    if (this.bookmarkUndoTimerId) {
      clearTimeout(this.bookmarkUndoTimerId);
    }
    this.setState({
      bookmarkStore: loadBookmarkStore(),
      bookmarkUndoSnapshot: snapshot,
    });
    this.bookmarkUndoTimerId = setTimeout(() => {
      this.bookmarkUndoTimerId = null;
      this.setState({ bookmarkUndoSnapshot: null });
    }, 10000);
  };

  handleBookmarkUndoClear = () => {
    if (this.bookmarkUndoTimerId) {
      clearTimeout(this.bookmarkUndoTimerId);
      this.bookmarkUndoTimerId = null;
    }
    const snap = this.state.bookmarkUndoSnapshot;
    if (!snap) {
      this.setState({ bookmarkUndoSnapshot: null });
      return;
    }
    this.setState({
      bookmarkStore: replaceBookmarkStore(snap),
      bookmarkUndoSnapshot: null,
    });
  };

  handleRemoveBookmarkFromList = (uid) => {
    this.setState({
      bookmarkStore: removeBookmarkAndSave(uid, this.state.bookmarkStore),
    });
  };

  handleAddFolderClick = () => {
    const name = window.prompt("Name für den neuen Ordner:", "Neuer Ordner");
    if (name == null) {
      return;
    }
    const trimmed = String(name).trim();
    if (!trimmed) {
      return;
    }
    this.setState({
      bookmarkStore: addFolder(this.state.bookmarkStore, trimmed),
    });
  };

  handleRenameFolderClick = (folderId, currentName) => {
    const name = window.prompt("Ordner umbenennen:", currentName);
    if (name == null) {
      return;
    }
    const trimmed = String(name).trim();
    if (!trimmed) {
      return;
    }
    this.setState({
      bookmarkStore: renameFolder(this.state.bookmarkStore, folderId, trimmed),
    });
  };

  handleDeleteFolderClick = (folderId) => {
    if (folderId === DEFAULT_FOLDER_ID) {
      return;
    }
    if (
      !window.confirm(
        "Ordner löschen? Alle Kompetenzen werden in den Standardordner verschoben."
      )
    ) {
      return;
    }
    this.setState({
      bookmarkStore: deleteFolderMergeIntoDefault(this.state.bookmarkStore, folderId),
    });
  };

  handleBookmarkDragStart = (event, uid, folderId) => {
    event.dataTransfer.setData(
      "application/x-lp21-bookmark",
      JSON.stringify({ uid, folderId })
    );
    event.dataTransfer.setData("text/plain", uid);
    event.dataTransfer.effectAllowed = "move";
  };

  handleBookmarkDragEnd = () => {
    this.setState({ bookmarkDropTargetFolderId: null });
  };

  handleBookmarkDragOverFolder = (event, folderId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    this.setState({ bookmarkDropTargetFolderId: folderId });
  };

  handleBookmarkDragLeaveFolder = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      this.setState({ bookmarkDropTargetFolderId: null });
    }
  };

  handleDropOnFolderBody = (event, targetFolderId) => {
    event.preventDefault();
    event.stopPropagation();
    let payload = null;
    try {
      payload = JSON.parse(
        event.dataTransfer.getData("application/x-lp21-bookmark")
      );
    } catch (_e) {
      return;
    }
    if (!payload || !payload.uid) {
      return;
    }
    const next = moveBookmark(
      this.state.bookmarkStore,
      payload.uid,
      targetFolderId,
      null
    );
    this.setState({
      bookmarkStore: next,
      bookmarkDropTargetFolderId: null,
    });
  };

  handleDropOnFolderItem = (event, targetFolderId, beforeUid) => {
    event.preventDefault();
    event.stopPropagation();
    let payload = null;
    try {
      payload = JSON.parse(
        event.dataTransfer.getData("application/x-lp21-bookmark")
      );
    } catch (_e) {
      return;
    }
    if (!payload || !payload.uid) {
      return;
    }
    if (payload.uid === beforeUid) {
      return;
    }
    const next = moveBookmark(
      this.state.bookmarkStore,
      payload.uid,
      targetFolderId,
      beforeUid
    );
    this.setState({
      bookmarkStore: next,
      bookmarkDropTargetFolderId: null,
    });
  };

  handleCopyFolderPlain = async (folder) => {
    const text = folderToPlainTextForWord(folder);
    try {
      await navigator.clipboard.writeText(text);
    } catch (_err) {
      window.prompt("Kopieren nicht möglich. Text markieren und kopieren:", text);
    }
  };

  handleDownloadFolderTxt = (folder) => {
    const text = folderToPlainTextForWord(folder);
    const blob = new Blob(["\uFEFF", text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileBaseName(folder.name)}.txt`;
    anchor.rel = "noopener";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  handleOpenChainFromBookmark = (entry) => {
    if (!entry || !entry.uid) {
      return;
    }
    this.handleOpenCompetencyChain(entry.uid, null, {
      code: entry.code,
      fach: entry.fach,
      label: entry.label,
    });
    this.setState({ bookmarkDrawerOpen: false });
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
      recentCompetencies,
      bookmarkStore,
      bookmarkDrawerOpen,
      bookmarkDrawerTab,
      bookmarkUndoSnapshot,
      bookmarkDropTargetFolderId,
      curriculumMapOpen,
      mapExplorerFocusRequest,
    } = this.state;
    const bookmarkIdSet = uidSetFromStore(bookmarkStore);
    const bookmarkTotal = totalBookmarkCount(bookmarkStore);
    const foldersOrdered =
      bookmarkStore && Array.isArray(bookmarkStore.folders)
        ? [
            ...bookmarkStore.folders.filter((f) => f.id === DEFAULT_FOLDER_ID),
            ...bookmarkStore.folders.filter((f) => f.id !== DEFAULT_FOLDER_ID),
          ]
        : [];
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

    const { vorhabenToast } = this.state;

    const mapOpen = curriculumMapOpen;

    return (
      <div
        className={`app-shell planning-surface app-shell--search${
          mapOpen ? " app-shell--map-open" : ""
        }`}
      >
        {this.renderLocalDevWarnings()}
        {vorhabenToast ? (
          <div className="app-toast app-toast--vorhaben" role="status">
            {vorhabenToast}
          </div>
        ) : null}
        <button
          type="button"
          className="bookmark-drawer-fab"
          onClick={this.handleOpenBookmarkDrawer}
          aria-expanded={bookmarkDrawerOpen}
          aria-controls="bookmark-drawer-panel"
          aria-haspopup="dialog"
          aria-label="Merkliste öffnen"
          title="Merkliste"
        >
          <svg className="bookmark-drawer-fab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"
            />
          </svg>
          {bookmarkTotal > 0 ? (
            <span className="bookmark-drawer-fab-badge">{bookmarkTotal}</span>
          ) : null}
        </button>

        <div
          className={`bookmark-drawer-overlay ${bookmarkDrawerOpen ? "is-open" : ""}`}
          aria-hidden={!bookmarkDrawerOpen}
          onClick={this.handleOverlayPointerClose}
          role="presentation"
        />

        <aside
          id="bookmark-drawer-panel"
          className={`bookmark-drawer ${bookmarkDrawerOpen ? "is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sidebar-drawer-heading"
          aria-hidden={!bookmarkDrawerOpen}
        >
          <div className="bookmark-drawer-inner">
            <h2 id="sidebar-drawer-heading" className="bookmark-drawer-sr-only">
              Merkliste
            </h2>
            <header className="bookmark-drawer-header bookmark-drawer-header--tabs">
              <div className="bookmark-drawer-tabs-wrap" role="tablist" aria-label="Merkliste Bereiche">
                <button
                  type="button"
                  role="tab"
                  className={`bookmark-drawer-tab ${bookmarkDrawerTab === "merkliste" ? "is-active" : ""}`}
                  aria-selected={bookmarkDrawerTab === "merkliste"}
                  onClick={() => this.handleBookmarkDrawerTab("merkliste")}
                >
                  Merkliste
                  {bookmarkTotal > 0 ? (
                    <span className="bookmark-drawer-tab-count"> ({bookmarkTotal})</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`bookmark-drawer-tab ${bookmarkDrawerTab === "recent" ? "is-active" : ""}`}
                  aria-selected={bookmarkDrawerTab === "recent"}
                  onClick={() => this.handleBookmarkDrawerTab("recent")}
                >
                  Zuletzt
                  {recentCompetencies.length > 0 ? (
                    <span className="bookmark-drawer-tab-count">
                      {" "}
                      ({recentCompetencies.length})
                    </span>
                  ) : null}
                </button>
              </div>
              <button
                type="button"
                className="bookmark-drawer-close"
                onClick={this.handleCloseBookmarkDrawer}
                aria-label="Merkliste schließen"
              >
                ×
              </button>
            </header>

            <div
              className="bookmark-drawer-tabpanel"
              role="tabpanel"
              aria-labelledby="sidebar-drawer-heading"
            >
              <div className="bookmark-drawer-tabpanel-inner">
                {bookmarkDrawerTab === "merkliste" ? (
                  <>
                    <div className="bookmark-drawer-toolbar">
                      <button
                        type="button"
                        className="bookmark-toolbar-btn"
                        onClick={this.handleAddFolderClick}
                        aria-label="Neuen Ordner hinzufügen"
                      >
                        + Ordner
                      </button>
                      <button
                        type="button"
                        className="bookmark-toolbar-btn bookmark-toolbar-btn--muted"
                        onClick={this.handleClearBookmarksWithUndo}
                        disabled={bookmarkTotal === 0}
                        aria-label="Gesamte Merkliste leeren"
                      >
                        Leeren
                      </button>
                    </div>

                    {bookmarkTotal === 0 ? (
                      <p className="bookmark-drawer-empty">
                        Noch keine Kompetenzen gemerkt. In den Suchergebnissen auf das
                        Lesezeichen tippen.
                      </p>
                    ) : (
                      <div className="bookmark-drawer-scroll bookmark-drawer-scroll--folders">
                {foldersOrdered.map((folder) => {
                  const itemCount = folder.items ? folder.items.length : 0;
                  const folderOpen = this.isBookmarkFolderExpanded(folder.id, itemCount);
                  return (
                  <section
                    key={folder.id}
                    className={`bookmark-folder ${bookmarkDropTargetFolderId === folder.id ? "bookmark-folder--drop" : ""} ${folderOpen ? "" : "bookmark-folder--collapsed"}`}
                    onDragOver={(event) =>
                      this.handleBookmarkDragOverFolder(event, folder.id)
                    }
                    onDragLeave={this.handleBookmarkDragLeaveFolder}
                    onDrop={(event) => this.handleDropOnFolderBody(event, folder.id)}
                  >
                    <div className="bookmark-folder-head">
                      <button
                        type="button"
                        className="bookmark-folder-toggle"
                        onClick={() => this.handleToggleBookmarkFolder(folder.id)}
                        aria-expanded={folderOpen}
                      >
                        <span className="bookmark-folder-chevron" aria-hidden="true">
                          {folderOpen ? "▾" : "▸"}
                        </span>
                        <span className="bookmark-folder-name">{folder.name}</span>
                        <span className="bookmark-folder-count">{itemCount}</span>
                      </button>
                      <details className="bookmark-folder-menu">
                        <summary aria-label={`Aktionen für ${folder.name}`}>⋯</summary>
                        <div className="bookmark-folder-menu-panel">
                          <button
                            type="button"
                            onClick={() =>
                              this.handleRenameFolderClick(folder.id, folder.name)
                            }
                          >
                            Umbenennen
                          </button>
                          <button
                            type="button"
                            onClick={() => this.handleCopyFolderPlain(folder)}
                            disabled={itemCount === 0}
                          >
                            Kopieren
                          </button>
                          <button
                            type="button"
                            onClick={() => this.handleDownloadFolderTxt(folder)}
                            disabled={itemCount === 0}
                          >
                            Textdatei
                          </button>
                          {folder.id !== DEFAULT_FOLDER_ID ? (
                            <button
                              type="button"
                              className="bookmark-folder-menu-danger"
                              onClick={() => this.handleDeleteFolderClick(folder.id)}
                            >
                              Löschen
                            </button>
                          ) : null}
                        </div>
                      </details>
                    </div>

                    {folderOpen ? (
                    <ul className="bookmark-folder-list">
                      {!folder.items || folder.items.length === 0 ? (
                        <li className="bookmark-folder-placeholder">
                          Noch leer — Einträge hierher ziehen
                        </li>
                      ) : (
                        folder.items.map((entry) => {
                          const metaLine = [entry.code, entry.fach]
                            .filter(Boolean)
                            .join(" · ");
                          return (
                            <li key={entry.uid}>
                              <div className="bookmark-drawer-row bookmark-drawer-row--with-drag">
                                <button
                                  type="button"
                                  className="bookmark-drag-handle"
                                  draggable
                                  onDragStart={(event) =>
                                    this.handleBookmarkDragStart(
                                      event,
                                      entry.uid,
                                      folder.id
                                    )
                                  }
                                  onDragEnd={this.handleBookmarkDragEnd}
                                  aria-label={`${entry.label}: Ziehen zum Verschieben`}
                                  title="Ziehen zum Verschieben"
                                >
                                  <span aria-hidden="true">⠿</span>
                                </button>
                                <button
                                  type="button"
                                  className="bookmark-drawer-row-main"
                                  onClick={() =>
                                    this.handleOpenChainFromBookmark(entry)
                                  }
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  }}
                                  onDrop={(event) =>
                                    this.handleDropOnFolderItem(
                                      event,
                                      folder.id,
                                      entry.uid
                                    )
                                  }
                                >
                                  <span className="bookmark-drawer-row-label">
                                    {entry.label}
                                  </span>
                                  {metaLine ? (
                                    <span className="bookmark-drawer-row-meta">
                                      {metaLine}
                                    </span>
                                  ) : null}
                                </button>
                                <button
                                  type="button"
                                  className="bookmark-drawer-row-remove"
                                  onClick={() =>
                                    this.handleRemoveBookmarkFromList(entry.uid)
                                  }
                                  aria-label={`${entry.label} von Merkliste entfernen`}
                                >
                                  ×
                                </button>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                    ) : (
                      <p className="bookmark-folder-placeholder">
                        Leer — per Drag &amp; Drop verschieben
                      </p>
                    )}
                  </section>
                  );
                })}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="bookmark-drawer-toolbar bookmark-drawer-toolbar--solo">
                      <button
                        type="button"
                        className="bookmark-toolbar-btn bookmark-toolbar-btn--muted"
                        onClick={this.handleClearRecentHistory}
                        disabled={recentCompetencies.length === 0}
                        aria-label="Zuletzt angesehen leeren"
                      >
                        Verlauf leeren
                      </button>
                    </div>
                    {recentCompetencies.length === 0 ? (
                      <p className="bookmark-drawer-empty bookmark-drawer-empty--tight">
                        Noch keine Einträge.
                      </p>
                    ) : (
                      <ul className="bookmark-drawer-list bookmark-drawer-list--recentsidebar">
                        {recentCompetencies.map((entry) => {
                          const metaLine = [entry.code, entry.fach]
                            .filter(Boolean)
                            .join(" · ");
                          const timeStr = this.formatRecentTimestamp(entry.ts);
                          const aria = [
                            "Kompetenz im Aufbau-Kontext öffnen:",
                            entry.label,
                            metaLine,
                            timeStr,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return (
                            <li key={entry.uid}>
                              <button
                                type="button"
                                className="recent-history-item recent-history-item--in-drawer"
                                onClick={() => this.handleOpenFromRecent(entry)}
                                aria-label={aria}
                              >
                                <span className="recent-history-item-main">
                                  <span className="recent-history-item-label">
                                    {entry.label}
                                  </span>
                                  {metaLine ? (
                                    <span className="recent-history-item-meta">
                                      {metaLine}
                                    </span>
                                  ) : null}
                                </span>
                                {timeStr ? (
                                  <time
                                    className="recent-history-item-time"
                                    dateTime={new Date(entry.ts).toISOString()}
                                  >
                                    {timeStr}
                                  </time>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {bookmarkUndoSnapshot != null ? (
          <div className="bookmark-undo-bar" role="status">
            <span className="bookmark-undo-text">Merkliste geleert.</span>
            <button
              type="button"
              className="bookmark-undo-button"
              onClick={this.handleBookmarkUndoClear}
            >
              Rückgängig
            </button>
          </div>
        ) : null}

        <main className="layout search-main-content">
          <section className="content-column">
            <header className={`hero ${hasSearched ? "hero-compact" : ""}`}>
              <div className="hero-title-row">
                <h1 id="app-main-title">Lehrplan 21 Suche</h1>
                <button
                  type="button"
                  className="hero-map-link"
                  onClick={this.handleOpenLandkarteRoute}
                  aria-expanded={curriculumMapOpen}
                  aria-controls="curriculum-map-root"
                >
                  Landkarte-Explorer
                </button>
              </div>
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
                searchSelectionHighlight={Boolean(chainView.searchSelectionHighlight)}
                onBack={this.handleCloseCompetencyChain}
                onSelectNeighbor={this.handleChainSelectNeighbor}
                getZyklusColorByPart={this.getZyklusColor}
                getFachColor={this.getFachColor}
                getCompetencyNetworkUrl={(uid) =>
                  apiUrl(`/api/competency-network/${encodeURIComponent(uid)}`)
                }
                bookmarkUids={bookmarkIdSet}
                onToggleBookmarkStep={this.handleToggleBookmarkFromChainStep}
                onOpenInCurriculumMap={this.handleOpenCurriculumMapFromChainContext}
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
                            {group.items.map((result) => {
                              const bookmarkUid =
                                this.resolveBookmarkUidFromResult(result);
                              return (
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
                                competencyUid={this.resolveCompetencyOpenUidFromResult(result)}
                                prefetchedChain={result.prefetchedChain || result.metadata._competency_chain}
                                metadata={result.metadata}
                                bookmarkUid={bookmarkUid || undefined}
                                isBookmarked={Boolean(
                                  bookmarkUid && bookmarkIdSet.has(bookmarkUid)
                                )}
                                onToggleBookmark={
                                  bookmarkUid
                                    ? () =>
                                        this.handleToggleBookmarkEntry({
                                          uid: bookmarkUid,
                                          label: truncateCompetencyLabel(
                                            result.text ||
                                              result.metadata.code ||
                                              bookmarkUid,
                                            200
                                          ),
                                          code: result.metadata.code,
                                          fach: result.metadata.fach,
                                          zyklus: result.metadata.zyklus,
                                          themenbereich: result.metadata.themenbereich,
                                        })
                                    : undefined
                                }
                                onOpenCompetencyChain={(uid, prefetchedChain) =>
                                  this.handleOpenCompetencyChain(
                                    uid,
                                    prefetchedChain,
                                    {
                                      code: result.metadata.code,
                                      fach: result.metadata.fach,
                                      label: truncateCompetencyLabel(
                                        result.text ||
                                          result.metadata.code ||
                                          uid,
                                        120
                                      ),
                                    },
                                    { searchSelectionHighlight: true }
                                  )
                                }
                                getCompetencyChainUrl={(uid) =>
                                  apiUrl(
                                    `/api/competency-chain/${encodeURIComponent(uid)}`
                                  )
                                }
                                competencyEntry={competencyEntryFromSearchResult({
                                  text: result.text,
                                  metadata: result.metadata,
                                  prefetchedChain:
                                    result.prefetchedChain ||
                                    result.metadata._competency_chain,
                                  documentUid: this.resolveCompetencyOpenUidFromResult(result),
                                })}
                                onAddedToVorhaben={this.handleAddedToVorhaben}
                                lessonDraftUid={this.resolveCompetencyOpenUidFromResult(
                                  result
                                )}
                                lessonDraftCode={result.metadata.code}
                                lessonDraftFach={result.metadata.fach}
                                lessonDraftText={result.text}
                              />
                              );
                            })}
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

        <CurriculumMapOverlay
          isOpen={curriculumMapOpen}
          fullPage={true}
          onClose={this.handleCloseCurriculumMap}
          apiUrl={apiUrl}
          getFachColor={this.getFachColor}
          getZyklusColorByPart={this.getZyklusColor}
          enrichChainDataWithNetworkApi={this.enrichChainDataWithNetworkApi}
          onRecordRecentView={this.recordRecentCompetencyView}
          bookmarkUids={bookmarkIdSet}
          onBookmarkToggle={this.handleToggleBookmarkEntry}
          mapExplorerFocusRequest={mapExplorerFocusRequest}
          onMapExplorerFocusApplied={this.handleMapExplorerFocusApplied}
          onOpenInCurriculumMapFromChain={this.handleOpenCurriculumMapFromChainContext}
        />
      </div>
    );
  }
}

export default App;