async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message ?? 'Something went wrong');
  return data;
}

export const api = {
  getMovies: () => request('/api/movies'),
  createMovie: (body) => request('/api/movies', { method: 'POST', body: JSON.stringify(body) }),
  patchMovie: (id, body) => request(`/api/movies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getRewatch: (id) => request(`/api/movies/${id}/rewatch-order`),
  getCinemas: () => request('/api/cinemas'),
  createCinema: (body) => request('/api/cinemas', { method: 'POST', body: JSON.stringify(body) }),
  getBooking: (id, groupSize) => request(`/api/cinemas/${id}/booking?groupSize=${groupSize}`),
};
