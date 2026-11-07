import { describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { scenes } from "../client/src/game/chapters";
import { summarizeImpact } from "../client/src/game/impact";
import {
  applyChoice,
  completeArc,
  createInitialState,
  evaluateArc,
  migrateGameState,
  saveGame,
  loadGame,
  clearSave,
} from "../client/src/game/engine";

describe("Varsha Hollow narrative engine", () => {
  it("applies a choice without mutating the previous state", () => {
    const initial = createInitialState();
    const choice = scenes[0].choices[0];
    const next = applyChoice(initial, scenes[0], choice);

    expect(initial.sceneIndex).toBe(0);
    expect(initial.stats.empathy).toBe(3);
    expect(next.sceneIndex).toBe(1);
    expect(next.stats.empathy).toBe(4);
    expect(next.relationships.meera).toBe(2);
    expect(next.decisions).toHaveLength(1);
  });

  it("does not unlock the same slime twice", () => {
    const scene = scenes.find((item) => item.id === "cup-kavi")!;
    const choice = scene.choices[0];
    const first = applyChoice(createInitialState(), scene, choice);
    const second = applyChoice(first, scene, choice);

    expect(second.unlockedSlimes).toEqual(["dew"]);
  });

  it("returns a balanced evaluation when attributes stay close", () => {
    const evaluation = evaluateArc(createInitialState());
    expect(evaluation.title).toBe("The Listening Builder");
  });

  it("contains ten chapters and thirty authored decision scenes", () => {
    expect(new Set(scenes.map((scene) => scene.chapter)).size).toBe(10);
    expect(scenes).toHaveLength(30);
    expect(scenes.every((scene) => scene.choices.length === 3)).toBe(true);
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(30);
    expect(new Set(scenes.flatMap((scene) => scene.choices.map((choice) => choice.id))).size).toBe(90);
  });

  it("adds Arc Two art, Clay Slime training, and the tactile marker interaction", () => {
    const arcTwo = scenes.filter((scene) => scene.chapter >= 6);
    expect(arcTwo.every((scene) => scene.image?.includes("/images/arc-two/"))).toBe(true);
    expect(arcTwo.every((scene) => scene.image && existsSync(join(process.cwd(), "client/public/images", scene.image.split("/images/")[1])))).toBe(true);
    expect(arcTwo.some((scene) => scene.training?.correctOrder.join(",") === "leave-open,brace,fill")).toBe(true);

    const discovery = scenes.find((scene) => scene.id === "earth-riverbed")!;
    const next = applyChoice(createInitialState(), discovery, discovery.choices[0]);
    expect(next.unlockedSlimes).toContain("clay");
  });

  it("applies an earned Arc One consequence during Arc Two", () => {
    const state = createInitialState();
    state.sceneIndex = 15;
    state.decisions.push({ sceneId: "hearth-census", choiceId: "visit-homes", approach: "Care" });
    const scene = scenes.find((item) => item.id === "earth-roof-audit")!;
    const next = applyChoice(state, scene, scene.choices[0]);

    expect(next.roofLedger.inspected).toBe(10);
    expect(next.resources.crewEnergy).toBe(7);
  });

  it("preserves the canonical Recovery outcome at the end of Chapter 10", () => {
    const state = createInitialState();
    state.sceneIndex = 29;
    const scene = scenes.find((item) => item.id === "fortieth-storm")!;
    const next = applyChoice(state, scene, scene.choices[1]);

    expect(next.sceneIndex).toBe(30);
    expect(next.village.stage).toBe("Recovery");
    expect(next.roofLedger).toEqual({ total: 40, inspected: 40, unsafe: 0, secured: 11 });
  });

  it("migrates completed version-one saves directly to Arc Two", () => {
    const legacy = {
      ...createInitialState(),
      version: 1,
      sceneIndex: 15,
      resources: undefined,
      roofLedger: undefined,
      completedArcs: undefined,
    };
    const migrated = migrateGameState(legacy)!;

    expect(migrated.version).toBe(2);
    expect(migrated.completedArcs).toEqual([1]);
    expect(migrated.resources.timber).toBe(5);
    expect(migrated.roofLedger.unsafe).toBe(11);
  });

  it("records arc acknowledgements without duplication", () => {
    const once = completeArc(createInitialState(), 1);
    const twice = completeArc(once, 1);
    expect(twice.completedArcs).toEqual([1]);
  });
  it("sanitizes damaged and out-of-range local saves instead of trusting browser state", () => {
    expect(migrateGameState({ version: 22 })).toBeNull();
    expect(migrateGameState([])).toBeNull();
    const state = migrateGameState({
      version: 2, sceneIndex: 999, stats: { empathy: -77, wisdom: "bad" },
      relationships: null, resources: { timber: -100 },
      roofLedger: { inspected: 999, unsafe: -4 },
      village: { stage: "Unknown", waterSecurity: 1200 },
      unlockedSlimes: ["dew", "dew", "nonexistent"],
      decisions: ["bad", { sceneId: "valid", choiceId: "c1", approach: "Care" }],
    });
    expect(state).not.toBeNull();
    expect(state!.sceneIndex).toBe(scenes.length);
    expect(state!.stats.empathy).toBe(0);
    expect(state!.stats.wisdom).toBe(3);
    expect(state!.resources.timber).toBe(0);
    expect(state!.roofLedger.inspected).toBe(40);
    expect(state!.roofLedger.unsafe).toBe(0);
    expect(state!.village.stage).toBe("Survival");
    expect(state!.unlockedSlimes).toEqual(["dew"]);
    expect(state!.decisions).toHaveLength(1);
  });

  it("supports a complete deterministic story walkthrough for every choice position", () => {
    for (const choicePosition of [0, 1, 2]) {
      let state = createInitialState();
      for (const scene of scenes) {
        const previousState = state;
        state = applyChoice(state, scene, scene.choices[choicePosition]);
        expect(state.sceneIndex).toBe(previousState.sceneIndex + 1);
        expect(state.decisions.at(-1)?.sceneId).toBe(scene.id);
        expect(state.resources.crewEnergy).toBeGreaterThanOrEqual(0);
        expect(state.roofLedger.inspected).toBeLessThanOrEqual(40);
        expect(state.roofLedger.secured).toBeLessThanOrEqual(11);
        expect(summarizeImpact(previousState, state)).toBeInstanceOf(Array);
      }
      expect(state.sceneIndex).toBe(30);
      expect(state.village.stage).toBe("Recovery");
    }
  });

  it("reflects a visible early consequence on the player-facing decision summary", () => {
    const before = createInitialState();
    const after = applyChoice(before, scenes[0], scenes[0].choices[0]);
    const changes = summarizeImpact(before, after);
    expect(changes).toContain("Empathy +1");
    expect(changes).toContain("Meera bond +1");
  });

  it("allows play without crashing when browser storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem() { throw new Error("SecurityError"); },
      setItem() { throw new Error("QuotaExceededError"); },
      removeItem() { throw new Error("SecurityError"); },
    });
    try {
      expect(saveGame(createInitialState())).toBe(false);
      expect(loadGame()).toBeNull();
      expect(clearSave()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

});
