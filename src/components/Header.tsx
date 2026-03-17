'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Zap, Star, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white">Webbox</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-gray-400 hover:text-white transition-colors text-sm">
              Browse
            </Link>
            <Link href="/browse?sort=trending" className="text-gray-400 hover:text-white transition-colors text-sm">
              Trending
            </Link>
            <Link href="/browse?sort=new" className="text-gray-400 hover:text-white transition-colors text-sm">
              New
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/favorites"
              className="hidden md:inline-flex items-center gap-1.5 text-gray-400 hover:text-yellow-400 transition-colors text-sm"
            >
              <Star className="w-3.5 h-3.5" /> Favorites
            </Link>

            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name ?? 'User'}
                      className="w-7 h-7 rounded-full border border-white/20"
                    />
                  )}
                  <button
                    onClick={signOut}
                    className="hidden md:inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="hidden md:inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign in
                </button>
              )
            )}

            <Link
              href="/submit"
              className="hidden md:inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Submit App
            </Link>
            <button
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95">
          <div className="px-4 py-4 space-y-3">
            <Link href="/browse" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>Browse</Link>
            <Link href="/browse?sort=trending" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>Trending</Link>
            <Link href="/browse?sort=new" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>New</Link>
            <Link href="/favorites" className="flex items-center gap-1.5 text-gray-400 hover:text-yellow-400 text-sm" onClick={() => setMenuOpen(false)}>
              <Star className="w-3.5 h-3.5" /> Favorites
            </Link>
            {!loading && (
              user ? (
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              ) : (
                <button onClick={() => { signInWithGoogle(); setMenuOpen(false); }} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm">
                  <LogIn className="w-3.5 h-3.5" /> Sign in with Google
                </button>
              )
            )}
            <Link href="/submit" className="block bg-violet-600 text-white px-4 py-2 rounded-lg text-sm text-center" onClick={() => setMenuOpen(false)}>+ Submit App</Link>
          </div>
        </div>
      )}
    </header>
  );
}
