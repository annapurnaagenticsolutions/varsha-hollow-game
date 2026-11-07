import { test } from "node:test";
import { strict as assert } from "node:assert";
import { summarizeReports } from "../tools/feedback-summary.mjs";

test("aggregates voluntary reports while excluding comments and decisions", () => {
  const reports = [
    { schema: "varsha-playtest-v1", game: "Varsha Hollow", arc: "one", enjoyment_rating: 5, would_play_again: "yes", scenes_completed: 15, comments: "private text", choices: [{ choiceId: "secret" }] },
    { schema: "varsha-playtest-v1", game: "Varsha Hollow", arc: "two", enjoyment_rating: 3, would_play_again: "maybe", scenes_completed: 30 },
    { schema: "invalid", game: "Other", enjoyment_rating: 1 },
  ];
  const result = summarizeReports(reports);
  assert.equal(result.collected_reports, 2);
  assert.equal(result.ratings.mean, 4);
  assert.equal(result.would_play_again.counts.yes, 1);
  assert.equal(result.arc.two, 1);
  assert.equal(result.completed_scene_count.mean, 22.5);
  assert.ok(!JSON.stringify(result).includes("private text"));
  assert.ok(!JSON.stringify(result).includes("secret"));
});

test("reports missing survey responses without dividing by zero", () => {
  const result = summarizeReports([{ schema: "varsha-playtest-v1", game: "Varsha Hollow" }]);
  assert.equal(result.ratings.mean, null);
  assert.equal(result.would_play_again.responses, 0);
});
