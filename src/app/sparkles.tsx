"use client";

import { useEffect, useRef } from "react";
import { pointer } from "./pointer";

const POOL_SIZE = 2500;
const FADE_START = 60;
const FADE_END = 20;

interface Particle {
  px: number;
  py: number;
  vx: number;
  vy: number;
  opacity: number;
  alive: boolean;
  phase: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  scale: number;
  scalePhase: number;
}

const GRID_COLS = 10;
const GRID_ROWS = 8;
const gridCounts = new Int32Array(GRID_COLS * GRID_ROWS);

function buildDensityGrid(particles: Particle[], w: number, h: number) {
  gridCounts.fill(0);
  const cellW = w / GRID_COLS;
  const cellH = h / GRID_ROWS;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.alive) continue;
    const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor(p.px / cellW)));
    const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor(p.py / cellH)));
    gridCounts[row * GRID_COLS + col]++;
  }
}

function pickSparseCell(): number {
  // Weight cells inversely by density — emptier cells are more likely
  let totalWeight = 0;
  const total = GRID_COLS * GRID_ROWS;
  for (let i = 0; i < total; i++) {
    totalWeight += 1 / (1 + gridCounts[i]);
  }
  let r = Math.random() * totalWeight;
  for (let i = 0; i < total; i++) {
    r -= 1 / (1 + gridCounts[i]);
    if (r <= 0) return i;
  }
  return total - 1;
}

function spawnParticle(
  p: Particle,
  mx: number,
  my: number,
  hasMouse: boolean,
  w: number,
  h: number
) {
  const cellW = w / GRID_COLS;
  const cellH = h / GRID_ROWS;
  const cell = pickSparseCell();
  const col = cell % GRID_COLS;
  const row = Math.floor(cell / GRID_COLS);
  p.px = (col + Math.random()) * cellW;
  p.py = (row + Math.random()) * cellH;

  // If cursor is active, try to avoid spawning right on top of it
  if (hasMouse) {
    const dx = p.px - mx;
    const dy = p.py - my;
    if (Math.sqrt(dx * dx + dy * dy) < 80) {
      // Nudge to a different sparse cell
      const cell2 = pickSparseCell();
      const col2 = cell2 % GRID_COLS;
      const row2 = Math.floor(cell2 / GRID_COLS);
      p.px = (col2 + Math.random()) * cellW;
      p.py = (row2 + Math.random()) * cellH;
    }
  }
  p.vx = 0;
  p.vy = 0;
  p.opacity = 0;
  p.alive = true;
  p.phase = Math.random() * Math.PI * 2;
  p.speed = 0.3 + Math.random() * 0.7;
  p.rotation = Math.random() * Math.PI * 2;
  p.rotSpeed = (Math.random() - 0.5) * 0.02;
  p.scale = 0.5 + Math.random() * 0.6;
  p.scalePhase = Math.random() * Math.PI * 2;
}

function createParticle(): Particle {
  return {
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    opacity: 0,
    alive: false,
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.7,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    scale: 0.5 + Math.random() * 0.6,
    scalePhase: Math.random() * Math.PI * 2,
  };
}

export const Sparkles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  if (particlesRef.current.length === 0) {
    for (let i = 0; i < POOL_SIZE; i++) {
      particlesRef.current[i] = createParticle();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initial spawn
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(devicePixelRatio, devicePixelRatio);

    for (let i = 0; i < POOL_SIZE; i++) {
      const p = particlesRef.current[i];
      p.px = Math.random() * w;
      p.py = Math.random() * h;
      p.opacity = Math.random() * 0.6 + 0.2;
      p.alive = true;
    }

    // Read CSS color
    const style = getComputedStyle(document.documentElement);
    let color = style.getPropertyValue("--foreground").trim();

    // Handle resize
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    window.addEventListener("resize", onResize);

    // Watch for color scheme changes
    const colorQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onColorChange = () => {
      color = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim();
    };
    colorQuery.addEventListener("change", onColorChange);

    // Parse hex color to r,g,b for alpha compositing
    function hexToRgb(hex: string): [number, number, number] {
      hex = hex.replace("#", "");
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
      ];
    }

    let animId: number;
    let time = 0;

    const animate = () => {
      time += 0.016;
      const mx = pointer.x;
      const my = pointer.y;
      const isDirectInteraction = pointer.active && (pointer.source === "touch" || pointer.source === "mouse");
      const isLinger = pointer.active && pointer.source === "linger";
      const isGyro = pointer.active && pointer.source === "gyro";
      const w = window.innerWidth;
      const h = window.innerHeight;
      const [r, g, b] = hexToRgb(color);

      ctx.clearRect(0, 0, w, h);

      buildDensityGrid(particlesRef.current, w, h);

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = particlesRef.current[i];

        if (!p.alive) {
          spawnParticle(p, mx, my, isDirectInteraction, w, h);
        }

        if (isDirectInteraction) {
          // Touch/mouse: vortex attraction + fade
          const dx = mx - p.px;
          const dy = my - p.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.1) {
            const angle = Math.atan2(dy, dx);
            const falloff = Math.max(0, 1 - dist / 1200);
            const strength = 0.04 * falloff;
            p.vx += Math.cos(angle) * strength;
            p.vy += Math.sin(angle) * strength;
          }

          if (dist < FADE_START) {
            const fadeRange = FADE_START - FADE_END;
            const t = Math.max(0, (dist - FADE_END) / fadeRange);
            p.opacity = t;
          } else {
            p.opacity = Math.min(1, p.opacity + 0.02);
          }

          if (dist < FADE_END) {
            p.alive = false;
            continue;
          }
        } else if (isLinger) {
          // Linger: soft drift toward decaying touch point
          const dx = mx - p.px;
          const dy = my - p.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.1) {
            const angle = Math.atan2(dy, dx);
            const falloff = Math.max(0, 1 - dist / 1200);
            p.vx += Math.cos(angle) * 0.012 * falloff;
            p.vy += Math.sin(angle) * 0.012 * falloff;
          }
          p.opacity = Math.min(1, p.opacity + 0.01);
        } else if (isGyro) {
          // Gyro: ambient drift — add tilt to sine/cosine velocities
          const t = time * p.speed + p.phase;
          const targetVx = Math.sin(t) * 0.1 + pointer.tiltX * 0.15;
          const targetVy = Math.cos(t * 0.7) * 0.12 + pointer.tiltY * 0.15;
          p.vx += (targetVx - p.vx) * 0.01;
          p.vy += (targetVy - p.vy) * 0.01;
          p.opacity = Math.min(1, p.opacity + 0.01);
        } else {
          // Idle: gentle float
          const t = time * p.speed + p.phase;
          const targetVx = Math.sin(t) * 0.1;
          const targetVy = Math.cos(t * 0.7) * 0.12;
          p.vx += (targetVx - p.vx) * 0.01;
          p.vy += (targetVy - p.vy) * 0.01;
          p.opacity = Math.min(1, p.opacity + 0.01);
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        p.px += p.vx;
        p.py += p.vy;

        if (p.px < -20) p.px = w + 20;
        if (p.px > w + 20) p.px = -20;
        if (p.py < -20) p.py = h + 20;
        if (p.py > h + 20) p.py = -20;

        // Draw particle as a wobbly blob
        if (p.opacity > 0.01) {
          const s = p.scale * (0.8 + 0.2 * Math.sin(time * 0.5 + p.scalePhase));
          // Wobble the shape based on time and particle phase
          const wobX = 1 + 0.3 * Math.sin(time * 3 + p.phase);
          const wobY = 1 + 0.3 * Math.cos(time * 2.5 + p.phase * 1.3);
          const radius = 2.5 * s;

          ctx.save();
          ctx.translate(p.px, p.py);
          ctx.rotate(p.rotation + time * p.rotSpeed * 2);
          ctx.scale(wobX, wobY);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      colorQuery.removeEventListener("change", onColorChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default Sparkles;
