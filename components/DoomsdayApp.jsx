'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const emptyMovie = { title: '', releaseYear: '', runtimeMinutes: '', prerequisites: [] };

function MovieRow({ movie, movies, reload, onError }) {
  const [prerequisites, setPrerequisites] = useState(movie.prerequisites);

  useEffect(() => setPrerequisites(movie.prerequisites), [movie.prerequisites]);

  async function toggleWatched() {
    try {
      await api.patchMovie(movie.id, { watched: !movie.watched });
      await reload();
    } catch (error) {
      onError(error.message);
    }
  }

  async function savePrerequisites() {
    try {
      await api.patchMovie(movie.id, { prerequisites });
      await reload();
    } catch (error) {
      onError(error.message);
    }
  }

  return (
    <div className="movie-row">
      <div className="movie-heading">
        <div>
          <strong>{movie.title}</strong>
          <small>{movie.releaseYear} · {movie.runtimeMinutes} min</small>
        </div>
        <button type="button" className={movie.watched ? 'button success' : 'button'} onClick={toggleWatched}>
          {movie.watched ? 'Watched' : 'Mark watched'}
        </button>
      </div>
      <div className="prerequisites">
        <span className="label">Watch first:</span>
        {movies.filter((item) => item.id !== movie.id).map((item) => (
          <label key={item.id} className="chip">
            <input
              type="checkbox"
              checked={prerequisites.includes(item.id)}
              onChange={(event) => setPrerequisites((current) => (
                event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
              ))}
            />
            {item.title}
          </label>
        ))}
        <button type="button" className="button small" onClick={() => setPrerequisites([])}>Clear all</button>
        <button type="button" className="button small" onClick={savePrerequisites}>Save prerequisites</button>
      </div>
    </div>
  );
}

function MoviesView({ movies, reload, onError }) {
  const [form, setForm] = useState(emptyMovie);
  const [busy, setBusy] = useState(false);

  async function addMovie(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createMovie({
        ...form,
        releaseYear: Number(form.releaseYear),
        runtimeMinutes: Number(form.runtimeMinutes),
      });
      setForm(emptyMovie);
      await reload();
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Add a movie</h2>
        <form className="form-grid" onSubmit={addMovie}>
          <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
          <label>Release year<input type="number" min="1888" max="2100" value={form.releaseYear} onChange={(event) => setForm({ ...form, releaseYear: event.target.value })} required /></label>
          <label>Runtime in minutes<input type="number" min="1" max="300" value={form.runtimeMinutes} onChange={(event) => setForm({ ...form, runtimeMinutes: event.target.value })} required /></label>
          <fieldset>
            <legend>Watch these first</legend>
            <div className="chips">
              {movies.map((movie) => (
                <label key={movie.id} className="chip">
                  <input
                    type="checkbox"
                    checked={form.prerequisites.includes(movie.id)}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      prerequisites: event.target.checked
                        ? [...current.prerequisites, movie.id]
                        : current.prerequisites.filter((id) => id !== movie.id),
                    }))}
                  />
                  {movie.title}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="button primary" disabled={busy}>{busy ? 'Adding' : 'Add movie'}</button>
        </form>
      </section>
      <section className="card">
        <h2>All movies</h2>
        <div className="list">
          {movies.map((movie) => (
            <MovieRow key={movie.id} movie={movie} movies={movies} reload={reload} onError={onError} />
          ))}
        </div>
      </section>
    </>
  );
}

function RewatchView({ movies, onError }) {
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!movies.length) return;
    if (!targetId || !movies.some((movie) => movie.id === targetId)) {
      setTargetId(movies[movies.length - 1].id);
    }
  }, [movies, targetId]);

  useEffect(() => {
    if (!targetId) return;
    api.getRewatch(targetId).then(setPlan).catch((error) => onError(error.message));
  }, [targetId, movies, onError]);

  const percent = plan && plan.totalCount ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 0;

  return (
    <section className="card">
      <h2>Rewatch plan</h2>
      <label>
        I want to watch
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
        </select>
      </label>
      {plan && (
        <>
          <div className="summary">
            <strong>{plan.watchedCount} of {plan.totalCount} watched</strong>
            <span>Remaining watch time: {plan.remainingRuntimeMinutes} min</span>
          </div>
          <div className="progress"><div style={{ width: `${percent}%` }} /></div>
          {plan.totalCount === 0 ? (
            <p className="muted">Nothing to watch first. You are ready.</p>
          ) : (
            <ol className="plan-list">
              {plan.order.map((movie, index) => (
                <li key={movie.id}>
                  <span>{index + 1}. {movie.title}</span>
                  <span className={movie.watched ? 'tag success' : 'tag'}>{movie.watched ? 'Watched' : `${movie.runtimeMinutes} min`}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function BookingView({ cinemas, reload, onError }) {
  const [name, setName] = useState('');
  const [sizes, setSizes] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('6');
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (cinemas.length && !cinemas.some((cinema) => cinema.id === cinemaId)) setCinemaId(cinemas[0].id);
  }, [cinemas, cinemaId]);

  async function addCinema(event) {
    event.preventDefault();
    try {
      await api.createCinema({ name, bundleSizes: sizes.split(',').map((value) => Number(value.trim())) });
      setName('');
      setSizes('');
      await reload();
    } catch (error) {
      onError(error.message);
    }
  }

  async function getQuote(event) {
    event.preventDefault();
    try {
      setQuote(await api.getBooking(cinemaId, Number(groupSize)));
    } catch (error) {
      onError(error.message);
    }
  }

  return (
    <>
      <section className="card">
        <h2>Add a cinema</h2>
        <form className="form-grid" onSubmit={addCinema}>
          <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Bundle sizes, comma separated<input value={sizes} onChange={(event) => setSizes(event.target.value)} placeholder="2, 5" required /></label>
          <button className="button primary">Add cinema</button>
        </form>
      </section>
      <section className="card">
        <h2>Booking quote</h2>
        <form className="form-grid" onSubmit={getQuote}>
          <label>Cinema
            <select value={cinemaId} onChange={(event) => setCinemaId(event.target.value)}>
              {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
            </select>
          </label>
          <label>Group size<input type="number" min="1" max="10000" value={groupSize} onChange={(event) => setGroupSize(event.target.value)} required /></label>
          <button className="button primary">Get quote</button>
        </form>
        {quote && (
          <div className="quote">
            {quote.possible ? (
              <>
                <strong>{quote.totalBundles} bundles</strong>
                <p>{quote.bundles.map((bundle) => `${bundle.size} × ${bundle.count}`).join(', ')}</p>
              </>
            ) : (
              <strong>Not possible with these bundle sizes.</strong>
            )}
          </div>
        )}
      </section>
    </>
  );
}

export default function DoomsdayApp() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [movieList, cinemaList] = await Promise.all([api.getMovies(), api.getCinemas()]);
    setMovies(movieList);
    setCinemas(cinemaList);
  }, []);

  useEffect(() => {
    reload().catch((failure) => setError(failure.message));
  }, [reload]);

  return (
    <main className="page">
      <header className="hero">
        <h1>Doomsday Ready</h1>
        <p>Catch up on the MCU, then book your opening night seats.</p>
        <nav className="tabs">
          <button type="button" className={tab === 'movies' ? 'tab active' : 'tab'} onClick={() => setTab('movies')}>Movies</button>
          <button type="button" className={tab === 'plan' ? 'tab active' : 'tab'} onClick={() => setTab('plan')}>Rewatch Plan</button>
          <button type="button" className={tab === 'booking' ? 'tab active' : 'tab'} onClick={() => setTab('booking')}>Booking</button>
        </nav>
      </header>
      {error && <div className="error" onClick={() => setError('')}>{error} (click to dismiss)</div>}
      {tab === 'movies' && <MoviesView movies={movies} reload={reload} onError={setError} />}
      {tab === 'plan' && <RewatchView movies={movies} onError={setError} />}
      {tab === 'booking' && <BookingView cinemas={cinemas} reload={reload} onError={setError} />}
    </main>
  );
}
