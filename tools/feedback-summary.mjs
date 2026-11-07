/**
 * Aggregate explicitly shared Varsha Hollow playtest exports.
 * Never prints comments, player choices, filenames or identifying information.
 * Usage: node tools/feedback-summary.mjs ./collected-playtests
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export function summarizeReports(input) {
  const valid = input.filter((item) => item && item.schema === "varsha-playtest-v1" && item.game === "Varsha Hollow");
  const answeredRatings = valid.filter((item) => Number.isInteger(item.enjoyment_rating) && item.enjoyment_rating >= 1 && item.enjoyment_rating <= 5);
  const answeredReplay = valid.filter((item) => ["yes", "maybe", "no"].includes(item.would_play_again));
  const distribution = Object.fromEntries([1, 2, 3, 4, 5].map((rating) => [rating, answeredRatings.filter((item) => item.enjoyment_rating === rating).length]));
  const replay = Object.fromEntries(["yes", "maybe", "no"].map((value) => [value, answeredReplay.filter((item) => item.would_play_again === value).length]));
  const sum = answeredRatings.reduce((total, item) => total + item.enjoyment_rating, 0);
  const scenes = valid.map((item) => item.scenes_completed).filter((count) => Number.isInteger(count) && count >= 0 && count <= 30);
  return {
    schema: "varsha-aggregate-v1",
    collected_reports: valid.length,
    caveat: "Voluntary, non-random submissions: not unique users, unbiased retention, or payment conversion.",
    ratings: { responses: answeredRatings.length, mean: answeredRatings.length ? Number((sum / answeredRatings.length).toFixed(2)) : null, distribution },
    would_play_again: { responses: answeredReplay.length, counts: replay },
    completed_scene_count: { observed: scenes.length, mean: scenes.length ? Number((scenes.reduce((a, b) => a + b, 0) / scenes.length).toFixed(2)) : null },
    arc: {
      one: valid.filter((item) => item.arc === "one").length,
      two: valid.filter((item) => item.arc === "two").length,
    },
  };
}

export function collectReports(directory) {
  const files = readdirSync(directory).filter((filename) => filename.endsWith(".json"));
  const items = [];
  let invalidFiles = 0;
  for (const filename of files) {
    try {
      const item = JSON.parse(readFileSync(join(directory, filename), "utf8"));
      if (item && item.schema === "varsha-playtest-v1" && item.game === "Varsha Hollow") items.push(item);
      else invalidFiles++;
    } catch {
      invalidFiles++;
    }
  }
  return { ...summarizeReports(items), invalid_files: invalidFiles };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node tools/feedback-summary.mjs <directory-containing-consented-json-exports>");
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(collectReports(resolve(folder)), null, 2));
    } catch (error) {
      console.error("Unable to read feedback directory:", error instanceof Error ? error.message : "unknown error");
      process.exitCode = 1;
    }
  }
}
