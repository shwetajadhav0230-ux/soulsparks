import React, { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import Login from '../components/auth/Login';
import SignUp from '../components/auth/SignUp';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthLayout 
      title={isLogin ? "Welcome Back" : "Begin Your Journey"}
      subtitle={isLogin ? "Your sanctuary is ready." : "Join a space designed for inner peace."}
    >
      {/* Conditionally render the forms */}
      {isLogin ? <Login /> : <SignUp />}
      
      <div className="mt-6 text-center text-sm text-stone-400">
        {isLogin ? "New to SoulSpark?" : "Already have an account?"}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="ml-2 text-green-800 font-bold hover:underline"
        >
          {isLogin ? 'Create Account' : 'Sign In'}
        </button>
      </div>
    </AuthLayout>
  );
};

export default Auth;