import React, { useState } from 'react';
// DAL: Utilizing the pre-configured Supabase client
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

/**
 * Login Component
 * Purpose: Authenticates returning users via Supabase.
 * Implementation: Managed state for inputs, loading status, and error feedback.
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Business Logic: Handles the sign-in process
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Supabase Auth Call: Sign in with credentials
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;
      
      // 2. Success: The onAuthStateChange listener in App.jsx will detect 
      // the new session and update the global UI state automatically.
    } catch (err) {
      // 3. Error Handling: Capture and display API or network errors
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
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

        {/* Error Message Display: Only shown when an error exists */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Submit Button with Dynamic State Feedback */}
        <Button variant="primary" className="w-full py-3" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? 'Entering Sanctuary...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
};

export default Login;