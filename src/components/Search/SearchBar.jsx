import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Building, Hash, MapPin, Navigation, Search, X } from 'lucide-react';
import { buildSuggestions, geocodeAddress } from '../../utils/search';

const ICONS = { property: Building, neighborhood: MapPin, zip: Hash, place: Navigation };

/**
 * Address / neighborhood / ZIP search with keyboard-navigable autocomplete.
 * Enter with no highlighted suggestion applies the text as a keyword filter.
 */
export default function SearchBar({ properties, value, onQuery, onPick }) {
  const [text, setText] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [geo, setGeo] = useState([]);
  const listId = useId();
  const wrapRef = useRef(null);

  useEffect(() => { setText(value || ''); }, [value]);

  const local = useMemo(() => buildSuggestions(text, properties), [text, properties]);

  // Optional Mapbox geocoder for arbitrary addresses (debounced)
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => setGeo(await geocodeAddress(text, ctrl.signal)), 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [text]);

  const suggestions = useMemo(() => [...local, ...geo].slice(0, 10), [local, geo]);

  useEffect(() => {
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const pick = (s) => {
    setOpen(false);
    setActive(-1);
    if (s.kind === 'property') setText(s.label);
    else setText('');
    onPick(s);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && suggestions[active]) pick(suggestions[active]);
      else { onQuery(text.trim()); setOpen(false); }
    } else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="search" ref={wrapRef}>
      <Search size={16} className="search-icon" aria-hidden="true" />
      <input
        type="search"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Search address, neighborhood, ZIP or property"
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1); if (!e.target.value) onQuery(''); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {text && (
        <button type="button" className="search-clear" onClick={() => { setText(''); onQuery(''); }} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
      {open && suggestions.length > 0 && (
        <ul className="suggestions" id={listId} role="listbox">
          {suggestions.map((s, i) => {
            const Icon = ICONS[s.kind];
            return (
              <li
                key={s.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'is-active' : ''}
                onPointerDown={(e) => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setActive(i)}
              >
                <span className={`sugg-icon sugg-${s.kind}`}><Icon size={14} /></span>
                <span className="sugg-text">
                  <span className="sugg-label">{s.label}</span>
                  <span className="sugg-sub">{s.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
