# MedievalAR Collaboration Brief

## Purpose

This repo is shared work for multiple AIs and the human owner.
Codex can work directly in Unity and GitHub, and Zo, Echo, and Claude should all be able to continue from the same source of truth.

## Project basics

- Game: persistent medieval AR strategy
- Engine: Unity 6000.0.0f1+
- World: real-world public-access geography
- Core systems: claims, routes, economy, production, combat, sieges, factions, commanders, morale
- Balance philosophy: many viable strategies, no universal best path

## Source-of-truth docs

- `MEDIEVALAR_MASTER_MASTER.md` — the operational brain and collaboration guide
- `GAMEPLAY_BALANCE_MASTER.md` — the main gameplay and balance authority
- Supporting docs — deeper detail for economy, units, combat, fairness, and playtesting

## What makes this game different

- Public land only
- Persistent world
- No global settlement tier
- Individual structures upgrade separately
- No automatic spoilage
- Supply and logistics matter more than raw numbers
- Economy and military are tightly linked

## How AIs should work together

- Read the relevant docs before editing.
- If a gameplay rule changes, update docs before code.
- Use supporting docs for detail; use the master docs for intent.
- Keep changes explicit and organized.
- Leave breadcrumbs when a rule changes.
- Do not overwrite core balance lightly.
- Favor additive changes and clear rationale.
- When finishing a task, leave a handoff that says: what was done, what remains, and the most important next step.
- Make the next AI smarter by being specific about state, gaps, and intent.

## GitHub identity needed for collaboration

To add an AI to GitHub work, the human owner must provide one of:
- a GitHub username, or
- a GitHub App name

Also needed:
- repo invite or org access
- any branch / PR permission rules
- any installation or collaborator preference

If the identity is unknown, do not guess.
Ask the human owner to choose the account or App name.

## Git workflow expectations

- Git is the shared memory.
- Unity project files and balance docs should stay in sync.
- Keep docs readable enough that another AI can continue without guessing.
- Small, traceable updates are better than giant unstructured rewrites.
- End each substantive update with a concise handoff.

## Practical rule

If another AI should be able to pick this repo up cleanly, the docs need to answer:
- what the game is
- what the fixed rules are
- what can still be tuned
- what should be built next
- what must not be broken