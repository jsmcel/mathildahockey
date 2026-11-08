export const birds = [
  { id: 'matilda', name: 'Mathilda', color: '#f6ede0', ink: '#bd7733', skill: 'Tiro huevo', detail: 'Un tiro especial que cruza toda la pista.', symbol: 'egg', speed: 150, power: 660 },
  { id: 'red', name: 'Red', color: '#fce3de', ink: '#bb453b', skill: 'Súper tiro', detail: 'Su disparo es muy fuerte y preciso.', symbol: 'target', speed: 158, power: 760 },
  { id: 'chuck', name: 'Chuck', color: '#fff1c7', ink: '#967017', skill: 'Velocidad', detail: 'Patina más rápido durante unos segundos.', symbol: 'bolt', speed: 190, power: 610 },
  { id: 'bomb', name: 'Bomb', color: '#e8e9ed', ink: '#4d5262', skill: 'Onda de aire', detail: 'Hace espacio y recupera el disco cercano.', symbol: 'waves', speed: 135, power: 780 },
  { id: 'blues', name: 'Los Blues', color: '#dceef7', ink: '#357798', skill: 'Pase mágico', detail: 'Todos sus amigos avanzan con el disco.', symbol: 'spark', speed: 175, power: 620 },
  { id: 'stella', name: 'Stella', color: '#fae0eb', ink: '#af537b', skill: 'Burbuja', detail: 'Protege el disco de los piggies un ratito.', symbol: 'bubble', speed: 165, power: 650 },
] as const;
export type BirdId = typeof birds[number]['id'];
export const birdById = (id: string) => birds.find(b => b.id === id) || birds[0];

// Original vector drawings, shared by the team cards and the playing field.
export function birdSvg(id: string, jersey = false): string {
  const pig = id.startsWith('pig');
  const shape = id === 'chuck'
    ? '<path d="M25 108 Q14 108 24 90 L69 25 Q75 15 81 29 L119 96 Q125 110 111 111Z" fill="#f6ce43" stroke="#56473c" stroke-width="3"/><path d="M51 105 Q68 79 94 105" fill="#fff0b5"/>'
    : pig ? '<path d="M35 50 Q13 18 38 22 Q52 24 51 44 M93 44 Q92 14 112 25 Q123 38 107 54" fill="#8cbe64" stroke="#416747" stroke-width="3"/><ellipse cx="73" cy="80" rx="51" ry="43" fill="#8cbe64" stroke="#416747" stroke-width="3"/>'
    : `<path d="M${id === 'matilda' ? '38 97 Q25 57 51 34 Q47 9 61 20 L69 32 Q68 6 78 19 L79 33 Q110 49 113 84 Q119 119 76 121 Q40 122 38 97' : '24 85 Q22 50 54 39 L47 24 L64 34 L68 17 L78 35 Q116 36 121 76 Q126 117 77 123 Q29 124 24 85'}" fill="${id === 'matilda' ? '#fffdf5' : id === 'red' ? '#db5149' : id === 'bomb' ? '#414653' : id === 'stella' ? '#ee95b4' : '#68b4d4'}" stroke="#4b4441" stroke-width="3"/>${id === 'bomb' ? '<path d="M73 35 L73 17 L84 12" fill="none" stroke="#4b4441" stroke-width="6"/><circle cx="86" cy="11" r="5" fill="#efbd5f"/><path d="M44 108 Q72 79 103 108" fill="#727581"/>' : '<path d="M46 110 Q72 80 107 108 Q91 128 61 118" fill="#fff3d9" opacity=".83"/>'}`;
  const face = pig
    ? '<ellipse cx="54" cy="65" rx="10" ry="13" fill="white"/><ellipse cx="90" cy="65" rx="10" ry="13" fill="white"/><circle cx="58" cy="67" r="4" fill="#35423e"/><circle cx="86" cy="67" r="4" fill="#35423e"/><ellipse cx="73" cy="87" rx="23" ry="17" fill="#b5d98b" stroke="#5c8849" stroke-width="2"/><ellipse cx="65" cy="87" rx="4" ry="6" fill="#59834b"/><ellipse cx="81" cy="87" rx="4" ry="6" fill="#59834b"/><path d="M62 109 Q72 115 85 108" fill="none" stroke="#416747" stroke-width="2"/>'
    : `<ellipse cx="62" cy="66" rx="12" ry="15" fill="white"/><ellipse cx="87" cy="66" rx="12" ry="15" fill="white"/><ellipse cx="66" cy="68" rx="4" ry="6" fill="#323b3e"/><ellipse cx="84" cy="68" rx="4" ry="6" fill="#323b3e"/>${id === 'red' || id === 'bomb' || id === 'chuck' ? '<path d="M47 48 L70 54 M80 54 L102 46" stroke="#393b3c" stroke-width="7" stroke-linecap="round"/>' : '<path d="M51 48 Q59 44 66 48 M81 47 Q90 43 97 48" fill="none" stroke="#514743" stroke-width="3" stroke-linecap="round"/>'}<path d="M70 79 L${id === 'matilda' ? '114 88 L73 98' : '99 83 L73 96'}Z" fill="#edab45" stroke="#9f6b31" stroke-width="2"/>${id === 'matilda' || id === 'stella' ? '<ellipse cx="45" cy="84" rx="8" ry="5" fill="#e7a4a8"/><ellipse cx="103" cy="78" rx="6" ry="4" fill="#e7a4a8"/><path d="M51 55 L47 50 M98 54 L102 49" stroke="#514743" stroke-width="2"/>' : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><ellipse cx="76" cy="133" rx="43" ry="6" fill="#263b3b" opacity=".1"/>${jersey ? '<path d="M34 104 L24 117 L43 124 L48 135 L102 135 L108 123 L125 115 L114 103Z" fill="#2b857a" stroke="#275d59" stroke-width="3"/><path d="M48 125 H101" stroke="#f7ecd6" stroke-width="5"/>' : ''}${shape}${face}${id === 'pigking' ? '<path d="M43 42 L37 19 L57 28 L73 8 L87 28 L109 19 L104 43Z" fill="#edbd4f" stroke="#927126" stroke-width="3"/>' : ''}${jersey ? '<path d="M104 102 L132 130 L143 128" stroke="#806042" stroke-width="5" fill="none" stroke-linecap="round"/>' : ''}</svg>`;
}
