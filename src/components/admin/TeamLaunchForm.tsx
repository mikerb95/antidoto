"use client";

import { useActionState, useState } from "react";
import { launchTeamSession, type LaunchState } from "@/lib/brick-actions";
import { colors } from "@/lib/theme";
import { fieldLabel, filledButton } from "@/lib/styles";

function minutes(seconds: number) {
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} min`;
}

interface KitOption {
  key: string;
  name: string;
  total: number;
  maxPeople: number;
}

/** Tamaño de equipo, duración y kit, y a la pantalla del proyector. */
export default function TeamLaunchForm({ mode, times, sizes, kits }: { mode: string; times: number[]; sizes: number[]; kits: KitOption[] }) {
  const [state, action, pending] = useActionState<LaunchState, FormData>(launchTeamSession, null);
  const [size, setSize] = useState(sizes[0]);
  const [kit, setKit] = useState("");
  // Un kit que no alcanza para el tamaño elegido no se puede enviar.
  const chosen = kits.find((k) => k.key === kit && k.maxPeople >= size)?.key ?? "";

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <input type="hidden" name="mode" value={mode} />
      {sizes.length === 1 ? (
        // Un solo tamaño posible (Teléfono Roto se juega en parejas): no hay nada que elegir.
        <input type="hidden" name="teamSize" value={sizes[0]} />
      ) : (
        <fieldset style={fieldset}>
          <legend style={fieldLabel}>Personas por equipo</legend>
          <div style={row}>
            {[...sizes].sort((a, b) => a - b).map((n) => (
              <label key={n} style={choice}>
                <input type="radio" name="teamSize" value={n} checked={n === size} onChange={() => setSize(n)} required />
                {n}
              </label>
            ))}
          </div>
          <span style={hint}>Los equipos se arman solos a medida que la gente entra, siempre parejos.</span>
        </fieldset>
      )}
      <fieldset style={fieldset}>
        <legend style={fieldLabel}>Tiempo para construir</legend>
        <div style={row}>
          {[...times].sort((a, b) => a - b).map((t) => (
            <label key={t} style={choice}>
              <input type="radio" name="timeLimit" value={t} defaultChecked={t === times[0]} required />
              {minutes(t)}
            </label>
          ))}
        </div>
        <span style={hint}>Desde el proyector se puede sumar un minuto o terminar antes.</span>
      </fieldset>
      {kits.length > 0 && (
        <fieldset style={fieldset}>
          <legend style={fieldLabel}>Kit de piezas</legend>
          <div style={row}>
            <label style={choice}>
              <input type="radio" name="kit" value="" checked={chosen === ""} onChange={() => setKit("")} />
              Todas las piezas
            </label>
            {kits.map((k) => (
              <label key={k.key} style={{ ...choice, opacity: k.maxPeople >= size ? 1 : 0.5 }}>
                <input type="radio" name="kit" value={k.key} checked={chosen === k.key} disabled={k.maxPeople < size} onChange={() => setKit(k.key)} />
                {k.name} · {k.total} piezas
              </label>
            ))}
          </div>
          <span style={hint}>
            Cada equipo recibe su propia bolsa y la comparte entre sus integrantes.
            {kits.some((k) => k.maxPeople < size) && ` Con equipos de ${size} personas no alcanza: elige equipos más pequeños.`}
          </span>
        </fieldset>
      )}
      {state?.error && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: colors.danger, fontWeight: 600 }}>
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-filled" disabled={pending} style={{ ...filledButton, alignSelf: "flex-start", height: 48, padding: "0 24px", fontSize: 15 }}>
        {pending ? "Abriendo la sala…" : "▸ Abrir la sala en el proyector"}
      </button>
    </form>
  );
}

const fieldset: React.CSSProperties = { border: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 };
const row: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const choice: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 12,
  border: `1.5px solid ${colors.border}`,
  background: "#fff",
  fontSize: 15,
  fontWeight: 600,
  color: colors.ink,
  cursor: "pointer",
};
const hint: React.CSSProperties = { fontSize: 12.5, color: colors.muted, lineHeight: 1.45 };
