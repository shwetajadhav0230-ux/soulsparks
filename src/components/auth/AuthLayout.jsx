import React from 'react';
import { Sun, ShieldCheck } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-50 relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sun className="text-stone-700 w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl text-stone-900 mb-2">{title}</h1>
          <p className="text-stone-500 leading-relaxed">{subtitle}</p>
        </div>
        
        {/* This is where Login or SignUp will be injected */}
        <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl">
          {children}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-stone-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest font-bold">Secure Sanctuary</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;