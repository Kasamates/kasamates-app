import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './src/theme';
import { ME, SEED_CONVOS } from './src/data';
import { Splash, Auth, Otp, Onboarding, Home, Chat } from './src/screens';

export default function App() {
  // tiny stack navigator (avoids react-navigation's native deps for Expo Go)
  const [history, setHistory] = useState([{ name: 'splash', params: {} }]);
  const route = history[history.length - 1];
  const nav = {
    params: route.params,
    go: (name, params = {}) => setHistory((h) => [...h, { name, params }]),
    reset: (name, params = {}) => setHistory([{ name, params }]),
    back: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
  };

  // shared app state
  const [me, setMe] = useState({ ...ME });
  const [convos, setConvos] = useState(SEED_CONVOS);
  const shared = { nav, me, setMe, convos, setConvos };

  const Screen = {
    splash: Splash, auth: Auth, otp: Otp, onb: Onboarding, home: Home, chat: Chat,
  }[route.name] || Splash;

  return (
    <View style={styles.root}>
      <StatusBar style={route.name === 'splash' ? 'light' : 'dark'} />
      <Screen {...shared} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
});
