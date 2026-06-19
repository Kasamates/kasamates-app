"""
som.py
======
A compact Self-Organizing Map (Kohonen map) in NumPy, with one feature the
off-the-shelf libraries don't give us: per-sample masking, so a user who
skipped questions is compared only on the answers they *did* give.

Why a SOM at all? Roommate compatibility is non-linear and clustered — there
isn't a single axis from "bad" to "good" flatmate. A SOM learns the shape of
the population and lays similar people out next to each other on a 2-D grid.
Two users whose Best Matching Units sit in the same neighbourhood are alike in
a way a plain linear distance can miss. We combine that map-proximity signal
with an interpretable weighted-similarity score (see matching.py); the SOM is
the non-linear/cluster half, not the whole story.

Train offline on the user population, persist, reload at request time.
"""
from __future__ import annotations
import numpy as np


class SOM:
    def __init__(self, x: int, y: int, dim: int, seed: int = 42):
        self.x, self.y, self.dim = x, y, dim
        rng = np.random.default_rng(seed)
        # weights: (x, y, dim) in the same scaled space as encoded vectors
        self.w = rng.random((x, y, dim)).astype(np.float32)
        # grid coordinates for neighbourhood math
        gx, gy = np.meshgrid(np.arange(x), np.arange(y), indexing="ij")
        self._coords = np.stack([gx, gy], axis=-1).astype(np.float32)  # (x,y,2)

    # ---- distance that ignores masked-out (skipped) components ----
    def _masked_dist2(self, vec, mask):
        diff = (self.w - vec) * mask                 # broadcast (x,y,dim)
        sq = np.sum(diff * diff, axis=-1)
        present = max(mask.sum(), 1.0)
        return sq / present                          # mean over present dims

    def bmu(self, vec, mask):
        d2 = self._masked_dist2(vec, mask)
        flat = int(np.argmin(d2))
        return divmod(flat, self.y)                  # (gx, gy)

    def train(self, vectors, masks, epochs: int = 200,
              lr0: float = 0.5, sigma0: float | None = None, verbose: bool = False):
        n = len(vectors)
        sigma0 = sigma0 or max(self.x, self.y) / 2.0
        order = np.arange(n)
        rng = np.random.default_rng(0)
        for e in range(epochs):
            frac = e / max(epochs - 1, 1)
            lr = lr0 * (0.05 / lr0) ** frac           # decay to 5% of lr0
            sigma = max(sigma0 * (0.5 / sigma0) ** frac, 0.6)
            rng.shuffle(order)
            for i in order:
                vec, mask = vectors[i], masks[i]
                bx, by = self.bmu(vec, mask)
                # gaussian neighbourhood around the BMU on the grid
                d2 = np.sum((self._coords - np.array([bx, by], np.float32)) ** 2, axis=-1)
                h = np.exp(-d2 / (2 * sigma * sigma))[..., None]      # (x,y,1)
                # update only present dims so skips don't drag weights
                self.w += lr * h * ((vec - self.w) * mask)
            if verbose and (e % 50 == 0 or e == epochs - 1):
                print(f"  epoch {e:3d}  lr={lr:.3f} sigma={sigma:.2f}")
        return self

    def grid_proximity(self, a, b) -> float:
        """1.0 if same cell, decaying linearly with grid distance to 0 at the
        far corner. Used as the SOM half of the compatibility score."""
        diag = float(np.hypot(self.x - 1, self.y - 1)) or 1.0
        dist = float(np.hypot(a[0] - b[0], a[1] - b[1]))
        return max(0.0, 1.0 - dist / diag)

    # ---- persistence ----
    def save(self, path: str):
        np.savez(path, w=self.w, meta=np.array([self.x, self.y, self.dim]))

    @classmethod
    def load(cls, path: str) -> "SOM":
        d = np.load(path)
        x, y, dim = (int(v) for v in d["meta"])
        s = cls(x, y, dim)
        s.w = d["w"].astype(np.float32)
        return s
