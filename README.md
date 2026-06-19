# Kasamates — Expo Go demo

A runnable React Native (Expo) build of the KASA flatmate app, for sharing with
stakeholders through **Expo Go** — no app-store build, no backend. It reproduces
the full flow (auth → OTP → onboarding → swipe discover → match → chat → browse →
profile) with the **Compatibility Fingerprint** radar and the **matching engine
wired in live**: compatibility scores are computed on-device from each profile's
answers, and the **gender-segregated safety filter** is active (you only ever see
people in your own pool — change your gender in onboarding to watch the deck change).

Dependencies are deliberately tiny — `expo`, `react-native`, `react-native-svg`
— and navigation is hand-rolled, so it loads in whatever Expo Go version your
stakeholders have.

---

## Run it (your machine)

```bash
# 1. install
npm install

# 2. make versions match your installed Expo Go (important)
npx expo install --fix

# 3. start
npx expo start
```

A QR code appears in the terminal. On the phone:
- **iOS** — open the Camera, point at the QR, tap the banner (Expo Go opens it).
- **Android** — open **Expo Go** → *Scan QR code*.

The phone must be on the **same Wi-Fi** as your computer.

> If Expo Go says the project uses an unsupported SDK, your Expo Go is newer than
> the pinned SDK. Fix in one line: `npx expo install expo@latest && npx expo install --fix`,
> then `npx expo start` again.

### Alternative: start from a fresh template (most bullet-proof)
If `npm install` gives version trouble, create the project with the current SDK and
drop these files in:
```bash
npx create-expo-app@latest kasa-demo --template blank
cd kasa-demo
npx expo install react-native-svg
# copy App.js, index.js and the src/ folder from this zip in (overwrite App.js)
npx expo start
```

---

## Share with stakeholders (remote — they're not on your Wi-Fi)

Three options, easiest first:

**1. Expo Snack (zero install for them).**
Go to <https://snack.expo.dev>, create a project, and paste in `App.js` and the
`src/` files (Snack supports a file tree and `react-native-svg`). Snack gives a
**shareable URL and a QR** anyone can open in Expo Go instantly. Best for a quick
"here's the latest" link.

**2. Tunnel (live from your machine, any network).**
```bash
npx expo start --tunnel
```
Same QR, but routed over the internet — stakeholders can scan from anywhere while
your machine is running. Good for a live walkthrough.

**3. EAS Update (hosted, persistent link).** For a link that stays up without your
machine running:
```bash
npm i -g eas-cli
eas login
eas update:configure
eas update --branch preview --message "stakeholder demo"
```
This publishes the JS bundle to Expo's servers and prints a QR/link that opens in
Expo Go. Re-run `eas update` to push new versions to the same link.

---

## What stakeholders will see

- **Onboarding gender step drives matching.** Pick *Man* and the deck shows the
  men's pool; pick *Woman* and it shows women — the safety segregation is visible,
  not just claimed. *Non-binary / Prefer not to say* shows the "private pool"
  explanation (the product decision flagged in the matching write-up).
- **Live compatibility.** The % ring on each card and the Browse grid are computed
  from the six weighted Fingerprint axes against your onboarding answers — not
  hard-coded. A high score triggers the "It's a match!" sheet.
- **The radar** on your profile is the real SVG signature element.

This demo runs the interpretable, weight-based half of the matcher on-device. The
**Self-Organizing Map** half runs server-side in production (see the separate
`kasa-matching` module); the score shape is the same.

## Files
```
index.js        Expo entry
App.js          tiny navigator + shared state
src/theme.js    palette, serif, insets
src/data.js     mock profiles + compatibility engine + gender filter
src/ui.js       reusable components incl. SVG ring + fingerprint radar
src/screens.js  every screen (splash, auth, otp, onboarding, home tabs, chat)
```
