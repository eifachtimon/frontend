import React from "react";

export const BEAK_DEPTH = 8;
export const BEAK_HALF = 7;
const BORDER_W = 2;

const clampBeakTop = (height, beakTop) =>
  Math.max(
    BEAK_HALF + BORDER_W,
    Math.min(height - BEAK_HALF - BORDER_W, Math.round(beakTop))
  );

const getOuterPoints = (width, height, beakTop, side) => {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const t = clampBeakTop(h, beakTop);

  if (side === "left") {
    const W = w + BEAK_DEPTH;
    return [
      [0, t],
      [BEAK_DEPTH, t + BEAK_HALF],
      [BEAK_DEPTH, h],
      [W, h],
      [W, 0],
      [BEAK_DEPTH, 0],
      [BEAK_DEPTH, t - BEAK_HALF],
    ];
  }

  if (side === "right") {
    const W = w + BEAK_DEPTH;
    return [
      [w, t - BEAK_HALF],
      [W, t],
      [w, t + BEAK_HALF],
      [w, h],
      [0, h],
      [0, 0],
      [w, 0],
    ];
  }

  return [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
};

/** Inset entlang Winkelhalbierender – gleichmäßiger 2px-Ring auch an der Pfeilspitze. */
const insetPoints = (points, inset) => {
  const n = points.length;
  const result = [];
  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const v1x = curr[0] - prev[0];
    const v1y = curr[1] - prev[1];
    const v2x = next[0] - curr[0];
    const v2y = next[1] - curr[1];
    const l1 = Math.hypot(v1x, v1y) || 1;
    const l2 = Math.hypot(v2x, v2y) || 1;
    const n1x = v1y / l1;
    const n1y = -v1x / l1;
    const n2x = v2y / l2;
    const n2y = -v2x / l2;
    let bx = n1x + n2x;
    let by = n1y + n2y;
    const bl = Math.hypot(bx, by) || 1;
    bx /= bl;
    by /= bl;
    const dot = Math.max(-1, Math.min(1, n1x * n2x + n1y * n2y));
    const sinHalf = Math.sqrt(Math.max(0.01, (1 - dot) / 2));
    const miter = Math.min(inset / sinHalf, inset * 5);
    result.push([curr[0] + bx * miter, curr[1] + by * miter]);
  }
  return result;
};

const pointsToPath = (points) => {
  if (!points.length) {
    return "";
  }
  const [first, ...rest] = points;
  return `M ${first[0]} ${first[1]} ${rest.map((p) => `L ${p[0]} ${p[1]}`).join(" ")} Z`;
};

export const buildPopoverRingPaths = (width, height, beakTop, side) => {
  const outerPts = getOuterPoints(width, height, beakTop, side);
  const innerPts = insetPoints(outerPts, BORDER_W);
  return {
    outer: pointsToPath(outerPts),
    inner: pointsToPath(innerPts),
  };
};

export const getPopoverShapeLayout = (width, height, side) => {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const extra = side === "left" || side === "right" ? BEAK_DEPTH : 0;
  return {
    shapeWidth: w + extra,
    shapeHeight: h,
    contentPadLeft: side === "left" ? BEAK_DEPTH + BORDER_W : BORDER_W,
    contentPadRight: side === "right" ? BEAK_DEPTH + BORDER_W : BORDER_W,
    contentPadTop: BORDER_W,
    contentPadBottom: BORDER_W,
    marginLeft: side === "left" ? -BEAK_DEPTH : 0,
    marginRight: side === "right" ? -BEAK_DEPTH : 0,
  };
};

/** 2px-Ring: äußerer Pfad schwarz, innerer weiß – gleichmäßig an Ecken und Pfeil. */
export const PopoverClipShell = ({ width, height, beakTop, side, children }) => {
  const layout = getPopoverShapeLayout(width, height, side);
  const { outer, inner } = buildPopoverRingPaths(width, height, beakTop, side);

  return (
    <div
      className="cal-event-popover-ring-host"
      style={{
        width: layout.shapeWidth,
        height: layout.shapeHeight,
        marginLeft: layout.marginLeft,
        marginRight: layout.marginRight,
      }}
    >
      <svg
        className="cal-event-popover-ring__svg"
        aria-hidden="true"
        width={layout.shapeWidth}
        height={layout.shapeHeight}
      >
        <path d={outer} className="cal-event-popover-ring__outer" />
        <path d={inner} className="cal-event-popover-ring__inner" />
      </svg>
      <div
        className="cal-event-popover-ring__content"
        style={{
          paddingTop: layout.contentPadTop,
          paddingBottom: layout.contentPadBottom,
          paddingLeft: layout.contentPadLeft,
          paddingRight: layout.contentPadRight,
        }}
      >
        {children}
      </div>
    </div>
  );
};
