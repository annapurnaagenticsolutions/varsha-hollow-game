import {
  BookOpen,
  Brain,
  ChevronRight,
  CloudRain,
  Droplets,
  Hammer,
  Heart,
  Home as HomeIcon,
  MapPin,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { scenes } from "@/game/chapters";
import {
  applyChoice,
  clearSave,
  createInitialState,
  evaluateArc,
  evaluateArcTwo,
  completeArc,
  getLegacyConsequences,
  loadGame,
  saveGame,
} from "@/game/engine";
import type { Choice, GameState, StatKey, TrainingChallenge as TrainingChallengeType } from "@/game/types";

const statMeta: Record<StatKey, { label: string; icon: typeof Heart; color: string }> = {
  empathy: { label: "Empathy", icon: Heart, color: "rose" },
  wisdom: { label: "Wisdom", icon: Brain, color: "blue" },
  practicality: { label: "Practicality", icon: Hammer, color: "ochre" },
};

const companionMeta = [
  { key: "meera" as const, name: "Meera", role: "Builder", initials: "ME" },
  { key: "leela" as const, name: "Leela", role: "Organizer", initials: "LE" },
  { key: "tara" as const, name: "Tara", role: "Scout", initials: "TA" },
  { key: "kabir" as const, name: "Kabir", role: "Healer", initials: "KA" },
  { key: "dev" as const, name: "Dev", role: "Guardian", initials: "DE" },
];

function SlimeMark({ active = true, kind = "dew" }: { active?: boolean; kind?: "dew" | "clay" }) {
  return (
    <span className={`slime-mark ${kind} ${active ? "active" : "locked"}`} aria-hidden="true">
      <span className="slime-eye left" />
      <span className="slime-eye right" />
      <span className="slime-shine" />
    </span>
  );
}

function Meter({ value, max = 10, tone }: { value: number; max?: number; tone: string }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <span className="meter" aria-label={`${value} out of ${max}`}>
      <span className={`meter-fill ${tone}`} style={{ width: `${percent}%` }} />
    </span>
  );
}

function GameLedger({ state }: { state: GameState }) {
  const arcTwoVisible = state.sceneIndex >= 15 || state.unlockedSlimes.includes("clay");
  return (
    <div className="ledger-stack">
      <section className="ledger-card village-card">
        <div className="ledger-heading">
          <span>
            <HomeIcon size={17} /> Village ledger
          </span>
          <strong>{state.village.stage}</strong>
        </div>
        <Meter value={state.prosperity} max={100} tone="green" />
        <div className="village-grid">
          <div><Users size={15} /><strong>{state.village.population}</strong><span>Residents</span></div>
          <div><Droplets size={15} /><strong>{state.village.waterSecurity}%</strong><span>Water security</span></div>
          <div><HomeIcon size={15} /><strong>{state.village.safeRoofs}</strong><span>Safe roofs</span></div>
          <div><Sparkles size={15} /><strong>{state.unlockedSlimes.length}</strong><span>Slime families</span></div>
        </div>
      </section>

      {arcTwoVisible && (
        <section className="ledger-card roof-card">
          <div className="ledger-heading"><span><ShieldCheck size={16} /> Roof operation</span><small>{state.roofLedger.inspected}/{state.roofLedger.total} inspected</small></div>
          <div className="roof-status-grid">
            <div><strong>{state.roofLedger.unsafe}</strong><span>Unsafe</span></div>
            <div><strong>{state.roofLedger.secured}</strong><span>Secured</span></div>
          </div>
          <div className="resource-heading"><PackageOpen size={14} /> Remaining resources</div>
          <div className="resource-grid">
            <span><strong>{state.resources.timber}</strong> Timber</span>
            <span><strong>{state.resources.tiles}</strong> Tile</span>
            <span><strong>{state.resources.canvas}</strong> Canvas</span>
            <span><strong>{state.resources.crewEnergy}</strong> Crew energy</span>
          </div>
        </section>
      )}

      <section className="ledger-card">
        <div className="ledger-heading"><span>Neel's approach</span><small>0–10</small></div>
        <div className="stat-list">
          {(Object.keys(statMeta) as StatKey[]).map((key) => {
            const meta = statMeta[key];
            const Icon = meta.icon;
            return (
              <div className="stat-row" key={key}>
                <Icon size={16} />
                <span>{meta.label}</span>
                <Meter value={state.stats[key]} tone={meta.color} />
                <strong>{state.stats[key]}</strong>
              </div>
            );
          })}
          <div className="stat-row trust-row">
            <SlimeMark active />
            <span>Slime trust</span>
            <Meter value={state.slimeTrust} max={40} tone="aqua" />
            <strong>{state.slimeTrust}</strong>
          </div>
        </div>
      </section>

      <section className="ledger-card">
        <div className="ledger-heading"><span>Companions</span><small>Loyalty is earned</small></div>
        <div className="companion-list">
          {companionMeta.map((person) => {
            const value = state.relationships[person.key];
            const introduced = person.key === "meera" || (person.key === "dev" && state.decisions.some((decision) => decision.sceneId === "ledger-dev"));
            return (
              <div className={`companion ${introduced ? "" : "future"}`} key={person.key}>
                <span className="portrait">{introduced ? person.initials : "?"}</span>
                <span><strong>{introduced ? person.name : "Not met"}</strong><small>{introduced ? person.role : person.role}</small></span>
                <span className="bond">{introduced ? `${value}/10` : "—"}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ledger-card slime-card">
        <div className="ledger-heading"><span>Slime partners</span><small>{state.unlockedSlimes.length}/5</small></div>
        {state.unlockedSlimes.includes("dew") ? (
          <div className="slime-partner-list">
            <div className="slime-unlocked"><SlimeMark /><span><strong>Boond</strong><small>Dew Slime · rhythm learner</small></span></div>
            {state.unlockedSlimes.includes("clay") && (
              <div className="slime-unlocked"><SlimeMark kind="clay" /><span><strong>Mitti</strong><small>Clay Slime · tactile learner</small></span></div>
            )}
          </div>
        ) : (
          <div className="slime-unknown"><SlimeMark active={false} /><span>Observe before you name.</span></div>
        )}
      </section>
    </div>
  );
}

function Landing({ saved, onBegin, onContinue }: { saved: GameState | null; onBegin: () => void; onContinue: () => void }) {
  return (
    <main className="landing-shell">
      <div className="weather weather-one" />
      <div className="weather weather-two" />
      <section className="landing-copy">
        <div className="eyebrow"><CloudRain size={16} /> An original village-building fantasy</div>
        <div className="title-lockup">
          <SlimeMark />
          <p>VARSHΛ HOLLOW</p>
        </div>
        <h1>The Slime Shepherd</h1>
        <p className="landing-lead">
          A dying village. Six frightened slimes. One failed student who can feel what they cannot say.
        </p>
        <div className="landing-actions">
          {saved && saved.sceneIndex < scenes.length && (
            <button className="primary-action" onClick={onContinue}>
              Continue chapter {scenes[saved.sceneIndex]?.chapter ?? 1}<ChevronRight size={18} />
            </button>
          )}
          <button className={saved ? "secondary-action" : "primary-action"} onClick={onBegin}>
            {saved ? "Begin again" : "Begin the journey"}<ChevronRight size={18} />
          </button>
        </div>
        <div className="landing-notes">
          <span><ShieldCheck size={15} /> Choices autosave on this device</span>
          <span><Droplets size={15} /> Playable Chapters 1–10 · 30 decisions</span>
        </div>
      </section>

      <section className="landing-scene" aria-label="Rain shrine illustration">
        <div className="moon" />
        <div className="mountain m1" />
        <div className="mountain m2" />
        <div className="shrine">
          <span className="roof roof-top" />
          <span className="roof roof-low" />
          <span className="pillar p1" />
          <span className="pillar p2" />
          <span className="door" />
        </div>
        <div className="reservoir" />
        <div className="scene-slime"><SlimeMark /></div>
        <div className="mist mist-one" />
        <div className="mist mist-two" />
        <blockquote>“Training is not control. It is learning how another being understands the world.”</blockquote>
      </section>
    </main>
  );
}

function ArcTransition({ state, onContinue, onRestart }: { state: GameState; onContinue: () => void; onRestart: () => void }) {
  const evaluation = evaluateArc(state);
  return (
    <main className="completion-shell">
      <section className="completion-card arc-transition-card">
        <div className="completion-slime"><SlimeMark /></div>
        <p className="eyebrow">Arc One complete</p>
        <h1>{evaluation.title}</h1>
        <p className="completion-lead">{evaluation.description}</p>
        <div className="evaluation-grid">
          <div><small>Demonstrated strength</small><strong>{evaluation.strength}</strong></div>
          <div><small>The next lesson</small><strong>{evaluation.nextLesson}</strong></div>
        </div>
        <div className="arc-result">
          <h2>The Hollow after seven days</h2>
          <p>The water emergency is measurable, Boond's family has a safe habitat, and the village has learned that refusal and recovery belong in the plan.</p>
          <div className="result-numbers">
            <span><strong>{state.village.waterSecurity}%</strong> water security</span>
            <span><strong>{state.slimeTrust}</strong> slime trust</span>
            <span><strong>{state.relationships.meera}/10</strong> Meera bond</span>
          </div>
        </div>
        <div className="next-arc">
          <span>Arc Two</span>
          <h3>Forty Roofs Before the Rain</h3>
          <p>Eleven roofs are dangerous. Clay Slimes can shape earth—but first the village must learn what their shapes mean.</p>
        </div>
        <div className="completion-actions">
          <button className="primary-action" onClick={onContinue}>Begin Arc Two <ChevronRight size={17} /></button>
          <button className="secondary-action" onClick={onRestart}><RotateCcw size={17} /> Replay Arc One</button>
        </div>
      </section>
    </main>
  );
}

function Completion({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const evaluation = evaluateArcTwo(state);
  return (
    <main className="completion-shell">
      <section className="completion-card">
        <div className="completion-slime completion-pair"><SlimeMark /><SlimeMark kind="clay" /></div>
        <p className="eyebrow">Arc Two complete</p>
        <h1>{evaluation.title}</h1>
        <p className="completion-lead">{evaluation.description}</p>
        <div className="evaluation-grid">
          <div><small>Demonstrated strength</small><strong>{evaluation.strength}</strong></div>
          <div><small>The next lesson</small><strong>{evaluation.nextLesson}</strong></div>
        </div>
        <div className="arc-result">
          <h2>Recovery begins</h2>
          <p>
            All forty roofs have been inspected. Eleven dangerous roofs are secured or closed, the schoolroom is a storm shelter,
            and the village now works through named craft leads, public priorities, and protected rest.
          </p>
          <div className="result-numbers">
            <span><strong>{state.roofLedger.inspected}/{state.roofLedger.total}</strong> roofs inspected</span>
            <span><strong>{state.roofLedger.secured}</strong> roofs secured</span>
            <span><strong>{state.village.stage}</strong> village stage</span>
          </div>
        </div>
        <div className="next-arc">
          <span>Next planned arc</span>
          <h3>The Seven-Stall Promise</h3>
          <p>Recovery will attract traders, pressure, and Leela—the specialist who refuses to let generosity become fraud.</p>
        </div>
        <button className="secondary-action" onClick={onRestart}><RotateCcw size={17} /> Replay Chapters 1–10</button>
      </section>
    </main>
  );
}

function TrainingChallenge({
  challenge,
  selected,
  feedback,
  onSelect,
}: {
  challenge: TrainingChallengeType;
  selected: string[];
  feedback: { type: "success" | "retry"; message: string } | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className={`training-panel ${feedback?.type ?? ""}`}>
      <div className="training-heading"><SlimeMark kind="clay" /><span><strong>{challenge.title}</strong>{challenge.prompt}</span></div>
      <div className="training-sequence" aria-label="Tactile marker sequence">
        {challenge.steps.map((step) => (
          <button key={step.id} disabled={selected.includes(step.id) || feedback?.type === "success"} onClick={() => onSelect(step.id)}>
            <span>{step.symbol}</span><strong>{step.label}</strong>
          </button>
        ))}
      </div>
      <div className="selected-sequence">
        {selected.length ? selected.map((id, index) => <span key={`${id}-${index}`}>{challenge.steps.find((step) => step.id === id)?.symbol}</span>) : <small>No markers placed yet</small>}
      </div>
      {feedback && <p className="training-feedback" aria-live="polite">{feedback.message}</p>}
    </section>
  );
}

export default function Home() {
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  const [playing, setPlaying] = useState(false);
  const [resolution, setResolution] = useState<Choice | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [trainingSteps, setTrainingSteps] = useState<string[]>([]);
  const [trainingFeedback, setTrainingFeedback] = useState<{ type: "success" | "retry"; message: string } | null>(null);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  const scene = game && game.sceneIndex < scenes.length ? scenes[game.sceneIndex] : null;
  const progress = game ? Math.round((Math.min(game.sceneIndex, scenes.length) / scenes.length) * 100) : 0;
  const chapterSceneCount = useMemo(() => scene ? scenes.filter((item) => item.chapter === scene.chapter).length : 0, [scene]);
  const chapterSceneIndex = scene ? scenes.filter((item) => item.chapter === scene.chapter).findIndex((item) => item.id === scene.id) + 1 : 0;
  const legacyConsequences = useMemo(() => game && scene ? getLegacyConsequences(scene, game) : [], [game, scene]);
  const activeArc = scene && scene.chapter <= 5 ? 1 : 2;
  const arcChapters = activeArc === 1 ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10];
  const trainingComplete = !scene?.training || trainingFeedback?.type === "success";

  const begin = () => {
    clearSave();
    setGame(createInitialState());
    setResolution(null);
    setTrainingSteps([]);
    setTrainingFeedback(null);
    setPlaying(true);
  };

  const choose = (choice: Choice) => {
    if (!resolution) setResolution(choice);
  };

  const continueStory = () => {
    if (!game || !scene || !resolution) return;
    setGame(applyChoice(game, scene, resolution));
    setResolution(null);
    setTrainingSteps([]);
    setTrainingFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    clearSave();
    setGame(createInitialState());
    setResolution(null);
    setTrainingSteps([]);
    setTrainingFeedback(null);
    setPlaying(true);
  };

  const chooseTrainingStep = (id: string) => {
    if (!scene?.training || trainingFeedback?.type === "success") return;
    const next = [...trainingSteps, id];
    const expected = scene.training.correctOrder;
    const validPrefix = next.every((step, index) => step === expected[index]);
    if (!validPrefix) {
      setTrainingSteps([]);
      setTrainingFeedback({ type: "retry", message: scene.training.retry });
      return;
    }
    setTrainingSteps(next);
    if (next.length === expected.length) {
      setTrainingFeedback({ type: "success", message: scene.training.success });
    } else {
      setTrainingFeedback(null);
    }
  };

  if (!playing) {
    return <Landing saved={game} onBegin={begin} onContinue={() => setPlaying(true)} />;
  }

  if (game && game.sceneIndex >= scenes.length) {
    return <Completion state={game} onRestart={restart} />;
  }

  if (game && game.sceneIndex === 15 && !game.completedArcs.includes(1)) {
    return <ArcTransition state={game} onContinue={() => setGame(completeArc(game, 1))} onRestart={restart} />;
  }

  if (!game || !scene) return null;

  return (
    <div className="game-shell">
      <header className="game-header">
        <button className="brand-button" onClick={() => setPlaying(false)} aria-label="Return to title">
          <SlimeMark /><span><strong>Varsha Hollow</strong><small>The Slime Shepherd</small></span>
        </button>
        <div className="journey-progress">
          <span><BookOpen size={15} /> Arc {activeArc === 1 ? "One" : "Two"} · {progress}% overall</span>
          <Meter value={progress} max={100} tone="green" />
        </div>
        <button className="ledger-toggle" onClick={() => setLedgerOpen(!ledgerOpen)}>
          <HomeIcon size={17} /> Ledger
        </button>
      </header>

      <div className="game-layout">
        <aside className={`game-ledger ${ledgerOpen ? "open" : ""}`}>
          <GameLedger state={game} />
        </aside>

        <main className="story-column">
          <div className="chapter-route">
            {arcChapters.map((number) => (
              <span key={number} className={number < scene.chapter ? "done" : number === scene.chapter ? "current" : ""}>
                {number < scene.chapter ? "✓" : number}
              </span>
            ))}
          </div>

          <article className="story-card">
            <div className="story-meta">
              <span>Chapter {scene.chapter} of 10</span>
              <span>Scene {chapterSceneIndex} of {chapterSceneCount}</span>
            </div>
            {scene.image && (
              <figure className="chapter-art">
                <img src={scene.image} alt={`Anime fantasy illustration for Chapter ${scene.chapter}: ${scene.chapterTitle}`} />
              </figure>
            )}
            <h1>{scene.chapterTitle}</h1>
            <p className="scene-label">{scene.sceneLabel}</p>
            <div className="place-line"><MapPin size={15} /> {scene.location}<span />{scene.time}</div>

            <div className="story-text">
              {scene.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>

            {scene.signal && (
              <aside className="signal-note">
                <SlimeMark /><span><strong>Shepherd's observation</strong>{scene.signal}</span>
              </aside>
            )}

            {legacyConsequences.map((consequence) => (
              <aside className="legacy-note" key={consequence.label}>
                <Sparkles size={16} /><span><strong>{consequence.label}</strong>{consequence.paragraph}</span>
              </aside>
            ))}

            {scene.training && (
              <TrainingChallenge challenge={scene.training} selected={trainingSteps} feedback={trainingFeedback} onSelect={chooseTrainingStep} />
            )}

            {!resolution && trainingComplete ? (
              <section className="choice-panel">
                <h2>{scene.prompt}</h2>
                <p>There is no perfect personality. Choose the response that feels true to your Neel.</p>
                <div className="choice-list">
                  {scene.choices.map((choice) => (
                    <button key={choice.id} className="choice-button" onClick={() => choose(choice)}>
                      <span className={`approach ${choice.approach.toLowerCase()}`}>{choice.approach}</span>
                      <strong>{choice.label}</strong>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              </section>
            ) : resolution ? (
              <section className="resolution-panel" aria-live="polite">
                <span className={`approach ${resolution.approach.toLowerCase()}`}>{resolution.approach}</span>
                <h2>Your choice changes the moment</h2>
                <p>{resolution.result}</p>
                <div className="reflection"><Sparkles size={16} /><span>{resolution.reflection}</span></div>
                <button className="primary-action" onClick={continueStory}>
                  {game.sceneIndex === scenes.length - 1 ? "Complete the arc" : "Continue"}<ChevronRight size={18} />
                </button>
              </section>
            ) : (
              <section className="choice-panel training-locked"><h2>Complete Meera's tactile lesson</h2><p>The repair choices unlock after the marker sequence is safe.</p></section>
            )}
          </article>
        </main>
      </div>
    </div>
  );
}
