import React from "react";

const PlanningSection = ({ title, children, className = "" }) => (
  <section className={`planning-section ${className}`.trim()}>
    {title ? <h3 className="planning-section-title">{title}</h3> : null}
    {children}
  </section>
);

export default PlanningSection;
