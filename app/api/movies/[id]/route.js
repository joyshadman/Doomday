import { loadStore, saveStore } from '../../../../lib/store.mjs';
import { validateMovie, wouldCreateCycle } from '../../../../lib/logic.mjs';
import { apiError, readJson } from '../../../../lib/http.mjs';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const store = loadStore();
  const movie = store.movies.find((item) => item.id === id);
  if (!movie) return apiError({ status: 404, code: 'NOT_FOUND', message: 'Movie not found' });

  const body = await readJson(request);
  const candidate = {
    title: body.title ?? movie.title,
    releaseYear: body.releaseYear ?? movie.releaseYear,
    runtimeMinutes: body.runtimeMinutes ?? movie.runtimeMinutes,
    prerequisites: body.prerequisites ?? movie.prerequisites,
    watched: body.watched === undefined ? movie.watched : body.watched,
  };
  const checked = validateMovie(candidate, store.movies, id);
  if (!checked.ok) return apiError(checked);

  if (wouldCreateCycle(store.movies, id, checked.value.prerequisites)) {
    return apiError({ status: 409, code: 'CIRCULAR_DEPENDENCY', message: 'Those prerequisites create a cycle' });
  }

  Object.assign(movie, checked.value);
  saveStore(store);
  return Response.json(movie);
}
