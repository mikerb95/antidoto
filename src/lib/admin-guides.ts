// Guías paso a paso del portal (pedido del 2026-11-12). Cada guía es un recorrido: lleva al admin
// a la pantalla correcta, ilumina el botón o campo que toca usar y explica qué hacer. Los
// elementos se marcan en las pantallas con `data-guide="<target>"`.
//
// Lógica pura y datos: el asistente que las muestra está en components/admin/guide.

export type GuideRole = "super" | "empresa";

export interface GuideStep {
  /** Patrón de la ruta donde ocurre el paso. */
  path: string;
  /** A dónde lleva "Llévame" si el admin está en otra pantalla. `{empresa}` = su empresa. */
  href?: string;
  /** Cómo llegar cuando no hay un enlace directo (una empresa o un juego en particular). */
  goHint?: string;
  /** Valor de `data-guide` del elemento que se ilumina; sin él, el paso es solo una explicación. */
  target?: string;
  title: string;
  body: string;
  /** Si el elemento no está en la pantalla (no aplica a este caso), el paso se salta solo. */
  optional?: boolean;
  /** Solo para este rol. */
  roles?: GuideRole[];
}

export interface Guide {
  id: string;
  title: string;
  summary: string;
  roles: GuideRole[];
  steps: GuideStep[];
}

const EMPRESAS = "^/admin/empresas$";
const EMPRESA = "^/admin/empresas/\\d+$";

/** Primer paso de las guías que pasan por la página de una empresa. */
const openCompany: GuideStep[] = [
  {
    path: EMPRESAS,
    href: "/admin/empresas",
    target: "empresa-tarjeta",
    title: "Abre la empresa",
    body: "Toca el nombre de la empresa con la que vas a trabajar.",
    roles: ["super"],
  },
];

export const GUIDES: readonly Guide[] = [
  {
    id: "crear-empresa",
    title: "Crear una empresa",
    summary: "Nombre, logo, colores y mensaje de bienvenida. Es lo primero antes de asignar actividades.",
    roles: ["super"],
    steps: [
      {
        path: EMPRESAS,
        href: "/admin/empresas",
        target: "empresa-nueva",
        title: "Empieza por la lista de empresas",
        body: "Toca «＋ Nueva empresa».",
      },
      {
        path: "^/admin/empresas/nueva$",
        href: "/admin/empresas/nueva",
        target: "marca-1",
        title: "El nombre",
        body: "Escríbelo como quieres que aparezca en los códigos, las pantallas de los participantes y los informes.",
      },
      {
        path: "^/admin/empresas/nueva$",
        target: "marca-2",
        title: "El logo (opcional)",
        body: "Sube un PNG o SVG, mejor con fondo transparente. Indica si está pensado para fondo claro u oscuro, así se ve bien en todas partes.",
      },
      {
        path: "^/admin/empresas/nueva$",
        target: "marca-3",
        title: "Los colores",
        body: "El principal pinta botones, etiquetas y gráficos de lo que ven sus participantes. Si subiste el logo, te proponemos colores sacados de él.",
      },
      {
        path: "^/admin/empresas/nueva$",
        target: "marca-4",
        title: "Mensaje de bienvenida (opcional)",
        body: "Una frase corta que aparece bajo el saludo de cada participante. Por ejemplo: «Gracias por cuidarte y cuidar a tu equipo».",
      },
      {
        path: "^/admin/empresas/nueva$",
        target: "marca-guardar",
        title: "Guarda",
        body: "Toca «Crear empresa». Te llevamos a su página.",
      },
      {
        path: EMPRESA,
        target: "empresa-asignar",
        title: "La empresa ya existe",
        body: "Desde aquí le asignas actividades. Cuando quieras, sigue con la guía «Asignar una actividad».",
      },
    ],
  },
  {
    id: "asignar-actividad",
    title: "Asignar una actividad",
    summary: "Elegir la actividad, la fecha de cierre y los datos que se piden. Al final queda el código para los participantes.",
    roles: ["super"],
    steps: [
      ...openCompany,
      {
        path: EMPRESA,
        goHint: "Abre la empresa desde Empresas.",
        target: "empresa-asignar",
        title: "Asignar actividad",
        body: "Toca «＋ Asignar actividad». También puedes hacerlo desde la Biblioteca, con el botón «Asignar» de cada actividad.",
      },
      {
        path: "^/admin/asignar$",
        href: "/admin/asignar",
        target: "asignar-empresa",
        title: "La empresa",
        body: "Si entraste desde la página de la empresa, ya viene elegida. Revisa que sea la correcta.",
      },
      {
        path: "^/admin/asignar$",
        target: "asignar-actividad",
        title: "La actividad",
        body: "Elige una de la biblioteca. Las series con varias estaciones (como la Ruta del café) se asignan completas y se juegan en orden con el mismo código.",
      },
      {
        path: "^/admin/asignar$",
        target: "asignar-kit",
        optional: true,
        title: "El kit de piezas",
        body: "Solo en los retos de construcción: cada persona construye con las piezas de la bolsa o caja elegida, en sus colores y cantidades. «Todas las piezas» no pone límite.",
      },
      {
        path: "^/admin/asignar$",
        target: "asignar-fecha",
        title: "Hasta cuándo (opcional)",
        body: "El último día para jugar. Si lo dejas vacío, el código sirve hasta que lo pauses o lo quites. Se puede cambiar después.",
      },
      {
        path: "^/admin/asignar$",
        target: "asignar-datos",
        title: "Qué se le pide a cada persona",
        body: "Cargo (de la lista que escribas, uno por línea) y departamento y municipio. Con eso el informe se puede filtrar sin nombres escritos de mil formas.",
      },
      {
        path: "^/admin/asignar$",
        target: "asignar-enviar",
        title: "Crea el código",
        body: "Toca «Asignar y crear código». Te llevamos de vuelta a la empresa con el código listo.",
      },
      {
        path: EMPRESA,
        target: "codigo",
        title: "Este es el código",
        body: "Los participantes entran con él en la página de inicio. Para repartirlo, sigue con la guía «Compartir y manejar el código».",
      },
    ],
  },
  {
    id: "compartir-codigo",
    title: "Compartir y manejar el código",
    summary: "Repartir el QR o el enlace, pausar, cambiar la fecha de cierre o quitar la actividad.",
    roles: ["super", "empresa"],
    steps: [
      ...openCompany,
      {
        path: EMPRESA,
        href: "/admin/empresas/{empresa}",
        goHint: "Abre la empresa desde Empresas.",
        target: "codigo",
        title: "El código de la actividad",
        body: "Cada actividad asignada muestra su código y su estado: abierto, pausado o cerrado. El botón de copiar lo deja listo para pegar.",
      },
      {
        path: EMPRESA,
        target: "codigo-compartir",
        optional: true,
        title: "Compartir",
        body: "Muestra el QR y el enlace directo: quien lo abre entra con el código ya escrito. Proyecta el QR en la sala o pega el enlace en el chat del equipo.",
      },
      {
        path: EMPRESA,
        target: "codigo-opciones",
        optional: true,
        roles: ["super"],
        title: "Opciones del código",
        body: "Pausar (nadie juega hasta reanudar), cambiar el último día para jugar o quitar la actividad. Quitarla la archiva: los resultados se conservan y se puede restaurar.",
      },
    ],
  },
  {
    id: "ver-resultados",
    title: "Ver resultados e informe",
    summary: "El avance de cada persona, las respuestas por riesgo, los filtros y los certificados.",
    roles: ["super", "empresa"],
    steps: [
      ...openCompany,
      {
        path: EMPRESA,
        href: "/admin/empresas/{empresa}",
        goHint: "Abre la empresa desde Empresas.",
        target: "actividad",
        title: "El avance en vivo",
        body: "Cada actividad muestra quién entró y cuánto lleva cada persona. Se actualiza solo a medida que juegan.",
      },
      {
        path: EMPRESA,
        target: "actividad-certificados",
        optional: true,
        title: "Certificados",
        body: "Aparece cuando alguien termina: abre los certificados de quienes completaron la actividad, listos para imprimir o guardar en PDF.",
      },
      {
        path: EMPRESA,
        target: "actividad-resultados",
        title: "Resultados e informe",
        body: "Toca «Ver resultados e informe».",
      },
      {
        path: "^/admin/empresas/\\d+/actividades/[^/]+$",
        title: "Lee y descarga",
        body: "Aquí están las respuestas por riesgo, los aciertos y el detalle por persona. Filtra por cargo o lugar y descarga el informe para la empresa.",
      },
    ],
  },
  {
    id: "editar-textos",
    title: "Editar los textos de una escena",
    summary: "Cambiar preguntas, opciones y explicaciones de los riesgos para ajustarlos a una empresa o un sector.",
    roles: ["super"],
    steps: [
      {
        path: "^/admin/biblioteca$",
        href: "/admin/biblioteca",
        target: "biblioteca-filtros",
        title: "La biblioteca",
        body: "Aquí están todas las actividades. Filtra por tipo: escenas interactivas, construcción o juegos en vivo.",
      },
      {
        path: "^/admin/biblioteca$",
        target: "biblioteca-escena",
        title: "Abre una escena",
        body: "Toca la imagen o «Ver estaciones».",
      },
      {
        path: "^/admin/biblioteca/actividad/[^/]+$",
        goHint: "Abre una escena desde la Biblioteca.",
        target: "estacion-probar",
        title: "Pruébala primero",
        body: "«Probar» abre la escena tal como la juega un participante. No guarda nada ni cuenta en los resultados.",
      },
      {
        path: "^/admin/biblioteca/actividad/[^/]+$",
        target: "estacion-editar",
        title: "Editar textos",
        body: "Toca «Editar textos» en la estación que quieres cambiar.",
      },
      {
        path: "^/admin/biblioteca/(?!actividad/|construccion/|equipos/)[^/]+$",
        target: "riesgo",
        title: "Cambia y guarda cada riesgo",
        body: "Título, pregunta, opciones (marca la correcta), explicación y buena práctica. Guarda cada riesgo por separado; «Restaurar el texto original» lo deshace. El cambio aplica a todas las empresas.",
      },
    ],
  },
  {
    id: "juego-en-vivo",
    title: "Crear un juego en vivo",
    summary: "Un quiz para proyectar en sala o un desafío para jugar a su ritmo desde el celular.",
    roles: ["super", "empresa"],
    steps: [
      {
        path: "^/admin/juegos$",
        href: "/admin/juegos",
        target: "juego-nuevo",
        title: "Juegos en vivo",
        body: "Toca «＋ Nuevo juego». Si ya tienes uno parecido, puedes duplicarlo desde la lista.",
      },
      {
        path: "^/admin/juegos/\\d+$",
        goHint: "Abre un juego desde Juegos en vivo.",
        target: "juego-datos",
        title: "Nombre y para quién",
        body: "Ponle un nombre que reconozcas. El superadmin elige si es para todas las empresas o solo para una.",
      },
      {
        path: "^/admin/juegos/\\d+$",
        target: "juego-preguntas",
        optional: true,
        title: "Las preguntas",
        body: "Agrega las que quieras: quiz, verdadero o falso, encuesta o nube de palabras. En cada una eliges el tiempo y la respuesta correcta.",
      },
      {
        path: "^/admin/juegos/\\d+$",
        target: "juego-guardar",
        optional: true,
        title: "Guarda",
        body: "Toca «Guardar cambios». La partida siempre usa la versión guardada.",
      },
      {
        path: "^/admin/juegos/\\d+$",
        target: "juego-jugar",
        optional: true,
        title: "A jugar",
        body: "«Abrir partida» para proyectar: todos entran con PIN o QR y juegan al tiempo. «Asignar desafío» para que cada persona juegue sola desde su celular hasta la fecha de cierre.",
      },
    ],
  },
  {
    id: "marca-empresa",
    title: "Logo y colores de la empresa",
    summary: "Que sus participantes vean su marca en las actividades y los informes.",
    roles: ["super", "empresa"],
    steps: [
      ...openCompany,
      {
        path: EMPRESA,
        href: "/admin/empresas/{empresa}",
        goHint: "Abre la empresa desde Empresas.",
        target: "empresa-ajustes",
        title: "Ajustes de la empresa",
        body: "Abre «Ajustes de la empresa» y elige «Logo y colores» (si eres admin de la empresa, es el botón «Logo y colores»).",
      },
      {
        path: "^/admin/empresas/\\d+/marca$",
        target: "marca-2",
        title: "El logo",
        body: "Sube un PNG o SVG, mejor con fondo transparente, e indica si es para fondo claro u oscuro.",
      },
      {
        path: "^/admin/empresas/\\d+/marca$",
        target: "marca-3",
        title: "Los colores",
        body: "El principal pinta botones, etiquetas y gráficos. Ajustamos el contraste para que todo se lea.",
      },
      {
        path: "^/admin/empresas/\\d+/marca$",
        target: "marca-guardar",
        title: "Guarda",
        body: "Toca «Guardar cambios». Lo verán las personas que entren desde ahora.",
      },
    ],
  },
  {
    id: "acceso-portal",
    title: "Dar acceso a la empresa",
    summary: "Crear usuarios para que la empresa vea su avance e informes y lance sus juegos en vivo.",
    roles: ["super"],
    steps: [
      ...openCompany,
      {
        path: EMPRESA,
        goHint: "Abre la empresa desde Empresas.",
        target: "usuarios",
        title: "Personas con acceso al portal",
        body: "Crea un usuario por persona. Ven solo lo de su empresa (avance, resultados e informes) y pueden lanzar juegos en vivo. No asignan actividades ni cambian códigos.",
      },
    ],
  },
];

/** Las guías y los pasos que le tocan a un rol. */
export function guidesFor(role: GuideRole): Guide[] {
  return GUIDES.filter((g) => g.roles.includes(role)).map((g) => ({
    ...g,
    steps: g.steps.filter((s) => !s.roles || s.roles.includes(role)),
  }));
}

export function stepMatches(step: GuideStep, pathname: string): boolean {
  return new RegExp(step.path).test(pathname);
}

/** Por dónde empieza una guía: el primer paso de la pantalla donde ya está el admin. */
export function startStep(guide: Guide, pathname: string): number {
  const i = guide.steps.findIndex((s) => stepMatches(s, pathname));
  return i < 0 ? 0 : i;
}

/**
 * El paso que corresponde mostrar. Si el admin ya llegó a la pantalla del paso siguiente (tocó el
 * botón que se le pidió), la guía avanza sola; nunca salta más de uno.
 */
export function resolveStep(guide: Guide, step: number, pathname: string): number {
  const current = guide.steps[step];
  const next = guide.steps[step + 1];
  if (current && !stepMatches(current, pathname) && next && stepMatches(next, pathname)) return step + 1;
  return step;
}

export function stepHref(step: GuideStep, companyId: number | null): string | null {
  if (!step.href) return null;
  if (step.href.includes("{empresa}")) return companyId === null ? null : step.href.replace("{empresa}", String(companyId));
  return step.href;
}
