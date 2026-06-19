import { Platform, StatusBar } from 'react-native';

// Sampled KASA palette (same values used across the Android app + HTML prototype)
export const C = {
  cream: '#F2EBD9', surface: '#F9F4E9', hi: '#FFFDF7',
  greenDeep: '#161E11', green: '#2E3823', greenAccent: '#46552F',
  ink: '#1B1F14', inkSoft: '#5B5C4E', muted: '#8A8775',
  line: 'rgba(27,31,20,0.10)', lineStrong: 'rgba(27,31,20,0.16)',
  like: '#3C5A2E', skip: '#9A5B43', gold: '#B8923E',
};

// No bundled fonts (keeps Expo Go setup zero-config); use the platform serif.
export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

// Manual top inset so we don't need react-native-safe-area-context.
export const TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 52;

export function shadow(e = 6) {
  return Platform.select({
    ios: {
      shadowColor: '#161E11', shadowOpacity: 0.18,
      shadowRadius: e * 1.6, shadowOffset: { width: 0, height: e * 0.6 },
    },
    android: { elevation: e },
    default: {},
  });
}
