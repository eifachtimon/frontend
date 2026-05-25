import React from "react";
import ThemaMaterialInline from "./ThemaMaterialInline";
import ThemaOverviewToggle from "./ThemaOverviewToggle";
import ThemaOverviewToggleRow from "./ThemaOverviewToggleRow";
import ThemaVorhabenTodosPanel from "./ThemaVorhabenTodosPanel";
import { getOverviewStats } from "./themaOverviewUtils";

const ThemaTodosMaterialSection = ({ vorhaben, onChange }) => {
  const stats = getOverviewStats(vorhaben);
  const openTodos = stats.openTodos ?? 0;
  const materialCount = stats.materialCount ?? 0;

  const todosMeta = openTodos > 0 ? `${openTodos} offen` : "Alles erledigt";
  const materialItems = vorhaben.zweiWochen?.materialListe || [];
  const openMaterial = materialItems.filter((m) => !m.done).length;
  const materialMeta =
    openMaterial > 0
      ? `${openMaterial} offen`
      : materialCount > 0
        ? "Alles erledigt"
        : "Noch leer";

  return (
    <ThemaOverviewToggleRow columns="2" ariaLabel="Todos und Material">
      <ThemaOverviewToggle sectionId="todos" title="Todos" meta={todosMeta}>
        <ThemaVorhabenTodosPanel vorhaben={vorhaben} onChange={onChange} />
      </ThemaOverviewToggle>

      <ThemaOverviewToggle
        sectionId="material"
        title="Material"
        meta={materialMeta}
        bodyClassName="thema-overview-tm-body--scroll"
      >
        <ThemaMaterialInline vorhaben={vorhaben} onChange={onChange} />
      </ThemaOverviewToggle>
    </ThemaOverviewToggleRow>
  );
};

export default ThemaTodosMaterialSection;
