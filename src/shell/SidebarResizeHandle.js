import React, { useCallback } from "react";

const SidebarResizeHandle = ({ onResize, currentWidth }) => {
  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = currentWidth;

      const handlePointerMove = (moveEvent) => {
        onResize(startWidth + (moveEvent.clientX - startX));
      };

      const handlePointerUp = () => {
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [currentWidth, onResize]
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Seitenleiste verbreitern oder verkleinern"
      className="app-sidebar-resize-handle"
      onPointerDown={handlePointerDown}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onResize(currentWidth - 16);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onResize(currentWidth + 16);
        }
      }}
    />
  );
};

export default SidebarResizeHandle;
