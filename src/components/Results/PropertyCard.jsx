import { memo } from 'react';
import { GitCompareArrows, Heart } from 'lucide-react';
import PropertyImage from '../common/PropertyImage';
import StatusBadge from '../common/StatusBadge';
import { fmtSF, headlinePrice } from '../../utils/format';

function PropertyCard({
  property: p, refDate, hovered, selected, favorite, comparing, onHover, onSelect, onToggleFavorite, onToggleCompare,
}) {
  return (
    <div
      role="listitem"
      data-id={p.id}
      className={`card ${hovered ? 'is-hovered' : ''} ${selected ? 'is-selected' : ''}`}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(p.id)}
      onBlur={() => onHover(null)}
    >
      <button type="button" className="card-main" onClick={() => onSelect(p.id, { fly: true })} aria-label={`${p.propertyName}, ${p.address}`}>
        <div className="card-thumb"><PropertyImage property={p} iconSize={22} /></div>
        <div className="card-body">
          <div className="card-top"><StatusBadge property={p} refDate={refDate} /></div>
          <div className="card-title">{p.propertyName}</div>
          <div className="card-address">{p.address.replace(', Philadelphia, PA', ',')}</div>
          <div className="card-price">{headlinePrice(p)}</div>
          <div className="card-meta">
            <span>{p.propertyType}</span>
            <span aria-hidden="true">·</span>
            <span>{p.availableSF ? `${fmtSF(p.availableSF)} avail.` : `${p.lotSizeAcres} AC lot`}</span>
          </div>
        </div>
      </button>
      <div className="card-actions">
        <button type="button" className={`icon-btn sm ${favorite ? 'is-active-fav' : ''}`} onClick={() => onToggleFavorite(p.id)} aria-pressed={favorite} title={favorite ? 'Remove from saved' : 'Save'}>
          <Heart size={15} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className={`icon-btn sm ${comparing ? 'is-active' : ''}`} onClick={() => onToggleCompare(p.id)} aria-pressed={comparing} title={comparing ? 'Remove from compare' : 'Compare'}>
          <GitCompareArrows size={15} />
        </button>
      </div>
    </div>
  );
}

export default memo(PropertyCard);
