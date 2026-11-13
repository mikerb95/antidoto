"use client";

// Visor en tiempo real del admin: todas las obras de un reto en una empresa, creciendo mientras
// los participantes construyen. Pregunta cada pocos segundos qué cambió (el constructor de cada
// persona guarda solo) y las piezas nuevas caen con su animación. Un solo contexto WebGL para
// todas las obras, como el proyector de los equipos.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { decodeBuild } from "@/lib/bricks/codec";
import { diffBricks, keyed, watchState, type WatchState } from "@/lib/bricks/watch";
import type { Brick } from "@/lib/bricks/world";
import type { WatchedWork } from "@/lib/build-data";
import { CityView } from "../team/city";
import styles from "./watch.module.css";

const POLL_MS = 4000;
const FRAME = "#3BC8F3";

const STATE_LABEL: Record<WatchState, string> = {
  "sin-empezar": "Sin empezar",
  construyendo: "Construyendo",
  quieto: "Sin cambios hace un rato",
  entrego: "Entregó",
};

interface Props {
  title: string;
  company: string;
  missionId: string;
  companyId: number;
  backHref: string;
  initial: { now: string; base: number; works: WatchedWork[] };
}

function decode(data: string): Brick[] {
  try {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    return keyed(decodeBuild(bytes).bricks);
  } catch {
    return [];
  }
}

export default function WatchScreen({ title, company, missionId, companyId, backHref, initial }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cityRef = useRef<CityView | null>(null);
  /** Obra que ya se ve de cada persona, con su número de base en la escena. */
  const shown = useRef(new Map<string, { plot: number; bricks: Brick[] }>());
  const labels = useRef(new Map<string, HTMLSpanElement>());
  const [works, setWorks] = useState(initial.works);
  const [now, setNow] = useState(() => Date.now());
  const [focus, setFocus] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  /** Pone en la escena lo que llegó del servidor; solo anima las piezas que cambiaron. */
  function paint(list: WatchedWork[]) {
    const city = cityRef.current;
    if (!city) return;
    for (const w of list) {
      if (!w.started) continue;
      const prev = shown.current.get(w.id);
      if (!prev) {
        const plot = shown.current.size + 1;
        const bricks = w.data ? decode(w.data) : [];
        shown.current.set(w.id, { plot, bricks });
        city.setTeam(plot, FRAME, bricks);
        continue;
      }
      if (!w.data) continue;
      const next = decode(w.data);
      if (!city.applyOps(prev.plot, diffBricks(prev.bricks, next))) city.setTeam(prev.plot, FRAME, next);
      prev.bricks = next;
    }
  }

  // Escena 3D y nombres debajo de cada base.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const city = new CityView(canvas, "medio", initial.base);
    cityRef.current = city;
    shown.current = new Map();
    paint(initial.works);
    city.setSpin(true);
    const parent = canvas.parentElement!;
    const ro = new ResizeObserver(() => city.resize(parent.clientWidth, parent.clientHeight));
    ro.observe(parent);
    city.resize(parent.clientWidth, parent.clientHeight);
    let raf = 0;
    const tick = () => {
      for (const [id, { plot }] of shown.current) {
        const el = labels.current.get(id);
        if (!el) continue;
        const p = city.screenPoint(plot);
        el.style.opacity = p ? "1" : "0";
        if (p) el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      city.dispose();
      cityRef.current = null;
    };
    // La escena se arma una vez; lo que llega después entra por la consulta periódica.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.base]);

  // Consulta periódica: solo trae completas las obras que cambiaron desde la última vez.
  useEffect(() => {
    let since = initial.now;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await fetch(`/api/bricks/visor?mission=${encodeURIComponent(missionId)}&company=${companyId}&since=${encodeURIComponent(since)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { now: string; works: WatchedWork[] };
        if (stop) return;
        since = body.now;
        paint(body.works);
        setWorks(body.works);
        setOffline(false);
      } catch {
        if (!stop) setOffline(true);
      }
      if (!stop) {
        setNow(Date.now());
        timer = setTimeout(poll, POLL_MS);
      }
    };
    timer = setTimeout(poll, POLL_MS);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [missionId, companyId, initial.now]);

  function look(id: string | null) {
    const city = cityRef.current;
    setFocus(id);
    if (!city) return;
    const plot = id ? shown.current.get(id)?.plot : undefined;
    if (plot) city.focus(plot);
    else city.showAll();
  }

  const states = works.map((w) => watchState(w, now));
  const count = (s: WatchState) => states.filter((x) => x === s).length;
  const focused = focus ? works.find((w) => w.id === focus) : null;
  const visible = works.filter((w) => w.started);

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {visible.map((w) => (
          <span
            key={w.id}
            ref={(el) => {
              if (el) labels.current.set(w.id, el);
              else labels.current.delete(w.id);
            }}
            className={`${styles.label} ${focus === w.id ? styles.labelOn : ""}`}
            style={{ opacity: 0 }}
            aria-hidden
          >
            {w.name}
          </span>
        ))}
        {visible.length === 0 && (
          <div className={styles.empty}>
            <b>Todavía no hay obras</b>
            <span>Cuando alguien entre con el código y empiece a construir, su obra aparece aquí.</span>
          </div>
        )}
        {focused && (
          <div className={styles.focusChip}>
            <b>{focused.name}</b>
            <span>
              {focused.count} {focused.count === 1 ? "pieza" : "piezas"}
            </span>
            <button type="button" onClick={() => look(null)}>
              Ver todas
            </button>
          </div>
        )}
      </div>

      <aside className={styles.panel} aria-label="Participantes">
        <div className={styles.head}>
          <Link href={backHref} className={styles.back}>
            ‹ Volver
          </Link>
          <span className={`${styles.live} ${offline ? styles.liveOff : ""}`}>{offline ? "Sin conexión, reintentando" : "En vivo"}</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.company}>{company}</p>
        <div className={styles.counts}>
          <span>
            <b>{count("construyendo")}</b> construyendo
          </span>
          <span>
            <b>{count("entrego")}</b> entregaron
          </span>
          <span>
            <b>{count("sin-empezar") + count("quieto")}</b> en pausa o sin empezar
          </span>
        </div>
        {works.length === 0 ? (
          <p className={styles.none}>Nadie ha entrado con el código todavía.</p>
        ) : (
          <ul className={styles.list}>
            {works.map((w, i) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={styles.person}
                  aria-pressed={focus === w.id}
                  disabled={!w.started}
                  onClick={() => look(focus === w.id ? null : w.id)}
                >
                  <i className={styles.dot} data-state={states[i]} aria-hidden />
                  <span className={styles.personText}>
                    <span className={styles.personName}>{w.name}</span>
                    <span className={styles.personState}>{STATE_LABEL[states[i]]}</span>
                  </span>
                  <span className={styles.pieces}>{w.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.note}>Se actualiza solo cada pocos segundos. Toca a alguien para ver su obra de cerca.</p>
      </aside>
    </div>
  );
}
