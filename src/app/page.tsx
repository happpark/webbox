'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { App } from '@/types';
import { CATEGORIES } from '@/lib/data';

const ICON_SIZE = 64; // base px
const ICON_GAP = 10;
const MAX_SCALE = 1.9;
const INFLUENCE_RADIUS = 140;

export default function HomePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const iconRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetch('/api/apps?sort=trending')
      .then((r) => r.json())
      .then((data) => {
        const list: App[] = data.apps ?? [];
        // tile to fill at least 80 icons
        if (list.length > 0 && list.length < 80) {
          const tiled: App[] = [];
          while (tiled.length < 80) tiled.push(...list);
          setApps(tiled.slice(0, 80));
        } else {
          setApps(list);
        }
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

  function getScale(i: number): number {
    if (!mouse) return 1;
    const el = iconRefs.current[i];
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
    if (dist > INFLUENCE_RADIUS) return 1;
    const t = 1 - dist / INFLUENCE_RADIUS;
    // ease: cubic
    const eased = t * t * (3 - 2 * t);
    return 1 + eased * (MAX_SCALE - 1);
  }

  const displayApps = apps.length === 0 ? null : apps;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12 pt-8">
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
            Browse All Apps <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Submit Your App
          </Link>
        </div>
      </div>

      {/* Icon Mosaic */}
      <div
        className="relative select-none"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {/* Vignette overlay — only edges, not center */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-3xl"
          style={{
            background:
              'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, rgba(9,9,11,0.85) 100%)',
          }}
        />

        <div
          className="flex flex-wrap justify-center"
          style={{ gap: ICON_GAP }}
        >
          {displayApps === null
            ? Array(80)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/5 animate-pulse shrink-0"
                    style={{ width: ICON_SIZE, height: ICON_SIZE }}
                  />
                ))
            : displayApps.map((app, i) => {
                const scale = getScale(i);
                const category = CATEGORIES.find((c) => c.id === app.category_id);
                return (
                  <a
                    key={`${app.id}-${i}`}
                    ref={(el) => { iconRefs.current[i] = el; }}
                    href={`/apps/${app.id}`}
                    title={app.name}
                    className="relative shrink-0 group"
                    style={{
                      width: ICON_SIZE,
                      height: ICON_SIZE,
                      transform: `scale(${scale})`,
                      transition: scale === 1
                        ? 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
                        : 'transform 0.08s ease-out',
                      zIndex: scale > 1 ? 20 : 1,
                    }}
                  >
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center"
                      style={{
                        boxShadow: scale > 1.3
                          ? `0 0 ${Math.round((scale - 1) * 30)}px rgba(139,92,246,${((scale - 1) * 0.5).toFixed(2)})`
                          : undefined,
                      }}
                    >
                      {app.screenshot_url ? (
                        <img
                          src={app.screenshot_url}
                          alt={app.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-2xl">{category?.icon ?? '📦'}</span>
                      )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900/95 border border-white/10 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
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
