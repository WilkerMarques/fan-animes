export function HomeLinkCard({ link, icon, clicked, delay, onClick }) {
  const handleActivate = (event) => {
    onClick(link, event);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate(event);
    }
  };

  return (
    <div
      className={`link-card animate-in ${clicked === link.id ? "active" : ""}`}
      style={{ animationDelay: delay }}
      role="button"
      tabIndex={0}
      aria-label={link.label}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="glow-line" style={{ background: link.color }} />
      <div className="link-icon" style={{ background: `${link.color}18`, color: link.color }}>
        {icon}
      </div>
      <div className="link-text">
        <div className="link-label">{link.label}</div>
        {link.sub && <div className="link-sub">{link.sub}</div>}
      </div>
      <span className="link-arrow">›</span>
    </div>
  );
}
