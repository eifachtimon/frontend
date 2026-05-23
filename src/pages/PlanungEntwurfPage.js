import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CompetencyPicker from "../components/CompetencyPicker";
import PlanningViewHeader from "../planning/PlanningViewHeader";
import "../planning/planning.css";
import { APP_ROUTES, vorhabenLevelPath } from "../config/appUrls";
import usePlanningStore from "../planning/usePlanningStore";
import { getActiveVorhaben } from "../planning/planningHubUtils";

const DRAFT_STORAGE_KEY = "lp21-planung-entwurf-v1";

const DURATION_OPTIONS = [
  { value: "45", label: "45 Minuten" },
  { value: "90", label: "90 Minuten (Doppelstunde)" },
  { value: "120", label: "120 Minuten" },
];

const loadDraft = () => {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
};

const saveDraft = (draft) => {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (_e) {
    // quota / private mode
  }
};

const entryFromUrl = (searchParams) => {
  const uid = searchParams.get("uid") || "";
  const code = searchParams.get("code") || "";
  const fach = searchParams.get("fach") || "";
  const text = searchParams.get("text") || "";
  if (!uid.trim()) {
    return null;
  }
  return {
    uid: uid.trim(),
    label: (text || code || uid).trim().slice(0, 200),
    code: code.trim() || undefined,
    fach: fach.trim() || undefined,
    text: text.trim() || undefined,
  };
};

const PlanungEntwurfPage = () => {
  const { store } = usePlanningStore();
  const activeVorhaben = getActiveVorhaben(store);
  const [selected, setSelected] = useState([]);
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = entryFromUrl(params);
    const saved = loadDraft();
    const baseSelected = saved?.selected?.length
      ? saved.selected
      : fromUrl
        ? [fromUrl]
        : [];
    const deduped = [];
    const seen = new Set();
    for (const item of baseSelected) {
      if (!item?.uid || seen.has(item.uid)) {
        continue;
      }
      seen.add(item.uid);
      deduped.push(item);
    }
    setSelected(deduped.slice(0, 5));
    if (saved?.duration) {
      setDuration(String(saved.duration));
    }
    if (typeof saved?.notes === "string") {
      setNotes(saved.notes);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveDraft({ selected, duration, notes });
  }, [selected, duration, notes, hydrated]);

  const summaryLine = useMemo(() => {
    if (selected.length === 0) {
      return "";
    }
    return selected
      .map((s) => s.code || s.label)
      .filter(Boolean)
      .join(" · ");
  }, [selected]);

  return (
    <div className="app-shell planung-page planning-surface">
      <main className="planung-main layout">
        <PlanningViewHeader
          band="blue"
          title="Stundenentwurf"
          lead="Entwurf — bitte prüfen. KI-Generierung folgt in einer späteren Phase."
        >
          {activeVorhaben ? (
            <p className="planung-entwurf-hint">
              Empfohlen: Stundenentwurf in der{" "}
              <Link to={vorhabenLevelPath(activeVorhaben.id, "lektion")}>
                Lektionsebene von «{activeVorhaben.title}»
              </Link>{" "}
              pflegen, damit alles im Thema bleibt.
            </p>
          ) : (
            <p className="planung-entwurf-hint">
              <Link to={APP_ROUTES.home}>Lege ein Thema an</Link>, um Planung und Entwurf zu
              bündeln.
            </p>
          )}
        </PlanningViewHeader>

        <form className="planung-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <fieldset className="planung-fieldset planung-fieldset--picker">
            <legend>Kompetenzen für diese Stunde</legend>
            {summaryLine ? (
              <p className="planung-competency-summary">{summaryLine}</p>
            ) : null}
            <CompetencyPicker selected={selected} onChange={setSelected} maxSelected={5} />
          </fieldset>

          <div className="planung-field">
            <label htmlFor="planung-duration">Dauer</label>
            <select
              id="planung-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="planung-field">
            <label htmlFor="planung-notes">Notizen (optional)</label>
            <textarea
              id="planung-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lernziele, Material, Besonderheiten …"
            />
          </div>

          <p className="planung-api-placeholder">
            Entwurf wird lokal zwischengespeichert. Server-KI folgt später.
          </p>

          <button
            type="button"
            className="planung-submit-stub"
            disabled={selected.length === 0}
            aria-disabled={selected.length === 0}
            title={
              selected.length === 0
                ? "Mindestens eine Kompetenz auswählen"
                : undefined
            }
          >
            Entwurf generieren (demnächst)
          </button>
        </form>
      </main>
    </div>
  );
};

export default PlanungEntwurfPage;
