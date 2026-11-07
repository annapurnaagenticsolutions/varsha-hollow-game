import { useState } from "react";
import type { GameState } from "@/game/types";

interface Props {
  state: GameState;
  arc: "one" | "two";
}

function makeReport(state: GameState, arc: Props["arc"], rating: number, replay: string, comments: string) {
  // No device identifiers, email, IP address or automatic transmission.
  return {
    schema: "varsha-playtest-v1",
    game: "Varsha Hollow",
    build: "1.2.0-alpha",
    arc,
    enjoyment_rating: rating,
    would_play_again: replay,
    comments: comments.trim().slice(0, 1200),
    scenes_completed: state.sceneIndex,
    decision_count: state.decisions.length,
    // Choice IDs are shared only through an explicit player action.
    choices: state.decisions.map(({ sceneId, choiceId }) => ({ sceneId, choiceId })),
  };
}

export default function PlaytestFeedback({ state, arc }: Props) {
  const [rating, setRating] = useState(0);
  const [replay, setReplay] = useState("");
  const [comments, setComments] = useState("");
  const [copied, setCopied] = useState(false);
  const configuredUrl = import.meta.env.VITE_FEEDBACK_URL as string | undefined;
  const feedbackUrl = configuredUrl && /^https:\/\//i.test(configuredUrl) ? configuredUrl : null;
  const report = JSON.stringify(makeReport(state, arc, rating, replay, comments), null, 2);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function downloadReport() {
    const blob = new Blob([report], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `varsha-playtest-${arc}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="playtest-feedback" aria-labelledby="playtest-title">
      <h2 id="playtest-title">Help improve Varsha Hollow</h2>
      <p>This short survey is optional. Your answers and choices stay on your device unless you explicitly copy, download, or share them. No automatic analytics are sent.</p>
      <fieldset>
        <legend>How much did you enjoy this arc?</legend>
        <div className="feedback-rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" aria-label={`Rate ${value} out of 5`} aria-pressed={rating === value}
              className={rating === value ? "selected" : ""} onClick={() => setRating(value)}>{value}</button>
          ))}
        </div>
      </fieldset>
      <label htmlFor="feedback-replay">Would you choose to play the next chapter?</label>
      <select id="feedback-replay" value={replay} onChange={(event) => setReplay(event.target.value)}>
        <option value="">Select an answer</option>
        <option value="yes">Yes</option>
        <option value="maybe">Maybe</option>
        <option value="no">No</option>
      </select>
      <label htmlFor="feedback-comments">What worked, and what should change?</label>
      <textarea id="feedback-comments" value={comments} maxLength={1200} rows={4}
        placeholder="What did you enjoy, dislike, or find confusing?"
        onChange={(event) => setComments(event.target.value)} />
      <div className="feedback-actions">
        <button type="button" className="secondary-action" onClick={copyReport}>Copy feedback JSON</button>
        <button type="button" className="secondary-action" onClick={downloadReport}>Download feedback JSON</button>
        {feedbackUrl && <a className="secondary-action" href={feedbackUrl} target="_blank" rel="noopener noreferrer">Open feedback form</a>}
      </div>
      {copied && <p role="status">Copied. Paste the report into your feedback channel. It has not been sent automatically.</p>}
      {!feedbackUrl && <small>To submit feedback, share the downloaded report with the person who invited you to test.</small>}
    </section>
  );
}
