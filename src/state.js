import { GENERATORS, UPGRADE_EFFECTS, UPGRADE_BASE_COST, MODULES } from "./constants.js";

// ── Initial state factories ───────────────────────────────────────────────────

function makeResources() {
  return {
    iron: 0, nickel: 0, silicon: 0, carbon: 0, ice: 0,
    steel: 0, alloy: 0, refinedSilicon: 0, fuelCells: 0, circuits: 0, coolant: 0,
  };
}

function makeDrones() {
  return Object.fromEntries(Object.keys(GENERATORS).map(k => [k, 0]));
}

function makeUpgrades() {
  return Object.fromEntries(
    Object.keys(GENERATORS).map(k => [k, { success: 0, crit: 0, yield: 0, cycle: 0 }])
  );
}

function makeTimers() {
  return Object.fromEntries(
    Object.entries(GENERATORS).map(([k, g]) => [k, g.cycle])
  );
}

function makeModules() {
  return Object.fromEntries(
    Object.keys(MODULES).map(k => [k, {
      tier:    0,       // 0 = locked, 1–3 = active tier
      running: false,
      stalled: false,
      timer:   0,       // seconds remaining in current cycle
    }])
  );
}

// ── Global state ──────────────────────────────────────────────────────────────

export const state = {
  resources:   makeResources(),
  drones:      makeDrones(),
  upgrades:    makeUpgrades(),
  timers:      makeTimers(),
  modules:     makeModules(),
  eventLog:    [],
  colorScheme: "green",
  tick:        0,
  startTime:   Date.now(),
  _dirty: { resources: true, events: true, drones: true, modules: true },
};

// Starter cache from the ship's emergency reserves
state.resources.iron   = 25;
state.resources.nickel = 15;

// ── Derived getters ───────────────────────────────────────────────────────────

export function getEffectiveStat(droneKey, stat) {
  const gen = GENERATORS[droneKey];
  const ups = state.upgrades[droneKey];
  switch (stat) {
    case "success": return Math.min(0.99, gen.success + ups.success * UPGRADE_EFFECTS.success.delta);
    case "crit":    return Math.min(0.99, gen.crit    + ups.crit    * UPGRADE_EFFECTS.crit.delta);
    case "yield":   return 1 + ups.yield * UPGRADE_EFFECTS.yield.delta;
    case "cycle":   return Math.max(3,    gen.cycle   + ups.cycle   * UPGRADE_EFFECTS.cycle.delta);
    default: return null;
  }
}

// ── Upgrade cost ──────────────────────────────────────────────────────────────

export function getUpgradeCost(droneKey, stat) {
  const level = state.upgrades[droneKey][stat];
  const factor = Math.ceil(Math.pow(1.8, level));
  return Object.fromEntries(
    Object.entries(UPGRADE_BASE_COST[stat]).map(([r, a]) => [r, a * factor])
  );
}

// ── Resource helpers ──────────────────────────────────────────────────────────

export function canAfford(costMap) {
  return Object.entries(costMap).every(([r, a]) => (state.resources[r] ?? 0) >= a);
}

export function deductCost(costMap) {
  for (const [r, a] of Object.entries(costMap)) state.resources[r] -= a;
  state._dirty.resources = true;
}

export function formatCost(costMap) {
  return Object.entries(costMap).map(([r, a]) => `${a} ${r}`).join(", ");
}

// ── Event log ─────────────────────────────────────────────────────────────────

export function formatUptime(ms = Date.now() - state.startTime) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function addEvent(message, type = "system") {
  state.eventLog.unshift({ time: formatUptime(), message, type });
  if (state.eventLog.length > 200) state.eventLog.pop();
  state._dirty.events = true;
}
