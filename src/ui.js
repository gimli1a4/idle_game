import { GENERATORS, COLOR_SCHEMES } from "./constants.js";
import { state, getEffectiveStat, formatUptime } from "./state.js";
import { COMMANDS, getCompletions } from "./commands.js";

// ── DOM references ────────────────────────────────────────────────────────────

const el = {};

export function initUI() {
  el.boot        = document.getElementById("tui-boot");
  el.bootOutput  = document.getElementById("boot-output");
  el.header      = document.getElementById("header-uptime");
  el.resources   = document.getElementById("resources-content");
  el.eventlog    = document.getElementById("eventlog-content");
  el.dronebar    = document.getElementById("dronebar-content");
  el.output      = document.getElementById("tui-output");
  el.inputDisplay= document.getElementById("input-display");

  applyColorScheme();
  bindKeys();
}

// ── Color scheme ──────────────────────────────────────────────────────────────

export function applyColorScheme() {
  const scheme = COLOR_SCHEMES[state.colorScheme] ?? COLOR_SCHEMES.green;
  const root   = document.documentElement;
  for (const [prop, val] of Object.entries(scheme)) {
    if (prop.startsWith("--")) root.style.setProperty(prop, val);
  }
}

// ── Input state ───────────────────────────────────────────────────────────────

const input = {
  buffer:      "",
  history:     [],
  historyIdx:  -1,
  savedBuffer: "",
  tabCandidates: [],
  tabIdx:        -1,
};

function bindKeys() {
  document.addEventListener("keydown", (e) => {
    // Ignore keyboard input during boot
    if (!el.boot.classList.contains("hidden")) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        submitCommand();
        break;
      case "Backspace":
        e.preventDefault();
        input.buffer = input.buffer.slice(0, -1);
        resetTab();
        refreshInput();
        break;
      case "Tab":
        e.preventDefault();
        handleTab();
        break;
      case "ArrowUp":
        e.preventDefault();
        historyNav(1);
        break;
      case "ArrowDown":
        e.preventDefault();
        historyNav(-1);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          input.buffer += e.key;
          resetTab();
          refreshInput();
        } else if (e.key === "l" && e.ctrlKey) {
          e.preventDefault();
          el.output.innerHTML = "";
        }
    }
  });
}

function resetTab() {
  input.tabCandidates = [];
  input.tabIdx = -1;
}

function refreshInput() {
  el.inputDisplay.textContent = input.buffer;
}

function historyNav(dir) {
  if (input.history.length === 0) return;
  if (dir === 1) {
    if (input.historyIdx === -1) input.savedBuffer = input.buffer;
    input.historyIdx = Math.min(input.historyIdx + 1, input.history.length - 1);
  } else {
    if (input.historyIdx <= 0) {
      input.historyIdx = -1;
      input.buffer = input.savedBuffer;
      resetTab();
      refreshInput();
      return;
    }
    input.historyIdx--;
  }
  input.buffer = input.history[input.historyIdx];
  resetTab();
  refreshInput();
}

function handleTab() {
  if (input.tabCandidates.length === 0) {
    const candidates = getCompletions(input.buffer);
    if (candidates.length === 0) return;

    if (candidates.length === 1) {
      // Single match: complete and done
      applyCompletion(candidates[0]);
      return;
    }
    // Multiple matches: store and show
    input.tabCandidates = candidates;
    input.tabIdx = 0;
    appendLine(`  ${candidates.join("   ")}`, "hint");
  } else {
    input.tabIdx = (input.tabIdx + 1) % input.tabCandidates.length;
  }
  applyCompletion(input.tabCandidates[input.tabIdx]);
}

function applyCompletion(word) {
  // Replace the last space-separated token with the completion
  const parts = input.buffer.trimStart().split(/\s+/);
  parts[parts.length - 1] = word;
  // If buffer ended with a space, append completion
  if (input.buffer.endsWith(" ")) {
    input.buffer = input.buffer + word;
  } else {
    input.buffer = parts.join(" ");
  }
  refreshInput();
}

function submitCommand() {
  const raw = input.buffer.trim();
  input.buffer = "";
  input.historyIdx = -1;
  input.savedBuffer = "";
  resetTab();
  refreshInput();

  if (!raw) return;

  // Dedup consecutive identical history entries
  if (input.history[0] !== raw) input.history.unshift(raw);
  if (input.history.length > 50) input.history.pop();

  appendLine(`aurora@AURORA-7:~$ ${raw}`, "echo");

  const parts = raw.trim().split(/\s+/);
  const name  = parts[0].toLowerCase();
  const args  = parts.slice(1);
  const cmd   = COMMANDS[name];

  if (!cmd) {
    appendLine(`Command not found: "${name}". Type 'help' for a list.`, "error");
    appendLine("");
    return;
  }

  cmd.exec(args, (text, type = "text") => {
    if (text === "__CLEAR__") {
      el.output.innerHTML = "";
    } else {
      appendLine(text, type);
    }
  });

  appendLine("");

  // Color scheme may have changed — re-apply
  applyColorScheme();
}

// ── Command output ────────────────────────────────────────────────────────────

function appendLine(text, type = "text") {
  const div = document.createElement("div");
  div.className = type === "blank" ? "out-line out-blank" : `out-line out-${type}`;
  if (type === "echo") {
    div.className = "out-line out-echo";
  }
  div.textContent = text;
  el.output.appendChild(div);

  // Keep output bounded to prevent runaway DOM growth
  while (el.output.children.length > 600) {
    el.output.removeChild(el.output.firstChild);
  }
  el.output.scrollTop = el.output.scrollHeight;
}

// ── Panels ────────────────────────────────────────────────────────────────────

const RESOURCE_LABELS = {
  iron:"Iron Ore", nickel:"Nickel Ore", silicon:"Silicon", carbon:"Carbon", ice:"Ice",
  steel:"Steel", alloy:"Composite Alloy", refinedSilicon:"Ref. Silicon",
  fuel:"Fuel Cells", circuits:"Circuits",
  droneCpu:"Drone CPU", sensorArray:"Sensor Array", nanotubes:"Nanotubes",
  fusionBattery:"Fusion Battery", aiCore:"AI Core",
  iridium:"Iridium", antimatterDust:"Antimatter Dust", alienAlloy:"Alien Alloy",
  darkCrystal:"Dark Crystal", neutronium:"Neutronium Frag.",
};

const RESOURCE_TIERS = [
  { label: "RAW",      keys: ["iron","nickel","silicon","carbon","ice"] },
  { label: "REFINED",  keys: ["steel","alloy","refinedSilicon","fuel","circuits"] },
  { label: "ADVANCED", keys: ["droneCpu","sensorArray","nanotubes","fusionBattery","aiCore"] },
  { label: "EXOTIC",   keys: ["iridium","antimatterDust","alienAlloy","darkCrystal","neutronium"] },
];

function renderResources() {
  el.resources.innerHTML = "";
  let any = false;

  for (const { label, keys } of RESOURCE_TIERS) {
    const present = keys.filter(k => state.resources[k] > 0);
    if (!present.length) continue;

    const tier = document.createElement("div");
    tier.className = "res-tier";
    tier.textContent = label;
    el.resources.appendChild(tier);

    for (const k of present) {
      const row  = document.createElement("div");
      row.className = "res-row";

      const name = document.createElement("span");
      name.className   = "res-name";
      name.textContent = RESOURCE_LABELS[k] ?? k;

      const val  = document.createElement("span");
      val.className   = "res-val";
      val.textContent = Math.floor(state.resources[k]).toLocaleString();

      row.appendChild(name);
      row.appendChild(val);
      el.resources.appendChild(row);
      any = true;
    }
  }

  if (!any) {
    const hint = document.createElement("div");
    hint.style.color  = "var(--dim)";
    hint.style.fontSize = "11px";
    hint.style.marginTop = "6px";
    hint.textContent = "Stockpile depleted.";
    el.resources.appendChild(hint);
  }
}

const MAX_EVENTS_SHOWN = 28;

function renderEventLog() {
  el.eventlog.innerHTML = "";
  const visible = state.eventLog.slice(0, MAX_EVENTS_SHOWN);
  for (const evt of visible) {
    const div  = document.createElement("div");
    div.className = `evt evt-${evt.type}`;

    const time = document.createElement("span");
    time.className   = "evt-time";
    time.textContent = `[${evt.time}] `;

    div.appendChild(time);
    div.appendChild(document.createTextNode(evt.message));
    el.eventlog.appendChild(div);
  }
}

function renderDroneBar() {
  const active = Object.entries(GENERATORS).filter(([k]) => state.drones[k] > 0);
  if (!active.length) {
    el.dronebar.textContent = "No active drones — type 'build' to fabricate";
    return;
  }

  el.dronebar.innerHTML = "";
  for (let i = 0; i < active.length; i++) {
    const [k, gen] = active[i];
    const timer = state.timers[k];
    const cycle = getEffectiveStat(k, "cycle");
    const pct   = Math.max(0, Math.min(1, (cycle - timer) / cycle));
    const bars  = 8;
    const filled = Math.round(pct * bars);
    const bar   = "█".repeat(filled) + "░".repeat(bars - filled);

    const pill = document.createElement("span");
    pill.className   = "drone-pill";
    pill.textContent = `${gen.shortName} ×${state.drones[k]} [${bar}] ${timer}s`;
    el.dronebar.appendChild(pill);

    if (i < active.length - 1) {
      const sep = document.createElement("span");
      sep.className   = "drone-pill-sep";
      sep.textContent = " │ ";
      el.dronebar.appendChild(sep);
    }
  }
}

function renderHeader() {
  el.header.textContent = `UPTIME ${formatUptime()}  TICK #${state.tick}`;
}

// ── Render loop ───────────────────────────────────────────────────────────────

export function render() {
  renderHeader();
  renderDroneBar();            // always (countdown changes every second)
  if (state._dirty.resources) { renderResources(); state._dirty.resources = false; }
  if (state._dirty.events)    { renderEventLog();  state._dirty.events    = false; }
  state._dirty.drones = false;
}

export function renderAll() {
  renderHeader();
  renderResources();
  renderEventLog();
  renderDroneBar();
  state._dirty.resources = false;
  state._dirty.events    = false;
  state._dirty.drones    = false;
}

// ── Boot sequence ─────────────────────────────────────────────────────────────

const BOOT_LINES = [
  { text: "$ ssh admin@AURORA-7.local",                                        delay: 0   },
  { text: "SSH-2.0-OpenSSH_9.6p1",                                             delay: 350 },
  { text: "Authenticating to AURORA-7.local...",                               delay: 200 },
  { text: "debug1: Offering public key: /home/admin/.ssh/id_ed25519 ED25519",  delay: 300 },
  { text: "Authenticated to AURORA-7.local ([10.0.2.1]:22) using publickey.", delay: 700 },
  { text: "",                                                                   delay: 100 },
  { text: "Last login: Sat Jan 11 08:44:02 2025 from 10.0.2.5",               delay: 100 },
  { text: "",                                                                   delay: 150 },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",         delay: 50  },
  { text: "  AURORA-7  ·  AUTONOMOUS MINING VESSEL",                           delay: 100 },
  { text: "  Emergency Operations Terminal  v2.1",                             delay: 100 },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",         delay: 100 },
  { text: "",                                                                   delay: 200 },
  { text: "  Hull Integrity     ██████████░░░░░░░░░░  52%   CRITICAL",         delay: 150 },
  { text: "  Life Support       ░░░░░░░░░░░░░░░░░░░░   0%   OFFLINE",          delay: 120 },
  { text: "  Reactor Core       ████████████████████ 100%   NOMINAL",          delay: 120 },
  { text: "  Mining Systems     ████████████████░░░░  80%   DEGRADED",         delay: 120 },
  { text: "  Drone Fabricator   ████████████████████ 100%   ONLINE",           delay: 120 },
  { text: "",                                                                   delay: 200 },
  { text: "  WARNING: Ship adrift in asteroid field KEPLER-92-B",              delay: 250 },
  { text: "  WARNING: Navigation array offline — trajectory unstable",         delay: 200 },
  { text: "",                                                                   delay: 200 },
  { text: "  Emergency resource cache located: 25× Fe  15× Ni",               delay: 200 },
  { text: "  Active drone count: 0",                                           delay: 100 },
  { text: "",                                                                   delay: 200 },
  { text: "  Type 'help' for available commands.",                              delay: 250 },
  { text: "",                                                                   delay: 100 },
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function runBootSequence() {
  applyColorScheme();
  for (const { text, delay } of BOOT_LINES) {
    await sleep(delay);
    el.bootOutput.textContent += text + "\n";
  }

  await sleep(500);
  el.boot.classList.add("fade-out");
  await sleep(450);
  el.boot.classList.add("hidden");
  el.boot.classList.remove("fade-out");

  renderAll();
  appendLine("System ready. Type 'help' to begin.", "hint");
  appendLine("");
}
