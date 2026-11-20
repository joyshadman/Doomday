# Scope: Doomsday Ready

Doomsday Ready is a small full stack app built with Next.js. It helps MCU fans work out what to rewatch before Avengers Doomsday and book an opening night watch party. The app is the Blinto internship assessment, so the goal is a working, shareable repository with the required API, React views and a clear README.

**Stack:** Next.js with the App Router, route handlers for the API and React pages for the views.
**Build approach:** Tracer Bullet (build each feature through data, API and UI together so every step runs).
**Workflow:** Prototype (just build it and do a quick self check, no separate verify, test suite or review stage).

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit. You decide when a feature is done._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Next.js setup and data shape | Foundation | done |
| 2 | Movie management with safe writes | Slice 1 | done |
| 3 | Rewatch plan | Slice 2 | done |
| 4 | Cinemas and booking | Slice 3 | done |
| 5 | README and sample data | Delivery | done |

## Foundations

### 1. Next.js setup and data shape · assumed decision (spec 0001)

Scaffold a Next.js app with the App Router and route handlers under `app/api`. Keep movies and cinemas in a small store with the fields the brief asks for, so later slices build on real data.

**Done when:** one Next.js command starts the pages and the API, the production build passes, and movies and cinemas can be created and read with unique names and prerequisite links.
- [x] Build it: `/develop Next.js setup and data shape`
Spec 0001 · code in `lib/store.mjs`

## Slice 1: Movie management

### 2. Movie management with safe writes

Create, list and update movies with a unique title, year and runtime from 1 to 300, optional prerequisites that can change later, and a watched flag that starts false. Check for cycles by hand and reject a create or update that makes a movie depend on itself through any chain with `409 CIRCULAR_DEPENDENCY`.

**Done when:** a movie can be added, listed and edited through the API and the Movies page, and making Endgame a prerequisite of Iron Man returns `409 CIRCULAR_DEPENDENCY`.
- [x] Build it: `/develop movie management`

## Slice 2: Rewatch plan

### 3. Rewatch plan

Walk prerequisites by hand from a target movie, return each movie once in an order where prerequisites come first, and count watched movies plus the runtime of unwatched ones. Show the plan in a Next.js page with a target picker, watched ticks, a progress bar like 4 of 7 watched, and the remaining watch time.

**Done when:** Doomsday lists all 7 other movies in a valid order, Civil War lists Iron Man and The First Avenger before The Avengers, Ragnarok is empty, and the page shows progress and remaining minutes.
- [x] Build it: `/develop rewatch plan`

## Slice 3: Watch party booking

### 4. Cinemas and booking

Create cinemas with a unique name and 1 to 10 bundle sizes, each holding 1 to 500 seats. Work out the fewest bundles that add up exactly to a group size from 1 to 10,000 by hand, and show the quote in a Next.js page as counts per size or a clear not possible message.

**Done when:** the brief examples match, namely 1,3,4 for 6 gives two bundles of 3, 2,5 for 11 gives one 5 and three 2, 6,9,20 for 44 gives one 20, two 9 and one 6, and 4,6 for 7 says not possible.
- [x] Build it: `/develop cinemas and booking`

## Delivery

### 5. README and sample data

Seed the sample movies from the brief so the pages are useful on first run. Write a README that says how AI was used, notes any reasonable choices made where the brief was unclear, includes a small data model diagram, and gives the run steps for a reviewer.

**Done when:** the README covers AI use, assumptions, the data model diagram and how to start the app, and the seeded movies match the brief table.
- [x] Build it: `/develop README and sample data`

## Deferred

Out of scope for this pass unless you want the bonus.
- **Docker Compose one command startup**: bonus item, easy to add after the app works.
- **Login, deployment and analytics**: not part of the assessment.

## Legend

**Next step** is always the first unticked box. Status moves from planned to in progress to done. Because this is Prototype, a build plus a quick self check is enough to call a feature done.
