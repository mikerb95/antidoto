// Kits de piezas para los retos de construcción (pedido del 2026-11-12). Cada kit copia una bolsa
// o caja real de LEGO Serious Play con las fichas que ya tiene el motor: el admin elige el kit al
// asignar la actividad y el participante construye solo con esas piezas, en esos colores y en
// esas cantidades, como si tuviera la bolsa en la mesa.
//
// Inventarios oficiales consultados el 2026-11-12:
// - Pato 2000416: Brickset (inventario de LEGO, 6 piezas).
// - Window Exploration Bag 2000409: tabla por bolsa de Serious Play Pro (48 piezas).
// - Starter Kit 2000414: Brickset (inventario de LEGO, 246 filas; la caja dice 234).
//
// Lo que no existe en 3D se cambia por la ficha más parecida y queda anotado en `from`. Lo que no
// es una ficha de construir (minifiguras, sombreros, cuerdas, ejes, engranajes técnicos, varillas)
// se deja fuera del kit.
//
// La `key` es lo que se guarda en la base: nunca se cambia la de un kit publicado.

import { colorIndex } from "./palette.ts";
import { partByKey } from "./parts.ts";
import type { Brick } from "./world.ts";

export interface KitItem {
  part: string;
  color: string;
  qty: number;
  /** La pieza original de LEGO, cuando no es la misma ficha. */
  from?: string;
}

export interface KitDef {
  key: string;
  name: string;
  /** Referencia del producto real. */
  ref: string;
  /** Para qué sirve, tal como lo recomienda la presentación de Antídoto. */
  use: string;
  items: KitItem[];
}

const DUCK: KitItem[] = [
  { part: "ladrillo-2x4", color: "Amarillo brillante", qty: 1 },
  { part: "ladrillo-2x2", color: "Amarillo brillante", qty: 2, from: "Uno es el ladrillo 2x2 con ojos" },
  { part: "ladrillo-1x2", color: "Amarillo brillante", qty: 1 },
  { part: "placa-2x4", color: "Rojo brillante", qty: 2, from: "Placa 2x3" },
];

const WINDOW: KitItem[] = [
  { part: "placa-4x4", color: "Negro", qty: 1, from: "Placa 4x6" },
  { part: "ladrillo-redondo-1x1", color: "Negro", qty: 1, from: "Antena" },
  { part: "placa-redonda-1x1", color: "Negro", qty: 1, from: "Hélice" },
  { part: "ladrillo-1x4", color: "Azul brillante", qty: 2 },
  { part: "ladrillo-1x2", color: "Azul brillante", qty: 1, from: "Torso de minifigura" },
  { part: "placa-redonda-1x1", color: "Verde", qty: 1, from: "Flor con tallo" },
  { part: "inclinada-1x2", color: "Naranja brillante", qty: 2 },
  { part: "placa-2x4", color: "Naranja brillante", qty: 2, from: "Una es placa 2x3" },
  { part: "ladrillo-1x4", color: "Rojo brillante", qty: 2 },
  { part: "ladrillo-redondo-2x2", color: "Rojo brillante", qty: 1, from: "Rin de rueda" },
  { part: "ladrillo-1x4", color: "Magenta", qty: 2 },
  { part: "ladrillo-1x1", color: "Amarillo brillante", qty: 2 },
  { part: "ladrillo-2x3", color: "Amarillo brillante", qty: 1, from: "Ladrillo 2x3 con arco" },
  { part: "ladrillo-redondo-1x1", color: "Amarillo brillante", qty: 1, from: "Cabeza de minifigura" },
  { part: "placa-2x6", color: "Amarillo brillante", qty: 2 },
  { part: "ladrillo-1x2", color: "Verde lima", qty: 2 },
  { part: "placa-1x6", color: "Beige", qty: 2, from: "Placa 1x10" },
  { part: "ladrillo-1x2", color: "Gris piedra oscuro", qty: 3, from: "Uno trae enganche lateral" },
  { part: "inclinada-1x2", color: "Gris piedra oscuro", qty: 4, from: "Tejas 1x3 de 25°, dos invertidas" },
  { part: "placa-2x2", color: "Gris piedra oscuro", qty: 1 },
  { part: "ventana-1x2x3", color: "Gris piedra oscuro", qty: 1, from: "Escalera 1x2x2" },
  { part: "ladrillo-2x2", color: "Verde oscuro", qty: 1 },
  { part: "ladrillo-2x4", color: "Verde oscuro", qty: 1 },
  { part: "ladrillo-1x2", color: "Verde oscuro", qty: 2 },
  { part: "ladrillo-1x4", color: "Verde oscuro", qty: 2 },
  { part: "teja-1x2", color: "Verde oscuro", qty: 1, from: "Banderín" },
  { part: "ladrillo-1x4", color: "Gris piedra claro", qty: 2, from: "Ladrillo 1x4 con arco" },
  { part: "inclinada-2x2", color: "Transparente", qty: 1 },
  { part: "placa-redonda-1x1", color: "Coral", qty: 1, from: "Flor transparente" },
  { part: "ladrillo-redondo-2x2", color: "Amarillo transparente", qty: 1 },
  { part: "ladrillo-1x2", color: "Blanco", qty: 1, from: "Piernas de minifigura" },
];

const STARTER: KitItem[] = [
  // Negro
  { part: "placa-2x2", color: "Negro", qty: 5, from: "Base giratoria y placas con rótula" },
  { part: "ladrillo-1x2", color: "Negro", qty: 4, from: "Ladrillos técnicos y con enganche" },
  { part: "placa-2x8", color: "Negro", qty: 2 },
  { part: "inclinada-1x2", color: "Negro", qty: 2, from: "Tejas 1x3 de 25°" },
  { part: "placa-1x6", color: "Negro", qty: 2, from: "Placa 1x10" },
  { part: "placa-6x6", color: "Negro", qty: 1, from: "Placa redonda grande" },
  { part: "ladrillo-2x4", color: "Negro", qty: 1, from: "Ladrillo 2x4x2" },
  { part: "ladrillo-redondo-2x2", color: "Negro", qty: 4, from: "Llantas" },
  { part: "cilindro-2x2", color: "Negro", qty: 2, from: "Turbinas" },
  { part: "ladrillo-1x1", color: "Negro", qty: 4, from: "Columna 1x1 con arco" },
  { part: "placa-redonda-1x1", color: "Negro", qty: 1, from: "Hélice" },
  { part: "ladrillo-2x2", color: "Negro", qty: 4, from: "Ladrillo 2x2 técnico" },
  // Beige
  { part: "ladrillo-1x1", color: "Beige", qty: 4, from: "Columna 1x1x5" },
  { part: "ladrillo-2x4", color: "Beige", qty: 9 },
  { part: "placa-1x6", color: "Beige", qty: 2, from: "Placa 1x10" },
  { part: "ladrillo-2x8", color: "Beige", qty: 2 },
  // Azules
  { part: "placa-2x8", color: "Azul brillante", qty: 1, from: "Placa 2x12" },
  { part: "ladrillo-1x4", color: "Azul brillante", qty: 2 },
  { part: "placa-4x4", color: "Azul brillante", qty: 1, from: "Placa 4x8" },
  { part: "ladrillo-1x2", color: "Azul brillante", qty: 1, from: "Torso de minifigura" },
  { part: "ladrillo-redondo-2x2", color: "Azul brillante", qty: 1, from: "Antena parabólica" },
  { part: "ladrillo-1x2", color: "Azul medio", qty: 2 },
  // Verdes
  { part: "placa-redonda-1x1", color: "Verde", qty: 2, from: "Flor con tallo" },
  { part: "ladrillo-1x2", color: "Verde lima", qty: 2 },
  { part: "placa-2x6", color: "Verde oscuro", qty: 4, from: "Dos son placas de esquina 3x6" },
  { part: "ladrillo-2x3", color: "Verde oscuro", qty: 2, from: "Ladrillo 2x3 con arco" },
  { part: "ladrillo-2x4", color: "Verde oscuro", qty: 4 },
  { part: "ladrillo-1x4", color: "Verde oscuro", qty: 2 },
  { part: "teja-1x2", color: "Verde oscuro", qty: 6, from: "Cinco tejas decoradas y un banderín" },
  { part: "ladrillo-redondo-2x2", color: "Verde oscuro", qty: 1, from: "Arbusto" },
  // Naranja
  { part: "inclinada-2x3", color: "Naranja brillante", qty: 2, from: "Tejas 2x3 de 25°, una invertida" },
  { part: "inclinada-1x2", color: "Naranja brillante", qty: 2 },
  { part: "placa-2x4", color: "Naranja brillante", qty: 2, from: "Una es placa 2x3" },
  { part: "ladrillo-2x4", color: "Naranja brillante", qty: 5 },
  // Rosas
  { part: "ladrillo-2x2", color: "Rosa oscuro", qty: 4 },
  { part: "placa-redonda-1x1", color: "Rosa oscuro", qty: 2, from: "Flor" },
  // Rojo
  { part: "ladrillo-2x2", color: "Rojo brillante", qty: 2 },
  { part: "placa-2x4", color: "Rojo brillante", qty: 2, from: "Placa 2x3" },
  { part: "ladrillo-1x4", color: "Rojo brillante", qty: 2, from: "Ladrillo 1x4 con arco" },
  { part: "placa-1x2", color: "Rojo brillante", qty: 2, from: "Bisagra 1x2" },
  { part: "placa-2x2", color: "Rojo brillante", qty: 2, from: "Bisagra 2x2" },
  { part: "ladrillo-1x2", color: "Rojo brillante", qty: 1, from: "Torso de minifigura" },
  { part: "ventana-1x4x3", color: "Rojo brillante", qty: 1, from: "Marco 2x4x3 con sus dos hojas" },
  // Amarillo
  { part: "ladrillo-2x4", color: "Amarillo brillante", qty: 1 },
  { part: "ladrillo-2x2", color: "Amarillo brillante", qty: 3, from: "Uno es el ladrillo 2x2 con ojos" },
  { part: "ladrillo-1x2", color: "Amarillo brillante", qty: 1 },
  { part: "placa-2x6", color: "Amarillo brillante", qty: 2 },
  { part: "ladrillo-redondo-1x1", color: "Amarillo brillante", qty: 5, from: "Cabezas de minifigura" },
  { part: "cilindro-2x2", color: "Amarillo brillante", qty: 1, from: "Torre de celosía 2x2x10" },
  // Grises
  { part: "placa-8x8", color: "Gris piedra oscuro", qty: 1 },
  { part: "inclinada-1x2", color: "Gris piedra oscuro", qty: 2, from: "Tejas 1x3 de 25° invertidas" },
  { part: "ladrillo-1x2", color: "Gris piedra oscuro", qty: 2 },
  { part: "inclinada-4x2", color: "Gris piedra oscuro", qty: 1, from: "Teja invertida 4x6" },
  { part: "ventana-1x2x3", color: "Gris piedra oscuro", qty: 1, from: "Escalera 1x2x2" },
  { part: "placa-2x2", color: "Gris piedra oscuro", qty: 2, from: "Placa 2x2 con enganche" },
  { part: "ladrillo-redondo-2x2", color: "Gris piedra oscuro", qty: 1, from: "Engranaje de 24 dientes" },
  { part: "ladrillo-2x3", color: "Gris piedra claro", qty: 4, from: "Ladrillo 2x3 con arco" },
  { part: "placa-2x2", color: "Gris piedra claro", qty: 2, from: "Base giratoria, parte de arriba" },
  { part: "puerta-1x4x6", color: "Gris piedra claro", qty: 1, from: "Torre de castillo 4x3x6" },
  { part: "placa-4x4", color: "Gris piedra claro", qty: 1, from: "Engranaje de 40 dientes" },
  // Tierras y metales
  { part: "ladrillo-1x4", color: "Marrón rojizo", qty: 2 },
  { part: "placa-4x4", color: "Marrón rojizo", qty: 2, from: "Placa 4x6" },
  { part: "placa-redonda-1x1", color: "Plata metalizado", qty: 10, from: "Teja redonda 1x1" },
  { part: "teja-1x2", color: "Oro perlado", qty: 5, from: "Lingotes de oro" },
  // Transparentes
  { part: "inclinada-2x2", color: "Transparente", qty: 2 },
  { part: "ladrillo-1x2", color: "Transparente", qty: 4 },
  { part: "ladrillo-2x2", color: "Azul claro transparente", qty: 2 },
  { part: "inclinada-2x2", color: "Azul claro transparente", qty: 2 },
  { part: "ladrillo-2x4", color: "Azul claro transparente", qty: 4, from: "Ladrillo DUPLO 2x4" },
  { part: "inclinada-4x2", color: "Azul claro transparente", qty: 1, from: "Parabrisas 2x4x2" },
  { part: "ladrillo-2x2", color: "Verde transparente", qty: 2, from: "Roca, parte de abajo" },
  { part: "teja-2x2", color: "Verde transparente", qty: 2, from: "Roca, parte de arriba" },
  { part: "ladrillo-2x2", color: "Rojo transparente", qty: 4 },
  { part: "ladrillo-1x2", color: "Rojo transparente", qty: 4 },
  { part: "ladrillo-redondo-2x2", color: "Amarillo transparente", qty: 2 },
  // Blanco
  { part: "ladrillo-2x2", color: "Blanco", qty: 4, from: "Ladrillo DUPLO 2x2" },
  { part: "ladrillo-1x2", color: "Blanco", qty: 2, from: "Piernas de minifigura" },
  { part: "ladrillo-redondo-1x1", color: "Blanco", qty: 5, from: "Uno es cabeza de minifigura" },
  { part: "placa-1x2", color: "Blanco", qty: 4, from: "Bisagras 1x2" },
  { part: "inclinada-1x2", color: "Blanco", qty: 2, from: "Tejas 1x3 de 25°" },
  { part: "ladrillo-1x1", color: "Blanco", qty: 2 },
  { part: "placa-2x8", color: "Blanco", qty: 2, from: "Alas de avión 4x9" },
  { part: "ventana-1x2x3", color: "Blanco", qty: 1, from: "Escalera" },
];

export const KITS: readonly KitDef[] = [
  {
    key: "pato",
    name: "Duck polybag",
    ref: "2000416",
    use: "Pequeñas actividades iniciales. Uso individual.",
    items: DUCK,
  },
  {
    key: "window-exploration",
    name: "Window Exploration Bag",
    ref: "2000409",
    use: "Fases iniciales de talleres, talleres sencillos o demos. Uso individual.",
    items: WINDOW,
  },
  {
    key: "starter",
    name: "Starter kit",
    ref: "2000414",
    use: "Talleres completos de unas 6 horas. Uso individual o grupal (máximo 4 personas).",
    items: STARTER,
  },
];

export function getKit(key: string | null | undefined): KitDef | null {
  return KITS.find((k) => k.key === key) ?? null;
}

export function kitTotal(kit: KitDef): number {
  return kit.items.reduce((s, i) => s + i.qty, 0);
}

/** Clave de inventario: pieza y color. */
export const stockKey = (part: number, color: number) => `${part}:${color}`;

/** Cuántas hay de cada pieza en cada color. */
export type Stock = Map<string, number>;

export function kitStock(kit: KitDef): Stock {
  const stock: Stock = new Map();
  for (const i of kit.items) {
    const key = stockKey(partByKey(i.part).id, colorIndex(i.color));
    stock.set(key, (stock.get(key) ?? 0) + i.qty);
  }
  return stock;
}

/** Lo que queda en la bolsa después de lo que ya está puesto (nunca baja de cero). */
export function stockLeft(stock: Stock, bricks: Iterable<Brick>): Stock {
  const left: Stock = new Map(stock);
  for (const b of bricks) {
    const key = stockKey(b.part, b.color);
    left.set(key, Math.max(0, (left.get(key) ?? 0) - 1));
  }
  return left;
}

/** La obra usa más piezas de las que trae el kit (o piezas que no trae). */
export function overStock(stock: Stock, bricks: Iterable<Brick>): boolean {
  const used = new Map<string, number>();
  for (const b of bricks) {
    const key = stockKey(b.part, b.color);
    const n = (used.get(key) ?? 0) + 1;
    if (n > (stock.get(key) ?? 0)) return true;
    used.set(key, n);
  }
  return false;
}

/** Lo que recibe el navegador: las piezas del kit en el orden de la bandeja. */
export interface PublicKit {
  key: string;
  name: string;
  total: number;
  items: { part: number; color: number; qty: number }[];
}

export function publicKit(kit: KitDef): PublicKit {
  const merged = kitStock(kit);
  return {
    key: kit.key,
    name: kit.name,
    total: kitTotal(kit),
    items: [...merged].map(([key, qty]) => {
      const [part, color] = key.split(":").map(Number);
      return { part, color, qty };
    }),
  };
}
