const fail = (status, code, message) => ({ ok: false, status, code, message });
const pass = (value) => ({ ok: true, value });

const isInteger = (value) => Number.isInteger(value);

export function validateMovie(input, movies, id) {
  if (!input || typeof input !== 'object') return fail(400, 'VALIDATION_ERROR', 'Movie body is required');

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) return fail(400, 'VALIDATION_ERROR', 'Title is required');
  if (movies.some((movie) => movie.id !== id && movie.title.toLowerCase() === title.toLowerCase())) {
    return fail(409, 'DUPLICATE_TITLE', 'A movie with this title already exists');
  }

  const releaseYear = Number(input.releaseYear);
  if (!isInteger(releaseYear) || releaseYear < 1888 || releaseYear > 2100) {
    return fail(400, 'VALIDATION_ERROR', 'Release year must be a whole year between 1888 and 2100');
  }

  const runtimeMinutes = Number(input.runtimeMinutes);
  if (!isInteger(runtimeMinutes) || runtimeMinutes < 1 || runtimeMinutes > 300) {
    return fail(400, 'VALIDATION_ERROR', 'Runtime must be between 1 and 300 minutes');
  }

  const rawPrerequisites = input.prerequisites ?? [];
  if (!Array.isArray(rawPrerequisites)) return fail(400, 'VALIDATION_ERROR', 'Prerequisites must be a list');
  const prerequisites = [...new Set(rawPrerequisites.map(String))];
  if (id && prerequisites.includes(id)) return fail(409, 'CIRCULAR_DEPENDENCY', 'A movie cannot depend on itself');
  for (const prerequisite of prerequisites) {
    if (!movies.some((movie) => movie.id === prerequisite)) {
      return fail(400, 'VALIDATION_ERROR', `Prerequisite ${prerequisite} does not exist`);
    }
  }

  const watched = input.watched === undefined ? false : Boolean(input.watched);
  return pass({ title, releaseYear, runtimeMinutes, prerequisites, watched });
}

export function wouldCreateCycle(movies, id, prerequisites) {
  const byId = new Map(movies.map((movie) => [movie.id, movie.prerequisites]));
  byId.set(id, prerequisites);
  const stack = [id];
  const seen = new Set();

  while (stack.length) {
    const current = stack.pop();
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of byId.get(current) ?? []) {
      if (next === id) return true;
      stack.push(next);
    }
  }
  return false;
}

export function rewatchOrder(movies, id) {
  const target = movies.find((movie) => movie.id === id);
  if (!target) return fail(404, 'NOT_FOUND', 'Movie not found');

  const byId = new Map(movies.map((movie) => [movie.id, movie]));
  const order = [];
  const seen = new Set();

  function visit(movieId) {
    if (seen.has(movieId) || movieId === id) return;
    seen.add(movieId);
    const movie = byId.get(movieId);
    if (!movie) return;
    for (const prerequisite of movie.prerequisites) visit(prerequisite);
    order.push(movie);
  }

  for (const prerequisite of target.prerequisites) visit(prerequisite);

  const watchedCount = order.filter((movie) => movie.watched).length;
  const remainingRuntimeMinutes = order.filter((movie) => !movie.watched).reduce((sum, movie) => sum + movie.runtimeMinutes, 0);

  return pass({
    targetId: id,
    order,
    watchedCount,
    totalCount: order.length,
    remainingRuntimeMinutes,
  });
}

export function validateCinema(input, cinemas, id) {
  if (!input || typeof input !== 'object') return fail(400, 'VALIDATION_ERROR', 'Cinema body is required');

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) return fail(400, 'VALIDATION_ERROR', 'Name is required');
  if (cinemas.some((cinema) => cinema.id !== id && cinema.name.toLowerCase() === name.toLowerCase())) {
    return fail(409, 'DUPLICATE_NAME', 'A cinema with this name already exists');
  }

  const sizes = input.bundleSizes;
  if (!Array.isArray(sizes) || sizes.length < 1 || sizes.length > 10) {
    return fail(400, 'VALIDATION_ERROR', 'Provide between 1 and 10 bundle sizes');
  }
  const bundleSizes = [...new Set(sizes.map(Number))];
  if (bundleSizes.length !== sizes.length) return fail(400, 'VALIDATION_ERROR', 'Bundle sizes must be unique');
  for (const size of bundleSizes) {
    if (!isInteger(size) || size < 1 || size > 500) {
      return fail(400, 'VALIDATION_ERROR', 'Each bundle size must be between 1 and 500 seats');
    }
  }

  return pass({ name, bundleSizes });
}

export function bookingQuote(cinema, groupSize) {
  if (!isInteger(groupSize) || groupSize < 1 || groupSize > 10000) {
    return fail(400, 'VALIDATION_ERROR', 'Group size must be a whole number between 1 and 10000');
  }

  const sizes = [...cinema.bundleSizes].sort((a, b) => a - b);
  const best = new Array(groupSize + 1).fill(Infinity);
  const previous = new Array(groupSize + 1).fill(null);
  best[0] = 0;

  for (let seats = 1; seats <= groupSize; seats += 1) {
    for (const size of sizes) {
      if (seats >= size && best[seats - size] + 1 < best[seats]) {
        best[seats] = best[seats - size] + 1;
        previous[seats] = { seats: seats - size, size };
      }
    }
  }

  if (best[groupSize] === Infinity) return pass({ possible: false, groupSize });

  const counts = new Map();
  let seats = groupSize;
  while (seats > 0) {
    const step = previous[seats];
    counts.set(step.size, (counts.get(step.size) ?? 0) + 1);
    seats = step.seats;
  }

  const bundles = [...counts.entries()]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return pass({ possible: true, groupSize, totalBundles: best[groupSize], bundles });
}
