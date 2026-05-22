import React, { useEffect, useState } from "react";

const PlanningSaveToast = ({ pulseKey }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pulseKey == null || pulseKey === 0) {
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(t);
  }, [pulseKey]);

  if (!visible) {
    return null;
  }

  return (
    <div className="planning-save-toast" role="status" aria-live="polite">
      Gespeichert
    </div>
  );
};

export default PlanningSaveToast;
