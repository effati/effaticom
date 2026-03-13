"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import HeadViewer from "./head";

function useGeoGuessrRank() {
  const [rank, setRank] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/geoguessr")
      .then((r) => r.json())
      .then((data) => {
        if (data.divisionName && data.rating) {
          setRank(`${data.divisionName} (${data.rating})`);
        }
      })
      .catch(() => {});
  }, []);
  return rank;
}

const LETTERS_1 = "Shayan".split("");
const LETTERS_2 = "Effati".split("");
const ALL_LETTERS = [...LETTERS_1, " ", ...LETTERS_2];

function WobblyText() {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const scalesRef = useRef<number[]>(ALL_LETTERS.map(() => 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onLeave = () => {
      mouseRef.current.x = -1;
      mouseRef.current.y = -1;
    };
    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    let animId: number;

    const animate = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const hasMouse = mx >= 0 && my >= 0;

      for (let i = 0; i < ALL_LETTERS.length; i++) {
        const el = letterRefs.current[i];
        if (!el) continue;

        let targetScale = 0;
        if (hasMouse) {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
          const influence = Math.max(0, 1 - dist / 200);
          targetScale = influence * 30;
        }

        scalesRef.current[i] += (targetScale - scalesRef.current[i]) * 0.08;
        const s = scalesRef.current[i];
        el.style.filter = s > 0.1 ? `url(#wobbly-${i})` : "none";
      }

      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex flex-col items-center select-none">
      <svg className="absolute w-0 h-0">
        <defs>
          {ALL_LETTERS.map((_, i) => (
            <filter key={i} id={`wobbly-${i}`}>
              <feTurbulence
                type="turbulence"
                baseFrequency="0.015 0.02"
                numOctaves={2}
                seed={i * 7}
                result="turbulence"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="turbulence"
                scale={0}
                xChannelSelector="R"
                yChannelSelector="G"
                ref={(el) => {
                  if (el) {
                    // Update scale in animation loop
                    const idx = i;
                    const update = () => {
                      const s = scalesRef.current[idx];
                      el.setAttribute("scale", String(s));
                      requestAnimationFrame(update);
                    };
                    requestAnimationFrame(update);
                  }
                }}
              />
            </filter>
          ))}
        </defs>
      </svg>
      <h1>
        {LETTERS_1.map((letter, i) => (
          <span
            key={i}
            ref={(el) => { letterRefs.current[i] = el; }}
            className="inline-block"
          >
            {letter}
          </span>
        ))}
      </h1>
      <h1>
        {LETTERS_2.map((letter, i) => {
          const idx = LETTERS_1.length + 1 + i;
          return (
            <span
              key={idx}
              ref={(el) => { letterRefs.current[idx] = el; }}
              className="inline-block"
            >
              {letter}
            </span>
          );
        })}
      </h1>
      <p className="text-location mt-2">Stockholm, Sweden</p>
    </div>
  );
}

function WobblyBorder({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const mouseRef = useRef({ x: -1, y: -1 });

  const buildPath = useCallback(
    (w: number, h: number, time: number, mx: number, my: number) => {
      const segments = 40;
      const baseAmp = 4;
      const freq = 0.08;
      const points: [number, number][] = [];

      // Walk around the rectangle perimeter and displace each point with sine waves
      const perimeter = 2 * (w + h);

      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const d = t * perimeter;
        let px: number, py: number, nx: number, ny: number;

        if (d < w) {
          // Top edge
          px = d;
          py = 0;
          nx = 0;
          ny = -1;
        } else if (d < w + h) {
          // Right edge
          px = w;
          py = d - w;
          nx = 1;
          ny = 0;
        } else if (d < 2 * w + h) {
          // Bottom edge
          px = w - (d - w - h);
          py = h;
          nx = 0;
          ny = 1;
        } else {
          // Left edge
          px = 0;
          py = h - (d - 2 * w - h);
          nx = -1;
          ny = 0;
        }

        // Base sine wobble
        let amp = baseAmp * Math.sin(d * freq + time * 2);

        // Cursor influence: if cursor is near this point, amplify the wobble outward
        if (mx >= 0 && my >= 0) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const worldX = rect.left + px;
            const worldY = rect.top + py;
            const dx = mx - worldX;
            const dy = my - worldY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influence = Math.max(0, 1 - dist / 200);
            amp += influence * 30 * Math.sin(d * 0.15 + time * 3);
          }
        }

        points.push([px + nx * amp, py + ny * amp]);
      }

      // Build smooth closed path using Catmull-Rom style midpoints
      // Start at midpoint between first and second point
      const mid0x = (points[0][0] + points[1][0]) / 2;
      const mid0y = (points[0][1] + points[1][1]) / 2;
      let pathD = `M ${mid0x} ${mid0y}`;
      for (let i = 1; i < points.length; i++) {
        const curr = points[i];
        const next = points[(i + 1) % points.length];
        const midX = (curr[0] + next[0]) / 2;
        const midY = (curr[1] + next[1]) / 2;
        pathD += ` Q ${curr[0]} ${curr[1]} ${midX} ${midY}`;
      }
      // Close smoothly back to start
      const last = points[0];
      pathD += ` Q ${last[0]} ${last[1]} ${mid0x} ${mid0y}`;
      return pathD;
    },
    []
  );

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
      const container = containerRef.current;
      const path = pathRef.current;
      const svg = svgRef.current;
      if (!container || !path || !svg) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const pad = 40;
      const w = container.offsetWidth + pad * 2;
      const h = container.offsetHeight + pad * 2;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.style.overflow = "visible";
      svg.setAttribute("viewBox", `${-pad} ${-pad} ${w} ${h}`);

      const d = buildPath(
        container.offsetWidth,
        container.offsetHeight,
        time,
        mouseRef.current.x,
        mouseRef.current.y
      );
      path.setAttribute("d", d);

      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [buildPath]);

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        className="absolute pointer-events-none -z-10"
        style={{ top: -40, left: -40, overflow: "visible" }}
      >
        <path
          ref={pathRef}
          fill="var(--background)"
          stroke="var(--foreground)"
          strokeWidth="4"
          opacity="1"
        />
      </svg>
      {children}
    </div>
  );
}

export const Main = () => {
  const geoRank = useGeoGuessrRank();

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-screen p-8 sm:p-20 overflow-x-hidden">
      <WobblyText />
      <div className="flex flex-col lg:flex-row items-center gap-6 mt-6">
        <WobblyBorder>
          <div className="flex flex-col gap-1 items-start p-8">
            <p className="text-bagel">Engineer at <a href="https://freda.com/" target="_blank" className="underline">Freda</a></p>
            <p className="text-bagel">Music producer with music on <a target="_blank" href="https://open.spotify.com/artist/3cE0oEYeqTYJCuoyqF6Kz2" className="underline">Spotify</a></p>
            <p className="text-bagel">Geoguessr ranked duels player{geoRank ? <>{" "}<a target="_blank" href="https://www.geoguessr.com/user/66d8d72d090048eaa472f4bf" className="underline">{geoRank}</a></> : ""}</p>
            <p className="text-bagel">Professional contact at <a target="_blank" href="https://www.linkedin.com/in/shayaneffati/" className="underline">LinkedIn</a></p>
            <p className="text-bagel">Uninstalled my <a target="_blank" href="https://www.instagram.com/tjajan/" className="underline">Instagram</a>, but my profile is there</p>
          </div>
        </WobblyBorder>
        <div className="w-[min(500px,90vw)] h-[min(500px,90vw)] shrink-0">
          <HeadViewer />
        </div>
      </div>
    </div>
  );
};
