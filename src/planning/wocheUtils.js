export const WOCHEN_DAY_START_MIN = 8 * 60;
export const WOCHEN_DAY_END_MIN = 16 * 60;
export const WOCHEN_DAY_SPAN_MIN = WOCHEN_DAY_END_MIN - WOCHEN_DAY_START_MIN;
export const WOCHEN_SNAP_MIN = 15;

export const WOCHEN_HOUR_LABELS = Array.from({ length: 9 }, (_, i) => {
  const h = 8 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

export const formatTimeFromMin = (startMin) => {
  if (startMin == null || !Number.isFinite(startMin)) {
    return "";
  }
  const h = Math.floor(startMin / 60);
  const m = startMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const snapStartMinFromRatio = (ratio) => {
  const clamped = Math.max(0, Math.min(1, ratio));
  const raw = WOCHEN_DAY_START_MIN + clamped * WOCHEN_DAY_SPAN_MIN;
  const snapped =
    Math.round((raw - WOCHEN_DAY_START_MIN) / WOCHEN_SNAP_MIN) * WOCHEN_SNAP_MIN +
    WOCHEN_DAY_START_MIN;
  return Math.max(
    WOCHEN_DAY_START_MIN,
    Math.min(WOCHEN_DAY_END_MIN - WOCHEN_SNAP_MIN, snapped)
  );
};

export const cardLayoutStyle = (card) => {
  if (card.startMin == null || !Number.isFinite(card.startMin)) {
    return null;
  }
  const top =
    ((card.startMin - WOCHEN_DAY_START_MIN) / WOCHEN_DAY_SPAN_MIN) * 100;
  const dur = card.durationMin || 45;
  const height = Math.min((dur / WOCHEN_DAY_SPAN_MIN) * 100, 100 - top);
  return {
    top: `${top}%`,
    height: `${Math.max(height, 4)}%`,
  };
};

export const DND_MIME = "application/x-lp21-woche";

export const packWocheDrag = (payload) => JSON.stringify(payload);

export const unpackWocheDrag = (dataTransfer) => {
  const raw = dataTransfer.getData(DND_MIME);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
