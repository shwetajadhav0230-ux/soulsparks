import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Layout & UI (Eager-loaded for immediate paint)
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';

// Main Pages (Lazy-loaded for performance)
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Journal = lazy(() => import('./pages/Journal'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Modules = lazy(() => import('./pages/Modules'));
const Crisis = lazy(() => import('./pages/Crisis'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const Chatbot = lazy(() => import('./components/features/Chatbot'));

// Module Components
const CBTModule = lazy(() => import('./components/modules/CBT'));
const DBTModule = lazy(() => import('./components/modules/DBT'));
const ACTModule = lazy(() => import('./components/modules/ACT'));

/**
 * AppContent Wrapper
 * Revised with mobile-first Tailwind classes and sleek zinc-dark theme.
 */
const AppContent = () => {
  const [session, setSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsAuthLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session && location.pathname === '/auth') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  // Mobile-responsive loading screen
  if (isAuthLoading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const isCrisisMode = location.pathname === '/crisis';
  const isAuthView = location.pathname === '/auth';

  const setView = (view) => {
    if (view === 'home') navigate('/');
    else navigate(`/${view}`);
  };

  const currentPath = location.pathname.substring(1) || 'home';
  const activeNavView = currentPath.startsWith('modules') ? 'modules' : currentPath;

  return (
    // Base classes: flex-col, overflow-x-hidden (prevents side-scrolling on mobile)
    <div className={`flex flex-col min-h-screen w-full font-sans transition-colors duration-300 ease-in-out overflow-x-hidden selection:bg-emerald-100 dark:selection:bg-emerald-900/50 ${
      isCrisisMode ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-stone-50 dark:bg-zinc-950'
    }`}>
      
      {!isCrisisMode && !isAuthView && (
        <Navigation 
          activeView={activeNavView} 
          setView={setView} 
          session={session}
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      )}

      {/* Main content wrapper: 
        - Mobile: p-4 (base)
        - Tablet: md:p-8
        - Laptop: lg:p-12
        - Max-width: 7xl (centered with mx-auto)
      */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="animate-pulse text-stone-400 dark:text-zinc-500 font-serif text-lg md:text-xl italic">
            Illuminating Sanctuary...
          </div>
        </div>
      }>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6">

          <Routes>
            <Route path="/" element={<Home setView={setView} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/crisis" element={<Crisis setView={setView} />} />
            
            <Route path="/modules" element={<Modules />} />
            <Route path="/modules/cbt" element={<CBTModule />} />
            <Route path="/modules/dbt" element={<DBTModule />} />
            <Route path="/modules/act" element={<ACTModule />} />

            <Route path="/journal" element={session ? <Journal /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={session ? <Chatbot setView={setView} /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </Suspense>

      {!isCrisisMode && !isAuthView && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;