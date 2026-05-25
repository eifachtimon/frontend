import React from "react";
import UnterrichtChecklistPanel from "./UnterrichtChecklistPanel";

const TagesTodosPanel = (props) => (
  <UnterrichtChecklistPanel
    emptyLabel="Noch keine Todos — unten hinzufügen."
    addPlaceholder="Neues Todo …"
    openListAriaLabel="Offene Todos"
    doneListAriaLabel="Erledigte Todos"
    {...props}
  />
);

export default TagesTodosPanel;
