import { ExternalLink, FileDown, GitCompareArrows, Heart, Mail, Phone } from 'lucide-react';
import PropertyImage from '../common/PropertyImage';
import StatusBadge from '../common/StatusBadge';
import {
  fmtAcres, fmtCurrency, fmtPct, fmtRate, fmtSF, pricePerSF, fmtNum,
} from '../../utils/format';

export default function PropertyPopup({
  property: p, refDate, favorites = [], compareIds = [], onToggleFavorite, onToggleCompare, onBrochure,
}) {
  const fav = favorites.includes(p.id);
  const cmp = compareIds.includes(p.id);
  const rows = [
    ['Property Type', p.propertyType],
    ['Sale Price', p.salePrice ? `${fmtCurrency(p.salePrice)}${pricePerSF(p) ? ` ($${fmtNum(Math.round(pricePerSF(p)))}/SF)` : ''}` : '—'],
    ['Lease Rate', fmtRate(p.leaseRate, p.leaseType)],
    ['Cap Rate', fmtPct(p.capRate)],
    ['Building Size', fmtSF(p.buildingSF)],
    ['Available Space', fmtSF(p.availableSF)],
    ['Lot Size', fmtAcres(p.lotSizeAcres)],
    ['Year Built', p.yearBuilt ?? '—'],
  ];

  return (
    <article className="popup">
      <div className="popup-media">
        <PropertyImage property={p} iconSize={36} />
        <div className="popup-media-badges"><StatusBadge property={p} refDate={refDate} /></div>
      </div>
      <div className="popup-body">
        <h3 className="popup-title">{p.propertyName}</h3>
        <p className="popup-address">{p.address}</p>
        <p className="popup-hood">{p.neighborhood}</p>
        <dl className="popup-grid">
          {rows.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <div className="popup-broker">
          <div>
            <div className="popup-broker-name">{p.broker}</div>
            <div className="popup-broker-co">{p.company}</div>
          </div>
          <div className="popup-broker-links">
            {p.phone && <a href={`tel:${p.phone.replace(/\D/g, '')}`} aria-label={`Call ${p.broker}`}><Phone size={14} /> {p.phone}</a>}
            {p.email && <a href={`mailto:${p.email}?subject=${encodeURIComponent(`Inquiry: ${p.propertyName}`)}`} aria-label={`Email ${p.broker}`}><Mail size={14} /> Email</a>}
          </div>
        </div>
        <div className="popup-actions">
          <button type="button" className={`icon-btn ${fav ? 'is-active-fav' : ''}`} onClick={() => onToggleFavorite?.(p.id)} title={fav ? 'Remove from saved' : 'Save property'} aria-pressed={fav}>
            <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className={`icon-btn ${cmp ? 'is-active' : ''}`} onClick={() => onToggleCompare?.(p.id)} title={cmp ? 'Remove from compare' : 'Add to compare'} aria-pressed={cmp}>
            <GitCompareArrows size={16} />
          </button>
          <button type="button" className="icon-btn" onClick={() => onBrochure?.(p)} title="Download PDF brochure">
            <FileDown size={16} />
          </button>
          {p.listingUrl && (
            <a className="btn btn-primary btn-sm popup-cta" href={p.listingUrl} target="_blank" rel="noopener noreferrer">
              Full Listing <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
