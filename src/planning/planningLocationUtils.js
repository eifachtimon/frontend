import { getLevelMeta, getTodayWeekdayId } from "./planningLevels";
import { getIsoWeek } from "./planningStore";
import { WEEKDAYS } from "./planningDefaults";

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.id, d.label]));

export const getPlanningTimeContext = () => {
  const { kw, year } = getIsoWeek();
  const todayWd = getTodayWeekdayId();
  return {
    kw,
    year,
    todayLabel: todayWd ? WEEKDAY_LABELS[todayWd] : null,
  };
};

export const getLevelTrailLabel = (levelId) => {
  const meta = getLevelMeta(levelId);
  return meta.label;
};
