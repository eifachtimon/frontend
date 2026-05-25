import React from "react";
import { Link } from "react-router-dom";
import CompetencyPicker from "../components/CompetencyPicker";
import { APP_ROUTES, vorhabenLevelPath } from "../config/appUrls";
import ThemaOverviewTextPanel from "./ThemaOverviewTextPanel";
import ThemaOverviewToggle from "./ThemaOverviewToggle";
import ThemaOverviewToggleRow from "./ThemaOverviewToggleRow";
import ThemaZielePanel from "./ThemaZielePanel";
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

const ThemaKompetenzenZieleSection = ({ vorhaben, onChange }) => {
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

  return (
    <ThemaOverviewToggleRow
      columns="3"
      anchorId="thema-section-kompetenzen-ziele"
      ariaLabel="Voraussetzungen, Kompetenzen und Ziele"
    >
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

      <ThemaOverviewToggle
        sectionId="kompetenzen"
        title="Kompetenzen"
        meta={compCount > 0 ? `${compCount} gewählt` : "Noch leer"}
        bodyClassName="thema-overview-tm-body--scroll"
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
      </ThemaOverviewToggle>

      <ThemaOverviewToggle
        sectionId="ziele"
        title="Ziele"
        meta={
          truncateToggleMeta(firstOpenZiel) ||
          checklistMeta(zieleItems, "Noch leer")
        }
        bodyClassName="thema-overview-tm-body--scroll"
      >
        <ThemaZielePanel vorhaben={vorhaben} onChange={onChange} />
      </ThemaOverviewToggle>
    </ThemaOverviewToggleRow>
  );
};

export default ThemaKompetenzenZieleSection;
