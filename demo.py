"""
demo.py  — proves the pipeline runs end to end on synthetic users.
    python demo.py
"""
import random
import numpy as np
from questionnaire import SCORED, BY_ID
from encoder import encode
from matching import (build_profiles, train_population, rank_matches,
                      compatibility, Profile, visibility_group)

random.seed(7); np.random.seed(7)
GENDERS = ["Man", "Woman", "Non-binary"]
ORIENT = ["Straight", "Bisexual", "Gay / Lesbian", None]


def random_answers(skip_prob=0.15):
    a = {}
    for q in SCORED:
        if random.random() < skip_prob:        # genuinely skip some
            continue
        a[q["id"]] = random.randrange(len(q["options"]))
    return a


def make_population(n=60):
    users = []
    for i in range(1, n + 1):
        users.append({
            "id": i,
            "gender": random.choice(GENDERS),
            "orientation": random.choice(ORIENT),
            "answers": random_answers(),
        })
    return users


def main():
    users = make_population(60)
    profiles = build_profiles(users)
    print(f"Population: {len(users)} users")
    by_pool = {}
    for u in users:
        by_pool.setdefault(visibility_group(u["gender"]), 0)
        by_pool[visibility_group(u["gender"])] += 1
    print("Pools:", by_pool)

    print("\nTraining SOM…")
    som = train_population(profiles, epochs=200)
    print(f"  map size {som.x}x{som.y}, vector dim {som.dim}")

    # --- sanity checks -----------------------------------------------------
    base = users[0]["answers"]
    twin = Profile({"id": -1, "gender": users[0]["gender"]}, encode(dict(base)))
    twin.bmu = som.bmu(twin.enc.vector, twin.enc.mask)
    me = profiles[0]
    print("\nSanity checks:")
    print("  identical twin       :", compatibility(me, twin, som), "/100  (expect ~100)")

    opp = {q["id"]: (len(q["options"]) - 1 - base[q["id"]])
           for q in SCORED if q["id"] in base}
    op = Profile({"id": -2, "gender": users[0]["gender"]}, encode(opp))
    op.bmu = som.bmu(op.enc.vector, op.enc.mask)
    print("  mirror-opposite      :", compatibility(me, op, som), "/100  (expect low)")

    sparse = {"q5": base.get("q5", 1), "q11": base.get("q11", 1), "q12": base.get("q12", 1)}
    sp = Profile({"id": -3, "gender": users[0]["gender"]}, encode(sparse))
    sp.bmu = som.bmu(sp.enc.vector, sp.enc.mask)
    print("  skipped 14/17 answers:", compatibility(me, sp, som),
          "/100  (still scores, pulled toward 50)")

    # --- ranked matches for one user, gender-segregated --------------------
    me_user = users[0]
    ranked = rank_matches(me_user, users, som=som, profiles=profiles, limit=5)
    print(f"\nTop matches for user #{me_user['id']} "
          f"({me_user['gender']}, pool {visibility_group(me_user['gender'])}):")
    for r in ranked:
        print(f"  #{r['id']:<3} {r['score']:>3}/100   gender={r['gender']:<11} "
              f"orientation={r['orientation']}")

    pools_seen = {visibility_group(
        next(u for u in users if u['id'] == r['id'])['gender']) for r in ranked}
    print("\n  pools appearing in results:", pools_seen,
          "->", "PASS (same-gender only)" if pools_seen == {visibility_group(me_user['gender'])}
          else "FAIL")


if __name__ == "__main__":
    main()
