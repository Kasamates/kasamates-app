# Kasamates — Compatibility Matching (Self-Organizing Map)

A drop-in matching layer for the Kasamates backend. It turns the 17-question
lifestyle questionnaire into a weighted feature space, learns the shape of the
user population with a **Self-Organizing Map**, and ranks same-gender candidates
by a compatibility score from 0–100 — while tolerating skipped questions.

```
questionnaire.py   the 17 questions + optional orientation, with weights      (source of truth)
questionnaire.json machine-readable copy for the Android / web frontend
encoder.py         answers -> SOM vector + mask (+ raw answers)
som.py             NumPy SOM with per-sample masking
matching.py        scoring, gender-segregated filter, ranking  (what the API calls)
demo.py            synthetic end-to-end run + sanity checks
```

Run it:

```bash
pip install numpy
python questionnaire.py   # regenerate questionnaire.json
python demo.py            # train + score on 60 synthetic users
```

---

## 1. Weights — every question and answer

Each question has a **weight** (importance to living together) and each answer a
**value** on its spectrum. Weights follow the real sources of flat-share friction:
the four classic flash-points — cleaning, noise, sleep, overnight guests — sit at 5.

| # | Question | Weight | Type | Answer spectrum (low → high value) |
|---|----------|:------:|------|-----------------------------------|
| q5 | Cleaning approach | **5** | ordinal | own-space → casual → rotation → hire help |
| q6 | Guests / partners over | **5** | ordinal | just us → occasional → not nightly → anyone anytime |
| q11 | Noise at home | **5** | ordinal | quiet → background ok → don't mind → I'm the loud one |
| q12 | Sleep time | **5** | ordinal | before 11 → midnight → 1–2am → no schedule |
| q2 | Shared expenses | 4 | ordinal | exact split → I'll manage → loose → whoever pays |
| q4 | How often home | 4 | ordinal | rarely → evenings → WFH → almost always |
| q14 | Conflict style | 4 | ordinal | avoid (.2) → unsure (.45) → time-then-calm (.7) → direct (1) |
| q1 | Spending style | 3 | ordinal | careful → mindful → when it feels right → enjoy |
| q3 | Sharing items | 3 | ordinal | own stuff → ask first → mostly fine → all shared |
| q7 | Length of stay | 3 | ordinal | long-term → a year → 6–12mo → uncertain |
| q10 | Weekday morning | 3 | ordinal | up-early-out → slow → WFH → late riser |
| q13 | Cooking / kitchen | 3 | ordinal | barely → sometimes → often+clean → loves cooking |
| q16 | Work/study from home | 3 | ordinal | office → hybrid → irregular → remote |
| q15 | Stress style | 2 | nominal | quiet / vent / talk / distract (match only) |
| q17 | Aesthetics | 2 | ordinal | not really → somewhat → collaborate → very |
| q8 | Fitness | 1 | ordinal | not my thing → when motivated → consistent → regimented |
| q9 | Music | 1 | nominal | trending / bollywood / indie / chaos (match only) |
| q_orientation | Sexual orientation | **0** | nominal | optional, informational — **never scored** |

**Ordinal vs nominal.** Ordinal answers sit on a line, so similarity is `1 − |Δvalue|`
(close answers = compatible). Nominal answers (music taste, stress coping) aren't
better-or-worse, only same-or-different, so similarity is `1` if identical else `0`.
A few questions aren't naturally monotonic — for those the *value* is set by meaning,
not list order (e.g. conflict-style is scored by directness, "I'll manage the money"
sits near the structured end). Everything lives in `questionnaire.py`, so tuning a
weight or value is a one-line change that both the app and the scorer pick up.

---

## 2. Skipped questions — masking, not faking

The requirement was to handle people who skip questions without breaking the
non-linear structure. Imputing a missing answer as `0` would quietly make someone
look like an extreme "careful spender / very quiet" type they never claimed to be.

Instead each user is encoded as a **vector + a mask** (`encoder.py`). Skipped
questions stay masked off, and *every* distance — both the SOM's Best-Matching-Unit
search and the pairwise score — is computed over present dimensions only, averaged
by how many are present. A skip simply doesn't vote.

Two further guards (`matching.py`):
- the pairwise score only uses questions **both** people answered;
- a **coverage confidence** factor shrinks the score toward a neutral 50 when a pair
  shares few answers, so a thin profile can't manufacture a 99% match. In the demo a
  user who skipped 14 of 17 questions still scores (70/100), just hedged.

---

## 3. Why a Self-Organizing Map, and what it actually contributes

Compatibility isn't one axis from bad to good flatmate — it's clustered and
non-linear (a tidy night-owl and a tidy early-riser are close on cleanliness, far on
schedule). A SOM is an unsupervised net that lays the population onto a 2-D grid so
**similar people end up in neighbouring cells**, capturing that structure without
needing labelled "good match" data we don't have.

Being honest about the division of labour, the final score blends two parts:

```
score = 100 · shrink( 0.70 · weighted_similarity  +  0.30 · som_grid_proximity )
```

- **weighted_similarity** — the interpretable, weight-driven part. This is what makes
  a score explainable ("you both want a quiet, tidy flat").
- **som_grid_proximity** — `1.0` if two users share a map cell, decaying with grid
  distance. This is the non-linear / clustering half: it rewards people who land in
  the same lifestyle archetype even when raw distances are noisy, and it gives you a
  natural ordering for discovery and cold-start.

So the SOM does the non-linearity and clustering you asked for, but it sits *on top
of* a transparent weighted score rather than replacing it. The blend (`ALPHA_DIRECT`
/ `ALPHA_MAP`) is a tunable constant. If you'd rather lean entirely on the map, set
`ALPHA_MAP = 1.0`; pass `som=None` to score on weighted similarity alone.

Train the SOM offline on the user base (a few hundred ms for thousands of users),
persist it (`som.save`), reload at request time (`SOM.load`), and re-train on a
schedule as the population grows.

---

## 4. Gender-segregated viewing (safety)

`rank_matches` applies a **hard filter before any scoring**: a user only ever sees,
and is seen by, people in their own visibility group. Men see men, women see women.

```python
visibility_group("Man")   -> "M"
visibility_group("Woman") -> "F"
```

The demo verifies this — a woman's result list contains only women (`PASS`).

**Non-binary / "prefer not to say" need a product decision.** The binary rule has no
obvious answer for them. The current default gives each its own pool (so they're
matched within their own group rather than silently pushed into M or F, which could
be unsafe or wrong). That keeps the safety guarantee, but it can also *isolate* those
users if their pool is small. The cleaner long-term fix is an explicit, opt-in
visibility setting the user controls ("show me people in: women's pool / non-binary
pool"), gated by their own choice. The hook lives in `visibility_group` /
`same_pool`; wire it to a user preference when you've decided the policy.

---

## 5. The optional orientation question

Added as `q_orientation` — **optional**, with a "prefer not to say", weight **0**.

By design it is **never used to compute compatibility and never used to filter the
pool.** It's profile information the user opts into sharing, exactly as you framed it:
to avoid confusion between matched flatmates. Keeping it out of the algorithm matters
both ethically and legally — it prevents the system from quietly sorting or ranking
people by orientation. If you later want an *opt-in* "only show me…" preference, build
it as a user-controlled filter on top, not as a scoring input.

Treat this field as sensitive: store it as optional/nullable, default it to private,
and let users edit or clear it any time.

---

## 6. Wiring into the FastAPI backend

The 17 questions become onboarding (replacing / extending the current step screens),
and this module replaces the heuristic compatibility score.

**Onboarding** — persist answers as `{qid: option_index}` per user. Serve
`questionnaire.json` to the app so the questions, options and weights have one source.

**Offline job** (cron / on a counter):
```python
profiles = build_profiles(all_users)          # all_users from the DB
som = train_population(profiles, epochs=200)
som.save("kasa_som.npz")
# store each profile.bmu (gx,gy) on the user row for fast lookup
```

**`GET /matches/browse`**:
```python
som = SOM.load("kasa_som.npz")                # or cache in memory
ranked = rank_matches(me, candidate_users, som=som,
                      profiles=cached_profiles, limit=page_size)
# -> [{"id":.., "score":0-100, ...}]  already gender-filtered, orientation untouched
```

The returned `score` maps straight onto the app's existing 0–100 compatibility field
and the profile **Compatibility Fingerprint** radar (the six radar axes — Sleep,
Diet/Kitchen, Noise, Clean, Social, Guests — line up with question groups, so you can
feed per-group values into the existing `FingerprintRadar`).

---

## 7. Limits & tunables (honest notes)

- A SOM is **unsupervised** — it models who's *similar*, not who's provably a *good*
  flatmate, because there's no outcome data yet. Once you can observe which matches
  led to successful tenancies, feed that back (e.g. re-weight questions, or add a
  supervised layer) — the weighted-similarity base makes that straightforward.
- Results depend on map size, epochs and seed. The defaults are sensible for
  hundreds–thousands of users; tune `grid`, `epochs` in `train_population`.
- Small pools (a thin non-binary pool, or a new city) give weaker SOM structure;
  the weighted-similarity half keeps scores reasonable until the population grows.
- The complementary-roommate case (a keen cook + a happy non-cook) is currently scored
  on similarity like everything else. If you want true complementarity for the kitchen
  group, add a per-group similarity override in `question_similarity`.
