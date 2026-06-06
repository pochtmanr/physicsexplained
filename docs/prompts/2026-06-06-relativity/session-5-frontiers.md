# Session 5 — §13 Frontiers (3 topics)

You are content session **s5-frontiers** of a 6-session parallel sprint
finishing the Relativity branch of physicsexplained.

**First:** read `docs/prompts/2026-06-06-relativity/SHARED.md` in
`/Users/roman/Developer/physics` and follow its workspace setup with
`SESSION-ID = s5-frontiers`. All rules there apply.

## Your topics (eyebrows/titles/subtitles verbatim in `lib/content/branches.ts`)

### 1. `singularity-theorems` — FIG.59
When does GR predict its own breakdown? Penrose 1965: once a trapped surface
forms, geodesic incompleteness is unavoidable — no symmetry tricks, no
"it's just an idealization" escape. Hawking's time-reversed version for the
big bang. Raychaudhuri focusing as the engine, energy conditions as the fuel,
cosmic censorship as the open conjecture. Penrose's 2020 Nobel.
Physics lib: `lib/physics/relativity/raychaudhuri.ts` (congruence expansion
θ(λ) focusing integrator).
Scene ideas: (a) geodesic focusing — a bundle of initially-parallel geodesics
in curved spacetime converging, Raychaudhuri θ readout going to −∞;
(b) trapped surface explorer — light cones on a Schwarzschild diagram, inside
r_s even the *outgoing* wavefront moves inward; (c) theorem-as-flowchart,
interactive: energy condition + trapped surface + global hyperbolicity →
incompleteness (click each hypothesis to see why removing it breaks the proof).

### 2. `the-information-paradox` — FIG.60
Hawking radiation is thermal; quantum mechanics is unitary; both cannot be
exactly true. The 1976 claim, the Susskind–Hawking "war", Page's curve as the
sharp statement, the 1997 Thorne–Hawking–Preskill bet and Hawking's 2004
concession, the 2019–2022 island/replica-wormhole results — presented as
genuine progress on a still-open problem.
Physics lib: `lib/physics/relativity/page-curve.ts` (Hawking vs Page entropy
curves). Scene ideas: (a) the Page curve — entanglement entropy of radiation:
Hawking's ever-rising line vs Page's rise-and-fall, crossover at the Page
time; (b) the bookkeeping picture — energy out vs information out as the hole
evaporates, the tension made visual; (c) positions-on-the-paradox map —
information destroyed / escapes in radiation / remnants / baby universes,
with who held which and what each costs.

### 3. `what-relativity-doesnt-say` — FIG.61
A century of winning, and the wall: quantum gravity. Where GR stops —
singularities, the Planck scale, the measurement problem ignored; what GR
never claimed — "everything is relative" debunked (invariants are the whole
point), FTL bans vs expansion and entanglement; the honest scoreboard of
candidate roads (strings, loops, asymptotic safety) without picking a winner.
This is the branch's closing essay — make it land.
Physics lib: none new needed.
Scene ideas: (a) the domain map — log-log mass-vs-size chart with GR, QM,
quantum-gravity corner, Planck point, where known objects sit; (b) "what's
invariant" myth-buster — interactive list: frame-dependent (time intervals,
lengths, simultaneity) vs absolute (interval, proper time, c, causal order);
(c) the open-questions board — each card states the question, why GR can't
answer it, and what evidence would settle it.

## Reference ownership (you CREATE these; others only reference)

**Physicists** (append to `lib/content/physicists.ts` + seeds):
`roger-penrose` (1931–, British), `leonard-susskind` (1940–, American),
`don-page` (1948–, Canadian-American).
Already exist: `albert-einstein`. Owned by others — reference only:
`stephen-hawking` (s2), `kip-thorne` (s3), `john-archibald-wheeler` (s2).

**Dictionary terms** (append to `lib/content/glossary.ts` + seeds):
`singularity`, `trapped-surface`, `energy-conditions`, `cosmic-censorship`,
`unitarity`, `page-curve`, `planck-scale`, `quantum-gravity`.
Owned by others (reference but do NOT create): `event-horizon`,
`hawking-radiation`, `bekenstein-hawking-entropy` (all s2),
`penrose-diagram` (s2).

Only 3 topics — the smallest session — so spend the surplus on prose quality.
These essays close the branch; FIG.61 is the last thing a completing reader
sees. End it the way the EM branch ends: with a quiet reveal, not a summary.
