"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CircleHelp,
  Volume2,
  VolumeX,
  Settings2,
  X,
  Play,
  Pause,
  RotateCcw,
  Home,
  MousePointer2,
  Move,
  Sparkles,
  Egg,
  Zap,
  Waves,
  Circle,
  Target,
  Shield,
  Trophy,
  ChevronRight,
  Heart,
  Hand,
  Snowflake,
} from "lucide-react";
import { birds, birdById, birdSvg, type BirdId } from "../lib/birds";
import { Hockey, type Options, type Snapshot } from "../lib/hockey";
import { pointOnIce } from "../lib/viewport";
const defaults: Options = {
  sound: false,
  auto: true,
  slow: true,
  effects: false,
  target: 3,
};
const rivals = [
  {
    name: "Piggies del hielo",
    tag: "Muy fácil",
    description: "Patinan despacito. Ideal para empezar.",
  },
  {
    name: "Cascos verdes",
    tag: "Fácil",
    description: "Un poquito más rápidos sobre el hielo.",
  },
  {
    name: "El equipo del rey",
    tag: "Un reto",
    description: "El rey cerdito también quiere jugar.",
  },
];
function Bird({
  id,
  jersey = false,
  className = "",
}: {
  id: string;
  jersey?: boolean;
  className?: string;
}) {
  const cell = birds.findIndex((b) => b.id === id);
  if (cell >= 0)
    return (
      <span className={`bird-art sprite-art ${className}`} aria-hidden="true">
        <img
          src="./art/bird-team-v2.png"
          alt=""
          draggable={false}
          style={{
            left: `${-(cell % 3) * 100}%`,
            top: `${-Math.floor(cell / 3) * 100}%`,
          }}
        />
      </span>
    );
  return (
    <img
      className={`bird-art ${className}`}
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(birdSvg(id, jersey))}`}
      alt=""
      draggable={false}
    />
  );
}
function SkillIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Comp =
    id === "matilda"
      ? Egg
      : id === "red"
        ? Target
        : id === "chuck"
          ? Zap
          : id === "bomb"
            ? Waves
            : id === "blues"
              ? Sparkles
              : Circle;
  return <Comp size={size} />;
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    backdropPointer = useRef<number | null>(null),
    closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    element?.querySelector<HTMLButtonElement>("button")?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === "Tab" && element) {
        const items = Array.from(
          element.querySelectorAll<HTMLElement>(
            'button,input,a,[tabindex="0"]',
          ),
        ).filter((e) => !e.hasAttribute("disabled"));
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(event) => {
        backdropPointer.current =
          event.target === event.currentTarget ? event.pointerId : null;
      }}
      onPointerUp={(event) => {
        const shouldClose =
          backdropPointer.current === event.pointerId &&
          event.target === event.currentTarget;
        backdropPointer.current = null;
        if (shouldClose) close();
      }}
      onPointerCancel={() => {
        backdropPointer.current = null;
      }}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Cerrar">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export default function HomePage() {
  const [team, setTeam] = useState<BirdId[]>(["matilda", "red", "chuck"]),
    [rival, setRival] = useState(0),
    [options, setOptions] = useState<Options>(defaults),
    [screen, setScreen] = useState<"team" | "game">("team"),
    [dialog, setDialog] = useState<"settings" | "help" | null>(null),
    [selectionNote, setSelectionNote] = useState(
      "Puedes cambiar cualquiera de los tres.",
    ),
    [ready, setReady] = useState(false),
    [round, setRound] = useState(0);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("jorge-hockey-v1") || "null",
      );
      if (saved) {
        if (Array.isArray(saved.team)) {
          const valid = saved.team.filter((id: unknown) =>
            birds.some((b) => b.id === id),
          );
          if (valid.length === 3 && new Set(valid).size === 3) setTeam(valid);
        }
        if (saved.options)
          setOptions({
            ...defaults,
            ...saved.options,
            target: [3, 5].includes(saved.options.target)
              ? saved.options.target
              : 3,
          });
        if ([0, 1, 2].includes(saved.rival)) setRival(saved.rival);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "jorge-hockey-v1",
          JSON.stringify({ team, rival, options }),
        );
      } catch {}
  }, [team, rival, options, ready]);
  function choose(id: BirdId) {
    if (team.includes(id)) {
      setTeam(team.filter((x) => x !== id));
      setSelectionNote("Elige otro pájaro para completar tu equipo.");
    } else if (team.length < 3) {
      setTeam([...team, id]);
      setSelectionNote(
        team.length === 2
          ? "¡Tu equipo está listo para el hielo!"
          : "Elige un pájaro más.",
      );
    } else
      setSelectionNote(
        "Primero toca un pájaro elegido para dejar un sitio libre.",
      );
  }
  const start = () => {
    if (team.length === 3) {
      setRound((x) => x + 1);
      setScreen("game");
    }
  };
  return (
    <div className={`app ${screen === "game" ? "in-game" : ""}`}>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setScreen("team")}
          aria-label="Ir a elegir equipo"
        >
          <span className="brand-mark">
            <Snowflake size={25} />
          </span>
          <span>
            MATHILDA<span className="brand-bottom">HOCKEY CLUB</span>
          </span>
        </button>
        <div className="header-middle">
          <span className="status-dot" />
          Un juego para Jorge
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label={options.sound ? "Desactivar sonido" : "Activar sonido"}
            title={options.sound ? "Desactivar sonido" : "Activar sonido"}
            onClick={() => setOptions({ ...options, sound: !options.sound })}
          >
            {options.sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </button>
          <button
            className="icon-button"
            aria-label="Cómo jugar"
            title="Cómo jugar"
            onClick={() => setDialog("help")}
          >
            <CircleHelp size={21} />
          </button>
          <button
            className="settings-button"
            onClick={() => setDialog("settings")}
          >
            <Settings2 size={19} />
            <span>A tu ritmo</span>
          </button>
        </div>
      </header>
      {screen === "team" ? (
        <main className="team-screen">
          <section className="arena-hero">
            <img
              className="hero-illustration"
              src="./art/hockey-arena.png"
              alt="Mathilda, Red, Chuck y Bomb patinan en un estadio nevado contra los piggies"
              fetchPriority="high"
            />
            <div className="hero-copy">
              <div className="hero-kicker">
                <Snowflake size={14} /> BIENVENIDO A PIGGY ICE ARENA
              </div>
              <h1>
                Mathilda<span>sobre el hielo</span>
              </h1>
              <p>
                Tus pájaros. Tus superpoderes.
                <br />
                <strong>¡Tu equipo, Jorge!</strong>
              </p>
              <div className="hero-badges">
                <span>
                  <Heart size={13} /> A tu ritmo
                </span>
                <span>
                  <Sparkles size={13} /> 6 superpoderes
                </span>
              </div>
            </div>
            <span className="hero-ticket">
              <Trophy size={16} /> ¡Hoy juegas tú!
            </span>
          </section>
          <div className="setup-grid">
            <section className="team-picker" aria-labelledby="team-title">
              <div className="section-heading">
                <div>
                  <span className="step-number">1</span>
                  <h2 id="team-title">Elige a tu equipo</h2>
                </div>
                <span
                  className={`count ${team.length === 3 ? "complete" : ""}`}
                >
                  {team.length} de 3 <span>elegidos</span>
                </span>
              </div>
              <p className="section-subtitle">
                Toca a tus 3 pájaros favoritos. Cada uno tiene un superpoder.
              </p>
              <div className="bird-grid">
                {birds.map((b) => {
                  const selected = team.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      className={`bird-card ${selected ? "selected" : ""}`}
                      style={
                        {
                          "--bird-color": b.color,
                          "--bird-ink": b.ink,
                        } as CSSProperties
                      }
                      onClick={() => choose(b.id)}
                      aria-pressed={selected}
                      aria-label={`${b.name}. ${b.skill}. ${b.detail}${selected ? " Elegido." : ""}`}
                    >
                      <span className="selection-check">
                        {selected ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <span />
                        )}
                      </span>
                      <div className="portrait">
                        <Bird id={b.id} />
                      </div>
                      <span className="bird-role">{b.role}</span>
                      <strong>{b.name}</strong>
                      <span className="skill-label">
                        <SkillIcon id={b.id} size={16} />
                        {b.skill}
                      </span>
                      <span className="bird-detail">{b.detail}</span>
                    </button>
                  );
                })}
              </div>
              <p className="selection-note" role="status">
                <Hand size={16} />
                {selectionNote}
              </p>
            </section>
            <aside className="match-panel">
              <div className="match-heading">
                <span className="mini-label">TU PRÓXIMO PARTIDO</span>
                <span className="rink-tag">
                  <Snowflake size={13} /> Pista de los piggies
                </span>
              </div>
              <div className="rink-preview">
                <PreviewRink team={team} />
                <span className="preview-sticker">¡Al hielo!</span>
              </div>
              <div className="your-lineup">
                <div className="lineup-heading">
                  <strong>El equipo de Jorge</strong>
                  <span>3 amigos, un equipo</span>
                </div>
                <div className="lineup-slots">
                  {[0, 1, 2].map((i) => (
                    <div className="lineup-slot" key={i}>
                      {team[i] ? (
                        <>
                          <Bird id={team[i]} />
                          <span>{birdById(team[i]).name}</span>
                        </>
                      ) : (
                        <>
                          <span className="empty-slot">+</span>
                          <span>Tu elección</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rival-select">
                <div className="rival-title">
                  <span className="step-number">2</span>
                  <h2>Elige a los piggies</h2>
                </div>
                <div className="rival-buttons">
                  {rivals.map((r, i) => (
                    <button
                      key={r.name}
                      className={`rival-button ${rival === i ? "chosen" : ""}`}
                      onClick={() => setRival(i)}
                      aria-pressed={rival === i}
                      aria-label={`${r.name}. ${r.tag}`}
                    >
                      <Bird
                        id={i === 2 ? "pigking" : i === 1 ? "pighelmet" : "pig"}
                      />
                      <span>
                        {i === 0 ? "Del hielo" : i === 1 ? "Cascos" : "Del rey"}
                      </span>
                      {rival === i && <Check size={13} />}
                    </button>
                  ))}
                </div>
                <p className="rival-description">
                  <span>{rivals[rival].tag}</span>
                  {rivals[rival].description}
                </p>
              </div>
              <button
                className="play-button"
                onClick={start}
                disabled={team.length !== 3}
              >
                <Play size={22} fill="currentColor" />
                {team.length === 3
                  ? "¡A jugar!"
                  : `Elige ${3 - team.length} más`}
                <ArrowRight size={23} />
              </button>
              <p className="start-note">
                <MousePointer2 size={14} /> Toca, tira y pásalo bien.
              </p>
            </aside>
          </div>
          <div className="how-strip">
            <span className="how-title">ASÍ DE FÁCIL</span>
            <div>
              <span className="how-icon">
                <Move size={20} />
              </span>
              <span>Tu pájaro patina solo</span>
            </div>
            <span className="strip-arrow">→</span>
            <div>
              <span className="how-icon">
                <Target size={20} />
              </span>
              <span>Toca para tirar</span>
            </div>
            <span className="strip-arrow">→</span>
            <div>
              <span className="how-icon">
                <Sparkles size={20} />
              </span>
              <span>¡Usa tu superpoder!</span>
            </div>
            <button onClick={() => setDialog("help")}>
              Ver cómo jugar <ChevronRight size={16} />
            </button>
          </div>
          <footer className="footer">
            <span>
              Hecho para jugar sin prisa <Heart size={12} />
            </span>
            <span>
              Inspirado en{" "}
              <a
                href="https://www.youtube.com/watch?v=L6ByDtffwCQ"
                target="_blank"
                rel="noreferrer"
              >
                Cold Justice · Angry Birds Toons ↗
              </a>
            </span>
          </footer>
          <div className="mobile-launch">
            <div className="mobile-team">
              {team.map((id) => (
                <Bird key={id} id={id} />
              ))}
            </div>
            <button onClick={start} disabled={team.length !== 3}>
              <Play size={17} fill="currentColor" />
              {team.length === 3
                ? "¡Al hielo!"
                : `Elige ${3 - team.length} más`}
            </button>
          </div>
        </main>
      ) : (
        <Game
          key={round}
          team={team}
          rival={rival}
          options={options}
          externalPause={!!dialog}
          home={() => setScreen("team")}
          restart={start}
          settings={() => setDialog("settings")}
        />
      )}
      {dialog === "settings" && (
        <Modal title="A tu ritmo" close={() => setDialog(null)}>
          <p className="modal-intro">
            Elige lo que le resulte más cómodo a Jorge.
          </p>
          <div className="setting-row">
            <div>
              <strong>Patinar automáticamente</strong>
              <span>
                Modo fácil: patina y apunta solo. Jorge solo toca TIRAR.
              </span>
            </div>
            <button
              className={`toggle ${options.auto ? "on" : ""}`}
              role="switch"
              aria-checked={options.auto}
              aria-label="Patinar automáticamente"
              onClick={() => setOptions({ ...options, auto: !options.auto })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Ritmo tranquilo</strong>
              <span>Todos patinan más despacio.</span>
            </div>
            <button
              className={`toggle ${options.slow ? "on" : ""}`}
              role="switch"
              aria-checked={options.slow}
              aria-label="Ritmo tranquilo"
              onClick={() => setOptions({ ...options, slow: !options.slow })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Sonidos suaves</strong>
              <span>Pequeños sonidos al tirar, pasar o marcar.</span>
            </div>
            <button
              className={`toggle ${options.sound ? "on" : ""}`}
              role="switch"
              aria-checked={options.sound}
              aria-label="Sonidos suaves"
              onClick={() => setOptions({ ...options, sound: !options.sound })}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Estelas de los tiros</strong>
              <span>Un pequeño rastro para seguir el disco.</span>
            </div>
            <button
              className={options.effects ? "toggle on" : "toggle"}
              role="switch"
              aria-checked={options.effects}
              aria-label="Estelas de los tiros"
              onClick={() =>
                setOptions({ ...options, effects: !options.effects })
              }
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Duración del partido</strong>
              <span>Sin reloj: termina cuando un equipo llega a la meta.</span>
            </div>
            <div className="segmented">
              {[3, 5].map((n) => (
                <button
                  key={n}
                  className={options.target === n ? "active" : ""}
                  onClick={() => setOptions({ ...options, target: n })}
                  aria-pressed={options.target === n}
                >
                  {n} goles
                </button>
              ))}
            </div>
          </div>
          <p className="settings-footnote">
            <Shield size={16} /> Sin anuncios, compras ni destellos.
          </p>
          <button className="play-button" onClick={() => setDialog(null)}>
            Listo <Check size={20} />
          </button>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal title="¡Vamos al hielo!" close={() => setDialog(null)}>
          <div className="help-step">
            <span>1</span>
            <div>
              <strong>Elige 3 pájaros</strong>
              <p>
                Toca una tarjeta para elegir. Tócala otra vez para cambiarla.
              </p>
            </div>
          </div>
          <div className="help-step">
            <span>2</span>
            <div>
              <strong>Lleva el disco a la derecha →</strong>
              <p>
                Tu pájaro patina y apunta solo. Toca o mantén TIRAR. También
                puedes tocar la pista para tirar.
              </p>
            </div>
          </div>
          <div className="help-step">
            <span>3</span>
            <div>
              <strong>Tira, pasa y usa tu superpoder</strong>
              <p>
                Toca el retrato de un amigo para pasarle el disco. SUPERPODER
                activa su habilidad. En «A tu ritmo» puedes elegir el mando para
                patinar tú.
              </p>
            </div>
          </div>
          <div className="help-tip">
            <Pause size={20} />
            <p>Puedes pausar cuando quieras. No hay cuenta atrás.</p>
          </div>
          <p className="keyboard-note">
            En ordenador: flechas o WASD para mover · espacio para tirar · P
            para pasar · E para habilidad · Esc para pausar.
          </p>
          <button className="play-button" onClick={() => setDialog(null)}>
            ¡Lo tengo! <Check size={20} />
          </button>
        </Modal>
      )}
    </div>
  );
}
function PreviewRink({ team }: { team: BirdId[] }) {
  return (
    <svg
      className="preview-art"
      viewBox="0 0 600 310"
      aria-label="Mathilda y los pájaros juegan contra los piggies en una pista de hielo"
      role="img"
    >
      <defs>
        <pattern
          id="ice-lines"
          width="18"
          height="24"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-8)"
        >
          <path d="M0 24H18" stroke="#bfd5d7" strokeWidth=".6" />
        </pattern>
        <pattern id="net" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M7 0H0V7" fill="none" stroke="#c6d2cb" strokeWidth="1" />
        </pattern>
      </defs>
      <path d="M0 0H600V310H0Z" fill="#90b2a7" />
      <path d="M0 74Q280 9 600 66V0H0Z" fill="#658d80" />
      {Array.from({ length: 19 }, (_, i) => (
        <g
          key={i}
          transform={`translate(${15 + i * 33} ${28 + Math.abs(9 - i) * 2})`}
        >
          <circle r="9" fill={i % 3 === 0 ? "#bad38f" : "#93b47f"} />
          <ellipse cy="3" rx="5" ry="3" fill="#75995f" />
        </g>
      ))}
      <path
        d="M65 93L474 55Q533 50 553 89L587 214Q594 252 542 264L138 303Q77 305 58 267L19 141Q12 106 65 93"
        fill="#efecdc"
        stroke="#456e64"
        strokeWidth="3"
      />
      <path
        d="M69 108L477 71Q519 68 531 99L566 215Q574 239 536 247L138 285Q95 289 82 260L43 142Q37 114 69 108"
        fill="#e0eff0"
      />
      <path
        d="M69 108L477 71Q519 68 531 99L566 215Q574 239 536 247L138 285Q95 289 82 260L43 142Q37 114 69 108"
        fill="url(#ice-lines)"
      />
      <path
        d="M290 89L345 266"
        stroke="#d8948f"
        strokeWidth="3"
        strokeDasharray="6 5"
      />
      <path
        d="M193 97L250 278M395 80L449 256"
        stroke="#aacbd3"
        strokeWidth="4"
      />
      <ellipse
        cx="318"
        cy="177"
        rx="48"
        ry="37"
        transform="rotate(-8 318 177)"
        fill="none"
        stroke="#d89d96"
        strokeWidth="2"
      />
      <ellipse cx="318" cy="177" rx="4" ry="3" fill="#cf8a84" />
      <path
        d="M517 124L548 120L568 188L538 193Z"
        fill="url(#net)"
        stroke="#c36e64"
        strokeWidth="4"
      />
      <path
        d="M35 176L58 173L80 232L56 235Z"
        fill="url(#net)"
        stroke="#c36e64"
        strokeWidth="4"
      />
      {[
        { id: team[0] || "matilda", x: 295, y: 164, w: 94 },
        { id: team[1] || "red", x: 150, y: 159, w: 72 },
        { id: team[2] || "chuck", x: 242, y: 99, w: 70 },
        { id: "pig", x: 396, y: 145, w: 73 },
        { id: "pig", x: 449, y: 80, w: 63 },
        { id: "pigking", x: 486, y: 163, w: 66 },
      ].map((p, i) => (
        <image
          key={i}
          href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(birdSvg(p.id, true))}`}
          x={p.x - 35}
          y={p.y - 25}
          width={p.w}
          height={p.w}
        />
      ))}
      <ellipse cx="376" cy="225" rx="8" ry="4" fill="#3e5660" />
      <path
        d="M331 237Q350 245 365 235"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Game({
  team,
  rival,
  options,
  externalPause,
  home,
  restart,
  settings,
}: {
  team: BirdId[];
  rival: number;
  options: Options;
  externalPause: boolean;
  home: () => void;
  restart: () => void;
  settings: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<Hockey | null>(null),
    pad = useRef<HTMLDivElement>(null),
    pointer = useRef<number | null>(null),
    heldShot = useRef<ReturnType<typeof setInterval> | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>({
      ours: 0,
      theirs: 0,
      active: 0,
      power: 100,
      message: "¡Vamos al hielo!",
      goal: false,
      finished: false,
      possession: true,
      skill: "Tiro huevo",
      queued: false,
    }),
    [paused, setPaused] = useState(false),
    [stick, setStick] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!canvas.current) return;
    const e = new Hockey(canvas.current, team, rival, options, setSnapshot);
    engine.current = e;
    return () => {
      stopShooting();
      e.destroy();
      engine.current = null;
    };
  }, [team, rival]);
  useEffect(() => {
    if (engine.current) engine.current.options = options;
  }, [options]);
  useEffect(() => {
    engine.current?.pause(paused || externalPause);
    if (paused || externalPause) {
      stopShooting();
      pointer.current = null;
      setStick({ x: 0, y: 0 });
    }
  }, [paused, externalPause]);
  useEffect(() => {
    const keys = new Set<string>();
    const move = () => {
      if (engine.current)
        engine.current.direction = {
          x:
            (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
            (keys.has("arrowleft") || keys.has("a") ? 1 : 0),
          y:
            (keys.has("arrowdown") || keys.has("s") ? 1 : 0) -
            (keys.has("arrowup") || keys.has("w") ? 1 : 0),
        };
    };
    const down = (event: KeyboardEvent) => {
      if (externalPause) return;
      const k = event.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k))
        event.preventDefault();
      if (k === "escape") {
        if (!event.repeat) setPaused((x) => !x);
        return;
      }
      if (paused) return;
      keys.add(k);
      move();
      if (!event.repeat) {
        if (k === " ") engine.current?.shoot();
        if (k === "p") engine.current?.pass();
        if (k === "e") engine.current?.special();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      move();
    };
    const blur = () => {
      keys.clear();
      move();
      setPaused(true);
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [paused, externalPause]);
  const active = birdById(team[snapshot.active]);
  useEffect(() => {
    if (snapshot.finished) stopShooting();
  }, [snapshot.finished]);
  function stopShooting() {
    if (heldShot.current !== null) clearInterval(heldShot.current);
    heldShot.current = null;
  }
  function padMove(event: React.PointerEvent) {
    if (pointer.current !== event.pointerId || !pad.current) return;
    const r = pad.current.getBoundingClientRect(),
      radius = r.width * 0.32;
    let x = (event.clientX - r.left - r.width / 2) / radius,
      y = (event.clientY - r.top - r.height / 2) / radius;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    if (engine.current) engine.current.direction = { x, y };
    setStick({ x: x * radius, y: y * radius });
  }
  function release() {
    pointer.current = null;
    setStick({ x: 0, y: 0 });
    if (engine.current) engine.current.direction = { x: 0, y: 0 };
  }
  return (
    <main className="game-screen">
      <div className="game-topline">
        <button className="back-button" onClick={() => setPaused(true)}>
          <ArrowLeft size={18} /> Mi equipo
        </button>
        <div className="match-goal">
          <Trophy size={16} /> El primero en marcar {options.target}
        </div>
        <button className="pause-button" onClick={() => setPaused(true)}>
          <Pause size={18} /> Pausa
        </button>
        <button
          className="game-settings icon-button"
          aria-label="A tu ritmo"
          onClick={settings}
        >
          <Settings2 size={19} />
        </button>
      </div>
      <div className="scoreboard">
        <div className="score-team">
          <span className="team-symbol">
            <Bird id={team[0]} />
          </span>
          <div>
            <strong>Equipo de Jorge</strong>
            <span>¡Juntos sobre el hielo!</span>
          </div>
        </div>
        <div className="score">
          <span>{snapshot.ours}</span>
          <b>:</b>
          <span>{snapshot.theirs}</span>
        </div>
        <div className="score-team rival-score">
          <div>
            <strong>{rivals[rival].name}</strong>
            <span>{rivals[rival].tag}</span>
          </div>
          <span className="team-symbol pig-symbol">
            <Bird id={rival === 2 ? "pigking" : "pig"} />
          </span>
        </div>
      </div>
      <div className="rink-container">
        <canvas
          ref={canvas}
          aria-label="Pista de hockey. Tu equipo ataca hacia la portería derecha. Usa los botones de abajo para jugar."
          onPointerDown={(e) => {
            if (paused || externalPause) return;
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const point = pointOnIce(
              e.clientX - rect.left,
              e.clientY - rect.top,
              rect.width,
              rect.height,
            );
            if (!point || !engine.current) return;
            if (options.auto) engine.current.shoot();
            else engine.current.target = point;
          }}
        />
        <div className="attack-label">
          Tu portería <span>Atacamos hacia aquí →</span>
        </div>
      </div>
      <div className="coach-message" role="status" aria-live="polite">
        <span className="coach-dot" />
        {snapshot.message}
      </div>
      <div
        className={`game-controls ${options.auto ? "easy-controls" : "manual-controls"}`}
      >
        {!options.auto && (
          <div className="movement-area">
            <div
              ref={pad}
              className="joystick"
              role="group"
              aria-label="Mando táctil para patinar; también puedes usar las flechas del teclado"
              onPointerDown={(e) => {
                if (pointer.current !== null || paused || externalPause) return;
                pointer.current = e.pointerId;
                e.currentTarget.setPointerCapture(e.pointerId);
                padMove(e);
              }}
              onPointerMove={padMove}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
            >
              <span className="pad-arrow up">⌃</span>
              <span className="pad-arrow down">⌄</span>
              <span className="pad-arrow left">‹</span>
              <span className="pad-arrow right">›</span>
              <span
                className="joystick-knob"
                style={{ transform: `translate(${stick.x}px,${stick.y}px)` }}
              >
                <Move size={25} />
              </span>
            </div>
            <span>Mueve para patinar</span>
          </div>
        )}
        <div className="team-bench">
          <span className="bench-label">Toca un amigo para pasar</span>
          <div className="game-lineup" aria-label="Elige tu jugador">
            {team.map((id, i) => (
              <button
                key={id}
                className={i === snapshot.active ? "active" : ""}
                onClick={() => engine.current?.setActive(i)}
                aria-label={`Jugar con ${birdById(id).name}`}
                aria-pressed={i === snapshot.active}
              >
                <Bird id={id} />
                <span>{birdById(id).name}</span>
                {i === snapshot.active && (
                  <span className="active-player-dot" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="action-controls">
          <button
            className={`shoot-control ${snapshot.queued ? "shot-queued" : ""}`}
            aria-label="Tirar a portería"
            onPointerDown={(e) => {
              if (paused || externalPause || heldShot.current !== null) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              engine.current?.shoot();
              heldShot.current = setInterval(
                () => engine.current?.shoot(),
                700,
              );
            }}
            onPointerUp={stopShooting}
            onPointerCancel={stopShooting}
            onLostPointerCapture={stopShooting}
            onClick={(e) => {
              if (e.detail === 0) engine.current?.shoot();
            }}
          >
            <Target size={31} />
            <strong>TIRAR</strong>
            <span>
              {snapshot.queued ? "¡Voy a por el disco!" : "Toca o mantén"}
            </span>
          </button>
          <button
            className="special-control"
            disabled={snapshot.power < 100}
            onClick={() => engine.current?.special()}
            aria-label={`${active.skill}. ${snapshot.power < 100 ? "Cargando" : "Disponible"}`}
          >
            <SkillIcon id={active.id} size={25} />
            <strong>SUPERPODER</strong>
            <span className="power-name">{active.skill}</span>
            <span>
              {snapshot.power >= 100
                ? "¡Listo!"
                : `${Math.ceil((100 - snapshot.power) / 6)} s`}
            </span>
            <span className="charge-track">
              <span style={{ width: `${snapshot.power}%` }} />
            </span>
          </button>
        </div>
      </div>
      <p className="game-footnote">
        <Heart size={14} />{" "}
        {options.auto
          ? "Patina y apunta solo. Tú toca TIRAR."
          : "Mueve con el mando. El tiro apunta solo."}
      </p>
      {paused && !snapshot.finished && (
        <Modal title="Un descansito" close={() => setPaused(false)}>
          <div className="pause-art">
            <Bird id={active.id} />
          </div>
          <p className="pause-copy">
            El hielo te espera.
            <br />
            Continúa cuando tú quieras, Jorge.
          </p>
          <button className="play-button" onClick={() => setPaused(false)}>
            <Play fill="currentColor" size={20} /> Seguir jugando
          </button>
          <div className="pause-secondary">
            <button onClick={restart}>
              <RotateCcw size={17} /> Empezar otra vez
            </button>
            <button onClick={home}>
              <Home size={17} /> Cambiar equipo
            </button>
          </div>
        </Modal>
      )}
      {snapshot.finished && (
        <Modal
          title={
            snapshot.ours >= options.target
              ? "¡Qué bien has jugado!"
              : "¡Buen partido, Jorge!"
          }
          close={home}
        >
          <div className="finish-art">
            <Trophy size={46} />
            <Bird id={team[0]} />
            <Bird id={team[1]} />
            <Bird id={team[2]} />
          </div>
          <div className="finish-score">
            {snapshot.ours} <span>—</span> {snapshot.theirs}
          </div>
          <p className="pause-copy">
            {snapshot.ours >= options.target
              ? "¡El equipo de Jorge ha ganado!"
              : "Los piggies ganan este partido. ¿Probamos otra vez?"}
            <br />
            Gracias por jugar con tus amigos.
          </p>
          <button className="play-button" onClick={restart}>
            <RotateCcw size={20} /> Jugar otra vez
          </button>
          <button className="text-button" onClick={home}>
            <Home size={18} /> Elegir otro equipo
          </button>
        </Modal>
      )}
    </main>
  );
}
