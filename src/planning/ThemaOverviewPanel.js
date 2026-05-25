import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vorhabenLektionPath } from "../config/appUrls";
import ThemaOverviewPrepSection from "./ThemaOverviewPrepSection";
import ThemaWeekCalendarBlock from "./ThemaWeekCalendarBlock";
import ThemaOverviewLektionen from "./ThemaOverviewLektionen";
import { openThemaOverviewHash } from "./themaOverviewToggleUtils";
import { addLektion } from "./planningStore";
import { calendarSlotKey } from "../calendar/calendarDropFromPointer";
import { getOverviewStats } from "./themaOverviewUtils";

const ThemaOverviewPanel = ({ vorhaben, onChange, rituals = [] }) => {
  const navigate = useNavigate();
  const stats = getOverviewStats(vorhaben);
  const unscheduledCount = stats.unscheduled ?? 0;
  const [lektionDragPreview, setLektionDragPreview] = useState(null);
  const handleCalendarDragPreview = useCallback((preview) => {
    setLektionDragPreview((prev) => {
      const prevKey = prev?.slot ? calendarSlotKey(prev.slot) : null;
      const nextKey = preview?.slot ? calendarSlotKey(preview.slot) : null;
      if (
        prevKey === nextKey &&
        (prev?.lektionId ?? null) === (preview?.lektionId ?? null)
      ) {
        return prev;
      }
      return preview;
    });
  }, []);

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
      <ThemaOverviewPrepSection vorhaben={vorhaben} onChange={onChange} />

      <div className="thema-dashboard" aria-label="Lektionen und Kalender">
        <ThemaOverviewLektionen
          vorhaben={vorhaben}
          onChange={onChange}
          onOpenLektion={openLektionPlan}
          onAddLektion={handleAddLektion}
          onCalendarDragPreview={handleCalendarDragPreview}
          unscheduledCount={unscheduledCount}
        />

        <ThemaWeekCalendarBlock
          vorhaben={vorhaben}
          rituals={rituals}
          onChange={onChange}
          lektionDragPreview={lektionDragPreview}
          compactHeader
        />
      </div>
    </div>
  );
};

export default ThemaOverviewPanel;
