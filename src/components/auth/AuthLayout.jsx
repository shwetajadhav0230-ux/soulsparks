import React from 'react';
import { Sun, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-50 relative overflow-hidden transition-colors duration-500">
      
      {/* --- FLOATING BACK BUTTON --- */}
      <div className="absolute top-8 left-8 z-50">
        <Link 
          to="/" 
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-400 hover:text-emerald-700 hover:border-emerald-200 hover:shadow-md transition-all group active:scale-95"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-white">
            <Sun className="text-stone-700 w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-2 tracking-tight transition-colors">{title}</h1>
          <p className="text-stone-500 leading-relaxed px-4">{subtitle}</p>
        </div>
        
        {/* Auth Content Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl relative z-10">
          {children}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-stone-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest font-black">Secure Sanctuary Verified</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;