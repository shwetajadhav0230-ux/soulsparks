import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import Button from '../common/Button'; 
import { UserPlus, Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Combined Logic: Passing state variables into the auth method
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // Instructs Supabase where to return the user after email confirmation
          emailRedirectTo: window.location.origin, 
        },
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-3xl border border-green-100 animate-in zoom-in duration-500">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="font-serif text-xl text-stone-900 mb-2">Check your email</h3>
        <p className="text-sm text-stone-600 leading-relaxed">
          We've sent a confirmation link to <strong>{email}</strong>. Please verify your account to begin your journey.
        </p>
        <Button variant="text" onClick={() => setSuccess(false)} className="mt-4 text-xs">
          Back to Sign Up
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone- stone-600">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400 group-focus-within:text-green-600 transition-colors" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-green-100 outline-none transition-all placeholder:text-stone-300"
              placeholder="name@example.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-600">Create Password</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-400 group-focus-within:text-green-600 transition-colors" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-green-100 outline-none transition-all placeholder:text-stone-300"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button variant="sage" className="w-full py-3" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Creating Account...' : 'Join SoulSpark'}
        </Button>
      </form>
    </div>
  );
};

export default SignUp;