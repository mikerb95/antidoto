import { watchWorks } from "@/lib/build-data";
import { BRICKS_VISIBLE } from "@/lib/bricks/visible";
import { fail, json, requireHost } from "@/lib/live-http";

/** Las obras de un reto en una empresa para el visor en tiempo real del admin. */
export async function GET(request: Request) {
  if (!BRICKS_VISIBLE) return fail("No disponible.", 404);
  const user = await requireHost(request);
  if (user instanceof Response) return user;
  const url = new URL(request.url);
  const mission = url.searchParams.get("mission") ?? "";
  const company = Number(url.searchParams.get("company"));
  const since = url.searchParams.get("since");
  if (!mission || !Number.isInteger(company) || company <= 0) return fail("Faltan datos.", 400);
  // `since` viene del mismo servidor (datetime de SQLite); cualquier otra cosa se ignora.
  const res = await watchWorks(mission, company, user, since && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(since) ? since : null);
  if (!res.ok) return fail("No encontramos esa actividad.", 404);
  return json(res);
}
