"use client";

import { useEffect, useRef, useState } from "react";

const POOL_SIZE = 900;
const FADE_START = 60;
const FADE_END = 20;


interface ParticleState {
  px: number;
  py: number;
  vx: number;
  vy: number;
  opacity: number;
  alive: boolean;
  phase: number;
  speed: number;
}

function spawnParticle(
  p: ParticleState,
  mx: number,
  my: number,
  hasMouse: boolean,
  w: number,
  h: number
) {
  // Spawn randomly across screen, but far enough from cursor
  if (hasMouse) {
    for (let attempt = 0; attempt < 10; attempt++) {
      p.px = Math.random() * w;
      p.py = Math.random() * h;
      const dx = p.px - mx;
      const dy = p.py - my;
      if (Math.sqrt(dx * dx + dy * dy) > 150) break;
    }
  } else {
    p.px = Math.random() * w;
    p.py = Math.random() * h;
  }
  p.vx = 0;
  p.vy = 0;
  p.opacity = 0;
  p.alive = true;
  p.phase = Math.random() * Math.PI * 2;
  p.speed = 0.3 + Math.random() * 0.7;
}

export const Sparkles = () => {
  const mouseRef = useRef({ x: -1, y: -1 });
  const particlesRef = useRef<ParticleState[]>([]);
  const elRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize particle pool once
  if (particlesRef.current.length === 0) {
    for (let i = 0; i < POOL_SIZE; i++) {
      particlesRef.current[i] = {
        px: 0,
        py: 0,
        vx: 0,
        vy: 0,
        opacity: 0,
        alive: false,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
      };
    }
  }

  useEffect(() => {
    setMounted(true);

    // Initial spawn across screen
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = particlesRef.current[i];
      p.px = Math.random() * w;
      p.py = Math.random() * h;
      p.opacity = Math.random() * 0.6 + 0.2;
      p.alive = true;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseRef.current.x = -1;
      mouseRef.current.y = -1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );
    };
  }, []);

  useEffect(() => {
    let animId: number;
    let time = 0;

    const animate = () => {
      time += 0.016;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const hasMouse = mx >= 0 && my >= 0;
      const w = window.innerWidth;
      const h = window.innerHeight;

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = particlesRef.current[i];
        const el = elRefs.current[i];
        if (!el) continue;

        // Respawn dead particles immediately
        if (!p.alive) {
          spawnParticle(p, mx, my, hasMouse, w, h);
        }

        if (hasMouse) {
          // Flow toward cursor
          const dx = mx - p.px;
          const dy = my - p.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.1) {
            const angle = Math.atan2(dy, dx);
            const falloff = Math.max(0, 1 - dist / 1200);
            const strength = 0.08 * falloff;
            p.vx += Math.cos(angle) * strength;
            p.vy += Math.sin(angle) * strength;
          }

          // Fade based on distance to cursor
          if (dist < FADE_START) {
            const fadeRange = FADE_START - FADE_END;
            const t = Math.max(0, (dist - FADE_END) / fadeRange);
            p.opacity = t;
          } else {
            // Fade in gradually
            p.opacity = Math.min(1, p.opacity + 0.02);
          }

          // Kill if too close
          if (dist < FADE_END) {
            p.alive = false;
            el.style.opacity = "0";
            continue;
          }
        } else {
          // No cursor: gentle ambient drift
          const t = time * p.speed + p.phase;
          const targetVx = Math.sin(t) * 0.1;
          const targetVy = Math.cos(t * 0.7) * 0.12;
          p.vx += (targetVx - p.vx) * 0.01;
          p.vy += (targetVy - p.vy) * 0.01;

          // Fade in
          p.opacity = Math.min(1, p.opacity + 0.01);
        }

        // Damping
        p.vx *= 0.97;
        p.vy *= 0.97;

        // Update position
        p.px += p.vx;
        p.py += p.vy;

        // Wrap around edges so particles don't fly off forever
        if (p.px < -20) p.px = w + 20;
        if (p.px > w + 20) p.px = -20;
        if (p.py < -20) p.py = h + 20;
        if (p.py > h + 20) p.py = -20;

        // Update DOM
        el.style.translate = `${p.px}px ${p.py}px`;
        el.style.opacity = String(p.opacity);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!mounted) return <div className="fixed inset-0 -z-10" />;

  return (
    <div className="fixed inset-0 -z-10">
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            elRefs.current[i] = el;
          }}
          className="absolute top-0 left-0 w-0.5 h-2 bg-foreground rounded-full animate-sparkle"
          style={{
            opacity: 0,
            animationDuration: `${Math.random() * 3 + 10}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Sparkles;
