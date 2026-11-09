import type { BirdId } from "./birds";

export const penaltyPowers: Record<
  BirdId,
  { shot: string; shotDetail: string; save: string; saveDetail: string }
> = {
  matilda: {
    shot: "Huevo sorpresa",
    shotDetail: "El huevo cambia de dirección al acercarse a la portería.",
    save: "Nido protector",
    saveDetail: "Un escudo dorado amplía el alcance de Mathilda.",
  },
  red: {
    shot: "Cañonazo",
    shotDetail: "Un disparo potente que deja menos margen al portero.",
    save: "Muro rojo",
    saveDetail: "Red extiende sus protecciones para cubrir más portería.",
  },
  chuck: {
    shot: "Rayo amarillo",
    shotDetail: "El disco sale a toda velocidad.",
    save: "Reflejos",
    saveDetail: "El disco se mueve más despacio para que puedas colocarte.",
  },
  bomb: {
    shot: "Onda de tiro",
    shotDetail: "Una onda aparta al portero del camino del disco.",
    save: "Onda de despeje",
    saveDetail: "Una onda rechaza el disco si pasa cerca de Bomb.",
  },
  blues: {
    shot: "Tres discos",
    shotDetail: "Dos discos de ilusión despistan al portero.",
    save: "Triple defensa",
    saveDetail: "Dos amigos ayudan a cubrir los lados de la portería.",
  },
  stella: {
    shot: "Burbuja flotante",
    shotDetail: "El disco flota y despista al portero con su altura.",
    save: "Burbuja atrapadiscos",
    saveDetail: "Atrapa el disco al pasar cerca de Stella.",
  },
};

export const penaltyRivals = [
  {
    name: "Piggies del hielo",
    label: "Aprender",
    description: "Más tiempo para colocar al portero.",
  },
  {
    name: "Cascos verdes",
    label: "Partido",
    description: "Busca huecos y prepara tus paradas.",
  },
  {
    name: "El equipo del rey",
    label: "Desafío",
    description: "Un portero rápido y tiros más difíciles.",
  },
];
