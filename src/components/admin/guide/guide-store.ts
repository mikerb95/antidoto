// Estado de la guía paso a paso en el navegador del admin: qué guía va, en qué paso y cuáles ya
// terminó. Es una comodidad de cada persona, así que vive en localStorage; si el navegador no lo
// deja guardar, la guía funciona igual mientras la pestaña siga abierta.

export interface ActiveGuide {
  id: string;
  step: number;
  /** Hacia dónde se movió por última vez: un paso que no aplica se salta en esa dirección. */
  dir: 1 | -1;
}

export interface GuideState {
  active: ActiveGuide | null;
  done: string[];
  /** Ya abrió el panel alguna vez: el botón deja de mostrar el punto de "nuevo". */
  seen: boolean;
}

const KEY = "antidoto-guia";
const EMPTY: GuideState = { active: null, done: [], seen: true };

let state: GuideState | null = null;
const listeners = new Set<() => void>();

function load(): GuideState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { active: null, done: [], seen: false };
    const v = JSON.parse(raw) as Partial<GuideState>;
    const a = v.active;
    return {
      active: a && typeof a.id === "string" && Number.isInteger(a.step) ? { id: a.id, step: Math.max(0, a.step), dir: a.dir === -1 ? -1 : 1 } : null,
      done: Array.isArray(v.done) ? v.done.filter((d): d is string => typeof d === "string") : [],
      seen: v.seen === true,
    };
  } catch {
    return { active: null, done: [], seen: false };
  }
}

function save(next: GuideState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sin almacenamiento (ventana privada, datos bloqueados): queda solo en memoria.
  }
  listeners.forEach((fn) => fn());
}

export const guideStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      state = load();
      fn();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  },
  get(): GuideState {
    if (!state) state = load();
    return state;
  },
  server(): GuideState {
    return EMPTY;
  },
  start(id: string, step: number) {
    save({ ...guideStore.get(), active: { id, step, dir: 1 }, seen: true });
  },
  go(step: number, dir: 1 | -1) {
    const s = guideStore.get();
    if (!s.active || s.active.step === step) return;
    save({ ...s, active: { ...s.active, step, dir } });
  },
  finish(markDone: boolean) {
    const s = guideStore.get();
    const done = markDone && s.active && !s.done.includes(s.active.id) ? [...s.done, s.active.id] : s.done;
    save({ ...s, active: null, done });
  },
  markSeen() {
    const s = guideStore.get();
    if (!s.seen) save({ ...s, seen: true });
  },
};
