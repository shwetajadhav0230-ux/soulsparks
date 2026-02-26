import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Leaf, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// 1. IMPORT THE WELLNESS GALLERY COMPONENT
import WellnessGallery from '../components/modules/WellnessGallery';

const Modules = () => {
  const [activeTab, setActiveTab] = useState('clinical');

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 min-h-screen">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-stone-900 mb-6">Therapeutic Pathways</h1>
        
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
          <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col h-full">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-3">Cognitive Behavioral Therapy</h3>
            <p className="text-stone-600 mb-6 flex-grow">Identify and challenge negative thought spirals to reframe your mindset.</p>
            <ul className="text-sm text-stone-400 space-y-2 mb-8">
              <li>• Thought Record</li>
              <li>• Cognitive Restructuring</li>
              <li>• Behavioral Activation</li>
            </ul>
            <Link to="/modules/cbt" className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              Enter Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* DBT Card */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col h-full">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-3">Dialectical Behavior Therapy</h3>
            <p className="text-stone-600 mb-6 flex-grow">Build resilience, manage intense emotions, and improve relationships.</p>
            <ul className="text-sm text-stone-400 space-y-2 mb-8">
              <li>• TIPP Skills</li>
              <li>• Radical Acceptance</li>
              <li>• Mindfulness Square</li>
            </ul>
            <Link to="/modules/dbt" className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              Enter Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* ACT Card */}
          <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col h-full">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-6">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-3">Acceptance & Commitment</h3>
            <p className="text-stone-600 mb-6 flex-grow">Accept what is out of your personal control and commit to action.</p>
            <ul className="text-sm text-stone-400 space-y-2 mb-8">
              <li>• Values Clarification</li>
              <li>• Cognitive Defusion</li>
              <li>• The Observing Self</li>
            </ul>
            <Link to="/modules/act" className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              Enter Workshop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

        </div>
      )}

      {/* 2. RENDER THE ACTUAL COMPONENT HERE */}
      {activeTab === 'wellness' && (
        <div className="mt-8">
          <WellnessGallery />
        </div>
      )}

    </div>
  );
};

export default Modules;