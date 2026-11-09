"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Hand,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Snowflake,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { birds, birdById, birdSvg, type BirdId } from "../lib/birds";
import { penaltyPowers, penaltyRivals } from "../lib/penalty-powers";
import {
  Shootout,
  insideNet,
  penaltyPoint,
  penaltyViewport,
  type PenaltySnapshot,
  type Point,
} from "../lib/shootout";
import { loadPenaltyArt, paintShootout } from "../lib/shootout-render";
import { TouchButton } from "./TouchButton";

function Bird({ id, className = "" }: { id: string; className?: string }) {
  const cell = birds.findIndex((b) => b.id === id);
  if (cell < 0)
    return (
      <img
        className={`bird ${className}`}
        src={
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(birdSvg(id, true))
        }
        alt=""
        draggable={false}
      />
    );
  return (
    <span className={`bird atlas-bird ${className}`} aria-hidden="true">
      <img
        src="./art/bird-team-v2.png"
        alt=""
        draggable={false}
        style={{
          left: `${(-cell % 3) * 100}%`,
          top: `${-Math.floor(cell / 3) * 100}%`,
        }}
      />
    </span>
  );
}
function Dialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
            ref.current?.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ) || [],
          ),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="dialog-overlay">
      <div
        className="dialog"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="dialog-heading">
          <h2>{title}</h2>
          <button className="icon" onClick={close} aria-label="Cerrar">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
const validBird = (id: unknown): id is BirdId => birds.some((b) => b.id === id);

export default function Penalties() {
  const [team, setTeam] = useState<BirdId[]>(["matilda", "red", "chuck"]),
    [keeper, setKeeper] = useState<BirdId>("bomb"),
    [rival, setRival] = useState(1),
    [sound, setSound] = useState(false);
  const [loaded, setLoaded] = useState(false),
    [view, setView] = useState<"team" | "game">("team"),
    [modal, setModal] = useState<"help" | "pause" | null>(null),
    [match, setMatch] = useState(0),
    [note, setNote] = useState(
      "Elige 3 pájaros. Toca uno elegido para cambiarlo.",
    );
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("jorge-penaltis-v1") || "null");
      if (p) {
        if (
          Array.isArray(p.team) &&
          p.team.length === 3 &&
          p.team.every(validBird) &&
          new Set(p.team).size === 3
        )
          setTeam(p.team);
        if (validBird(p.keeper)) setKeeper(p.keeper);
        if ([0, 1, 2].includes(p.rival)) setRival(p.rival);
        setSound(p.sound === true);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          "jorge-penaltis-v1",
          JSON.stringify({ team, keeper, rival, sound }),
        );
      } catch {}
  }, [loaded, team, keeper, rival, sound]);
  function choose(id: BirdId) {
    if (team.includes(id)) {
      setTeam(team.filter((b) => b !== id));
      setNote("Queda un hueco. Elige otro lanzador.");
    } else if (team.length < 3) {
      setTeam([...team, id]);
      setNote(
        team.length === 2 ? "¡Tu equipo está listo!" : "Elige otro lanzador.",
      );
    } else setNote("Toca primero un pájaro elegido para hacer un hueco.");
  }
  function start() {
    if (team.length === 3) {
      setModal(null);
      setMatch((m) => m + 1);
      setView("game");
    }
  }
  const home = () => {
    setModal(null);
    setView("team");
  };
  return (
    <div className={`penalty-app ${view === "game" ? "is-playing" : ""}`}>
      {view === "team" && (
        <header className="club-header">
          <div className="club-brand">
            <span>
              <Snowflake />
            </span>
            <div>
              MATHILDA<small>PENALTIS DE HIELO</small>
            </div>
          </div>
          <span className="for-jorge">El equipo de Jorge</span>
          <div className="header-buttons">
            <button
              className="icon"
              aria-label={sound ? "Desactivar sonido" : "Activar sonido"}
              onClick={() => setSound(!sound)}
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </button>
            <button
              className="icon"
              aria-label="Cómo jugar"
              onClick={() => setModal("help")}
            >
              <HelpCircle />
            </button>
          </div>
        </header>
      )}
      {view === "team" ? (
        <main className="selection-screen">
          <section className="penalty-hero">
            <img
              src="./art/hockey-arena.png"
              alt="Mathilda y sus amigos en la pista de los piggies"
            />
            <div>
              <span className="eyebrow">
                <Snowflake size={14} /> TU MOMENTO SOBRE EL HIELO
              </span>
              <h1>
                ¡A los <em>penaltis!</em>
              </h1>
              <p>
                Apunta a un hueco. Haz una gran parada.
                <br />
                <strong>¡Esta tanda es tuya, Jorge!</strong>
              </p>
              <span className="hero-pill">
                <Hand size={15} /> Con un dedo · A tu ritmo
              </span>
            </div>
          </section>
          <div className="selection-grid">
            <section className="shooters-section">
              <div className="section-title">
                <span className="step">1</span>
                <h2>Tus lanzadores</h2>
                <span className="selected-count">{team.length} de 3</span>
              </div>
              <p className="section-description">
                Cada pájaro tiene un tiro especial. ¿Quién lanza contigo?
              </p>
              <div className="shooters-grid">
                {birds.map((b) => (
                  <button
                    key={b.id}
                    className={`shooter-card ${team.includes(b.id) ? "chosen" : ""}`}
                    style={{ "--bird-tint": b.color } as CSSProperties}
                    onClick={() => choose(b.id)}
                    aria-pressed={team.includes(b.id)}
                    aria-label={`Elegir lanzador ${b.name}`}
                  >
                    <span className="choose-check">
                      {team.includes(b.id) && <Check size={16} />}
                    </span>
                    <Bird id={b.id} />
                    <strong>{b.name}</strong>
                    <span className="ability-name">
                      <Sparkles size={14} />
                      {penaltyPowers[b.id].shot}
                    </span>
                    <span className="ability-description">
                      {penaltyPowers[b.id].shotDetail}
                    </span>
                  </button>
                ))}
              </div>
              <p className="selection-note" role="status">
                <Hand size={15} />
                {note}
              </p>
            </section>
            <aside className="squad-panel">
              <div className="section-title">
                <span className="step gold">2</span>
                <h2>Tu portero</h2>
                <Shield size={22} />
              </div>
              <p className="section-description">
                Lo moverás de lado a lado para parar el disco.
              </p>
              <div className="keeper-grid">
                {birds.map((b) => (
                  <button
                    key={b.id}
                    className={keeper === b.id ? "chosen" : ""}
                    onClick={() => setKeeper(b.id)}
                    aria-pressed={keeper === b.id}
                    aria-label={`Elegir portero ${b.name}`}
                  >
                    <Bird id={b.id} />
                    <span>{b.name}</span>
                    {keeper === b.id && <Check size={13} />}
                  </button>
                ))}
              </div>
              <div className="keeper-ability">
                <Shield size={23} />
                <div>
                  <strong>{penaltyPowers[keeper].save}</strong>
                  <p>{penaltyPowers[keeper].saveDetail}</p>
                </div>
              </div>
              <div className="rival-title">
                <span className="step piggy">3</span>
                <h2>Los piggies</h2>
              </div>
              <div className="rivals">
                {penaltyRivals.map((r, i) => (
                  <button
                    key={r.name}
                    className={rival === i ? "chosen" : ""}
                    onClick={() => setRival(i)}
                    aria-pressed={rival === i}
                    aria-label={`${r.name}. ${r.label}`}
                  >
                    <Bird
                      id={i === 2 ? "pigking" : i === 1 ? "pighelmet" : "pig"}
                    />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
              <p className="rival-description">
                {penaltyRivals[rival].description}
              </p>
              <button
                className="primary start-match"
                disabled={team.length !== 3}
                onClick={start}
              >
                <Play fill="currentColor" size={21} />
                {team.length === 3
                  ? "¡Jugar la tanda!"
                  : `Elige ${3 - team.length} más`}
                <ArrowRight size={22} />
              </button>
              <p className="start-footnote">
                5 rondas · Tú tiras y tú paras · Sin reloj
              </p>
            </aside>
          </div>
          <div className="three-rules">
            <span>
              <Target /> Toca la portería para tirar
            </span>
            <span>
              <Hand /> Desliza al portero para parar
            </span>
            <span>
              <Sparkles /> Elige cuándo usar tus poderes
            </span>
          </div>
          <footer>
            Para Jorge, sin prisa. Inspirado en{" "}
            <a
              href="https://www.youtube.com/watch?v=L6ByDtffwCQ"
              target="_blank"
              rel="noreferrer"
            >
              Cold Justice · Angry Birds Toons ↗
            </a>
          </footer>
          <div className="quick-start">
            <div>
              {team.map((id) => (
                <Bird key={id} id={id} />
              ))}
              <span>
                +<Shield size={17} />
              </span>
              <Bird id={keeper} />
            </div>
            <button
              className="primary"
              onClick={start}
              disabled={team.length !== 3}
            >
              <Play fill="currentColor" size={18} />
              {team.length === 3
                ? "¡A los penaltis!"
                : `Elige ${3 - team.length} más`}
            </button>
          </div>
        </main>
      ) : (
        <PenaltyGame
          key={match}
          team={team}
          keeper={keeper}
          rival={rival}
          sound={sound}
          paused={modal !== null}
          onPause={() => setModal("pause")}
          onHome={home}
          onRestart={start}
          onHelp={() => setModal("help")}
          onSound={() => setSound(!sound)}
        />
      )}
      {modal === "help" && (
        <Dialog title="Una tanda, un dedo" close={() => setModal(null)}>
          <div className="help-rule">
            <Target />
            <div>
              <strong>Cuando tiras</strong>
              <p>
                Toca un hueco dentro de la portería. Puedes deslizar para
                apuntar: al soltar, sale el disco.
              </p>
            </div>
          </div>
          <div className="help-rule">
            <Hand />
            <div>
              <strong>Cuando paras</strong>
              <p>
                Coloca al portero y toca LISTO. Después desliza el dedo de lado
                a lado para seguir el disco. No hace falta tocar al personaje.
              </p>
            </div>
          </div>
          <div className="help-rule">
            <Sparkles />
            <div>
              <strong>Tus poderes</strong>
              <p>
                Activa el especial antes de tirar, o el poder del portero antes
                de parar. Tienes 2 de cada tipo para toda la tanda.
              </p>
            </div>
          </div>
          <p className="quiet-note">
            Son 5 rondas. Toca SEGUIR después de cada lanzamiento. Puedes pausar
            cuando quieras.
          </p>
          <button className="primary" onClick={() => setModal(null)}>
            ¡Lo tengo! <Check size={20} />
          </button>
        </Dialog>
      )}
      {modal === "pause" && (
        <Dialog title="Un descansito" close={() => setModal(null)}>
          <div className="pause-bird">
            <Bird id={keeper} />
          </div>
          <p className="pause-copy">
            La tanda te espera.
            <br />
            Seguimos cuando tú quieras, Jorge.
          </p>
          <button className="primary" onClick={() => setModal(null)}>
            <Play fill="currentColor" size={20} />
            Seguir jugando
          </button>
          <div className="dialog-secondary">
            <button onClick={start}>
              <RotateCcw size={17} />
              Otra tanda
            </button>
            <button onClick={home}>
              <ArrowLeft size={17} />
              Cambiar equipo
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ShotDots({
  shots,
  rounds,
  ours,
}: {
  shots: string[];
  rounds: number;
  ours: boolean;
}) {
  return (
    <div
      className={`shot-dots ${ours ? "ours" : "theirs"}`}
      aria-label={
        shots
          .map((s, i) => `Tiro ${i + 1}: ${s === "goal" ? "gol" : "parada"}`)
          .join(", ") || "Ningún lanzamiento todavía"
      }
    >
      {Array.from({ length: rounds }, (_, i) => (
        <span key={i} className={shots[i] || "waiting"}>
          {shots[i] === "goal" ? (
            <Check size={13} />
          ) : shots[i] === "saved" ? (
            <X size={12} />
          ) : null}
        </span>
      ))}
    </div>
  );
}

function PenaltyGame({
  team,
  keeper,
  rival,
  sound,
  paused,
  onPause,
  onHome,
  onRestart,
  onHelp,
  onSound,
}: {
  team: BirdId[];
  keeper: BirdId;
  rival: number;
  sound: boolean;
  paused: boolean;
  onPause: () => void;
  onHome: () => void;
  onRestart: () => void;
  onHelp: () => void;
  onSound: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<Shootout | null>(null),
    pointer = useRef<number | null>(null),
    audio = useRef<AudioContext | null>(null),
    soundRef = useRef(sound),
    lastResults = useRef(0);
  const [state, setState] = useState<PenaltySnapshot>(() =>
    new Shootout(team, keeper, rival).snapshot(),
  );
  soundRef.current = sound;
  function unlockAudio() {
    if (!soundRef.current) return;
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {}
  }
  function tone(good: boolean) {
    if (!soundRef.current || !audio.current) return;
    try {
      const ctx = audio.current,
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = good ? 660 : 330;
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
  useEffect(() => {
    if (!canvas.current) return;
    const stage = canvas.current,
      art = loadPenaltyArt();
    const g = new Shootout(team, keeper, rival, (s) => {
      setState(s);
      const total = s.ourShots.length + s.pigShots.length;
      if (total > lastResults.current) {
        lastResults.current = total;
        tone(
          s.turn === "attack" ? s.outcome === "goal" : s.outcome === "saved",
        );
      }
    });
    engine.current = g;
    let raf = 0,
      last = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.04);
      last = now;
      g.update(dt);
      paintShootout(stage, g, art);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      engine.current = null;
      void audio.current?.close();
      audio.current = null;
    };
  }, [team, keeper, rival]);
  useEffect(() => {
    engine.current?.pause(paused);
    if (paused) pointer.current = null;
  }, [paused]);
  useEffect(() => {
    const blur = () => onPause();
    const visible = () => {
      if (document.hidden) onPause();
    };
    const key = (e: KeyboardEvent) => {
      if (paused) return;
      const g = engine.current;
      if (!g) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onPause();
        return;
      }
      if ((e.target as HTMLElement)?.closest("button")) return;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          " ",
          "Enter",
        ].includes(e.key)
      )
        e.preventDefault();
      if (e.key.startsWith("Arrow")) {
        if (g.turn === "defend") {
          if (e.key === "ArrowLeft") g.moveKeeper(g.keeperX - 35);
          if (e.key === "ArrowRight") g.moveKeeper(g.keeperX + 35);
        } else if (g.phase === "aim") {
          const p = g.aim || { x: 500, y: 270 };
          g.setAim({
            x: Math.max(
              170,
              Math.min(
                830,
                p.x +
                  (e.key === "ArrowRight"
                    ? 35
                    : e.key === "ArrowLeft"
                      ? -35
                      : 0),
              ),
            ),
            y: Math.max(
              148,
              Math.min(
                388,
                p.y +
                  (e.key === "ArrowDown" ? 25 : e.key === "ArrowUp" ? -25 : 0),
              ),
            ),
          });
        }
      }
      if (!e.repeat && (e.key === " " || e.key === "Enter")) {
        unlockAudio();
        if (g.phase === "aim") g.shoot(g.aim || { x: 500, y: 270 });
        else if (g.phase === "ready") g.ready();
        else if (g.phase === "result") g.next();
      }
    };
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("keydown", key);
    };
  }, [paused, onPause]);
  function point(e: React.PointerEvent, allowOutside = false): Point | null {
    const r = e.currentTarget.getBoundingClientRect();
    if (allowOutside) {
      const v = penaltyViewport(r.width, r.height);
      return {
        x: Math.max(0, Math.min(1000, (e.clientX - r.left - v.x) / v.scale)),
        y: Math.max(0, Math.min(700, (e.clientY - r.top - v.y) / v.scale)),
      };
    }
    return penaltyPoint(
      e.clientX - r.left,
      e.clientY - r.top,
      r.width,
      r.height,
    );
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = engine.current;
    if (
      !g ||
      paused ||
      pointer.current !== null ||
      !["aim", "ready", "windup", "flight"].includes(g.phase)
    )
      return;
    if (g.turn === "attack" && g.phase !== "aim") return;
    const p = point(e);
    if (!p) return;
    e.preventDefault();
    unlockAudio();
    pointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (g.turn === "attack") g.setAim(p);
    else g.moveKeeper(p.x);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId || paused) return;
    e.preventDefault();
    const g = engine.current,
      p = point(e, true);
    if (!g || !p) return;
    if (g.turn === "attack") g.setAim(p);
    else g.moveKeeper(p.x);
  }
  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    const g = engine.current,
      p = point(e);
    if (g && !paused && g.turn === "attack") {
      if (p && insideNet(p)) g.shoot(p);
      else g.setAim(null);
    }
  }
  const attack = state.turn === "attack",
    result = state.phase === "result",
    done = state.phase === "finished";
  const powers = penaltyPowers[attack ? state.shooter : keeper],
    charged = attack
      ? state.shotArmed
      : state.keeperArmed || state.keeperActive;
  const charges = attack ? state.shotCharges : state.keeperCharges,
    good = attack ? state.outcome === "goal" : state.outcome === "saved";
  const powerEnabled =
    !paused &&
    (attack
      ? state.phase === "aim" && state.shotCharges > 0
      : ["ready", "windup", "flight"].includes(state.phase) &&
        state.keeperCharges > 0 &&
        !state.powerUsed);
  return (
    <main className={`penalty-screen ${attack ? "attacking" : "defending"}`}>
      <header className="match-header">
        <TouchButton
          className="icon back-icon"
          onPress={onPause}
          aria-label="Pausar y volver al equipo"
        >
          <ArrowLeft />
        </TouchButton>
        <div className="mini-team">
          <Bird id={team[0]} />
          <div>
            <strong>Jorge</strong>
            <ShotDots shots={state.ourShots} rounds={state.rounds} ours />
          </div>
        </div>
        <div className="match-score">
          <span>{state.ours}</span>
          <b>:</b>
          <span>{state.theirs}</span>
        </div>
        <div className="mini-team pig-team">
          <div>
            <strong>Piggies</strong>
            <ShotDots
              shots={state.pigShots}
              rounds={state.rounds}
              ours={false}
            />
          </div>
          <Bird id={rival === 2 ? "pigking" : "pighelmet"} />
        </div>
        <div className="match-header-buttons">
          <button
            className="icon"
            onClick={() => {
              unlockAudio();
              onSound();
            }}
            aria-label={sound ? "Desactivar sonido" : "Activar sonido"}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <TouchButton className="pause-control" onPress={onPause}>
            <Pause size={19} />
            Pausa
          </TouchButton>
        </div>
      </header>
      <section className="turn-bar">
        <span className={`turn-badge ${attack ? "blue" : "gold"}`}>
          {attack ? <Target size={18} /> : <Shield size={18} />}{" "}
          {done ? "TANDA TERMINADA" : attack ? "TIRAS TÚ" : "AHORA PARAS"}
        </span>
        <strong>
          {done
            ? "¡Bien jugado, Jorge!"
            : result
              ? "Mira el resultado y toca SEGUIR"
              : state.phase === "flight"
                ? attack
                  ? "¡Ahí va tu tiro!"
                  : "¡Sigue el disco con tu portero!"
                : state.phase === "windup"
                  ? "¡Prepárate para parar!"
                  : attack
                    ? "Toca un hueco de la portería"
                    : "Coloca al portero y toca LISTO"}
        </strong>
        <span className="round-label">
          Ronda {Math.min(state.round, state.rounds)} de {state.rounds}
        </span>
      </section>
      <div className="penalty-stage">
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label={
            attack
              ? "Portería: toca un hueco o arrastra y suelta para tirar"
              : "Portería: arrastra de lado a lado para mover al portero"
          }
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => {
            pointer.current = null;
            engine.current?.setAim(null);
          }}
          onLostPointerCapture={() => {
            pointer.current = null;
          }}
        />
        {paused && <div className="paused-veil" />}
      </div>
      <aside className={`turn-panel ${result ? "show-result" : ""}`}>
        {!done ? (
          <>
            <div className="turn-character">
              <span className="role-label">
                {attack ? "TU LANZADOR" : "TU PORTERO"}
              </span>
              <Bird id={attack ? state.shooter : keeper} />
              <h2>{birdById(attack ? state.shooter : keeper).name}</h2>
            </div>
            {!result ? (
              <>
                <TouchButton
                  className={`power-button ${charged ? "armed" : ""}`}
                  disabled={!powerEnabled}
                  onPress={() => {
                    unlockAudio();
                    attack
                      ? engine.current?.toggleShot()
                      : engine.current?.toggleKeeper();
                  }}
                  aria-label={`${attack ? "Tiro especial" : "Poder de portero"}: ${attack ? powers.shot : powers.save}`}
                  aria-pressed={charged}
                >
                  <span className="power-icon">
                    {attack ? <Sparkles size={28} /> : <Shield size={28} />}
                  </span>
                  <span>
                    <strong>
                      {attack ? "TIRO ESPECIAL" : "PODER DE PORTERO"}
                    </strong>
                    <b>{attack ? powers.shot : powers.save}</b>
                  </span>
                  <span className="power-check">
                    {charged ? <Check size={20} /> : null}
                  </span>
                  <span className="power-charges">
                    <i className={charges > 0 ? "filled" : ""} />
                    <i className={charges > 1 ? "filled" : ""} />
                    <em>
                      {charges} {charges === 1 ? "uso" : "usos"}
                    </em>
                  </span>
                </TouchButton>
                <p className="power-description">
                  {charged
                    ? state.phase === "flight"
                      ? attack
                        ? "¡Tu especial va a portería!"
                        : "¡Poder de portero activado!"
                      : attack
                        ? "¡Preparado! Toca un hueco para lanzar tu especial."
                        : "¡Preparado! Tu poder ayudará en esta parada."
                    : attack
                      ? powers.shotDetail
                      : powers.saveDetail}
                </p>
                {state.phase === "ready" ? (
                  <TouchButton
                    className="primary ready-button"
                    onPress={() => {
                      unlockAudio();
                      engine.current?.ready();
                    }}
                  >
                    <Play fill="currentColor" size={21} />
                    ¡LISTO!
                  </TouchButton>
                ) : (
                  <div className="gesture-hint">
                    {attack ? <Hand size={27} /> : <ArrowRight size={27} />}
                    <span>
                      {attack
                        ? state.phase === "flight"
                          ? "¡Ahí va el disco!"
                          : "Toca o desliza en la portería. Suelta para tirar."
                        : "Mueve el dedo por la pista. El portero sigue tu mano."}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className={`shot-result ${good ? "good" : ""}`}>
                <span className="result-symbol">
                  {good ? <Trophy size={34} /> : <Shield size={34} />}
                </span>
                <h3>
                  {attack
                    ? state.outcome === "goal"
                      ? "¡Gooool!"
                      : "¡La ha parado!"
                    : state.outcome === "saved"
                      ? "¡Paradón!"
                      : "Gol de los piggies"}
                </h3>
                <p>
                  {!attack && state.pigShots.length === state.rounds
                    ? "¡Tanda completa! Mira el marcador."
                    : attack
                      ? "Ahora te toca ser portero."
                      : "Ahora te toca tirar."}
                </p>
                <TouchButton
                  className="primary next-button"
                  onPress={() => engine.current?.next()}
                >
                  SEGUIR <ArrowRight size={22} />
                </TouchButton>
              </div>
            )}
            <TouchButton className="text-button how-button" onPress={onHelp}>
              <HelpCircle size={16} />
              Cómo jugar
            </TouchButton>
          </>
        ) : (
          <div className="tanda-result">
            <Trophy size={58} />
            <span className="role-label">TANDA COMPLETA</span>
            <h2>
              {state.ours > state.theirs
                ? "¡Has ganado!"
                : state.ours === state.theirs
                  ? "¡Empate!"
                  : "¡Buen partido!"}
            </h2>
            <p>
              {state.ours === state.theirs
                ? "¿Jugamos una ronda de desempate?"
                : state.ours > state.theirs
                  ? "¡Qué equipo, Jorge!"
                  : "Los piggies ganan esta tanda. ¡Vamos a por otra!"}
            </p>
            {state.ours === state.theirs && (
              <button
                className="primary"
                onClick={() => engine.current?.extraRound()}
              >
                Desempatar <ArrowRight size={20} />
              </button>
            )}
            <button
              className={state.ours === state.theirs ? "secondary" : "primary"}
              onClick={onRestart}
            >
              <RotateCcw size={20} />
              Otra tanda
            </button>
            <button className="text-button" onClick={onHome}>
              <ArrowLeft size={17} />
              Cambiar equipo
            </button>
          </div>
        )}
      </aside>
      <div
        className={`match-message ${result && good ? "celebrate" : ""}`}
        role="status"
        aria-live="polite"
      >
        <span />
        {state.message}
      </div>
    </main>
  );
}
