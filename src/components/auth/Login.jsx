import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

/**
 * Login Component
 * Purpose: Authenticates users via standard credentials or Google OAuth.
 * Implementation: Combined state management and unified error feedback.
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. HANDLER: Email/Password Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLER: Google OAuth Authentication
  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // redirectTo ensures the user returns to your dashboard after consenting
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google Login Error:", err.message);
      setError("Unable to connect with Google. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* STANDARD LOGIN FORM */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-600">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400 group-focus-within:text-green-600 transition-colors" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-green-100 focus:border-green-200 outline-none transition-all placeholder:text-stone-300"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-stone-600">Password</label>
            <button type="button" className="text-xs text-green-800 hover:underline">Forgot password?</button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-400 group-focus-within:text-green-600 transition-colors" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-green-100 focus:border-green-200 outline-none transition-all placeholder:text-stone-300"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Unified Error Message Display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Email Submit Button */}
        <Button variant="primary" className="w-full py-3" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? 'Entering Sanctuary...' : 'Sign In'}
        </Button>
      </form>

      {/* VISUAL DIVIDER */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-100"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-stone-400 font-bold tracking-widest">
            Or continue with
          </span>
        </div>
      </div>

      {/* GOOGLE OAUTH BUTTON */}
      <button 
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-stone-200 bg-white text-stone-700 font-medium hover:bg-stone-50 transition-all shadow-sm active:scale-[0.98] group"
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          className="w-5 h-5 group-hover:opacity-80" 
          alt="Google" 
        />
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;