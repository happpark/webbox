'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/data';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function SubmitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    url: '',
    screenshot_url: '',
    category_id: '',
    author_name: '',
    author_url: '',
    github_url: '',
    tags: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const { data } = await getSupabase().auth.getSession();
        if (data.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      }
      const res = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(form),
        headers,
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">App Submitted!</h1>
        <p className="text-gray-400 mb-8">
          Thanks for submitting your app. It will be reviewed and published shortly.
        </p>
        <button
          onClick={() => router.push('/browse')}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Browse Apps
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Submit Your App</h1>
        <p className="text-gray-400">
          Share your vibe-coded web app with the community. All submissions are
          reviewed before publishing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            App Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="My Awesome App"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Tagline <span className="text-red-400">*</span>
          </label>
          <input
            name="tagline"
            value={form.tagline}
            onChange={handleChange}
            required
            placeholder="One-line description of what your app does"
            maxLength={100}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">{form.tagline.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us more about your app — what it does, who it's for, and what makes it special."
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors resize-none"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            App URL <span className="text-red-400">*</span>
          </label>
          <input
            name="url"
            value={form.url}
            onChange={handleChange}
            required
            type="url"
            placeholder="https://myapp.com"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Screenshot URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Screenshot URL
          </label>
          <input
            name="screenshot_url"
            value={form.screenshot_url}
            onChange={handleChange}
            type="url"
            placeholder="https://i.imgur.com/yourscreenshot.png"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">A preview image for your app listing. Recommended size: 1280×720.</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white px-4 py-2.5 rounded-xl text-sm transition-colors appearance-none"
          >
            <option value="" className="bg-gray-900">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-gray-900">
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Tags
          </label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="AI, productivity, open-source"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">Comma-separated tags</p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-2">
          <p className="text-gray-500 text-sm mb-4">About you (optional)</p>
        </div>

        {/* Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Your Name
            </label>
            <input
              name="author_name"
              value={form.author_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Your Website / Twitter
            </label>
            <input
              name="author_url"
              value={form.author_url}
              onChange={handleChange}
              type="url"
              placeholder="https://twitter.com/yourusername"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            GitHub Repo
          </label>
          <input
            name="github_url"
            value={form.github_url}
            onChange={handleChange}
            type="url"
            placeholder="https://github.com/you/yourapp"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm transition-colors"
          />
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Something went wrong. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            'Submit App'
          )}
        </button>
      </form>
    </div>
  );
}
