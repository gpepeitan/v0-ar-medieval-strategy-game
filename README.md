# MedievalAR

Starter Unity project scaffold for a persistent medieval AR strategy game.

Unity 6000.0.0f1 or newer is expected.

## Required reading for every AI

Before editing anything in this repo, read:

1. `MEDIEVALAR_MASTER_MASTER.md`
2. `GAMEPLAY_BALANCE_MASTER.md`
3. The relevant supporting doc for the system you are touching
4. `GITHUB_COLLABORATION_BRIEF.md`
5. `AGENTS.md`

Then summarize for the next collaborator:
- what the game is
- what the fixed rules are
- what is already done
- what still needs to be built
- the most important next step

When you finish work, always end with a concise handoff:
- what was done
- what remains
- the most important next step for the next AI

## Git workflow

This project is intended to be version-controlled with Git so Unity and Zo can work from the same source of truth.

Typical workflow:

1. Edit files here in Zo.
2. Pull or copy the updated files into the Unity project folder.
3. Open Unity and let it reimport.

## First systems implemented

- session bootstrap
- persistent game state
- local player identity
- faction assignment
- world-day advancement
- territory decay foundation
- starting resource pools
- starter route network
- starter commander
- starter territory
- save/load foundation