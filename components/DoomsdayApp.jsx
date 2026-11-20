'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const emptyMovie = { title: '', releaseYear: '', runtimeMinutes: '', prerequisites: [] };

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SectionHead({ icon, title, subtitle, count }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <span className="section-icon">{icon}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </div>
  );
}

function MovieRow({ movie, movies, reload, onError }) {
  const [prerequisites, setPrerequisites] = useState(movie.prerequisites);
  const [editing, setEditing] = useState(false);

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
      setEditing(false);
      await reload();
    } catch (error) {
      onError(error.message);
    }
  }

  const names = movie.prerequisites.map((id) => movies.find((item) => item.id === id)?.title).filter(Boolean);

  return (
    <article className={movie.watched ? 'movie-row watched' : 'movie-row'}>
      <div className="movie-heading">
        <div className="movie-title">
          <span className="movie-dot" />
          <div>
            <strong>{movie.title}</strong>
            <small>{movie.releaseYear} <span className="sep">·</span> {movie.runtimeMinutes} min</small>
          </div>
        </div>
        <span className={movie.watched ? 'badge good' : 'badge'}>{movie.watched ? 'Watched' : 'To watch'}</span>
      </div>
      <div className="prereq-summary">
        <span className="label">Watch first:</span>
        {names.length ? names.map((name) => <span key={name} className="tag">{name}</span>) : <span className="muted">None</span>}
      </div>
      <div className="row-actions">
        <button type="button" className="button small" onClick={toggleWatched}>
          {movie.watched ? 'Mark unwatched' : 'Mark watched'}
        </button>
        <button type="button" className="button small ghost" onClick={() => setEditing((current) => !current)}>
          {editing ? 'Cancel' : 'Edit prerequisites'}
        </button>
      </div>
      {editing && (
        <div className="editor">
          <p className="editor-hint">Tick the films that should come before this one. You can change this any time.</p>
          <div className="chips">
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
          </div>
          <div className="editor-actions">
            <button type="button" className="button small ghost" onClick={() => setPrerequisites([])}>Clear all</button>
            <button type="button" className="button small primary" onClick={savePrerequisites}>Save prerequisites</button>
          </div>
        </div>
      )}
    </article>
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
      <section className="card highlight">
        <SectionHead icon="＋" title="Add a movie" subtitle="Titles are unique. Runtime must be 1 to 300 minutes." />
        <form className="form-grid" onSubmit={addMovie}>
          <label className="field">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Iron Man" required /></label>
          <label className="field">Release year<input type="number" min="1888" max="2100" value={form.releaseYear} onChange={(event) => setForm({ ...form, releaseYear: event.target.value })} placeholder="2008" required /></label>
          <label className="field">Runtime, minutes<input type="number" min="1" max="300" value={form.runtimeMinutes} onChange={(event) => setForm({ ...form, runtimeMinutes: event.target.value })} placeholder="126" required /></label>
          <fieldset>
            <legend>Watch these first, optional</legend>
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
        <SectionHead icon="≡" title="Your movies" subtitle={movies.length ? 'Tick a film as watched or edit its prerequisites.' : 'Add your first film to start planning.'} count={movies.length} />
        {movies.length ? (
          <div className="movie-list">
            {movies.map((movie) => <MovieRow key={movie.id} movie={movie} movies={movies} reload={reload} onError={onError} />)}
          </div>
        ) : <p className="empty">No movies yet.</p>}
      </section>
    </>
  );
}

function RewatchView({ movies, onError }) {
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!movies.length) return;
    if (!targetId || !movies.some((movie) => movie.id === targetId)) setTargetId(movies[movies.length - 1].id);
  }, [movies, targetId]);

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    api.getRewatch(targetId).then(setPlan).catch((error) => onError(error.message)).finally(() => setLoading(false));
  }, [targetId, movies, onError]);

  const percent = plan && plan.totalCount ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 0;

  return (
    <section className="card">
      <SectionHead icon="◎" title="Rewatch plan" subtitle="Choose a target film. We list everything you need first, in order." />
      <label className="field target-field">
        I want to watch
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
        </select>
      </label>
      {loading && <p className="muted">Building your plan…</p>}
      {plan && !loading && (
        <>
          <div className="summary-grid">
            <Stat value={`${plan.watchedCount}/${plan.totalCount}`} label="watched" />
            <Stat value={`${plan.remainingRuntimeMinutes} min`} label="left to watch" />
            <Stat value={`${percent}%`} label="complete" />
          </div>
          <div className="progress-wrap">
            <div className="progress"><div style={{ width: `${percent}%` }} /></div>
            <span>{plan.watchedCount} of {plan.totalCount} watched</span>
          </div>
          {plan.totalCount === 0 ? (
            <div className="empty success-empty">Nothing to watch first. You are ready.</div>
          ) : (
            <ol className="timeline">
              {plan.order.map((movie, index) => (
                <li key={movie.id} className={movie.watched ? 'done' : ''}>
                  <span className="step">{index + 1}</span>
                  <div className="timeline-body">
                    <strong>{movie.title}</strong>
                    <small>{movie.releaseYear} <span className="sep">·</span> {movie.runtimeMinutes} min</small>
                  </div>
                  <span className={movie.watched ? 'badge good' : 'badge'}>{movie.watched ? 'Watched' : 'Unwatched'}</span>
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
      setQuote(null);
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
      <section className="card highlight">
        <SectionHead icon="＋" title="Add a cinema" subtitle="Between 1 and 10 bundle sizes, each from 1 to 500 seats." />
        <form className="form-grid" onSubmit={addCinema}>
          <label className="field">Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Opening Night Grand" required /></label>
          <label className="field">Bundle sizes<input value={sizes} onChange={(event) => setSizes(event.target.value)} placeholder="2, 5" required /></label>
          <button className="button primary">Add cinema</button>
        </form>
      </section>
      <section className="card">
        <SectionHead icon="⌁" title="Booking quote" subtitle="We find the fewest bundles that add up exactly to your group." />
        <form className="form-grid" onSubmit={getQuote}>
          <label className="field">Cinema
            <select value={cinemaId} onChange={(event) => setCinemaId(event.target.value)}>
              {cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}
            </select>
          </label>
          <label className="field">Group size<input type="number" min="1" max="10000" value={groupSize} onChange={(event) => setGroupSize(event.target.value)} required /></label>
          <button className="button primary">Get quote</button>
        </form>
        {quote && (
          <div className={quote.possible ? 'quote' : 'quote impossible'}>
            {quote.possible ? (
              <>
                <span className="quote-number">{quote.totalBundles}</span>
                <div>
                  <strong>bundles for {quote.groupSize} seats</strong>
                  <div className="bundle-chips">
                    {quote.bundles.map((bundle) => <span key={bundle.size} className="bundle">{bundle.size} seats × {bundle.count}</span>)}
                  </div>
                </div>
              </>
            ) : <strong>Not possible with these bundle sizes.</strong>}
          </div>
        )}
      </section>
      {cinemas.length > 0 && (
        <section className="card">
          <SectionHead icon="≡" title="Cinemas" count={cinemas.length} />
          <div className="cinema-list">
            {cinemas.map((cinema) => (
              <div key={cinema.id} className="cinema-row">
                <strong>{cinema.name}</strong>
                <div className="bundle-chips">{cinema.bundleSizes.map((size) => <span key={size} className="tag">{size} seats</span>)}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function DoomsdayApp() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [movieList, cinemaList] = await Promise.all([api.getMovies(), api.getCinemas()]);
    setMovies(movieList);
    setCinemas(cinemaList);
  }, []);

  useEffect(() => {
    reload().catch((failure) => setError(failure.message)).finally(() => setLoading(false));
  }, [reload]);

  const watchedCount = movies.filter((movie) => movie.watched).length;

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">☢</span>
          <div>
            <h1>Doomsday Ready</h1>
            <p>Plan the rewatch. Own opening night.</p>
          </div>
        </div>
        <div className="stats">
          <Stat value={movies.length} label="movies" />
          <Stat value={watchedCount} label="watched" />
          <Stat value={cinemas.length} label="cinemas" />
        </div>
      </header>
      <nav className="tabs">
        <button type="button" className={tab === 'movies' ? 'tab active' : 'tab'} onClick={() => setTab('movies')}><span>🎬</span> Movies</button>
        <button type="button" className={tab === 'plan' ? 'tab active' : 'tab'} onClick={() => setTab('plan')}><span>🧭</span> Rewatch Plan</button>
        <button type="button" className={tab === 'booking' ? 'tab active' : 'tab'} onClick={() => setTab('booking')}><span>🎟️</span> Booking</button>
      </nav>
      {error && (
        <div className="error">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button>
        </div>
      )}
      <div className="layout">
        <div className="content">
          {loading && <div className="card loading">Loading your data…</div>}
          {!loading && tab === 'movies' && <MoviesView movies={movies} reload={reload} onError={setError} />}
          {!loading && tab === 'plan' && <RewatchView movies={movies} onError={setError} />}
          {!loading && tab === 'booking' && <BookingView cinemas={cinemas} reload={reload} onError={setError} />}
        </div>
        <aside className="side">
          <div className="card tip">
            <span className="tip-icon">①</span>
            <h3>Add the films</h3>
            <p>Start with the movies you care about. Mark the ones you have already seen.</p>
          </div>
          <div className="card tip">
            <span className="tip-icon">②</span>
            <h3>Pick a target</h3>
            <p>Rewatch Plan lists every prerequisite in a valid order, with your progress.</p>
          </div>
          <div className="card tip">
            <span className="tip-icon">③</span>
            <h3>Book together</h3>
            <p>Enter your group size and get the exact bundles to buy, with no empty seats.</p>
          </div>
        </aside>
      </div>
      <footer>Built for the Blinto Full Stack Developer Internship assessment.</footer>
    </main>
  );
}
