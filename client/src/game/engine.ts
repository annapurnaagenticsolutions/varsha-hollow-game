import type { ArcEvaluation, Choice, Effects, GameState, LegacyConsequence, DecisionRecord, ResourceKey, SlimeKey, StoryScene } from "./types";

export const SAVE_KEY = "varsha-hollow-save-v1";

export const createInitialState = (): GameState => ({
  version: 2,
  started: true,
  sceneIndex: 0,
  stats: { empathy: 3, wisdom: 3, practicality: 3 },
  relationships: { meera: 1, leela: 0, tara: 0, kabir: 0, dev: 0 },
  slimeTrust: 0,
  prosperity: 6,
  village: {
    stage: "Survival",
    population: 41,
    waterSecurity: 3,
    safeRoofs: 13,
    marketStalls: 0,
  },
  unlockedSlimes: [],
  resources: { timber: 5, tiles: 3, canvas: 2, crewEnergy: 6 },
  roofLedger: { total: 40, inspected: 0, unsafe: 11, secured: 0 },
  completedArcs: [],
  decisions: [],
});

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function applyEffects(state: GameState, effects: Effects): GameState {
  const next: GameState = {
    ...state,
    stats: { ...state.stats },
    relationships: { ...state.relationships },
    slimeTrust: clamp(state.slimeTrust + (effects.slimeTrust ?? 0)),
    prosperity: clamp(state.prosperity + (effects.prosperity ?? 0)),
    village: {
      ...state.village,
      waterSecurity: clamp(state.village.waterSecurity + (effects.waterSecurity ?? 0)),
      safeRoofs: Math.max(0, state.village.safeRoofs + (effects.safeRoofs ?? 0)),
      stage: effects.villageStage ?? state.village.stage,
    },
    unlockedSlimes: effects.unlockSlime
      ? Array.from(new Set([...state.unlockedSlimes, effects.unlockSlime])) as SlimeKey[]
      : [...state.unlockedSlimes],
    resources: { ...state.resources },
    roofLedger: { ...state.roofLedger },
    completedArcs: [...state.completedArcs],
    decisions: [...state.decisions],
  };

  for (const [key, amount] of Object.entries(effects.stats ?? {})) {
    const stat = key as keyof GameState["stats"];
    next.stats[stat] = clamp(next.stats[stat] + (amount ?? 0), 0, 10);
  }
  for (const [key, amount] of Object.entries(effects.relationships ?? {})) {
    const companion = key as keyof GameState["relationships"];
    next.relationships[companion] = clamp(next.relationships[companion] + (amount ?? 0), 0, 10);
  }

  for (const [key, amount] of Object.entries(effects.resources ?? {})) {
    const resource = key as ResourceKey;
    next.resources[resource] = clamp(next.resources[resource] + (amount ?? 0), 0, 99);
  }

  for (const [key, amount] of Object.entries(effects.roofLedger ?? {})) {
    const ledgerKey = key as keyof Omit<GameState["roofLedger"], "total">;
    const maximum = ledgerKey === "inspected" ? next.roofLedger.total : 11;
    next.roofLedger[ledgerKey] = clamp(next.roofLedger[ledgerKey] + (amount ?? 0), 0, maximum);
  }

  for (const [key, value] of Object.entries(effects.setRoofLedger ?? {})) {
    const ledgerKey = key as keyof Omit<GameState["roofLedger"], "total">;
    const maximum = ledgerKey === "inspected" ? next.roofLedger.total : 11;
    next.roofLedger[ledgerKey] = clamp(value ?? next.roofLedger[ledgerKey], 0, maximum);
  }

  return next;
}

export function getLegacyConsequences(scene: StoryScene, state: GameState): LegacyConsequence[] {
  const chosen = new Set(state.decisions.map((decision) => decision.choiceId));
  return (scene.legacyConsequences ?? []).filter((consequence) =>
    consequence.choiceIds.some((choiceId) => chosen.has(choiceId)),
  );
}

export function applyChoice(state: GameState, scene: StoryScene, choice: Choice): GameState {
  const consequences = getLegacyConsequences(scene, state);
  let next: GameState = {
    ...state,
    sceneIndex: state.sceneIndex + 1,
    stats: { ...state.stats },
    relationships: { ...state.relationships },
    village: { ...state.village },
    unlockedSlimes: [...state.unlockedSlimes],
    resources: { ...state.resources },
    roofLedger: { ...state.roofLedger },
    completedArcs: [...state.completedArcs],
    decisions: [...state.decisions],
  };

  for (const consequence of consequences) {
    if (consequence.effects) next = applyEffects(next, consequence.effects);
  }
  next = applyEffects(next, choice.effects);
  next.decisions.push({ sceneId: scene.id, choiceId: choice.id, approach: choice.approach });
  return next;
}

export function completeArc(state: GameState, arc: number): GameState {
  return { ...state, completedArcs: Array.from(new Set([...state.completedArcs, arc])) };
}

export function evaluateArc(state: GameState): ArcEvaluation {
  const entries = Object.entries(state.stats) as Array<[keyof GameState["stats"], number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const [strongest] = entries[0];
  const spread = entries[0][1] - entries[2][1];

  if (spread <= 1) {
    return {
      title: "The Listening Builder",
      description: "You balanced care, evidence, and useful action. Varsha Hollow trusts your process because no single instinct controlled every decision.",
      strength: "Balanced judgment",
      nextLesson: "Arc Two will test whether balance survives a deadline.",
    };
  }

  const evaluations: Record<typeof strongest, ArcEvaluation> = {
    empathy: {
      title: "The Gentle Shepherd",
      description: "The slimes learned that your presence means safety. People feel heard, even when the village still needs firmer plans.",
      strength: "Trust and emotional awareness",
      nextLesson: "Care must become a repeatable system, not depend on you alone.",
    },
    wisdom: {
      title: "The Patient Observer",
      description: "You resisted easy conclusions and learned how the reservoir truly behaved. Your evidence gives the village a foundation for safer choices.",
      strength: "Patterns and careful inquiry",
      nextLesson: "The coming rain will demand decisions before every answer is known.",
    },
    practicality: {
      title: "The Steady Hand",
      description: "You turned uncertainty into shelter, schedules, and measurable progress. The village can see what changed because of your work.",
      strength: "Organization and useful action",
      nextLesson: "Fast action must continue to respect fear, fatigue, and consent.",
    },
  };

  return evaluations[strongest];
}

export function evaluateArcTwo(state: GameState): ArcEvaluation {
  if (state.roofLedger.unsafe === 0 && state.resources.crewEnergy >= 3 && state.slimeTrust >= 20) {
    return {
      title: "The Recovery Architect",
      description: "You made urgency answer to transparent priorities, skilled human leadership, and the limits of living partners. The Hollow survived because the work became shared.",
      strength: "Durable systems under pressure",
      nextLesson: "Recovery must now become connection without letting outside demand own the village.",
    };
  }

  const strongest = Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0][0] as keyof GameState["stats"];
  const titles: Record<typeof strongest, ArcEvaluation> = {
    empathy: {
      title: "The Keeper of Limits",
      description: "Fear and fatigue remained information in your hands. The roofs held because no partner was treated as expendable.",
      strength: "Consent under pressure",
      nextLesson: "Turn compassionate exceptions into village-wide practice.",
    },
    wisdom: {
      title: "The Ledger of Reasons",
      description: "You made risk, evidence, and changing priorities visible. The village could disagree without losing the plan.",
      strength: "Transparent judgment",
      nextLesson: "Evidence must remain understandable when new people arrive.",
    },
    practicality: {
      title: "The Brace Beneath the Beam",
      description: "You organized scarce material and willing hands into a system that could survive the storm.",
      strength: "Coordination and safe action",
      nextLesson: "Efficiency must continue to include rest and refusal.",
    },
  };
  return titles[strongest];
}

/** Storage can fail in privacy mode, sandboxed browsers and at quota. Never crash gameplay. */
export function saveGame(state: GameState): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Validate untrusted local browser data before reconstructing a playable save. */
export function migrateGameState(value: unknown, maxScenes = 30): GameState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = value as Record<string, unknown>;
  if (parsed.version !== 1 && parsed.version !== 2) return null;

  const initial = createInitialState();
  const record = (input: unknown): Record<string, unknown> =>
    input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const number = (input: unknown, fallback: number, max: number): number =>
    typeof input === "number" && Number.isFinite(input) ? clamp(Math.trunc(input), 0, max) : fallback;
  const safeScenes = Number.isSafeInteger(maxScenes) && maxScenes > 0 ? maxScenes : 30;
  const sceneIndex = number(parsed.sceneIndex, 0, safeScenes);
  const stats = record(parsed.stats);
  const relationships = record(parsed.relationships);
  const village = record(parsed.village);
  const resources = record(parsed.resources);
  const roof = record(parsed.roofLedger);
  const slimes: SlimeKey[] = ["dew", "clay", "lantern", "echo", "herb"];
  const stages: GameState["village"]["stage"][] = ["Survival", "Recovery", "Connection", "Growth", "Identity"];
  const sourceDecisions = Array.isArray(parsed.decisions) ? parsed.decisions : [];
  const decisions = sourceDecisions.slice(0, safeScenes).flatMap((entry: unknown) => {
    const item = record(entry);
    return typeof item.sceneId === "string" && typeof item.choiceId === "string" &&
      item.sceneId.length <= 100 && item.choiceId.length <= 100 &&
      (item.approach === "Care" || item.approach === "Inquiry" || item.approach === "Action")
      ? [{ sceneId: item.sceneId, choiceId: item.choiceId, approach: item.approach as DecisionRecord["approach"] }] : [];
  });
  const previousArcs = Array.isArray(parsed.completedArcs) ? parsed.completedArcs : [];
  const completedArcs = Array.from(new Set(previousArcs.filter((arc): arc is number => arc === 1 || arc === 2)));
  if (parsed.version === 1 && sceneIndex >= 15 && !completedArcs.includes(1)) completedArcs.push(1);

  return {
    version: 2,
    started: true,
    sceneIndex,
    stats: {
      empathy: number(stats.empathy, initial.stats.empathy, 10),
      wisdom: number(stats.wisdom, initial.stats.wisdom, 10),
      practicality: number(stats.practicality, initial.stats.practicality, 10),
    },
    relationships: {
      meera: number(relationships.meera, initial.relationships.meera, 10),
      leela: number(relationships.leela, initial.relationships.leela, 10),
      tara: number(relationships.tara, initial.relationships.tara, 10),
      kabir: number(relationships.kabir, initial.relationships.kabir, 10),
      dev: number(relationships.dev, initial.relationships.dev, 10),
    },
    slimeTrust: number(parsed.slimeTrust, initial.slimeTrust, 100),
    prosperity: number(parsed.prosperity, initial.prosperity, 100),
    village: {
      stage: stages.includes(village.stage as GameState["village"]["stage"]) ? village.stage as GameState["village"]["stage"] : initial.village.stage,
      population: number(village.population, initial.village.population, 10000),
      waterSecurity: number(village.waterSecurity, initial.village.waterSecurity, 100),
      safeRoofs: number(village.safeRoofs, initial.village.safeRoofs, 40),
      marketStalls: number(village.marketStalls, initial.village.marketStalls, 50),
    },
    unlockedSlimes: Array.from(new Set((Array.isArray(parsed.unlockedSlimes) ? parsed.unlockedSlimes : []).filter((key): key is SlimeKey => slimes.includes(key as SlimeKey)))),
    resources: {
      timber: number(resources.timber, initial.resources.timber, 99),
      tiles: number(resources.tiles, initial.resources.tiles, 99),
      canvas: number(resources.canvas, initial.resources.canvas, 99),
      crewEnergy: number(resources.crewEnergy, initial.resources.crewEnergy, 99),
    },
    roofLedger: {
      total: 40,
      inspected: number(roof.inspected, initial.roofLedger.inspected, 40),
      unsafe: number(roof.unsafe, initial.roofLedger.unsafe, 11),
      secured: number(roof.secured, initial.roofLedger.secured, 11),
    },
    completedArcs,
    decisions,
  };
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return migrateGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearSave(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
