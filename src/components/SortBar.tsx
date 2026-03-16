'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const SORTS = [
  { label: 'Trending', value: 'trending' },
  { label: 'Most Voted', value: 'votes' },
  { label: 'Newest', value: 'new' },
];

export default function SortBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('sort') ?? 'trending';

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
      {SORTS.map((s) => (
        <button
          key={s.value}
          onClick={() => setSort(s.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            active === s.value
              ? 'bg-white/15 text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
