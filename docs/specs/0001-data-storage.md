# 0001 · Data storage for Vercel and localhost

**Status**: Assumed
**Date**: 2026-11-20
**Authorized by**: you, during /develop

## Owed decision

Where movies and cinemas should live so the API works both on the deployed Vercel app and on localhost. Vercel cannot write into the app folder, so the current JSON file store returns 500 there.

## Assumption built on

Use an environment aware JSON file path. On Vercel, write to `/tmp/doomsday-ready/store.json`. On localhost, write to `./data/store.json`. A `DATA_DIR` environment variable may override the path. Data on Vercel is ephemeral and not shared between function instances. Local data persists across restarts.

## Code area

`lib/store.mjs`, `README.md`, `docs/scope/scope.md`

## Requirements

* The movie and cinema endpoints work on the deployed URL.
* The same endpoints work on localhost.
* Existing validation, rewatch logic and booking logic stay unchanged.

## Ratify

This decision was recorded by /develop, not deliberated. Run `/architect data storage for Vercel and localhost` to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature done.
