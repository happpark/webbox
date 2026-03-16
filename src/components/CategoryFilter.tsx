'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/data';

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('category') ?? 'all';

  function setCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory('all')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          active === 'all'
            ? 'bg-violet-600 text-white'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => setCategory(cat.slug)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            active === cat.slug
              ? 'bg-violet-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  );
}
