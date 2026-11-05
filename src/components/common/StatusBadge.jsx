import { STATUS_COLORS } from '../../config';
import { isRecent, statusLabel } from '../../utils/format';

export default function StatusBadge({ property, refDate, compact = false }) {
  const recent = isRecent(property, refDate);
  return (
    <span className="badges">
      <span className="badge" style={{ '--badge': STATUS_COLORS[property.status] }}>
        {compact ? property.status : statusLabel(property.status)}
      </span>
      {recent && <span className="badge badge-new" style={{ '--badge': STATUS_COLORS.New }}>New</span>}
    </span>
  );
}
