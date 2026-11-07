import type { GameState } from "./types";

/** Show concrete changes to state without exposing the internal scoring model. */
export function summarizeImpact(before: GameState, after: GameState): string[] {
  const fields: Array<[string, number, number]> = [
    ["Empathy", before.stats.empathy, after.stats.empathy],
    ["Wisdom", before.stats.wisdom, after.stats.wisdom],
    ["Practicality", before.stats.practicality, after.stats.practicality],
    ["Meera bond", before.relationships.meera, after.relationships.meera],
    ["Slime trust", before.slimeTrust, after.slimeTrust],
    ["Water security", before.village.waterSecurity, after.village.waterSecurity],
    ["Safe roofs", before.village.safeRoofs, after.village.safeRoofs],
    ["Prosperity", before.prosperity, after.prosperity],
    ["Roofs inspected", before.roofLedger.inspected, after.roofLedger.inspected],
    ["Roofs secured", before.roofLedger.secured, after.roofLedger.secured],
    ["Unsafe roofs", before.roofLedger.unsafe, after.roofLedger.unsafe],
    ["Timber", before.resources.timber, after.resources.timber],
    ["Tiles", before.resources.tiles, after.resources.tiles],
    ["Canvas", before.resources.canvas, after.resources.canvas],
    ["Crew energy", before.resources.crewEnergy, after.resources.crewEnergy],
  ];
  const visible = fields
    .filter(([, previous, next]) => previous !== next)
    .map(([name, previous, next]) => `${name} ${next > previous ? "+" : ""}${next - previous}`);
  for (const slime of after.unlockedSlimes) {
    if (!before.unlockedSlimes.includes(slime)) visible.unshift(`New slime ally: ${slime}`);
  }
  if (before.village.stage !== after.village.stage) visible.unshift(`Village: ${after.village.stage}`);
  return visible;
}
