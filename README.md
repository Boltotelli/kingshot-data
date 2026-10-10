# Kingshot Hero Reference — public dataset (research preview)

This is the standalone public reference repository **Boltotelli/kingshot-data**. It does **not** use Supabase, Vercel, NAP, or player-account storage.

## Files

- **catalog.v1.json:** 37 hero names and troop types from the existing Bear Optimizer catalog; NOT proof of ownership or complete stats.
- **heroes.v1.json:** source-aware records, explicit null for unknown progression.
- **schema.v1.json:** public, versioned JSON Schema.
- **test-hero-reference.cjs:** portable validation (run with Node.js).

## Source coverage (2026-10-10)

| Hero | Type | Generation | Star progression (31 source rows) | Expedition skills (3 × 5 levels) | Base per hero level 1–80 |
| --- | --- | --- | --- | --- | --- |
| Yang | Archer | 6 | Sourced | Sourced | Unknown |
| Rosa | Archer | 4 | Sourced | Sourced | Unknown |
| Petra | Cavalry | 3 | Sourced | Sourced | Unknown |
| Zoe | Infantry | 2 | Sourced | Sourced | Unknown |
| Other 33 catalog heroes | Mixed | Not yet verified | Unknown | Unknown | Unknown |

Sources: <https://kingshotdata.com/heroes/yang/>, <https://kingshotdata.com/heroes/rosa/>, <https://kingshotdata.com/heroes/petra/>, <https://kingshotdata.com/heroes/zoe/>.

The source lists **31 ordered progression rows**. An exact mapping from row 1–31 to the game's star-plus-tier notation has NOT been verified. Do NOT treat row 29 as a certain 4-star T4 without validating that mapping.

The sourced expedition Attack/Defense percentages are **not** final screenshot values including gear, buffs, or combat modifiers. Website Conquest-stat examples do **not** provide a complete 1–80 hero base table, so that field is unknown. Skill effects are sourced but they are not automatically additive damage multipliers. A trustworthy Bear combat model still needs actual battle formulas, conditions, timing and stacking rules.

**The existing Bear advisor has NOT been wired to these JSON files. Its Yang/Rosa priority is still a provisional qualitative heuristic, not a damage-model result.**

## Privacy

PUBLIC HERO DATA ONLY. No player IDs, player aliases, saved personal rosters, screenshots, Discord identifiers, email addresses, credentials, tokens or secrets in this repository.

A future player registry belongs in a **separate private** repository (suggested name **Boltotelli/kingshot-players**), never GitHub Pages. Private player data requires a server-side authenticated API with narrowly scoped GitHub permissions. No GitHub access tokens in public browser JS.

## Move into an independent GitHub repository

The original seed was prepared under the isolated `welcome-nrw` Bear prototype branch. This repository is now its independent public home. Do not enable runtime use in the Bear Optimizer until the progression mapping, additional hero stats and model assumptions are verified.

Run: **node test-hero-reference.cjs** from this directory.

Checks include catalog parity, unique IDs, 31 finite progression rows, nondecreasing progression, 5 values for each of 3 expedition skills, explicit nulls for unsourced data and absence of player keys. Changes to the public data contract require an explicit schema version bump.

No app, production or Supabase changes are included in this research preview.
