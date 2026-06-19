"""
encoder.py
==========
Turn a user's answers into the two representations the matcher needs:

  1. A SOM feature vector + mask. Ordinal questions become one weighted scalar;
     nominal questions become a weighted one-hot block. The mask marks which
     components are present, so a *skipped* question contributes nothing to the
     SOM distance instead of being faked as zero (this is the core of the
     "deal with non-linearity when someone skips" requirement).

  2. The raw per-question {qid: option_index} map, used for the interpretable,
     weight-true pairwise similarity.

`answers` is a dict {qid: option_index}. Missing qid == skipped.
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field
import numpy as np

from questionnaire import SCORED, BY_ID

# ---- fixed component layout (built once so every vector lines up) ----------
# Each scored question owns a contiguous slice of the vector.
_LAYOUT = []           # list of (qid, start, length, type)
_pos = 0
for q in SCORED:
    length = 1 if q["type"] == "ordinal" else len(q["options"])
    _LAYOUT.append((q["id"], _pos, length, q["type"]))
    _pos += length
VECTOR_DIM = _pos
_SLICE = {qid: (start, length, typ) for qid, start, length, typ in _LAYOUT}


def _scale(weight: float, nominal: bool) -> float:
    # weighted Euclidean: squared diff on a component is multiplied by weight.
    # nominal one-hot mismatch flips two dims, so halve to keep ~ weight.
    return math.sqrt(weight / 2.0) if nominal else math.sqrt(weight)


@dataclass
class Encoded:
    vector: np.ndarray            # length VECTOR_DIM, missing dims = 0
    mask: np.ndarray              # length VECTOR_DIM, 1 where present
    answers: dict                 # {qid: option_index} (scored questions only)
    coverage_weight: float = field(default=0.0)   # Σ weight of answered scored qs

    @property
    def coverage(self) -> float:
        from questionnaire import TOTAL_WEIGHT
        return self.coverage_weight / TOTAL_WEIGHT


def encode(answers: dict) -> Encoded:
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    mask = np.zeros(VECTOR_DIM, dtype=np.float32)
    kept = {}
    cov = 0.0
    for q in SCORED:
        qid = q["id"]
        if qid not in answers or answers[qid] is None:
            continue                                   # skipped -> stays masked
        idx = int(answers[qid])
        start, length, typ = _SLICE[qid]
        s = _scale(q["weight"], typ == "nominal")
        if typ == "ordinal":
            vec[start] = q["options"][idx]["value"] * s
            mask[start] = 1.0
        else:                                          # nominal one-hot
            vec[start:start + length] = 0.0
            vec[start + idx] = 1.0 * s
            mask[start:start + length] = 1.0
        kept[qid] = idx
        cov += q["weight"]
    return Encoded(vector=vec, mask=mask, answers=kept, coverage_weight=cov)


def question_similarity(qid: str, a_idx: int, b_idx: int) -> float:
    """Per-question similarity in [0,1] used by the interpretable pair score."""
    q = BY_ID[qid]
    if q["type"] == "nominal":
        return 1.0 if a_idx == b_idx else 0.0
    av = q["options"][a_idx]["value"]
    bv = q["options"][b_idx]["value"]
    return 1.0 - abs(av - bv)        # ordinal values already in [0,1]


if __name__ == "__main__":
    e = encode({"q5": 2, "q11": 0, "q12": 0})     # only 3 of 17 answered
    print("vector dim:", VECTOR_DIM)
    print("present components:", int(e.mask.sum()))
    print("coverage:", round(e.coverage, 3))
