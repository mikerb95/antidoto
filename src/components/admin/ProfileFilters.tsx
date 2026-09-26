"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { colors } from "@/lib/theme";

interface Place {
  code: string;
  municipio: string;
  dpto: string;
  departamento: string;
}

interface Props {
  cargos: string[];
  /** Solo los municipios que alguien respondió, ya con su nombre. */
  places: Place[];
  value: { cargo: string; dpto: string; mpio: string };
  basePath: string;
  /** Los demás parámetros de la página (búsqueda, estado), para no perderlos. */
  keep: Record<string, string>;
}

/** Filtros por la ficha del participante: cambian la URL y la página se recalcula en el servidor. */
export default function ProfileFilters({ cargos, places, value, basePath, keep }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const dptos = [...new Map(places.map((p) => [p.dpto, p.departamento])).entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  const mpios = places.filter((p) => p.dpto === value.dpto).sort((a, b) => a.municipio.localeCompare(b.municipio, "es"));

  function go(next: Partial<Props["value"]>) {
    const v = { ...value, ...next };
    const params = new URLSearchParams(keep);
    for (const [k, x] of Object.entries(v)) if (x) params.set(k, x);
    start(() => router.push(`${basePath}?${params}`, { scroll: false }));
  }

  const active = value.cargo || value.dpto;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", opacity: pending ? 0.6 : 1 }}>
      {cargos.length > 0 && (
        <select aria-label="Filtrar por cargo" value={value.cargo} onChange={(e) => go({ cargo: e.target.value })} style={select}>
          <option value="">Todos los cargos</option>
          {cargos.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}
      {dptos.length > 0 && (
        <select aria-label="Filtrar por departamento" value={value.dpto} onChange={(e) => go({ dpto: e.target.value, mpio: "" })} style={select}>
          <option value="">Todos los departamentos</option>
          {dptos.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      )}
      {value.dpto && mpios.length > 1 && (
        <select aria-label="Filtrar por municipio" value={value.mpio} onChange={(e) => go({ mpio: e.target.value })} style={select}>
          <option value="">Todo el departamento</option>
          {mpios.map((m) => (
            <option key={m.code} value={m.code}>
              {m.municipio}
            </option>
          ))}
        </select>
      )}
      {active && (
        <button
          type="button"
          onClick={() => go({ cargo: "", dpto: "", mpio: "" })}
          style={{ border: "none", background: "none", color: colors.accentDark, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "0 4px" }}
        >
          Quitar filtros
        </button>
      )}
    </div>
  );
}

const select = {
  height: 36,
  borderRadius: 10,
  border: `1.5px solid ${colors.border}`,
  padding: "0 10px",
  fontSize: 13,
  background: "#fff",
  color: colors.ink,
  maxWidth: 240,
};
