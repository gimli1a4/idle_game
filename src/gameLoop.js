import { GENERATORS } from "./constants.js";
import { state, getEffectiveStat, addEvent } from "./state.js";

// ── Drone tick ────────────────────────────────────────────────────────────────

function rollCycle(droneKey) {
  const gen     = GENERATORS[droneKey];
  const count   = state.drones[droneKey];
  const pSucc   = getEffectiveStat(droneKey, "success");
  const pCrit   = getEffectiveStat(droneKey, "crit");
  const yMult   = getEffectiveStat(droneKey, "yield");
  const totals  = {};
  let crits     = 0;

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    if (roll >= pSucc) continue;               // failed harvest

    const isCrit = Math.random() < pCrit;
    if (isCrit) crits++;

    const mult = isCrit ? yMult * gen.critMult : yMult;

    for (const [res, [min, max]] of Object.entries(gen.yield)) {
      const base   = min + Math.floor(Math.random() * (max - min + 1));
      const amount = Math.floor(base * mult);
      totals[res]  = (totals[res] ?? 0) + amount;
    }
  }

  return { totals, crits };
}

export function tick() {
  state.tick++;

  for (const [droneKey, gen] of Object.entries(GENERATORS)) {
    if (state.drones[droneKey] <= 0) continue;

    state.timers[droneKey]--;
    state._dirty.drones = true;

    if (state.timers[droneKey] > 0) continue;

    // Cycle complete — reset timer and harvest
    state.timers[droneKey] = Math.round(getEffectiveStat(droneKey, "cycle"));

    const { totals, crits } = rollCycle(droneKey);
    const total = Object.values(totals).reduce((a, b) => a + b, 0);

    if (total > 0) {
      for (const [res, amt] of Object.entries(totals)) {
        state.resources[res] += amt;
      }
      state._dirty.resources = true;

      const resStr   = Object.entries(totals).map(([r, a]) => `+${a} ${r}`).join(", ");
      const critStr  = crits > 0 ? ` [${crits}× CRIT!]` : "";
      addEvent(`${gen.name}: ${resStr}${critStr}`, crits > 0 ? "crit" : "harvest");
    } else {
      addEvent(`${gen.name}: no yield this cycle`, "miss");
    }
  }
}

// ── Loop management ───────────────────────────────────────────────────────────

let _id = null;

export function startLoop(onTick) {
  if (_id !== null) return;
  _id = setInterval(() => { tick(); onTick(); }, 1000);
}

export function stopLoop() {
  if (_id !== null) { clearInterval(_id); _id = null; }
}
