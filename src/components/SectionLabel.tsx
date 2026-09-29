interface SectionLabelProps {
  num: string;
  title: string;
  description?: string;
}

export function SectionLabel({ num, title, description }: SectionLabelProps) {
  return (
    <div className="section-label-wrap">
      <div className="section-badge">
        <span className="section-badge-num">{num}</span>
        <span className="section-badge-sep">·</span>
        <span className="section-badge-title">{title}</span>
      </div>
      {description && <p className="section-desc">{description}</p>}
    </div>
  );
}
