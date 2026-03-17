import { GENERATORS, MODULES } from "./constants.js";
import { state, getEffectiveStat, canAfford, deductCost, addEvent } from "./state.js";

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
    if (Math.random() >= pSucc) continue;

    const isCrit = Math.random() < pCrit;
    if (isCrit) crits++;

    const mult = isCrit ? yMult * gen.critMult : yMult;
    for (const [res, [min, max]] of Object.entries(gen.yield)) {
      const base   = min + Math.floor(Math.random() * (max - min + 1));
      totals[res]  = (totals[res] ?? 0) + Math.floor(base * mult);
    }
  }

  return { totals, crits };
}

function tickDrones() {
  for (const [droneKey, gen] of Object.entries(GENERATORS)) {
    if (state.drones[droneKey] <= 0) continue;

    state.timers[droneKey]--;
    state._dirty.drones = true;

    if (state.timers[droneKey] > 0) continue;

    state.timers[droneKey] = Math.round(getEffectiveStat(droneKey, "cycle"));

    const { totals, crits } = rollCycle(droneKey);
    const total = Object.values(totals).reduce((a, b) => a + b, 0);

    if (total > 0) {
      for (const [res, amt] of Object.entries(totals)) state.resources[res] += amt;
      state._dirty.resources = true;
      const resStr  = Object.entries(totals).map(([r, a]) => `+${a} ${r}`).join(", ");
      const critStr = crits > 0 ? ` [${crits}× CRIT!]` : "";
      addEvent(`${gen.name}: ${resStr}${critStr}`, crits > 0 ? "crit" : "harvest");
    } else {
      addEvent(`${gen.name}: no yield`, "miss");
    }
  }
}

// ── Module tick ───────────────────────────────────────────────────────────────

function tickModules() {
  for (const [modKey, modDef] of Object.entries(MODULES)) {
    const mod = state.modules[modKey];
    if (mod.tier === 0) continue;

    const tierDef = modDef.tiers[mod.tier - 1];

    if (mod.running) {
      mod.timer--;
      state._dirty.modules = true;

      if (mod.timer <= 0) {
        // Cycle complete — produce output
        state.resources[modDef.output] = (state.resources[modDef.output] ?? 0) + tierDef.outputQty;
        state._dirty.resources = true;
        addEvent(`${modDef.name}: +${tierDef.outputQty} ${modDef.output}`, "harvest");
        mod.running = false;
        mod.timer   = 0;
      }
    }

    if (!mod.running) {
      // Attempt to start next cycle (inputs consumed at cycle start per spec)
      if (canAfford(tierDef.inputs)) {
        deductCost(tierDef.inputs);
        mod.running = true;
        mod.stalled = false;
        mod.timer   = tierDef.cycleTime;
        state._dirty.modules = true;
      } else {
        if (!mod.stalled) {
          mod.stalled = true;
          state._dirty.modules = true;
          addEvent(`${modDef.name}: stalled — insufficient inputs`, "miss");
        }
      }
    }
  }
}

// ── Loop management ───────────────────────────────────────────────────────────

export function tick() {
  state.tick++;
  tickDrones();
  tickModules();
}

let _id = null;

export function startLoop(onTick) {
  if (_id !== null) return;
  _id = setInterval(() => { tick(); onTick(); }, 1000);
}

export function stopLoop() {
  if (_id !== null) { clearInterval(_id); _id = null; }
}
