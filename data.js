// -------------------------------------------------------------------------
// Mock data + a JS port of the compatibility engine.
// In production the Self-Organizing Map runs server-side; here we run the
// interpretable, weight-true half live so stakeholders see real scores move.
// -------------------------------------------------------------------------

// Weights on the six Fingerprint axes mirror the questionnaire: the classic
// flat-share flash-points (clean / noise / sleep / guests) carry the most.
export const AXES = ['Sleep', 'Diet', 'Noise', 'Clean', 'Social', 'Guests'];
const AXIS_WEIGHT = { Sleep: 5, Diet: 2, Noise: 5, Clean: 5, Social: 3, Guests: 5 };

// Weighted similarity over axes both people have. Returns 0..100.
export function compatibility(a, b) {
  let acc = 0, w = 0, shared = 0, total = 0;
  for (const k of AXES) {
    total += AXIS_WEIGHT[k];
    if (a?.[k] == null || b?.[k] == null) continue;
    acc += AXIS_WEIGHT[k] * (1 - Math.abs(a[k] - b[k]));
    w += AXIS_WEIGHT[k];
    shared += AXIS_WEIGHT[k];
  }
  if (!w) return 50;
  const sim = acc / w;
  const coverage = shared / total;          // shrink toward 50 if sparse
  const conf = 0.55 + 0.45 * coverage;
  return Math.round(100 * (0.5 + (sim - 0.5) * conf));
}

// Gender-segregated viewing (safety): men see men, women see women, others
// get their own pool. Mirrors matching.py / the README's visibility rule.
export function pool(g) {
  g = (g || '').toLowerCase();
  if (['man', 'male', 'm'].includes(g)) return 'M';
  if (['woman', 'female', 'f'].includes(g)) return 'F';
  if (g.startsWith('non')) return 'NB';
  return 'U';
}
export const samePool = (a, b) => pool(a) === pool(b);

const P = (s) => `https://images.unsplash.com/${s}?w=640&q=70&auto=format&fit=crop`;

export const PEOPLE = [
  { id: 1, name: 'Riya', age: 24, gender: 'Woman', orientation: 'Straight',
    area: 'Sector 49, Gurugram', budget: '₹14–18k', verified: true, init: 'R',
    photo: P('photo-1544005313-94ddf0286df2'),
    vibes: ['Early riser', 'Veg kitchen', 'Tidy'],
    blurb: 'Designer who cooks on Sundays and guards quiet weeknights.',
    fp: { Sleep: .82, Diet: .85, Noise: .30, Clean: .86, Social: .55, Guests: .35 } },
  { id: 2, name: 'Meera', age: 23, gender: 'Woman', orientation: 'Bisexual',
    area: 'Sector 62, Noida', budget: '₹12–15k', verified: false, init: 'M',
    photo: P('photo-1487412720507-e7ab37603c6f'),
    vibes: ['Plant mom', 'Vegan', 'Reader'],
    blurb: 'Grad student, plant-filled balcony, slow filter-coffee mornings.',
    fp: { Sleep: .70, Diet: 1.0, Noise: .20, Clean: .80, Social: .40, Guests: .25 } },
  { id: 3, name: 'Sara', age: 25, gender: 'Woman', orientation: 'Prefer not to say',
    area: 'Lajpat Nagar, Delhi', budget: '₹15–19k', verified: true, init: 'S',
    photo: P('photo-1438761681033-6461ffad8d80'),
    vibes: ['Yoga', 'Eggetarian', 'Minimal'],
    blurb: '6am yoga, in bed by 11. Minimal stuff, maximal calm.',
    fp: { Sleep: .90, Diet: .60, Noise: .25, Clean: .90, Social: .50, Guests: .30 } },
  { id: 4, name: 'Aisha', age: 26, gender: 'Woman', orientation: 'Straight',
    area: 'Indirapuram, Ghaziabad', budget: '₹11–14k', verified: true, init: 'A',
    photo: P('photo-1489424731084-a5d8b219a5bb'),
    vibes: ['Foodie', 'Host', 'Night owl'],
    blurb: 'Marketing lead who loves a full table and the occasional late night.',
    fp: { Sleep: .35, Diet: .35, Noise: .55, Clean: .65, Social: .85, Guests: .80 } },
  { id: 5, name: 'Kabir', age: 27, gender: 'Man', orientation: 'Straight',
    area: 'Indirapuram, Ghaziabad', budget: '₹10–13k', verified: true, init: 'K',
    photo: P('photo-1507003211169-0a1dd7228f2d'),
    vibes: ['Night owl', 'Gym', 'Gamer'],
    blurb: 'Product analyst, late hours, headphones always on.',
    fp: { Sleep: .25, Diet: .30, Noise: .60, Clean: .62, Social: .90, Guests: .70 } },
  { id: 6, name: 'Arjun', age: 29, gender: 'Man', orientation: 'Bisexual',
    area: 'DLF Phase 3, Gurugram', budget: '₹18–22k', verified: true, init: 'A',
    photo: P('photo-1500648767791-00dcc994a43e'),
    vibes: ['Foodie', 'Host', 'Cyclist'],
    blurb: 'Consultant who loves a full table. Happy to cook for the flat.',
    fp: { Sleep: .55, Diet: .30, Noise: .55, Clean: .70, Social: .90, Guests: .90 } },
  { id: 7, name: 'Dev', age: 26, gender: 'Man', orientation: 'Prefer not to say',
    area: 'Sector 18, Noida', budget: '₹11–14k', verified: false, init: 'D',
    photo: P('photo-1506794778202-cad84cf45f1d'),
    vibes: ['Musician', 'Non-veg', 'Social'],
    blurb: 'Sound engineer, practices with headphones. Loves a weekend jam.',
    fp: { Sleep: .40, Diet: .30, Noise: .50, Clean: .60, Social: .85, Guests: .60 } },
  { id: 8, name: 'Rohan', age: 28, gender: 'Man', orientation: 'Straight',
    area: 'Sector 49, Gurugram', budget: '₹14–17k', verified: true, init: 'R',
    photo: P('photo-1463453091185-61582044d556'),
    vibes: ['Early riser', 'Tidy', 'Veg'],
    blurb: 'Engineer, early to bed, keeps a spotless kitchen. Easy to live with.',
    fp: { Sleep: .85, Diet: .80, Noise: .30, Clean: .88, Social: .50, Guests: .35 } },
];

// "Me" — gender is chosen during onboarding and drives the safety filter.
export const ME = {
  name: 'Aarav', age: 26, gender: 'Man', init: 'A',
  area: 'Sector 49, Gurugram', budget: '₹12–16k',
  orientation: 'Straight',
  fp: { Sleep: .80, Diet: .82, Noise: .35, Clean: .85, Social: .52, Guests: .40 },
};

export const SEED_CONVOS = [
  { id: 8, last: 'Spotless kitchen — we’d get along. Viewing this week?', unread: 2,
    thread: [
      ['them', 'Hey Aarav, saw we’re both Sector 49 + early risers'],
      ['them', 'And you keep the kitchen clean — same here'],
      ['me', 'Non-negotiable for me 😄'],
      ['them', 'Spotless kitchen — we’d get along. Viewing this week?'],
    ] },
];

// Concise 6-step onboarding (kept snappy for a demo walk-through).
export const STEPS = [
  { t: 'The basics', d: 'Tell us who you are.', fields: [
    { k: 'name', label: 'Preferred name', type: 'text', ph: 'Aarav' },
    { k: 'age', label: 'Age', type: 'text', ph: '26' },
    { k: 'gender', label: 'Gender (sets who you’re matched with)', type: 'single',
      opts: ['Woman', 'Man', 'Non-binary', 'Prefer not to say'] },
  ] },
  { t: 'What you need', d: 'Room or roommate — and your budget.', fields: [
    { k: 'listing', label: 'I’m looking to…', type: 'single',
      opts: ['Find a room', 'Find a flatmate', 'Either'] },
    { k: 'budget', label: 'Monthly budget (₹)', type: 'single',
      opts: ['8–12k', '12–16k', '16–20k', '20k+'] },
    { k: 'area', label: 'Preferred areas', type: 'multi',
      opts: ['Gurugram', 'Noida', 'Ghaziabad', 'South Delhi', 'Dwarka'] },
  ] },
  { t: 'Your clock', d: 'When are you up and about?', fields: [
    { k: 'sleep', label: 'Bedtime', type: 'single', opts: ['Before 10', '10–12', '12–2am', 'After 2am'] },
    { k: 'wake', label: 'Wake up', type: 'single', opts: ['Before 6', '6–8am', '8–10am', 'After 10'] },
  ] },
  { t: 'Daily habits', d: 'The little things that decide a flat.', fields: [
    { k: 'diet', label: 'Kitchen', type: 'single', opts: ['Vegan', 'Vegetarian', 'Eggetarian', 'Non-veg'] },
    { k: 'clean', label: 'Cleanliness', type: 'single', opts: ['Relaxed', 'Average', 'Tidy', 'Spotless'] },
    { k: 'noise', label: 'Noise at home', type: 'single', opts: ['Quiet', 'Background ok', 'Don’t mind', 'I’m loud'] },
  ] },
  { t: 'Your space', d: 'The vibe you’re after at home.', fields: [
    { k: 'aesthetic', label: 'Pick what feels like home', type: 'multi',
      opts: ['Minimal', 'Plant-filled', 'Cozy', 'Bright', 'Arty', 'Neutral'] },
  ] },
  { t: 'Living energy', d: 'How social is your ideal home?', fields: [
    { k: 'social', label: 'You’re more…', type: 'single', opts: ['Introvert', 'Ambivert', 'Extrovert'] },
    { k: 'guests', label: 'Guests over', type: 'single', opts: ['Rarely', 'Occasionally', 'Frequently'] },
    { k: 'orientation', label: 'Orientation (optional, shown on profile)', type: 'single',
      opts: ['Straight', 'Gay / Lesbian', 'Bisexual', 'Prefer not to say'] },
  ] },
];
