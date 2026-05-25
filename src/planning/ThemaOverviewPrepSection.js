import React from "react";
import { Link } from "react-router-dom";
import CompetencyPicker from "../components/CompetencyPicker";
import { APP_ROUTES, vorhabenLevelPath } from "../config/appUrls";
import ThemaMaterialInline from "./ThemaMaterialInline";
import ThemaOverviewCombinedToggle from "./ThemaOverviewCombinedToggle";
import ThemaOverviewPane from "./ThemaOverviewPane";
import ThemaOverviewTextPanel from "./ThemaOverviewTextPanel";
import ThemaOverviewToggle from "./ThemaOverviewToggle";
import ThemaVorhabenTodosPanel from "./ThemaVorhabenTodosPanel";
import ThemaZielePanel from "./ThemaZielePanel";
import { getOverviewStats } from "./themaOverviewUtils";
import { truncateToggleMeta } from "./themaOverviewToggleUtils";

const checklistMeta = (items, emptyLabel) => {
  const list = items || [];
  const open = list.filter((i) => !i.done).length;
  if (open > 0) {
    return `${open} offen`;
  }
  if (list.length > 0) {
    return "Alles erledigt";
  }
  return emptyLabel;
};

const joinMeta = (parts) => parts.filter(Boolean).join(" · ");

const ThemaOverviewPrepSection = ({ vorhaben, onChange }) => {
  const stats = getOverviewStats(vorhaben);

  const updateGrob = (patch) => {
    onChange({
      ...vorhaben,
      grob: { ...vorhaben.grob, ...patch },
    });
  };

  const vorausText = vorhaben.grob?.voraussetzungen || "";
  const zieleItems = vorhaben.grob?.zieleListe || [];
  const compCount = vorhaben.competencies?.length || 0;
  const firstOpenZiel = zieleItems.find((z) => !z.done)?.text;

  const openTodos = stats.openTodos ?? 0;
  const materialItems = vorhaben.zweiWochen?.materialListe || [];
  const openMaterial = materialItems.filter((m) => !m.done).length;
  const materialCount = stats.materialCount ?? 0;

  const erinnerungen = vorhaben.erinnerungen || [];
  const todosMeta =
    openTodos > 0
      ? `${openTodos} offen`
      : erinnerungen.length > 0
        ? "Alles erledigt"
        : null;
  const materialMeta =
    openMaterial > 0
      ? `${openMaterial} offen`
      : materialCount > 0
        ? "Alles erledigt"
        : null;

  const kzMeta = joinMeta([
    compCount > 0 ? `${compCount} Kompetenzen` : null,
    truncateToggleMeta(firstOpenZiel) || checklistMeta(zieleItems, null),
  ]);

  const tmMeta = joinMeta([todosMeta, materialMeta]);

  return (
    <div className="thema-overview-prep" aria-label="Vorbereitung am Thema">
      <div className="thema-overview-prep__top">
        <ThemaOverviewToggle
          sectionId="voraussetzungen"
          title="Voraussetzungen"
          meta={truncateToggleMeta(vorausText) || "Noch leer"}
          bodyClassName="thema-overview-tm-body--scroll"
        >
          <ThemaOverviewTextPanel
            id="thema-kz-voraus"
            value={vorausText}
            onChange={(v) => updateGrob({ voraussetzungen: v })}
            placeholder="Was müssen die Lernenden schon können?"
            rows={3}
            ariaLabel="Voraussetzungen"
          />
          <p className="thema-overview-tm-footnote">
            <Link to={vorhabenLevelPath(vorhaben.id, "grob")}>Phasen in der Grobplanung →</Link>
          </p>
        </ThemaOverviewToggle>

        <ThemaOverviewCombinedToggle
          sectionId="kompetenzen-ziele"
          title="Kompetenzen & Ziele"
          meta={kzMeta || "Noch leer"}
          layout="row"
        >
          <ThemaOverviewPane
            sectionId="kompetenzen"
            title="Kompetenzen"
            className="thema-overview-tm-pane--scroll"
          >
            <p className="thema-overview-tm-inline-link">
              Aus <Link to={APP_ROUTES.search}>Suche</Link> oder Merkliste.
            </p>
            <CompetencyPicker
              variant="thema"
              selected={vorhaben.competencies || []}
              onChange={(competencies) => onChange({ ...vorhaben, competencies })}
              maxSelected={12}
            />
          </ThemaOverviewPane>
          <ThemaOverviewPane
            sectionId="ziele"
            title="Ziele"
            className="thema-overview-tm-pane--scroll"
          >
            <ThemaZielePanel vorhaben={vorhaben} onChange={onChange} />
          </ThemaOverviewPane>
        </ThemaOverviewCombinedToggle>
      </div>

      <ThemaOverviewCombinedToggle
        sectionId="todos-material"
        title="Todos & Material"
        meta={tmMeta || "Noch leer"}
        layout="stack"
      >
        <ThemaOverviewPane sectionId="todos" title="Todos">
          <ThemaVorhabenTodosPanel vorhaben={vorhaben} onChange={onChange} />
        </ThemaOverviewPane>
        <ThemaOverviewPane
          sectionId="material"
          title="Material"
          className="thema-overview-tm-pane--scroll"
        >
          <ThemaMaterialInline vorhaben={vorhaben} onChange={onChange} />
        </ThemaOverviewPane>
      </ThemaOverviewCombinedToggle>
    </div>
  );
};

export default ThemaOverviewPrepSection;
