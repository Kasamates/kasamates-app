import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon, Line, Text as SvgText } from 'react-native-svg';
import { C, SERIF, shadow } from './theme';
import { AXES } from './data';

export const Eyebrow = ({ children, color = C.gold }) => (
  <Text style={[s.eyebrow, { color }]}>{children}</Text>
);
export const Display = ({ children, style }) => (
  <Text style={[s.display, style]}>{children}</Text>
);
export const Sub = ({ children, style }) => <Text style={[s.sub, style]}>{children}</Text>;
export const Tiny = ({ children, style }) => <Text style={[s.tiny, style]}>{children}</Text>;

export function Btn({ title, onPress, kind = 'primary', disabled }) {
  const bg = kind === 'gold' ? C.gold : kind === 'ghost' ? 'transparent' : C.green;
  const fg = kind === 'gold' ? '#241c08' : kind === 'ghost' ? C.ink : C.cream;
  return (
    <Pressable onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [s.btn, {
        backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
        borderWidth: kind === 'ghost' ? 1 : 0, borderColor: C.lineStrong,
      }]}>
      <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Field(props) {
  return <TextInput placeholderTextColor={C.muted} style={s.field} {...props} />;
}

export function Chip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress}
      style={[s.chip, on && { backgroundColor: C.green, borderColor: C.green }]}>
      <Text style={{ fontSize: 13, color: on ? C.cream : C.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone }) {
  const map = {
    ok: { color: C.like, borderColor: 'rgba(60,90,46,0.3)', backgroundColor: C.surface },
    gold: { color: '#7a5d18', borderColor: 'rgba(184,146,62,0.4)', backgroundColor: 'rgba(184,146,62,0.10)' },
  };
  const t = map[tone] || { color: C.inkSoft, borderColor: C.line, backgroundColor: C.surface };
  return (
    <View style={[s.pill, { borderColor: t.borderColor, backgroundColor: t.backgroundColor }]}>
      <Text style={{ fontSize: 12, color: t.color }}>{label}</Text>
    </View>
  );
}

export function Avatar({ photo, init, size = 52 }) {
  return photo
    ? <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: C.greenAccent }}>
        <View style={StyleSheet.absoluteFill}>
          <RNImage uri={photo} />
        </View>
      </View>
    : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.greenAccent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: SERIF, color: C.cream, fontSize: size * 0.4 }}>{init}</Text>
      </View>;
}

// tiny image helper (avoids importing Image everywhere)
import { Image } from 'react-native';
function RNImage({ uri }) {
  return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
}

export function IconBtn({ children, onPress }) {
  return (
    <Pressable onPress={onPress} style={s.iconBtn}>
      <Text style={{ fontSize: 18, color: C.ink }}>{children}</Text>
    </Pressable>
  );
}

// ---- SVG compatibility ring ----
export function Ring({ score, size = 50 }) {
  const r = (size - 10) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - score / 100);
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} fill="rgba(15,19,11,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth={4} />
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#cde0b6" strokeWidth={4} strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
        rotation={-90} originX={cx} originY={cy} />
      <SvgText x={cx} y={cy + 4} fontSize={13} fontWeight="700" fill="#fff" textAnchor="middle">
        {String(score)}
      </SvgText>
    </Svg>
  );
}

// ---- SVG Fingerprint radar (the signature element) ----
export function Radar({ fp, size = 168 }) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 28, n = AXES.length;
  const ang = (i) => (-Math.PI / 2) + (i * 2 * Math.PI / n);
  const on = (i, rad) => [cx + Math.cos(ang(i)) * rad, cy + Math.sin(ang(i)) * rad];
  const polyStr = (rad, fn) => AXES.map((a, i) => on(i, fn ? fn(a) : rad).join(',')).join(' ');

  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((g, k) => (
        <Polygon key={k} points={polyStr(R * g)} fill="none" stroke="rgba(27,31,20,0.12)" strokeWidth={1} />
      ))}
      {AXES.map((a, i) => {
        const [x, y] = on(i, R);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(27,31,20,0.12)" />;
      })}
      <Polygon points={polyStr(0, (a) => R * (fp[a] ?? 0.5))}
        fill="rgba(46,56,35,0.18)" stroke={C.green} strokeWidth={2} strokeLinejoin="round" />
      {AXES.map((a, i) => {
        const [x, y] = on(i, R * (fp[a] ?? 0.5));
        return <Circle key={'d' + i} cx={x} cy={y} r={3} fill={C.green} />;
      })}
      {AXES.map((a, i) => {
        const [x, y] = on(i, R + 16);
        return <SvgText key={'t' + i} x={x} y={y + 4} fontSize={10.5} fontWeight="600"
          fill={C.inkSoft} textAnchor="middle">{a}</SvgText>;
      })}
    </Svg>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  display: { fontFamily: SERIF, fontSize: 30, color: C.ink, fontWeight: '600' },
  sub: { color: C.inkSoft, fontSize: 15, lineHeight: 21 },
  tiny: { fontSize: 12.5, color: C.muted },
  btn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  field: {
    backgroundColor: C.hi, borderWidth: 1, borderColor: C.lineStrong, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.ink, marginTop: 6,
  },
  chip: {
    borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.surface,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9,
  },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
});

export { shadow };
