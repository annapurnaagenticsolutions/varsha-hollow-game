export type StatKey = "empathy" | "wisdom" | "practicality";
export type CompanionKey = "meera" | "leela" | "tara" | "kabir" | "dev";
export type SlimeKey = "dew" | "clay" | "lantern" | "echo" | "herb";
export type ResourceKey = "timber" | "tiles" | "canvas" | "crewEnergy";

export interface RoofLedger {
  total: number;
  inspected: number;
  unsafe: number;
  secured: number;
}

export interface Effects {
  stats?: Partial<Record<StatKey, number>>;
  relationships?: Partial<Record<CompanionKey, number>>;
  slimeTrust?: number;
  prosperity?: number;
  waterSecurity?: number;
  safeRoofs?: number;
  unlockSlime?: SlimeKey;
  resources?: Partial<Record<ResourceKey, number>>;
  roofLedger?: Partial<Omit<RoofLedger, "total">>;
  setRoofLedger?: Partial<Omit<RoofLedger, "total">>;
  villageStage?: GameState["village"]["stage"];
}

export interface Choice {
  id: string;
  label: string;
  approach: "Care" | "Inquiry" | "Action";
  effects: Effects;
  result: string;
  reflection: string;
}

export interface StoryScene {
  id: string;
  chapter: number;
  chapterTitle: string;
  sceneLabel: string;
  location: string;
  time: string;
  paragraphs: string[];
  signal?: string;
  image?: string;
  training?: TrainingChallenge;
  legacyConsequences?: LegacyConsequence[];
  prompt: string;
  choices: Choice[];
}

export interface TrainingChallenge {
  title: string;
  prompt: string;
  steps: Array<{ id: string; label: string; symbol: string }>;
  correctOrder: string[];
  success: string;
  retry: string;
}

export interface LegacyConsequence {
  choiceIds: string[];
  label: string;
  paragraph: string;
  effects?: Effects;
}

export interface DecisionRecord {
  sceneId: string;
  choiceId: string;
  approach: Choice["approach"];
}

export interface GameState {
  version: 2;
  started: boolean;
  sceneIndex: number;
  stats: Record<StatKey, number>;
  relationships: Record<CompanionKey, number>;
  slimeTrust: number;
  prosperity: number;
  village: {
    stage: "Survival" | "Recovery" | "Connection" | "Growth" | "Identity";
    population: number;
    waterSecurity: number;
    safeRoofs: number;
    marketStalls: number;
  };
  unlockedSlimes: SlimeKey[];
  resources: Record<ResourceKey, number>;
  roofLedger: RoofLedger;
  completedArcs: number[];
  decisions: DecisionRecord[];
}

export interface ArcEvaluation {
  title: string;
  description: string;
  strength: string;
  nextLesson: string;
}
