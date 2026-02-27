import React, { useMemo } from 'react';
import { Sun, ShieldAlert, Menu, X, User, LogOut, Sparkles, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';

const Navigation = ({ activeView, setView, toggleMobileMenu, isMobileMenuOpen, session }) => {
  
  // DYNAMIC NAVIGATION: Different links for logged-in vs logged-out users
  const loggedOutNav = [
    { id: 'home', label: 'Home' },
    { id: 'modules', label: 'Therapy Modules' },
    { id: 'about', label: 'Our Mission' }
  ];

  const loggedInNav = [
    { id: 'home', label: 'Home' },
    { id: 'dashboard', label: 'My Wellness' },
    { id: 'chat', label: 'SoulSpark AI' },
    { id: 'journal', label: 'Journal' },
    { id: 'modules', label: 'Workshops' }
  ];

  const navItems = session ? loggedInNav : loggedOutNav;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  // --- BULLETPROOF PREMIUM CHECK ---
  const isPremium = useMemo(() => {
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    return tier === 'premium' || premiumBool === true;
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-stone-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO */}
          <div 
            className="flex items-center gap-2 cursor-pointer z-50 shrink-0" 
            onClick={() => {
              setView(session ? 'dashboard' : 'home');
              if (isMobileMenuOpen) toggleMobileMenu();
            }} 
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-200 to-teal-100 dark:from-emerald-600 dark:to-teal-800 rounded-full flex items-center justify-center transition-colors shadow-sm">
              <Sun className="text-stone-700 dark:text-zinc-100 w-6 h-6" />
            </div>
            <span className="font-serif text-2xl text-stone-800 dark:text-zinc-100 tracking-tight font-medium transition-colors">
              SoulSpark
            </span>
          </div>

          {/* DESKTOP NAV (Hidden on Tablet/Mobile: lg:flex) */}
          <div className="hidden lg:flex space-x-6 items-center">
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

            {/* AVATAR & UPGRADE BUTTONS */}
            {session ? (
              <div className="flex items-center gap-4">
                
                {/* DYNAMIC PRO BADGE OR UPGRADE BUTTON (Desktop) */}
                {isPremium ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800/50 cursor-default select-none">
                    <Crown className="w-3.5 h-3.5" /> PRO
                  </div>
                ) : (
                  <button 
                    onClick={() => setView('pricing')}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 text-xs font-bold uppercase tracking-widest hover:scale-105 hover:shadow-md transition-all shadow-sm"
                  >
                    Upgrade <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}

                <Link 
                  to="/profile" 
                  title="Account Settings"
                  className="w-9 h-9 rounded-full bg-stone-800 dark:bg-zinc-800 text-white flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-emerald-500 transition-all overflow-hidden shadow-sm shrink-0"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </Link>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setView('auth')} className="py-2 px-4 text-sm bg-white dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors">
                Sign Up
              </Button>
            )}

            <Button variant="crisis" onClick={() => setView('crisis')} className="py-2 px-4 text-sm ml-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors border-0 shrink-0">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          </div>

          {/* TABLET/MOBILE NAV CONTROLS */}
          <div className="lg:hidden flex items-center gap-3">
            
            {/* MOBILE PRO BADGE (Shows next to crisis button on mobile if premium) */}
            {session && isPremium && (
              <div className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800/50">
                PRO
              </div>
            )}

            <Button variant="crisis" onClick={() => { setView('crisis'); if(isMobileMenuOpen) toggleMobileMenu(); }} className="py-2 px-3 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-0 flex sm:hidden">
              <ShieldAlert className="w-4 h-4" />
            </Button>
            
            <Button variant="crisis" onClick={() => { setView('crisis'); if(isMobileMenuOpen) toggleMobileMenu(); }} className="py-2 px-4 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-0 hidden sm:flex shrink-0">
              <ShieldAlert className="w-4 h-4 mr-2" /> Get Help
            </Button>

            <button onClick={toggleMobileMenu} className="p-2 text-stone-600 dark:text-zinc-300 transition-colors z-50">
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 shadow-2xl transition-colors duration-300 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-4 py-6 space-y-3">
            
            {session && (
              <div className="px-4 py-3 bg-stone-50 dark:bg-zinc-900 rounded-2xl mb-6 transition-colors flex justify-between items-center">
                <div>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 mb-1">Signed in as</p>
                  <p className="font-semibold text-stone-800 dark:text-zinc-200 truncate">{user.email}</p>
                </div>
                {/* PRO BADGE IN MOBILE MENU HEADER */}
                {isPremium && (
                  <div className="flex items-center gap-1 p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); toggleMobileMenu(); }}
                  className={`block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-colors ${
                    activeView === item.id 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' 
                      : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-4 pb-2">
              <div className="h-px w-full bg-stone-100 dark:bg-zinc-800 transition-colors" />
            </div>

            {session ? (
              <div className="space-y-2">
                
                {/* DYNAMIC UPGRADE BUTTON (Mobile) */}
                {!isPremium && (
                  <button
                    onClick={() => { setView('pricing'); toggleMobileMenu(); }}
                    className="w-full mt-1 text-left px-4 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 flex items-center justify-between transition-colors shadow-sm"
                  >
                    Upgrade to Pro <Sparkles className="w-5 h-5" />
                  </button>
                )}

                <Link
                  to="/profile"
                  onClick={toggleMobileMenu}
                  className="w-full px-4 py-3.5 rounded-xl text-base font-medium text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-3"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-zinc-700 flex items-center justify-center"><User className="w-4 h-4" /></div>
                  )}
                  Account Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setView('auth'); toggleMobileMenu(); }}
                className="w-full text-left px-4 py-4 rounded-xl text-base font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center"
              >
                Sign Up / Log In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;