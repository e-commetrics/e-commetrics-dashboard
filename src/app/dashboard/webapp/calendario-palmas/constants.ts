

export const API_BASE_URL = "https://palmasrecovery.com";

// ── interfaces ────────────────────────────────────────────────────────────────

export const ROOM_NAMES: Record<string, string> = {
  shared: "Shared Room",
  private: "Private Room",
  "large-private": "Large Private Room",
  vip: "VIP Suite",
};

export const ROOM_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  private:       { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", dot: "#3b82f6" },
  shared:        { bg: "rgba(16,185,129,0.1)",  color: "#10b981", dot: "#10b981" },
  "large-private": { bg: "rgba(168,85,247,0.1)", color: "#a855f7", dot: "#a855f7" },
  vip:           { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", dot: "#f59e0b" },
};

export const DEFAULT_ROOM_COLOR = { bg: "rgba(100,116,139,0.1)", color: "#94a3b8", dot: "#94a3b8" };

export const ROOM_PRICES: Record<string, number> = {
  shared: 170,
  private: 180,
  "large-private": 200,
  vip: 250,
};

export const EXTRA_NAMES: Record<string, string> = {
  lymphatic: "Lymphatic Massage",
  "5massages": "5 Lymphatic Massages Package",
  b01g: "Original Recovery Bra B01G",
  fvom: "Open Bust Vest FVOM",
  sfbhrs: "Reinforced Girdle SFBHRS",
  sfbhs2: "Girdle High-Back SFBHS2",
};

export const EXTRA_PRICES: Record<string, number> = {
  lymphatic: 60,
  "5massages": 270,
  b01g: 80,
  fvom: 80,
  sfbhrs: 140,
  sfbhs2: 140,
};
