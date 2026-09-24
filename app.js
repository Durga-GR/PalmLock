// DOM orchestrator & viewport management
const canvas = document.getElementById('stealthCanvas');
const resultCard = document.getElementById('resultCard');
const resultMessage = document.getElementById('resultMessage');
const resetBtn = document.getElementById('resetBtn');

// Keep canvas sized to the viewport
function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', fitCanvas);
fitCanvas();

// Instantiate engine
const engine = new PalmLockEngine(canvas, {
  amount: 520,
  realPin: "1234",   // Up -> Right -> Down -> Left
  duressPin: "4321", // Left -> Down -> Right -> Up
  onPinSuccess: (res) => {
    canvas.style.display = 'none';
    resultMessage.innerText = res.message;
    resultCard.style.display = 'flex';
  },
  onDuressAlert: (coords) => {
    console.warn("[MOCK DURESS BEACON]", coords);
  },
  onAmountVerified: (amt) => {
    console.log(`[PalmLock] Verified amount tactilely: ₹${amt}`);
  }
});

// Reset for next demonstration
resetBtn.addEventListener('click', () => {
  engine.reset();
  resultCard.style.display = 'none';
  canvas.style.display = 'block';
});
