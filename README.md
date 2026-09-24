# PALMLOCK – Zero-Vision Relational Haptic Payment Protocol for the Visually Impaired

Zero-vision, haptic-only PIN entry prototype for visually impaired users.

## Files
- `index.html` – page structure
- `style.css` – styling (black stealth canvas, green result card)
- `engine.js` – gesture engine (peak displacement, 8 sectors, haptics, duress)
- `app.js` – wires the engine to the page

## Run locally
    npx serve .
Then open the link on an Android phone (same Wi-Fi), or deploy the folder to Vercel / Netlify for an HTTPS link.

## Test (Android Chrome)
- Two-finger tap: vibrates the amount (5 long + 2 short for Rs 520)
- Real PIN: Up, Right, Down, Left (1234) -> success screen
- Duress PIN: Left, Down, Right, Up (4321) -> same success screen, mock beacon in console

## Digit map
Tap 0 | Up 1 | Right 2 | Down 3 | Left 4 | Up-Right 5 | Down-Right 6 | Down-Left 7 | Up-Left 8 | Double-tap 9

## Notes
- Prototype only: PIN is hardcoded; in production the bank/server verifies it.
- Duress beacon is a mock (console log). Grant location permission before demo.
- navigator.vibrate works on Android Chrome only (not iOS).
- Serve over HTTPS for geolocation.
