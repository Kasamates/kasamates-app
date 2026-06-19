import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Animated, PanResponder,
  Image, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { C, SERIF, TOP, shadow } from './theme';
import {
  Eyebrow, Display, Sub, Tiny, Btn, Field, Chip, Pill, Avatar, IconBtn, Ring, Radar,
} from './ui';
import { PEOPLE, ME, SEED_CONVOS, STEPS, AXES, compatibility, pool, samePool } from './data';

/* ============================ SPLASH ============================ */
export function Splash({ nav }) {
  return (
    <View style={[st.fill, { backgroundColor: C.greenDeep, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontFamily: SERIF, fontSize: 70, letterSpacing: 10, color: C.cream, fontWeight: '600' }}>KASA</Text>
      <Text style={{ letterSpacing: 4, fontSize: 11, color: '#cdc7b2', textTransform: 'uppercase', marginTop: 4 }}>
        Find your housemate
      </Text>
      <Pressable onPress={() => nav.go('auth')}
        style={{ marginTop: 50, borderWidth: 1, borderColor: 'rgba(242,235,217,0.4)', borderRadius: 999, paddingVertical: 13, paddingHorizontal: 30 }}>
        <Text style={{ color: C.cream, fontSize: 14 }}>Get started</Text>
      </Pressable>
      <Text style={{ position: 'absolute', bottom: 34, color: '#9c9683', fontSize: 11, letterSpacing: 3 }}>
        DELHI · GURUGRAM · NOIDA
      </Text>
    </View>
  );
}

/* ============================ AUTH ============================ */
export function Auth({ nav }) {
  const [reg, setReg] = useState(true);
  return (
    <ScrollView style={st.screen} contentContainerStyle={{ padding: 22, paddingTop: TOP + 12 }}>
      <Eyebrow>No brokers. No noise.</Eyebrow>
      <Display style={{ fontSize: 34, marginVertical: 6 }}>Welcome to{'\n'}Kasamates.</Display>
      <Sub>Verified flatmates across Delhi-NCR, matched on how you actually live.</Sub>
      <View style={{ height: 22 }} />
      {reg && (<><Text style={st.lbl}>Full name</Text><Field placeholder="Aarav Mehta" /></>)}
      <Text style={st.lbl}>Email</Text><Field placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
      <Text style={st.lbl}>Password</Text><Field placeholder="••••••••" secureTextEntry />
      <View style={{ height: 20 }} />
      <Btn title={reg ? 'Create account' : 'Sign in'} onPress={() => reg ? nav.go('otp') : nav.reset('home')} />
      <View style={st.divider}><View style={st.hr} /><Tiny>or</Tiny><View style={st.hr} /></View>
      <Btn kind="ghost" title="Continue with Google" onPress={() => alert('Google sign-in is coming soon')} />
      <Pressable onPress={() => setReg(!reg)} style={{ marginTop: 18 }}>
        <Tiny style={{ textAlign: 'center' }}>
          {reg ? 'Already have an account? ' : 'New here? '}
          <Text style={{ color: C.greenAccent, fontWeight: '700' }}>{reg ? 'Sign in' : 'Create account'}</Text>
        </Tiny>
      </Pressable>
    </ScrollView>
  );
}

/* ============================ OTP ============================ */
export function Otp({ nav }) {
  const [code, setCode] = useState('');
  return (
    <View style={st.screen}>
      <View style={st.topbar}><IconBtn onPress={() => nav.back()}>‹</IconBtn><View /><View style={{ width: 38 }} /></View>
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <Eyebrow>Verify email</Eyebrow>
        <Display style={{ marginVertical: 6 }}>Enter the code.</Display>
        <Sub>We sent a 6-digit code to your email. (Demo code: 000000)</Sub>
        <View style={{ height: 18 }} />
        <Field value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6}
          placeholder="••••••" style={[st.field, { letterSpacing: 8, textAlign: 'center', fontSize: 22 }]} />
        <View style={{ height: 16 }} />
        <Btn title="Verify & continue" onPress={() => (code && code !== '000000') ? alert('Demo code is 000000') : nav.go('onb')} />
        <Tiny style={{ textAlign: 'center', marginTop: 14 }}>Phone verification happens after onboarding.</Tiny>
      </ScrollView>
    </View>
  );
}

/* ============================ ONBOARDING ============================ */
function buildFp(f) {
  const m = {
    sleep: { 'Before 10': .9, '10–12': .6, '12–2am': .3, 'After 2am': .1 },
    clean: { Relaxed: .3, Average: .55, Tidy: .8, Spotless: .95 },
    noise: { Quiet: .2, 'Background ok': .45, 'Don’t mind': .7, 'I’m loud': .95 },
    diet: { Vegan: 1, Vegetarian: .85, Eggetarian: .6, 'Non-veg': .3 },
    social: { Introvert: .25, Ambivert: .55, Extrovert: .9 },
    guests: { Rarely: .25, Occasionally: .55, Frequently: .9 },
  };
  return {
    Sleep: m.sleep[f.sleep] ?? ME.fp.Sleep,
    Diet: m.diet[f.diet] ?? ME.fp.Diet,
    Noise: m.noise[f.noise] ?? ME.fp.Noise,
    Clean: m.clean[f.clean] ?? ME.fp.Clean,
    Social: m.social[f.social] ?? ME.fp.Social,
    Guests: m.guests[f.guests] ?? ME.fp.Guests,
  };
}

export function Onboarding({ nav, setMe }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const s = STEPS[step];
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k, v) => setForm((f) => {
    const arr = new Set(f[k] || []); arr.has(v) ? arr.delete(v) : arr.add(v);
    return { ...f, [k]: [...arr] };
  });
  const finish = () => {
    setMe((m) => ({
      ...m, gender: form.gender || m.gender, name: form.name || m.name,
      orientation: form.orientation || m.orientation, fp: buildFp(form),
    }));
    nav.reset('home');
  };
  return (
    <View style={st.screen}>
      <View style={st.topbar}>
        <IconBtn onPress={() => step ? setStep(step - 1) : nav.back()}>‹</IconBtn>
        <Tiny>Step {step + 1} of 6</Tiny><View style={{ width: 38 }} />
      </View>
      <View style={st.progressTrack}><View style={[st.progressFill, { width: `${(step + 1) / 6 * 100}%` }]} /></View>
      <ScrollView contentContainerStyle={{ padding: 22 }} key={step}>
        <Eyebrow>Step {step + 1}</Eyebrow>
        <Display style={{ marginVertical: 6 }}>{s.t}</Display>
        <Sub>{s.d}</Sub>
        <View style={{ height: 16 }} />
        {s.fields.map((f) => (
          <View key={f.k} style={{ marginBottom: 16 }}>
            <Text style={st.lbl}>{f.label}</Text>
            {f.type === 'text'
              ? <Field placeholder={f.ph} value={form[f.k] || ''} onChangeText={(v) => set(f.k, v)} />
              : <View style={st.chips}>
                  {f.opts.map((o) => {
                    const on = f.type === 'multi' ? (form[f.k] || []).includes(o) : form[f.k] === o;
                    return <Chip key={o} label={o} on={on}
                      onPress={() => f.type === 'multi' ? toggle(f.k, o) : set(f.k, o)} />;
                  })}
                </View>}
          </View>
        ))}
      </ScrollView>
      <View style={{ padding: 22 }}>
        <Btn title={step === 5 ? 'Finish' : 'Continue'} onPress={() => step < 5 ? setStep(step + 1) : finish()} />
      </View>
    </View>
  );
}

/* ============================ HOME (tabs) ============================ */
const TABS = [
  { k: 'discover', ic: '⌂', label: 'Discover' },
  { k: 'browse', ic: '▦', label: 'Browse' },
  { k: 'matches', ic: '♡', label: 'Matches' },
  { k: 'activity', ic: '◎', label: 'Activity' },
  { k: 'profile', ic: '☻', label: 'Profile' },
];
export function Home(props) {
  const [tab, setTab] = useState('discover');
  return (
    <View style={st.screen}>
      <View style={{ flex: 1 }}>
        {tab === 'discover' && <Discover {...props} />}
        {tab === 'browse' && <Browse {...props} />}
        {tab === 'matches' && <Matches {...props} />}
        {tab === 'activity' && <Activity />}
        {tab === 'profile' && <Profile {...props} />}
      </View>
      <View style={st.nav}>
        {TABS.map((t) => (
          <Pressable key={t.k} style={st.navItem} onPress={() => setTab(t.k)}>
            <Text style={{ fontSize: 19, color: tab === t.k ? C.green : C.muted }}>{t.ic}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '600', color: tab === t.k ? C.green : C.muted }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ---------- Discover: swipe deck ---------- */
function Discover({ nav, me, setConvos }) {
  const eligible = PEOPLE.filter((p) => samePool(me.gender, p.gender));
  const [queue, setQueue] = useState(eligible.map((p) => p.id));
  const [match, setMatch] = useState(null);
  const pos = useRef(new Animated.ValueXY()).current;
  const flingRef = useRef();

  const top = queue[0] != null ? PEOPLE.find((p) => p.id === queue[0]) : null;
  const next = queue[1] != null ? PEOPLE.find((p) => p.id === queue[1]) : null;

  const onLike = (id) => {
    const p = PEOPLE.find((x) => x.id === id);
    const score = compatibility(me.fp, p.fp);
    setConvos((cs) => cs.find((c) => c.id === id) ? cs
      : [{ id, last: 'You matched — say hi 👋', unread: 1, thread: [] }, ...cs]);
    if (score >= 80) setMatch({ ...p, score });
  };
  const fling = (dir) => {
    Animated.timing(pos, { toValue: { x: dir * 520, y: -40 }, duration: 280, useNativeDriver: false })
      .start(() => {
        pos.setValue({ x: 0, y: 0 });
        setQueue((q) => { const [tid, ...rest] = q; if (dir > 0) onLike(tid); return rest; });
      });
  };
  flingRef.current = fling;

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
    onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > 120) flingRef.current(1);
      else if (g.dx < -120) flingRef.current(-1);
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  })).current;

  const rotate = pos.x.interpolate({ inputRange: [-220, 0, 220], outputRange: ['-12deg', '0deg', '12deg'] });
  const likeOp = pos.x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOp = pos.x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1 }}>
      <View style={st.topbar}><Text style={st.title}>Discover</Text>
        <IconBtn onPress={() => alert('Filters: budget, area, schedule')}>⚙</IconBtn></View>

      <View style={{ flex: 1, margin: 18, marginTop: 6 }}>
        {!top && <EmptyDeck me={me} onReset={() => setQueue(eligible.map((p) => p.id))} />}
        {next && <CardFace p={next} me={me} style={{ transform: [{ scale: 0.96 }, { translateY: 10 }] }} />}
        {top && (
          <Animated.View {...pan.panHandlers}
            style={[StyleSheet.absoluteFill, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}>
            <CardFace p={top} me={me} likeOp={likeOp} nopeOp={nopeOp} />
          </Animated.View>
        )}
      </View>

      {top && (
        <View style={st.actions}>
          <Pressable style={[st.act, { borderColor: C.line }]} onPress={() => flingRef.current(-1)}>
            <Text style={{ fontSize: 24, color: C.skip }}>✕</Text></Pressable>
          <Pressable style={[st.act, st.actSm]} onPress={() => { alert('Super liked ★'); flingRef.current(1); }}>
            <Text style={{ fontSize: 19, color: C.gold }}>★</Text></Pressable>
          <Pressable style={[st.act, { borderColor: C.line }]} onPress={() => flingRef.current(1)}>
            <Text style={{ fontSize: 24, color: C.like }}>♥</Text></Pressable>
        </View>
      )}

      {match && <MatchModal me={me} p={match}
        onMessage={() => { setMatch(null); nav.go('chat', { id: match.id }); }}
        onClose={() => setMatch(null)} />}
    </View>
  );
}

function CardFace({ p, me, likeOp, nopeOp, style }) {
  const score = compatibility(me.fp, p.fp);
  return (
    <View style={[st.card, style]}>
      <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={st.cardShade} />
      {p.verified && <View style={st.badge}><Text style={{ fontSize: 11, fontWeight: '700', color: '#241c08' }}>✓ Verified</Text></View>}
      <View style={st.ringWrap}><Ring score={score} /></View>
      {likeOp && <Animated.View style={[st.stamp, st.stampLike, { opacity: likeOp }]}><Text style={[st.stampTxt, { color: C.like }]}>LIKE</Text></Animated.View>}
      {nopeOp && <Animated.View style={[st.stamp, st.stampNope, { opacity: nopeOp }]}><Text style={[st.stampTxt, { color: C.skip }]}>NOPE</Text></Animated.View>}
      <View style={st.cardMeta}>
        <Text style={{ fontFamily: SERIF, fontSize: 25, color: '#f6f1e2', fontWeight: '600' }}>{p.name}, {p.age}</Text>
        <Text style={{ color: '#ece6d4', fontSize: 13.5, marginTop: 2 }}>📍 {p.area} · {p.budget}</Text>
        <Text style={{ color: '#ece6d4', fontSize: 12.5, lineHeight: 17, marginTop: 8, opacity: 0.92 }}>{p.blurb}</Text>
        <View style={st.vibes}>
          {p.vibes.map((v) => <View key={v} style={st.vibe}><Text style={{ color: '#f6f1e2', fontSize: 11.5 }}>{v}</Text></View>)}
        </View>
      </View>
    </View>
  );
}

function EmptyDeck({ me, onReset }) {
  const empty = PEOPLE.filter((p) => samePool(me.gender, p.gender)).length === 0;
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Text style={{ fontSize: 34 }}>{empty ? '🛡️' : '🏡'}</Text>
      <Display style={{ fontSize: 21, marginTop: 8 }}>{empty ? 'Your pool is private' : 'All caught up'}</Display>
      <Sub style={{ textAlign: 'center', marginTop: 6 }}>
        {empty
          ? `For safety, you're only matched within the ${pool(me.gender)} pool. No one to show here yet in this demo.`
          : 'New verified flatmates join daily. Check back soon.'}
      </Sub>
      {!empty && <View style={{ marginTop: 16 }}><Btn kind="ghost" title="Reset deck" onPress={onReset} /></View>}
    </View>
  );
}

function MatchModal({ me, p, onMessage, onClose }) {
  return (
    <View style={st.modalWrap}>
      <View style={st.matchCard}>
        <Eyebrow>You both said yes</Eyebrow>
        <Text style={{ fontFamily: SERIF, fontSize: 30, color: C.greenDeep, fontWeight: '600', marginTop: 6 }}>It's a match!</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 16 }}>
          <Avatar init={me.init} size={72} />
          <View style={{ marginLeft: -16 }}><Avatar photo={p.photo} size={72} /></View>
        </View>
        <Sub style={{ textAlign: 'center', marginBottom: 16 }}>You and {p.name} are {p.score}% compatible.</Sub>
        <Btn title="Send a message" onPress={onMessage} />
        <View style={{ height: 9 }} />
        <Btn kind="ghost" title="Keep swiping" onPress={onClose} />
      </View>
    </View>
  );
}

/* ---------- Browse grid ---------- */
function Browse({ me }) {
  const data = PEOPLE.filter((p) => samePool(me.gender, p.gender))
    .map((p) => ({ ...p, score: compatibility(me.fp, p.fp) }))
    .sort((a, b) => b.score - a.score);
  return (
    <View style={{ flex: 1 }}>
      <View style={st.topbar}><Text style={st.title}>Browse</Text>
        <IconBtn onPress={() => alert('Sorted by compatibility')}>⇅</IconBtn></View>
      {data.length === 0
        ? <View style={{ padding: 40 }}><Sub style={{ textAlign: 'center' }}>No one in your pool to show in this demo.</Sub></View>
        : <FlatList data={data} keyExtractor={(p) => String(p.id)} numColumns={2}
            contentContainerStyle={{ padding: 16 }} columnWrapperStyle={{ gap: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item: p }) => (
              <Pressable style={st.gcard} onPress={() => alert(`${p.name} · ${p.score}% match · ${p.budget}`)}>
                <View>
                  <Image source={{ uri: p.photo }} style={{ height: 120, width: '100%' }} resizeMode="cover" />
                  <View style={st.gpct}><Text style={{ color: C.cream, fontSize: 11, fontWeight: '700' }}>{p.score}%</Text></View>
                </View>
                <View style={{ padding: 11 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14 }}>{p.name}, {p.age}</Text>
                  <Text style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{p.area.split(',')[0]}</Text>
                  <Text style={{ fontSize: 12, color: C.greenAccent, fontWeight: '600', marginTop: 6 }}>{p.budget}/mo</Text>
                </View>
              </Pressable>
            )} />}
    </View>
  );
}

/* ---------- Matches list ---------- */
function Matches({ nav, convos }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={st.topbar}><Text style={st.title}>Messages</Text></View>
      {convos.length === 0
        ? <View style={{ padding: 40 }}><Sub style={{ textAlign: 'center' }}>Like someone in Discover to start chatting.</Sub></View>
        : <ScrollView>
            {convos.map((c) => {
              const p = PEOPLE.find((x) => x.id === c.id);
              return (
                <Pressable key={c.id} style={st.crow} onPress={() => nav.go('chat', { id: c.id })}>
                  <Avatar photo={p?.photo} init={p?.init} />
                  <View style={{ flex: 1, marginLeft: 13 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15 }}>{p?.name}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{c.last}</Text>
                  </View>
                  {!!c.unread && <View style={st.unread}><Text style={{ color: C.cream, fontSize: 11, fontWeight: '700' }}>{c.unread}</Text></View>}
                </Pressable>
              );
            })}
          </ScrollView>}
    </View>
  );
}

/* ---------- Activity / premium ---------- */
function Activity() {
  return (
    <View style={{ flex: 1 }}>
      <View style={st.topbar}><Text style={st.title}>Activity</Text></View>
      <ScrollView>
        <View style={st.promo}>
          <Eyebrow color={C.gold}>KASA PLUS</Eyebrow>
          <Text style={{ fontFamily: SERIF, fontSize: 26, color: C.cream, fontWeight: '600', marginTop: 4 }}>Move in faster</Text>
          <View style={{ height: 8 }} />
          {['See everyone who liked you', 'Unlimited messages — free gets 5', 'Priority placement in discovery', 'AI compatibility breakdowns']
            .map((b) => (
              <View key={b} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <Text style={{ color: C.gold, fontWeight: '700', marginRight: 9 }}>✓</Text>
                <Text style={{ color: '#ece6d4', fontSize: 13.5 }}>{b}</Text>
              </View>
            ))}
          <View style={{ height: 14 }} />
          <Btn kind="gold" title="Upgrade — coming soon" onPress={() => alert('Billing is not enabled in this demo')} />
        </View>
        <Display style={{ fontSize: 20, marginHorizontal: 22, marginTop: 18 }}>Recent activity</Display>
        <View style={st.empty}>
          <Text style={{ fontSize: 30, opacity: 0.5 }}>🔔</Text>
          <Display style={{ fontSize: 17, marginTop: 8 }}>No activity yet</Display>
          <Tiny style={{ marginTop: 4, textAlign: 'center' }}>Keep swiping — likes and visits show up here.</Tiny>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Profile + Fingerprint radar ---------- */
function Profile({ nav, me }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ alignItems: 'center', paddingTop: TOP + 6 }}>
        <Avatar init={me.init} size={96} />
        <Text style={{ fontFamily: SERIF, fontSize: 24, fontWeight: '600', marginTop: 12 }}>{me.name}, {me.age}</Text>
        <View style={st.pverify}>
          <Pill label="✓ Email" tone="ok" /><Pill label="✓ Phone" tone="ok" />
          <Pill label="★ Verified" tone="gold" /><Pill label="Free plan" />
        </View>
        {me.orientation ? <View style={{ marginTop: 8 }}><Pill label={me.orientation} /></View> : null}
      </View>

      <View style={st.section}>
        <Text style={st.stitle}>Compatibility Fingerprint</Text>
        <Tiny style={{ marginBottom: 8 }}>The six dimensions Kasamates matches you on.</Tiny>
        <View style={{ alignItems: 'center' }}><Radar fp={me.fp} /></View>
        <View style={st.legend}>
          {AXES.map((a) => (
            <View key={a} style={st.legendRow}>
              <Text style={{ color: C.inkSoft, fontSize: 12.5 }}>{a}</Text>
              <Text style={{ color: C.ink, fontSize: 12.5, fontWeight: '700' }}>{Math.round((me.fp[a] ?? 0.5) * 100)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={st.section}>
        <Text style={st.stitle}>Lifestyle</Text>
        <View style={[st.chips, { marginTop: 8 }]}>
          {[`${me.budget}/mo`, 'Vegetarian', 'Non-smoker', 'Early riser', 'Tidy', `${pool(me.gender)} pool`].map((t) => (
            <View key={t} style={st.ltag}><Text style={{ fontSize: 12 }}>{t}</Text></View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 22 }}>
        <Btn title="Edit profile" onPress={() => alert('Editing re-submits the onboarding steps')} />
        <View style={{ height: 10 }} />
        <Btn kind="ghost" title="Sign out" onPress={() => nav.reset('splash')} />
      </View>
    </ScrollView>
  );
}

/* ============================ CHAT ============================ */
export function Chat({ nav, convos, setConvos }) {
  const id = nav.params.id;
  const p = PEOPLE.find((x) => x.id === id);
  const conv = convos.find((c) => c.id === id) || { thread: [] };
  const [draft, setDraft] = useState('');
  const listRef = useRef();

  const send = () => {
    const v = draft.trim(); if (!v) return;
    setConvos((cs) => cs.map((c) => c.id === id ? { ...c, last: v, thread: [...c.thread, ['me', v]] } : c));
    setDraft('');
    setTimeout(() => {
      const replies = ['Haha sounds good!', 'When works for a viewing?', 'Same page on that 🙂', 'Cool — sending the address.'];
      const r = replies[Math.floor(Math.random() * replies.length)];
      setConvos((cs) => cs.map((c) => c.id === id ? { ...c, last: r, thread: [...c.thread, ['them', r]] } : c));
    }, 900);
  };

  return (
    <KeyboardAvoidingView style={st.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.topbar, { borderBottomWidth: 1, borderColor: C.line, paddingBottom: 12 }]}>
        <IconBtn onPress={() => nav.back()}>‹</IconBtn>
        <Text style={[st.title, { fontSize: 18 }]}>{p?.name}</Text><View style={{ width: 38 }} />
      </View>
      <ScrollView ref={listRef} style={{ flex: 1, backgroundColor: C.cream }}
        contentContainerStyle={{ padding: 16, gap: 9 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}>
        {conv.thread.length === 0 && <Tiny style={{ textAlign: 'center', marginTop: 20 }}>Say hello 👋</Tiny>}
        {conv.thread.map((m, i) => (
          <View key={i} style={[st.bub, m[0] === 'me' ? st.bubMe : st.bubThem]}>
            <Text style={{ color: m[0] === 'me' ? C.cream : C.ink, fontSize: 14 }}>{m[1]}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={st.composer}>
        <Field placeholder="Message…" value={draft} onChangeText={setDraft}
          style={[st.field, { flex: 1, borderRadius: 999, marginTop: 0 }]} onSubmitEditing={send} />
        <Pressable style={st.send} onPress={send}><Text style={{ color: C.cream, fontSize: 18 }}>➤</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ============================ styles ============================ */
const st = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.cream },
  topbar: { paddingTop: TOP, paddingHorizontal: 22, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: SERIF, fontSize: 24, fontWeight: '600', color: C.ink },
  lbl: { fontSize: 12.5, fontWeight: '600', color: C.inkSoft, marginTop: 4 },
  field: { backgroundColor: C.hi, borderWidth: 1, borderColor: C.lineStrong, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  hr: { flex: 1, height: 1, backgroundColor: C.line },
  progressTrack: { height: 5, backgroundColor: C.line, borderRadius: 999, marginHorizontal: 22 },
  progressFill: { height: 5, backgroundColor: C.green, borderRadius: 999 },

  // nav
  nav: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingVertical: 8, paddingBottom: 22 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },

  // deck
  card: { ...StyleSheet.absoluteFillObject, borderRadius: 26, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, ...shadow(8) },
  cardShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', borderRadius: 26 },
  cardMeta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, backgroundColor: 'rgba(15,19,11,0.55)' },
  vibes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  vibe: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ringWrap: { position: 'absolute', top: 14, right: 14 },
  badge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(184,146,62,0.92)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, zIndex: 3 },
  stamp: { position: 'absolute', top: 36, borderWidth: 3, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, zIndex: 4 },
  stampLike: { left: 22, transform: [{ rotate: '-12deg' }] },
  stampNope: { right: 22, transform: [{ rotate: '12deg' }] },
  stampTxt: { fontFamily: SERIF, fontWeight: '700', fontSize: 28, letterSpacing: 2 },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 14 },
  act: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, backgroundColor: C.hi, alignItems: 'center', justifyContent: 'center', ...shadow(4) },
  actSm: { width: 50, height: 50, borderRadius: 25, borderColor: C.line },

  // match modal
  modalWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,17,9,0.74)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  matchCard: { backgroundColor: C.cream, borderRadius: 26, padding: 26, alignItems: 'stretch', width: '100%', maxWidth: 330 },

  // browse
  gcard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, overflow: 'hidden' },
  gpct: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(22,30,17,0.78)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },

  // matches
  crow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 13, borderBottomWidth: 1, borderColor: C.line },
  unread: { backgroundColor: C.green, borderRadius: 999, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },

  // activity
  promo: { backgroundColor: C.green, borderRadius: 22, margin: 22, padding: 20 },
  empty: { margin: 22, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 18, padding: 34, alignItems: 'center' },

  // profile
  pverify: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 10 },
  section: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 20, margin: 22, marginTop: 14, padding: 18 },
  stitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  legendRow: { width: '50%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingRight: 14 },
  ltag: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },

  // chat
  bub: { maxWidth: '78%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16 },
  bubThem: { alignSelf: 'flex-start', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 5 },
  bubMe: { alignSelf: 'flex-end', backgroundColor: C.green, borderBottomRightRadius: 5 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderTopWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
});
