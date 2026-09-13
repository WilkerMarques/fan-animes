import { HomeLinkCard } from "./HomeLinkCard";

export function DesktopHomeLayout({
  icons,
  spotifyLinks,
  youtubeLinks,
  tiktokLink,
  instagramLink,
  clicked,
  onLinkClick,
  onSupport,
  onCommunity,
}) {
  const renderCard = (link, idx) => (
    <HomeLinkCard
      key={link.id}
      link={link}
      icon={icons[link.icon]}
      clicked={clicked}
      delay={`${0.25 + idx * 0.06}s`}
      onClick={onLinkClick}
    />
  );

  return (
    <div className="desktop-home">
      <div className="desktop-actions">
        <div className="desktop-cta desktop-cta-support">
          <h2 className="desktop-cta-title">Apoie o projeto</h2>
          <button type="button" className="desktop-cta-btn" onClick={onSupport}>
            Apoie agora
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="desktop-cta desktop-cta-community">
          <h2 className="desktop-cta-title">Entre na comunidade</h2>
          <button type="button" className="desktop-cta-btn" onClick={onCommunity}>
            Participar
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div className="desktop-links">
        <div className="desktop-links-col">
          {spotifyLinks.map((link, idx) => renderCard(link, idx))}
          {renderCard(tiktokLink, spotifyLinks.length)}
        </div>
        <div className="desktop-links-col">
          {youtubeLinks.map((link, idx) => renderCard(link, idx))}
          {renderCard(instagramLink, youtubeLinks.length)}
        </div>
      </div>
    </div>
  );
}
