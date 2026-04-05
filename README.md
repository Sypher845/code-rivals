# Code Rivals

[Live App](https://code-rivals-six.vercel.app/)

## Demo Video

<video src="./public/coderivals-demo.mp4" controls width="100%"></video>

[Open the demo video directly](./public/coderivals-demo.mp4)

Code Rivals is a real-time competitive coding game where two players enter an arena, lock in power cards, get the same problem for the round, and try to out-code each other before the timer runs out.

Think:
- LeetCode, but slightly more dramatic
- PvP coding, but with sabotage
- A scoreboard that absolutely remembers what happened

It also has a `Zen Mode` for solo practice when you want the same coding vibe without somebody throwing chaos at your keyboard.

## What’s In Here

- `React + TypeScript + Vite` frontend
- `SpacetimeDB` backend for realtime state, auth, rooms, match flow, and social features
- Arena flow with:
  - room creation/joining
  - power-card drafting
  - shared round problems
  - sabotage events
  - round scoring
  - results / rating progression
- Social systems:
  - signup / login
  - friends
  - game invites
  - notifications
  - presence
- Zen Mode:
  - sober black/gray coding UI
  - solo round flow
  - optional self-sabotage

## Match Flow

The main battle loop looks like this:

1. Create or join an arena room.
2. Wait for two players.
3. Start the match.
4. Each player drafts from 3 rolled power cards.
5. Both players lock their choice.
6. Countdown begins.
7. Both players get the same problem for that round.
8. Sabotage, typing pressure, and timers do their thing.
9. Round results are submitted and scored.
10. After 3 rounds, results and rating changes show up.

In other words: very healthy, calm, normal software behavior.

## Repo Layout

```text
.
├── src/                  # React frontend
│   ├── pages/            # Landing, arena, coding window, power selection, results
│   ├── module_bindings/  # Generated SpacetimeDB TypeScript bindings
│   ├── components/       # Shared UI bits
│   └── utils/            # Power effects, formatting, editor sabotage logic
├── spacetimedb/          # SpacetimeDB module
│   └── src/
│       ├── auth/         # auth tables + reducers
│       ├── social/       # friends, invites, notifications, presence
│       ├── arena/        # rooms, rounds, power locks, sabotage, scoring
│       └── schema.ts     # exported database schema
├── spacetime.json        # default publish config
└── spacetime.local.json  # local target config
```

## Core Screens

- Landing page: marketing, feature callouts, Zen promo
- Arena page: dashboard, profile card, quick room controls, friends, leaderboard
- Power selection: choose your round sabotage card
- Power lock / countdown: both players wait for round start
- Coding window: shared problem, editor, testcases, sabotage effects, timer
- Results: round-by-round breakdown and rating movement
- Zen Mode: solo practice with a stripped-down feel

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Monaco editor
- SpacetimeDB
- AWS EC2
- Docker

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start the frontend

```bash
npm run dev
```

This script also tries to bring up Docker services first, then starts Vite.

### 3. Make sure SpacetimeDB is running

```bash
spacetime start
```

### 4. Publish the backend module locally

This repo is currently configured to use the local database:

```text
code-rivals-hrs2l
```

Publish to local:

```bash
spacetime publish --server local code-rivals-hrs2l --module-path spacetimedb
```

If you want to wipe local data and republish:

```bash
spacetime publish --server local --delete-data code-rivals-hrs2l --module-path spacetimedb
```

### 5. Regenerate client bindings when schema/reducers change

```bash
npm run spacetime:generate
```

## Useful Commands

```bash
# Frontend dev
npm run dev

# Production build
npm run build

# Format
npm run format

# Check formatting
npm run lint

# Generate SpacetimeDB TypeScript bindings
npm run spacetime:generate

# Publish module to local server
npm run spacetime:publish:local

# Publish module to maincloud
npm run spacetime:publish
```

## Environment Notes

Frontend defaults currently expect:

- `VITE_SPACETIMEDB_HOST=ws://localhost:3000`
- `VITE_SPACETIMEDB_DB_NAME=code-rivals-hrs2l`

Problem APIs are also used by the coding window. If not set explicitly, the app falls back to local endpoints like:

- `http://localhost:8080/easy`
- `http://localhost:8080/medium`

## SpacetimeDB Notes

This repo uses generated bindings from `src/module_bindings`.

That means:

- do not hand-edit generated binding files
- change backend tables/reducers in `spacetimedb/src/...`
- then regenerate bindings

Backend areas to know:

- `spacetimedb/src/auth`
  Handles sign up, login, logout, connection lifecycle, and player profile/session state.
- `spacetimedb/src/social`
  Handles friends, invites, presence, rivalry data, and notifications.
- `spacetimedb/src/arena`
  Handles rooms, member lists, power locks, round problems, sabotage events, results, summary rows, scheduled jobs, and match progression.

## A Few Fun Features

- Shared per-round coding problems so both players fight on equal footing
- Sabotages that affect the coding experience, not just a score number
- Mirror-style counterplay and passive debuffs
- Room cleanup notices when forgotten waiting rooms get deleted
- Zen Mode for solo practice when you want less rivalry and more focus
- Animated transitions because if you’re going to duel, you may as well arrive dramatically


## Final Pitch

This is not a polite little CRUD app.

This is a realtime coding arena with rooms, sabotage, countdowns, shared problems, social features, and a backup chill mode for when the PvP goblin needs a nap.
