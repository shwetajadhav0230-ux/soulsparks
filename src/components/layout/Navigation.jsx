import React, { useState } from 'react';
import { Sun, ShieldAlert, Menu, X, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';

const Navigation = ({ activeView, setView, toggleMobileMenu, isMobileMenuOpen, session }) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'modules', label: 'Therapy Modules' },
    { id: 'chat', label: 'SoulSpark AI' },
    { id: 'journal', label: 'Journal' },
    { id: 'dashboard', label: 'My Wellness' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const initial = session?.user?.user_metadata?.full_name?.charAt(0).toUpperCase() || session?.user?.email?.[0].toUpperCase() || 'U';

  return (
    // Switched dark mode from stone-900 to a sleek zinc-950 true dark
    <nav className="sticky top-0 z-50 bg-stone-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-200 to-teal-100 dark:from-emerald-600 dark:to-teal-800 rounded-full flex items-center justify-center transition-colors">
              <Sun className="text-stone-700 dark:text-zinc-100 w-6 h-6" />
            </div>
            <span className="font-serif text-2xl text-stone-800 dark:text-zinc-100 tracking-tight font-medium transition-colors">
              SoulSpark
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeView === item.id 
                    ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400' 
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="h-6 w-px bg-stone-200 dark:bg-zinc-800 mx-2 transition-colors" />

            {/* AVATAR SYNC FIX */}
            {session ? (
              <Link 
                to="/profile" 
                title="Account Settings"
                className="w-9 h-9 rounded-full bg-stone-800 dark:bg-zinc-800 text-white flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-emerald-500 transition-all overflow-hidden shadow-sm"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </Link>
            ) : (
              <Button variant="secondary" onClick={() => setView('auth')} className="py-2 px-4 text-sm bg-white dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors">
                Sign Up
              </Button>
            )}

            <Button variant="crisis" onClick={() => setView('crisis')} className="py-2 px-4 text-sm ml-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors border-0">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-stone-600 dark:text-zinc-300 transition-colors">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 px-4 py-4 space-y-2 transition-colors">
          {session && (
            <div className="px-3 py-3 bg-stone-50 dark:bg-zinc-900 rounded-xl mb-4 transition-colors">
              <p className="text-xs text-stone-500 dark:text-zinc-400">{session.user.email}</p>
            </div>
          )}
          
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); toggleMobileMenu(); }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                activeView === item.id 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' 
                  : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-900'
              }`}
            >
              {item.label}
            </button>
          ))}

          {session && (
            <Link
              to="/profile"
              onClick={toggleMobileMenu}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
              Account Settings
            </Link>
          )}

          <div className="pt-2 pb-1">
            <div className="h-px w-full bg-stone-100 dark:bg-zinc-800 transition-colors" />
          </div>

          {session ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <button
              onClick={() => { setView('auth'); toggleMobileMenu(); }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              Sign Up / Log In
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;