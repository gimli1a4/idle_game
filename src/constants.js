// ── Resources ────────────────────────────────────────────────────────────────

export const RESOURCES = {
  raw: {
    iron:   { name: "Iron Ore" },
    nickel: { name: "Nickel Ore" },
    silicon:{ name: "Silicon" },
    carbon: { name: "Carbon" },
    ice:    { name: "Ice" },
  },
  refined: {
    steel:          { name: "Steel" },
    alloy:          { name: "Composite Alloy" },
    refinedSilicon: { name: "Ref. Silicon" },
    fuel:           { name: "Fuel Cells" },
    circuits:       { name: "Circuits" },
  },
  advanced: {
    droneCpu:      { name: "Drone CPU" },
    sensorArray:   { name: "Sensor Array" },
    nanotubes:     { name: "Nanotubes" },
    fusionBattery: { name: "Fusion Battery" },
    aiCore:        { name: "AI Core" },
  },
  exotic: {
    iridium:        { name: "Iridium" },
    antimatterDust: { name: "Antimatter Dust" },
    alienAlloy:     { name: "Alien Alloy" },
    darkCrystal:    { name: "Dark Crystal" },
    neutronium:     { name: "Neutronium Frag." },
  },
};

// ── Generators ───────────────────────────────────────────────────────────────

export const GENERATORS = {
  salvageDrone: {
    name:        "Salvaged Mining Drone",
    shortName:   "salvage-drone",
    cycle:       10,     // seconds per cycle
    success:     0.60,   // base success probability
    crit:        0.10,   // base crit probability (subset of success)
    critMult:    2.5,    // crit yield multiplier
    yield: {
      iron:   [2, 5],
      nickel: [1, 3],
    },
    cost:        { iron: 10, nickel: 5 },
    description: "Basic reclaimed unit. Mines iron and nickel from nearby rock.",
  },
  prospectorDrone: {
    name:        "Prospector Drone",
    shortName:   "prospector-drone",
    cycle:       12,
    success:     0.75,
    crit:        0.15,
    critMult:    2.5,
    yield: {
      silicon: [2, 4],
      carbon:  [2, 4],
    },
    cost:        { iron: 20, nickel: 10, steel: 5 },
    description: "Surveys asteroid composition. Mines silicon and carbon.",
  },
  excavatorDrone: {
    name:        "Excavator Drone",
    shortName:   "excavator-drone",
    cycle:       20,
    success:     0.50,
    crit:        0.20,
    critMult:    3.0,
    yield: {
      iron:   [5, 12],
      nickel: [4, 10],
    },
    cost:        { steel: 15, circuits: 3, fuel: 5 },
    description: "Heavy-duty excavation rig. Long cycle, very high yield.",
  },
};

// ── Upgrades ─────────────────────────────────────────────────────────────────

// Base resource cost at level 0. Actual cost = ceil(base * 1.8^level).
export const UPGRADE_BASE_COST = {
  success: { iron: 20, nickel: 10 },
  crit:    { iron: 15, nickel: 8, silicon: 5 },
  yield:   { steel: 5, nickel: 15 },
  cycle:   { circuits: 2, fuel: 3, steel: 8 },
};

export const UPGRADE_EFFECTS = {
  success: { delta:  0.05, label: "success rate",  unit: "%" },
  crit:    { delta:  0.03, label: "crit chance",   unit: "%" },
  yield:   { delta:  0.10, label: "yield bonus",   unit: "x" },
  cycle:   { delta: -1,    label: "cycle time",    unit: "s", min: 3 },
};

// ── Color schemes ─────────────────────────────────────────────────────────────

export const COLOR_SCHEMES = {
  green: {
    name: "PHOSPHOR GREEN",
    "--primary":   "#00ff41",
    "--secondary": "#00cc33",
    "--dim":       "#005c17",
    "--bg":        "#030a03",
    "--text":      "#b8ffca",
  },
  amber: {
    name: "AMBER",
    "--primary":   "#ffb000",
    "--secondary": "#cc8800",
    "--dim":       "#664800",
    "--bg":        "#080500",
    "--text":      "#ffe0a0",
  },
  cyan: {
    name: "CYAN",
    "--primary":   "#00e5ff",
    "--secondary": "#00b8cc",
    "--dim":       "#005060",
    "--bg":        "#020808",
    "--text":      "#a0f0ff",
  },
  red: {
    name: "RED ALERT",
    "--primary":   "#ff4444",
    "--secondary": "#cc2222",
    "--dim":       "#660000",
    "--bg":        "#080000",
    "--text":      "#ffcccc",
  },
  white: {
    name: "WHITE PHOSPHOR",
    "--primary":   "#d8d8d8",
    "--secondary": "#aaaaaa",
    "--dim":       "#444444",
    "--bg":        "#050505",
    "--text":      "#cccccc",
  },
  blue: {
    name: "COBALT",
    "--primary":   "#4499ff",
    "--secondary": "#2277dd",
    "--dim":       "#112244",
    "--bg":        "#000510",
    "--text":      "#aaccff",
  },
};
