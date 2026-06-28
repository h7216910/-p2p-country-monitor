import { useState, useEffect, useCallback } from "react";

const MOCK_COUNTRIES = [
  {
    code: "AR", name: "Argentina", currency: "ARS", flag: "🇦🇷",
    alert_threshold_minutes: 30,
    volume_today: 142500, volume_yesterday: 158000, volume_month: 2840000, volume_projected: 4260000,
    volume_same_day_last_month: 131000,
    new_users_today: 23, new_users_month: 312, active_users: 1450,
    merchants_online: 3, merchants_offline: 34,
    unaccepted_orders_today: 7,
    orders_today: 89, orders_month: 1820, avg_order_value: 1601,
    avg_order_time_minutes: 18,
    pending_old_orders: 4,
    liquidity: {
      max_buy: 195, max_sell: 1710,
      buy: [{ label: ">= $600", merchants: 0 }, { label: ">= $400", merchants: 0 }, { label: ">= $200", merchants: 0 }, { label: ">= $100", merchants: 2 }, { label: "< $100", merchants: 3 }],
      sell: [{ label: ">= $600", merchants: 3 }, { label: ">= $400", merchants: 3 }, { label: ">= $200", merchants: 3 }, { label: ">= $100", merchants: 3 }, { label: "< $100", merchants: 3 }],
    }
  },
  {
    code: "BR", name: "Brasil", currency: "BRL", flag: "🇧🇷",
    alert_threshold_minutes: 20,
    volume_today: 398000, volume_yesterday: 371000, volume_month: 7200000, volume_projected: 10800000,
    volume_same_day_last_month: 352000,
    new_users_today: 67, new_users_month: 890, active_users: 5200,
    merchants_online: 14, merchants_offline: 8,
    unaccepted_orders_today: 2,
    orders_today: 245, orders_month: 4900, avg_order_value: 1624,
    avg_order_time_minutes: 8,
    pending_old_orders: 1,
    liquidity: {
      max_buy: 2500, max_sell: 8200,
      buy: [{ label: ">= $600", merchants: 5 }, { label: ">= $400", merchants: 8 }, { label: ">= $200", merchants: 11 }, { label: ">= $100", merchants: 14 }, { label: "< $100", merchants: 14 }],
      sell: [{ label: ">= $600", merchants: 9 }, { label: ">= $400", merchants: 11 }, { label: ">= $200", merchants: 13 }, { label: ">= $100", merchants: 14 }, { label: "< $100", merchants: 14 }],
    }
  },
  {
    code: "MX", name: "México", currency: "MXN", flag: "🇲🇽",
    alert_threshold_minutes: 25,
    volume_today: 89000, volume_yesterday: 103000, volume_month: 1650000, volume_projected: 2100000,
    volume_same_day_last_month: null,
    new_users_today: 18, new_users_month: 198, active_users: 880,
    merchants_online: 6, merchants_offline: 12,
    unaccepted_orders_today: 11,
    orders_today: 54, orders_month: 1100, avg_order_value: 1648,
    avg_order_time_minutes: 34,
    pending_old_orders: 6,
    liquidity: {
      max_buy: 850, max_sell: 3100,
      buy: [{ label: ">= $600", merchants: 1 }, { label: ">= $400", merchants: 2 }, { label: ">= $200", merchants: 4 }, { label: ">= $100", merchants: 5 }, { label: "< $100", merchants: 6 }],
      sell: [{ label: ">= $600", merchants: 4 }, { label: ">= $400", merchants: 5 }, { label: ">= $200", merchants: 6 }, { label: ">= $100", merchants: 6 }, { label: "< $100", merchants: 6 }],
    }
  },
  {
    code: "CO", name: "Colômbia", currency: "COP", flag: "🇨🇴",
    alert_threshold_minutes: 30,
    volume_today: 61000, volume_yesterday: 58500, volume_month: 980000, volume_projected: 1470000,
    volume_same_day_last_month: 55000,
    new_users_today: 14, new_users_month: 145, active_users: 610,
    merchants_online: 5, merchants_offline: 9,
    unaccepted_orders_today: 3,
    orders_today: 38, orders_month: 780, avg_order_value: 1606,
    avg_order_time_minutes: 12,
    pending_old_orders: 0,
    liquidity: {
      max_buy: 600, max_sell: 2400,
      buy: [{ label: ">= $600", merchants: 1 }, { label: ">= $400", merchants: 2 }, { label: ">= $200", merchants: 3 }, { label: ">= $100", merchants: 4 }, { label: "< $100", merchants: 5 }],
      sell: [{ label: ">= $600", merchants: 3 }, { label: ">= $400", merchants: 4 }, { label: ">= $200", merchants: 5 }, { label: ">= $100", merchants: 5 }, { label: "< $100", merchants: 5 }],
    }
  },
  {
    code: "PE", name: "Peru", currency: "PEN", flag: "🇵🇪",
    alert_threshold_minutes: 35,
    volume_today: 34000, volume_yesterday: 48000, volume_month: 620000, volume_projected: 720000,
    volume_same_day_last_month: 41000,
    new_users_today: 6, new_users_month: 72, active_users: 290,
    merchants_online: 2, merchants_offline: 15,
    unaccepted_orders_today: 18,
    orders_today: 21, orders_month: 420, avg_order_value: 1619,
    avg_order_time_minutes: 52,
    pending_old_orders: 9,
    liquidity: {
      max_buy: 120, max_sell: 540,
      buy: [{ label: ">= $600", merchants: 0 }, { label: ">= $400", merchants: 0 }, { label: ">= $200", merchants: 0 }, { label: ">= $100", merchants: 1 }, { label: "< $100", merchants: 2 }],
      sell: [{ label: ">= $600", merchants: 1 }, { label: ">= $400", merchants: 1 }, { label: ">= $200", merchants: 2 }, { label: ">= $100", merchants: 2 }, { label: "< $100", merchants: 2 }],
    }
  },
  {
    code: "CL", name: "Chile", currency: "CLP", flag: "🇨🇱",
    alert_threshold_minutes: 20,
    volume_today: 76000, volume_yesterday: 72000, volume_month: 1350000, volume_projected: 2025000,
    volume_same_day_last_month: 68000,
    new_users_today: 19, new_users_month: 210, active_users: 940,
    merchants_online: 7, merchants_offline: 5,
    unaccepted_orders_today: 1,
    orders_today: 48, orders_month: 960, avg_order_value: 1583,
    avg_order_time_minutes: 9,
    pending_old_orders: 0,
    liquidity: {
      max_buy: 1800, max_sell: 5400,
      buy: [{ label: ">= $600", merchants: 3 }, { label: ">= $400", merchants: 5 }, { label: ">= $200", merchants: 6 }, { label: ">= $100", merchants: 7 }, { label: "< $100", merchants: 7 }],
      sell: [{ label: ">= $600", merchants: 6 }, { label: ">= $400", merchants: 7 }, { label: ">= $200", merchants: 7 }, { label: ">= $100", merchants: 7 }, { label: "< $100", merchants: 7 }],
    }
  },
  {
    code: "VE", name: "Venezuela", currency: "VES", flag: "🇻🇪",
    alert_threshold_minutes: 45,
    volume_today: 22000, volume_yesterday: 24500, volume_month: 410000, volume_projected: 500000,
    volume_same_day_last_month: null,
    new_users_today: 5, new_users_month: 58, active_users: 210,
    merchants_online: 2, merchants_offline: 20,
    unaccepted_orders_today: 14,
    orders_today: 14, orders_month: 280, avg_order_value: 1571,
    avg_order_time_minutes: 41,
    pending_old_orders: 5,
    liquidity: {
      max_buy: 80, max_sell: 320,
      buy: [{ label: ">= $600", merchants: 0 }, { label: ">= $400", merchants: 0 }, { label: ">= $200", merchants: 0 }, { label: ">= $100", merchants: 0 }, { label: "< $100", merchants: 2 }],
      sell: [{ label: ">= $600", merchants: 0 }, { label: ">= $400", merchants: 1 }, { label: ">= $200", merchants: 2 }, { label: ">= $100", merchants: 2 }, { label: "< $100", merchants: 2 }],
    }
  },
  {
    code: "EC", name: "Equador", currency: "USD", flag: "🇪🇨",
    alert_threshold_minutes: 30,
    volume_today: 41000, volume_yesterday: 39500, volume_month: 730000, volume_projected: 1095000,
    volume_same_day_last_month: 38000,
    new_users_today: 11, new_users_month: 124, active_users: 510,
    merchants_online: 4, merchants_offline: 7,
    unaccepted_orders_today: 4,
    orders_today: 26, orders_month: 520, avg_order_value: 1577,
    avg_order_time_minutes: 16,
    pending_old_orders: 2,
    liquidity: {
      max_buy: 900, max_sell: 2800,
      buy: [{ label: ">= $600", merchants: 1 }, { label: ">= $400", merchants: 2 }, { label: ">= $200", merchants: 3 }, { label: ">= $100", merchants: 4 }, { label: "< $100", merchants: 4 }],
      sell: [{ label: ">= $600", merchants: 3 }, { label: ">= $400", merchants: 4 }, { label: ">= $200", merchants: 4 }, { label: ">= $100", merchants: 4 }, { label: "< $100", merchants: 4 }],
    }
  },
];

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function getStatus(today, yesterday) {
  const pct = ((today - yesterday) / yesterday) * 100;
  if (pct >= 0) return "green";
  if (pct >= -10) return "yellow";
  return "red";
}

function getPct(today, yesterday) {
  return ((today - yesterday) / yesterday) * 100;
}

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function fmtTime(t) {
  return new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG = {
  green:  { bg: "#0d2b1a", border: "#16a34a", badge: "#16a34a", text: "#4ade80" },
  yellow: { bg: "#2b2200", border: "#ca8a04", badge: "#ca8a04", text: "#fbbf24" },
  red:    { bg: "#2b0a0a", border: "#dc2626", badge: "#dc2626", text: "#f87171" },
};

const STATUS_ORDER = { green: 0, yellow: 1, red: 2 };

// ── Ranking bar ──────────────────────────────────────────────────────────────
function RankingBar({ countries, onSelect }) {
  const sorted = [...countries].sort((a, b) => {
    const sa = STATUS_ORDER[getStatus(a.volume_today, a.volume_yesterday)];
    const sb = STATUS_ORDER[getStatus(b.volume_today, b.volume_yesterday)];
    if (sa !== sb) return sa - sb;
    return getPct(b.volume_today, b.volume_yesterday) - getPct(a.volume_today, a.volume_yesterday);
  });

  const COLOR = { green: "#16a34a", yellow: "#ca8a04", red: "#dc2626" };
  const BG    = { green: "#0d2b1a", yellow: "#2b2200", red: "#2b0a0a" };

  let lastStatus = null;

  return (
    <div style={{
      background: "#090f1f",
      borderBottom: "1px solid #1e293b",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      gap: 5,
      overflowX: "auto",
    }}>
      <span style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap", marginRight: 6, fontFamily: "IBM Plex Mono, monospace" }}>
        Ranking
      </span>
      {sorted.map((c) => {
        const status = getStatus(c.volume_today, c.volume_yesterday);
        const pct = getPct(c.volume_today, c.volume_yesterday);
        const col = COLOR[status];
        const bg  = BG[status];
        const showDivider = lastStatus !== null && lastStatus !== status;
        lastStatus = status;
        return (
          <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {showDivider && <div style={{ width: 1, height: 22, background: "#1e293b", margin: "0 4px" }} />}
            <button
              onClick={() => onSelect(c)}
              title={`${c.name}: ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
              style={{
                background: bg,
                border: `1px solid ${col}`,
                borderRadius: 6,
                padding: "3px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <span style={{ fontSize: 12 }}>{c.flag}</span>
              <span style={{ color: col, fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{c.code}</span>
              <span style={{ color: col, fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}>
                {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Liquidity slider ─────────────────────────────────────────────────────────
function LiquiditySlider({ maxBuy, maxSell }) {
  const total = maxBuy + maxSell;
  const buyPct = total > 0 ? (maxBuy / total) * 100 : 50;

  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{fmt(maxBuy)}</div>
          <div style={{ color: "#8098b4", fontSize: 10, marginTop: 1 }}>Max Buy</div>
        </div>
        <div style={{ textAlign: "center", alignSelf: "center" }}>
          <div style={{ color: "#94a3b8", fontSize: 10 }}>Liquidez disponível</div>
          <div style={{ color: "#64748b", fontSize: 10 }}>{buyPct.toFixed(0)}% buy · {(100 - buyPct).toFixed(0)}% sell</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{fmt(maxSell)}</div>
          <div style={{ color: "#8098b4", fontSize: 10, marginTop: 1 }}>Max Sell</div>
        </div>
      </div>

      {/* Track */}
      <div style={{ position: "relative", height: 12, borderRadius: 999 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999,
          background: "linear-gradient(to right, #15803d, #4ade80 28%, #cbd5e1 50%, #60a5fa 72%, #1d4ed8)",
        }} />
        {/* Marker */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: `${buyPct}%`,
          transform: "translate(-50%, -50%)",
          width: 18, height: 18,
          borderRadius: "50%",
          background: "#0b1120",
          border: "2.5px solid #e2e8f0",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.12)",
          zIndex: 2,
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ color: "#4ade80", fontSize: 10 }}>Buy ←</span>
        <span style={{ color: "#60a5fa", fontSize: 10 }}>→ Sell</span>
      </div>
    </div>
  );
}

// ── Avg order time bar ────────────────────────────────────────────────────────
function OrderTimeBar({ minutes, threshold }) {
  const MAX = Math.max(threshold * 2, 60);
  const pct = Math.min((minutes / MAX) * 100, 100);
  const color = minutes <= threshold * 0.5 ? "#4ade80" : minutes <= threshold ? "#fbbf24" : "#f87171";
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Tempo médio por pedido</span>
        <span style={{ color, fontSize: 13, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{minutes} min</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
        <span style={{ color: "#64748b", fontSize: 10 }}>alerta em {threshold} min</span>
      </div>
    </div>
  );
}

// ── MoM badge ────────────────────────────────────────────────────────────────
function MoMBadge({ today, sameDayLastMonth }) {
  if (sameDayLastMonth === null || sameDayLastMonth === undefined) {
    return <span style={{ color: "#8098b4", fontSize: 14, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>—</span>;
  }
  const pct = ((today - sameDayLastMonth) / sameDayLastMonth) * 100;
  const color = pct >= 0 ? "#4ade80" : "#f87171";
  return (
    <span style={{ color, fontSize: 14, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ── Mini bar ──────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 2, height: 4, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── Country card ──────────────────────────────────────────────────────────────
function CountryCard({ c, onClick }) {
  const status = getStatus(c.volume_today, c.volume_yesterday);
  const pct = getPct(c.volume_today, c.volume_yesterday);
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      onClick={() => onClick(c)}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 12,
        padding: "16px",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.border}44`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>{c.flag}</span>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>{c.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>{c.currency}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ background: cfg.badge, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
          </span>
          {c.pending_old_orders > 0 && (
            <span style={{ background: "#7c2d12", color: "#fed7aa", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>
              ⏱ {c.pending_old_orders} pedidos antigos
            </span>
          )}
          {c.unaccepted_orders_today > 10 && (
            <span style={{ background: "#450a0a", color: "#fca5a5", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>
              ⚠ {c.unaccepted_orders_today} não aceitos
            </span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Vol. Hoje</span>
          <span style={{ color: cfg.text, fontSize: 15, fontWeight: 700 }}>{fmt(c.volume_today)}</span>
        </div>
        <MiniBar value={c.volume_today} max={c.volume_yesterday * 1.2} color={cfg.badge} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ color: "#8098b4", fontSize: 10 }}>Ontem: {fmt(c.volume_yesterday)}</span>
          <span style={{ color: "#8098b4", fontSize: 10 }}>Mês: {fmt(c.volume_month)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Stat label="Projeção Mês" value={fmt(c.volume_projected)} />
        <Stat label="Merchants Online" value={`${c.merchants_online}/${c.merchants_online + c.merchants_offline}`} alert={c.merchants_online < 3} />
        <Stat label="Novos Users/mês" value={c.new_users_month.toLocaleString()} />
        <Stat label="Novos Users/dia" value={c.new_users_today} />
        <Stat label="Max Liq. Buy" value={fmt(c.liquidity.max_buy)} />
        <Stat label="Max Liq. Sell" value={fmt(c.liquidity.max_sell)} />
        <Stat label="Não aceitos" value={c.unaccepted_orders_today} alert={c.unaccepted_orders_today > 10} />
        <Stat label="Pedidos hoje" value={c.orders_today} />
      </div>

      <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#94a3b8", fontSize: 10 }}>Alerta pedidos:</span>
        <span style={{ color: "#94a3b8", fontSize: 10 }}>{c.alert_threshold_minutes} min</span>
      </div>
    </div>
  );
}

function Stat({ label, value, alert }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 8px" }}>
      <div style={{ color: "#8098b4", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
      <div style={{ color: alert ? "#f87171" : "#cbd5e1", fontSize: 12, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ── Liquidity detail section ──────────────────────────────────────────────────
function LiquiditySection({ data }) {
  return (
    <div>
      <LiquiditySlider maxBuy={data.max_buy} maxSell={data.max_sell} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {["buy", "sell"].map(side => (
          <div key={side}>
            <div style={{ color: side === "buy" ? "#4ade80" : "#60a5fa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {side === "buy" ? "💰 Buy Liquidity" : "💸 Sell Liquidity"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data[side].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "#0f172a", borderRadius: 6, padding: "5px 10px" }}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{row.label}</span>
                  <span style={{ color: row.merchants > 0 ? "#e2e8f0" : "#94a3b8", fontSize: 11, fontWeight: 600 }}>
                    {row.merchants} merchant{row.merchants !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ country, onClose, onThresholdChange }) {
  const [threshold, setThreshold] = useState(country.alert_threshold_minutes);
  const pct = getPct(country.volume_today, country.volume_yesterday);
  const mPct = ((country.volume_projected - country.volume_month) / country.volume_month) * 100;

  const handleThreshold = (v) => {
    setThreshold(v);
    onThresholdChange(country.code, v);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#0b1120",
        border: "1px solid #1e293b",
        borderRadius: 16,
        width: "100%",
        maxWidth: 680,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 28,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>{country.flag}</span>
            <div>
              <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{country.name}</div>
              <div style={{ color: "#8098b4", fontSize: 12 }}>{country.currency} · Detalhes do país</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#1e293b", border: "none", color: "#94a3b8", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Volume */}
        <Section title="📊 Volume">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            <MetricBox label="Hoje" value={fmt(country.volume_today)} sub={`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs ontem`} color={pct >= 0 ? "#4ade80" : "#f87171"} />
            <MetricBox label="Ontem" value={fmt(country.volume_yesterday)} />
            <MetricBox label="Mês atual" value={fmt(country.volume_month)} />
            <MetricBox label="Projeção mês" value={fmt(country.volume_projected)} sub={`+${mPct.toFixed(0)}% estimado`} color="#60a5fa" />
          </div>
          <div style={{ marginTop: 10, background: "#0f172a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>vs mesmo dia mês anterior</div>
              <div style={{ color: "#64748b", fontSize: 11 }}>
                {country.volume_same_day_last_month ? `ref: ${fmt(country.volume_same_day_last_month)}` : "sem dado disponível"}
              </div>
            </div>
            <MoMBadge today={country.volume_today} sameDayLastMonth={country.volume_same_day_last_month} />
          </div>
        </Section>

        {/* Orders */}
        <Section title="📦 Pedidos">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
            <MetricBox label="Pedidos hoje" value={country.orders_today} />
            <MetricBox label="Pedidos no mês" value={country.orders_month} />
            <MetricBox label="Ticket médio" value={fmt(country.avg_order_value)} />
            <MetricBox label="Não aceitos hoje" value={country.unaccepted_orders_today} color={country.unaccepted_orders_today > 10 ? "#f87171" : undefined} />
            <MetricBox label="Pedidos antigos" value={country.pending_old_orders} color={country.pending_old_orders > 0 ? "#fb923c" : undefined} sub={`> ${threshold} min`} />
          </div>
          <OrderTimeBar minutes={country.avg_order_time_minutes} threshold={threshold} />
        </Section>

        {/* Users */}
        <Section title="👤 Usuários">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <MetricBox label="Novos hoje" value={country.new_users_today} />
            <MetricBox label="Novos no mês" value={country.new_users_month} />
            <MetricBox label="Usuários ativos" value={country.active_users.toLocaleString()} sub="meses anteriores" />
          </div>
        </Section>

        {/* Merchants + Liquidity */}
        <Section title="🏪 Merchants & Liquidez">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
            <MetricBox label="Online" value={country.merchants_online} color="#4ade80" />
            <MetricBox label="Offline" value={country.merchants_offline} color="#f87171" />
          </div>
          <LiquiditySection data={country.liquidity} />
        </Section>

        {/* Alert settings */}
        <Section title="⚙️ Configurações de Alerta">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>Alerta pedidos com mais de</span>
            <input
              type="number"
              value={threshold}
              onChange={e => handleThreshold(Number(e.target.value))}
              style={{ background: "#1e293b", border: "1px solid #1e293b", color: "#f1f5f9", borderRadius: 6, padding: "4px 8px", width: 70, fontFamily: "inherit", fontSize: 13 }}
            />
            <span style={{ color: "#94a3b8", fontSize: 12 }}>minutos sem resposta</span>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ color: "#8098b4", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, borderBottom: "1px solid #1e293b", paddingBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MetricBox({ label, value, sub, color }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ color: "#8098b4", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ color: color || "#e2e8f0", fontSize: 16, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: color || "#94a3b8", fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [countries, setCountries] = useState(MOCK_COUNTRIES);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS);
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // → substituir aqui pelo fetch real da API
      setLastUpdate(Date.now());
      setCountdown(REFRESH_INTERVAL_MS);
      setRefreshing(false);
    }, 600);
  }, []);

  useEffect(() => {
    const interval = setInterval(doRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [doRefresh]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1000)), 1000);
    return () => clearInterval(tick);
  }, [lastUpdate]);

  const mins = Math.floor(countdown / 60000);
  const secs = Math.floor((countdown % 60000) / 1000);
  const nextIn = `${mins}:${String(secs).padStart(2, "0")}`;

  const summary = {
    green:  countries.filter(c => getStatus(c.volume_today, c.volume_yesterday) === "green").length,
    yellow: countries.filter(c => getStatus(c.volume_today, c.volume_yesterday) === "yellow").length,
    red:    countries.filter(c => getStatus(c.volume_today, c.volume_yesterday) === "red").length,
  };

  const filtered = countries
    .filter(c => filter === "all" || getStatus(c.volume_today, c.volume_yesterday) === filter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const handleThreshold = (code, val) =>
    setCountries(cs => cs.map(c => c.code === code ? { ...c, alert_threshold_minutes: val } : c));

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#060c18", color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif", padding: "0 0 40px" }}>

        {/* Header */}
        <div style={{ background: "#090f1f", borderBottom: "1px solid #1e293b", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>🌎 Country Monitor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "IBM Plex Mono, monospace" }}>
                Atualizado às {fmtTime(lastUpdate)}
              </span>
              <span style={{ color: "#1e293b" }}>·</span>
              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "IBM Plex Mono, monospace" }}>
                próxima em {nextIn}
              </span>
              <button
                onClick={doRefresh}
                style={{ background: "transparent", border: "1px solid #1e293b", color: "#64748b", borderRadius: 6, padding: "1px 8px", fontSize: 11, cursor: "pointer", fontFamily: "IBM Plex Mono, monospace", transition: "color 0.15s, border-color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#334155"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#1e293b"; }}
              >
                {refreshing ? "⟳ atualizando…" : "↻ atualizar"}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["all", "Todos", "#94a3b8"], ["green", `✅ ${summary.green}`, "#16a34a"], ["yellow", `⚠️ ${summary.yellow}`, "#ca8a04"], ["red", `🔴 ${summary.red}`, "#dc2626"]].map(([k, l, col]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                background: filter === k ? col + "22" : "transparent",
                border: `1px solid ${filter === k ? col : "#1e293b"}`,
                color: filter === k ? col : "#64748b",
                borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer",
                fontFamily: "Space Grotesk, sans-serif", fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Ranking bar */}
        <RankingBar countries={countries} onSelect={setSelected} />

        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: 20 }}>
            <input
              placeholder="🔍  Buscar país..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", borderRadius: 10, padding: "10px 16px", fontSize: 13, width: "100%", maxWidth: 320, fontFamily: "Space Grotesk, sans-serif", outline: "none" }}
            />
          </div>

          {/* Summary totals */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Vol. Total Hoje", value: fmt(countries.reduce((s, c) => s + c.volume_today, 0)) },
              { label: "Total Pedidos Hoje", value: countries.reduce((s, c) => s + c.orders_today, 0) },
              { label: "Merchants Online", value: countries.reduce((s, c) => s + c.merchants_online, 0) },
              { label: "Novos Users Hoje", value: countries.reduce((s, c) => s + c.new_users_today, 0) },
              { label: "Pedidos não aceitos", value: countries.reduce((s, c) => s + c.unaccepted_orders_today, 0) },
            ].map((s, i) => (
              <div key={i} style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 16px", minWidth: 140 }}>
                <div style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(c => (
              <CountryCard key={c.code} c={c} onClick={setSelected} />
            ))}
          </div>
        </div>

        {selected && (
          <DetailModal
            country={countries.find(c => c.code === selected.code)}
            onClose={() => setSelected(null)}
            onThresholdChange={handleThreshold}
          />
        )}
      </div>
    </>
  );
}
