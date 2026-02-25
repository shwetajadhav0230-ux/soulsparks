import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Layout & UI (Eager-loaded)
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';

// Main Pages (Lazy-loaded)
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Journal = lazy(() => import('./pages/Journal'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Modules = lazy(() => import('./pages/Modules'));
const Crisis = lazy(() => import('./pages/Crisis'));
const About = lazy(() => import('./pages/About'));
const Chatbot = lazy(() => import('./components/features/Chatbot'));

// --- UNCOMMENTED: These are now active! ---
const CBTModule = lazy(() => import('./components/modules/CBT'));
const DBTModule = lazy(() => import('./components/modules/DBT'));
const ACTModule = lazy(() => import('./components/modules/ACT'));

/**
 * AppContent Wrapper
 * Needs to be inside <Router> so we can use hooks like useLocation and useNavigate
 */
const AppContent = () => {
  const [session, setSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Initial Session Check
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsAuthLoading(false);
    };

    initializeAuth();

    // 2. Auth State Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Seamless transition away from Auth once logged in
      if (session && location.pathname === '/auth') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  if (isAuthLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin" />
    </div>
  );

  // Determine current context for styling & layout hiding
  const isCrisisMode = location.pathname === '/crisis';
  const isAuthView = location.pathname === '/auth';

  // Backward Compatibility: Converts old `setView('home')` calls to `Maps('/')`
  const setView = (view) => {
    if (view === 'home') navigate('/');
    else navigate(`/${view}`);
  };

  // Determine active view for Navigation highlighting 
  const currentPath = location.pathname.substring(1) || 'home';
  const activeNavView = currentPath.startsWith('modules') ? 'modules' : currentPath;

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 ease-in-out selection:bg-green-100 ${
      isCrisisMode ? 'bg-orange-50' : 'bg-stone-50'
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

      {/* Suspense handles the fallback UI while Lazy components load */}
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-stone-400 font-serif text-xl italic">Illuminating Sanctuary...</div>
        </div>
      }>
        <main className={`transition-opacity duration-300 ${isCrisisMode ? 'pt-0' : 'pt-4'}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home setView={setView} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/crisis" element={<Crisis setView={setView} />} />
            
            {/* Module Routes */}
            <Route path="/modules" element={<Modules />} />
            
            {/* --- UNCOMMENTED: The routes are now active! --- */}
            <Route path="/modules/cbt" element={<CBTModule />} />
            <Route path="/modules/dbt" element={<DBTModule />} />
            <Route path="/modules/act" element={<ACTModule />} />

            {/* Secure Routes (Guarded by session) */}
            <Route path="/journal" element={session ? <Journal /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={session ? <Chatbot setView={setView} /> : <Navigate to="/auth" />} />

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </Suspense>

      {!isCrisisMode && !isAuthView && <Footer />}
    </div>
  );
};

/**
 * Root App Component
 * Wraps everything in the Router provider
 */
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;