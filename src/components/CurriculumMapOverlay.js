import React, { Component } from "react";
import CompetencyChainView from "./CompetencyChainView";
import { truncateCompetencyLabel } from "../recentCompetencyHistory";
import { describeLp21Code } from "../lp21Code";

function normOutlineToken(s) {
  return String(s || "").toLowerCase();
}

function countOutlineStats(outline) {
  const kbCount = Array.isArray(outline) ? outline.length : 0;
  let chainCount = 0;
  if (Array.isArray(outline)) {
    outline.forEach((kb) => {
      (kb.aspects || []).forEach((asp) => {
        chainCount += (asp.chains || []).length;
      });
    });
  }
  return { kbCount, chainCount };
}

/** Filtert KB / Aspekte / Ketten nach Teilstring (Label, Code, Stufentext). */
function filterOutlineByQuery(outline, query) {
  const q = normOutlineToken(query).trim();
  if (!q) {
    return Array.isArray(outline) ? outline : [];
  }

  const chainMatches = (ch) => {
    const heading = (ch.heading || "").trim();
    const clusterCode = String(ch.cluster_code || "").trim();
    const anchorUid = String(ch.anchor_uid || "").trim();
    if (
      normOutlineToken(heading).includes(q) ||
      normOutlineToken(clusterCode).includes(q) ||
      normOutlineToken(anchorUid).includes(q)
    ) {
      return true;
    }
    const stages = Array.isArray(ch.stages) ? ch.stages : [];
    return stages.some(
      (st) =>
        normOutlineToken(st && st.text).includes(q) ||
        normOutlineToken(st && st.code).includes(q),
    );
  };

  const filterAspect = (aspect) => {
    const chainsIn = aspect.chains || [];
    const filteredChains = chainsIn.filter(chainMatches);
    const aspLabel = String(aspect.aspect_label || "").trim();
    const aspCode =
      aspect.aspect_code != null ? String(aspect.aspect_code).trim() : "";

    if (!aspect.aspect_code) {
      if (filteredChains.length === 0) {
        return null;
      }
      return { ...aspect, chains: filteredChains };
    }
    if (filteredChains.length > 0) {
      return { ...aspect, chains: filteredChains };
    }
    if (
      normOutlineToken(aspLabel).includes(q) ||
      normOutlineToken(aspCode).includes(q)
    ) {
      return { ...aspect, chains: chainsIn };
    }
    return null;
  };

  const filterKb = (kb) => {
    const kbLabel = String(kb.kb_label || "").trim();
    const kbCode = kb.kb_code != null ? String(kb.kb_code).trim() : "";
    if (
      normOutlineToken(kbLabel).includes(q) ||
      normOutlineToken(kbCode).includes(q)
    ) {
      return kb;
    }
    const aspects = (kb.aspects || []).map(filterAspect).filter(Boolean);
    if (aspects.length === 0) {
      return null;
    }
    return { ...kb, aspects };
  };

  return outline.map(filterKb).filter(Boolean);
}

function expandAllMapsFromOutline(outline) {
  const kb = {};
  const aspect = {};
  const chain = {};
  if (!Array.isArray(outline)) {
    return { kb, aspect, chain };
  }
  outline.forEach((kbNode) => {
    const kbCode = kbNode.kb_code != null ? String(kbNode.kb_code) : "";
    kb[kbCode] = true;
    (kbNode.aspects || []).forEach((asp, ai) => {
      aspect[`${kbCode}__${ai}`] = true;
      (asp.chains || []).forEach((ch) => {
        const uid = ch.anchor_uid != null ? String(ch.anchor_uid).trim() : "";
        const stages = Array.isArray(ch.stages) ? ch.stages : [];
        if (uid && stages.length > 0) {
          chain[uid] = true;
        }
      });
    });
  });
  return { kb, aspect, chain };
}

function mergeExpandedForFiltered(baseExp, forcedKeys) {
  return {
    kb: { ...baseExp.kb, ...forcedKeys.kb },
    aspect: { ...baseExp.aspect, ...forcedKeys.aspect },
    chain: { ...baseExp.chain, ...forcedKeys.chain },
  };
}

/** Blaues Landkarten-Highlight: Kette, deren anchor_uid oder eine Stufen-uid zur geöffneten Kette passt. */
function chainHighlightMatchesSource(chain, sourceUid) {
  const q = sourceUid != null ? String(sourceUid).trim() : "";
  if (!q) {
    return false;
  }
  const anchor = chain.anchor_uid != null ? String(chain.anchor_uid).trim() : "";
  if (anchor && anchor === q) {
    return true;
  }
  const stages = Array.isArray(chain.stages) ? chain.stages : [];
  return stages.some((st) => st && st.uid != null && String(st.uid).trim() === q);
}

/** { kbCode, aspectIndex, chain } für Landkarten-Fokus aus Stufen-UID. */
function findOutlinePathForUid(outline, rawUid) {
  const uid = rawUid != null ? String(rawUid).trim() : "";
  if (!uid || !Array.isArray(outline)) {
    return null;
  }
  for (const kb of outline) {
    const kbCode = kb.kb_code != null ? String(kb.kb_code) : "";
    const aspects = kb.aspects || [];
    for (let ai = 0; ai < aspects.length; ai += 1) {
      const aspect = aspects[ai];
      for (const ch of aspect.chains || []) {
        const auid = ch.anchor_uid != null ? String(ch.anchor_uid).trim() : "";
        if (auid && auid === uid) {
          return { kbCode, aspectIndex: ai, chain: ch };
        }
        const stages = Array.isArray(ch.stages) ? ch.stages : [];
        for (const st of stages) {
          const suid = st && st.uid != null ? String(st.uid).trim() : "";
          if (suid && suid === uid) {
            return { kbCode, aspectIndex: ai, chain: ch };
          }
        }
      }
    }
  }
  return null;
}

function findOutlinePathForClusterCode(outline, clusterCode) {
  const cc = clusterCode != null ? String(clusterCode).trim() : "";
  if (!cc || !Array.isArray(outline)) {
    return null;
  }
  const ccParts = cc.split(".").map((p) => p.trim()).filter(Boolean);
  const ccIsAspectOrDeeper = ccParts.length >= 3;

  for (const kb of outline) {
    const kbCode = kb.kb_code != null ? String(kb.kb_code) : "";
    const aspects = kb.aspects || [];
    for (let ai = 0; ai < aspects.length; ai += 1) {
      const aspect = aspects[ai];
      for (const ch of aspect.chains || []) {
        const chc = ch.cluster_code != null ? String(ch.cluster_code).trim() : "";
        if (!chc) {
          continue;
        }
        if (chc === cc) {
          return { kbCode, aspectIndex: ai, chain: ch };
        }
        if (ccIsAspectOrDeeper && chc.startsWith(`${cc}.`)) {
          return { kbCode, aspectIndex: ai, chain: ch };
        }
      }
    }
  }
  return null;
}

/** Reihenfolge wie in der Landkarten-Graph-Ansicht: KB → Aspekte → Ketten. */
function flattenOutlineChains(outline) {
  const out = [];
  if (!Array.isArray(outline)) {
    return out;
  }
  outline.forEach((kb) => {
    const kbCode = kb.kb_code != null ? String(kb.kb_code) : "";
    (kb.aspects || []).forEach((aspect, ai) => {
      (aspect.chains || []).forEach((chain) => {
        const anchor_uid =
          chain.anchor_uid != null ? String(chain.anchor_uid).trim() : "";
        if (anchor_uid) {
          out.push({ kbCode, aspectIndex: ai, anchor_uid, chain });
        }
      });
    });
  });
  return out;
}

const FACH_EMOJI = {
  Mathematik: "➗",
  Deutsch: "🇩🇪",
  Englisch: "🇬🇧",
  Französisch: "🇫🇷",
  Italienisch: "🇮🇹",
  Latein: "🏛️",
  "Bewegung und Sport": "🏃",
  "Natur, Mensch, Gesellschaft (1./2. Zyklus)": "🌍",
  "Natur und Technik (mit Physik, Chemie, Biologie)": "🧪",
  "Räume, Zeiten, Gesellschaften (mit Geografie, Geschichte)": "🗺️",
  "Ethik, Religionen, Gemeinschaft (mit Lebenskunde)": "🤝",
  "Wirtschaft, Arbeit, Haushalt (mit Hauswirtschaft)": "💼",
  "Medien und Informatik": "💻",
  Musik: "🎵",
  "Bildnerisches Gestalten": "🎨",
  "Textiles und Technisches Gestalten": "🧵",
  "Berufliche Orientierung": "🧭",
};

const MAP_SPLIT_STORAGE_KEY = "lp21-map-split-ratio-v1";
const MAP_LAST_FACH_STORAGE_KEY = "lp21-map-last-fach-v1";

function readInitialSplitRatio() {
  if (typeof window === "undefined") {
    return 50;
  }
  const raw = window.localStorage.getItem(MAP_SPLIT_STORAGE_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return Math.max(2, Math.min(98, parsed));
}

/**
 * Landkarte: Fach → Outline (Kompetenzbereiche, Aspekte, Ketten, Stufen) → CompetencyChainView.
 * State der Kette ist getrennt vom Such-„chainView“ in App.js.
 */
class CurriculumMapOverlay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      overview: null,
      overviewLoading: false,
      overviewError: null,
      selectedFach: null,
      mapChainView: null,
      /** Landkarte-Outline: standardmäßig zugeklappt (nur Kopfzeilen sichtbar). */
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
      /** Teilfilter für Outline (Client-seitig); bei Treffern werden Zweige automatisch sichtbar gemacht. */
      mapOutlineFilter: "",
      /** Explorer-Darstellung */
      selectedMapNode: null,
      showMapEmoji: true,
      mapSplitRatio: readInitialSplitRatio(),
      /** UID des Klicks, der die Aufbau-Kette geöffnet hat (Ketten-Zeile in der Graph-Landkarte). */
      mapChainSourceUid: null,
      /** Fokus aus ChainView-Kontext: KB- oder Ketten-Knoten gelb hervorheben. */
      mapYellowFocus: null,
      /** Split: Kette per Pfeil gewechselt → Swipe-Animation (`prev` | `next`). */
      mapChainNavDirection: null,
    };
    this.escapeHandler = null;
    this.mapSplitDragCleanup = null;
    this.fachStripRef = React.createRef();
    /** Zuletzt verarbeiteter `mapExplorerFocusRequest.nonce` (Overlay-intern). */
    this._lastAppliedMapExplorerFocusNonce = null;
    /** Verhindert, dass eine ältere /competency-chain-Antwort eine neuere überschreibt. */
    this._mapChainFetchId = 0;
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.ensureOverviewLoaded();
      this.attachEscapeListener();
      document.body.style.overflow = "hidden";
      const subjects = this.state.overview && this.state.overview.subjects;
      const skipHydrateForFocus =
        this.props.mapExplorerFocusRequest &&
        this.props.mapExplorerFocusRequest.nonce != null;
      if (Array.isArray(subjects) && subjects.length > 0 && !skipHydrateForFocus) {
        this.hydrateLastFachSelection(subjects);
      }
    }
    if (prevProps.isOpen && !this.props.isOpen) {
      this.removeEscapeListener();
      document.body.style.overflow = "";
      this._lastAppliedMapExplorerFocusNonce = null;
      this._mapChainFetchId += 1;
      this.setState({
        selectedFach: null,
        mapChainView: null,
        mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
        mapOutlineFilter: "",
        selectedMapNode: null,
        showMapEmoji: true,
        mapChainSourceUid: null,
        mapYellowFocus: null,
        mapChainNavDirection: null,
      });
    }
    if (
      this.props.isOpen &&
      this.state.selectedFach &&
      this.state.selectedFach !== prevState.selectedFach
    ) {
      requestAnimationFrame(() => {
        const root = this.fachStripRef.current;
        if (!root) {
          return;
        }
        const chip = root.querySelector(".curriculum-map-strip-chip.active");
        if (chip && typeof chip.scrollIntoView === "function") {
          const reduce =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          chip.scrollIntoView({
            block: "nearest",
            inline: "center",
            behavior: reduce ? "auto" : "smooth",
          });
        }
      });
    }

    const focusReq = this.props.mapExplorerFocusRequest;
    if (
      this.props.isOpen &&
      focusReq &&
      focusReq.nonce != null &&
      focusReq.nonce !== this._lastAppliedMapExplorerFocusNonce &&
      this.state.overview &&
      Array.isArray(this.state.overview.subjects)
    ) {
      this.applyMapExplorerFocusRequest(focusReq);
    }
  }

  componentWillUnmount() {
    this.removeEscapeListener();
    document.body.style.overflow = "";
    if (this.mapSplitDragCleanup) {
      this.mapSplitDragCleanup();
      this.mapSplitDragCleanup = null;
    }
  }

  attachEscapeListener = () => {
    this.removeEscapeListener();
    this.escapeHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.props.onClose();
      }
    };
    document.addEventListener("keydown", this.escapeHandler);
  };

  removeEscapeListener = () => {
    if (this.escapeHandler) {
      document.removeEventListener("keydown", this.escapeHandler);
      this.escapeHandler = null;
    }
  };

  resolveOverviewErrorMessage = (error) => {
    const code = error && error.message;
    if (code === "overview_404") {
      return (
        "Übersicht nicht gefunden (404). Meist läuft noch eine ältere Backend-Version ohne diese Route — " +
        "Backend einmal beenden und neu starten: cd backend && python3 server.py (Port 5001)."
      );
    }
    if (code === "overview_500") {
      return "Die Übersicht konnte auf dem Server nicht erzeugt werden (HTTP 500). Prüfe die Konsole von server.py.";
    }
    if (code === "overview_http") {
      return "Die Übersicht konnte nicht geladen werden (unerwartete Server-Antwort).";
    }
    const looksLikeNetwork =
      error &&
      (error.name === "TypeError" ||
        (typeof error.message === "string" &&
          (error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError"))));
    if (looksLikeNetwork) {
      return (
        "Keine Verbindung zum Backend. Erwartet unter der konfigurierten API-URL " +
        "(lokal: python3 server.py auf Port 5001, danach Seite neu laden)."
      );
    }
    return "Die Übersicht konnte nicht geladen werden.";
  };

  scrollMapYellowIntoView = () => {
    const y = this.state.mapYellowFocus;
    if (!y) {
      return;
    }
    const root = document.getElementById("curriculum-map-root");
    if (!root || typeof root.querySelector !== "function") {
      return;
    }
    let el = null;
    if (y.kind === "kb" && y.kbCode) {
      const esc =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(String(y.kbCode))
          : String(y.kbCode).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      el = root.querySelector(`[data-map-kb-code="${esc}"]`);
    } else if (y.kind === "chain" && y.anchorUid) {
      const esc =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(String(y.anchorUid))
          : String(y.anchorUid).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      el = root.querySelector(`[data-map-chain-anchor="${esc}"]`);
    }
    if (el && typeof el.scrollIntoView === "function") {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  };

  scrollMapChainAnchorIntoView = (rawUid) => {
    const uid = rawUid != null ? String(rawUid).trim() : "";
    if (!uid) {
      return;
    }
    const root = document.getElementById("curriculum-map-root");
    if (!root || typeof root.querySelector !== "function") {
      return;
    }
    const esc =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(uid)
        : uid.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const el = root.querySelector(`[data-map-chain-anchor="${esc}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
  };

  applyMapExplorerFocusRequest = (req) => {
    if (!req || req.nonce == null || req.nonce === this._lastAppliedMapExplorerFocusNonce) {
      return;
    }
    this._lastAppliedMapExplorerFocusNonce = req.nonce;

    const notifyApplied = () => {
      const cb = this.props.onMapExplorerFocusApplied;
      if (typeof cb === "function") {
        cb(req.nonce);
      }
      requestAnimationFrame(() => {
        this.scrollMapYellowIntoView();
      });
    };

    const { overview } = this.state;
    const subjects = overview && Array.isArray(overview.subjects) ? overview.subjects : [];
    const fachName = String(req.fachName || "").trim();
    const sub = subjects.find((s) => s && s.name === fachName);

    const persistFach = (name) => {
      if (typeof window !== "undefined" && name) {
        window.localStorage.setItem(MAP_LAST_FACH_STORAGE_KEY, String(name));
      }
    };

    if (!fachName) {
      notifyApplied();
      return;
    }

    if (!sub || !Array.isArray(sub.outline)) {
      this.setState(
        {
          selectedFach: fachName,
          mapChainView: null,
          mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
          mapOutlineFilter: "",
          selectedMapNode: null,
          mapChainSourceUid: null,
          mapYellowFocus: null,
          mapChainNavDirection: null,
        },
        () => {
          persistFach(fachName);
          notifyApplied();
        },
      );
      return;
    }

    const outline = sub.outline;
    let nextExp = { kb: {}, aspect: {}, chain: {} };
    let yellow = null;

    if (req.focusKind === "fach") {
      this.setState(
        {
          selectedFach: fachName,
          mapChainView: null,
          mapOutlineExpanded: nextExp,
          mapOutlineFilter: "",
          selectedMapNode: null,
          mapChainSourceUid: null,
          mapYellowFocus: null,
          mapChainNavDirection: null,
        },
        () => {
          persistFach(fachName);
          notifyApplied();
        },
      );
      return;
    }

    if (req.focusKind === "kb" && req.kbCode) {
      const kbc = String(req.kbCode).trim();
      if (kbc) {
        nextExp = { kb: { [kbc]: true }, aspect: {}, chain: {} };
        yellow = { kind: "kb", kbCode: kbc };
      }
    } else if (req.focusKind === "cluster") {
      let path = null;
      const au = req.anchorUid != null ? String(req.anchorUid).trim() : "";
      if (au) {
        path = findOutlinePathForUid(outline, au);
      }
      const cc = req.clusterCode != null ? String(req.clusterCode).trim() : "";
      if (!path && cc) {
        path = findOutlinePathForClusterCode(outline, cc);
      }
      if (path) {
        const kbc = String(path.kbCode || "").trim();
        const ai = path.aspectIndex;
        const chain = path.chain;
        const anchorUid =
          chain && chain.anchor_uid != null ? String(chain.anchor_uid).trim() : "";
        nextExp = {
          kb: kbc ? { [kbc]: true } : {},
          aspect: kbc ? { [`${kbc}__${ai}`]: true } : {},
          chain: anchorUid ? { [anchorUid]: true } : {},
        };
        yellow = anchorUid
          ? { kind: "chain", anchorUid }
          : kbc
            ? { kind: "kb", kbCode: kbc }
            : null;
      } else {
        const kbcFallback = req.kbCode != null ? String(req.kbCode).trim() : "";
        if (kbcFallback) {
          nextExp = { kb: { [kbcFallback]: true }, aspect: {}, chain: {} };
          yellow = { kind: "kb", kbCode: kbcFallback };
        }
      }
    }

    this.setState(
      {
        selectedFach: fachName,
        mapChainView: null,
        mapOutlineExpanded: nextExp,
        mapOutlineFilter: "",
        selectedMapNode: null,
        mapChainSourceUid: null,
        mapYellowFocus: yellow,
        mapChainNavDirection: null,
      },
      () => {
        persistFach(fachName);
        notifyApplied();
      },
    );
  };

  hydrateLastFachSelection = (subjects) => {
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return;
    }
    if (this.state.selectedFach) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(MAP_LAST_FACH_STORAGE_KEY);
    const name = raw ? String(raw).trim() : "";
    if (!name || !subjects.some((s) => s && s.name === name)) {
      return;
    }
    this.setState({
      selectedFach: name,
      mapChainView: null,
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
      mapOutlineFilter: "",
      selectedMapNode: null,
      mapChainSourceUid: null,
      mapYellowFocus: null,
      mapChainNavDirection: null,
    });
  };

  ensureOverviewLoaded = () => {
    const { apiUrl } = this.props;
    if (this.state.overview || this.state.overviewLoading) {
      return;
    }
    this.setState({ overviewLoading: true, overviewError: null });

    const fetchOverviewJson = async () => {
      let response = await fetch(apiUrl("/api/curriculum-overview"));
      if (response.status === 404) {
        response = await fetch(apiUrl("/curriculum-overview"));
      }
      if (response.status === 404) {
        throw new Error("overview_404");
      }
      if (response.status === 500) {
        throw new Error("overview_500");
      }
      if (!response.ok) {
        throw new Error("overview_http");
      }
      return response.json();
    };

    fetchOverviewJson()
      .then((data) => {
        const subjects = Array.isArray(data.subjects) ? data.subjects : [];
        this.setState(
          {
            overview: { subjects },
            overviewLoading: false,
            overviewError: null,
          },
          () => {
            const skipHydrate =
              this.props.mapExplorerFocusRequest &&
              this.props.mapExplorerFocusRequest.nonce != null;
            if (!skipHydrate) {
              this.hydrateLastFachSelection(subjects);
            }
          },
        );
      })
      .catch((error) => {
        this.setState({
          overviewLoading: false,
          overviewError: this.resolveOverviewErrorMessage(error),
        });
      });
  };

  handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      this.props.onClose();
    }
  };

  handleSelectFach = (name) => {
    if (typeof window !== "undefined" && name) {
      window.localStorage.setItem(MAP_LAST_FACH_STORAGE_KEY, String(name));
    }
    this.setState({
      selectedFach: name,
      mapChainView: null,
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
      mapOutlineFilter: "",
      selectedMapNode: null,
      mapChainSourceUid: null,
      mapYellowFocus: null,
      mapChainNavDirection: null,
    });
  };

  handleSelectMapNode = (node) => {
    this.setState({ selectedMapNode: node || null });
  };

  handleToggleMapEmoji = () => {
    this.setState((prev) => ({ showMapEmoji: !prev.showMapEmoji }));
  };

  handleMapSplitRatioChange = (event) => {
    const raw = Number(event.target.value);
    const ratio = Number.isFinite(raw) ? Math.max(2, Math.min(98, raw)) : 50;
    this.setState({ mapSplitRatio: ratio });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MAP_SPLIT_STORAGE_KEY, String(ratio));
    }
  };

  handleMapSplitDragStart = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startRatio = this.state.mapSplitRatio;
    const root = document.getElementById("curriculum-map-root");
    const totalWidth = root ? root.clientWidth : window.innerWidth;
    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const ratioDelta = (dx / Math.max(1, totalWidth)) * 100;
      const next = Math.max(2, Math.min(98, startRatio + ratioDelta));
      this.setState({ mapSplitRatio: next });
    };
    const onUp = () => {
      const ratio = this.state.mapSplitRatio;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MAP_SPLIT_STORAGE_KEY, String(ratio));
      }
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      this.mapSplitDragCleanup = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    this.mapSplitDragCleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  };

  handleOutlineFilterChange = (event) => {
    this.setState({ mapOutlineFilter: event.target.value, mapYellowFocus: null });
  };

  handleExpandAllOutline = () => {
    const { overview, selectedFach } = this.state;
    const sub = overview && overview.subjects
      ? overview.subjects.find((s) => s.name === selectedFach)
      : null;
    if (!sub || !Array.isArray(sub.outline)) {
      return;
    }
    this.setState({
      mapOutlineExpanded: expandAllMapsFromOutline(sub.outline),
      mapYellowFocus: null,
    });
  };

  handleCollapseAllOutline = () => {
    this.setState({
      mapOutlineExpanded: { kb: {}, aspect: {}, chain: {} },
      mapYellowFocus: null,
    });
  };

  handleToggleOutlineKb = (kbCode) => {
    const key = String(kbCode || "");
    this.setState((prev) => {
      const m = prev.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
      const cur = Boolean(m.kb[key]);
      return {
        mapYellowFocus: null,
        mapOutlineExpanded: {
          ...m,
          kb: { ...m.kb, [key]: !cur },
        },
      };
    });
  };

  handleToggleOutlineAspect = (kbCode, aspectIndex) => {
    const id = `${String(kbCode || "")}__${aspectIndex}`;
    this.setState((prev) => {
      const m = prev.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
      const cur = Boolean(m.aspect[id]);
      return {
        mapYellowFocus: null,
        mapOutlineExpanded: {
          ...m,
          aspect: { ...m.aspect, [id]: !cur },
        },
      };
    });
  };

  handleToggleOutlineChain = (anchorUid) => {
    const key = String(anchorUid || "");
    this.setState((prev) => {
      const m = prev.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
      const cur = Boolean(m.chain[key]);
      return {
        mapYellowFocus: null,
        mapOutlineExpanded: {
          ...m,
          chain: { ...m.chain, [key]: !cur },
        },
      };
    });
  };

  renderOutlineToggle = (isExpanded, onToggle, ariaLabel) => (
    <button
      type="button"
      className="map-outline-toggle"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-expanded={isExpanded}
      aria-label={ariaLabel}
    >
      <span
        className={`map-outline-chevron ${isExpanded ? "map-outline-chevron--open" : ""}`}
        aria-hidden="true"
      >
        ▶
      </span>
    </button>
  );

  handleBreadcrumbRoot = () => {
    this.setState({
      selectedFach: null,
      mapChainView: null,
      mapChainSourceUid: null,
      mapYellowFocus: null,
      mapChainNavDirection: null,
    });
  };

  /** Von Aufbau-Kette zurück zur Outline; von Outline zurück zur Fächerliste. */
  handleBreadcrumbFach = () => {
    if (this.state.mapChainView) {
      this.setState({
        mapChainView: null,
        mapChainSourceUid: null,
        mapYellowFocus: null,
        mapChainNavDirection: null,
      });
      return;
    }
    this.setState({ selectedFach: null, mapYellowFocus: null, mapChainNavDirection: null });
  };

  /** Outline wie in der Graph-Ansicht (inkl. Suchfilter). */
  getOutlineForMapChainNav = (subject) => {
    const outlineRaw = Array.isArray(subject.outline) ? subject.outline : [];
    const filterRaw = (this.state.mapOutlineFilter || "").trim();
    return filterRaw ? filterOutlineByQuery(outlineRaw, filterRaw) : outlineRaw;
  };

  /** Vorherige/nächste Kette in der Landkarten-Outline (gleiche Reihenfolge wie die Graph-Ansicht). */
  navigateAdjacentChainInMap = (delta) => {
    const { selectedFach, overview, mapChainView, mapChainSourceUid, mapOutlineExpanded } =
      this.state;
    if (!selectedFach || !overview || !mapChainView || mapChainView.loading) {
      return;
    }
    const sub = overview.subjects.find((s) => s && s.name === selectedFach);
    if (!sub || !Array.isArray(sub.outline)) {
      return;
    }
    const flat = flattenOutlineChains(this.getOutlineForMapChainNav(sub));
    const curUid = String(
      (mapChainView.loading && mapChainView.highlightAnchorUid
        ? mapChainView.highlightAnchorUid
        : null) ||
        (mapChainView.data && mapChainView.data.current && mapChainView.data.current.uid) ||
        mapChainView.highlightAnchorUid ||
        mapChainSourceUid ||
        "",
    ).trim();
    const idx = flat.findIndex((e) => String(e.anchor_uid || "").trim() === curUid);
    if (idx === -1) {
      return;
    }
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= flat.length) {
      return;
    }
    const next = flat[nextIdx];
    const anchor = String(next.anchor_uid || "").trim();
    if (!anchor) {
      return;
    }
    const kbCode = String(next.kbCode || "");
    const ai = next.aspectIndex;
    const aspectKey = `${kbCode}__${ai}`;
    const m = mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
    this.setState(
      {
        mapOutlineExpanded: {
          kb: { ...m.kb, [kbCode]: true },
          aspect: { ...m.aspect, [aspectKey]: true },
          chain: { ...m.chain, [anchor]: true },
        },
        mapYellowFocus: null,
      },
      () => {
        this.handleOpenChain(
          anchor,
          next.chain.heading,
          next.chain.cluster_code || undefined,
          selectedFach,
          delta < 0 ? "prev" : "next",
        );
      },
    );
  };

  handleMapChainNavAnimationEnd = () => {
    this.setState({ mapChainNavDirection: null });
  };

  computeMapOutlineChainNavProps = () => {
    const { selectedFach, overview, mapChainView, mapChainSourceUid } = this.state;
    if (!mapChainView) {
      return null;
    }
    const sub =
      overview && Array.isArray(overview.subjects)
        ? overview.subjects.find((s) => s && s.name === selectedFach)
        : null;
    if (!sub || !Array.isArray(sub.outline)) {
      return null;
    }
    const flat = flattenOutlineChains(this.getOutlineForMapChainNav(sub));
    if (flat.length <= 1) {
      return null;
    }
    const loading = Boolean(mapChainView.loading);
    const curUid = String(
      (loading && mapChainView.highlightAnchorUid ? mapChainView.highlightAnchorUid : null) ||
        (mapChainView.data && mapChainView.data.current && mapChainView.data.current.uid) ||
        mapChainView.highlightAnchorUid ||
        mapChainSourceUid ||
        "",
    ).trim();
    const idx = flat.findIndex((e) => String(e.anchor_uid || "").trim() === curUid);
    return {
      onPrevious: () => this.navigateAdjacentChainInMap(-1),
      onNext: () => this.navigateAdjacentChainInMap(1),
      hasPrevious: !loading && idx > 0,
      hasNext: !loading && idx !== -1 && idx < flat.length - 1,
    };
  };

  handleOpenChain = (uid, labelHint, codeHint, fachHint, navSlide = null) => {
    const trimmed =
      typeof uid === "string"
        ? uid.trim()
        : uid != null
          ? String(uid).trim()
          : "";
    if (!trimmed) {
      return;
    }
    const { apiUrl, enrichChainDataWithNetworkApi, onRecordRecentView } = this.props;
    const highlightAnchorUid = trimmed;
    const navDir =
      navSlide === "prev" || navSlide === "next" ? navSlide : null;

    if (typeof onRecordRecentView === "function") {
      onRecordRecentView({
        uid: highlightAnchorUid,
        code: codeHint,
        fach: fachHint,
        label: labelHint || highlightAnchorUid,
      });
    }

    const myFetchId = ++this._mapChainFetchId;

    this.setState((prev) => {
      const prevMv = prev.mapChainView;
      const staleData =
        navDir != null && prevMv && prevMv.data && !prevMv.error ? prevMv.data : null;
      return {
        mapChainView: {
          loading: true,
          error: null,
          data: staleData,
          highlightAnchorUid,
        },
        mapChainSourceUid: trimmed,
        mapYellowFocus: null,
        mapChainNavDirection: navDir,
        mapSplitRatio: prev.mapSplitRatio >= 92 ? 65 : prev.mapSplitRatio,
      };
    });

    fetch(apiUrl(`/competency-chain/${encodeURIComponent(trimmed)}`))
      .then((response) => {
        if (response.status === 404) {
          throw new Error("not_found");
        }
        if (!response.ok) {
          throw new Error("network");
        }
        return response.json();
      })
      .then((data) => enrichChainDataWithNetworkApi(data))
      .then((data) => {
        if (myFetchId !== this._mapChainFetchId) {
          return;
        }
        const cur = data && data.current;
        const resolvedHighlightUid =
          cur && cur.uid != null ? String(cur.uid).trim() : highlightAnchorUid;
        if (typeof onRecordRecentView === "function" && cur) {
          onRecordRecentView({
            uid: String(cur.uid).trim(),
            code: cur.code,
            fach: cur.fach,
            label: truncateCompetencyLabel(cur.text || cur.code || cur.uid, 120),
          });
        }
        this.setState(
          (prev) => ({
            mapChainSourceUid: resolvedHighlightUid,
            mapYellowFocus: null,
            mapChainView: prev.mapChainView
              ? {
                  ...prev.mapChainView,
                  loading: false,
                  error: null,
                  data,
                  highlightAnchorUid: resolvedHighlightUid,
                }
              : {
                  loading: false,
                  error: null,
                  data,
                  highlightAnchorUid: resolvedHighlightUid,
                },
          }),
          () => {
            requestAnimationFrame(() => {
              this.scrollMapChainAnchorIntoView(resolvedHighlightUid);
            });
          },
        );
      })
      .catch((error) => {
        if (myFetchId !== this._mapChainFetchId) {
          return;
        }
        const message =
          error.message === "not_found"
            ? "Für diese Kompetenz wurde kein Aufbau-Kontext gefunden."
            : "Der Aufbau-Kontext konnte nicht geladen werden.";
        this.setState((prev) => ({
          mapChainSourceUid: null,
          mapYellowFocus: null,
          mapChainNavDirection: null,
          mapChainView: prev.mapChainView
            ? {
                ...prev.mapChainView,
                loading: false,
                error: message,
                data: null,
              }
            : {
                loading: false,
                error: message,
                data: null,
                highlightAnchorUid,
              },
        }));
      });
  };

  handleMapChainBack = () => {
    this.setState((prev) => {
      const needsRestore = prev.mapSplitRatio <= 8;
      const nextRatio = needsRestore ? 50 : prev.mapSplitRatio;
      if (needsRestore && typeof window !== "undefined") {
        window.localStorage.setItem(MAP_SPLIT_STORAGE_KEY, "50");
      }
      return {
        mapChainView: null,
        mapChainSourceUid: null,
        mapYellowFocus: null,
        mapChainNavDirection: null,
        // Wenn links komplett ausgeblendet war, Landkarte wieder sichtbar machen.
        mapSplitRatio: nextRatio,
      };
    });
  };

  handleMapChainSelectNeighbor = (nextUid) => {
    const { mapChainView } = this.state;
    const { enrichChainDataWithNetworkApi, onRecordRecentView } = this.props;
    const fullChain = mapChainView && mapChainView.data && mapChainView.data.full_chain;
    if (fullChain && Array.isArray(fullChain) && nextUid) {
      const idx = fullChain.findIndex((step) => step && step.uid === nextUid);
      if (idx !== -1) {
        const cur = fullChain[idx];
        const data = {
          previous: idx > 0 ? fullChain[idx - 1] : null,
          current: cur,
          next: idx < fullChain.length - 1 ? fullChain[idx + 1] : null,
          full_chain: fullChain,
          chain_heading: mapChainView.data.chain_heading,
          _has_network: Boolean(cur && cur.network_links && cur.network_links.length > 0),
        };
        const stepUid = (cur && cur.uid) || nextUid;
        const stepLabel =
          truncateCompetencyLabel(cur && cur.text, 120) ||
          (cur && cur.code ? String(cur.code).trim() : "") ||
          stepUid;
        if (typeof onRecordRecentView === "function") {
          onRecordRecentView({
            uid: stepUid,
            code: cur && cur.code ? String(cur.code).trim() : undefined,
            fach: cur && cur.fach ? String(cur.fach).trim() : undefined,
            label: stepLabel,
          });
        }
        enrichChainDataWithNetworkApi(data).then((enriched) => {
          const resolvedHighlightUid =
            enriched &&
            enriched.current &&
            enriched.current.uid != null
              ? String(enriched.current.uid).trim()
              : stepUid;
          this.setState({
            mapChainSourceUid: resolvedHighlightUid,
            mapChainNavDirection: null,
            mapChainView: {
              ...mapChainView,
              loading: false,
              error: null,
              data: enriched,
              highlightAnchorUid: resolvedHighlightUid,
            },
          });
        });
        return;
      }
    }
    if (!nextUid) {
      return;
    }
    this.handleOpenChain(nextUid, nextUid, undefined, undefined);
  };

  handleToggleBookmarkStepFromMapChain = (item) => {
    const { onBookmarkToggle } = this.props;
    if (!item || typeof onBookmarkToggle !== "function") {
      return;
    }
    const bookmarkId =
      (item.doc_key != null && String(item.doc_key).trim()) ||
      (item.uid != null && String(item.uid).trim()) ||
      "";
    if (!bookmarkId) {
      return;
    }
    onBookmarkToggle({
      uid: bookmarkId,
      label: truncateCompetencyLabel(item.text || item.code || bookmarkId, 200),
      code: item.code,
      fach: item.fach,
      zyklus: item.zyklus,
      themenbereich: item.themenbereich,
    });
  };

  /** Kompakte Leiste: Fach bleibt beim Erkunden sichtbar (wechseln ohne „zweiten Screen“). */
  renderSubjectStrip = (subjects) => (
    <div
      ref={this.fachStripRef}
      className="curriculum-map-subject-strip"
      role="group"
      aria-label="Fach wechseln"
    >
      {subjects.map((subj) => {
        const emoji = FACH_EMOJI[subj.name] || "📘";
        const showEmoji = Boolean(this.state.showMapEmoji);
        const active = this.state.selectedFach === subj.name;
        return (
          <button
            key={subj.name}
            type="button"
            className={`curriculum-map-strip-chip ${active ? "active" : ""}`}
            style={{ "--strip-accent": this.props.getFachColor(subj.name) }}
            onClick={() => this.handleSelectFach(subj.name)}
            aria-pressed={active}
          >
            {showEmoji ? (
              <span className="curriculum-map-strip-chip-emoji" aria-hidden="true">
                {emoji}
              </span>
            ) : null}
            <span className="curriculum-map-strip-chip-label">{subj.name}</span>
          </button>
        );
      })}
    </div>
  );

  renderFachExplorerBody = (subjects, fachEntry) => (
    <div className="curriculum-map-explorer-with-strip">
      {this.renderSubjectStrip(subjects)}
      <p className="curriculum-map-strip-hint">
        Struktur für <strong>{fachEntry.name}</strong>. Andere Fächer: Leiste oben; alle Kacheln: Brotkrume
        „Fächer“.
      </p>
      <div key={fachEntry.name} className="curriculum-map-graph-pane">
        {this.renderFachGraph(fachEntry)}
      </div>
    </div>
  );

  renderSubjectChips = (subjects) => (
    <div
      className="curriculum-map-subject-grid curriculum-map-subject-grid--enter"
      role="group"
      aria-label="Fach auswählen"
    >
      {subjects.map((subj) => {
        const outline = Array.isArray(subj.outline) ? subj.outline : [];
        const kbCount = outline.length;
        let chainCount = 0;
        outline.forEach((kb) => {
          (kb.aspects || []).forEach((a) => {
            chainCount += (a.chains || []).length;
          });
        });
        const emoji = FACH_EMOJI[subj.name] || "📘";
        const showEmoji = Boolean(this.state.showMapEmoji);
        return (
          <button
            key={subj.name}
            type="button"
            className={`curriculum-map-subject-card ${this.state.selectedFach === subj.name ? "active" : ""}`}
            style={{ "--chip-accent": this.props.getFachColor(subj.name) }}
            onClick={() => this.handleSelectFach(subj.name)}
          >
            <span className="curriculum-map-subject-top">
              {showEmoji ? (
                <span className="curriculum-map-subject-emoji" aria-hidden="true">{emoji}</span>
              ) : null}
              {subj.fach_code ? (
                <span className="curriculum-map-fach-token" title="Fachbereich-Kürzel (Lehrplan 21)">
                  {subj.fach_code}
                </span>
              ) : null}
            </span>
            <span className="curriculum-map-fach-chip-label">{subj.name}</span>
            <span className="curriculum-map-subject-meta">
              {kbCount} Bereiche · {chainCount} Ketten
            </span>
          </button>
        );
      })}
    </div>
  );

  renderFachOutline = (subject) => {
    const fachName = subject.name;
    const fachCode = subject.fach_code ? String(subject.fach_code).trim() : "";
    const outlineRaw = Array.isArray(subject.outline) ? subject.outline : [];
    const filterRaw = (this.state.mapOutlineFilter || "").trim();
    const filterActive = filterRaw.length > 0;
    const filteredOutline = filterActive
      ? filterOutlineByQuery(outlineRaw, filterRaw)
      : outlineRaw;
    const statsFull = countOutlineStats(outlineRaw);
    const statsShown = countOutlineStats(filteredOutline);
    const baseExp = this.state.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
    const forcedKeys = expandAllMapsFromOutline(filteredOutline);
    const exp = filterActive
      ? mergeExpandedForFiltered(baseExp, forcedKeys)
      : baseExp;

    const renderChainBlock = (chain, chainIndentClass) => {
      const anchorUid = chain.anchor_uid ? String(chain.anchor_uid).trim() : "";
      const clusterCode = chain.cluster_code ? String(chain.cluster_code).trim() : "";
      const heading = (chain.heading || "").trim();
      const stages = Array.isArray(chain.stages) ? chain.stages : [];
      const expandedChain = Boolean(exp.chain[anchorUid]);
      const stageLabel =
        heading || clusterCode || anchorUid || "Kompetenzkette";

      return (
        <div key={anchorUid || heading} className={`map-outline-chain-block ${chainIndentClass}`}>
          <div className="map-outline-chain-head">
            {stages.length > 0 ? (
              this.renderOutlineToggle(
                expandedChain,
                () => this.handleToggleOutlineChain(anchorUid),
                `Stufen zu „${stageLabel}“ ein- oder ausblenden`,
              )
            ) : (
              <span className="map-outline-toggle-gap" aria-hidden="true" />
            )}
            <button
              type="button"
              className="map-outline-row map-outline-row--heading map-outline-chain-open map-outline-click"
              title={clusterCode ? describeLp21Code(clusterCode) : undefined}
              disabled={!anchorUid}
              onClick={() =>
                anchorUid
                  ? this.handleOpenChain(
                      anchorUid,
                      heading || clusterCode,
                      clusterCode || undefined,
                      fachName,
                    )
                  : undefined
              }
            >
              <span className="map-outline-text map-outline-heading-text">
                {heading || clusterCode || anchorUid}
              </span>
              {clusterCode ? <span className="map-outline-code">{clusterCode}</span> : null}
            </button>
          </div>
          {expandedChain && stages.length > 0 ? (
            <ul className="map-outline-stage-list" aria-label="Stufen dieser Kompetenzkette">
              {stages.map((st, si) => {
                const stUid = st && st.uid != null ? String(st.uid).trim() : "";
                const sc = st && st.code != null ? String(st.code).trim() : "";
                const tx = st && st.text != null ? String(st.text).trim() : "";
                return (
                  <li key={stUid || `${si}-${sc}`}>
                    <button
                      type="button"
                      className="map-outline-row map-outline-row--stage map-outline-click map-outline-indent-4"
                      title={sc ? describeLp21Code(sc) : undefined}
                      disabled={!stUid}
                      onClick={() =>
                        stUid
                          ? this.handleOpenChain(stUid, tx || sc, sc || undefined, fachName)
                          : undefined
                      }
                    >
                      <span className="map-outline-text">{tx || sc || stUid}</span>
                      {sc ? <span className="map-outline-code">{sc}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      );
    };

    return (
      <div
        className="map-outline"
        role="region"
        aria-label={`Lehrplan-Outline: ${fachName}`}
      >
        <div className="map-outline-row map-outline-row--fach">
          <span className="map-outline-text">{fachName}</span>
          {fachCode ? (
            <span className="map-outline-code" title="Fachbereich-Kürzel (Lehrplan 21)">
              {fachCode}
            </span>
          ) : null}
        </div>

        <div className="map-outline-toolbar" role="search">
          <p className="map-outline-toolbar-stats" aria-live="polite">
            <span className="map-outline-stat">
              Kompetenzbereiche{" "}
              <strong>{filterActive ? statsShown.kbCount : statsFull.kbCount}</strong>
              {!filterActive || statsShown.kbCount === statsFull.kbCount ? null : (
                <span className="map-outline-stat-sub"> / {statsFull.kbCount}</span>
              )}
            </span>
            <span className="map-outline-stat-sep" aria-hidden="true">
              ·
            </span>
            <span className="map-outline-stat">
              Ketten{" "}
              <strong>{filterActive ? statsShown.chainCount : statsFull.chainCount}</strong>
              {!filterActive || statsShown.chainCount === statsFull.chainCount ? null : (
                <span className="map-outline-stat-sub"> / {statsFull.chainCount}</span>
              )}
            </span>
          </p>
          <div className="map-outline-toolbar-actions">
            <input
              type="search"
              className="map-outline-filter-input"
              placeholder="Filtern nach Text oder LP21-Code …"
              aria-label="Outline filtern"
              value={this.state.mapOutlineFilter || ""}
              onChange={this.handleOutlineFilterChange}
            />
            <button
              type="button"
              className="map-outline-tool-btn"
              onClick={this.handleExpandAllOutline}
              disabled={filterActive}
              title={
                filterActive
                  ? "Zum massiven Aufklappen Filter leeren"
                  : "Alle Bereiche und Stufen aufklappen"
              }
            >
              Alle aufklappen
            </button>
            <button
              type="button"
              className="map-outline-tool-btn"
              onClick={this.handleCollapseAllOutline}
              disabled={filterActive}
              title={
                filterActive
                  ? "Zum Zuklappen Filter leeren"
                  : "Alles zuklappen"
              }
            >
              Alle zuklappen
            </button>
            {filterActive ? (
              <button
                type="button"
                className="map-outline-tool-btn map-outline-tool-btn--accent"
                onClick={() => this.setState({ mapOutlineFilter: "" })}
              >
                Filter löschen
              </button>
            ) : null}
          </div>
        </div>

        {filteredOutline.length === 0 && filterActive ? (
          <p className="map-outline-empty" role="status">
            Keine Treffer für „{filterRaw}“. Begriff ändern oder Filter löschen.
          </p>
        ) : null}

        {filteredOutline.map((kb) => {
          const kbCode = kb.kb_code != null ? String(kb.kb_code) : "";
          const expandedKb = Boolean(exp.kb[kbCode]);
          return (
            <div key={kbCode || kb.kb_label} className="map-outline-kb-block">
              <div className="map-outline-row map-outline-row--kb map-outline-indent-1 map-outline-row--with-toggle">
                {this.renderOutlineToggle(
                  expandedKb,
                  () => this.handleToggleOutlineKb(kbCode),
                  `Unterpunkte zu „${kb.kb_label || kbCode}“ ein- oder ausblenden`,
                )}
                <span className="map-outline-text">{kb.kb_label}</span>
                <span
                  className="map-outline-code"
                  title={kbCode ? describeLp21Code(kbCode) : undefined}
                >
                  {kbCode}
                </span>
              </div>
              {expandedKb ? (
                <div className="map-outline-kb-children">
                  {(kb.aspects || []).map((aspect, ai) => {
                    const aspectKey = `${kbCode}__${ai}`;
                    const expandedAspect = Boolean(exp.aspect[aspectKey]);
                    const hasAspectHeader = Boolean(
                      aspect.aspect_code &&
                        String(aspect.aspect_label || "").trim(),
                    );

                    if (!hasAspectHeader) {
                      return (
                        <div
                          key={aspectKey}
                          className="map-outline-aspect-block map-outline-aspect-block--flat"
                        >
                          {(aspect.chains || []).map((chain) =>
                            renderChainBlock(chain, "map-outline-indent-2"),
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={aspectKey} className="map-outline-aspect-block">
                        <div className="map-outline-row map-outline-row--aspect map-outline-indent-2 map-outline-row--with-toggle">
                          {this.renderOutlineToggle(
                            expandedAspect,
                            () => this.handleToggleOutlineAspect(kbCode, ai),
                            `Ketten zu „${aspect.aspect_label || aspect.aspect_code}“ ein- oder ausblenden`,
                          )}
                          <span className="map-outline-text">{aspect.aspect_label}</span>
                          <span
                            className="map-outline-code"
                            title={describeLp21Code(aspect.aspect_code)}
                          >
                            {aspect.aspect_code}
                          </span>
                        </div>
                        {expandedAspect
                          ? (aspect.chains || []).map((chain) =>
                              renderChainBlock(chain, "map-outline-indent-3"),
                            )
                          : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  renderFachGraph = (subject) => {
    const fachName = subject.name;
    const outlineRaw = Array.isArray(subject.outline) ? subject.outline : [];
    const filterRaw = (this.state.mapOutlineFilter || "").trim();
    const filteredOutline = filterRaw
      ? filterOutlineByQuery(outlineRaw, filterRaw)
      : outlineRaw;
    const mapChainSourceUid = this.state.mapChainSourceUid;
    const mapYellowFocus = this.state.mapYellowFocus;
    const baseExp = this.state.mapOutlineExpanded || { kb: {}, aspect: {}, chain: {} };
    const forcedKeys = filterRaw ? expandAllMapsFromOutline(filteredOutline) : { kb: {}, aspect: {}, chain: {} };
    const exp = filterRaw ? mergeExpandedForFiltered(baseExp, forcedKeys) : baseExp;

    return (
      <div className="map-graph" role="region" aria-label={`Landkarte-Nodes: ${fachName}`}>
        {filteredOutline.map((kb) => {
          const kbCode = kb.kb_code != null ? String(kb.kb_code) : "";
          const expandedKb = Boolean(exp.kb[kbCode]);
          const kbYellow =
            mapYellowFocus &&
            mapYellowFocus.kind === "kb" &&
            String(mapYellowFocus.kbCode || "") === kbCode;
          return (
          <section key={kbCode || kb.kb_label} className="map-kb-card">
            <button
              type="button"
              className={`map-node map-node--kb${kbYellow ? " map-node--context-yellow" : ""}`}
              data-map-kb-code={kbCode || undefined}
              aria-expanded={expandedKb}
              onClick={() => this.handleToggleOutlineKb(kbCode)}
            >
              <span className="map-node-toggle" aria-hidden="true">{expandedKb ? "▾" : "▸"}</span>
              <span className="map-node-title">{kb.kb_label}</span>
              {kb.kb_code ? <span className="map-node-code">{kb.kb_code}</span> : null}
            </button>
            {expandedKb ? (
              <div className="map-aspect-row">
                {(kb.aspects || []).map((aspect, ai) => {
                  const chains = aspect.chains || [];
                  const hasAspectLabel = String(aspect.aspect_label || "").trim().length > 0;
                  const aspectKey = `${kbCode}__${ai}`;
                  const expandedAspect = hasAspectLabel ? Boolean(exp.aspect[aspectKey]) : true;
                  return (
                    <div key={`${kbCode}-${ai}`} className="map-aspect-card">
                      {hasAspectLabel ? (
                        <button
                          type="button"
                          className="map-node map-node--aspect"
                          aria-expanded={expandedAspect}
                          onClick={() => this.handleToggleOutlineAspect(kbCode, ai)}
                        >
                          <span className="map-node-toggle" aria-hidden="true">{expandedAspect ? "▾" : "▸"}</span>
                          <span className="map-node-title">{aspect.aspect_label}</span>
                          {aspect.aspect_code ? (
                            <span className="map-node-code">{aspect.aspect_code}</span>
                          ) : null}
                        </button>
                      ) : null}
                      {expandedAspect ? (
                        <div className={`map-chain-grid ${hasAspectLabel ? "map-chain-grid--indented" : "map-chain-grid--root"}`}>
                          {chains.map((chain) => {
                            const anchorKey =
                              chain.anchor_uid != null ? String(chain.anchor_uid).trim() : "";
                            const chainYellow =
                              mapYellowFocus &&
                              mapYellowFocus.kind === "chain" &&
                              anchorKey &&
                              String(mapYellowFocus.anchorUid || "") === anchorKey;
                            return (
                            <button
                              key={chain.anchor_uid || chain.cluster_code || chain.heading}
                              type="button"
                              className={`map-node map-node--chain ${
                                chainHighlightMatchesSource(chain, mapChainSourceUid)
                                  ? "map-node--chain-selected"
                                  : ""
                              }${chainYellow ? " map-node--context-yellow" : ""}`}
                              data-map-chain-anchor={anchorKey || undefined}
                              onClick={() => {
                                this.handleOpenChain(
                                  chain.anchor_uid,
                                  chain.heading,
                                  chain.cluster_code || undefined,
                                  fachName,
                                );
                              }}
                            >
                              <span className="map-node-title">{chain.heading}</span>
                              {chain.cluster_code ? (
                                <span className="map-node-code">{chain.cluster_code}</span>
                              ) : null}
                            </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
          );
        })}
      </div>
    );
  };

  renderMapChainPanel = () => {
    const { mapChainView } = this.state;
    const { bookmarkUids, getFachColor } = this.props;
    if (!mapChainView) {
      return (
        <aside className="map-detail-panel" aria-label="Kompetenzaufbau">
          <h3>Aufbau-Kette</h3>
          <p className="map-detail-empty">Klicke links eine Kompetenz an, um rechts die Kette zu laden.</p>
        </aside>
      );
    }
    return (
      <div className="map-chain-panel">
        <CompetencyChainView
          key={String(mapChainView.highlightAnchorUid || mapChainView.data?.current?.uid || "chain")}
          loading={Boolean(mapChainView.loading)}
          error={mapChainView.error}
          chainData={mapChainView.data}
          highlightAnchorUid={undefined}
          searchSelectionHighlight={false}
          onBack={this.handleMapChainBack}
          onSelectNeighbor={this.handleMapChainSelectNeighbor}
          getZyklusColorByPart={this.props.getZyklusColorByPart}
          getFachColor={getFachColor}
          getCompetencyNetworkUrl={(uid) =>
            this.props.apiUrl(`/api/competency-network/${encodeURIComponent(uid)}`)
          }
          backButtonLabel="← Kette schließen"
          backButtonAriaLabel="Kette schließen"
          bookmarkUids={bookmarkUids}
          onToggleBookmarkStep={this.handleToggleBookmarkStepFromMapChain}
          onOpenInCurriculumMap={this.props.onOpenInCurriculumMapFromChain}
          mapOutlineChainNav={this.computeMapOutlineChainNavProps()}
          mapChainNavDirection={this.state.mapChainNavDirection}
          onMapChainNavAnimationEnd={this.handleMapChainNavAnimationEnd}
          chainLoadingStatusDelayMs={2000}
        />
      </div>
    );
  };

  renderExplorerMain = () => {
    const {
      overview,
      overviewLoading,
      overviewError,
      selectedFach,
    } = this.state;

    if (overviewLoading) {
      return <p className="curriculum-map-status">Lade Übersicht …</p>;
    }
    if (overviewError) {
      return (
        <p className="curriculum-map-status curriculum-map-status--error" role="alert">
          {overviewError}
        </p>
      );
    }
    if (!overview || !Array.isArray(overview.subjects)) {
      return null;
    }
    const subjects = overview.subjects;
    if (!selectedFach) {
      return this.renderSubjectChips(subjects);
    }
    const fachEntry = subjects.find((s) => s.name === selectedFach);
    if (!fachEntry || !Array.isArray(fachEntry.outline)) {
      return (
        <p className="curriculum-map-status">
          Keine Outline-Daten für dieses Fach. Backend neu starten (Cache), dann erneut laden.
        </p>
      );
    }
    return this.renderFachExplorerBody(subjects, fachEntry);
  };

  renderBreadcrumb = () => {
    const { selectedFach, mapChainView } = this.state;
    const crumbs = [
      <button
        key="root"
        type="button"
        className="curriculum-map-crumb"
        onClick={this.handleBreadcrumbRoot}
      >
        Fächer
      </button>,
    ];
    if (selectedFach) {
      crumbs.push(
        <span key="s1" className="curriculum-map-crumb-sep" aria-hidden="true">
          ›
        </span>,
        <button
          key="fach"
          type="button"
          className="curriculum-map-crumb"
          onClick={this.handleBreadcrumbFach}
        >
          {selectedFach}
        </button>
      );
    }
    if (mapChainView) {
      crumbs.push(
        <span key="s3" className="curriculum-map-crumb-sep" aria-hidden="true">
          ›
        </span>,
        <span key="chain" className="curriculum-map-crumb curriculum-map-crumb--current">
          Aufbau-Kette
        </span>
      );
    }
    return (
      <nav className="curriculum-map-breadcrumb" aria-label="Landkarte Navigation">
        {crumbs}
      </nav>
    );
  };

  renderInner = () => {
    const {
      overview,
      overviewLoading,
      overviewError,
      selectedFach,
      mapChainView,
    } = this.state;
    const { bookmarkUids, getFachColor } = this.props;

    if (overviewLoading) {
      return <p className="curriculum-map-status">Lade Übersicht …</p>;
    }
    if (overviewError) {
      return (
        <p className="curriculum-map-status curriculum-map-status--error" role="alert">
          {overviewError}
        </p>
      );
    }
    if (!overview || !Array.isArray(overview.subjects)) {
      return null;
    }

    if (mapChainView) {
      return (
        <CompetencyChainView
          loading={Boolean(mapChainView.loading)}
          error={mapChainView.error}
          chainData={mapChainView.data}
          highlightAnchorUid={undefined}
          searchSelectionHighlight={false}
          onBack={this.handleMapChainBack}
          onSelectNeighbor={this.handleMapChainSelectNeighbor}
          getZyklusColorByPart={this.props.getZyklusColorByPart}
          getFachColor={getFachColor}
          getCompetencyNetworkUrl={(uid) =>
            this.props.apiUrl(`/api/competency-network/${encodeURIComponent(uid)}`)
          }
          backButtonLabel="← Zurück zur Landkarte"
          backButtonAriaLabel="Zurück zur Landkarte"
          bookmarkUids={bookmarkUids}
          onToggleBookmarkStep={this.handleToggleBookmarkStepFromMapChain}
        />
      );
    }

    const subjects = overview.subjects;
    if (!selectedFach) {
      return this.renderSubjectChips(subjects);
    }

    const fachEntry = subjects.find((s) => s.name === selectedFach);
    if (!fachEntry || !Array.isArray(fachEntry.outline)) {
      return (
        <p className="curriculum-map-status">
          Keine Outline-Daten für dieses Fach. Backend neu starten (Cache), dann erneut laden.
        </p>
      );
    }

    return this.renderFachExplorerBody(subjects, fachEntry);
  };

  render() {
    const { isOpen, fullPage } = this.props;
    const { overview, selectedFach, mapChainView, showMapEmoji, mapSplitRatio } = this.state;
    if (!isOpen) {
      return null;
    }

    if (fullPage) {
      const hasChain = Boolean(selectedFach && mapChainView);
      const mapCollapsedByUser = hasChain && mapSplitRatio <= 8;
      const chainCollapsedByUser = mapSplitRatio >= 92;
      const showMapPane = !mapCollapsedByUser;
      const showChainPane = hasChain && !chainCollapsedByUser;
      const showDivider = showMapPane && showChainPane;
      const gridTemplateColumns = !showChainPane
        ? "1fr"
        : !showMapPane
          ? "1fr"
          : `${mapSplitRatio}fr 14px ${100 - mapSplitRatio}fr`;
      return (
        <section
          id="curriculum-map-root"
          className="curriculum-map-page"
          aria-labelledby="curriculum-map-title"
        >
          <header className="curriculum-map-header curriculum-map-header--page">
            <div className="curriculum-map-header-text">
              <h2 id="curriculum-map-title">Landkarte Lehrplan 21</h2>
              <p className="curriculum-map-subtitle">
                Fach wählen, dann Kompetenzbereiche und Ketten — gewähltes Fach bleibt als Leiste
                erreichbar, Wechsel ohne neuen Screen.
              </p>
            </div>
            <button
              type="button"
              className="map-outline-tool-btn"
              onClick={this.handleToggleMapEmoji}
              aria-pressed={showMapEmoji}
              title="Emoji in Fach-Kacheln ein- oder ausblenden"
            >
              Emoji {showMapEmoji ? "an" : "aus"}
            </button>
            <button
              type="button"
              className="curriculum-map-close"
              onClick={this.props.onClose}
              aria-label="Zurück zur Suche"
            >
              Zur Suche
            </button>
          </header>
          {this.renderBreadcrumb()}
          <div className="curriculum-map-body curriculum-map-body--page">
            <div
              className="curriculum-map-page-layout"
              style={{
                gridTemplateColumns,
              }}
            >
              {showMapPane ? (
                <div className="curriculum-map-page-main">{this.renderExplorerMain()}</div>
              ) : null}
              {showDivider ? (
                <>
                  <div
                    className="map-split-divider"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Breite der Seitenaufteilung"
                    title="Ziehen zum Anpassen, Doppelklick = 50/50"
                    onMouseDown={this.handleMapSplitDragStart}
                    onDoubleClick={() =>
                      this.setState({ mapSplitRatio: 50 }, () => {
                        if (typeof window !== "undefined") {
                          window.localStorage.setItem(MAP_SPLIT_STORAGE_KEY, "50");
                        }
                      })
                    }
                  >
                    <span className="map-split-divider-handle" aria-hidden="true" />
                  </div>
                </>
              ) : null}
              {showChainPane ? this.renderMapChainPanel() : null}
            </div>
          </div>
        </section>
      );
    }

    return (
      <div
        className="curriculum-map-backdrop"
        role="presentation"
        onClick={this.handleBackdropClick}
      >
        <div
          id="curriculum-map-root"
          className="curriculum-map-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="curriculum-map-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="curriculum-map-header">
            <div className="curriculum-map-header-text">
              <h2 id="curriculum-map-title">Landkarte Lehrplan 21</h2>
              <p className="curriculum-map-subtitle">
                Nach Fachwahl bleibt eine Fach-Leiste sichtbar; filtern, auf- und zuklappen; Stufe antippen öffnet
                den Aufbau.
              </p>
            </div>
            <button
              type="button"
              className="curriculum-map-close"
              onClick={this.props.onClose}
              aria-label="Landkarte schließen"
            >
              ×
            </button>
          </header>

          {this.renderBreadcrumb()}

          <div className="curriculum-map-body">{this.renderInner()}</div>
        </div>
      </div>
    );
  }
}

export default CurriculumMapOverlay;
