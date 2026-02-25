import React, { useState } from 'react';
import { Sun, ShieldAlert, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';

const Navigation = ({ activeView, setView, toggleMobileMenu, isMobileMenuOpen, session }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'modules', label: 'Therapy Modules' },
    { id: 'chat', label: 'SoulSpark AI' },
    { id: 'journal', label: 'Journal' },
    { id: 'dashboard', label: 'My Wellness' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    setView('home');
  };

  return (
    <nav className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-200 to-orange-100 rounded-full flex items-center justify-center">
              <Sun className="text-stone-700 w-6 h-6" />
            </div>
            <span className="font-serif text-2xl text-stone-800 tracking-tight font-medium">SoulSpark</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeView === item.id ? 'text-green-800 border-b-2 border-green-800' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="h-6 w-px bg-stone-200 mx-2" />

            {/* User Profile Dropdown */}
            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-stone-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-50 flex items-center justify-center text-xs font-bold uppercase">
                    {session.user.email[0]}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-stone-50 mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Logged in as</p>
                      <p className="text-xs text-stone-800 truncate font-medium">{session.user.email}</p>
                    </div>
                    <button 
                      onClick={() => { setView('dashboard'); setIsProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" /> Profile Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setView('auth')} className="py-2 px-4 text-sm">
                Sign Up
              </Button>
            )}

            <Button variant="crisis" onClick={() => setView('crisis')} className="py-2 px-4 text-sm ml-2">
              <ShieldAlert className="w-4 h-4" />
              Get Help
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="text-stone-600">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-2">
          {session && (
            <div className="px-3 py-3 bg-stone-50 rounded-xl mb-4">
              <p className="text-xs text-stone-500">{session.user.email}</p>
            </div>
          )}
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); toggleMobileMenu(); }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:bg-stone-50"
            >
              {item.label}
            </button>
          ))}
          {session ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => { setView('auth'); toggleMobileMenu(); }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-green-800"
            >
              Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;