# Kingshot hero reference database

**Public, versioned hero data. Independent of Supabase.**  
Data status: **research preview**, updated **2026-10-10**.

This repository contains public Kingshot hero reference values for the separate Welcome-NRW Bear Optimizer project. It must NEVER store any player's game ID, player name, Discord ID, account details, private build/roster, screenshots or credentials. Player records, if built later, belong in a separate PRIVATE GitHub repository and must be read via a secure backend.

## Data coverage

| Coverage | Count | Source assurance |
|---|---:|---|
| Canonical hero names and troop types | **37/37** | Checked against the app's existing catalog |
| Generation and expedition attack/defense bonuses at all **31 progression rows** | **37/37** | Reference tables, with 28 source maxima cross-checked |
| Expedition skill names and numeric values at **5 skill levels** | **37/37** | All 37 normal expedition skill sets checked against each hero’s Kingshot Database page |
| Full conquest base stats separately for every hero level 1–80 | **0/37** | **Not sourced; explicitly null** |
| Full widget/exclusive-weapon progression and reliable Bear damage simulation | Not yet | **Not implemented** |

Rare and Epic heroes typically have **two** expedition skills; legendary heroes have **three**. Some skills contain **two simultaneous attributes**, represented by the optional `additionalEffects` array. All effects are reference facts, NOT automatically applicable damage multipliers.

Notable independently identified progression exceptions: **Diana** (max **110.09%**) differs from other Epic Gen-1 heroes such as Howard (**140.11%**). **Amadeus** (max **260.21%**) differs from other Legendary Gen-1 heroes such as Helga (**200.16%**). These two have their own 31-row tables, not guessed generation averages.

## Exact stars and partial tiers — independently validated

The source reference's 31 rows correspond to **0★, five partial increments, 1★, ... 5★**:

```
sourceRow (1-based) = 6 * completedStars + partialTier + 1
arrayIndex (0-based) = 6 * completedStars + partialTier
```

`completedStars` is 0 through 5. `partialTier` is 0 through 5, except that full 5★ requires tier 0.

| Display | Row | Total shards spent since 0★ |
|---|---:|---:|
| 0★ | 1 | 0 |
| 1★ | 7 | 10 |
| 2★ | 13 | 50 |
| 3★ | 19 | 165 |
| 4★ | 25 | 465 |
| 4★ T4 | **29** | 865 |
| 5★ | 31 | **1,065** |

Per-full-star costs are **10 + 40 + 115 + 300 + 600 = 1,065**. The independent Kingshot shard calculators use the same six steps per star, validating the exact row indices in the hero reference tables.

The 31 individual mappings, per-step costs and cumulative costs are in [star-tiers.v1.json](star-tiers.v1.json).

**Data-contract caveat:** The legacy field `shardsToNextRow` in `heroes.v1.json` is inherited from the initial schema. In the source table its number is actually the cost to **reach the current row**, not the cost after it. Use `star-tiers.v1.json` for unambiguous semantics; the legacy name should be removed by a future versioned migration.

## Files and validation

- [heroes.v1.json](heroes.v1.json): complete public 37-hero index, 31 values per hero, skills with separate provenance and explicit null for unsourced 1–80 bases.
- [star-tiers.v1.json](star-tiers.v1.json): verified progression and shard-cost mapping.
- [catalog.v1.json](catalog.v1.json): name and troop-class index.
- [schema.v1.json](schema.v1.json): strict versioned JSON Schema, including provenance, multiple skill effects and public-only properties.
- [test-hero-reference.cjs](test-hero-reference.cjs): deterministic coverage, source maxima, star math, privacy and corruption regressions.
- [.github/workflows/validate.yml](.github/workflows/validate.yml): run JS tests and validate JSON against the schema on every change.

Run locally: `node test-hero-reference.cjs`. The GitHub Actions workflow also validates the JSON Schema with Python `jsonschema`.

## References and provenance

Each hero has its own original-reference URL in `source.stats`. Main dataset:

- [Kingshot Database](https://kingshotdata.com/category/heroes/) — individual hero progression tables and skill values.
- [Kingshot Hero Shards](https://kingshotdata.kr/en/database/hero-shards.html), [Kingshot Alliance Command](https://www.kingshotcommand.com/hero-shards), [Kingshot.net Shard Calculator](https://v2.kingshot.net/hero-shard-calculator) — independent shard/tier mapping.
- [g2384/Kingshot-Data](https://github.com/g2384/Kingshot-Data/blob/main/heroes2.json) — numeric skill reference for A secondary snapshot helped bootstrap 25 older heroes; **all 25 have now been individually checked** against their original Kingshot Database pages and carry `skillVerification: "primary-checked"`. The original secondary reference remains useful for audit history.

Published game-guide figures may occasionally differ by 0.01 percentage points due to rounding. We preserve the named primary source's values and never manufacture absent rows. Skill `conditions` are documented where directly verified; empty conditions means **not yet recorded**, NOT "always active."

**Not a damage model:** The Bear Optimizer's existing Yang/Rosa preference is a provisional heuristic and is NOT yet replaced or validated by this data. The 31 hero bonuses alone do not specify skill proc timing, stacking, battle damage, widget damage or complete troop interactions. Do not infer an exact best leader from these JSON values alone.


## Primary skill verification — 2026-10-10

Every one of the 37 regular Expedition skill sets is now checked against the
individual source URL attached to its hero record. Important corrections
found while comparing the 25 older secondary-source records:

- **Marlin** has **two normal Expedition skills**, Wild Card and Rumhead.
  The third skill “Dynamo” in the secondary snapshot is **not** present in
  the primary page’s normal Expedition list and was removed. Exclusive
  weapon bonuses are a separate system.
- **Saul:** corrected to **Positional Battler**, not “Positional Batter”.
- **Alcar:** corrected to **Carpe Diem**, not “Capre Diem”.

Sources: https://kingshotdata.com/heroes/marlin/ ,
https://kingshotdata.com/heroes/saul/ ,
https://kingshotdata.com/heroes/alcar/ .

Source-verified chance/turn conditions were added where available, but an
empty `conditions` object still means **not captured**, not “always on”.
The reference retains `releaseStatus: research-preview` because a correct
skill list is not a calibrated Bear damage formula and full hero base-stat
progressions by level 1–80 remain unsourced.

The Bear Optimizer will initially display the source-backed progression
numbers and skill effects as **explanatory evidence**. Do not sum skill
percentages or replace damage simulation with an arbitrary bonus multiplier.

## Privacy and future architecture

The reference repository is PUBLIC. The future player-name/game-ID mapping must be in a **separately secured PRIVATE repository** with restricted GitHub permissions and a server-side read/write API. Never commit those records, tokens or authentication code here, or embed a private GitHub token in public front-end JavaScript.

This repository has no connection to Supabase, the NAP tracker, Welcome-NRW production or player-account storage. Future integration into Welcome-NRW should be staged and tested, not silently deployed.
