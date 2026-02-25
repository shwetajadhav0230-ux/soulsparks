import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ACTModule = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
      <Link to="/modules" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Pathways
      </Link>
      <h1 className="text-4xl font-serif text-stone-900 mb-4">Acceptance & Commitment Therapy</h1>
      <p className="text-lg text-stone-600">The ACT Workshop is currently under construction. Check back soon!</p>
    </div>
  );
};

export default ACTModule;