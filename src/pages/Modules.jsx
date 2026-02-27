import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Leaf, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

// 1. IMPORT THE WELLNESS GALLERY COMPONENT
import WellnessGallery from '../components/modules/WellnessGallery';

/**
 * Modules Component
 * Now strictly protected: Redirects unauthorized users to the Auth page.
 */
const Modules = ({ session, setView }) => {
  const [activeTab, setActiveTab] = useState('clinical');

  // --- PROTECTED ROUTE LOGIC ---
  useEffect(() => {
    // If no active session is found, force the view to 'auth'
    if (!session) {
      setView('auth');
    }
  }, [session, setView]);

  // Prevent content rendering while redirecting
  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 min-h-screen animate-fade-in">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
            Authorized Access Only
          </span>
        </div>
        <h1 className="text-4xl font-serif text-stone-900 mb-6 tracking-tight">Therapeutic Pathways</h1>
        
        {/* Toggle */}
        <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-stone-100">
          <button 
            onClick={() => setActiveTab('clinical')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${activeTab === 'clinical' ? 'bg-stone-50 text-emerald-800' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Clinical Modules
          </button>
          <button 
            onClick={() => setActiveTab('wellness')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${activeTab === 'wellness' ? 'bg-stone-50 text-emerald-800' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Wellness Gallery
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* CBT Card */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-3 font-semibold">Cognitive Behavioral Therapy</h3>
            <p className="text-stone-600 mb-6 flex-grow leading-relaxed">Identify and challenge negative thought spirals to reframe your mindset.</p>
            <ul className="text-sm text-stone-400 space-y-2 mb-8">
              <li className="flex items-center gap-2">• Thought Record</li>
              <li className="flex items-center gap-2">• Cognitive Restructuring</li>
              <li className="flex items-center gap-2">• Behavioral Activation</li>
            </ul>
            <Link to="/modules/cbt" className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              Enter Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* DBT Card */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-3 font-semibold">Dialectical Behavior Therapy</h3>
            <p className="text-stone-600 mb-6 flex-grow leading-relaxed">Build resilience, manage intense emotions, and improve relationships.</p>
            <ul className="text-sm text-stone-400 space-y-2 mb-8">
              <li className="flex items-center gap-2">• TIPP Skills</li>
              <li className="flex items-center gap-2">• Radical Acceptance</li>
              <li className="flex items-center gap-2">• Mindfulness Square</li>
            </ul>
            <Link to="/modules/dbt" className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              Enter Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* ACT Card */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-6">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-3 font-semibold">Acceptance & Commitment</h3>
            <p className="text-stone-600 mb-6 flex-grow leading-relaxed">Accept what is out of your personal control and commit to action.</p>
            <ul className="text-sm text-stone-400 space-y-2 mb-8">
              <li className="flex items-center gap-2">• Values Clarification</li>
              <li className="flex items-center gap-2">• Cognitive Defusion</li>
              <li className="flex items-center gap-2">• The Observing Self</li>
            </ul>
            <Link to="/modules/act" className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              Enter Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

        </div>
      )}

      {/* Wellness Gallery */}
      {activeTab === 'wellness' && (
        <div className="mt-8">
          <WellnessGallery />
        </div>
      )}

    </div>
  );
};

export default Modules;