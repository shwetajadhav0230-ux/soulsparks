import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-sm flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-stone-800 text-stone-50 hover:bg-stone-700 hover:shadow-md",
    secondary: "bg-white text-stone-800 border border-stone-200 hover:border-stone-400",
    terracotta: "bg-orange-300 text-orange-950 hover:bg-orange-400",
    sage: "bg-green-800 text-green-50 hover:bg-green-700",
    crisis: "bg-orange-100 text-orange-800 border-2 border-orange-200 hover:bg-orange-200",
    text: "bg-transparent text-stone-600 hover:text-stone-900 shadow-none hover:translate-y-0"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}`}
    >
      {children}
    </button>
  );
};

export default Button;