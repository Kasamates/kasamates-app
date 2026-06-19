"""
matching.py
===========
The public surface the backend calls.

A "user" here is a small dict:
    {
      "id": 42,
      "gender": "Man" | "Woman" | "Non-binary" | "Prefer not to say",
      "orientation": "Straight" | ... | None,     # optional, never scored
      "answers": {"q1": 0, "q5": 2, ...},          # option indices, skips omitted
    }

Pipeline:
    population -> encode -> train SOM (offline) -> store BMU per user
    request    -> gender filter -> score me vs each candidate -> rank
"""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np

from questionnaire import SCORED, BY_ID
from encoder import encode, question_similarity, Encoded
from som import SOM

# Blend: how much of the final score is the interpretable weighted similarity
# vs the SOM's non-linear neighbourhood signal.
ALPHA_DIRECT = 0.70
ALPHA_MAP = 0.30


# --------------------------------------------------------------------------
# Gender-segregated visibility (safety requirement)
# --------------------------------------------------------------------------
def visibility_group(gender: str) -> str:
    """Men only see men, women only see women. Non-binary / unspecified each
    get their own pool by default rather than being silently dropped into a
    binary one — see README; this is a product decision to confirm, and can be
    replaced by a user-chosen, opt-in visibility setting."""
    g = (gender or "").strip().lower()
    if g in ("man", "male", "m"):
        return "M"
    if g in ("woman", "female", "f"):
        return "F"
    if g in ("non-binary", "nonbinary", "nb"):
        return "NB"
    return "UNSPECIFIED"


def same_pool(me: dict, other: dict) -> bool:
    return visibility_group(me.get("gender")) == visibility_group(other.get("gender"))


# --------------------------------------------------------------------------
# Encoding a whole population + training
# --------------------------------------------------------------------------
@dataclass
class Profile:
    user: dict
    enc: Encoded
    bmu: tuple = (0, 0)


def build_profiles(users: list[dict]) -> list[Profile]:
    return [Profile(u, encode(u.get("answers", {}))) for u in users]


def train_population(profiles: list[Profile], grid=None, epochs=200, seed=42) -> SOM:
    from encoder import VECTOR_DIM
    n = len(profiles)
    if grid is None:                       # heuristic map size ~ sqrt(5*sqrt(n))
        side = max(4, int(round((5 * np.sqrt(max(n, 1))) ** 0.5)))
        grid = (side, side)
    som = SOM(grid[0], grid[1], VECTOR_DIM, seed=seed)
    vectors = [p.enc.vector for p in profiles]
    masks = [p.enc.mask for p in profiles]
    som.train(vectors, masks, epochs=epochs)
    for p in profiles:
        p.bmu = som.bmu(p.enc.vector, p.enc.mask)
    return som


# --------------------------------------------------------------------------
# Scoring
# --------------------------------------------------------------------------
def direct_similarity(a: Encoded, b: Encoded):
    """Interpretable, weight-true similarity over questions BOTH answered.
    Returns (similarity in [0,1], coverage_confidence in [0,1])."""
    shared_w = 0.0
    acc = 0.0
    for q in SCORED:
        qid = q["id"]
        if qid in a.answers and qid in b.answers:
            sim = question_similarity(qid, a.answers[qid], b.answers[qid])
            acc += q["weight"] * sim
            shared_w += q["weight"]
    if shared_w == 0:
        return 0.5, 0.0                       # nothing in common to judge on
    from questionnaire import TOTAL_WEIGHT
    return acc / shared_w, shared_w / TOTAL_WEIGHT


def compatibility(a: Profile, b: Profile, som: SOM | None = None) -> int:
    direct, coverage_conf = direct_similarity(a.enc, b.enc)
    if som is not None:
        map_prox = som.grid_proximity(a.bmu, b.bmu)
        blended = ALPHA_DIRECT * direct + ALPHA_MAP * map_prox
    else:
        blended = direct
    # Shrink toward neutral 0.5 when the pair shares few answers, so sparse
    # profiles don't produce overconfident scores.
    confidence = 0.4 + 0.6 * coverage_conf
    adjusted = 0.5 + (blended - 0.5) * confidence
    return int(round(100 * max(0.0, min(1.0, adjusted))))


# --------------------------------------------------------------------------
# The call the /matches/browse endpoint makes
# --------------------------------------------------------------------------
def rank_matches(me: dict, others: list[dict], som: SOM | None = None,
                 profiles: list[Profile] | None = None, limit: int | None = None):
    """Return candidates the same gender as `me`, sorted by compatibility.
    `orientation` is never used here — it's profile information only."""
    me_p = Profile(me, encode(me.get("answers", {})))
    if som is not None:
        me_p.bmu = som.bmu(me_p.enc.vector, me_p.enc.mask)

    # index precomputed profiles if provided (avoids re-encoding everyone)
    pmap = {p.user.get("id"): p for p in (profiles or [])}

    scored = []
    for o in others:
        if o.get("id") == me.get("id"):
            continue
        if not same_pool(me, o):                      # hard safety filter
            continue
        op = pmap.get(o.get("id"))
        if op is None:
            op = Profile(o, encode(o.get("answers", {})))
            if som is not None:
                op.bmu = som.bmu(op.enc.vector, op.enc.mask)
        scored.append((compatibility(me_p, op, som), o))

    scored.sort(key=lambda t: t[0], reverse=True)
    if limit:
        scored = scored[:limit]
    return [{"id": o["id"], "score": s, "gender": o.get("gender"),
             "orientation": o.get("orientation")} for s, o in scored]
