import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'doomsday-verify-'));
process.chdir(temp);

const { loadStore } = await import('../lib/store.mjs');
const { NextRequest } = await import('next/server.js');
const moviesRoute = await import('../app/api/movies/route.js');
const movieRoute = await import('../app/api/movies/[id]/route.js');
const rewatchRoute = await import('../app/api/movies/[id]/rewatch-order/route.js');
const cinemasRoute = await import('../app/api/cinemas/route.js');
const bookingRoute = await import('../app/api/cinemas/[id]/booking/route.js');

let passed = 0;
function check(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

const post = (body) => new Request('http://test/api/resource', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const patch = (body) => new Request('http://test/api/resource', {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
const params = (id) => ({ params: Promise.resolve({ id }) });
const bodyOf = async (response) => response.json();

console.log('Feature 1: movies and rewatch order');

const initial = loadStore();
check('seed has the 8 movies from the brief', initial.movies.length === 8);
check('seed movies start unwatched', initial.movies.every((movie) => movie.watched === false));
check('seed Doomsday depends on Endgame', initial.movies.find((movie) => movie.id === 'm8').prerequisites.join() === 'm7');

const listed = await bodyOf(await moviesRoute.GET());
check('GET /api/movies returns 8 movies', listed.length === 8);

const created = await moviesRoute.POST(post({
  title: 'Guardians of the Galaxy',
  releaseYear: 2014,
  runtimeMinutes: 122,
  prerequisites: ['m5'],
}));
const newMovie = await bodyOf(created);
check('POST /api/movies creates a movie with 201', created.status === 201);
check('new movie defaults watched to false', newMovie.watched === false);
check('new movie keeps its prerequisite', newMovie.prerequisites.join() === 'm5');

check('duplicate title is rejected', (await bodyOf(await moviesRoute.POST(post({ title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126 })))).error.code === 'DUPLICATE_TITLE');
check('runtime 0 is rejected', (await moviesRoute.POST(post({ title: 'Too Short', releaseYear: 2000, runtimeMinutes: 0 }))).status === 400);
check('runtime 301 is rejected', (await moviesRoute.POST(post({ title: 'Too Long', releaseYear: 2000, runtimeMinutes: 301 }))).status === 400);

const watched = await bodyOf(await movieRoute.PATCH(patch({ watched: true }), params(newMovie.id)));
check('PATCH can mark a movie watched', watched.watched === true);
const cleared = await bodyOf(await movieRoute.PATCH(patch({ prerequisites: [] }), params(newMovie.id)));
check('PATCH can clear optional prerequisites', cleared.prerequisites.length === 0);

const selfCycle = await movieRoute.PATCH(patch({ prerequisites: [newMovie.id] }), params(newMovie.id));
check('self dependency returns 409 CIRCULAR_DEPENDENCY', selfCycle.status === 409 && (await bodyOf(selfCycle)).error.code === 'CIRCULAR_DEPENDENCY');
const indirectCycle = await movieRoute.PATCH(patch({ prerequisites: ['m7'] }), params('m1'));
check('indirect cycle returns 409 CIRCULAR_DEPENDENCY', indirectCycle.status === 409 && (await bodyOf(indirectCycle)).error.code === 'CIRCULAR_DEPENDENCY');

const planFor = async (id) => bodyOf(await rewatchRoute.GET(new Request('http://test/api/rewatch'), params(id)));
const doomsday = await planFor('m8');
check('Doomsday plan has all 7 other movies', doomsday.order.length === 7 && !doomsday.order.some((movie) => movie.id === 'm8'));
const positions = new Map(doomsday.order.map((movie, index) => [movie.id, index]));
check('Doomsday plan puts prerequisites before movies', initial.movies.filter((movie) => movie.id !== 'm8').every((movie) => movie.prerequisites.every((id) => positions.get(id) < positions.get(movie.id))));
check('Doomsday plan counts watched movies and remaining time', doomsday.watchedCount === 0 && doomsday.remainingRuntimeMinutes === 990);

const civilWar = await planFor('m4');
check('Civil War plan is Iron Man, First Avenger, then The Avengers', civilWar.order.map((movie) => movie.title).join(' | ') === 'Iron Man | Captain America: The First Avenger | The Avengers');
const ragnarok = await planFor('m5');
check('Ragnarok plan is empty', ragnarok.order.length === 0 && ragnarok.remainingRuntimeMinutes === 0);

await movieRoute.PATCH(patch({ watched: true }), params('m1'));
const afterWatch = await planFor('m8');
check('watched count and remaining time update after PATCH', afterWatch.watchedCount === 1 && afterWatch.remainingRuntimeMinutes === 864);
await movieRoute.PATCH(patch({ watched: false }), params('m1'));

console.log('Feature 2: cinemas and booking quotes');

const cinema = await moviesCinemaPost({ name: 'Test Cinema', bundleSizes: [2, 5] });
async function moviesCinemaPost(data) {
  return bodyOf(await cinemasRoute.POST(post(data)));
}
check('POST /api/cinemas creates a cinema', cinema.name === 'Test Cinema' && cinema.bundleSizes.join() === '2,5');
check('cinema names are unique', (await moviesCinemaPost({ name: 'test cinema', bundleSizes: [2] })).error.code === 'DUPLICATE_NAME');
check('11 bundle sizes are rejected', (await cinemasRoute.POST(post({ name: 'Too Many', bundleSizes: Array.from({ length: 11 }, (_, index) => index + 1) }))).status === 400);
check('bundle size 0 is rejected', (await cinemasRoute.POST(post({ name: 'Bad Small', bundleSizes: [0] }))).status === 400);
check('bundle size 501 is rejected', (await cinemasRoute.POST(post({ name: 'Bad Big', bundleSizes: [501] }))).status === 400);

const quote = async (cinemaId, groupSize) => bodyOf(await bookingRoute.GET(
  new NextRequest(`http://test/api/cinemas/${cinemaId}/booking?groupSize=${groupSize}`),
  params(cinemaId),
));

const example1 = await quote((await moviesCinemaPost({ name: 'Sizes 1 3 4', bundleSizes: [1, 3, 4] })).id, 6);
check('1,3,4 for 6 gives two bundles of 3', example1.totalBundles === 2 && example1.bundles[0].size === 3 && example1.bundles[0].count === 2);
const example2 = await quote(cinema.id, 11);
check('2,5 for 11 gives one 5 and three 2', example2.totalBundles === 4 && example2.bundles.map((bundle) => `${bundle.size}x${bundle.count}`).join() === '5x1,2x3');
const example3 = await quote((await moviesCinemaPost({ name: 'Sizes 6 9 20', bundleSizes: [6, 9, 20] })).id, 44);
check('6,9,20 for 44 gives 20x1, 9x2, 6x1', example3.totalBundles === 4 && example3.bundles.map((bundle) => `${bundle.size}x${bundle.count}`).join() === '20x1,9x2,6x1');
const example4 = await quote((await moviesCinemaPost({ name: 'Sizes 4 6', bundleSizes: [4, 6] })).id, 7);
check('4,6 for 7 is not possible', example4.possible === false);

const badSmall = await bookingRoute.GET(new NextRequest('http://test/api/cinemas/c1/booking?groupSize=0'), params('c1'));
const badBig = await bookingRoute.GET(new NextRequest('http://test/api/cinemas/c1/booking?groupSize=10001'), params('c1'));
check('group size outside 1 to 10000 is rejected', badSmall.status === 400 && badBig.status === 400);

console.log('Feature 3 and delivery: frontend, rules and extras');

const html = fs.readFileSync(path.join(repoRoot, '.next', 'server', 'app', 'index.html'), 'utf8');
check('production frontend build exists with the app title', html.includes('Doomsday Ready'));
const appSource = fs.readFileSync(path.join(repoRoot, 'components', 'DoomsdayApp.jsx'), 'utf8');
check('frontend has Movies, Rewatch Plan and Booking views', ['Movies', 'Rewatch Plan', 'Booking'].every((name) => appSource.includes(name)));
check('frontend shows progress and remaining time', appSource.includes('of {plan.totalCount} watched') && appSource.includes('left to watch'));

const logic = fs.readFileSync(path.join(repoRoot, 'lib', 'logic.mjs'), 'utf8');
check('the two algorithms use no helper library', !logic.includes('import '));
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
check('README explains AI use', readme.includes('How AI was used'));
check('README records assumptions', readme.includes('Choices where the brief was unclear'));
check('README has a data model diagram', readme.includes('```mermaid'));
check('README documents the API', readme.includes('POST /api/movies') && readme.includes('booking?groupSize=6'));
check('Docker Compose bonus is present', fs.existsSync(path.join(repoRoot, 'docker-compose.yml')) && fs.existsSync(path.join(repoRoot, 'Dockerfile')));

console.log(`\nAll ${passed} checks passed.`);
fs.rmSync(temp, { recursive: true, force: true });
