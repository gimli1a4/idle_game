import { GENERATORS, UPGRADE_EFFECTS, COLOR_SCHEMES, MODULES } from "./constants.js";
import { state, canAfford, deductCost, formatCost, getEffectiveStat, getUpgradeCost, addEvent, formatUptime } from "./state.js";

// ── Command registry ──────────────────────────────────────────────────────────
//
// Each command: { description, usage, exec(args, print) }
// print(text, type?) — type: "text"|"success"|"error"|"hint"|"head"|"blank"

export const COMMANDS = {

  help: {
    description: "List all commands, or get help for a specific one",
    usage: "help [command]",
    exec(args, print) {
      if (args[0]) {
        const cmd = COMMANDS[args[0]];
        if (!cmd) { print(`Unknown command: ${args[0]}`, "error"); return; }
        print(`${args[0]}`, "head");
        print(`  ${cmd.description}`);
        print(`  Usage: ${cmd.usage}`, "hint");
        return;
      }
      print("AVAILABLE COMMANDS", "head");
      for (const [name, cmd] of Object.entries(COMMANDS)) {
        print(`  ${name.padEnd(14)} ${cmd.description}`, "text");
      }
      print("", "blank");
      print("  Tab to autocomplete  ↑↓ to browse history  Ctrl+L to clear", "hint");
    },
  },

  status: {
    description: "Show system uptime and all active drone stats",
    usage: "status",
    exec(_, print) {
      const elapsed = Date.now() - state.startTime;
      print("SYSTEM STATUS", "head");
      print(`  Uptime: ${formatUptime(elapsed)}   Tick: #${state.tick}`);
      print("");
      let any = false;
      for (const [key, gen] of Object.entries(GENERATORS)) {
        const n = state.drones[key];
        if (n === 0) continue;
        any = true;
        const succ  = (getEffectiveStat(key, "success") * 100).toFixed(0);
        const crit  = (getEffectiveStat(key, "crit") * 100).toFixed(0);
        const cycle = getEffectiveStat(key, "cycle");
        const timer = state.timers[key];
        const ups   = state.upgrades[key];
        print(`  ${gen.name} ×${n}`, "success");
        print(`    cycle: ${cycle}s (next: ${timer}s)  success: ${succ}%  crit: ${crit}%`);
        print(`    upgrades — success Lv${ups.success}  crit Lv${ups.crit}  yield Lv${ups.yield}  cycle Lv${ups.cycle}`, "hint");
      }
      if (!any) print("  No active drones. Use 'build' to fabricate.", "hint");
    },
  },

  resources: {
    description: "Show all resource stockpiles",
    usage: "resources [tier]",
    exec(args, print) {
      const ALL = {
        raw:     { label: "RAW MATERIALS", keys: ["iron","nickel","silicon","carbon","ice"] },
        refined: { label: "REFINED",       keys: ["steel","alloy","refinedSilicon","fuelCells","circuits","coolant"] },
      };
      const NAMES = {
        iron:"Iron Ore", nickel:"Nickel Ore", silicon:"Silicon", carbon:"Carbon", ice:"Ice",
        steel:"Steel", alloy:"Composite Alloy", refinedSilicon:"Refined Silicon",
        fuelCells:"Fuel Cells", circuits:"Circuits", coolant:"Coolant",
      };
      const tiers = args[0] ? { [args[0]]: ALL[args[0]] } : ALL;
      if (args[0] && !ALL[args[0]]) { print(`Unknown tier: ${args[0]}. Options: raw, refined`, "error"); return; }
      let any = false;
      for (const [, { label, keys }] of Object.entries(tiers)) {
        const items = keys.filter(k => state.resources[k] > 0);
        if (!items.length) continue;
        if (any) print("", "blank");
        any = true;
        print(label, "head");
        for (const k of items) {
          const n = Math.floor(state.resources[k]).toLocaleString();
          print(`  ${(NAMES[k] ?? k).padEnd(22)} ${n}`);
        }
      }
      if (!any) print("  Stockpile is empty.", "hint");
    },
  },

  build: {
    description: "Fabricate a drone (run without args to list blueprints)",
    usage: "build <drone-type>",
    exec(args, print) {
      if (!args[0]) {
        print("DRONE BLUEPRINTS", "head");
        for (const [, gen] of Object.entries(GENERATORS)) {
          print(`  ${gen.shortName}`, "success");
          print(`    ${gen.description}`);
          print(`    Cost: ${formatCost(gen.cost)}`, "hint");
          print(`    Cycle: ${gen.cycle}s  Success: ${(gen.success*100).toFixed(0)}%  Crit: ${(gen.crit*100).toFixed(0)}%  CritMult: ${gen.critMult}×`, "hint");
        }
        return;
      }
      const entry = Object.entries(GENERATORS).find(([, g]) => g.shortName === args[0]);
      if (!entry) {
        print(`Unknown drone type: "${args[0]}"`, "error");
        print("  Run 'build' to list blueprints.", "hint");
        return;
      }
      const [key, gen] = entry;
      if (!canAfford(gen.cost)) {
        const missing = Object.entries(gen.cost)
          .filter(([r, a]) => (state.resources[r] ?? 0) < a)
          .map(([r, a]) => `${a - Math.floor(state.resources[r] ?? 0)} more ${r}`)
          .join(", ");
        print(`Insufficient resources. Need: ${missing}`, "error");
        print(`  Full cost: ${formatCost(gen.cost)}`, "hint");
        return;
      }
      deductCost(gen.cost);
      state.drones[key]++;
      state._dirty.drones = true;
      addEvent(`Fabricated ${gen.name} — fleet: ${state.drones[key]}×`, "build");
      print(`${gen.name} fabricated.`, "success");
      print(`  Fleet size: ${state.drones[key]}×`);
    },
  },

  upgrade: {
    description: "Upgrade a drone stat (success | crit | yield | cycle)",
    usage: "upgrade <drone-type> <stat>",
    exec(args, print) {
      if (args.length < 2) {
        print("Usage: upgrade <drone-type> <stat>", "hint");
        print("Stats:", "head");
        print("  success  +5% success rate per level");
        print("  crit     +3% crit chance per level");
        print("  yield    +10% yield multiplier per level");
        print("  cycle    -1s cycle time per level (minimum 3s)");
        return;
      }
      const [droneShort, statName] = args;
      const entry = Object.entries(GENERATORS).find(([, g]) => g.shortName === droneShort);
      if (!entry) { print(`Unknown drone: "${droneShort}"`, "error"); return; }
      if (!UPGRADE_EFFECTS[statName]) {
        print(`Unknown stat: "${statName}". Valid: success, crit, yield, cycle`, "error");
        return;
      }
      const [key, gen] = entry;
      const cost = getUpgradeCost(key, statName);
      if (!canAfford(cost)) {
        print(`Insufficient resources. Need: ${formatCost(cost)}`, "error");
        return;
      }
      deductCost(cost);
      const prevLevel = state.upgrades[key][statName];
      state.upgrades[key][statName]++;
      const effect   = UPGRADE_EFFECTS[statName];
      const newLevel = state.upgrades[key][statName];
      addEvent(`Upgraded ${gen.name} ${effect.label} → Lv${newLevel}`, "upgrade");
      print(`${gen.name} — ${effect.label} upgraded to Level ${newLevel}`, "success");
      // Show new effective value
      if (statName === "cycle") {
        print(`  New cycle time: ${getEffectiveStat(key, "cycle")}s`, "hint");
      } else if (statName === "yield") {
        print(`  New yield multiplier: ${getEffectiveStat(key, "yield").toFixed(1)}×`, "hint");
      } else {
        print(`  New ${effect.label}: ${(getEffectiveStat(key, statName) * 100).toFixed(0)}%`, "hint");
      }
      // Show next upgrade cost
      const nextCost = getUpgradeCost(key, statName);
      print(`  Next upgrade (Lv${newLevel + 1}) costs: ${formatCost(nextCost)}`, "hint");
    },
  },

  drones: {
    description: "Show all drone blueprints, owned counts, and upgrade levels",
    usage: "drones",
    exec(_, print) {
      for (const [key, gen] of Object.entries(GENERATORS)) {
        const n   = state.drones[key];
        const ups = state.upgrades[key];
        print(`${gen.name}  [${n} active]`, n > 0 ? "success" : "head");
        print(`  ${gen.description}`);
        print(`  cycle: ${getEffectiveStat(key,"cycle")}s  success: ${(getEffectiveStat(key,"success")*100).toFixed(0)}%  crit: ${(getEffectiveStat(key,"crit")*100).toFixed(0)}%`, "hint");
        print(`  build cost: ${formatCost(gen.cost)}`, "hint");
        print(`  upgrades: success Lv${ups.success}  crit Lv${ups.crit}  yield Lv${ups.yield}  cycle Lv${ups.cycle}`, "hint");
        print("", "blank");
      }
    },
  },

  color: {
    description: "Change terminal color scheme",
    usage: "color <scheme>",
    exec(args, print) {
      if (!args[0]) {
        print("COLOR SCHEMES", "head");
        for (const [id, s] of Object.entries(COLOR_SCHEMES)) {
          const mark = id === state.colorScheme ? "  ◀ active" : "";
          print(`  ${id.padEnd(10)} ${s.name}${mark}`);
        }
        return;
      }
      if (!COLOR_SCHEMES[args[0]]) {
        print(`Unknown scheme: "${args[0]}". Run 'color' to list options.`, "error");
        return;
      }
      state.colorScheme = args[0];
      print(`Color scheme set to ${COLOR_SCHEMES[args[0]].name}`, "success");
    },
  },

  clear: {
    description: "Clear command output history",
    usage: "clear",
    exec(_, print) {
      print("__CLEAR__");
    },
  },

  modules: {
    description: "List all ship modules with status and costs",
    usage: "modules",
    exec(_, print) {
      print("SHIP SYSTEMS", "head");
      for (const [key, modDef] of Object.entries(MODULES)) {
        const mod     = state.modules[key];
        const tierDef = mod.tier > 0 ? modDef.tiers[mod.tier - 1] : null;
        const status  = mod.tier === 0
          ? `LOCKED  unlock: ${formatCost(modDef.unlockCost)}`
          : `T${mod.tier} ${tierDef.label}${mod.stalled ? "  ● STALLED" : ""}`;
        print(`${modDef.name}  [${mod.tier > 0 ? `${mod.tier} active` : "locked"}]`, "success");
        print(`  ${modDef.description}`);
        print(`  ${status}`, mod.stalled ? "error" : "hint");
        if (mod.tier > 0 && mod.tier < 3) {
          const nextTier = modDef.tiers[mod.tier];
          print(`  next tier: ${formatCost(nextTier.upgradeCost)}  → ${nextTier.cycleTime}s cycle, ${nextTier.outputQty}×/cycle`, "hint");
        } else if (mod.tier === 3) {
          print(`  fully optimised`, "hint");
        }
        print("", "blank");
      }
    },
  },

  unlock: {
    description: "Bring a ship module online (one-time cost)",
    usage: "unlock <module>",
    exec(args, print) {
      if (!args[0]) {
        print("MODULE BLUEPRINTS", "head");
        for (const [, modDef] of Object.entries(MODULES)) {
          print(`  ${modDef.shortName}`, "success");
          print(`    ${modDef.description}`);
          print(`    Unlock cost: ${formatCost(modDef.unlockCost)}`, "hint");
          print(`    Output: ${modDef.tiers[0].outputQty}×${modDef.output} every ${modDef.tiers[0].cycleTime}s  Inputs: ${formatCost(modDef.tiers[0].inputs)}`, "hint");
        }
        return;
      }
      const entry = Object.entries(MODULES).find(([, m]) => m.shortName === args[0]);
      if (!entry) { print(`Unknown module: "${args[0]}"`, "error"); return; }
      const [key, modDef] = entry;
      if (state.modules[key].tier > 0) { print(`${modDef.name} is already online.`, "error"); return; }
      if (!canAfford(modDef.unlockCost)) {
        const missing = Object.entries(modDef.unlockCost)
          .filter(([r, a]) => (state.resources[r] ?? 0) < a)
          .map(([r, a]) => `${a - Math.floor(state.resources[r] ?? 0)} more ${r}`)
          .join(", ");
        print(`Insufficient resources. Missing: ${missing}`, "error");
        return;
      }
      deductCost(modDef.unlockCost);
      state.modules[key].tier = 1;
      state._dirty.modules = true;
      addEvent(`${modDef.name} brought online`, "build");
      print(`${modDef.name} is now online (T1).`, "success");
      print(`  Cycle: ${modDef.tiers[0].cycleTime}s  Inputs: ${formatCost(modDef.tiers[0].inputs)}  Output: ${modDef.tiers[0].outputQty}×${modDef.output}`, "hint");
    },
  },

  "tier-up": {
    description: "Upgrade a ship module to the next tier",
    usage: "tier-up <module>",
    exec(args, print) {
      if (!args[0]) { print("Usage: tier-up <module>", "hint"); return; }
      const entry = Object.entries(MODULES).find(([, m]) => m.shortName === args[0]);
      if (!entry) { print(`Unknown module: "${args[0]}"`, "error"); return; }
      const [key, modDef] = entry;
      const mod = state.modules[key];
      if (mod.tier === 0) { print(`${modDef.name} is not yet online. Use 'unlock' first.`, "error"); return; }
      if (mod.tier >= 3)  { print(`${modDef.name} is already fully optimised (T3).`, "error"); return; }
      const cost = modDef.tiers[mod.tier - 1].upgradeCost;
      if (!canAfford(cost)) {
        const missing = Object.entries(cost)
          .filter(([r, a]) => (state.resources[r] ?? 0) < a)
          .map(([r, a]) => `${a - Math.floor(state.resources[r] ?? 0)} more ${r}`)
          .join(", ");
        print(`Insufficient resources. Missing: ${missing}`, "error");
        return;
      }
      deductCost(cost);
      mod.tier++;
      // Reset cycle so new tier starts fresh
      mod.running = false;
      mod.stalled = false;
      mod.timer   = 0;
      state._dirty.modules = true;
      const newTier = modDef.tiers[mod.tier - 1];
      addEvent(`${modDef.name} upgraded to T${mod.tier} ${newTier.label}`, "upgrade");
      print(`${modDef.name} → T${mod.tier} ${newTier.label}`, "success");
      print(`  Cycle: ${newTier.cycleTime}s  Output: ${newTier.outputQty}×${modDef.output}  Inputs: ${formatCost(newTier.inputs)}`, "hint");
    },
  },

};

// ── Tab completion ────────────────────────────────────────────────────────────

export function getCompletions(input) {
  const raw   = input.trimStart();
  const parts = raw.split(/\s+/);

  if (parts.length <= 1) {
    return Object.keys(COMMANDS).filter(c => c.startsWith(parts[0] ?? ""));
  }

  const cmd     = parts[0];
  const partial = parts[parts.length - 1];

  if (parts.length === 2) {
    if (cmd === "build" || cmd === "upgrade") {
      return Object.values(GENERATORS).map(g => g.shortName).filter(s => s.startsWith(partial));
    }
    if (cmd === "unlock" || cmd === "tier-up") {
      return Object.values(MODULES).map(m => m.shortName).filter(s => s.startsWith(partial));
    }
    if (cmd === "color") {
      return Object.keys(COLOR_SCHEMES).filter(s => s.startsWith(partial));
    }
    if (cmd === "help") {
      return Object.keys(COMMANDS).filter(c => c.startsWith(partial));
    }
    if (cmd === "resources") {
      return ["raw","refined"].filter(s => s.startsWith(partial));
    }
  }

  if (parts.length === 3 && cmd === "upgrade") {
    return Object.keys(UPGRADE_EFFECTS).filter(s => s.startsWith(partial));
  }

  return [];
}
