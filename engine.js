/**
 * PalmLock Core Engine
 * Origin-free relational touchpad, peak-displacement gesture recognition,
 * haptic feedback, tactile amount verifier, and duress PIN handling.
 */
class PalmLockEngine {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.onPinSuccess = options.onPinSuccess || (() => {});
    this.onDuressAlert = options.onDuressAlert || (() => {});
    this.onAmountVerified = options.onAmountVerified || (() => {});

    // Configuration (prototype only: in production the PIN is verified server-side)
    this.TARGET_PIN_LENGTH = options.pinLength || 4;
    this.REAL_PIN = options.realPin || "1234";
    this.DURESS_PIN = options.duressPin || "4321";
    this.CURRENT_AMOUNT = options.amount || 520;

    // Internal buffers & pointers
    this.enteredPIN = "";
    this.origin = null;
    this.currentStroke = [];
    this.lastTapTimestamp = 0;
    this.lastTapPosition = null;
    this.doubleTapTimer = null;

    this.init();
  }

  // 8-way sector resolution (45° sectors, Y increasing downward)
  // 0°=Right, 90°=Down, 180°=Left, 270°=Up
  resolveDirection(angle) {
    if (angle >= 247.5 && angle < 292.5) return '1'; // UP
    if (angle >= 337.5 || angle < 22.5)  return '2'; // RIGHT
    if (angle >= 67.5 && angle < 112.5)  return '3'; // DOWN
    if (angle >= 157.5 && angle < 202.5) return '4'; // LEFT
    if (angle >= 292.5 && angle < 337.5) return '5'; // UP-RIGHT
    if (angle >= 22.5 && angle < 67.5)   return '6'; // DOWN-RIGHT
    if (angle >= 112.5 && angle < 157.5) return '7'; // DOWN-LEFT
    if (angle >= 202.5 && angle < 247.5) return '8'; // UP-LEFT
    return '0';
  }

  // Pre-transaction tactile amount verification (two-finger tap)
  vibrateAmount(amount) {
    const hundreds = Math.floor((amount % 1000) / 100);
    const tens = Math.floor((amount % 100) / 10);
    const pattern = [];

    // Long rumbles for hundreds (200ms on, 100ms off)
    for (let i = 0; i < hundreds; i++) pattern.push(200, 100);
    pattern.push(500); // 500ms separation interval
    // Short ticks for tens (50ms on, 50ms off)
    for (let i = 0; i < tens; i++) pattern.push(50, 50);

    if (navigator.vibrate) navigator.vibrate(pattern);
    this.onAmountVerified(amount);
  }

  // Digit evaluator & duress dispatch
  handleDigit(digit) {
    this.enteredPIN += digit;
    console.log(`[PalmLock] Digit registered: ${digit} | Buffer: ${this.enteredPIN.length}/${this.TARGET_PIN_LENGTH}`);

    if (this.enteredPIN.length === this.TARGET_PIN_LENGTH) {
      // Double-tick confirmation to palm
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

      const finalPIN = this.enteredPIN;
      this.enteredPIN = ""; // Flush buffer immediately

      if (finalPIN === this.REAL_PIN) {
        this.onPinSuccess({
          status: "SUCCESS",
          message: `₹${this.CURRENT_AMOUNT} Transferred Successfully`
        });
      } else if (finalPIN === this.DURESS_PIN) {
        // Mock distress beacon (real dispatch is future scope)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => this.onDuressAlert({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => this.onDuressAlert({ lat: "MOCK_LAT", lng: "MOCK_LNG" }),
            { enableHighAccuracy: false, timeout: 2000 }
          );
        } else {
          this.onDuressAlert({ status: "DISPATCHED_FALLBACK" });
        }

        // Decoy success screen
        this.onPinSuccess({
          status: "DURESS_DECOY",
          message: `₹${this.CURRENT_AMOUNT} Transferred Successfully`
        });
      } else {
        // Error buzz
        if (navigator.vibrate) navigator.vibrate(150);
        console.warn("[PalmLock] Invalid PIN stroke sequence.");
      }
    } else {
      // Single crisp feedback tick
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }

  // Input lifecycle & peak-displacement parser
  init() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();

      // Reject accidental palm or 3+ finger contact
      if (e.touches.length > 2) {
        this.origin = null;
        this.currentStroke = [];
        return;
      }

      // Two fingers = amount verifier
      if (e.touches.length === 2) {
        if (this.doubleTapTimer) {
          clearTimeout(this.doubleTapTimer);
          this.doubleTapTimer = null;
        }
        this.lastTapTimestamp = 0;
        this.lastTapPosition = null;

        this.vibrateAmount(this.CURRENT_AMOUNT);
        this.origin = null;
        this.currentStroke = [];
        return;
      }

      // Single finger contact
      const touch = e.touches[0];
      this.origin = { x: touch.clientX, y: touch.clientY };
      this.currentStroke = [{ x: touch.clientX, y: touch.clientY }];
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.origin || e.touches.length !== 1) return;
      const touch = e.touches[0];
      this.currentStroke.push({ x: touch.clientX, y: touch.clientY });
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!this.origin || this.currentStroke.length === 0) return;

      const now = performance.now();

      // Peak Euclidean displacement from dynamic origin
      let maxDist = 0;
      let peakPoint = this.currentStroke[this.currentStroke.length - 1];

      for (let i = 0; i < this.currentStroke.length; i++) {
        const d = Math.hypot(this.currentStroke[i].x - this.origin.x, this.currentStroke[i].y - this.origin.y);
        if (d > maxDist) {
          maxDist = d;
          peakPoint = this.currentStroke[i];
        }
      }

      // PATH 1: stationary tap (peak displacement < 30px)
      if (maxDist < 30) {
        const isCloseToLastTap = this.lastTapPosition &&
          Math.hypot(this.origin.x - this.lastTapPosition.x, this.origin.y - this.lastTapPosition.y) < 40;
        const isQuickSuccession = (now - this.lastTapTimestamp) < 300;

        // Always clear pending single-tap timer
        if (this.doubleTapTimer) {
          clearTimeout(this.doubleTapTimer);
          this.doubleTapTimer = null;
        }

        if (isCloseToLastTap && isQuickSuccession) {
          // Double-tap resolved ('9')
          this.lastTapTimestamp = 0;
          this.lastTapPosition = null;
          this.handleDigit('9');
        } else {
          // First tap armed; wait 300ms for a possible second tap
          this.lastTapTimestamp = now;
          this.lastTapPosition = { x: this.origin.x, y: this.origin.y };

          this.doubleTapTimer = setTimeout(() => {
            this.handleDigit('0');
            this.lastTapTimestamp = 0;
            this.lastTapPosition = null;
            this.doubleTapTimer = null;
          }, 300);
        }
      }
      // PATH 2: directional swipe (peak displacement >= 30px)
      else {
        if (this.doubleTapTimer) {
          clearTimeout(this.doubleTapTimer);
          this.doubleTapTimer = null;
        }
        this.lastTapTimestamp = 0;
        this.lastTapPosition = null;

        const dx = peakPoint.x - this.origin.x;
        const dy = peakPoint.y - this.origin.y;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const digit = this.resolveDirection(angle);
        this.handleDigit(digit);
      }

      // Reset stroke tracking
      this.origin = null;
      this.currentStroke = [];
    }, { passive: false });
  }

  reset() {
    this.enteredPIN = "";
    this.origin = null;
    this.currentStroke = [];
    if (this.doubleTapTimer) {
      clearTimeout(this.doubleTapTimer);
      this.doubleTapTimer = null;
    }
  }
}
