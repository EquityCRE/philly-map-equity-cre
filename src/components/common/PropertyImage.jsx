import { useState } from 'react';
import {
  Building2, Store, Factory, Home, Trees, Layers, Stethoscope, Warehouse, Hotel,
} from 'lucide-react';

const TYPE_STYLE = {
  Office: { icon: Building2, from: '#1E3A5F', to: '#3B6EA5' },
  Retail: { icon: Store, from: '#7C2D12', to: '#C2410C' },
  Industrial: { icon: Factory, from: '#334155', to: '#64748B' },
  Multifamily: { icon: Home, from: '#14532D', to: '#15803D' },
  Land: { icon: Trees, from: '#3F6212', to: '#65A30D' },
  'Mixed Use': { icon: Layers, from: '#4C1D95', to: '#7C3AED' },
  'Medical Office': { icon: Stethoscope, from: '#0E7490', to: '#06B6D4' },
  'Flex Space': { icon: Warehouse, from: '#78350F', to: '#B45309' },
  Hospitality: { icon: Hotel, from: '#831843', to: '#DB2777' },
};

/**
 * Listing photo with a branded, type-specific fallback.
 * Sample data ships without photos; live feeds supply `image` URLs.
 */
export default function PropertyImage({ property, className = '', iconSize = 28 }) {
  const [failed, setFailed] = useState(false);
  const s = TYPE_STYLE[property.propertyType] || TYPE_STYLE.Office;
  const Icon = s.icon;

  if (property.image && !failed) {
    return (
      <img
        src={property.image}
        alt={property.propertyName}
        className={`prop-img ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`prop-img prop-img-fallback ${className}`}
      style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
      role="img"
      aria-label={`${property.propertyType} property`}
    >
      <svg className="prop-img-skyline" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40V26h8v-8h6v8h6V14h10v26h4V20h8v-6h4v6h6v20h4V10h12v30h4V24h8v16h6V18h8v22h6V28h6v12z" fill="rgba(255,255,255,0.12)" />
      </svg>
      <Icon size={iconSize} strokeWidth={1.6} color="rgba(255,255,255,0.92)" />
    </div>
  );
}
