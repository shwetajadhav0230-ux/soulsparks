import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, ArrowRight, Activity, Brain, Heart, Sparkles, Shield, Compass } from 'lucide-react';
import Button from '../components/common/Button';

// Refined Spring Animations for a high-end feel
const fadeInUp = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const buttonInteraction = {
  hover: { 
    scale: 1.05, 
    y: -3,
    transition: { type: "spring", stiffness: 400, damping: 12 } 
  },
  tap: { scale: 0.97 }
};

const Home = ({ setView }) => (
  <div className="bg-stone-50 selection:bg-green-100">
    
    {/* --- HERO SECTION --- */}
    <section className="relative overflow-hidden pt-24 pb-36">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80" 
          alt="Morning light sanctuary"
          className="w-full h-full object-cover opacity-30" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/30 via-transparent to-stone-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-stone-200 shadow-sm mb-10">
          <Leaf className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-stone-600 tracking-wide">A sanctuary for your mind</span>
        </motion.div>
        
        <motion.h1 {...fadeInUp} transition={{ delay: 0.2 }} className="font-serif text-6xl md:text-8xl text-stone-900 mb-8 leading-[1.1] max-w-5xl">
          Illuminate Your Path to <span className="italic text-green-800">Inner Peace</span>
        </motion.h1>
        
        <motion.p {...fadeInUp} transition={{ delay: 0.3 }} className="text-xl md:text-2xl text-stone-600 mb-12 max-w-3xl leading-relaxed">
          SoulSpark combines evidence-based therapies like CBT and DBT with compassionate AI support to help you grow, heal, and find balance.
        </motion.p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <motion.div variants={buttonInteraction} whileHover="hover" whileTap="tap">
            <Button variant="sage" onClick={() => setView('chat')} className="group px-10 py-5 text-xl shadow-lg">
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
          
          <motion.div variants={buttonInteraction} whileHover="hover" whileTap="tap">
            <Button variant="secondary" onClick={() => setView('modules')} className="px-10 py-5 text-xl bg-white/80 backdrop-blur-sm shadow-sm">
              Explore Our Approach
            </Button>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 1 }} className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[{ label: 'Daily Check-ins', value: '10k+', icon: Activity }, { label: 'Therapeutic Tools', value: '50+', icon: Brain }, { label: 'User Rating', value: '4.9/5', icon: Heart }].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center p-8 bg-white/70 backdrop-blur-xl rounded-[2rem] border border-stone-100 hover:bg-white/95 transition-all shadow-sm hover:shadow-xl">
              <stat.icon className="w-7 h-7 text-stone-400 mb-3" />
              <span className="text-4xl font-serif text-stone-800 mb-1">{stat.value}</span>
              <span className="text-xs text-stone-500 uppercase tracking-[0.2em] font-bold">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* --- WELLNESS SECTION: FIXED TAGS HERE --- */}
    <section className="relative bg-white py-28 border-y border-stone-100 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80" 
          alt="Sunlight forest"
          className="w-full h-full object-cover opacity-[0.12]" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2 {...fadeInUp} className="font-serif text-5xl text-stone-900 mb-5 tracking-tight">
            Wellness Guided by Science
          </motion.h2>
          {/* FIXED: motion.p now has matching closing tag </motion.p> */}
          <motion.p {...fadeInUp} transition={{ delay: 0.1 }} className="text-stone-500 text-lg max-w-xl mx-auto italic">
            Refined techniques for a modern world.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { title: "CBT Modules", desc: "Structured exercises to help reframe thought patterns and behaviors.", icon: Sparkles, color: "bg-green-50 text-green-700" },
            { title: "Safe Haven", desc: "Encrypted journaling and AI support available 24/7 for total privacy.", icon: Shield, color: "bg-orange-50 text-orange-700" },
            { title: "DBT Skills", desc: "Master emotional regulation through guided mindfulness and distress tolerance.", icon: Compass, color: "bg-blue-50 text-blue-700" }
          ].map((item, idx) => (
            <motion.div 
              key={idx} 
              {...fadeInUp} 
              whileHover={{ y: -12, boxShadow: "0 30px 60px -12px rgba(0,0,0,0.08)" }} 
              className="p-10 rounded-[2.5rem] border border-stone-100 bg-white/95 backdrop-blur-lg text-left group transition-all"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all shadow-sm ${item.color}`}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-3xl text-stone-900 mb-4">{item.title}</h3>
              <p className="text-stone-600 text-lg leading-relaxed mb-8">{item.desc}</p>
              <button className="text-sm font-bold text-stone-400 group-hover:text-green-800 transition-colors flex items-center gap-2 tracking-widest">
                LEARN MORE <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* --- FINAL CTA --- */}
    <section className="relative py-40 overflow-hidden bg-stone-950">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80" 
          alt="Peaceful misty lake"
          className="w-full h-full object-cover opacity-50" 
        />
        <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center text-center">
        <motion.h2 {...fadeInUp} className="font-serif text-5xl md:text-7xl text-white mb-12 leading-[1.15]">
          Ready to reclaim your <br/><span className="italic text-green-200">peace of mind?</span>
        </motion.h2>
        
        <motion.div variants={buttonInteraction} whileHover="hover" whileTap="tap" {...fadeInUp}>
          <Button 
            variant="sage" 
            onClick={() => setView('auth')} 
            className="px-16 py-6 text-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] border border-green-400/20"
          >
            Join SoulSpark Today
          </Button>
        </motion.div>
      </div>
    </section>
  </div>
);

export default Home;