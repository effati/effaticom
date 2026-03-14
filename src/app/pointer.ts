function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export const pointer = {
  x: -1,
  y: -1,
  active: false,
  source: "none" as "mouse" | "touch" | "gyro" | "linger" | "none",
  tiltX: 0,
  tiltY: 0,
  gyroAvailable: false,
};

let listening = false;
let lingerAnim: number | null = null;

function onMouseMove(e: MouseEvent) {
  if (pointer.source === "touch") return;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
  pointer.source = "mouse";
}

function onMouseLeave() {
  if (pointer.source !== "mouse") return;
  pointer.active = false;
  pointer.x = -1;
  pointer.y = -1;
  pointer.source = pointer.gyroAvailable ? "gyro" : "none";
}

function onTouchStart(e: TouchEvent) {
  stopLinger();
  const t = e.touches[0];
  if (!t) return;
  pointer.x = t.clientX;
  pointer.y = t.clientY;
  pointer.active = true;
  pointer.source = "touch";
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0];
  if (!t) return;
  pointer.x = t.clientX;
  pointer.y = t.clientY;
}

function stopLinger() {
  if (lingerAnim !== null) {
    cancelAnimationFrame(lingerAnim);
    lingerAnim = null;
  }
}

function startLinger() {
  stopLinger();
  const startX = pointer.x;
  const startY = pointer.y;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const duration = 3000;
  const startTime = performance.now();

  pointer.source = "linger";
  pointer.active = true;

  const decay = (now: number) => {
    if (pointer.source !== "linger") {
      lingerAnim = null;
      return;
    }
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = 1 - (1 - t) * (1 - t);
    pointer.x = startX + (centerX - startX) * ease;
    pointer.y = startY + (centerY - startY) * ease;

    if (t >= 1) {
      pointer.active = false;
      pointer.x = -1;
      pointer.y = -1;
      pointer.source = "none";
      lingerAnim = null;
    } else {
      lingerAnim = requestAnimationFrame(decay);
    }
  };
  lingerAnim = requestAnimationFrame(decay);
}

function onTouchEnd() {
  if (pointer.gyroAvailable) {
    pointer.source = "gyro";
    pointer.active = true;
  } else {
    startLinger();
  }
}

function onDeviceOrientation(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return;

  pointer.gyroAvailable = true;

  pointer.tiltX = clamp(e.gamma / 30, -1, 1);
  pointer.tiltY = clamp((e.beta - 45) / 30, -1, 1);

  if (pointer.source !== "touch" && pointer.source !== "mouse") {
    stopLinger();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    pointer.x = vw / 2 + pointer.tiltX * vw * 0.4;
    pointer.y = vh / 2 + pointer.tiltY * vh * 0.4;
    pointer.active = true;
    pointer.source = "gyro";
  }
}

export function initPointer() {
  if (listening) return;
  listening = true;
  window.addEventListener("mousemove", onMouseMove);
  document.documentElement.addEventListener("mouseleave", onMouseLeave);
  window.addEventListener("touchstart", onTouchStart);
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("deviceorientation", onDeviceOrientation);
}

export function cleanupPointer() {
  if (!listening) return;
  listening = false;
  stopLinger();
  window.removeEventListener("mousemove", onMouseMove);
  document.documentElement.removeEventListener("mouseleave", onMouseLeave);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
  window.removeEventListener("deviceorientation", onDeviceOrientation);
}
