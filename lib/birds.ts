export const birds = [
  {
    id: "matilda",
    name: "Mathilda",
    color: "#e1f5fa",
    ink: "#21758c",
    skill: "Tiro huevo",
    detail: "¡Un huevo imparable directo a portería!",
    symbol: "egg",
    speed: 150,
    power: 660,
    role: "LA CAPITANA",
  },
  {
    id: "red",
    name: "Red",
    color: "#ffe3de",
    ink: "#c44239",
    skill: "Súper tiro",
    detail: "Potencia extra para un gran gol.",
    symbol: "target",
    speed: 158,
    power: 760,
    role: "EL GOLEADOR",
  },
  {
    id: "chuck",
    name: "Chuck",
    color: "#fff1bf",
    ink: "#9b6b06",
    skill: "Velocidad",
    detail: "¡Zuum! Corre sobre el hielo.",
    symbol: "bolt",
    speed: 190,
    power: 610,
    role: "EL MÁS RÁPIDO",
  },
  {
    id: "bomb",
    name: "Bomb",
    color: "#e3e8f2",
    ink: "#485675",
    skill: "Onda de aire",
    detail: "Una onda que hace sitio para pasar.",
    symbol: "waves",
    speed: 135,
    power: 780,
    role: "EL DEFENSOR",
  },
  {
    id: "blues",
    name: "Los Blues",
    color: "#d9f1ff",
    ink: "#2678b3",
    skill: "Pase mágico",
    detail: "¡Tres amigos avanzan juntos!",
    symbol: "spark",
    speed: 175,
    power: 620,
    role: "LOS TRAVIESOS",
  },
  {
    id: "stella",
    name: "Stella",
    color: "#ffe1ef",
    ink: "#be4889",
    skill: "Burbuja",
    detail: "Su burbuja protege el disco.",
    symbol: "bubble",
    speed: 165,
    power: 650,
    role: "LA PROTECTORA",
  },
] as const;
export type BirdId = (typeof birds)[number]["id"];
export const birdById = (id: string) =>
  birds.find((b) => b.id === id) || birds[0];
const cache = new Map<string, string>();

// Resolution-independent original illustrations for portraits and animated players.
export function birdSvg(id: string, jersey = false): string {
  const key = id + (jersey ? "-kit" : "");
  if (cache.has(key)) return cache.get(key)!;
  const pig = id.startsWith("pig"),
    blue = id === "blues";
  const base = pig
    ? "#8ccc4a"
    : id === "matilda"
      ? "#fffef2"
      : id === "red"
        ? "#ee453d"
        : id === "chuck"
          ? "#ffda31"
          : id === "bomb"
            ? "#3e4655"
            : id === "stella"
              ? "#f18abb"
              : "#51b8eb";
  const shade = pig
    ? "#56a232"
    : id === "matilda"
      ? "#e6ddc5"
      : id === "red"
        ? "#bd252f"
        : id === "chuck"
          ? "#edae13"
          : id === "bomb"
            ? "#1e2636"
            : id === "stella"
              ? "#d7569b"
              : "#278fc7";
  const outline = "#243343",
    kit = pig ? "#ed6651" : "#21a8c0",
    darkKit = pig ? "#ae3d3a" : "#137387";
  const defs = `<defs><radialGradient id="body" cx="35%" cy="24%" r="80%"><stop stop-color="${base}"/><stop offset=".65" stop-color="${base}"/><stop offset="1" stop-color="${shade}"/></radialGradient><linearGradient id="beak" x2=".4" y2="1"><stop stop-color="#ffcf52"/><stop offset="1" stop-color="#ed9926"/></linearGradient><radialGradient id="shadow"><stop stop-color="#22466b" stop-opacity=".23"/><stop offset="1" stop-color="#22466b" stop-opacity="0"/></radialGradient></defs>`;
  const shape =
    id === "chuck"
      ? `<path d="M19 115Q9 113 18 99L65 25Q71 16 77 26L127 108Q134 119 119 120Z" fill="url(#body)" stroke="${outline}" stroke-width="3.5"/><path d="M65 29L51 17L66 20L66 9L76 21L84 12L85 30" fill="#273542"/><path d="M42 115Q66 88 102 117" fill="#fff1b4"/>`
      : pig
        ? `<path d="M32 48Q15 20 34 20Q49 20 51 43M93 42Q93 15 111 23Q125 33 108 52" fill="${base}" stroke="${outline}" stroke-width="3.5"/><path d="M32 37L37 31M103 36L108 31" stroke="#4b912f" stroke-width="6" stroke-linecap="round"/><path d="M20 81Q18 40 72 38Q123 37 126 79Q129 124 74 126Q20 125 20 81" fill="url(#body)" stroke="${outline}" stroke-width="3.5"/>`
        : id === "matilda"
          ? `<path d="M32 91Q26 51 51 32Q56 20 72 21Q94 22 102 45Q120 69 117 94Q112 126 75 127Q37 126 32 91" fill="url(#body)" stroke="${outline}" stroke-width="3.5"/><path d="M58 29Q39 10 53 7Q62 7 66 25Q58 1 72 3Q81 3 76 24Q81 6 90 13Q97 23 82 32" fill="#283440"/>`
          : `<path d="M21 84Q17 49 47 38L43 25L61 31L61 17L77 31Q121 30 128 75Q136 122 78 128Q25 129 21 84" fill="url(#body)" stroke="${outline}" stroke-width="3.5"/><path d="M44 112Q67 88 107 113Q92 133 63 124" fill="${id === "bomb" ? "#6e7787" : id === "stella" ? "#ffe7eb" : "#ffe4c0"}"/>`;
  const shine = `<path d="M${id === "chuck" ? "38 84Q48 60 61 44" : "33 67Q34 47 51 42"}" fill="none" stroke="white" stroke-opacity="${id === "bomb" ? ".12" : ".28"}" stroke-width="7" stroke-linecap="round"/>`;
  const fuse =
    id === "bomb"
      ? `<path d="M73 34L72 13L85 9" fill="none" stroke="${outline}" stroke-width="7" stroke-linecap="round"/><path d="M84 4L91 1L89 9L96 12L87 15L81 10Z" fill="#ffcb44"/>`
      : "";
  const helmet =
    id === "pighelmet"
      ? `<path d="M20 62Q19 26 72 26Q124 25 125 62L113 68L109 53L36 53L31 70Z" fill="#678d82" stroke="${outline}" stroke-width="3.5"/><path d="M37 43Q57 30 82 34M88 35L102 41" stroke="#b5d4ba" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M69 28L69 50" stroke="#d9ead5" stroke-width="8"/>`
      : "";
  const face = pig
    ? `<ellipse cx="50" cy="68" rx="12" ry="15" fill="white"/><ellipse cx="91" cy="67" rx="12" ry="15" fill="white"/><ellipse cx="54" cy="70" rx="4.5" ry="6" fill="${outline}"/><ellipse cx="87" cy="69" rx="4.5" ry="6" fill="${outline}"/><path d="M41 48L55 45M85 45L100 48" stroke="${outline}" stroke-width="3" stroke-linecap="round"/><ellipse cx="72" cy="91" rx="27" ry="19" fill="#b7e57c" stroke="#4c8e30" stroke-width="2.5"/><ellipse cx="62" cy="91" rx="5" ry="7" fill="#4c8e30"/><ellipse cx="83" cy="91" rx="5" ry="7" fill="#4c8e30"/><path d="M57 116Q74 125 91 112" fill="#fff8d9" stroke="${outline}" stroke-width="2.3" stroke-linecap="round"/>`
    : `<ellipse cx="60" cy="65" rx="14" ry="18" fill="white" stroke="${outline}" stroke-width="1.3"/><ellipse cx="88" cy="65" rx="14" ry="18" fill="white" stroke="${outline}" stroke-width="1.3"/><ellipse cx="65" cy="67" rx="5" ry="8" fill="${outline}"/><ellipse cx="85" cy="67" rx="5" ry="8" fill="${outline}"/><circle cx="67" cy="64" r="1.8" fill="white"/><circle cx="87" cy="64" r="1.8" fill="white"/>${["red", "bomb", "chuck"].includes(id) ? `<path d="M43 43L70 53L69 58L42 50ZM78 52L105 40L106 48L80 58Z" fill="${outline}"/>` : `<path d="M47 43Q57 36 67 42M83 41Q93 35 103 43" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round"/>`}<path d="M70 80L${id === "matilda" ? "117 88L72 104" : "105 86L72 103"}Z" fill="url(#beak)" stroke="#a76727" stroke-width="2"/><path d="M74 90L${id === "matilda" ? "107 89" : "98 87"}" fill="none" stroke="#cc8124" stroke-width="1.5"/>${id === "matilda" || id === "stella" ? `<ellipse cx="42" cy="84" rx="10" ry="6" fill="#f1a3b4"/><ellipse cx="106" cy="81" rx="7" ry="5" fill="#f1a3b4"/><path d="M46 55L41 49M50 51L47 44M100 52L104 44" stroke="${outline}" stroke-width="2.5" stroke-linecap="round"/>` : ""}`;
  const crown =
    id === "pigking"
      ? `<path d="M42 44L33 12L57 25L73 4L88 25L113 12L104 44Z" fill="#ffd252" stroke="#8a631c" stroke-width="3.5"/><path d="M43 36H103" stroke="#ffe99a" stroke-width="5"/><circle cx="73" cy="28" r="5" fill="#e46752"/>`
      : "";
  const skates = jersey
    ? `<path d="M47 121L45 133L62 133L63 124M87 124L88 133L108 133L103 120" fill="#e9ac43" stroke="${outline}" stroke-width="2.5"/><path d="M38 134Q39 128 48 128L65 130L65 136L39 136M83 134Q83 128 93 128L110 131L110 136L83 136" fill="#344962"/><path d="M35 140H67M80 140H113" stroke="#90aebe" stroke-width="3.5" stroke-linecap="round"/>`
    : "";
  const shirt = jersey
    ? `<path d="M31 101Q75 117 116 100L113 120Q72 136 34 119Z" fill="${kit}" stroke="${darkKit}" stroke-width="2.5"/><path d="M35 115Q77 128 112 114" stroke="#fff3db" stroke-width="6" fill="none"/><path d="M36 89Q23 83 22 97Q23 107 35 111" fill="${base}" stroke="${outline}" stroke-width="3"/><path d="M108 91Q120 87 124 99L116 109" fill="${base}" stroke="${outline}" stroke-width="3"/><path d="M119 91L133 132L144 131" stroke="${outline}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M119 91L133 132L144 131" stroke="#c98c4a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M132 129L136 136L146 134" stroke="#334b5a" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : "";
  const art = shape + shine + fuse + helmet + face + crown;
  const body =
    blue && !jersey
      ? `<g transform="translate(-3 26) scale(.64)">${art}</g><g transform="translate(61 25) scale(.64)">${art}</g><g transform="translate(20 26) scale(.81)">${art}</g>`
      : art + shirt;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150">${defs}<ellipse cx="77" cy="140" rx="63" ry="10" fill="url(#shadow)"/>${skates}${body}</svg>`;
  cache.set(key, svg);
  return svg;
}
