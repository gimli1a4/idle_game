// ── Resources ────────────────────────────────────────────────────────────────

export const RESOURCES = {
  raw: {
    iron:    { name: "Iron Ore" },
    nickel:  { name: "Nickel Ore" },
    silicon: { name: "Silicon" },
    carbon:  { name: "Carbon" },
    ice:     { name: "Ice" },
  },
  refined: {
    steel: {
      name:        "Steel",
      recipe:      { iron: 4, nickel: 2 },
      description: "Smelted from iron and nickel. The backbone of drone fabrication.",
    },
    alloy: {
      name:        "Composite Alloy",
      recipe:      { iron: 3, carbon: 3 },
      description: "High-strength carbon steel blend. Tougher than standard steel, lighter too.",
    },
    refinedSilicon: {
      name:        "Refined Silicon",
      recipe:      { silicon: 4 },
      description: "Purified silicon wafer stock. Prerequisite for circuit fabrication.",
    },
    fuelCells: {
      name:        "Fuel Cells",
      recipe:      { ice: 4, carbon: 2 },
      description: "Hydrogen cracked from ice, with carbon electrodes. Powers high-tier drones.",
    },
    circuits: {
      name:        "Circuits",
      recipe:      { refinedSilicon: 2, nickel: 3 },
      description: "Nickel traces on a silicon substrate. Required for any intelligent drone system.",
    },
    coolant: {
      name:        "Coolant",
      recipe:      { ice: 3, silicon: 2 },
      description: "Thermal management fluid. Keeps high-performance drones from cooking themselves.",
    },
  },
};

// ── Generators ───────────────────────────────────────────────────────────────

export const GENERATORS = {

  // ══ TIER 1 — Basic prospecting, one per asteroid class ══════════════════

  mTypeProspector: {
    name:      "M-Type Prospector",
    shortName: "m-type-prospector",
    cycle:     10,
    success:   0.65,
    crit:      0.08,
    critMult:  2.0,
    yield: {
      iron:   [2, 5],
      nickel: [1, 3],
    },
    cost:        { iron: 10, nickel: 5 },
    description: "The fabricator's first unit. Targets metallic M-type asteroids — dense, iron-nickel bodies that are remnant cores of long-destroyed protoplanets. Slow but reliable.",
  },

  cTypeProspector: {
    name:      "C-Type Prospector",
    shortName: "c-type-prospector",
    cycle:     10,
    success:   0.65,
    crit:      0.08,
    critMult:  2.0,
    yield: {
      silicon: [2, 4],
      carbon:  [2, 4],
    },
    cost:        { iron: 12, nickel: 6 },
    description: "Surveys carbonaceous chondrite asteroids — the most abundant type in the belt. Rich in silicate minerals and organic carbon compounds laid down in the early solar system.",
  },

  cometSkimmer: {
    name:      "Comet Skimmer",
    shortName: "comet-skimmer",
    cycle:     12,
    success:   0.60,
    crit:      0.10,
    critMult:  2.0,
    yield: {
      ice:    [2, 5],
      carbon: [1, 3],
    },
    cost:        { iron: 14, nickel: 7 },
    description: "Harvests D-type and P-type bodies in the outer belt — dark, primitive objects rich in water ice and carbonaceous material, thought to be remnants of the early solar nebula.",
  },

  // ══ TIER 2 — Specialists, depth over breadth ════════════════════════════

  sideriteExtractor: {
    name:      "Siderite Extractor",
    shortName: "siderite-extractor",
    cycle:     18,
    success:   0.55,
    crit:      0.18,
    critMult:  2.8,
    yield: {
      iron:   [6, 14],
      nickel: [2, 5],
    },
    cost:        { iron: 30, nickel: 15, steel: 8 },
    description: "Drills directly into the siderite-rich cores of M-type asteroids. Siderite is an iron carbonate mineral concentrated deep in metallic bodies. High iron focus, some nickel as byproduct.",
  },

  kamaciteDrill: {
    name:      "Kamacite Drill",
    shortName: "kamacite-drill",
    cycle:     18,
    success:   0.55,
    crit:      0.18,
    critMult:  2.8,
    yield: {
      nickel: [6, 14],
      iron:   [2, 5],
    },
    cost:        { iron: 30, nickel: 15, steel: 8 },
    description: "Targets kamacite — a naturally occurring iron-nickel alloy with unusually high nickel content found in M-type meteorite interiors. High nickel focus, some iron as byproduct.",
  },

  silicateBorer: {
    name:      "Silicate Borer",
    shortName: "silicate-borer",
    cycle:     16,
    success:   0.60,
    crit:      0.15,
    critMult:  2.5,
    yield: {
      silicon: [6, 12],
      carbon:  [1, 4],
    },
    cost:        { iron: 25, nickel: 12, steel: 6 },
    description: "Cuts through olivine and pyroxene silicate layers in C-type asteroids. These silicate mineral families make up the bulk of the rocky matrix. Silicon-focused, minor carbon.",
  },

  organicRakeHarvester: {
    name:      "Organic Rake",
    shortName: "organic-rake",
    cycle:     16,
    success:   0.60,
    crit:      0.15,
    critMult:  2.5,
    yield: {
      carbon:  [6, 12],
      silicon: [1, 4],
    },
    cost:        { iron: 25, nickel: 12, steel: 6 },
    description: "Sweeps the organic-rich regolith of C-type surfaces where complex carbon compounds accumulate. Carbon-focused counterpart to the Silicate Borer.",
  },

  cryoExtractor: {
    name:      "Cryo Extractor",
    shortName: "cryo-extractor",
    cycle:     20,
    success:   0.50,
    crit:      0.20,
    critMult:  3.0,
    yield: {
      ice:    [8, 16],
      carbon: [1, 4],
    },
    cost:        { iron: 28, nickel: 14, steel: 8 },
    description: "Thermally sealed harvester built for shadowed craters and subsurface ice pockets in D-type bodies. Ice sublimates fast — this drone works cold and works quick.",
  },

  // ══ TIER 3 — High-yield, refined-resource costs, coolant-dependent ══════

  chondriteCrusher: {
    name:      "Chondrite Crusher",
    shortName: "chondrite-crusher",
    cycle:     30,
    success:   0.50,
    crit:      0.22,
    critMult:  3.5,
    yield: {
      iron:    [10, 20],
      nickel:  [8, 16],
      silicon: [4, 8],
    },
    cost:        { steel: 20, alloy: 10, circuits: 5, coolant: 4 },
    description: "Bulk-processes undifferentiated chondrite asteroids — primitive bodies that never fully separated into core and mantle. Messy but enormously productive across all rocky resources.",
  },

  pallasiteDredge: {
    name:      "Pallasite Dredge",
    shortName: "pallasite-dredge",
    cycle:     35,
    success:   0.45,
    crit:      0.28,
    critMult:  4.0,
    yield: {
      iron:   [12, 24],
      nickel: [12, 24],
    },
    cost:        { steel: 25, alloy: 15, circuits: 6, coolant: 5 },
    description: "Named for pallasite meteorites — the rarest and most beautiful class, formed at the core-mantle boundary of ancient planetesimals. Targets the deepest M-type veins. Extreme iron-nickel yield, long cycle.",
  },

  cometaryAssayDrone: {
    name:      "Cometary Assay Drone",
    shortName: "cometary-assay-drone",
    cycle:     28,
    success:   0.55,
    crit:      0.20,
    critMult:  3.5,
    yield: {
      ice:    [10, 20],
      carbon: [8, 16],
      silicon:[3, 7],
    },
    cost:        { steel: 18, circuits: 6, fuelCells: 8, coolant: 6 },
    description: "Full-spectrum harvester for cometary nuclei and outer-belt primitives. Comets are time capsules — water ice, organics and silicate dust locked together since the solar system formed.",
  },

};

// ── Upgrades ─────────────────────────────────────────────────────────────────

// Base resource cost at level 0. Actual cost = ceil(base * 1.8^level).
export const UPGRADE_BASE_COST = {
  success: { iron: 20, nickel: 10 },
  crit:    { iron: 15, nickel: 8, silicon: 5 },
  yield:   { steel: 5, nickel: 15 },
  cycle:   { circuits: 2, fuelCells: 3, steel: 8 },
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

// ── Ship Modules ──────────────────────────────────────────────────────────────
//
// Fixed onboard infrastructure. Each module runs a deterministic conversion
// cycle: consumes raw inputs → produces one refined resource. No RNG.
// Tiers 1-3 (Online → Overclocked → Optimised). Tier 0 = locked.

export const MODULES = {

  steelFoundry: {
    name:        "Steel Foundry",
    shortName:   "steel-foundry",
    description: "Reactivated arc-furnace on deck 4. Smelts iron and nickel into structural steel.",
    output:      "steel",
    unlockCost:  { iron: 40, nickel: 20 },
    tiers: [
      { tier: 1, label: "Online",      cycleTime: 30, inputs: { iron: 4, nickel: 2 },              outputQty: 1, upgradeCost: { iron: 60, nickel: 30, steel: 5 } },
      { tier: 2, label: "Overclocked", cycleTime: 20, inputs: { iron: 4, nickel: 2 },              outputQty: 2, upgradeCost: { steel: 20, circuits: 4, coolant: 8 } },
      { tier: 3, label: "Optimised",   cycleTime: 12, inputs: { iron: 4, nickel: 2, coolant: 1 }, outputQty: 3, upgradeCost: null },
    ],
  },

  carbonForge: {
    name:        "Carbon Forge",
    shortName:   "carbon-forge",
    description: "Infuses iron with carbon at high pressure, producing composite alloy.",
    output:      "alloy",
    unlockCost:  { iron: 30, carbon: 30 },
    tiers: [
      { tier: 1, label: "Online",      cycleTime: 35, inputs: { iron: 3, carbon: 3 },              outputQty: 1, upgradeCost: { iron: 50, carbon: 50, alloy: 5 } },
      { tier: 2, label: "Overclocked", cycleTime: 22, inputs: { iron: 3, carbon: 3 },              outputQty: 2, upgradeCost: { alloy: 20, circuits: 4, coolant: 8 } },
      { tier: 3, label: "Optimised",   cycleTime: 14, inputs: { iron: 3, carbon: 3, coolant: 1 }, outputQty: 3, upgradeCost: null },
    ],
  },

  purificationChamber: {
    name:        "Purification Chamber",
    shortName:   "purification-chamber",
    description: "Zone-refining unit that sweeps impurities from raw silicon into wafer-grade stock.",
    output:      "refinedSilicon",
    unlockCost:  { iron: 20, nickel: 10, silicon: 30 },
    tiers: [
      { tier: 1, label: "Online",      cycleTime: 25, inputs: { silicon: 4 },              outputQty: 1, upgradeCost: { silicon: 60, steel: 10 } },
      { tier: 2, label: "Overclocked", cycleTime: 16, inputs: { silicon: 4 },              outputQty: 2, upgradeCost: { refinedSilicon: 15, circuits: 4, coolant: 6 } },
      { tier: 3, label: "Optimised",   cycleTime: 10, inputs: { silicon: 4, coolant: 1 }, outputQty: 3, upgradeCost: null },
    ],
  },

  electrolysisPlant: {
    name:        "Electrolysis Plant",
    shortName:   "electrolysis-plant",
    description: "Cracks ice into hydrogen, binds it to carbon electrodes to produce fuel cells.",
    output:      "fuelCells",
    unlockCost:  { iron: 25, nickel: 12, ice: 20 },
    tiers: [
      { tier: 1, label: "Online",      cycleTime: 40, inputs: { ice: 4, carbon: 2 },              outputQty: 1, upgradeCost: { steel: 12, fuelCells: 5 } },
      { tier: 2, label: "Overclocked", cycleTime: 26, inputs: { ice: 4, carbon: 2 },              outputQty: 2, upgradeCost: { fuelCells: 20, circuits: 5, coolant: 10 } },
      { tier: 3, label: "Optimised",   cycleTime: 16, inputs: { ice: 4, carbon: 2, coolant: 1 }, outputQty: 3, upgradeCost: null },
    ],
  },

  fabricationBay: {
    name:        "Fabrication Bay",
    shortName:   "fabrication-bay",
    description: "Deposits nickel traces onto refined silicon substrates. Required for tier 2+ drones.",
    output:      "circuits",
    unlockCost:  { steel: 15, refinedSilicon: 10 },
    tiers: [
      { tier: 1, label: "Online",      cycleTime: 45, inputs: { refinedSilicon: 2, nickel: 3 },              outputQty: 1, upgradeCost: { circuits: 8, steel: 15, alloy: 8 } },
      { tier: 2, label: "Overclocked", cycleTime: 28, inputs: { refinedSilicon: 2, nickel: 3 },              outputQty: 2, upgradeCost: { circuits: 20, alloy: 15, coolant: 12 } },
      { tier: 3, label: "Optimised",   cycleTime: 18, inputs: { refinedSilicon: 2, nickel: 3, coolant: 1 }, outputQty: 3, upgradeCost: null },
    ],
  },

  cryoDistillery: {
    name:        "Cryo Distillery",
    shortName:   "cryo-distillery",
    description: "Blends meltwater and silicon particulate into dielectric coolant fluid. Upgrade this first.",
    output:      "coolant",
    unlockCost:  { iron: 20, nickel: 10, ice: 20, silicon: 10 },
    tiers: [
      { tier: 1, label: "Online",      cycleTime: 30, inputs: { ice: 3, silicon: 2 }, outputQty: 1, upgradeCost: { steel: 10, coolant: 5 } },
      { tier: 2, label: "Overclocked", cycleTime: 20, inputs: { ice: 3, silicon: 2 }, outputQty: 2, upgradeCost: { coolant: 20, circuits: 6, alloy: 10 } },
      { tier: 3, label: "Optimised",   cycleTime: 12, inputs: { ice: 3, silicon: 2 }, outputQty: 3, upgradeCost: null },
    ],
  },

};
