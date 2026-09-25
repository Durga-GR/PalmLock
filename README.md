# PalmLock
**A zero-vision, touch-and-haptic payment authentication protocol for visually impaired users.**

🌐 **Live Demo:** [https://palmlockn.netlify.app/](https://palmlockn.netlify.app/) *(Open in Chrome on Android)*

Digital payments have replaced cash, but flat touchscreens have no tactile keys, so visually impaired users struggle to find and press the right digits. Standard screen readers (TalkBack/VoiceOver) also read each digit aloud, exposing the PIN to everyone nearby. PalmLock lets a user authenticate a payment through touch and vibration alone — no fixed keypad, zero spoken PIN output, and a screen that stays completely black during entry.

**Tracks:** Cybersecurity (Secure-by-Design, Threat Detection) · FinTech (Privacy-First Finance)  
**Theme:** AI for Inclusive Digital Transformation  

---

### How It Works

There is no fixed keypad. The first touch on the screen sets a dynamic origin point, and the direction of a short swipe from that point selects the digit:

| Gesture | Digit | Sector Angle |
| :--- | :---: | :--- |
| **Swipe Up** | `1` | 270° |
| **Swipe Right** | `2` | 0° / 360° |
| **Swipe Down** | `3` | 90° |
| **Swipe Left** | `4` | 180° |
| **Swipe Up-Right** | `5` | 315° (Diagonal) |
| **Swipe Down-Right** | `6` | 45° (Diagonal) |
| **Swipe Down-Left** | `7` | 135° (Diagonal) |
| **Swipe Up-Left** | `8` | 225° (Diagonal) |
| **Single stationary tap** (movement < 30px) | `0` | In place |
| **Double-tap** in the same spot (within 300ms) | `9` | In place |

The angle of each swipe is measured from the point of **peak displacement** (the furthest point the finger travels from the origin), not the point where the finger lifts off — this filters out hand tremor and trailing finger roll-back, which matters for blindfolded, elderly, or unsteady input.

The screen stays pure black (`#000000`) the entire time, so it looks switched off to anyone nearby. All PIN feedback is delivered through vibration, never sound.

* **Demo PIN:** `1-2-3-4` (Up → Right → Down → Left — a clean clockwise circle)
* **Duress PIN:** `4-3-2-1` (Left → Down → Right → Up — the counter-clockwise reverse circle)

---

### Features

1. **Zero-Luminance Stealth Mode** — The screen renders pure black during authentication, preventing shoulder-surfing and overhead camera capture.
2. **Origin-Free 8-Directional Touchpad** — No fixed button positions; works identically on any phone, any screen size.
3. **Tactile Currency Verifier & Merchant Check** — A two-finger tap replays the bill amount as a vibration pattern (long pulses per hundred, short pulses per ten) and softly confirms the verified merchant name, so the user can verify the transaction before entering their PIN.
4. **Silent Duress Protocol** — Entering the reverse PIN shows an identical "success" screen to satisfy anyone coercing the user, while the real transaction is halted and an emergency alert (with a live Google Maps location link) is sent to a configured Discord webhook. *(Note: While our abstract slated server dispatch as future scope, this was fully implemented during the hackathon sprint).*
5. **Shake-to-Clear** — A firm shake wipes a partially-entered, mistaken PIN, giving the user an error-recovery option without hunting for an on-screen backspace key.
6. **Inactivity Nuke** — If the screen goes untouched for 10 seconds mid-entry (e.g. the user is distracted or the phone is grabbed), the partial PIN is automatically wiped.
7. **Flip-Face-Down Abort** — Turning the phone face-down cancels an in-progress transaction immediately, for situations where the user needs to stop right away (e.g. a merchant disputes the amount, or they feel unsafe).
8. **On-Device Cryptographic Proof of Assent** — Upon authorization, the browser's native WebCrypto API (`crypto.subtle`) generates a real SHA-256 digital signature token on the receipt, binding timestamp, merchant ID, and amount into an immutable personal audit record.

---

### Setup & Deployment

1. Open `index.html` and paste your own Discord webhook URL into the `DISCORD_WEBHOOK_URL` constant near the top of the `<script>` block. *(Never commit a real webhook URL to a public repository — leave the placeholder in git and only add the real one in your deployed copy).*
2. Deploy the file as a static site (Vercel, Netlify, GitHub Pages, etc.). **HTTPS is required** — `navigator.vibrate` and `navigator.geolocation` are both blocked over plain HTTP on mobile browsers.
3. Open the deployed link in Chrome on Android.

---

### Testing Checklist

Run through these in order on a real Android phone, over HTTPS:
1. Screen is pure black on load.
2. Each of the 8 swipe directions registers (feel a single tick each time).
3. A stationary tap registers as `0` after a short pause.
4. A quick double-tap in the same spot registers as `9` immediately.
5. Two-finger tap plays the amount vibration pattern (5 rumbles, 2 ticks = ₹520) and speaks the merchant confirmation.
6. Swiping `1-2-3-4` shows the green success screen with the on-device SHA-256 proof token.
7. Swiping `4-3-2-1` shows the same green screen, and the Discord webhook fires with a live Google Maps link.
8. Mid-entry, shaking the phone clears the buffer (long buzz, then digits restart from 1).
9. Mid-entry, leaving the phone untouched for 10+ seconds triggers the double-thump inactivity wipe.
10. Mid-entry, flipping the phone face-down triggers the 3-burst cancel buzz immediately.

---

### Platform Notes & Limitations

* **Android-First Architecture:** Built Android-first. iOS Safari does not implement the W3C Vibration API (`navigator.vibrate`), so haptic feedback will not fire on an iPhone. A production release would compile via a native wrapper (e.g., Capacitor) to bridge into Apple's CoreHaptics framework.
* **Residual Attack Vector:** The black screen prevents visual and camera capture of the PIN itself, but does not hide the physical hand motion. An attacker with a direct line of sight to the hand could theoretically observe swipe directions. However, because the gesture requires under 35px of physical travel from a dynamic origin, the hand can be shielded inside a pocket or under a table edge — something impossible with a fixed numeric keypad.
* **Prototype Scope:** PIN verification happens client-side for demonstration purposes only. In production, the bank or payment processor would verify the credential server-side; this prototype never transmits raw credentials.
* **Duress Alert Delivery:** The Discord webhook is a functional stand-in for an emergency dispatch pipeline (SMS to family, integration with local authorities), demonstrating zero-latency outbound telemetry without paid gateway overhead.

---

### Tech Stack

Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3. Zero build step, zero external dependencies, zero backend servers. Uses the W3C Vibration API, Geolocation API, Touch Events API, WebCrypto API (`crypto.subtle`), and DeviceMotionEvent / DeviceOrientationEvent.
