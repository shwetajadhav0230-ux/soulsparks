import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

// Layout & UI Components
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import LockedModule from './components/common/LockedModule';

// Main Pages (Lazy Loaded)
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Journal = lazy(() => import('./pages/Journal'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Modules = lazy(() => import('./pages/Modules'));
const Crisis = lazy(() => import('./pages/Crisis'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const Chatbot = lazy(() => import('./components/features/Chatbot'));
const LearnMore = lazy(() => import('./pages/LearnMore')); 
const Pricing = lazy(() => import('./pages/Pricing'));

// Module Components
const CBTModule = lazy(() => import('./components/modules/CBT'));
const DBTModule = lazy(() => import('./components/modules/DBT'));
const ACTModule = lazy(() => import('./components/modules/ACT'));

const AppContent = () => {
  const [session, setSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  // CENTRALIZED AUTH BOOTSTRAP
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // REDIRECT LOGIC
  useEffect(() => {
    if (session && location.pathname === '/auth') {
      navigate('/dashboard');
    }
  }, [session, location.pathname, navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-stone-400 font-serif italic animate-pulse">Illuminating Sanctuary...</p>
      </div>
    );
  }

  const isCrisisMode = location.pathname === '/crisis';
  const isAuthView = location.pathname === '/auth';

  const setView = (view) => {
    if (view === 'home') navigate('/');
    else navigate(`/${view}`);
  };

  const currentPath = location.pathname.substring(1) || 'home';
  const activeNavView = currentPath.startsWith('modules') ? 'modules' : currentPath;

  return (
    <div className={`flex flex-col min-h-screen w-full transition-colors duration-500 selection:bg-emerald-100 dark:selection:bg-emerald-900/50 ${
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

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
        </div>
      }>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home session={session} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/crisis" element={<Crisis setView={setView} />} />
            <Route path="/learn/:topic" element={<LearnMore />} />
            <Route path="/pricing" element={<Pricing session={session} />} />
            
            {/* PROTECTED USER ROUTES */}
            <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/auth" />} />
            <Route path="/journal" element={session ? <Journal session={session} /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={session ? <Chatbot session={session} setView={setView} /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/auth" />} />

            {/* CLINICAL MODULES - FIXED: PASSING setView PROP HERE */}
            <Route path="/modules" element={<Modules session={session} setView={setView} />} />
            <Route path="/modules/cbt" element={<CBTModule session={session} />} />

            {/* PREMIUM PROTECTED MODULES */}
            <Route 
              path="/modules/dbt" 
              element={
                session ? (
                  <LockedModule session={session} moduleName="DBT Skills Masterclass">
                    <DBTModule session={session} />
                  </LockedModule>
                ) : <Navigate to="/auth" />
              } 
            />

            <Route 
              path="/modules/act" 
              element={
                session ? (
                  <LockedModule session={session} moduleName="ACT Therapy Suite">
                    <ACTModule session={session} />
                  </LockedModule>
                ) : <Navigate to="/auth" />
              } 
            />

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