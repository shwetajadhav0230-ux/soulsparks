import React from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-sm border border-stone-100 ${className}`}>
    {children}
  </div>
);

export default Card;
