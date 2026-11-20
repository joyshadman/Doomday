import { loadStore, saveStore, nextId } from '../../../lib/store.mjs';
import { validateCinema } from '../../../lib/logic.mjs';
import { apiError, readJson } from '../../../lib/http.mjs';

export async function GET() {
  return Response.json(loadStore().cinemas);
}

export async function POST(request) {
  const body = await readJson(request);
  const store = loadStore();
  const checked = validateCinema(body, store.cinemas, null);
  if (!checked.ok) return apiError(checked);

  const cinema = { id: nextId(store.cinemas, 'c'), ...checked.value };
  store.cinemas.push(cinema);
  saveStore(store);
  return Response.json(cinema, { status: 201 });
}
