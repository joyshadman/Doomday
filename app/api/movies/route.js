import { loadStore, saveStore, nextId } from '../../../lib/store.mjs';
import { validateMovie, wouldCreateCycle } from '../../../lib/logic.mjs';
import { apiError, readJson } from '../../../lib/http.mjs';

export async function GET() {
  return Response.json(loadStore().movies);
}

export async function POST(request) {
  const body = await readJson(request);
  const store = loadStore();
  const id = nextId(store.movies, 'm');
  const checked = validateMovie(body, store.movies, null);
  if (!checked.ok) return apiError(checked);

  if (wouldCreateCycle(store.movies, id, checked.value.prerequisites)) {
    return apiError({ status: 409, code: 'CIRCULAR_DEPENDENCY', message: 'Those prerequisites create a cycle' });
  }

  const movie = { id, ...checked.value };
  store.movies.push(movie);
  saveStore(store);
  return Response.json(movie, { status: 201 });
}
