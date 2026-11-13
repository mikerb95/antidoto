"use client";

// Asistente de guías del portal: el botón "Guía" de la barra superior abre la lista de recorridos;
// al elegir uno, un globo acompaña al admin pantalla por pantalla e ilumina lo que toca usar. No
// bloquea nada: la página se sigue usando normal mientras la guía está abierta.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { guidesFor, resolveStep, startStep, stepHref, stepMatches, type Guide, type GuideRole } from "@/lib/admin-guides";
import { CheckIcon } from "@/components/icons";
import { guideStore } from "./guide-store";
import styles from "./guide.module.css";

interface Props {
  role: GuideRole;
  /** Empresa del admin de empresa: para llevarlo directo a su página. */
  companyId: number | null;
}

export default function GuideAssistant({ role, companyId }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useSyncExternalStore(guideStore.subscribe, guideStore.get, guideStore.server);
  const guides = guidesFor(role);
  const [panelOpen, setPanelOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);

  const guide = state.active ? (guides.find((g) => g.id === state.active!.id) ?? null) : null;
  const stored = guide ? Math.min(state.active!.step, guide.steps.length - 1) : 0;
  const stepIndex = guide ? resolveStep(guide, stored, pathname) : 0;

  // Llegó solo a la pantalla del paso siguiente (tocó el botón que se le pidió): se guarda el avance.
  useEffect(() => {
    if (guide && stepIndex !== state.active?.step) guideStore.go(stepIndex, 1);
  }, [guide, stepIndex, state.active?.step]);

  function start(g: Guide) {
    const first = startStep(g, pathname);
    guideStore.start(g.id, first);
    setPanelOpen(false);
    const step = g.steps[first];
    const href = stepHref(step, companyId);
    if (!stepMatches(step, pathname) && href) router.push(href);
  }

  function openPanel() {
    guideStore.markSeen();
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    launcher.current?.focus();
  }

  return (
    <>
      <button
        ref={launcher}
        type="button"
        className={styles.launcher}
        onClick={openPanel}
        aria-haspopup="dialog"
        aria-expanded={panelOpen}
        aria-label="Guía paso a paso"
      >
        <span className={styles.launcherIcon} aria-hidden>
          ?
        </span>
        <span className={styles.launcherText}>Guía</span>
        {!state.seen && <span className={styles.launcherDot} aria-label="Nuevo" />}
      </button>
      {panelOpen &&
        createPortal(<GuidePanel guides={guides} done={state.done} activeId={guide?.id ?? null} onStart={start} onClose={closePanel} />, document.body)}
      {guide &&
        createPortal(
          <Coach
            key={`${guide.id}-${stepIndex}`}
            guide={guide}
            index={stepIndex}
            dir={state.active!.dir}
            pathname={pathname}
            companyId={companyId}
            onGo={(href) => router.push(href)}
          />,
          document.body,
        )}
    </>
  );
}

// --- Panel con la lista de guías ------------------------------------------------------------

function GuidePanel({
  guides,
  done,
  activeId,
  onStart,
  onClose,
}: {
  guides: Guide[];
  done: string[];
  activeId: string | null;
  onStart: (g: Guide) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finished = guides.filter((g) => done.includes(g.id)).length;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guia-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.panelHead}>
          <div>
            <h2 id="guia-titulo" className={styles.panelTitle}>
              Guía paso a paso
            </h2>
            <p className={styles.panelIntro}>Elige qué quieres hacer. Te llevamos a cada pantalla y te mostramos dónde tocar.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar la guía">
            ×
          </button>
        </div>
        {finished > 0 && (
          <p className={styles.progress}>
            <span className={styles.progressBar} aria-hidden>
              <span style={{ width: `${(finished / guides.length) * 100}%` }} />
            </span>
            {finished} de {guides.length} guías hechas
          </p>
        )}
        <ol className={styles.list}>
          {guides.map((g, i) => {
            const isDone = done.includes(g.id);
            const isActive = activeId === g.id;
            return (
              <li key={g.id}>
                <button type="button" className={styles.item} onClick={() => onStart(g)} aria-current={isActive ? "step" : undefined}>
                  <span className={`${styles.itemNum} ${isDone ? styles.itemNumDone : ""}`} aria-hidden>
                    {isDone ? <CheckIcon /> : i + 1}
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{g.title}</span>
                    <span className={styles.itemSummary}>{g.summary}</span>
                    <span className={styles.itemMeta}>
                      {g.steps.length} pasos
                      {isActive ? " · en curso" : isDone ? " · hecha" : ""}
                    </span>
                  </span>
                  <span className={styles.itemGo} aria-hidden>
                    {isActive ? "Seguir" : isDone ? "Repetir" : "Empezar"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

// --- Globo que acompaña cada paso ---------------------------------------------------------------

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** undefined = todavía buscando; null = no está en la pantalla. */
type Found = Box | null | undefined;

/** Sigue la posición del elemento marcado en cada cuadro: la página puede moverse, cargar o cambiar. */
function useTarget(target: string | undefined, enabled: boolean): Found {
  const [found, setFound] = useState<{ box: Box | null } | undefined>(undefined);
  useEffect(() => {
    if (!enabled || !target) return;
    let raf = 0;
    let last = "";
    const tick = () => {
      const el = document.querySelector(`[data-guide="${target}"]`);
      const r = el?.getBoundingClientRect();
      const box = r && r.width > 0 && r.height > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      const key = box ? `${Math.round(box.top)},${Math.round(box.left)},${Math.round(box.width)},${Math.round(box.height)}` : "no";
      if (key !== last) {
        last = key;
        setFound({ box });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled]);
  return enabled && target ? found?.box : null;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface CoachProps {
  guide: Guide;
  index: number;
  dir: 1 | -1;
  pathname: string;
  companyId: number | null;
  onGo: (href: string) => void;
}

function Coach({ guide, index, dir, pathname, companyId, onGo }: CoachProps) {
  const step = guide.steps[index];
  const total = guide.steps.length;
  const last = index === total - 1;
  const onPage = stepMatches(step, pathname);
  const box = useTarget(step.target, onPage);
  const href = stepHref(step, companyId);
  const scrolled = useRef(false);

  // El elemento queda a la vista una vez por paso, sin pelear con el scroll del admin.
  useEffect(() => {
    if (!box || scrolled.current || !step.target) return;
    scrolled.current = true;
    const margin = 90;
    if (box.top < margin || box.top + Math.min(box.height, 320) > window.innerHeight - margin) {
      document.querySelector(`[data-guide="${step.target}"]`)?.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }, [box, step.target]);

  // Un paso que no aplica aquí (sin kit, sin certificados todavía) se salta en la dirección en que iba.
  const missing = onPage && !!step.target && box === null;
  useEffect(() => {
    if (!missing || !step.optional) return;
    const id = setTimeout(() => {
      const next = index + dir;
      if (next < 0) guideStore.go(index + 1, 1);
      else if (next >= total) guideStore.finish(true);
      else guideStore.go(next, dir);
    }, 1200);
    return () => clearTimeout(id);
  }, [missing, step.optional, index, dir, total]);

  const next = () => (last ? guideStore.finish(true) : guideStore.go(index + 1, 1));
  const back = () => guideStore.go(index - 1, -1);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 640;
  const PAD = 6;
  const hole = box ? { top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 } : null;

  // Posición del globo: debajo del elemento si cabe, si no encima; en celular, una hoja abajo o arriba.
  const W = 360;
  const H = 250;
  let place: React.CSSProperties;
  if (narrow) {
    const lowTarget = hole && hole.top + hole.height / 2 > vh * 0.55;
    place = lowTarget ? { top: 12, left: 12, right: 12 } : { bottom: 12, left: 12, right: 12 };
  } else if (hole && hole.top + hole.height + 14 + H < vh) {
    place = { top: hole.top + hole.height + 14, left: clamp(hole.left, 16, vw - W - 16), width: W };
  } else if (hole && hole.top - 14 - H > 0) {
    place = { bottom: vh - hole.top + 14, left: clamp(hole.left, 16, vw - W - 16), width: W };
  } else {
    place = { bottom: 24, right: 24, width: W };
  }

  return (
    <>
      {hole && (
        <div
          className={styles.spotlight}
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          aria-hidden
        />
      )}
      <section className={styles.coach} style={place} role="dialog" aria-modal="false" aria-labelledby="guia-paso" aria-live="polite">
        <div className={styles.coachHead}>
          <span className={styles.coachGuide}>
            {guide.title} · Paso {index + 1} de {total}
          </span>
          <button type="button" className={styles.close} onClick={() => guideStore.finish(false)} aria-label="Salir de la guía">
            ×
          </button>
        </div>
        <div className={styles.steps} aria-hidden>
          {guide.steps.map((_, i) => (
            <span key={i} className={i < index ? styles.stepDone : i === index ? styles.stepNow : undefined} />
          ))}
        </div>
        <h3 id="guia-paso" className={styles.coachTitle}>
          {step.title}
        </h3>
        <p className={styles.coachBody}>{step.body}</p>

        {!onPage && (
          <div className={styles.away}>
            <span>Este paso es en otra pantalla.</span>
            {href ? (
              <a
                href={href}
                className={styles.goBtn}
                onClick={(e) => {
                  // Navegación del lado del cliente, sin recargar el portal.
                  e.preventDefault();
                  onGo(href);
                }}
              >
                Llévame
              </a>
            ) : (
              step.goHint && <b>{step.goHint}</b>
            )}
          </div>
        )}
        {missing && !step.optional && <p className={styles.hint}>No lo vemos en esta pantalla todavía. Si la página sigue cargando, espera un momento.</p>}
        {missing && step.optional && <p className={styles.hint}>Esto no aplica aquí: pasamos al siguiente.</p>}

        <div className={styles.coachFoot}>
          <button type="button" className={styles.backBtn} onClick={back} disabled={index === 0}>
            Atrás
          </button>
          <button type="button" className={styles.nextBtn} onClick={next}>
            {last ? "Terminar" : "Siguiente"}
          </button>
        </div>
      </section>
    </>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
