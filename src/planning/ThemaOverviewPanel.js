import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { vorhabenLektionPath } from "../config/appUrls";
import ThemaKompetenzenZieleSection from "./ThemaKompetenzenZieleSection";
import ThemaTodosMaterialSection from "./ThemaTodosMaterialSection";
import ThemaWeekCalendarBlock from "./ThemaWeekCalendarBlock";
import ThemaOverviewLektionen from "./ThemaOverviewLektionen";
import { openThemaOverviewHash } from "./themaOverviewToggleUtils";
import { addLektion } from "./planningStore";
import { getOverviewStats } from "./themaOverviewUtils";

const ThemaOverviewPanel = ({ vorhaben, onChange, rituals = [] }) => {
  const navigate = useNavigate();
  const stats = getOverviewStats(vorhaben);
  const unscheduledCount = stats.unscheduled ?? 0;

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) {
      return;
    }
    requestAnimationFrame(() => openThemaOverviewHash(hash));
  }, [vorhaben.id]);

  const handleAddLektion = (phaseId = null) => {
    const next = addLektion(vorhaben, { phaseId });
    onChange(next);
    navigate(vorhabenLektionPath(vorhaben.id, next.lektion.id));
  };

  const openLektionPlan = (lektionId) => {
    navigate(vorhabenLektionPath(vorhaben.id, lektionId));
  };

  return (
    <div className="thema-overview thema-overview--unified">
      <ThemaKompetenzenZieleSection vorhaben={vorhaben} onChange={onChange} />

      <ThemaTodosMaterialSection vorhaben={vorhaben} onChange={onChange} />

      <div className="thema-dashboard" aria-label="Lektionen und Kalender">
        <ThemaOverviewLektionen
          vorhaben={vorhaben}
          onChange={onChange}
          onOpenLektion={openLektionPlan}
          onAddLektion={() => handleAddLektion()}
          unscheduledCount={unscheduledCount}
        />

        <ThemaWeekCalendarBlock
          vorhaben={vorhaben}
          rituals={rituals}
          onChange={onChange}
          compactHeader
        />
      </div>
    </div>
  );
};

export default ThemaOverviewPanel;
