import { Heart, Maximize2, Minimize2, Moon, PenTool, Sun } from 'lucide-react';
import SearchBar from '../Search/SearchBar';

export default function Header({
  properties, query, onQuery, onPick, theme, onToggleTheme, drawMode, onToggleDraw,
  mapOnly, onToggleMapOnly, favoritesCount, favoritesOnly, onToggleFavoritesOnly,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="var(--brand)" />
          <path d="M8 24V12l5-3v15M15 24V7l9 4v13M18 13h3M18 17h3M18 21h3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="brand-text">
          <span className="brand-name">PHL Commercial</span>
          <span className="brand-sub">Philadelphia CRE Map</span>
        </div>
      </div>

      <SearchBar properties={properties} value={query} onQuery={onQuery} onPick={onPick} />

      <nav className="topbar-actions" aria-label="Map tools">
        <button type="button" className={`tool-btn ${drawMode ? 'is-on' : ''}`} onClick={onToggleDraw} aria-pressed={drawMode} title="Draw a search area">
          <PenTool size={16} /><span className="hide-md">Draw</span>
        </button>
        <button type="button" className={`tool-btn ${favoritesOnly ? 'is-on' : ''}`} onClick={onToggleFavoritesOnly} aria-pressed={favoritesOnly} title="Show saved properties">
          <Heart size={16} fill={favoritesOnly ? 'currentColor' : 'none'} />
          <span className="hide-md">Saved</span>
          {favoritesCount > 0 && <span className="count-pill">{favoritesCount}</span>}
        </button>
        <button type="button" className="tool-btn" onClick={onToggleMapOnly} title={mapOnly ? 'Exit full-screen map' : 'Full-screen map'}>
          {mapOnly ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button type="button" className="tool-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} aria-label="Toggle dark mode">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>
    </header>
  );
}
