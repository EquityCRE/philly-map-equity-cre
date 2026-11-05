import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart,
} from 'recharts';
import {
  BadgeDollarSign, Building2, CalendarPlus, KeyRound, Ruler, Tag,
} from 'lucide-react';
import { STATUS_COLORS } from '../../config';
import {
  byPropertyType, listingsTrend, marketStats, rentByMarket, transactionMix,
} from '../../utils/stats';
import { fmtCompactCurrency, fmtNum } from '../../utils/format';

function Kpi({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="kpi">
      <div className={`kpi-icon tone-${tone}`}><Icon size={16} /></div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, height = 200 }) {
  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <div style={{ height }}>{children}</div>
    </section>
  );
}

const tooltipStyle = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' },
  labelStyle: { color: 'var(--text)', fontWeight: 600 },
  cursor: { fill: 'var(--hover)' },
};

export default function AnalyticsPanel({ listings, scopeLabel, refDate }) {
  const s = marketStats(listings, refDate);
  const types = byPropertyType(listings);
  const rents = rentByMarket(listings);
  const mix = transactionMix(listings);
  const trend = listingsTrend(listings, refDate);
  const axis = { fontSize: 11, fill: 'var(--text-muted)' };

  return (
    <div className="analytics">
      <p className="analytics-scope">Market statistics for <strong>{scopeLabel}</strong> · {s.total} listings</p>
      <div className="kpis">
        <Kpi icon={Tag} tone="blue" label="For Sale" value={fmtNum(s.forSale)} sub={`${fmtCompactCurrency(s.totalSaleVolume)} total ask`} />
        <Kpi icon={KeyRound} tone="green" label="For Lease" value={fmtNum(s.forLease)} />
        <Kpi icon={BadgeDollarSign} tone="green" label="Avg Asking Rent" value={s.avgRent ? `$${s.avgRent.toFixed(2)}` : '—'} sub="per SF / year" />
        <Kpi icon={Building2} tone="blue" label="Avg Sale $/SF" value={s.avgPricePerSF ? `$${Math.round(s.avgPricePerSF)}` : '—'} sub={s.avgCap ? `${s.avgCap.toFixed(2)}% avg cap` : undefined} />
        <Kpi icon={Ruler} tone="purple" label="Available SF" value={s.totalAvailableSF >= 1e6 ? `${(s.totalAvailableSF / 1e6).toFixed(2)}M` : fmtNum(s.totalAvailableSF)} sub="lease inventory" />
        <Kpi icon={CalendarPlus} tone="red" label="New (30 days)" value={fmtNum(s.newLast30)} />
      </div>

      {listings.length > 0 && (
        <>
          <ChartCard title="Listings by property type">
            <ResponsiveContainer>
              <BarChart data={types} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={96} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="sale" name="For sale" stackId="a" fill={STATUS_COLORS.Sale} radius={[0, 0, 0, 0]} />
                <Bar dataKey="lease" name="For lease" stackId="a" fill={STATUS_COLORS.Lease} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="chart-row">
            <ChartCard title="Transaction mix" height={170}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={mix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={2} stroke="var(--surface)">
                    {mix.map((m) => <Cell key={m.name} fill={STATUS_COLORS[m.name]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mini-legend">
                {mix.map((m) => <li key={m.name}><span className="dot" style={{ background: STATUS_COLORS[m.name] }} />{m.name} <b>{m.value}</b></li>)}
              </ul>
            </ChartCard>
            <ChartCard title="New listings / week" height={170}>
              <ResponsiveContainer>
                <AreaChart data={trend} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={STATUS_COLORS.New} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={STATUS_COLORS.New} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ ...axis, fontSize: 9 }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="count" name="New listings" stroke={STATUS_COLORS.New} strokeWidth={2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {rents.length > 0 && (
            <ChartCard title="Average asking rent by market ($/SF/yr)" height={Math.max(140, rents.length * 26)}>
              <ResponsiveContainer>
                <BarChart data={rents} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={110} tick={axis} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Avg rent']} />
                  <Bar dataKey="rent" fill={STATUS_COLORS.Lease} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
