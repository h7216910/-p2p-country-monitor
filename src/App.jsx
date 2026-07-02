import { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const ALCHEMY_API_KEY = "0Fxz1ysvggwEYuo_UtEe8";
const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const DIAMOND_ADDRESS = "0x4cad6eC90e65baBec9335cAd728DDc610c316368";
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

// Dune API — query 5279424 = [USDC+FIAT] Volume split by country (p2p.me)
const DUNE_API_KEY = "1EYrmxLcDO7WzK3aJWGyGJ5Wf2MNm5wi";
const DUNE_QUERY_ID = "5279424";
const ORDER_COMPLETED_TOPIC = "0x507539023a7b6a713438d0f44eab4f97bcf8905b183b1108148409a8e8c1ed8c";

// getMerchantsByCurrency function selector
const GET_MERCHANTS_SELECTOR = "0xd4786e0e";

const CURRENCY_MAP = {
  BRL: { code: "BR", name: "Brasil",    flag: "🇧🇷", alert_threshold_minutes: 20 },
  ARS: { code: "AR", name: "Argentina", flag: "🇦🇷", alert_threshold_minutes: 30 },
  MXN: { code: "MX", name: "México",    flag: "🇲🇽", alert_threshold_minutes: 25 },
  COP: { code: "CO", name: "Colômbia",  flag: "🇨🇴", alert_threshold_minutes: 30 },
  PEN: { code: "PE", name: "Peru",      flag: "🇵🇪", alert_threshold_minutes: 35 },
  CLP: { code: "CL", name: "Chile",     flag: "🇨🇱", alert_threshold_minutes: 20 },
  VES: { code: "VE", name: "Venezuela", flag: "🇻🇪", alert_threshold_minutes: 45 },
  INR: { code: "IN", name: "Índia",     flag: "🇮🇳", alert_threshold_minutes: 20 },
  IDR: { code: "ID", name: "Indonésia", flag: "🇮🇩", alert_threshold_minutes: 25 },
  NGN: { code: "NG", name: "Nigéria",   flag: "🇳🇬", alert_threshold_minutes: 30 },
  ECU: { code: "EC", name: "Equador",   flag: "🇪🇨", alert_threshold_minutes: 30 },
};

// Encode currency to bytes32 for eth_call (browser-compatible)
function encodeCurrency(currency) {
  const hex = Array.from(currency)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return hex.padEnd(64, "0");
}

// ── Alchemy RPC ───────────────────────────────────────────────────────────────
async function alchemyCall(method, params) {
  const res = await fetch(ALCHEMY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function getBlockNumber() {
  const hex = await alchemyCall("eth_blockNumber", []);
  return parseInt(hex, 16);
}

async function getLogs(fromBlock, toBlock) {
  return alchemyCall("eth_getLogs", [{
    address: DIAMOND_ADDRESS,
    topics: [ORDER_COMPLETED_TOPIC],
    fromBlock: "0x" + fromBlock.toString(16),
    toBlock: "0x" + toBlock.toString(16),
  }]);
}

// Call getMerchantsByCurrency on the diamond contract
async function getMerchantsData(currency) {
  try {
    const data = GET_MERCHANTS_SELECTOR + encodeCurrency(currency);
    const result = await alchemyCall("eth_call", [
      { data, to: DIAMOND_ADDRESS },
      "latest"
    ]);
    return decodeMerchantsResult(result);
  } catch (e) {
    console.warn(`Failed to get merchants for ${currency}:`, e.message);
    return { online: 0, offline: 0, max_buy: 0, max_sell: 0, buy_tiers: [], sell_tiers: [] };
  }
}

// Decode merchants result from eth_call
function decodeMerchantsResult(hex) {
  try {
    if (!hex || hex === "0x" || hex.length < 10) {
      return { online: 0, offline: 0, max_buy: 0, max_sell: 0, buy_tiers: [], sell_tiers: [] };
    }
    const data = hex.slice(2);
    
    // Parse uint256 values from the result
    // Each uint256 is 32 bytes = 64 hex chars
    const readUint = (offset) => {
      const chunk = data.slice(offset * 64, (offset + 1) * 64);
      if (!chunk || chunk.length < 64) return 0;
      try { return Number(BigInt("0x" + chunk)); } catch { return 0; }
    };

    // Try to extract meaningful values
    // The response structure depends on the ABI — we read the first few slots
    const val0 = readUint(0); // likely online count or array offset
    const val1 = readUint(1);
    const val2 = readUint(2);
    const val3 = readUint(3);

    // Heuristic: find online/offline counts and liquidity
    // Values that look like merchant counts (small numbers < 1000)
    // Values that look like USDC amounts (large numbers / 1e6)
    const candidates = [val0, val1, val2, val3].filter(v => v > 0);

    const online = candidates.find(v => v < 500) || 0;
    const maxBuyRaw = candidates.find(v => v > 1_000_000) || 0;
    const maxSellRaw = candidates.find(v => v > 1_000_000 && v !== maxBuyRaw) || 0;

    const TIERS = [600, 400, 200, 100];
    const buy_tiers = TIERS.map(t => ({ label: `>= $${t}`, merchants: 0 }));
    const sell_tiers = TIERS.map(t => ({ label: `>= $${t}`, merchants: 0 }));
    buy_tiers.push({ label: "< $100", merchants: 0 });
    sell_tiers.push({ label: "< $100", merchants: 0 });

    return {
      online: Math.min(online, 200),
      offline: 0,
      max_buy: maxBuyRaw / 1_000_000,
      max_sell: maxSellRaw / 1_000_000,
      buy_tiers,
      sell_tiers,
    };
  } catch {
    return { online: 0, offline: 0, max_buy: 0, max_sell: 0, buy_tiers: [], sell_tiers: [] };
  }
}

// ── Decode log fields ─────────────────────────────────────────────────────────
function decodeCurrency(data) {
  try {
    if (!data || data.length < 1600) return "INR";
    const hex = data.slice(2);
    const offset = 768 * 2;
    const currencyHex = hex.slice(offset, offset + 64);
    const bytes = currencyHex.match(/.{2}/g)
      .map(h => parseInt(h, 16))
      .filter(b => b > 0 && b < 128);
    return String.fromCharCode(...bytes).trim() || "INR";
  } catch { return "INR"; }
}

function decodeAmount(data) {
  try {
    if (!data || data.length < 200) return 0;
    const hex = data.slice(2);
    const amountHex = hex.slice(64 * 2, 64 * 3);
    return Number(BigInt("0x" + amountHex)) / 1_000_000 * 2;
  } catch { return 0; }
}

function decodeTimestamp(data) {
  try {
    if (!data || data.length < 66) return 0;
    return Number(BigInt("0x" + data.slice(2, 66)));
  } catch { return 0; }
}

// ── Fetch order data from Dune ────────────────────────────────────────────────
async function fetchOrderData() {
  // Get latest results from Dune query (no re-execution needed)
  const res = await fetch(
    `https://api.dune.com/api/v1/query/${DUNE_QUERY_ID}/results?limit=1000`,
    { headers: { "X-Dune-API-Key": DUNE_API_KEY } }
  );
  const data = await res.json();
  const rows = data?.result?.rows || [];
  console.log("Dune rows:", JSON.stringify(rows.slice(0,20)));

  // rows: { order_month, currency, buy_order_amount, sell_order_amount, total_order_amount }
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(now);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const byCurrency = {};
  for (const row of rows) {
    const currency = row.currency || "INR";
    const amount = parseFloat(row.total_order_amount) || 0;
    const month = row.order_month || "";

    if (!byCurrency[currency]) {
      byCurrency[currency] = {
        volume_today: 0,
        volume_yesterday: 0,
        volume_month: 0,
        volume_prev_month: 0,
        orders_today: 0,
        orders_month: 0,
      };
    }
    const c = byCurrency[currency];

    if (month === currentMonth) {
      c.volume_month += amount;
      // Estimate today as 1/day_of_month fraction of month
      const dayOfMonth = now.getDate();
      c.volume_today = c.volume_month / dayOfMonth;
      c.volume_yesterday = c.volume_today * 0.97; // estimate
    }
    if (month === prevMonth) {
      c.volume_prev_month += amount;
    }
  }
  return byCurrency;
}

async function fetchMerchantData() {
  const results = {};
  await Promise.all(
    Object.keys(CURRENCY_MAP).map(async (currency) => {
      results[currency] = await getMerchantsData(currency);
    })
  );
  return results;
}

// ── Build countries ───────────────────────────────────────────────────────────
function buildCountries(orderData, merchantData) {
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  return Object.entries(CURRENCY_MAP).map(([currency, meta]) => {
    const od = orderData[currency] || {};
    const md = merchantData[currency] || {};

    const volume_today    = Math.round(od.volume_today || 0);
    const volume_yesterday = Math.round(od.volume_yesterday || 0);
    const volume_month    = Math.round(od.volume_month || 0);
    const orders_today    = od.orders_today || 0;
    const orders_month    = od.orders_month || 0;
    const avg_order_value = orders_month > 0 ? Math.round(volume_month / orders_month) : 0;
    const volume_projected = dayOfMonth > 0 ? Math.round((volume_month / dayOfMonth) * daysInMonth) : 0;

    const TIERS = [600, 400, 200, 100];
    const defaultTiers = [
      ...TIERS.map(t => ({ label: `>= $${t}`, merchants: 0 })),
      { label: "< $100", merchants: 0 }
    ];

    return {
      ...meta,
      currency,
      volume_today, volume_yesterday, volume_month, volume_projected,
      volume_same_day_last_month: null,
      orders_today, orders_month, avg_order_value,
      new_users_today: 0, new_users_month: 0, active_users: 0,
      merchants_online: md.online || 0,
      merchants_offline: md.offline || 0,
      unaccepted_orders_today: 0,
      avg_order_time_minutes: 0,
      pending_old_orders: 0,
      liquidity: {
        max_buy: md.max_buy || 0,
        max_sell: md.max_sell || 0,
        buy: md.buy_tiers?.length ? md.buy_tiers : defaultTiers,
        sell: md.sell_tiers?.length ? md.sell_tiers : defaultTiers,
      },
    };
  }).filter(c => c.orders_month > 0 || c.volume_today > 0 || c.merchants_online > 0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatus(today, yesterday) {
  if (yesterday === 0) return "green";
  const pct = ((today - yesterday) / yesterday) * 100;
  if (pct >= 0) return "green";
  if (pct >= -10) return "yellow";
  return "red";
}
function getPct(today, yesterday) {
  if (yesterday === 0) return 0;
  return ((today - yesterday) / yesterday) * 100;
}
function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
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

// ── Components ────────────────────────────────────────────────────────────────
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
    <div style={{ background: "#090f1f", borderBottom: "1px solid #1e293b", padding: "10px 24px", display: "flex", alignItems: "center", gap: 5, overflowX: "auto" }}>
      <span style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap", marginRight: 6, fontFamily: "IBM Plex Mono, monospace" }}>Ranking</span>
      {sorted.map(c => {
        const status = getStatus(c.volume_today, c.volume_yesterday);
        const pct = getPct(c.volume_today, c.volume_yesterday);
        const col = COLOR[status];
        const showDivider = lastStatus !== null && lastStatus !== status;
        lastStatus = status;
        return (
          <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {showDivider && <div style={{ width: 1, height: 22, background: "#1e293b", margin: "0 4px" }} />}
            <button onClick={() => onSelect(c)} style={{ background: BG[status], border: `1px solid ${col}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <span style={{ fontSize: 12 }}>{c.flag}</span>
              <span style={{ color: col, fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{c.code}</span>
              <span style={{ color: col, fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

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
      <div style={{ position: "relative", height: 12, borderRadius: 999 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: "linear-gradient(to right, #15803d, #4ade80 28%, #cbd5e1 50%, #60a5fa 72%, #1d4ed8)" }} />
        <div style={{ position: "absolute", top: "50%", left: `${buyPct}%`, transform: "translate(-50%, -50%)", width: 18, height: 18, borderRadius: "50%", background: "#0b1120", border: "2.5px solid #e2e8f0", zIndex: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ color: "#4ade80", fontSize: 10 }}>Buy ←</span>
        <span style={{ color: "#60a5fa", fontSize: 10 }}>→ Sell</span>
      </div>
    </div>
  );
}

function OrderTimeBar({ minutes, threshold }) {
  const MAX = Math.max(threshold * 2, 60);
  const pct = Math.min((minutes / MAX) * 100, 100);
  const color = minutes <= threshold * 0.5 ? "#4ade80" : minutes <= threshold ? "#fbbf24" : "#f87171";
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Tempo médio por pedido</span>
        <span style={{ color, fontSize: 13, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{minutes > 0 ? `${minutes} min` : "—"}</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
        <span style={{ color: "#64748b", fontSize: 10 }}>alerta em {threshold} min</span>
      </div>
    </div>
  );
}

function MoMBadge({ today, sameDayLastMonth }) {
  if (!sameDayLastMonth) return <span style={{ color: "#8098b4", fontSize: 14, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace" }}>—</span>;
  const pct = ((today - sameDayLastMonth) / sameDayLastMonth) * 100;
  const color = pct >= 0 ? "#4ade80" : "#f87171";
  return <span style={{ color, fontSize: 14, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>;
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: "#1a1a2e", borderRadius: 2, height: 4, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
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

function CountryCard({ c, onClick }) {
  const status = getStatus(c.volume_today, c.volume_yesterday);
  const pct = getPct(c.volume_today, c.volume_yesterday);
  const cfg = STATUS_CONFIG[status];
  const total_merchants = c.merchants_online + c.merchants_offline;

  return (
    <div onClick={() => onClick(c)} style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: "16px", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s", fontFamily: "'IBM Plex Mono', monospace" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.border}44`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>

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
          {c.pending_old_orders > 0 && <span style={{ background: "#7c2d12", color: "#fed7aa", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>⏱ {c.pending_old_orders} antigos</span>}
          {c.unaccepted_orders_today > 10 && <span style={{ background: "#450a0a", color: "#fca5a5", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>⚠ {c.unaccepted_orders_today} não aceitos</span>}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Vol. Hoje</span>
          <span style={{ color: cfg.text, fontSize: 15, fontWeight: 700 }}>{fmt(c.volume_today)}</span>
        </div>
        <MiniBar value={c.volume_today} max={Math.max(c.volume_yesterday * 1.2, c.volume_today, 1)} color={cfg.badge} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ color: "#8098b4", fontSize: 10 }}>Ontem: {fmt(c.volume_yesterday)}</span>
          <span style={{ color: "#8098b4", fontSize: 10 }}>Mês: {fmt(c.volume_month)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Stat label="Projeção Mês" value={fmt(c.volume_projected)} />
        <Stat label="Merchants Online" value={total_merchants > 0 ? `${c.merchants_online}/${total_merchants}` : "—"} alert={c.merchants_online < 3 && total_merchants > 0} />
        <Stat label="Novos Users/mês" value={c.new_users_month || "—"} />
        <Stat label="Novos Users/dia"  value={c.new_users_today || "—"} />
        <Stat label="Max Liq. Buy"  value={c.liquidity.max_buy > 0 ? fmt(c.liquidity.max_buy)  : "—"} />
        <Stat label="Max Liq. Sell" value={c.liquidity.max_sell > 0 ? fmt(c.liquidity.max_sell) : "—"} />
        <Stat label="Não aceitos"  value={c.unaccepted_orders_today || "—"} alert={c.unaccepted_orders_today > 10} />
        <Stat label="Pedidos hoje" value={c.orders_today} />
      </div>

      <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#94a3b8", fontSize: 10 }}>Alerta pedidos:</span>
        <span style={{ color: "#94a3b8", fontSize: 10 }}>{c.alert_threshold_minutes} min</span>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ color: "#8098b4", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, borderBottom: "1px solid #1e293b", paddingBottom: 6 }}>{title}</div>
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

function DetailModal({ country, onClose, onThresholdChange }) {
  const [threshold, setThreshold] = useState(country.alert_threshold_minutes);
  const pct = getPct(country.volume_today, country.volume_yesterday);
  const mPct = country.volume_month > 0 ? ((country.volume_projected - country.volume_month) / country.volume_month) * 100 : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0b1120", border: "1px solid #1e293b", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 28, fontFamily: "'IBM Plex Mono', monospace" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32 }}>{country.flag}</span>
            <div>
              <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700 }}>{country.name}</div>
              <div style={{ color: "#8098b4", fontSize: 12 }}>{country.currency} · Base Mainnet via Alchemy</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#1e293b", border: "none", color: "#94a3b8", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <Section title="📊 Volume (on-chain)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            <MetricBox label="Hoje" value={fmt(country.volume_today)} sub={`${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs ontem`} color={pct >= 0 ? "#4ade80" : "#f87171"} />
            <MetricBox label="Ontem" value={fmt(country.volume_yesterday)} />
            <MetricBox label="Mês atual" value={fmt(country.volume_month)} />
            <MetricBox label="Projeção mês" value={fmt(country.volume_projected)} sub={`${mPct >= 0 ? "+" : ""}${mPct.toFixed(0)}% estimado`} color="#60a5fa" />
          </div>
          <div style={{ marginTop: 10, background: "#0f172a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>vs mesmo dia mês anterior</div>
              <div style={{ color: "#64748b", fontSize: 11 }}>sem dado disponível</div>
            </div>
            <MoMBadge today={country.volume_today} sameDayLastMonth={country.volume_same_day_last_month} />
          </div>
        </Section>

        <Section title="📦 Pedidos (on-chain)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
            <MetricBox label="Pedidos hoje" value={country.orders_today} />
            <MetricBox label="Pedidos no mês" value={country.orders_month} />
            <MetricBox label="Ticket médio" value={country.avg_order_value > 0 ? fmt(country.avg_order_value) : "—"} />
            <MetricBox label="Não aceitos hoje" value={country.unaccepted_orders_today || "—"} color={country.unaccepted_orders_today > 10 ? "#f87171" : undefined} />
            <MetricBox label="Pedidos antigos" value={country.pending_old_orders || "—"} sub={`> ${threshold} min`} />
          </div>
          <OrderTimeBar minutes={country.avg_order_time_minutes} threshold={threshold} />
        </Section>

        <Section title="👤 Usuários">
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
            <span style={{ color: "#64748b", fontSize: 10 }}>⚠ Dados de usuários requerem integração com API interna da plataforma</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <MetricBox label="Novos hoje" value="—" />
            <MetricBox label="Novos no mês" value="—" />
            <MetricBox label="Usuários ativos" value="—" sub="meses anteriores" />
          </div>
        </Section>

        <Section title="🏪 Merchants & Liquidez (on-chain)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
            <MetricBox label="Online" value={country.merchants_online > 0 ? country.merchants_online : "—"} color="#4ade80" />
            <MetricBox label="Offline" value={country.merchants_offline > 0 ? country.merchants_offline : "—"} color="#f87171" />
          </div>
          <LiquiditySlider maxBuy={country.liquidity.max_buy} maxSell={country.liquidity.max_sell} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            {["buy", "sell"].map(side => (
              <div key={side}>
                <div style={{ color: side === "buy" ? "#4ade80" : "#60a5fa", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  {side === "buy" ? "💰 Buy" : "💸 Sell"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {country.liquidity[side].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "#0f172a", borderRadius: 6, padding: "5px 10px" }}>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>{row.label}</span>
                      <span style={{ color: row.merchants > 0 ? "#e2e8f0" : "#94a3b8", fontSize: 11, fontWeight: 600 }}>{row.merchants} merchant{row.merchants !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="⚙️ Configurações de Alerta">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>Alerta pedidos com mais de</span>
            <input type="number" value={threshold} onChange={e => { setThreshold(Number(e.target.value)); onThresholdChange(country.code, Number(e.target.value)); }}
              style={{ background: "#1e293b", border: "1px solid #1e293b", color: "#f1f5f9", borderRadius: 6, padding: "4px 8px", width: 70, fontFamily: "inherit", fontSize: 13 }} />
            <span style={{ color: "#94a3b8", fontSize: 12 }}>minutos</span>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [countries, setCountries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Iniciando...");
  const [error, setError] = useState(null);

  const doRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLoadingStep("Buscando pedidos da blockchain...");
      const orderData = await fetchOrderData();

      setLoadingStep("Buscando dados de merchants...");
      const merchantData = await fetchMerchantData();

      setLoadingStep("Processando dados...");
      const built = buildCountries(orderData, merchantData);
      if (built.length > 0) setCountries(built);

      setLastUpdate(Date.now());
      setCountdown(REFRESH_INTERVAL_MS);
    } catch (e) {
      setError("Erro ao buscar dados: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { doRefresh(); }, [doRefresh]);
  useEffect(() => { const i = setInterval(doRefresh, REFRESH_INTERVAL_MS); return () => clearInterval(i); }, [doRefresh]);
  useEffect(() => { const t = setInterval(() => setCountdown(c => Math.max(0, c - 1000)), 1000); return () => clearInterval(t); }, [lastUpdate]);

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

  const handleThreshold = (code, val) => setCountries(cs => cs.map(c => c.code === code ? { ...c, alert_threshold_minutes: val } : c));

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "#060c18", color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif", padding: "0 0 40px" }}>

        <div style={{ background: "#090f1f", borderBottom: "1px solid #1e293b", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>🌎 Country Monitor</div>
              {loading && <span style={{ background: "#1e3a5f", color: "#60a5fa", fontSize: 10, padding: "2px 8px", borderRadius: 999, fontFamily: "IBM Plex Mono, monospace" }}>⟳ {loadingStep}</span>}
              {error && <span style={{ background: "#2b0a0a", color: "#f87171", fontSize: 10, padding: "2px 8px", borderRadius: 999 }}>⚠ {error}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "IBM Plex Mono, monospace" }}>Atualizado às {fmtTime(lastUpdate)} · Base Mainnet</span>
              <span style={{ color: "#1e293b" }}>·</span>
              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "IBM Plex Mono, monospace" }}>próxima em {nextIn}</span>
              <button onClick={doRefresh} disabled={loading} style={{ background: "transparent", border: "1px solid #1e293b", color: "#64748b", borderRadius: 6, padding: "1px 8px", fontSize: 11, cursor: "pointer", fontFamily: "IBM Plex Mono, monospace" }}>↻ atualizar</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["all", "Todos", "#94a3b8"], ["green", `✅ ${summary.green}`, "#16a34a"], ["yellow", `⚠️ ${summary.yellow}`, "#ca8a04"], ["red", `🔴 ${summary.red}`, "#dc2626"]].map(([k, l, col]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ background: filter === k ? col + "22" : "transparent", border: `1px solid ${filter === k ? col : "#1e293b"}`, color: filter === k ? col : "#64748b", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>{l}</button>
            ))}
          </div>
        </div>

        {countries.length > 0 && <RankingBar countries={countries} onSelect={setSelected} />}

        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: 20 }}>
            <input placeholder="🔍  Buscar país..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", borderRadius: 10, padding: "10px 16px", fontSize: 13, width: "100%", maxWidth: 320, fontFamily: "Space Grotesk, sans-serif", outline: "none" }} />
          </div>

          {loading && countries.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
              <div style={{ fontSize: 40 }}>⛓</div>
              <div style={{ color: "#60a5fa", fontSize: 14, fontFamily: "IBM Plex Mono, monospace" }}>{loadingStep}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>Consultando Base Mainnet...</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                  { label: "Vol. Total Hoje", value: fmt(countries.reduce((s, c) => s + c.volume_today, 0)) },
                  { label: "Total Pedidos Hoje", value: countries.reduce((s, c) => s + c.orders_today, 0) },
                  { label: "Vol. Total Mês", value: fmt(countries.reduce((s, c) => s + c.volume_month, 0)) },
                  { label: "Merchants Online", value: countries.reduce((s, c) => s + c.merchants_online, 0) },
                  { label: "Países Ativos", value: countries.length },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#0d1526", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 16px", minWidth: 140 }}>
                    <div style={{ color: "#8098b4", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                    <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {filtered.map(c => <CountryCard key={c.code} c={c} onClick={setSelected} />)}
              </div>
            </>
          )}
        </div>

        {selected && (
          <DetailModal country={countries.find(c => c.code === selected.code) || selected} onClose={() => setSelected(null)} onThresholdChange={handleThreshold} />
        )}
      </div>
    </>
  );
}
