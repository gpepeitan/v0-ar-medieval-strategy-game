# MedievalAR Project Memory

## Required reading

Before editing anything in this repo, read:
- `MEDIEVALAR_MASTER_MASTER.md`
- `GAMEPLAY_BALANCE_MASTER.md`
- the relevant supporting doc for the area you are touching
- `GITHUB_COLLABORATION_BRIEF.md`

## What this project is

MedievalAR is a persistent medieval AR strategy game built in Unity 6000+.
It uses real-world public-access geography for claims, routes, territory, trade, combat, sieges, and long-term power.

## Source of truth hierarchy

1. `MEDIEVALAR_MASTER_MASTER.md` — operational brain and collaboration guide
2. `GAMEPLAY_BALANCE_MASTER.md` — canonical gameplay, economy, combat, faction, and fairness reference
3. Supporting balance docs — numeric sheet, unit roster, combat/siege, economy, exploit/fairness, playtest matrix
4. Code — only after the docs are clear and intentional

## Collaboration rule

This repo is shared work between Codex, Zo, Echo, Claude, and the human owner through Git.
Keep docs organized, explicit, and consistent so other agents can continue safely.

## Fixed design rules

- Persistent world, never reset
- No final win screen
- Public-access land only
- No global settlement tier; structures upgrade individually
- No automatic spoilage
- Geography, supply, morale, terrain, and command quality matter
- Mixed armies should usually outperform spam
- Factions bias playstyle, but do not lock it in
- New players must have viable footholds in dense cities
- Castles are defensive anchors, not production engines
- Design against exploits and degenerate repetition

## Practical guidance for future agents

- Read the docs before changing gameplay.
- Update docs before code when a rule changes.
- Preserve numeric balance unless the change is deliberate.
- Prefer additive, traceable edits.
- Leave breadcrumbs when making important decisions.
- Keep the repository easy for the next AI to understand and continue.
- End every substantive update with a handoff: what was done, what remains, and the most important next step.