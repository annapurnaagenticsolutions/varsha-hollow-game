import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { scenes } from "../client/src/game/chapters";
import {
  applyChoice,
  completeArc,
  createInitialState,
  evaluateArc,
  migrateGameState,
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
    expect(arcTwo.every((scene) => scene.image?.startsWith("/images/arc-two/"))).toBe(true);
    expect(arcTwo.every((scene) => scene.image && existsSync(join(process.cwd(), "client/public", scene.image)))).toBe(true);
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
});
