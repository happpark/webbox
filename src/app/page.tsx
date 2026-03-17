'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { App } from '@/types';
import { CATEGORIES } from '@/lib/data';

const MAX_SCALE = 1.9;
const INFLUENCE_RADIUS = 120;

function rand(seed: number, slot: number): number {
  const x = Math.sin(seed * 9301 + slot * 49297 + 1) * 233280;
  return x - Math.floor(x);
}

// Very subtle per-icon variation — no rotation, just tiny drift & opacity
function iconMeta(i: number) {
  const dy      = (rand(i, 0) - 0.5) * 10;   // ±5px
  const opacity = 0.45 + rand(i, 1) * 0.55;  // 0.45–1.0
  return { dy, opacity };
}

export default function HomePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const iconRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const rafRef   = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetch('/api/apps?sort=trending')
      .then((r) => r.json())
      .then((data) => {
        const list: App[] = data.apps ?? [];
        if (list.length === 0) return;
        const tiled: App[] = [];
        while (tiled.length < 100) tiled.push(...list);
        setApps(tiled.slice(0, 100));
      });
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setMouse(mouseRef.current);
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    mouseRef.current = null;
    setMouse(null);
  }, []);

  function getHoverScale(i: number): number {
    if (!mouse) return 1;
    const el = iconRefs.current[i];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
    if (dist > INFLUENCE_RADIUS) return 1;
    const t = 1 - dist / INFLUENCE_RADIUS;
    const eased = t * t * (3 - 2 * t);
    return 1 + eased * (MAX_SCALE - 1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-14 pt-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 px-4 py-2 rounded-full text-sm mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          The App Store for Vibe-Coded Web Apps
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
          Discover apps built
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            by makers like you
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          A curated gallery of web apps created with vibe coding. Find tools,
          games, and creative projects built by indie developers worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            See All Apps <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Submit Your App
          </Link>
        </div>
      </div>

      {/* Icon Grid */}
      <div
        className="relative select-none"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {/* Vignette — fades out edges cleanly */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: [
              'linear-gradient(to bottom, rgba(9,9,11,0.6) 0%, transparent 18%, transparent 82%, rgba(9,9,11,0.8) 100%)',
              'linear-gradient(to right,  rgba(9,9,11,0.7) 0%, transparent 12%, transparent 88%, rgba(9,9,11,0.7) 100%)',
            ].join(', '),
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 64px)',
            gap: 8,
            justifyContent: 'center',
            padding: '16px 0 24px',
            overflow: 'hidden',
          }}
        >
          {apps.length === 0
            ? Array(100).fill(0).map((_, i) => {
                const { dy, opacity } = iconMeta(i);
                return (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/5 animate-pulse"
                    style={{ width: 64, height: 64, transform: `translateY(${dy}px)`, opacity }}
                  />
                );
              })
            : apps.map((app, i) => {
                const { dy, opacity } = iconMeta(i);
                const hoverScale = getHoverScale(i);
                const isActive   = hoverScale > 1.05;
                const category   = CATEGORIES.find((c) => c.id === app.category_id);

                return (
                  <a
                    key={`${app.id}-${i}`}
                    ref={(el) => { iconRefs.current[i] = el; }}
                    href={`/apps/${app.id}`}
                    title={app.name}
                    className="relative group"
                    style={{
                      width: 64,
                      height: 64,
                      transform: `translateY(${dy}px) scale(${hoverScale})`,
                      opacity: isActive ? 1 : opacity,
                      transition: hoverScale === 1
                        ? 'transform 0.4s cubic-bezier(0.34,1.4,0.64,1), opacity 0.25s ease'
                        : 'transform 0.07s ease-out, opacity 0.07s ease',
                      zIndex: isActive ? 20 : 1,
                    }}
                  >
                    <div
                      className="w-full h-full rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center"
                      style={{
                        boxShadow: isActive
                          ? `0 6px 24px rgba(139,92,246,${Math.min((hoverScale - 1) * 0.6, 0.5).toFixed(2)})`
                          : undefined,
                      }}
                    >
                      {app.screenshot_url ? (
                        <img src={app.screenshot_url} alt={app.name} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <span className="text-2xl">{category?.icon ?? '📦'}</span>
                      )}
                    </div>
                    {/* Tooltip */}
                    <div
                      className="absolute bottom-full left-1/2 mb-2 px-2 py-1 bg-gray-900/95 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-30 shadow-xl"
                      style={{
                        transform: 'translateX(-50%)',
                        opacity: isActive ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {app.name}
                    </div>
                  </a>
                );
              })}
        </div>
      </div>
    </div>
  );
}
